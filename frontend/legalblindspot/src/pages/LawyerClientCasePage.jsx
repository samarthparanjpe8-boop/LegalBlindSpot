import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  MapPin,
  IndianRupee,
  Briefcase,
  Clock,
  MessageSquare,
  FileText,
  StickyNote,
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  Plus,
  Trash2,
  Edit2,
  Check,
  MessageCircle,
} from 'lucide-react';
import LawyerLayout, { StatusBadge, formatRequestDate } from '../components/lawyer/LawyerLayout';
import Spinner from '../components/shared/Spinner';
import EmptyState from '../components/shared/EmptyState';
import ChatMessage from '../components/chat/ChatMessage';
import CaseChat from '../components/shared/CaseChat';
import { formatCurrency } from '../utils/formatters';
import * as api from '../services/api';
import { useAuth } from '../context/AuthContext';

const CASE_STATUSES = [
  'Pending', 'Accepted', 'In Progress', 'Waiting for Documents', 'Filed', 'Resolved', 'Closed',
];

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function LawyerClientCasePage() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [caseData, setCaseData] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const [expandedSessions, setExpandedSessions] = useState({});
  const [newNote, setNewNote] = useState('');
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [detail, chatSessions, caseNotes] = await Promise.all([
        api.getCaseRequest(requestId),
        api.getCaseChatSessions(requestId).catch(() => []),
        api.getCaseNotes(requestId).catch(() => []),
      ]);
      setCaseData(detail);
      setSessions(chatSessions || []);
      setNotes(caseNotes || []);
      if (chatSessions?.length) {
        setExpandedSessions({ [chatSessions[0].sessionId]: true });
      }
    } catch (err) {
      alert(err.message);
      navigate('/lawyer');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [requestId]);

  const handleStatusChange = async (caseStatus) => {
    setStatusUpdating(true);
    try {
      await api.updateCaseStatus(requestId, caseStatus);
      await loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    await api.createCaseNote(requestId, newNote.trim());
    setNewNote('');
    const updated = await api.getCaseNotes(requestId);
    setNotes(updated);
  };

  const handleUpdateNote = async (noteId) => {
    if (!editContent.trim()) return;
    await api.updateCaseNote(requestId, noteId, editContent.trim());
    setEditingNoteId(null);
    const updated = await api.getCaseNotes(requestId);
    setNotes(updated);
  };

  const handleDeleteNote = async (noteId) => {
    if (!confirm('Delete this note?')) return;
    await api.deleteCaseNote(requestId, noteId);
    setNotes((prev) => prev.filter((n) => n._id !== noteId));
  };

  const toggleSession = (sessionId) => {
    setExpandedSessions((prev) => ({ ...prev, [sessionId]: !prev[sessionId] }));
  };

  const renderContent = () => {
    if (loading) return <div className="tab-loading"><Spinner size={32} /></div>;
    if (!caseData) return null;

    const client = caseData.client || {};
    const attachments = caseData.attachments || [];
    const caseFiles = caseData.caseFiles || [];
    const allDocs = [
      ...attachments.map((a) => ({ name: a.filename, url: `${BASE_URL}/uploads/${a.storedName || a.filename}`, type: 'request' })),
      ...caseFiles.flatMap((cf) =>
        (cf.documentsUploaded || []).map((d) => ({ name: d, type: 'casefile' }))
      ),
    ];

    switch (activeSection) {
      case 'chat':
        return (
          <div className="tab-section">
            <h2 className="tab-section-title"><MessageSquare size={22} className="tab-title-icon" /> Chat History</h2>
            {!sessions.length ? (
              <EmptyState icon={<MessageSquare size={40} />} heading="No chat sessions" message="Client chat history will appear here." />
            ) : (
              <div className="lawyer-chat-sessions">
                {sessions.map((session) => (
                  <div key={session.sessionId} className="lawyer-chat-session glass-card">
                    <button type="button" className="lawyer-chat-session-header" onClick={() => toggleSession(session.sessionId)}>
                      <div>
                        <strong>{session.caseType || 'Consultation'}</strong>
                        <span>Session {session.sessionId} · {session.messageCount} messages</span>
                        {session.isPrimary && <span className="lawyer-primary-badge">Primary</span>}
                      </div>
                      {expandedSessions[session.sessionId] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                    {expandedSessions[session.sessionId] && (
                      <div className="lawyer-chat-messages">
                        {(session.messages || []).map((msg, i) => (
                          <ChatMessage
                            key={i}
                            message={{
                              id: i,
                              role: msg.role,
                              content: msg.content,
                              timestamp: msg.timestamp,
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'realtime-chat':
        return (
          <div className="tab-section realtime-chat-section">
            <h2 className="tab-section-title"><MessageCircle size={22} className="tab-title-icon" /> Real-Time Chat</h2>
            {caseData?.caseStatus === 'Rejected' ? (
              <EmptyState 
                icon={<MessageCircle size={40} />} 
                heading="Chat not available" 
                message="This case has been rejected. Chat is not available." 
              />
            ) : caseData?.caseStatus === 'Closed' ? (
              <EmptyState 
                icon={<MessageCircle size={40} />} 
                heading="Chat not available" 
                message="This case has been closed. Chat is not available." 
              />
            ) : (
              <div className="realtime-chat-container">
                <CaseChat 
                  requestId={requestId} 
                  token={token} 
                  currentUserId={user?.id} 
                  currentRole="lawyer" 
                />
              </div>
            )}
          </div>
        );

      case 'documents':
        return (
          <div className="tab-section">
            <h2 className="tab-section-title"><FileText size={22} className="tab-title-icon" /> Documents</h2>
            {!allDocs.length ? (
              <EmptyState icon={<FileText size={40} />} heading="No documents" message="Uploaded documents will appear here." />
            ) : (
              <div className="lawyer-doc-list">
                {allDocs.map((doc, i) => (
                  <div key={i} className="lawyer-doc-item glass-card-sm">
                    <FileText size={18} />
                    <span>{doc.name}</span>
                    {doc.url && (
                      <div className="lawyer-doc-actions">
                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="lawyer-btn-icon" title="Preview">
                          <Eye size={16} />
                        </a>
                        <a href={doc.url} download className="lawyer-btn-icon" title="Download">
                          <Download size={16} />
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'notes':
        return (
          <div className="tab-section">
            <h2 className="tab-section-title"><StickyNote size={22} className="tab-title-icon" /> Private Notes</h2>
            <form onSubmit={handleAddNote} className="lawyer-note-form glass-card">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a private note..."
                rows={3}
                className="consult-textarea"
              />
              <button type="submit" className="lawyer-btn-primary"><Plus size={16} /> Add Note</button>
            </form>
            <div className="lawyer-notes-list">
              {notes.map((note) => (
                <div key={note._id} className="lawyer-note-item glass-card-sm">
                  {editingNoteId === note._id ? (
                    <>
                      <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={3} className="consult-textarea" />
                      <div className="lawyer-note-actions">
                        <button type="button" onClick={() => handleUpdateNote(note._id)} className="lawyer-btn-icon"><Check size={16} /></button>
                        <button type="button" onClick={() => setEditingNoteId(null)} className="lawyer-btn-icon">Cancel</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p>{note.content}</p>
                      <div className="lawyer-note-meta">
                        <span>{formatRequestDate(note.updatedAt || note.createdAt)}</span>
                        <div className="lawyer-note-actions">
                          <button type="button" onClick={() => { setEditingNoteId(note._id); setEditContent(note.content); }} className="lawyer-btn-icon"><Edit2 size={14} /></button>
                          <button type="button" onClick={() => handleDeleteNote(note._id)} className="lawyer-btn-icon"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div className="lawyer-case-overview">
            <div className="lawyer-case-info glass-card">
              <h2 className="tab-section-title"><User size={22} className="tab-title-icon" /> Client Information</h2>
              <div className="lawyer-info-grid">
                <div><span>Name</span><strong>{client.name || '--'}</strong></div>
                <div><span>Gender</span><strong>{caseData.clientGender || client.gender || '--'}</strong></div>
                <div><span>City</span><strong>{caseData.city}</strong></div>
                <div><span>Budget</span><strong>{formatCurrency(caseData.budgetInr)}</strong></div>
                <div><span>Case Category</span><strong>{caseData.caseType}</strong></div>
                <div><span>Status</span><StatusBadge status={caseData.caseStatus} /></div>
              </div>

              <div className="lawyer-status-select">
                <label>Update Case Status</label>
                <select
                  value={caseData.caseStatus}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={statusUpdating}
                  className="session-edit-select"
                >
                  {CASE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="lawyer-case-summary glass-card">
              <h3>AI Summary</h3>
              <p>{caseData.aiSummary || caseData.description}</p>
            </div>

            <div className="lawyer-timeline glass-card">
              <h3><Clock size={18} /> Case Timeline</h3>
              <div className="lawyer-timeline-list">
                {(caseData.timeline || []).map((event, i) => (
                  <div key={i} className="lawyer-timeline-item">
                    <div className="lawyer-timeline-dot" />
                    <div className="lawyer-timeline-content">
                      <strong>{event.event}</strong>
                      <span>{formatRequestDate(event.timestamp)}</span>
                      {event.description && <p>{event.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
    }
  };

  const subNav = [
    { id: 'overview', label: 'Overview', icon: <User size={16} /> },
    { id: 'chat', label: 'Chat History', icon: <MessageSquare size={16} /> },
    { id: 'realtime-chat', label: 'Real-Time Chat', icon: <MessageCircle size={16} /> },
    { id: 'documents', label: 'Documents', icon: <FileText size={16} /> },
    { id: 'notes', label: 'Notes', icon: <StickyNote size={16} /> },
  ];

  return (
    <LawyerLayout activeTab="" onTabChange={() => navigate('/lawyer')}>
      <div className="lawyer-case-page">
        <button type="button" className="lawyer-back-btn" onClick={() => navigate('/lawyer')}>
          <ArrowLeft size={18} /> Back to Dashboard
        </button>

        {caseData && (
          <div className="lawyer-case-header glass-card">
            <div>
              <h1>{caseData.client?.name || 'Client Case'}</h1>
              <div className="lawyer-case-header-meta">
                <span><Briefcase size={14} /> {caseData.caseType}</span>
                <span><MapPin size={14} /> {caseData.city}</span>
                <span><IndianRupee size={14} /> {formatCurrency(caseData.budgetInr)}</span>
              </div>
            </div>
            <StatusBadge status={caseData.caseStatus} />
          </div>
        )}

        <nav className="lawyer-case-nav">
          {subNav.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`lawyer-case-nav-item ${activeSection === item.id ? 'active' : ''}`}
              onClick={() => setActiveSection(item.id)}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        {renderContent()}
      </div>
    </LawyerLayout>
  );
}
