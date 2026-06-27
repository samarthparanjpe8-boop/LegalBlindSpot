require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { connectDB } = require('./db/connection');
const Advocate = require('./models/Advocate');
const CaseAssessment = require('./models/CaseAssessment');
const CaseFile = require('./models/CaseFile');
const geminiService = require('./services/geminiService');
const { calculateTrustScore } = require('./services/trustScoreService');

const app = express();
const PORT = process.env.PORT || 5000;
const sessions = new Map();

const allowedOrigins = (process.env.FRONTEND_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)
      ) {
        callback(null, true);
        return;
      }
      callback(new Error('Not allowed by CORS'));
    },
  })
);
app.use(express.json({ limit: '1mb' }));

function createSession(city, budget) {
  const sessionId = String(Date.now());
  const session = {
    sessionId,
    city,
    budget,
    caseType: null,
    history: [],
    lastUserMessage: '',
    lastViabilityResult: null,
  };
  sessions.set(sessionId, session);
  return session;
}

function getSessionOrThrow(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) {
    const err = new Error('Session not found');
    err.statusCode = 404;
    throw err;
  }
  return session;
}

function sendData(res, data, status = 200) {
  res.status(status).json({ data });
}

function normalizeAdvocate(advocate) {
  const trustResult = calculateTrustScore(advocate);

  return {
    ...advocate,
    id: advocate._id?.toString(),
    court: advocate.courtPrimary,
    consultationFee: advocate.consultationFeeInr,
    rating: advocate.ratingAvg,
    reviewCount: advocate.totalReviews,
    barRegistration: advocate.barRegistrationNo,
    trustScore: trustResult.score,
    trustResult,
    trustBreakdown: {
      ...trustResult.breakdown,
      totalScore: trustResult.score,
    },
  };
}

function normalizeViability(result) {
  const score = Number(result.viabilityScore ?? result.score ?? 0);

  return {
    ...result,
    score,
    viabilityScore: score,
    verdict: score < 50 ? 'Case is not fit for fighting' : result.verdict,
    worthPursuing: score < 50 ? false : result.worthPursuing,
    estimatedCost:
      result.estimatedCost ||
      (result.estimatedCostMin != null || result.estimatedCostMax != null
        ? {
            min: result.estimatedCostMin,
            max: result.estimatedCostMax,
          }
        : null),
    timeline: result.timeline || result.estimatedTimeline,
    advice: result.advice || result.honestAdvice,
  };
}

async function findAdvocates({ city, caseType, maxBudget, limit = 20 }) {
  const filter = {};

  if (city) {
    filter.city = { $regex: new RegExp(`^${city}$`, 'i') };
  }
  if (caseType) {
    filter.practiceAreas = { $regex: caseType, $options: 'i' };
  }
  if (maxBudget) {
    filter.consultationFeeInr = { $lte: Number(maxBudget) };
  }

  const advocates = await Advocate.find(filter).sort({ ratingAvg: -1 }).limit(limit).lean();
  return advocates
    .map(normalizeAdvocate)
    .sort((a, b) => b.trustScore - a.trustScore);
}

function buildFallbackReply(message, detection, advocates) {
  const caseLine = detection.caseType
    ? `I detected this as a ${detection.caseType} matter.`
    : 'Tell me a little more about what happened, when it happened, and what proof you have.';
  const advocateLine = advocates.length
    ? `I found ${advocates.length} matching advocate${advocates.length === 1 ? '' : 's'} within your city and budget.`
    : 'Once the case type is clear, I can show matching advocates within your budget.';

  return `${caseLine} ${advocateLine} Your next step is to gather documents, write a short timeline, and avoid paying large fees until an advocate reviews the facts.\n\nNote: This is for informational purposes only and not formal legal advice.`;
}

async function getChatReply(message, session, advocates) {
  const context = advocates.length
    ? `SYSTEM CONTEXT (not visible to user):
City: ${session.city} | Budget: Rs.${session.budget} | Case: ${session.caseType}
Matching advocates:
${JSON.stringify(
  advocates.map((adv) => ({
    name: adv.name,
    city: adv.city,
    fee: adv.consultationFee,
    trustScore: adv.trustScore,
    badge: adv.trustResult.breakdown.badge,
    practiceAreas: adv.practiceAreas,
  })),
  null,
  2
)}`
    : '';

  try {
    const result = await geminiService.chatReply(message, session.history, context);
    session.history = result.history;
    return result.content;
  } catch (err) {
    console.error('Gemini API Error in getChatReply:', err.message || err);
    return null;
  }
}

async function upsertCaseFile(session, description) {
  if (!session.caseType) return null;

  const existing = await CaseFile.findOne({ sessionId: session.sessionId });
  if (existing) {
    existing.caseType = session.caseType;
    existing.city = session.city;
    existing.budgetInr = session.budget;
    existing.caseSummary = description || existing.caseSummary;
    return existing.save();
  }

  let checklist = [];
  try {
    checklist = await geminiService.getDocumentChecklist(session.caseType, description || '');
  } catch {
    checklist = [];
  }

  return CaseFile.create({
    sessionId: session.sessionId,
    caseType: session.caseType,
    city: session.city,
    budgetInr: session.budget,
    documentsRequired: checklist.map((item) => ({
      document: item.document,
      whyNeeded: item.whyNeeded,
      uploaded: false,
    })),
    documentsUploaded: [],
    caseSummary: description || '',
    adviceChecks: [],
  });
}

app.get('/api/health', (_req, res) => {
  sendData(res, { ok: true });
});

app.post('/api/session', (req, res) => {
  const { city, budget } = req.body;
  if (!city || !budget) {
    return res.status(400).json({ error: 'City and budget are required' });
  }

  const session = createSession(city, Number(budget));
  sendData(res, session, 201);
});

