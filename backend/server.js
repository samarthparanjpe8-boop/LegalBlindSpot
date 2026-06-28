require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');

const { connectDB } = require('./db/connection');
const Advocate = require('./models/Advocate');
const CaseAssessment = require('./models/CaseAssessment');
const CaseFile = require('./models/CaseFile');
const CaseRequest = require('./models/CaseRequest');
const CaseMessage = require('./models/CaseMessage');
const User = require('./models/User');
const LawyerNote = require('./models/LawyerNote');
const geminiService = require('./services/geminiService');
const chatFlow = require('./services/chatFlowService');
const { calculateTrustScore } = require('./services/trustScoreService');
const {
  getLawyerCapacity,
  enrichAdvocateWithCapacity,
  createAdvocateForLawyer,
  buildCaseTimeline,
  getLawyerDashboardStats,
} = require('./services/lawyerService');
const { encrypt, decrypt, encryptObject, decryptObject } = require('./utils/encryption');
const path = require('path');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
// Configure Multer for file uploads (stored in ./uploads)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', 'uploads');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const documentType = req.body.documentType || 'document';
    // Sanitize document type for filename (remove special characters, spaces)
    const sanitizedDocType = documentType.replace(/[^a-zA-Z0-9]/g, '_');
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${sanitizedDocType}_${unique}${ext}`);
  },
});
const upload = multer({ storage });

// Nodemailer configuration for sending verification and magic‑link emails
const smtpUser = (process.env.SMTP_USER || '').trim();
let smtpPass = (process.env.SMTP_PASS || '').trim();

// Gmail App Passwords are shown as 4 groups of 4 characters (e.g. 'gedh lhwf mxyk efvc')
// but the SMTP server requires them to be entered without spaces.
if (smtpUser.includes('gmail.com')) {
  smtpPass = smtpPass.replace(/\s+/g, '');
}

let transportConfig;
if (process.env.SMTP_HOST) {
  transportConfig = {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    auth: smtpUser ? {
      user: smtpUser,
      pass: smtpPass,
    } : undefined,
    secure: Number(process.env.SMTP_PORT) === 465,
  };
} else if (smtpUser && smtpUser.includes('gmail.com')) {
  transportConfig = {
    service: 'gmail',
    auth: {
      user: smtpUser,
      pass: smtpPass,
    }
  };
} else {
  transportConfig = {
    host: 'localhost',
    port: 1025,
  };
}

const transporter = nodemailer.createTransport(transportConfig);

async function sendVerificationEmail(email, token) {
  const verificationUrl = `${process.env.APP_URL || 'http://localhost:3000'}/magic-link?token=${token}`;
  const mailOptions = {
    from: process.env.SMTP_USER || 'no-reply@legalblindspot.com',
    to: email,
    subject: 'LegalLink – Verify your email',
    text: `Click the link to verify your email and complete signup: ${verificationUrl}`,
    html: `<p>Click <a href="${verificationUrl}">here</a> to verify your email and complete signup.</p>`,
  };
  await transporter.sendMail(mailOptions);
}

// Helper to send a magic‑link login email
async function sendMagicLinkEmail(email, token) {
  const magicUrl = `${process.env.APP_URL || 'http://localhost:3000'}/magic-link?token=${token}`;
  const mailOptions = {
    from: process.env.SMTP_USER || 'no-reply@legalblindspot.com',
    to: email,
    subject: 'LegalLink – Your magic login link',
    text: `Click the link to log in: ${magicUrl}`,
    html: `<p>Click <a href="${magicUrl}">here</a> to log in to LegalLink.</p>`,
  };
  await transporter.sendMail(mailOptions);
}

// Helper to send a password reset email
async function sendResetPasswordEmail(email, token) {
  const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${encodeURIComponent(token)}`;
  const mailOptions = {
    from: process.env.SMTP_USER || 'no-reply@legalblindspot.com',
    to: email,
    subject: 'LegalLink – Reset your password',
    text: `Click the link to reset your password: ${resetUrl}`,
    html: `<p>Click <a href="${resetUrl}">here</a> to reset your password.</p>`,
  };
  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error('Failed to send reset email:', err.message);
    console.log('Password reset link (dev fallback):', resetUrl);
    if (process.env.NODE_ENV === 'production') {
      throw err;
    }
  }
}


const app = express();
const PORT = process.env.PORT || 5000;
const sessions = new Map();

// Create HTTP server and Socket.io instance
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
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
  },
});

// Store connected users: userId -> socketId
const connectedUsers = new Map();

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
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) return res.sendStatus(403);
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    next();
  });
}

function requireRole(role) {
  return (req, res, next) => {
    if (req.user?.role !== role) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

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

function normalizeHistoryEntries(entries) {
  if (!Array.isArray(entries)) return [];
  return entries
    .filter((entry) => entry && (entry.role === 'user' || entry.role === 'assistant') && typeof entry.content === 'string')
    .map((entry) => ({ role: entry.role, content: entry.content }));
}

function pickLongestHistory(...candidates) {
  return candidates.reduce((best, current) => {
    const normalized = normalizeHistoryEntries(current);
    return normalized.length > best.length ? normalized : best;
  }, []);
}

async function hydrateSessionFromDb(session, clientHistory) {
  let dbHistory = [];
  try {
    const caseFile = await CaseFile.findOne({ sessionId: session.sessionId }).lean();
    if (caseFile) {
      // Decrypt chat history
      dbHistory = caseFile.chatHistory ? decrypt(caseFile.chatHistory) : [];
      if (typeof dbHistory === 'string') {
        try {
          dbHistory = JSON.parse(dbHistory);
        } catch {
          dbHistory = [];
        }
      }
      if (caseFile.city) session.city = decrypt(caseFile.city);
      if (caseFile.budgetInr != null) session.budget = caseFile.budgetInr;
      if (caseFile.caseType) session.caseType = decrypt(caseFile.caseType);
    }
  } catch (err) {
    console.error('Failed to hydrate session from CaseFile:', err.message);
  }

  session.history = pickLongestHistory(session.history, dbHistory, clientHistory);
  return session;
}

// Client signup endpoint
app.post('/api/auth/signup', async (req, res) => {
  const { name, email, password, role, city, gender, maxActiveClients } = req.body;
  if (!email || !password || !role) {
    return res.status(400).json({ error: 'Email, password, and role are required' });
  }

  try {
    const emailLower = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: emailLower });
    
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    if (existingUser) {
      if (existingUser.emailVerified) {
        return res.status(400).json({ message: 'User already exists and is verified. Please log in.' });
      }
      
      existingUser.name = encrypt(name);
      existingUser.passwordHash = passwordHash;
      existingUser.role = role;
      existingUser.city = encrypt(city);
      existingUser.gender = encrypt(gender);
      if (role === 'lawyer' && maxActiveClients) {
        existingUser.maxActiveClients = Number(maxActiveClients);
      }
      await existingUser.save();

      if (role === 'lawyer') {
        await createAdvocateForLawyer(existingUser);
      }

      const token = jwt.sign({ sub: existingUser._id.toString(), email: existingUser.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
      await sendVerificationEmail(existingUser.email, token);

      return res.status(200).json({ message: 'Verification email resent.' });
    }

    const userData = {
      name: encrypt(name),
      email: emailLower,
      passwordHash,
      role,
      city: encrypt(city),
      gender: encrypt(gender),
      emailVerified: false,
    };
    if (role === 'lawyer') {
      userData.maxActiveClients = maxActiveClients ? Number(maxActiveClients) : 15;
    }

    const user = await User.create(userData);

    if (role === 'lawyer') {
      await createAdvocateForLawyer(user);
    }

    const token = jwt.sign({ sub: user._id.toString(), email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    await sendVerificationEmail(user.email, token);

    res.status(201).json({ message: 'User registered. Verification email sent.' });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: err.message });
  }
});


// Magic-link check / verify token
app.post('/api/auth/verify', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Token is required' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.emailVerified) {
      user.emailVerified = true;
      await user.save();
    }

    const sessionJwt = jwt.sign(
      { sub: user._id.toString(), email: user.email, role: user.role, name: user.name, city: user.city, gender: user.gender },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ jwt: sessionJwt });
  } catch (err) {
    console.error('Verification error:', err);
    res.status(400).json({ error: 'Invalid or expired token' });
  }
});

