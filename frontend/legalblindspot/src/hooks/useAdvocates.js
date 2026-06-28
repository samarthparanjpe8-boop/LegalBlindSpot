import { useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';

export function useAdvocates(city, caseType, maxBudget, enabled = true) {
  const [advocates, setAdvocates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const normalizedCity = typeof city === 'string' ? city.trim() : city;

  const fetchAdvocates = useCallback(async () => {
    if (!enabled || !normalizedCity) {
      setAdvocates([]);
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const data = await api.getAdvocates(normalizedCity, caseType || undefined, maxBudget || undefined);
      const list = Array.isArray(data) ? data : data?.advocates || [];
      setAdvocates(list);
    } catch (err) {
      setError(err.message);
      setAdvocates([]);
    } finally {
      setIsLoading(false);
    }
  }, [normalizedCity, caseType, maxBudget, enabled]);

  useEffect(() => {
    fetchAdvocates();
  }, [fetchAdvocates]);

  return { advocates, isLoading, error, refetch: fetchAdvocates };
}
