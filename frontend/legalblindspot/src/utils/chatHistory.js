const STORAGE_PREFIX = 'legallink_histories';

function storageKey(userId) {
  return `${STORAGE_PREFIX}_${userId}`;
}

export function getAllSessionHistories(userId) {
  if (!userId) return {};
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getSessionHistory(userId, sessionId) {
  if (!userId || !sessionId) return null;
  return getAllSessionHistories(userId)[sessionId] || null;
}

export function saveSessionHistory(userId, sessionId, data) {
  if (!userId || !sessionId) return;
  const all = getAllSessionHistories(userId);
  const existing = all[sessionId] || {};
  all[sessionId] = {
    ...existing,
    ...data,
    sessionId,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(storageKey(userId), JSON.stringify(all));
}

export function listSessionHistories(userId) {
  const all = getAllSessionHistories(userId);
  return Object.values(all).sort(
    (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
  );
}

export function computeIntakeComplete(messages, caseType) {
  if (!caseType) return false;
  const userMsgs = (messages || []).filter((m) => m.role === 'user');
  if (userMsgs.length < 3) return false;
  const allUserText = userMsgs.map((m) => m.content.toLowerCase()).join(' ');
  const evidenceKeywords = [
    'document', 'proof', 'receipt', 'screenshot', 'email', 'whatsapp',
    'contract', 'agreement', 'photo', 'record', 'certificate', 'evidence',
    'no proof', 'no document', "don't have", 'dont have', 'nothing', 'none',
  ];
  const hasEvidence = evidenceKeywords.some((k) => allUserText.includes(k));
  const hasConcept = userMsgs.some((m) => m.content.trim().length > 25);
  return hasConcept && hasEvidence;
}

export function historyToMessages(history) {
  if (!Array.isArray(history)) return [];
  return history.map((entry, i) => ({
    id: entry.id || `${entry.timestamp || Date.now()}-${i}`,
    role: entry.role,
    content: entry.content,
    timestamp: entry.timestamp || new Date().toISOString(),
    advocates: entry.advocates || null,
    caseDetected: entry.caseDetected || null,
    viability: entry.viability || null,
  }));
}
