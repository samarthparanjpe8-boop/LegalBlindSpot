import { useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';

export function useAdvocates(city, caseType, maxBudget) {
  const [advocates, setAdvocates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAdvocates = useCallback(async () => {
    if (!city) return;
    setIsLoading(true);
    setError(null);

    try {
      const data = await api.getAdvocates(city, caseType, maxBudget);
      setAdvocates(Array.isArray(data) ? data : data.advocates || []);
    } catch (err) {
      setError(err.message);
      setAdvocates([]);
    } finally {
      setIsLoading(false);
    }
  }, [city, caseType, maxBudget]);

  useEffect(() => {
    fetchAdvocates();
  }, [fetchAdvocates]);

  return { advocates, isLoading, error, refetch: fetchAdvocates };
}
