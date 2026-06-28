import { useState, useCallback, useRef, useEffect } from 'react';
import * as api from '../services/api';
import { getSessionHistory, saveSessionHistory, historyToMessages, computeIntakeComplete } from '../utils/chatHistory';

const DEFAULT_MESSAGE_LIMIT = 6;
const DEFAULT_SLOWDOWN_MS = 3000;

function syncLimitFromMessages(msgs, setLimitReached, setMessagesRemaining) {
  const userCount = msgs.filter((m) => m.role === 'user').length;
  const remaining = Math.max(0, DEFAULT_MESSAGE_LIMIT - userCount);
  setMessagesRemaining(remaining);
  setLimitReached(remaining === 0);
}

export function useChat(sessionId, userId) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [detectedCase, setDetectedCase] = useState(null);
  const [intakeComplete, setIntakeComplete] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const [messagesRemaining, setMessagesRemaining] = useState(DEFAULT_MESSAGE_LIMIT);
  const [cooldownActive, setCooldownActive] = useState(false);
  const historyRef = useRef([]);
  const loadedSessionRef = useRef(null);
  const cooldownTimerRef = useRef(null);

  const persistHistory = useCallback((msgs, meta = {}) => {
    if (!userId || !sessionId) return;
    saveSessionHistory(userId, sessionId, {
      messages: msgs,
      ...meta,
    });
  }, [userId, sessionId]);

  useEffect(() => {
    if (!sessionId) {
      setMessages([]);
      historyRef.current = [];
      setDetectedCase(null);
      setIntakeComplete(false);
      setLimitReached(false);
      setMessagesRemaining(DEFAULT_MESSAGE_LIMIT);
      loadedSessionRef.current = null;
      return;
    }

    if (loadedSessionRef.current === sessionId) return;

    loadedSessionRef.current = sessionId;
    setMessages([]);
    historyRef.current = [];
    setDetectedCase(null);
    setIntakeComplete(false);
    setLimitReached(false);
    setMessagesRemaining(DEFAULT_MESSAGE_LIMIT);

    let cancelled = false;

    async function loadHistory() {
      const local = userId ? getSessionHistory(userId, sessionId) : null;
      if (local?.messages?.length) {
        const msgs = local.messages;
        if (!cancelled) {
          setMessages(msgs);
          historyRef.current = msgs.map((m) => ({ role: m.role, content: m.content }));
          const caseType = local.caseType || null;
          setDetectedCase(caseType);
          setIntakeComplete(local.intakeComplete ?? computeIntakeComplete(msgs, caseType));
          syncLimitFromMessages(msgs, setLimitReached, setMessagesRemaining);
        }
      }

      try {
        const remote = await api.getChatHistory(sessionId);
        if (cancelled) return;
        if (remote?.messages?.length) {
          const msgs = historyToMessages(remote.messages);
          setMessages(msgs);
          historyRef.current = msgs.map((m) => ({ role: m.role, content: m.content }));
          const caseType = remote.caseType || null;
          if (caseType) setDetectedCase(caseType);
          const complete = computeIntakeComplete(msgs, caseType);
          setIntakeComplete(complete);
          syncLimitFromMessages(msgs, setLimitReached, setMessagesRemaining);
          persistHistory(msgs, {
            caseType,
            city: remote.city,
            budget: remote.budget,
            intakeComplete: complete,
            title: caseType || 'Consultation',
          });
        }
      } catch {
        // offline or no backend history yet
      }
    }

    loadHistory();
    return () => { cancelled = true; };
  }, [sessionId, userId, persistHistory]);

  const startCooldown = useCallback((ms = DEFAULT_SLOWDOWN_MS) => {
    if (cooldownTimerRef.current) {
      clearTimeout(cooldownTimerRef.current);
    }
    setCooldownActive(true);
    cooldownTimerRef.current = setTimeout(() => {
      setCooldownActive(false);
      cooldownTimerRef.current = null;
    }, ms);
  }, []);

  useEffect(() => () => {
    if (cooldownTimerRef.current) {
      clearTimeout(cooldownTimerRef.current);
    }
  }, []);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || limitReached || cooldownActive) return;
    setError(null);

    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => {
      const next = [...prev, userMsg];
      persistHistory(next);
      return next;
    });
    historyRef.current = [...historyRef.current, { role: 'user', content: text }];
    setIsLoading(true);

    try {
      const res = await api.sendMessage(text, sessionId, historyRef.current, userId);

      const botMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: res.reply || res.message || res,
        timestamp: new Date().toISOString(),
        advocates: res.intakeComplete ? (res.advocates || null) : null,
        caseDetected: res.caseType || null,
        viability: res.viability || null
      };

      if (res.caseType) {
        setDetectedCase(res.caseType);
      }

      if (res.intakeComplete) {
        setIntakeComplete(true);
      }

      if (res.limitReached) {
        setLimitReached(true);
      }
      if (typeof res.messagesRemaining === 'number') {
        setMessagesRemaining(res.messagesRemaining);
        if (res.messagesRemaining === 0) {
          setLimitReached(true);
        }
      }

      startCooldown(res.slowdownMs || DEFAULT_SLOWDOWN_MS);

      historyRef.current = [...historyRef.current, { role: 'assistant', content: botMsg.content }];
      setMessages(prev => {
        const next = [...prev, botMsg];
        persistHistory(next, {
          caseType: res.caseType || detectedCase,
          intakeComplete: res.intakeComplete || intakeComplete,
          title: res.caseType || 'Consultation',
        });
        return next;
      });
    } catch (err) {
      setError(err.message);
      const errMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        timestamp: new Date().toISOString(),
        isError: true
      };
      setMessages(prev => {
        const next = [...prev, errMsg];
        persistHistory(next);
        return next;
      });
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, userId, persistHistory, detectedCase, intakeComplete, limitReached, cooldownActive, startCooldown]);

  const clearHistory = useCallback(() => {
    setMessages([]);
    historyRef.current = [];
    setDetectedCase(null);
    setIntakeComplete(false);
    setLimitReached(false);
    setMessagesRemaining(DEFAULT_MESSAGE_LIMIT);
    setError(null);
    loadedSessionRef.current = null;
  }, []);

  return {
    messages,
    isLoading,
    error,
    detectedCase,
    intakeComplete,
    limitReached,
    messagesRemaining,
    cooldownActive,
    sendMessage,
    clearHistory,
  };
}
