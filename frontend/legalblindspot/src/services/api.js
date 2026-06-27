const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options
  };

  const res = await fetch(url, config);
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.error || json.message || 'Request failed');
  }

  return json.data !== undefined ? json.data : json;
}

export async function createSession(city, budget) {
  return request('/api/session', {
    method: 'POST',
    body: JSON.stringify({ city, budget })
  });
}

export async function getSession(sessionId) {
  return request(`/api/session/${sessionId}`);
}

export async function updateSession(sessionId, updates) {
  return request(`/api/session/${sessionId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates)
  });
}

export async function sendMessage(message, sessionId, history) {
  return request('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ message, sessionId, history })
  });
}

export async function detectCase(message) {
  return request('/api/detect-case', {
    method: 'POST',
    body: JSON.stringify({ message })
  });
}

export async function assessViability(description, caseType, documents) {
  return request('/api/assess', {
    method: 'POST',
    body: JSON.stringify({ description, caseType, documents })
  });
}

export async function checkAdvice(advice, caseType) {
  return request('/api/check-advice', {
    method: 'POST',
    body: JSON.stringify({ advice, caseType })
  });
}

export async function runIntake(answers) {
  return request('/api/intake', {
    method: 'POST',
    body: JSON.stringify({ answers })
  });
}

export async function getAdvocates(city, caseType, maxBudget) {
  const params = new URLSearchParams();
  if (city) params.set('city', city);
  if (caseType) params.set('caseType', caseType);
  if (maxBudget) params.set('maxBudget', maxBudget);
  return request(`/api/advocates?${params.toString()}`);
}

export async function getAdvocateById(id) {
  return request(`/api/advocates/${id}`);
}

export async function getLeaderboard() {
  return request('/api/leaderboard');
}

export async function getCaseFile(sessionId) {
  return request(`/api/case-file/${sessionId}`);
}