// Magic-link request (Login via email)
app.post('/api/auth/magic-link', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const token = jwt.sign({ sub: user._id.toString(), email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    await sendMagicLinkEmail(user.email, token);

    res.json({ message: 'Magic link sent to email' });
  } catch (err) {
    console.error('Magic link error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Regular password login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Decrypt user data
    const decryptedName = decrypt(user.name);
    const decryptedCity = decrypt(user.city);
    const decryptedGender = decrypt(user.gender);

    // Wait, the client decided to enforce magic link verification, but if they are already verified we can issue JWT
    const token = jwt.sign(
      { sub: user._id.toString(), email: user.email, role: user.role, name: decryptedName, city: decryptedCity, gender: decryptedGender },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user: { id: user._id, email: user.email, role: user.role, name: decryptedName, city: decryptedCity, gender: decryptedGender } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Forgot Password endpoint
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.json({ message: 'If that email exists, we sent a password reset link.' });
    }

    const token = jwt.sign({ sub: user._id.toString(), email: user.email, purpose: 'reset' }, process.env.JWT_SECRET, { expiresIn: '15m' });
    await sendResetPasswordEmail(user.email, token);

    res.json({ message: 'If that email exists, we sent a password reset link.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Reset Password endpoint
app.post('/api/auth/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ error: 'Token and password are required' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.purpose && payload.purpose !== 'reset') {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }
    const user = await User.findById(payload.sub);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    user.passwordHash = await bcrypt.hash(password, 10);
    await user.save();

    res.json({ message: 'Password reset successful. You can now log in with your new password.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(400).json({ error: 'Invalid or expired reset token' });
  }
});


function sendData(res, data, status = 200) {
  res.status(status).json({ data });
}

const KNOWN_CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata', 'Nagpur',
];

function normalizeCityInput(city) {
  if (!city || typeof city !== 'string') return null;
  const trimmed = city.trim().replace(/\s+/g, ' ');
  if (!trimmed) return null;
  const match = KNOWN_CITIES.find((c) => c.toLowerCase() === trimmed.toLowerCase());
  return match || trimmed;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

async function findAdvocates({ city, caseType, maxBudget, limit = 20, includeUnavailable = false }) {
  const normalizedCity = normalizeCityInput(city);
  const filter = {};

  if (normalizedCity) {
    filter.city = { $regex: new RegExp(`^${escapeRegex(normalizedCity)}$`, 'i') };
  }
  if (caseType) {
    filter.practiceAreas = { $regex: caseType, $options: 'i' };
  }
  if (maxBudget) {
    filter.consultationFeeInr = { $lte: Number(maxBudget) };
  }

  const applySeedFallback = () => {
    const seedAdvocates = require('./data/seedAdvocates');
    let filtered = [...seedAdvocates];
    if (normalizedCity) {
      filtered = filtered.filter(
        (a) => normalizeCityInput(a.city)?.toLowerCase() === normalizedCity.toLowerCase()
      );
    }
    if (caseType) {
      filtered = filtered.filter((a) =>
        a.practiceAreas.some((pa) => pa.toLowerCase().includes(caseType.toLowerCase()))
      );
    }
    if (maxBudget) {
      filtered = filtered.filter((a) => a.consultationFeeInr <= Number(maxBudget));
    }
    return filtered
      .map(normalizeAdvocate)
      .map((adv) => ({ ...adv, canReceiveRequests: false, acceptingClients: false, availableSlots: 0 }))
      .sort((a, b) => b.trustScore - a.trustScore)
      .slice(0, limit);
  };

  try {
    const advocates = await Advocate.find(filter).sort({ ratingAvg: -1 }).limit(limit * 2).lean();
    if (!advocates.length) {
      return applySeedFallback();
    }

    const enrichedResults = await Promise.allSettled(
      advocates.map((adv) => enrichAdvocateWithCapacity(adv, normalizeAdvocate))
    );
    const enriched = enrichedResults
      .filter((result) => result.status === 'fulfilled')
      .map((result) => result.value);

    if (!enriched.length) {
      return applySeedFallback();
    }

    const sorted = enriched.sort((a, b) => b.trustScore - a.trustScore);
    const filtered = includeUnavailable
      ? sorted
      : sorted.filter((adv) => adv.canReceiveRequests !== false);
    if (!filtered.length) {
      return applySeedFallback();
    }
    return filtered.slice(0, limit);
  } catch (err) {
    console.error('Failed to fetch advocates from DB, using seed memory fallback:', err.message);
    return applySeedFallback();
  }
}

async function listCityAdvocatesForBrowse(city, limit = 50) {
  const normalizedCity = normalizeCityInput(city);
  if (!normalizedCity) return [];

  const seedResults = (() => {
    const seedAdvocates = require('./data/seedAdvocates');
    return seedAdvocates
      .filter((a) => normalizeCityInput(a.city)?.toLowerCase() === normalizedCity.toLowerCase())
      .map(normalizeAdvocate)
      .map((adv) => ({
        ...adv,
        canReceiveRequests: adv.canReceiveRequests ?? false,
        acceptingClients: adv.acceptingClients ?? false,
        availableSlots: adv.availableSlots ?? 0,
      }))
      .sort((a, b) => b.trustScore - a.trustScore);
  })();

  try {
    const dbAdvocates = await Advocate.find({
      city: { $regex: new RegExp(`^${escapeRegex(normalizedCity)}$`, 'i') },
    })
      .sort({ ratingAvg: -1 })
      .limit(limit)
      .lean();

    if (!dbAdvocates.length) {
      return seedResults.slice(0, limit);
    }

    const enrichedResults = await Promise.allSettled(
      dbAdvocates.map((adv) => enrichAdvocateWithCapacity(adv, normalizeAdvocate))
    );
    const fromDb = enrichedResults
      .filter((result) => result.status === 'fulfilled')
      .map((result) => result.value);

    if (!fromDb.length) {
      return seedResults.slice(0, limit);
    }

    const seen = new Set(fromDb.map((a) => a.barRegistration || a.barRegistrationNo || a.email));
    const merged = [
      ...fromDb,
      ...seedResults.filter((s) => !seen.has(s.barRegistration || s.barRegistrationNo || s.email)),
    ];
    return merged.slice(0, limit);
  } catch (err) {
    console.error('listCityAdvocatesForBrowse failed:', err.message);
    return seedResults.slice(0, limit);
  }
}

async function getChatReply(message, session, advocates, detection) {
  const phase = chatFlow.getIntakePhase(session, message);
  const contextParts = [
    `SYSTEM CONTEXT (not visible to user):`,
    `City: ${session.city} | Budget: Rs.${session.budget} | Case: ${session.caseType || detection.caseType || 'unknown'}`,
    `Intake phase: ${phase} (intro -> evidence -> solution)`,
    `User messages so far: ${chatFlow.countUserMessages(session.history)}`,
  ];

  if (advocates.length) {
    contextParts.push(
      `Matching advocates:\n${JSON.stringify(
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
    );
  }

  contextParts.push(
    'Follow the intake phase. In intro: ask what happened, when, and who is involved. In evidence: ask for documents and proof. In solution: cite IPC/BNS sections, penalties, jail time, next steps, and 2-3 follow-up questions.'
  );

  if ((session.history || []).length > 0) {
    contextParts.push(
      'IMPORTANT: This is a resumed consultation with prior messages in the conversation history. Continue from where the user left off. Do not restart intake or ask questions they already answered unless you need a quick clarification.'
    );
  }

  try {
    const result = await geminiService.chatReply(message, session.history, contextParts.join('\n'));
    session.history = result.history;
    return { content: result.content, rateLimited: false };
  } catch (err) {
    console.error('Gemini chatReply failed:', err.message || err);
    if (chatFlow.isRateLimitError(err)) {
      return { content: null, rateLimited: true };
    }
    return { content: null, rateLimited: false };
  }
}

function isIntakeComplete(session) {
  const userMsgs = (session.history || []).filter((h) => h.role === 'user');
  if (userMsgs.length < 3 || !session.caseType) return false;

  const allUserText = userMsgs.map((m) => m.content.toLowerCase()).join(' ');
  const hasConcept = userMsgs.some((m) => m.content.trim().length > 25);
  const evidenceKeywords = [
    'document', 'proof', 'receipt', 'screenshot', 'email', 'whatsapp',
    'contract', 'agreement', 'photo', 'record', 'certificate', 'evidence',
    'no proof', 'no document', "don't have", 'dont have', 'nothing', 'none',
    'bank statement', 'letter', 'notice', 'fir', 'complaint',
  ];
  const hasEvidence = evidenceKeywords.some((k) => allUserText.includes(k));
  const hasCaseSpecific = userMsgs.length >= 3;

  return hasConcept && hasEvidence && hasCaseSpecific;
}

async function upsertCaseFile(session, description, userId) {
  const existing = await CaseFile.findOne({ sessionId: session.sessionId });
  if (existing) {
    if (session.caseType) existing.caseType = session.caseType;
    existing.city = encrypt(session.city);
    existing.budgetInr = session.budget;
    existing.caseSummary = encrypt(description || existing.caseSummary);
    existing.chatHistory = encrypt(JSON.stringify(session.history));
    if (userId) existing.userId = userId;
    // Update chatName if we have more info now
    if (!existing.chatName && session.caseType && session.city) {
      existing.chatName = `${session.caseType} · ${session.city}`;
    }
    return existing.save();
  }

  let checklist = [];
  if (session.caseType) {
    try {
      checklist = await geminiService.getDocumentChecklist(session.caseType, description || '');
    } catch {
      checklist = [];
    }
  }

  const chatName = session.caseType && session.city
    ? `${session.caseType} · ${session.city}`
    : session.city
      ? `Consultation · ${session.city}`
      : `Consultation · ${new Date().toLocaleDateString('en-IN')}`;

  return CaseFile.create({
    sessionId: session.sessionId,
    userId: userId || null,
    chatName,
    caseType: encrypt(session.caseType || null),
    city: encrypt(session.city),
    budgetInr: session.budget,
    documentsRequired: checklist.map((item) => ({
      document: item.document,
      whyNeeded: item.whyNeeded,
      uploaded: false,
    })),
    documentsUploaded: [],
    caseSummary: encrypt(description || ''),
    adviceChecks: [],
    chatHistory: encrypt(JSON.stringify(session.history)),
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

app.get('/api/session/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  let session = sessions.get(sessionId);
  let caseFile = null;

  try {
    caseFile = await CaseFile.findOne({ sessionId }).lean();
  } catch (err) {
    console.error('Failed to restore session from CaseFile:', err.message);
  }

  if (!session && !caseFile) {
    return res.status(404).json({ error: 'Session not found' });
  }

  if (!session) {
    session = {
      sessionId,
      city: caseFile?.city || null,
      budget: caseFile?.budgetInr ?? null,
      caseType: caseFile?.caseType || null,
      history: [],
      lastUserMessage: '',
      lastViabilityResult: null,
    };
  }

  await hydrateSessionFromDb(session);
  sessions.set(sessionId, session);
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
  const { message, sessionId, userId, history: clientHistory } = req.body;
  if (!message || !sessionId) {
    return res.status(400).json({ error: 'Message and sessionId are required' });
  }

  let session;
  try {
    session = getSessionOrThrow(sessionId);
  } catch (err) {
    let city = 'Delhi';
    let budget = 5000;
    let caseType = null;
    let history = [];
    try {
      const caseFile = await CaseFile.findOne({ sessionId }).lean();
      if (caseFile) {
        city = decrypt(caseFile.city) || city;
        budget = caseFile.budgetInr || budget;
        caseType = decrypt(caseFile.caseType) || caseType;
        history = caseFile.chatHistory ? decrypt(caseFile.chatHistory) : [];
        if (typeof history === 'string') {
          try {
            history = JSON.parse(history);
          } catch {
            history = [];
          }
        }
      }
    } catch (dbErr) {
      console.error('Failed to query CaseFile during session restoration:', dbErr.message);
    }
    session = {
      sessionId,
      city,
      budget,
      caseType,
      history,
      lastUserMessage: '',
      lastViabilityResult: null,
    };
    sessions.set(sessionId, session);
  }

  await hydrateSessionFromDb(session, clientHistory);
  sessions.set(sessionId, session);
  session.lastUserMessage = message;

  const userMessageCount = chatFlow.countUserMessages(session.history);
  if (userMessageCount >= chatFlow.MAX_USER_MESSAGES) {
    const limitReply = chatFlow.buildLimitReachedReply(session);
    return sendData(res, {
      reply: limitReply,
      caseType: session.caseType,
      city: session.city,
      budget: session.budget,
      viability: session.lastViabilityResult,
      advocates: [],
      intakeComplete: isIntakeComplete(session),
      limitReached: true,
      messagesRemaining: 0,
      slowdownMs: chatFlow.CHAT_SLOWDOWN_MS,
    });
  }

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  await sleep(chatFlow.CHAT_SLOWDOWN_MS);

  let detection;
  if (session.caseType) {
    detection = geminiService.detectCaseAndBudgetLocally(message);
    detection.caseType = session.caseType;
  } else {
    detection = await geminiService.detectCaseAndBudget(message);
  }
  if (detection.cityMentioned) session.city = detection.cityMentioned;
  if (detection.budgetMentioned) session.budget = detection.budgetMentioned;
  if (detection.caseType) session.caseType = detection.caseType;

  await sleep(chatFlow.CHAT_SLOWDOWN_MS);

  let viability = null;
  if (session.caseType && userMessageCount >= 2) {
    try {
      viability = normalizeViability(
        await geminiService.assessViability(message, session.caseType, [])
      );
      session.lastViabilityResult = viability;
    } catch {
      viability = null;
    }
  }

  await sleep(chatFlow.CHAT_SLOWDOWN_MS);

  const intakeComplete = isIntakeComplete(session);

  const advocates = intakeComplete
    ? await findAdvocates({
        city: session.city,
        caseType: session.caseType,
        maxBudget: session.budget,
        limit: 5,
      })
    : [];

  const aiResult = await getChatReply(message, session, advocates, detection);
  let reply = aiResult.content;
  if (!reply) {
    reply = aiResult.rateLimited
      ? chatFlow.buildRateLimitReply()
      : chatFlow.buildStructuredReply(message, session, detection, advocates);
    session.history.push({ role: 'user', content: message });
    session.history.push({ role: 'assistant', content: reply });
  }

  const intakeCompleteAfter = isIntakeComplete(session);

  try {
    await upsertCaseFile(session, message, userId);
    if (session.caseType) {
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
    }
  } catch (err) {
    console.error('Failed to persist chat session:', err.message);
  }


  const messagesRemaining = Math.max(0, chatFlow.MAX_USER_MESSAGES - chatFlow.countUserMessages(session.history));

  sendData(res, {
    reply,
    caseType: session.caseType,
    city: session.city,
    budget: session.budget,
    viability,
    advocates: intakeCompleteAfter ? advocates : [],
    intakeComplete: intakeCompleteAfter,
    limitReached: messagesRemaining === 0,
    messagesRemaining,
    slowdownMs: chatFlow.CHAT_SLOWDOWN_MS,
  });
});

app.get('/api/chat/history/:sessionId', async (req, res) => {
  try {
    const caseFile = await CaseFile.findOne({ sessionId: req.params.sessionId }).lean();
    if (!caseFile) {
      return sendData(res, { sessionId: req.params.sessionId, messages: [], caseType: null, city: null, budget: null });
    }
    // Decrypt sensitive fields
    const messages = caseFile.chatHistory ? decrypt(caseFile.chatHistory) : [];
    let parsedMessages = messages;
    if (typeof messages === 'string') {
      try {
        parsedMessages = JSON.parse(messages);
      } catch {
        parsedMessages = [];
      }
    }

    sendData(res, {
      sessionId: caseFile.sessionId,
      userId: caseFile.userId,
      messages: parsedMessages,
      caseType: decrypt(caseFile.caseType),
      city: decrypt(caseFile.city),
      budget: caseFile.budgetInr,
      updatedAt: caseFile.createdAt,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/chat/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const caseFiles = await CaseFile.find({ userId })
      .sort({ createdAt: -1 })
      .select('sessionId chatName caseType city budgetInr caseSummary chatHistory createdAt')
      .lean();

    const sessions = caseFiles.map((cf) => {
      // Decrypt sensitive fields
      const chatHistory = cf.chatHistory ? decrypt(cf.chatHistory) : [];
      let parsedHistory = chatHistory;
      if (typeof chatHistory === 'string') {
        try {
          parsedHistory = JSON.parse(chatHistory);
        } catch {
          parsedHistory = [];
        }
      }
      
      return {
        sessionId: cf.sessionId,
        chatName: cf.chatName || (cf.caseType && cf.city ? `${decrypt(cf.caseType)} · ${decrypt(cf.city)}` : cf.sessionId),
        caseType: decrypt(cf.caseType),
        city: decrypt(cf.city),
        budget: cf.budgetInr,
        preview: decrypt(cf.caseSummary) || (parsedHistory?.[0]?.content || '').slice(0, 120),
        messageCount: parsedHistory.length,
        updatedAt: cf.createdAt,
      };
    });

    sendData(res, sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rename a chat session
app.patch('/api/chat/history/:sessionId/name', authenticateToken, async (req, res) => {
  try {
    const { chatName } = req.body;
    if (!chatName?.trim()) return res.status(400).json({ error: 'Chat name is required' });
    const caseFile = await CaseFile.findOneAndUpdate(
      { sessionId: req.params.sessionId, userId: req.user.id },
      { chatName: chatName.trim() },
      { new: true }
    );
    if (!caseFile) return res.status(404).json({ error: 'Session not found' });
    sendData(res, { sessionId: caseFile.sessionId, chatName: caseFile.chatName });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a chat session
app.delete('/api/chat/history/:sessionId', authenticateToken, async (req, res) => {
  try {
    console.log('DELETE request received for sessionId:', req.params.sessionId);
    console.log('User ID:', req.user.id);
    
    // First check if the session exists for this user
    const existingCase = await CaseFile.findOne({
      sessionId: req.params.sessionId,
      userId: req.user.id,
    });
    
    console.log('Existing case found:', existingCase);
    
    if (!existingCase) {
      console.log('Session not found for this user');
      return res.status(404).json({ error: 'Session not found or does not belong to you' });
    }
    
    // Delete the session
    const caseFile = await CaseFile.findOneAndDelete({
      sessionId: req.params.sessionId,
      userId: req.user.id,
    });
    
    console.log('Delete result:', caseFile);
    
    if (!caseFile) return res.status(404).json({ error: 'Session not found' });
    sendData(res, { sessionId: caseFile.sessionId, deleted: true });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: err.message });
  }
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

// Protect advocate listing – only authenticated users can view
app.get('/api/advocates', authenticateToken, async (req, res) => {
  try {
    const city = normalizeCityInput(req.query.city);
    if (!city) {
      return res.status(400).json({ error: 'City is required to list advocates' });
    }
    const advocates = await listCityAdvocatesForBrowse(city, 50);
    sendData(res, advocates);
  } catch (err) {
    console.error('GET /api/advocates failed:', err.message);
    const seedAdvocates = require('./data/seedAdvocates');
    const city = normalizeCityInput(req.query.city);
    const fallback = city
      ? seedAdvocates
          .filter((a) => normalizeCityInput(a.city)?.toLowerCase() === city.toLowerCase())
          .map(normalizeAdvocate)
          .slice(0, 50)
      : [];
    sendData(res, fallback);
  }
});

app.get('/api/advocates/:id', async (req, res) => {
  try {
    const advocate = await Advocate.findById(req.params.id).lean();
    if (!advocate) {
      const seedAdvocates = require('./data/seedAdvocates');
      const matched = seedAdvocates.find((a, idx) => {
        const id = a._id?.toString() || String(idx + 1);
        return id === req.params.id;
      });
      if (matched) {
        return sendData(res, { ...normalizeAdvocate(matched), canReceiveRequests: false, acceptingClients: false });
      }
      return res.status(404).json({ error: 'Advocate not found' });
    }
    const enriched = await enrichAdvocateWithCapacity(advocate, normalizeAdvocate);
    sendData(res, enriched);
  } catch (err) {
    const seedAdvocates = require('./data/seedAdvocates');
    const matched = seedAdvocates.find((a, idx) => {
      const id = a._id?.toString() || String(idx + 1);
      return id === req.params.id;
    });
    if (matched) {
      return sendData(res, { ...normalizeAdvocate(matched), canReceiveRequests: false, acceptingClients: false });
    }
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/leaderboard', async (_req, res) => {
  try {
    const advocates = await Advocate.find({}).lean();
    const scored = advocates
      .map(normalizeAdvocate)
      .sort((a, b) => b.trustScore - a.trustScore)
      .slice(0, 20);
    sendData(res, scored);
  } catch (err) {
    console.error('Leaderboard DB query failed, using seed memory fallback:', err.message);
    const seedAdvocates = require('./data/seedAdvocates');
    const scored = seedAdvocates
      .map(normalizeAdvocate)
      .sort((a, b) => b.trustScore - a.trustScore)
      .slice(0, 20);
    sendData(res, scored);
  }
});

app.get('/api/case-file/:sessionId', async (req, res) => {
  try {
    const caseFile = await CaseFile.findOne({ sessionId: req.params.sessionId }).lean();
    if (!caseFile) {
      return sendData(res, {
        caseType: 'General Legal Dispute',
        city: 'Mumbai',
        budget: 2000,
        summary: 'Session in progress (running in offline/no-db mode)...',
        documents: [],
        adviceChecks: [],
        recommendedAdvocates: [],
      });
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
  } catch (err) {
    sendData(res, {
      caseType: 'General Legal Dispute',
      city: 'Mumbai',
      budget: 2000,
      summary: 'Session in progress (running in offline/no-db mode)...',
      documents: [],
      adviceChecks: [],
      recommendedAdvocates: [],
    });
  }
});

// ---------- Case Request Routes ----------
app.post('/api/requests', authenticateToken, requireRole('client'), upload.array('attachments'), async (req, res) => {
  try {
    const clientId = req.user.id;
    const { lawyer, advocateId, caseType, city, description, budgetInr, sessionId } = req.body;
    if ((!lawyer && !advocateId) || !caseType || !city || !description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let lawyerId = lawyer;
    let linkedAdvocateId = advocateId || null;

    if (advocateId && !lawyerId) {
      const advocate = await Advocate.findById(advocateId).lean();
      if (!advocate?.userId) {
        return res.status(400).json({ error: 'This advocate is not available for consultation requests' });
      }
      lawyerId = advocate.userId.toString();
      linkedAdvocateId = advocateId;
    }

    const capacity = await getLawyerCapacity(lawyerId);
    if (!capacity.accepting) {
      return res.status(400).json({ error: 'This lawyer is not accepting new clients' });
    }

    // Check if client already has an active/pending request with this lawyer
    const existingRequest = await CaseRequest.findOne({
      client: clientId,
      lawyer: lawyerId,
      status: { $in: ['pending', 'accepted'] },
    });
    if (existingRequest) {
      return res.status(400).json({ 
        error: 'You already have an active consultation request with this lawyer. Please continue the conversation in the existing request.',
        existingRequestId: existingRequest._id,
      });
    }

    const client = await User.findById(clientId).lean();
    let aiSummary = description;
    if (sessionId) {
      const caseFile = await CaseFile.findOne({ sessionId }).lean();
      if (caseFile?.caseSummary) aiSummary = decrypt(caseFile.caseSummary);
    }

    const attachments = (req.files || []).map((f) => ({
      filename: f.originalname,
      storedName: f.filename,
      path: f.path,
    }));

    const request = await CaseRequest.create({
      client: clientId,
      lawyer: lawyerId,
      advocateId: linkedAdvocateId,
      sessionId: sessionId || null,
      caseType: encrypt(caseType),
      city: encrypt(city),
      description: encrypt(description),
      aiSummary: encrypt(aiSummary),
      clientGender: client?.gender,
      budgetInr: budgetInr ? Number(budgetInr) : undefined,
      caseStatus: 'Pending',
      timeline: [{
        event: 'Request sent',
        timestamp: new Date(),
        description: 'Client submitted consultation request',
      }],
      attachments,
    });

    const populated = await CaseRequest.findById(request._id)
      .populate('client', 'name gender city email')
      .populate('lawyer', 'name city email gender')
      .lean();
    sendData(res, populated, 201);
  } catch (err) {
    console.error('Create request error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/requests/client', authenticateToken, requireRole('client'), async (req, res) => {
  const clientId = req.user.id;
  const requests = await CaseRequest.find({ client: clientId })
    .populate('lawyer', 'name gender city email maxActiveClients acceptingClients')
    .sort({ createdAt: -1 })
    .lean();
  
  // Decrypt sensitive fields
  const decryptedRequests = requests.map(req => ({
    ...req,
    caseType: decrypt(req.caseType),
    city: decrypt(req.city),
    description: decrypt(req.description),
    aiSummary: decrypt(req.aiSummary),
  }));
  
  sendData(res, decryptedRequests);
});

app.get('/api/requests/lawyer', authenticateToken, requireRole('lawyer'), async (req, res) => {
  const lawyerId = req.user.id;
  const { status } = req.query;
  const filter = { lawyer: lawyerId };
  if (status === 'pending') filter.status = 'pending';
  if (status === 'active') {
    filter.status = 'accepted';
    filter.caseStatus = { $nin: ['Resolved', 'Closed'] };
  }
  const requests = await CaseRequest.find(filter)
    .populate('client', 'name gender city email createdAt')
    .sort({ createdAt: -1 })
    .lean();

  // Decrypt sensitive fields
  const decryptedRequests = requests.map(req => ({
    ...req,
    caseType: decrypt(req.caseType),
    city: decrypt(req.city),
    description: decrypt(req.description),
    aiSummary: decrypt(req.aiSummary),
  }));

  // For pending requests, embed the linked chat history so lawyers can read before deciding
  if (status === 'pending') {
    const enriched = await Promise.all(decryptedRequests.map(async (req) => {
      if (!req.sessionId) return { ...req, chatHistory: [], chatName: null };
      try {
        const caseFile = await CaseFile.findOne({ sessionId: req.sessionId })
          .select('chatHistory chatName caseType city')
          .lean();
        
        // Decrypt chat history
        const chatHistory = caseFile?.chatHistory ? decrypt(caseFile.chatHistory) : [];
        let parsedHistory = chatHistory;
        if (typeof chatHistory === 'string') {
          try {
            parsedHistory = JSON.parse(chatHistory);
          } catch {
            parsedHistory = [];
          }
        }
        
        return {
          ...req,
          chatHistory: parsedHistory,
          chatName: caseFile?.chatName || (caseFile?.caseType && caseFile?.city ? `${decrypt(caseFile.caseType)} · ${decrypt(caseFile.city)}` : null),
        };
      } catch {
        return { ...req, chatHistory: [], chatName: null };
      }
    }));
    return sendData(res, enriched);
  }

  sendData(res, decryptedRequests);
});

app.get('/api/requests/:id', authenticateToken, async (req, res) => {
  try {
    const request = await CaseRequest.findById(req.params.id)
      .populate('client', 'name gender city email createdAt')
      .populate('lawyer', 'name gender city email maxActiveClients casesCompleted')
      .lean();
    if (!request) return res.status(404).json({ error: 'Request not found' });

    const isClient = request.client?._id?.toString() === req.user.id;
    const isLawyer = request.lawyer?._id?.toString() === req.user.id;
    if (!isClient && !isLawyer) return res.status(403).json({ error: 'Forbidden' });

    // Decrypt sensitive fields
    const decryptedRequest = {
      ...request,
      caseType: decrypt(request.caseType),
      city: decrypt(request.city),
      description: decrypt(request.description),
      aiSummary: decrypt(request.aiSummary),
    };

    const timeline = await buildCaseTimeline(decryptedRequest, request.client);
    let caseFiles = [];
    if (request.client?._id) {
      caseFiles = await CaseFile.find({ userId: request.client._id.toString() })
        .sort({ createdAt: -1 })
        .lean();
    }

    sendData(res, { ...decryptedRequest, timeline, caseFiles });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/requests/:id/decision', authenticateToken, requireRole('lawyer'), async (req, res) => {
  try {
    const lawyerId = req.user.id;
    const { decision, reason } = req.body;
    if (!['accept', 'decline'].includes(decision)) {
      return res.status(400).json({ error: 'Invalid decision' });
    }

    const request = await CaseRequest.findOne({ _id: req.params.id, lawyer: lawyerId });
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request already processed' });
    }

    if (decision === 'accept') {
      const capacity = await getLawyerCapacity(lawyerId);
      if (!capacity.accepting) {
        return res.status(400).json({ error: 'You have reached maximum client capacity' });
      }
      request.status = 'accepted';
      request.caseStatus = 'Accepted';
      request.acceptedAt = new Date();
      request.startedDate = new Date();
      request.timeline.push({
        event: 'Lawyer accepted',
        timestamp: new Date(),
        description: 'Case accepted by lawyer',
      });
    } else {
      request.status = 'declined';
      request.caseStatus = 'Closed';
      request.declineReason = reason || '';
      request.timeline.push({
        event: 'Request declined',
        timestamp: new Date(),
        description: reason || 'Request declined by lawyer',
      });
    }

    await request.save();
    const populated = await CaseRequest.findById(request._id)
      .populate('client', 'name gender city email')
      .lean();
    
    // Decrypt sensitive fields
    const decryptedPopulated = {
      ...populated,
      caseType: decrypt(populated.caseType),
      city: decrypt(populated.city),
      description: decrypt(populated.description),
      aiSummary: decrypt(populated.aiSummary),
    };
    
    sendData(res, decryptedPopulated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/requests/:id/status', authenticateToken, requireRole('lawyer'), async (req, res) => {
  try {
    const { caseStatus } = req.body;
    const validStatuses = ['Pending', 'Accepted', 'In Progress', 'Waiting for Documents', 'Filed', 'Resolved', 'Closed'];
    if (!validStatuses.includes(caseStatus)) {
      return res.status(400).json({ error: 'Invalid case status' });
    }

    const request = await CaseRequest.findOne({ _id: req.params.id, lawyer: req.user.id, status: 'accepted' });
    if (!request) return res.status(404).json({ error: 'Active case not found' });

    request.caseStatus = caseStatus;
    request.timeline.push({
      event: 'Status updated',
      timestamp: new Date(),
      description: `Case status changed to ${caseStatus}`,
    });

    if (caseStatus === 'Resolved' || caseStatus === 'Closed') {
      request.completedAt = new Date();
    }

    await request.save();
    sendData(res, request);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/requests/:id/complete', authenticateToken, requireRole('lawyer'), async (req, res) => {
  try {
    const request = await CaseRequest.findOne({ _id: req.params.id, lawyer: req.user.id, status: 'accepted' });
    if (!request) return res.status(404).json({ error: 'Active case not found' });

    request.caseStatus = 'Resolved';
    request.completedAt = new Date();
    request.timeline.push({
      event: 'Case completed',
      timestamp: new Date(),
      description: 'Lawyer marked case as complete',
    });
    await request.save();
    await User.findByIdAndUpdate(req.user.id, { $inc: { casesCompleted: 1 } });

    sendData(res, request);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/requests/:id/chat-sessions', authenticateToken, requireRole('lawyer'), async (req, res) => {
  try {
    const request = await CaseRequest.findOne({ _id: req.params.id, lawyer: req.user.id, status: 'accepted' });
    if (!request) return res.status(404).json({ error: 'Case not found' });

    const clientId = request.client.toString();
    const sessions = await CaseFile.find({ userId: clientId })
      .sort({ createdAt: -1 })
      .select('sessionId caseType city budgetInr caseSummary chatHistory createdAt')
      .lean();

    sendData(res, sessions.map((s) => {
      // Decrypt sensitive fields
      const chatHistory = s.chatHistory ? decrypt(s.chatHistory) : [];
      let parsedHistory = chatHistory;
      if (typeof chatHistory === 'string') {
        try {
          parsedHistory = JSON.parse(chatHistory);
        } catch {
          parsedHistory = [];
        }
      }
      
      return {
        sessionId: s.sessionId,
        caseType: decrypt(s.caseType),
        city: decrypt(s.city),
        budget: s.budgetInr,
        summary: decrypt(s.caseSummary),
        messageCount: parsedHistory.length,
        messages: parsedHistory,
        createdAt: s.createdAt,
        isPrimary: s.sessionId === request.sessionId,
      };
    }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/requests/:id/notes', authenticateToken, requireRole('lawyer'), async (req, res) => {
  const request = await CaseRequest.findOne({ _id: req.params.id, lawyer: req.user.id });
  if (!request) return res.status(404).json({ error: 'Case not found' });
  const notes = await LawyerNote.find({ caseRequest: req.params.id, lawyer: req.user.id })
    .sort({ updatedAt: -1 })
    .lean();
  sendData(res, notes);
});

app.post('/api/requests/:id/notes', authenticateToken, requireRole('lawyer'), async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'Note content is required' });
  const request = await CaseRequest.findOne({ _id: req.params.id, lawyer: req.user.id, status: 'accepted' });
  if (!request) return res.status(404).json({ error: 'Case not found' });
  const note = await LawyerNote.create({
    lawyer: req.user.id,
    caseRequest: req.params.id,
    content: content.trim(),
  });
  sendData(res, note, 201);
});

// Get messages for a case request
app.get('/api/requests/:id/messages', authenticateToken, async (req, res) => {
  try {
    const request = await CaseRequest.findById(req.params.id)
      .populate('client', '_id')
      .populate('lawyer', '_id');
    
    if (!request) return res.status(404).json({ error: 'Request not found' });

    const isClient = request.client._id.toString() === req.user.id;
    const isLawyer = request.lawyer._id.toString() === req.user.id;
    if (!isClient && !isLawyer) return res.status(403).json({ error: 'Forbidden' });

    const messages = await CaseMessage.find({ caseRequest: req.params.id })
      .sort({ createdAt: 1 })
      .lean();

    // Decrypt message content
    const decryptedMessages = messages.map(msg => ({
      ...msg,
      content: decrypt(msg.content),
    }));

    sendData(res, decryptedMessages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send a message (REST API fallback)
app.post('/api/requests/:id/messages', authenticateToken, async (req, res) => {
  try {
    const request = await CaseRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.status !== 'accepted') return res.status(400).json({ error: 'Case not active' });

    const isClient = request.client.toString() === req.user.id;
    const isLawyer = request.lawyer.toString() === req.user.id;
    if (!isClient && !isLawyer) return res.status(403).json({ error: 'Forbidden' });

    const { content, attachments = [] } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Message content is required' });

    const senderRole = isClient ? 'client' : 'lawyer';

    const message = await CaseMessage.create({
      caseRequest: req.params.id,
      sender: req.user.id,
      senderRole,
      content: encrypt(content),
      attachments,
    });

    // Emit via Socket.io if users are connected
    const decryptedMessage = {
      _id: message._id,
      sender: message.sender,
      senderRole: message.senderRole,
      content: content,
      attachments: message.attachments,
      read: message.read,
      createdAt: message.createdAt,
    };

    io.to(`case_${req.params.id}`).emit('new_message', decryptedMessage);

    sendData(res, decryptedMessage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark messages as read
app.post('/api/requests/:id/messages/read', authenticateToken, async (req, res) => {
  try {
    const request = await CaseRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: 'Request not found' });

    const isClient = request.client.toString() === req.user.id;
    const isLawyer = request.lawyer.toString() === req.user.id;
    if (!isClient && !isLawyer) return res.status(403).json({ error: 'Forbidden' });

    await CaseMessage.updateMany(
      {
        caseRequest: req.params.id,
        sender: { $ne: req.user.id },
        read: false,
      },
      {
        read: true,
        readAt: new Date(),
      }
    );

    sendData(res, { success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/requests/:id/notes/:noteId', authenticateToken, requireRole('lawyer'), async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'Note content is required' });
  const note = await LawyerNote.findOneAndUpdate(
    { _id: req.params.noteId, caseRequest: req.params.id, lawyer: req.user.id },
    { content: content.trim() },
    { new: true }
  );
  if (!note) return res.status(404).json({ error: 'Note not found' });
  sendData(res, note);
});

app.delete('/api/requests/:id/notes/:noteId', authenticateToken, requireRole('lawyer'), async (req, res) => {
  const note = await LawyerNote.findOneAndDelete({
    _id: req.params.noteId,
    caseRequest: req.params.id,
    lawyer: req.user.id,
  });
  if (!note) return res.status(404).json({ error: 'Note not found' });
  sendData(res, { ok: true });
});

// Delete a case request (client can delete their own requests)
app.delete('/api/requests/:id', authenticateToken, async (req, res) => {
  try {
    const request = await CaseRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: 'Request not found' });

    const isClient = request.client.toString() === req.user.id;
    const isLawyer = request.lawyer.toString() === req.user.id;
    
    if (!isClient && !isLawyer) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Delete associated messages
    await CaseMessage.deleteMany({ caseRequest: req.params.id });
    
    // Delete associated notes
    await LawyerNote.deleteMany({ caseRequest: req.params.id });

    // Delete the request
    await CaseRequest.findByIdAndDelete(req.params.id);

    sendData(res, { message: 'Case request deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- Lawyer Dashboard Routes ----------
app.get('/api/lawyer/dashboard', authenticateToken, requireRole('lawyer'), async (req, res) => {
  try {
    const stats = await getLawyerDashboardStats(req.user.id);
    sendData(res, stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/lawyer/capacity', authenticateToken, requireRole('lawyer'), async (req, res) => {
  try {
    const lawyer = await User.findById(req.user.id).select('maxActiveClients acceptingClients casesCompleted').lean();
    const capacity = await getLawyerCapacity(req.user.id);
    sendData(res, {
      maxActiveClients: lawyer?.maxActiveClients ?? 15,
      currentClients: capacity.current,
      availableSlots: capacity.available,
      acceptingClients: lawyer?.acceptingClients !== false,
      casesCompleted: lawyer?.casesCompleted ?? 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/lawyer/capacity', authenticateToken, requireRole('lawyer'), async (req, res) => {
  try {
    const { maxActiveClients, acceptingClients } = req.body;
    const updates = {};
    if (maxActiveClients !== undefined) {
      const max = Number(maxActiveClients);
      if (max < 1 || max > 100) return res.status(400).json({ error: 'Maximum clients must be between 1 and 100' });
      updates.maxActiveClients = max;
    }
    if (acceptingClients !== undefined) updates.acceptingClients = Boolean(acceptingClients);

    const lawyer = await User.findByIdAndUpdate(req.user.id, updates, { new: true })
      .select('maxActiveClients acceptingClients casesCompleted')
      .lean();
    const capacity = await getLawyerCapacity(req.user.id);
    sendData(res, {
      maxActiveClients: lawyer.maxActiveClients,
      currentClients: capacity.current,
      availableSlots: capacity.available,
      acceptingClients: lawyer.acceptingClients,
      casesCompleted: lawyer.casesCompleted,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/lawyer/profile', authenticateToken, requireRole('lawyer'), async (req, res) => {
  const lawyer = await User.findById(req.user.id).select('-passwordHash').lean();
  const advocate = await Advocate.findOne({ userId: req.user.id }).lean();
  sendData(res, { ...lawyer, advocate: advocate ? normalizeAdvocate(advocate) : null });
});

// File upload endpoint with validation for PDF, PNG, JPG, and ZIP files
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.pdf', '.png', '.jpg', '.jpeg', '.zip'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, PNG, JPG, and ZIP files are allowed.'), false);
  }
};

const uploadWithValidation = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

app.post('/api/upload', uploadWithValidation.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { sessionId } = req.body;
    if (sessionId) {
      // Update CaseFile with the uploaded document path
      await CaseFile.findOneAndUpdate(
        { sessionId },
        { $push: { documentsUploaded: req.file.filename } },
        { new: true }
      );
    }

    sendData(res, {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      url: `/uploads/${req.file.filename}`,
    }, 201);
  } catch (err) {
    console.error('File upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.use((err, _req, res, _next) => {
  const status = err.statusCode || 500;
  res.status(status).json({ error: err.message || 'Server error' });
});

const fs = require('fs');
async function start() {
  try {
    await connectDB();
    console.log('Database connected successfully.');
    console.log('SMTP Config loaded:', {
      user: smtpUser,
      passMasked: smtpPass ? `${smtpPass.substring(0, 3)}...${smtpPass.substring(smtpPass.length - 3)}` : 'none',
      passLength: smtpPass.length,
      hasHost: !!process.env.SMTP_HOST
    });
    fs.writeFileSync('db_test_result.txt', 'DB CONNECTED SUCCESSFUL AT ' + new Date().toISOString());

  } catch (err) {
    fs.writeFileSync('db_test_result.txt', 'DB CONNECTION ERROR: ' + err.message + '\nStack: ' + err.stack + '\nAT ' + new Date().toISOString());
    console.error('Database connection failed (running in offline/no-db mode):', err.message);
  }

  // Socket.io connection handler
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Authenticate socket connection
    socket.on('authenticate', async (token) => {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.sub;
        socket.userRole = decoded.role;
        connectedUsers.set(decoded.sub, socket.id);
        console.log(`User ${decoded.sub} authenticated with socket ${socket.id}`);
        socket.emit('authenticated', { userId: decoded.sub, role: decoded.role });
      } catch (err) {
        socket.emit('auth_error', { error: 'Invalid token' });
        socket.disconnect();
      }
    });

    // Join a case request room
    socket.on('join_case', async (caseRequestId) => {
      try {
        const request = await CaseRequest.findById(caseRequestId)
          .populate('client', '_id')
          .populate('lawyer', '_id');
        
        if (!request) {
          socket.emit('error', { message: 'Case request not found' });
          return;
        }

        // Verify user is part of this case
        const clientId = request.client._id.toString();
        const lawyerId = request.lawyer._id.toString();
        
        if (socket.userId !== clientId && socket.userId !== lawyerId) {
          socket.emit('error', { message: 'Not authorized to join this case' });
          return;
        }

        socket.join(`case_${caseRequestId}`);
        socket.currentCase = caseRequestId;
        console.log(`User ${socket.userId} joined case ${caseRequestId}`);
        
        // Load and send all previous messages
        const messages = await CaseMessage.find({ caseRequest: caseRequestId })
          .sort({ createdAt: 1 })
          .lean();

        // Decrypt message content
        const decryptedMessages = messages.map(msg => ({
          _id: msg._id,
          sender: msg.sender,
          senderRole: msg.senderRole,
          content: decrypt(msg.content),
          attachments: msg.attachments,
          read: msg.read,
          readAt: msg.readAt,
          createdAt: msg.createdAt,
        }));

        socket.emit('message_history', decryptedMessages);
        
        // Emit unread count
        const unreadCount = await CaseMessage.countDocuments({
          caseRequest: caseRequestId,
          sender: { $ne: socket.userId },
          read: false,
        });
        socket.emit('unread_count', { count: unreadCount });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // Send message
    socket.on('send_message', async (data) => {
      try {
        if (!socket.userId || !socket.currentCase) {
          socket.emit('error', { message: 'Not authenticated or not in a case' });
          return;
        }

        const { content, attachments = [] } = data;
        if (!content?.trim()) {
          socket.emit('error', { message: 'Message content is required' });
          return;
        }

        const request = await CaseRequest.findById(socket.currentCase);
        if (!request) {
          socket.emit('error', { message: 'Case request not found' });
          return;
        }

        // Allow lawyers to message even when case is pending
        // Clients can only message when case is accepted
        if (socket.userRole === 'client' && request.status !== 'accepted') {
          socket.emit('error', { message: 'Case must be accepted before you can send messages' });
          return;
        }

        // Lawyers can message in pending, accepted, or in-progress status
        if (socket.userRole === 'lawyer' && 
            !['pending', 'accepted', 'in progress', 'In Progress'].includes(request.status)) {
          socket.emit('error', { message: 'Case is not active' });
          return;
        }

        // Create message
        const message = await CaseMessage.create({
          caseRequest: socket.currentCase,
          sender: socket.userId,
          senderRole: socket.userRole,
          content: encrypt(content),
          attachments,
        });

        // Broadcast to case room
        const decryptedMessage = {
          _id: message._id,
          sender: message.sender,
          senderRole: message.senderRole,
          content: content,
          attachments: message.attachments,
          read: message.read,
          createdAt: message.createdAt,
        };

        io.to(`case_${socket.currentCase}`).emit('new_message', decryptedMessage);
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // Mark messages as read
    socket.on('mark_read', async (caseRequestId) => {
      try {
        if (!socket.userId) return;

        await CaseMessage.updateMany(
          {
            caseRequest: caseRequestId,
            sender: { $ne: socket.userId },
            read: false,
          },
          {
            read: true,
            readAt: new Date(),
          }
        );

        // Notify sender that messages were read
        const request = await CaseRequest.findById(caseRequestId);
        if (request) {
          const otherUserId = socket.userId === request.client.toString() 
            ? request.lawyer.toString() 
            : request.client.toString();
          
          const otherSocketId = connectedUsers.get(otherUserId);
          if (otherSocketId) {
            io.to(otherSocketId).emit('messages_read', { caseRequestId });
          }
        }
      } catch (err) {
        console.error('Error marking messages as read:', err);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      if (socket.userId) {
        connectedUsers.delete(socket.userId);
        console.log(`User ${socket.userId} disconnected`);
      }
    });
  });

  httpServer.listen(PORT, () => {
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
