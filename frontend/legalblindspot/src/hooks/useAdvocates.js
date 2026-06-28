import { useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';

export function useAdvocates(city, caseType, maxBudget, enabled = true) {
  const [advocates, setAdvocates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAdvocates = useCallback(async () => {
    if (!enabled || !city) return;
    setIsLoading(true);
    setError(null);

    try {
      const data = await api.getAdvocates(city || undefined, caseType || undefined, maxBudget || undefined);
      setAdvocates(Array.isArray(data) ? data : data.advocates || []);
    } catch (err) {
      setError(err.message);
      setAdvocates([]);
    } finally {
      setIsLoading(false);
    }
  }, [city, caseType, maxBudget, enabled]);

  useEffect(() => {
    fetchAdvocates();
  }, [fetchAdvocates]);

  return { advocates, isLoading, error, refetch: fetchAdvocates };
}
