import { useState, useEffect } from 'react';
import { History, MessageSquare, MapPin, Coins } from 'lucide-react';
import Spinner from '../shared/Spinner';
import EmptyState from '../shared/EmptyState';
import { listSessionHistories } from '../../utils/chatHistory';
import * as api from '../../services/api';

export default function ChatHistoryPanel({ userId, currentSessionId, onSelectSession }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setSessions([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      const local = listSessionHistories(userId);

      try {
        const remote = await api.getUserChatHistories();
        if (cancelled) return;

        const merged = new Map();
        local.forEach((s) => merged.set(s.sessionId, s));
        (remote || []).forEach((s) => {
          const existing = merged.get(s.sessionId);
          merged.set(s.sessionId, {
            ...existing,
            sessionId: s.sessionId,
            caseType: s.caseType || existing?.caseType,
            city: s.city || existing?.city,
            budget: s.budget || existing?.budget,
            preview: s.preview || existing?.preview,
            messageCount: s.messageCount || existing?.messages?.length || 0,
            updatedAt: s.updatedAt || existing?.updatedAt,
          });
        });

        const sorted = [...merged.values()].sort(
          (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
        );
        setSessions(sorted);
      } catch {
        if (!cancelled) setSessions(local);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [userId, currentSessionId]);

  const handleSelect = async (session) => {
    onSelectSession(session.sessionId);
  };

  if (loading) {
    return (
      <div className="tab-loading">
        <Spinner size={32} />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <EmptyState
        icon={<History size={40} />}
        heading="No chat history yet"
        message="Your past consultations will appear here, stored by session ID."
      />
    );
  }

  return (
    <div className="tab-section chat-history-panel">
      <h2 className="tab-section-title">
        <History size={22} className="tab-title-icon" />
        Chat History
      </h2>
      <p className="chat-history-subtitle">
        Past consultations stored by session ID
      </p>

      <div className="chat-history-list">
        {sessions.map((session, idx) => (
          <button
            key={session.sessionId}
            type="button"
            className={`chat-history-item glass-card ${currentSessionId === session.sessionId ? 'chat-history-item-active' : ''}`}
            onClick={() => handleSelect(session)}
            style={{ animationDelay: `${idx * 60}ms` }}
          >
            <div className="chat-history-item-header">
              <span className="chat-history-item-icon">
                <MessageSquare size={16} />
              </span>
              <div className="chat-history-item-meta">
                <span className="chat-history-item-title">
                  {session.caseType || session.title || 'Consultation'}
                </span>
                <span className="chat-history-item-id">ID: {session.sessionId}</span>
              </div>
            </div>
            <p className="chat-history-item-preview">
              {session.preview || session.messages?.[0]?.content?.slice(0, 100) || 'No preview available'}
            </p>
            <div className="chat-history-item-footer">
              {session.city && (
                <span className="chat-history-tag">
                  <MapPin size={12} /> {session.city}
                </span>
              )}
              {session.budget != null && (
                <span className="chat-history-tag">
                  <Coins size={12} /> ₹{Number(session.budget).toLocaleString('en-IN')}
                </span>
              )}
              <span className="chat-history-tag">
                {session.messageCount || session.messages?.length || 0} messages
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
