import { useState, useCallback, useRef } from 'react';
import * as api from '../services/api';

export function useChat(sessionId) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [detectedCase, setDetectedCase] = useState(null);
  const [inlineAdvocates, setInlineAdvocates] = useState([]);
  const historyRef = useRef([]);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim()) return;
    setError(null);

    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    historyRef.current = [...historyRef.current, { role: 'user', content: text }];
    setIsLoading(true);

    try {
      const res = await api.sendMessage(text, sessionId, historyRef.current);

      const botMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: res.reply || res.message || res,
        timestamp: new Date().toISOString(),
        advocates: res.advocates || null,
        caseDetected: res.caseType || null,
        viability: res.viability || null
      };

      if (res.caseType) {
        setDetectedCase(res.caseType);
      }

      if (res.advocates && res.advocates.length > 0) {
        setInlineAdvocates(res.advocates);
      }

      historyRef.current = [...historyRef.current, { role: 'assistant', content: botMsg.content }];
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setError(err.message);
      const errMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        timestamp: new Date().toISOString(),
        isError: true
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  const clearHistory = useCallback(() => {
    setMessages([]);
    historyRef.current = [];
    setDetectedCase(null);
    setInlineAdvocates([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    detectedCase,
    inlineAdvocates,
    sendMessage,
    clearHistory
  };
}
