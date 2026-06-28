require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const SYSTEM_INSTRUCTION = `You are LegalLink, a structured legal assistant for first-time users in India.
You must guide the user through a friendly, step-by-step intake process before providing the final legal assessment and advocate recommendations.

IMPORTANT: Always follow this exact conversation flow based on how much the user has shared:

**Phase 1 — Problem introduction** (first messages, facts unclear):
- Briefly acknowledge their concern.
- Ask ONE focused set of questions: what happened, when it happened, and who the other party is.
- If you can identify the case type, mention 1-2 preliminary applicable IPC/BNS or special law sections.

**Phase 2 — Evidence** (user described the problem but evidence not yet discussed):
- Summarize what you understood about their problem.
- Ask what proof, documents, screenshots, receipts, FIR, or records they have.
- List 3-5 specific documents relevant to their case type.
- Ask ONE follow-up question tailored to their situation.

**Phase 3 — Solution** (user shared both problem and evidence details):
- Explain their legal position in simple language (no jargon; explain any legal term in brackets).
- List specific applicable IPC/BNS sections or special laws with section numbers.
- State expected penalties (fines, compensation) AND possible jail time if the offence is criminal.
- Give clear actionable next steps (which forum to approach, what to file, what to avoid).
- Recommend matching advocates from the context if provided.
- End with 2-3 follow-up questions about gaps in their case.

Constraints:
- Ask about ONE phase at a time — do not dump all questions at once.
- Respond in simple, plain language a non-lawyer can understand.
- Never recommend an advocate whose fee exceeds the user's stated budget.
- End every response with this exact line on a new line:
'Note: This is for informational purposes only and not formal legal advice.'
- Always respond in English only.`;

const JSON_SYSTEM_INSTRUCTION =
  'You return only valid JSON. No markdown, no code fences, no explanation text.';

const MODEL_FALLBACKS = [
  process.env.GEMINI_MODEL,
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
].filter(Boolean);

let genAI;
let chatModel;
let jsonModel;
let modelIndex = 0;

// Queue system to prevent concurrent AI calls
let aiQueue = [];
let isProcessingQueue = false;

async function addToQueue(operation) {
  return new Promise((resolve, reject) => {
    aiQueue.push({ operation, resolve, reject });
    processQueue();
  });
}

async function processQueue() {
  if (isProcessingQueue || aiQueue.length === 0) return;
  
  isProcessingQueue = true;
  const { operation, resolve, reject } = aiQueue.shift();
  
  try {
    const result = await operation();
    resolve(result);
  } catch (err) {
    reject(err);
  } finally {
    isProcessingQueue = false;
    // Longer delay between AI calls to prevent rate limiting
    setTimeout(() => processQueue(), 3000);
  }
}

function isRetryableModelError(err) {
  const msg = err && err.message ? err.message : String(err);
  return (
    msg.includes('404') ||
    msg.includes('not found') ||
    msg.includes('503') ||
    msg.includes('429') ||
    msg.includes('Service Unavailable') ||
    msg.includes('Too Many Requests')
  );
}

function isJsonParseError(err) {
  const msg = err && err.message ? err.message : String(err);
  return (
    err instanceof SyntaxError ||
    msg.includes('JSON') ||
    msg.includes('No JSON found')
  );
}

function getActiveModelName() {
  return MODEL_FALLBACKS[modelIndex] || MODEL_FALLBACKS[0];
}

function initGenAI() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_key_here') {
      throw new Error('GEMINI_API_KEY is not set in .env');
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
}

function clearModels() {
  chatModel = null;
  jsonModel = null;
}

function getChatModel() {
  initGenAI();
  if (!chatModel) {
    chatModel = genAI.getGenerativeModel({
      model: getActiveModelName(),
      systemInstruction: SYSTEM_INSTRUCTION,
    });
  }
  return chatModel;
}

function getJsonModel() {
  initGenAI();
  if (!jsonModel) {
    jsonModel = genAI.getGenerativeModel({
      model: getActiveModelName(),
      systemInstruction: JSON_SYSTEM_INSTRUCTION,
    });
  }
  return jsonModel;
}

function switchToNextModel() {
  if (modelIndex < MODEL_FALLBACKS.length - 1) {
    modelIndex += 1;
    clearModels();
    return true;
  }
  return false;
}

