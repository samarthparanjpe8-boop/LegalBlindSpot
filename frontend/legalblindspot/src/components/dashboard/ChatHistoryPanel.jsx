import { useState, useEffect, useCallback } from 'react';
import { History, MessageSquare, MapPin, Coins, Copy, Check, Pencil, X, Trash2 } from 'lucide-react';
import Spinner from '../shared/Spinner';
import EmptyState from '../shared/EmptyState';
import { listSessionHistories, deleteSessionHistory } from '../../utils/chatHistory';
import * as api from '../../services/api';

export default function ChatHistoryPanel({ userId, currentSessionId, onSelectSession }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const loadSessions = useCallback(async () => {
    if (!userId) {
      setSessions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const local = listSessionHistories(userId);

    try {
      const remote = await api.getUserChatHistories();

      const merged = new Map();
      local.forEach((s) => merged.set(s.sessionId, s));
      (remote || []).forEach((s) => {
        const existing = merged.get(s.sessionId);
        merged.set(s.sessionId, {
          ...existing,
          sessionId: s.sessionId,
          chatName: s.chatName || existing?.chatName,
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
      setSessions(local);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions, currentSessionId]);

  const handleCopyId = (e, sessionId) => {
    e.stopPropagation();
    navigator.clipboard.writeText(sessionId).then(() => {
      setCopiedId(sessionId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleStartRename = (e, session) => {
    e.stopPropagation();
    setRenamingId(session.sessionId);
    setRenameValue(session.chatName || session.caseType || 'Consultation');
  };

  const handleCancelRename = (e) => {
    e?.stopPropagation();
    setRenamingId(null);
    setRenameValue('');
  };

  const handleSaveRename = async (e, sessionId) => {
    e.stopPropagation();
    if (!renameValue.trim()) return;
    setRenaming(true);
    try {
      await api.renameChatSession(sessionId, renameValue.trim());
      setSessions((prev) =>
        prev.map((s) => s.sessionId === sessionId ? { ...s, chatName: renameValue.trim() } : s)
      );
      setRenamingId(null);
    } catch (err) {
      console.error('Rename failed:', err);
    } finally {
      setRenaming(false);
    }
  };

  const handleDeleteClick = (e, sessionId) => {
    e.stopPropagation();
    setShowDeleteConfirm(sessionId);
  };

  const handleConfirmDelete = async (sessionId) => {
    console.log('Attempting to delete session:', sessionId);
    setDeletingId(sessionId);
    try {
      console.log('Calling API deleteChatSession...');
      await api.deleteChatSession(sessionId);
      console.log('Delete successful, updating UI');
      
      // Also delete from localStorage
      if (userId) {
        deleteSessionHistory(userId, sessionId);
      }
      
      setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
      setShowDeleteConfirm(null);
      if (currentSessionId === sessionId) {
        onSelectSession(null);
      }
    } catch (err) {
      console.error('Delete failed:', err);
      // Even if API delete fails, try to remove from localStorage
      if (userId) {
        deleteSessionHistory(userId, sessionId);
        setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
        setShowDeleteConfirm(null);
        if (currentSessionId === sessionId) {
          onSelectSession(null);
        }
      } else {
        alert(`Failed to delete chat: ${err.message}`);
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(null);
  };

  if (loading) {
    return (
      <>
        <div className="tab-loading">
          <Spinner size={32} />
        </div>
        <style jsx>{`
          .chat-delete-btn {
            background: none;
            border: none;
            color: var(--text-muted);
            cursor: pointer;
            padding: 4px;
            border-radius: var(--radius-sm);
            transition: var(--transition);
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .chat-delete-btn:hover {
            color: var(--danger);
            background: var(--bg-hover);
          }

          .modal-backdrop {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            animation: fade-in 0.2s var(--ease-out-expo);
          }

          .modal-content {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            padding: var(--space-6);
            max-width: 400px;
            width: 90%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            animation: slide-up 0.3s var(--ease-out-expo);
          }

          .modal-title {
            font-family: var(--font-serif);
            font-size: 1.25rem;
            color: var(--text-primary);
            margin: 0 0 var(--space-3) 0;
          }

          .modal-message {
            font-size: 0.9rem;
            color: var(--text-secondary);
            margin: 0 0 var(--space-5) 0;
            line-height: 1.5;
          }

          .modal-actions {
            display: flex;
            gap: var(--space-3);
            justify-content: flex-end;
          }

          .modal-btn {
            padding: var(--space-2) var(--space-4);
            border-radius: var(--radius-sm);
            font-size: 0.9rem;
            font-weight: 500;
            cursor: pointer;
            transition: var(--transition);
            border: 1px solid var(--border);
          }

          .modal-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .modal-btn-cancel {
            background: var(--bg-secondary);
            color: var(--text-primary);
          }

          .modal-btn-cancel:hover:not(:disabled) {
            background: var(--bg-hover);
          }

          .modal-btn-danger {
            background: var(--danger);
            color: white;
            border-color: var(--danger);
          }

          .modal-btn-danger:hover:not(:disabled) {
            background: #dc2626;
            border-color: #dc2626;
          }
        `}</style>
      </>
    );
  }

  if (sessions.length === 0) {
    return (
      <>
        <EmptyState
          icon={<History size={40} />}
          heading="No chat history yet"
          message="Your past consultations will appear here. Each chat has a unique ID you can share with a lawyer."
        />
        <style jsx>{`
          .chat-delete-btn {
            background: none;
            border: none;
            color: var(--text-muted);
            cursor: pointer;
            padding: 4px;
            border-radius: var(--radius-sm);
            transition: var(--transition);
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .chat-delete-btn:hover {
            color: var(--danger);
            background: var(--bg-hover);
          }

          .modal-backdrop {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            animation: fade-in 0.2s var(--ease-out-expo);
          }

          .modal-content {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            padding: var(--space-6);
            max-width: 400px;
            width: 90%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            animation: slide-up 0.3s var(--ease-out-expo);
          }

          .modal-title {
            font-family: var(--font-serif);
            font-size: 1.25rem;
            color: var(--text-primary);
            margin: 0 0 var(--space-3) 0;
          }

          .modal-message {
            font-size: 0.9rem;
            color: var(--text-secondary);
            margin: 0 0 var(--space-5) 0;
            line-height: 1.5;
          }

          .modal-actions {
            display: flex;
            gap: var(--space-3);
            justify-content: flex-end;
          }

          .modal-btn {
            padding: var(--space-2) var(--space-4);
            border-radius: var(--radius-sm);
            font-size: 0.9rem;
            font-weight: 500;
            cursor: pointer;
            transition: var(--transition);
            border: 1px solid var(--border);
          }

          .modal-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .modal-btn-cancel {
            background: var(--bg-secondary);
            color: var(--text-primary);
          }

          .modal-btn-cancel:hover:not(:disabled) {
            background: var(--bg-hover);
          }

          .modal-btn-danger {
            background: var(--danger);
            color: white;
            border-color: var(--danger);
          }

          .modal-btn-danger:hover:not(:disabled) {
            background: #dc2626;
            border-color: #dc2626;
          }
        `}</style>
      </>
    );
  }

  return (
    <>
      <div className="tab-section chat-history-panel">
        <h2 className="tab-section-title">
          <History size={22} className="tab-title-icon" />
          Chat History
        </h2>
        <p className="chat-history-subtitle">
          Share a chat ID with your lawyer so they can review your full conversation history.
        </p>

        <div className="chat-history-list">
          {sessions.map((session, idx) => (
            <div
              key={session.sessionId}
              className={`chat-history-item glass-card ${currentSessionId === session.sessionId ? 'chat-history-item-active' : ''}`}
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              {/* Header row */}
              <div className="chat-history-item-header">
                <span className="chat-history-item-icon">
                  <MessageSquare size={16} />
                </span>
                <div className="chat-history-item-meta" style={{ flex: 1, minWidth: 0 }}>
                  {renamingId === session.sessionId ? (
                    <div
                      className="chat-rename-row"
                      onClick={(e) => e.stopPropagation()}
                      style={{ display: 'flex', gap: '6px', alignItems: 'center' }}
                    >
                      <input
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSaveRename(e, session.sessionId); if (e.key === 'Escape') handleCancelRename(e); }}
                        className="chat-rename-input"
                        autoFocus
                      />
                      <button
                        type="button"
                        className="chat-rename-save"
                        onClick={(e) => handleSaveRename(e, session.sessionId)}
                        disabled={renaming}
                        title="Save"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        type="button"
                        className="chat-rename-cancel"
                        onClick={handleCancelRename}
                        title="Cancel"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="chat-history-item-title">
                        {session.chatName || session.caseType || 'Consultation'}
                      </span>
                      <button
                        type="button"
                        className="chat-rename-btn"
                        onClick={(e) => handleStartRename(e, session)}
                        title="Rename this chat"
                      >
                        <Pencil size={11} />
                      </button>
                      <button
                        type="button"
                        className="chat-delete-btn"
                        onClick={(e) => handleDeleteClick(e, session.sessionId)}
                        title="Delete this chat"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Session ID chip with copy */}
              <div
                className="chat-id-row"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '8px 0 6px' }}
              >
                <span className="chat-history-item-id" style={{ fontFamily: 'monospace', fontSize: '0.75rem', letterSpacing: '0.03em' }}>
                  ID: {session.sessionId}
                </span>
                <button
                  type="button"
                  className={`chat-copy-btn ${copiedId === session.sessionId ? 'chat-copy-btn-success' : ''}`}
                  onClick={(e) => handleCopyId(e, session.sessionId)}
                  title="Copy session ID"
                >
                  {copiedId === session.sessionId ? <Check size={12} /> : <Copy size={12} />}
                  {copiedId === session.sessionId ? 'Copied!' : 'Copy ID'}
                </button>
              </div>

              {/* Preview */}
              <p className="chat-history-item-preview">
                {session.preview || session.messages?.[0]?.content?.slice(0, 100) || 'No preview available'}
              </p>

              {/* Footer tags + Load button */}
              <div className="chat-history-item-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
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

                <button
                  type="button"
                  className="chat-load-btn"
                  onClick={() => onSelectSession(session.sessionId)}
                >
                  {currentSessionId === session.sessionId ? 'Active' : 'Load Chat'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="modal-backdrop" onClick={handleCancelDelete}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3 className="modal-title">Delete Chat?</h3>
              <p className="modal-message">
                Are you sure you want to delete this chat? This action cannot be undone.
              </p>
              <div className="modal-actions">
                <button
                  className="modal-btn modal-btn-cancel"
                  onClick={handleCancelDelete}
                  disabled={deletingId === showDeleteConfirm}
                >
                  Cancel
                </button>
                <button
                  className="modal-btn modal-btn-danger"
                  onClick={() => handleConfirmDelete(showDeleteConfirm)}
                  disabled={deletingId === showDeleteConfirm}
                >
                  {deletingId === showDeleteConfirm ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <style jsx>{`
        .chat-delete-btn {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 4px;
          border-radius: var(--radius-sm);
          transition: var(--transition);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .chat-delete-btn:hover {
          color: var(--danger);
          background: var(--bg-hover);
        }

        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fade-in 0.2s var(--ease-out-expo);
        }

        .modal-content {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: var(--space-6);
          max-width: 400px;
          width: 90%;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: slide-up 0.3s var(--ease-out-expo);
        }

        .modal-title {
          font-family: var(--font-serif);
          font-size: 1.25rem;
          color: var(--text-primary);
          margin: 0 0 var(--space-3) 0;
        }

        .modal-message {
          font-size: 0.9rem;
          color: var(--text-secondary);
          margin: 0 0 var(--space-5) 0;
          line-height: 1.5;
        }

        .modal-actions {
          display: flex;
          gap: var(--space-3);
          justify-content: flex-end;
        }

        .modal-btn {
          padding: var(--space-2) var(--space-4);
          border-radius: var(--radius-sm);
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: var(--transition);
          border: 1px solid var(--border);
        }

        .modal-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .modal-btn-cancel {
          background: var(--bg-secondary);
          color: var(--text-primary);
        }

        .modal-btn-cancel:hover:not(:disabled) {
          background: var(--bg-hover);
        }

        .modal-btn-danger {
          background: var(--danger);
          color: white;
          border-color: var(--danger);
        }

        .modal-btn-danger:hover:not(:disabled) {
          background: #dc2626;
          border-color: #dc2626;
        }
      `}</style>
    </>
  );
}