app.get('/api/session/:sessionId', (req, res) => {
  const session = getSessionOrThrow(req.params.sessionId);
  sendData(res, session);
});

app.patch('/api/session/:sessionId', (req, res) => {
  const session = getSessionOrThrow(req.params.sessionId);
  const { city, budget, caseType } = req.body;

  if (city !== undefined) session.city = city;
  if (budget !== undefined) session.budget = Number(budget);
  if (caseType !== undefined) session.caseType = caseType;

  sendData(res, session);
});

app.post('/api/detect-case', async (req, res) => {
  const detection = await geminiService.detectCaseAndBudget(req.body.message || '');
  sendData(res, detection);
});

app.post('/api/chat', async (req, res) => {
  const { message, sessionId } = req.body;
  if (!message || !sessionId) {
    return res.status(400).json({ error: 'Message and sessionId are required' });
  }

  const session = getSessionOrThrow(sessionId);
  session.lastUserMessage = message;

  const detection = await geminiService.detectCaseAndBudget(message);
  if (detection.cityMentioned) session.city = detection.cityMentioned;
  if (detection.budgetMentioned) session.budget = detection.budgetMentioned;
  if (detection.caseType) session.caseType = detection.caseType;

  let viability = null;
  if (session.caseType) {
    try {
      viability = normalizeViability(
        await geminiService.assessViability(message, session.caseType, [])
      );
      session.lastViabilityResult = viability;
    } catch {
      viability = null;
    }
  }

  const advocates = await findAdvocates({
    city: session.city,
    caseType: session.caseType,
    maxBudget: session.budget,
    limit: 5,
  });

  const aiReply = await getChatReply(message, session, advocates);
  const reply = aiReply || buildFallbackReply(message, detection, advocates);

  if (!aiReply) {
    session.history.push({ role: 'user', content: message });
    session.history.push({ role: 'assistant', content: reply });
  }

  if (session.caseType) {
    try {
      await upsertCaseFile(session, message);
      await CaseAssessment.create({
        userDescription: message,
        detectedCaseType: session.caseType,
        viabilityScore: viability?.viabilityScore || null,
        viabilityVerdict: viability?.verdict || null,
        documentChecklist: [],
        nextSteps: [],
        urgency: detection.urgency || 'medium',
        recommendedAdvocates: advocates.map((a) => a._id).filter(Boolean),
        budgetInr: session.budget,
      });
    } catch {
      // Persistence should not block chat.
    }
  }

  sendData(res, {
    reply,
    caseType: session.caseType,
    city: session.city,
    budget: session.budget,
    viability,
    advocates,
  });
});

app.post('/api/assess', async (req, res) => {
  const { description = '', caseType = '', documents = [] } = req.body;
  if (!caseType && !description) {
    return res.status(400).json({ error: 'Description or caseType is required' });
  }

  const result = await geminiService.assessViability(description, caseType || 'General Legal Dispute', documents);
  sendData(res, normalizeViability(result));
});

app.post('/api/check-advice', async (req, res) => {
  const { advice, caseType } = req.body;
  if (!advice) {
    return res.status(400).json({ error: 'Advice is required' });
  }

  const result = await geminiService.checkAdvice(advice, caseType || '');
  sendData(res, result);
});

app.post('/api/intake', async (req, res) => {
  const result = await geminiService.runIntake(req.body.answers || {});
  sendData(res, result);
});

app.get('/api/advocates', async (req, res) => {
  const advocates = await findAdvocates({
    city: req.query.city,
    caseType: req.query.caseType,
    maxBudget: req.query.maxBudget,
    limit: 50,
  });
  sendData(res, advocates);
});

app.get('/api/advocates/:id', async (req, res) => {
  const advocate = await Advocate.findById(req.params.id).lean();
  if (!advocate) {
    return res.status(404).json({ error: 'Advocate not found' });
  }
  sendData(res, normalizeAdvocate(advocate));
});

app.get('/api/leaderboard', async (_req, res) => {
  const advocates = await Advocate.find({}).lean();
  const scored = advocates
    .map(normalizeAdvocate)
    .sort((a, b) => b.trustScore - a.trustScore)
    .slice(0, 20);
  sendData(res, scored);
});

app.get('/api/case-file/:sessionId', async (req, res) => {
  const caseFile = await CaseFile.findOne({ sessionId: req.params.sessionId }).lean();
  if (!caseFile) {
    return res.status(404).json({ error: 'Case file not found' });
  }

  const recommendedAdvocates = await findAdvocates({
    city: caseFile.city,
    caseType: caseFile.caseType,
    maxBudget: caseFile.budgetInr,
    limit: 3,
  });

  sendData(res, {
    caseType: caseFile.caseType,
    city: caseFile.city,
    budget: caseFile.budgetInr,
    summary: caseFile.caseSummary,
    documents: (caseFile.documentsRequired || []).map((doc) => ({
      name: doc.document,
      desc: doc.whyNeeded,
      uploaded: doc.uploaded,
    })),
    adviceChecks: (caseFile.adviceChecks || []).map((check) => ({
      advice: check.adviceClaimed,
      verdict: check.verdict,
      explanation: check.explanation,
      date: check.checkedAt,
    })),
    recommendedAdvocates,
  });
});

app.use((err, _req, res, _next) => {
  const status = err.statusCode || 500;
  res.status(status).json({ error: err.message || 'Server error' });
});

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`LegalLink API running on http://localhost:${PORT}`);
  });
}

if (require.main === module) {
  start().catch((err) => {
    console.error('Failed to start LegalLink API:', err.message);
    process.exit(1);
  });
}

module.exports = app;