async function withModelRetry(operation, useJsonModel = false) {
  const maxAttempts = MODEL_FALLBACKS.length;
  let lastError;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const m = useJsonModel ? getJsonModel() : getChatModel();
      return await operation(m);
    } catch (err) {
      lastError = err;
      if (isRetryableModelError(err)) {
        console.warn(`Retryable error encountered: ${err.message || err}. Retrying in 500ms...`);
        // Wait 500ms for rate limits/quota to reset before retrying
        await new Promise((resolve) => setTimeout(resolve, 500));
        if (switchToNextModel()) {
          continue;
        }
      }
      throw err;
    }
  }

  throw lastError;
}

function findJsonEnd(str, start) {
  const stack = [];
  let inString = false;
  let escape = false;

  for (let i = start; i < str.length; i++) {
    const c = str[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (c === '\\' && inString) {
      escape = true;
      continue;
    }
    if (c === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (c === '{' || c === '[') {
      stack.push(c);
    } else if (c === '}' || c === ']') {
      if (!stack.length) return -1;
      const open = stack.pop();
      const expected = open === '{' ? '}' : ']';
      if (c !== expected) return -1;
      if (stack.length === 0) return i + 1;
    }
  }
  return -1;
}

function parseJsonResponse(text) {
  if (!text || typeof text !== 'string') {
    throw new SyntaxError('Empty response from model');
  }

  const stripped = text
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```\s*$/g, '')
    .trim();

  try {
    return JSON.parse(stripped);
  } catch {
    const objIdx = stripped.indexOf('{');
    const arrIdx = stripped.indexOf('[');

    if (objIdx === -1 && arrIdx === -1) {
      throw new SyntaxError('No JSON found in response');
    }

    const start =
      objIdx !== -1 && (arrIdx === -1 || objIdx < arrIdx) ? objIdx : arrIdx;
    const end = findJsonEnd(stripped, start);

    if (end === -1) {
      throw new SyntaxError('Could not parse JSON from response');
    }

    return JSON.parse(stripped.slice(start, end));
  }
}

async function generateJson(prompt) {
  return addToQueue(async () => {
    const maxParseRetries = 2;

    for (let parseAttempt = 0; parseAttempt <= maxParseRetries; parseAttempt++) {
      try {
        return await withModelRetry(async (m) => {
          const result = await m.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.2,
            },
          });
          return parseJsonResponse(result.response.text());
        }, true);
      } catch (err) {
        const canRetryParse =
          parseAttempt < maxParseRetries &&
          (isJsonParseError(err) || isRetryableModelError(err));

        if (canRetryParse) {
          if (isRetryableModelError(err)) {
            switchToNextModel();
          }
          continue;
        }
        throw err;
      }
    }

    throw new SyntaxError('Failed to parse JSON after retries');
  });
}

async function chat(userMessage, history, contextString, onToken) {
  return addToQueue(async () => {
    return withModelRetry(async (m) => {
      const contents = [];

      history.forEach((entry) => {
        contents.push({
          role: entry.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: entry.content }],
        });
      });

      const messageWithContext = contextString
        ? `${contextString}\n\nUser message: ${userMessage}`
        : userMessage;

      contents.push({ role: 'user', parts: [{ text: messageWithContext }] });

      const result = await m.generateContentStream({ contents });
      let fullResponse = '';

      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          fullResponse += text;
          if (onToken) onToken(text);
        }
      }

      return [
        ...history,
        { role: 'user', content: userMessage },
        { role: 'assistant', content: fullResponse },
      ];
    }, false);
  });
}

const CASE_TYPE_KEYWORDS = {
  'Criminal Defense': [
    'criminal',
    'defense',
    'defence',
    'assault',
    'murder',
    'hit and run',
    'hit-and-run',
    'bail',
    'fir',
    'arrest',
    'theft',
    'robbery',
  ],
  'Tenant Rights': [
    'landlord',
    'tenant',
    'rent',
    'evict',
    'security deposit',
    'lease',
  ],
  'Employment Law': [
    'employer',
    'salary',
    'termination',
    'fired',
    'workplace',
    'gratuity',
    'pf',
  ],
  'Consumer Complaints': [
    'consumer',
    'defective',
    'refund',
    'product',
    'builder',
  ],
  'Family Law': ['divorce', 'custody', 'marriage', 'alimony', 'domestic violence'],
  'Property Disputes': ['property', 'inheritance', 'land dispute', 'boundary', 'title'],
  'Cybercrime': ['cyber', 'online fraud', 'hacking', 'phishing'],
  'RTI Cases': ['rti', 'right to information'],
};

const INDIAN_CITIES = [
  'Mumbai',
  'Delhi',
  'Bangalore',
  'Chennai',
  'Hyderabad',
  'Pune',
  'Kolkata',
  'Nagpur',
];

function detectCaseAndBudgetLocally(userMessage) {
  const lower = userMessage.toLowerCase();
  let caseType = null;

  for (const [type, keywords] of Object.entries(CASE_TYPE_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      caseType = type;
      break;
    }
  }

  const legalProblemDetected =
    caseType !== null ||
    /lawyer|advocate|legal|court|case|sue|file|help/i.test(userMessage);

  const budgetMatch =
    userMessage.match(/(?:rs\.?|inr|rupees?|budget)\s*([\d,]+)/i) ||
    userMessage.match(/([\d,]+)\s*(?:rs\.?|inr|rupees?)/i);
  const budgetMentioned = budgetMatch
    ? parseInt(budgetMatch[1].replace(/,/g, ''), 10)
    : null;

  let cityMentioned = null;
  for (const city of INDIAN_CITIES) {
    if (lower.includes(city.toLowerCase())) {
      cityMentioned = city;
      break;
    }
  }

  const urgency = /urgent|immediately|emergency|asap/i.test(userMessage)
    ? 'high'
    : caseType
      ? 'medium'
      : null;

  return {
    caseType,
    budgetMentioned,
    cityMentioned,
    urgency,
    legalProblemDetected,
  };
}

async function detectCaseAndBudget(userMessage) {
  const prompt = `Analyze this user message about a legal problem in India.
Return a single JSON object with exactly these fields:
{
  "caseType": string or null (one of: Property Disputes, Consumer Complaints, Employment Law, Family Law, Criminal Defense, Tenant Rights, Cybercrime, RTI Cases),
  "budgetMentioned": number or null,
  "cityMentioned": string or null,
  "urgency": "low" or "medium" or "high" or null,
  "legalProblemDetected": boolean
}

User message: ${userMessage}`;

  try {
    return await generateJson(prompt);
  } catch (err) {
    console.error('Gemini API Error in detectCaseAndBudget:', err.message || err);
    return detectCaseAndBudgetLocally(userMessage);
  }
}

function assessViabilityLocally(description, caseType) {
  const isCriminal = caseType === 'Criminal Defense';
  return {
    viabilityScore: isCriminal ? 50 : 55,
    verdict: 'Moderate case',
    estimatedCostMin: isCriminal ? 10000 : 5000,
    estimatedCostMax: isCriminal ? 50000 : 25000,
    estimatedTimeline: isCriminal ? '6 - 18 months' : '3 - 12 months',
    worthPursuing: true,
    strengths: [
      'You have identified a specific legal issue that can be reviewed by an advocate',
      'Early legal advice can help you understand your options before acting',
    ],
    weaknesses: [
      'A full assessment requires your documents and evidence to be reviewed',
      'Outcomes depend on facts that are not yet confirmed',
    ],
    honestAdvice: `This is a ${caseType} matter. Speak with a qualified advocate in your city about your situation. ${description.slice(0, 120)}`,
  };
}

async function chatReply(userMessage, history, contextString) {
  return addToQueue(async () => {
    return withModelRetry(async (m) => {
      const contents = [];

      history.forEach((entry) => {
        contents.push({
          role: entry.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: entry.content }],
        });
      });

      const messageWithContext = contextString
        ? `${contextString}\n\nUser message: ${userMessage}`
        : userMessage;

      contents.push({ role: 'user', parts: [{ text: messageWithContext }] });

      const result = await m.generateContent({ contents });
      const content = result.response.text();

      return {
        content,
        history: [
          ...history,
          { role: 'user', content: userMessage },
          { role: 'assistant', content },
        ],
      };
    }, false);
  });
}

const CASE_TYPE_KEYWORDS_VIABILITY = {
  // same structure, no conflict
};

function normalizeViabilityResult(result) {
  const viabilityScore = Number(result.viabilityScore ?? result.score ?? 0);

  if (viabilityScore >= 50) {
    return {
      ...result,
      viabilityScore,
    };
  }

  return {
    ...result,
    viabilityScore,
    verdict: 'Case is not fit for fighting',
    worthPursuing: false,
    honestAdvice:
      result.honestAdvice ||
      'The viability score is below 50, so this case is not fit for fighting right now. Consider gathering stronger documents, proof, or settlement options before spending money on litigation.',
  };
}

function defaultDocumentChecklist(caseType) {
  return [
    {
      document: 'Identity proof (Aadhaar or passport)',
      whyNeeded: 'Required for filing and verification',
    },
    {
      document: 'Written agreement or contract',
      whyNeeded: 'Shows terms and obligations between parties',
    },
    {
      document: 'Payment receipts or bank statements',
      whyNeeded: 'Proves financial transactions related to the dispute',
    },
    {
      document: 'Communication records (email, WhatsApp, letters)',
      whyNeeded: 'Documents what was said or promised',
    },
    {
      document: 'Photos or videos',
      whyNeeded: 'Supports evidence of damage, injury, or events',
    },
  ];
}

async function checkAdvice(adviceClaimed, caseType) {
  const prompt = `Verify legal advice given in India.
Case type: ${caseType || 'unknown'}
Advice given: "${adviceClaimed}"

Return a single JSON object:
{
  "verdict": "Correct" or "Incorrect" or "Partially Correct" or "Misleading",
  "explanation": string,
  "confidence": "High" or "Medium" or "Low",
  "recommendation": string,
  "legalBasis": string
}`;

  try {
    return await generateJson(prompt);
  } catch (err) {
    console.error('Gemini API Error in checkAdvice:', err.message || err);
    return {
      verdict: 'Partially Correct',
      explanation:
        'We could not fully verify this online. The statement may depend on your specific facts and jurisdiction.',
      confidence: 'Low',
      recommendation:
        'Ask the lawyer to cite the exact law or section. Consider a second opinion from another advocate.',
      legalBasis: 'Verification unavailable -- consult a qualified advocate.',
    };
  }
}

async function assessViability(description, caseType, documentsAvailable) {
  const docs =
    documentsAvailable && documentsAvailable.length
      ? documentsAvailable.join(', ')
      : 'none specified';

  const prompt = `Assess legal case viability in India.
Case type: ${caseType}
Description: ${description}
Documents available: ${docs}

Return a single JSON object:
{
  "viabilityScore": number between 0 and 100,
  "verdict": "Strong case" or "Moderate case" or "Weak case" or "Not worth pursuing",
  "estimatedCostMin": number,
  "estimatedCostMax": number,
  "estimatedTimeline": string,
  "worthPursuing": boolean,
  "strengths": array of strings,
  "weaknesses": array of strings,
  "honestAdvice": string
}`;

  try {
    return normalizeViabilityResult(await generateJson(prompt));
  } catch (err) {
    console.error('Gemini API Error in assessViability:', err.message || err);
    return normalizeViabilityResult(assessViabilityLocally(description, caseType));
  }
}

async function runIntake(answers) {
  const prompt = `Based on intake answers for a legal problem in India, return a single JSON object:
{
  "detectedCaseType": string (one of: Property Disputes, Consumer Complaints, Employment Law, Family Law, Criminal Defense, Tenant Rights, Cybercrime, RTI Cases),
  "explanation": string,
  "filingCost": string,
  "commonOutcome": string,
  "suggestProceed": boolean
}

Answers: ${JSON.stringify(answers)}`;

  try {
    return await generateJson(prompt);
  } catch (err) {
    console.error('Gemini API Error in runIntake:', err.message || err);
    const local = detectCaseAndBudgetLocally(
      `${answers.otherParty} ${answers.whatHappened}`
    );
    return {
      detectedCaseType: local.caseType || 'Consumer Complaints',
      explanation:
        'Based on your answers, you may have a valid legal issue. An advocate can review the details with you.',
      filingCost: 'Varies by court; often Rs.200 to Rs.5,000 for initial filing',
      commonOutcome: 'Settlement, court order, or compensation depending on evidence',
      suggestProceed: true,
    };
  }
}

async function getDocumentChecklist(caseType, description) {
  const prompt = `For a ${caseType} case in India: "${description}"
Return a JSON array only:
[
  { "document": string, "whyNeeded": string }
]
List 4 to 6 key documents.`;

  try {
    const result = await generateJson(prompt);
    if (Array.isArray(result) && result.length > 0) {
      return result;
    }
    return defaultDocumentChecklist(caseType);
  } catch (err) {
    console.error('Gemini API Error in getDocumentChecklist:', err.message || err);
    return defaultDocumentChecklist(caseType);
  }
}

module.exports = {
  chat,
  chatReply,
  detectCaseAndBudget,
  detectCaseAndBudgetLocally,
  checkAdvice,
  assessViability,
  runIntake,
  getDocumentChecklist,
};
