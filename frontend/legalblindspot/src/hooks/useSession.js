import { useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';

export function useSession() {
  const [session, setSession] = useState({
    sessionId: null,
    city: null,
    budget: null,
    caseType: null
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedId = localStorage.getItem('legallink_sessionId');
    if (storedId) {
      api.getSession(storedId)
        .then(data => {
          setSession({
            sessionId: storedId,
            city: data.city,
            budget: data.budget,
            caseType: data.caseType || null
          });
        })
        .catch(() => {
          localStorage.removeItem('legallink_sessionId');
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const createSession = useCallback(async (city, budget) => {
    const data = await api.createSession(city, budget);
    const id = data.sessionId || data._id || data.id;
    localStorage.setItem('legallink_sessionId', id);
    setSession({ sessionId: id, city, budget, caseType: null });
    return id;
  }, []);

  const updateCity = useCallback(async (city) => {
    if (!session.sessionId) return;
    await api.updateSession(session.sessionId, { city });
    setSession(prev => ({ ...prev, city }));
  }, [session.sessionId]);

  const updateBudget = useCallback(async (budget) => {
    if (!session.sessionId) return;
    await api.updateSession(session.sessionId, { budget });
    setSession(prev => ({ ...prev, budget }));
  }, [session.sessionId]);

  const setCaseType = useCallback((caseType) => {
    setSession(prev => ({ ...prev, caseType }));
  }, []);

  const switchSession = useCallback(async (sessionId) => {
    localStorage.setItem('legallink_sessionId', sessionId);
    const data = await api.getSession(sessionId);
    setSession({
      sessionId,
      city: data.city,
      budget: data.budget,
      caseType: data.caseType || null,
    });
    return sessionId;
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem('legallink_sessionId');
    setSession({ sessionId: null, city: null, budget: null, caseType: null });
  }, []);

  return {
    session,
    isLoading,
    createSession,
    updateCity,
    updateBudget,
    setCaseType,
    clearSession,
    switchSession,
  };
}
