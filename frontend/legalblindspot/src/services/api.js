const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const config = {
    ...options,
    headers,
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

export async function sendMessage(message, sessionId, history, userId) {
  return request('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ message, sessionId, history, userId })
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
  const normalizedCity = typeof city === 'string' ? city.trim() : city;
  if (normalizedCity) params.set('city', normalizedCity);
  if (caseType) params.set('caseType', caseType);
  if (maxBudget) params.set('maxBudget', maxBudget);
  return request(`/api/advocates?${params.toString()}`);
}

export async function getAdvocateById(id) {
  return request(`/api/advocates/${id}`);
}

export async function getCaseFile(sessionId) {
  return request(`/api/case-file/${sessionId}`);
}

export async function getChatHistory(sessionId) {
  return request(`/api/chat/history/${sessionId}`);
}

export async function getUserChatHistories() {
  return request('/api/chat/history');
}

// Case requests
export async function createCaseRequest(formData) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${BASE_URL}/api/requests`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || json.message || 'Request failed');
  return json.data !== undefined ? json.data : json;
}

export async function getClientRequests() {
  return request('/api/requests/client');
}

export async function getLawyerRequests(status) {
  const params = status ? `?status=${status}` : '';
  return request(`/api/requests/lawyer${params}`);
}

export async function getCaseRequest(id) {
  return request(`/api/requests/${id}`);
}

export async function decideCaseRequest(id, decision, reason) {
  return request(`/api/requests/${id}/decision`, {
    method: 'POST',
    body: JSON.stringify({ decision, reason }),
  });
}

export async function updateCaseStatus(id, caseStatus) {
  return request(`/api/requests/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ caseStatus }),
  });
}

export async function completeCase(id) {
  return request(`/api/requests/${id}/complete`, { method: 'POST' });
}

export async function getCaseChatSessions(id) {
  return request(`/api/requests/${id}/chat-sessions`);
}

export async function getCaseNotes(id) {
  return request(`/api/requests/${id}/notes`);
}

export async function createCaseNote(id, content) {
  return request(`/api/requests/${id}/notes`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

export async function updateCaseNote(id, noteId, content) {
  return request(`/api/requests/${id}/notes/${noteId}`, {
    method: 'PATCH',
    body: JSON.stringify({ content }),
  });
}

export async function deleteCaseNote(id, noteId) {
  return request(`/api/requests/${id}/notes/${noteId}`, { method: 'DELETE' });
}

// Lawyer dashboard
export async function getLawyerDashboard() {
  return request('/api/lawyer/dashboard');
}

export async function getLawyerCapacity() {
  return request('/api/lawyer/capacity');
}

export async function updateLawyerCapacity(updates) {
  return request('/api/lawyer/capacity', {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}
