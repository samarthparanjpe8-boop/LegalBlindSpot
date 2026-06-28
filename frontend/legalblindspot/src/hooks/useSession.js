import { useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';

const SESSION_ID_KEY = 'legallink_sessionId';
const PREFERRED_CITY_KEY = 'legallink_preferredCity';

export function useSession() {
  const [session, setSession] = useState({
    sessionId: null,
    city: null,
    budget: null,
    caseType: null
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedId = localStorage.getItem(SESSION_ID_KEY);
    const preferredCity = localStorage.getItem(PREFERRED_CITY_KEY);
    if (storedId) {
      api.getSession(storedId)
        .then(data => {
          if (data.city) {
            localStorage.setItem(PREFERRED_CITY_KEY, data.city);
          }
          setSession({
            sessionId: storedId,
            city: data.city,
            budget: data.budget,
            caseType: data.caseType || null
          });
        })
        .catch(() => {
          localStorage.removeItem(SESSION_ID_KEY);
          setSession(prev => ({
            ...prev,
            sessionId: null,
            city: preferredCity || prev.city,
            budget: null,
            caseType: null,
          }));
        })
        .finally(() => setIsLoading(false));
    } else {
      if (preferredCity) {
        setSession(prev => ({ ...prev, city: preferredCity }));
      }
      setIsLoading(false);
    }
  }, []);

  const createSession = useCallback(async (city, budget) => {
    const data = await api.createSession(city, budget);
    const id = data.sessionId || data._id || data.id;
    localStorage.setItem(SESSION_ID_KEY, id);
    if (city) {
      localStorage.setItem(PREFERRED_CITY_KEY, city);
    }
    setSession({ sessionId: id, city, budget, caseType: null });
    return id;
  }, []);

  const updateCity = useCallback(async (city) => {
    localStorage.setItem(PREFERRED_CITY_KEY, city);
    if (!session.sessionId) {
      setSession(prev => ({ ...prev, city }));
      return;
    }
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
    localStorage.setItem(SESSION_ID_KEY, sessionId);
    const data = await api.getSession(sessionId);
    if (data.city) {
      localStorage.setItem(PREFERRED_CITY_KEY, data.city);
    }
    setSession({
      sessionId,
      city: data.city,
      budget: data.budget,
      caseType: data.caseType || null,
    });
    return sessionId;
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem(SESSION_ID_KEY);
    const preferredCity = localStorage.getItem(PREFERRED_CITY_KEY);
    setSession({
      sessionId: null,
      city: preferredCity,
      budget: null,
      caseType: null,
    });
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
