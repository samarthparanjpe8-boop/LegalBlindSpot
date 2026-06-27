import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SessionPanel from '../components/dashboard/SessionPanel';
import ChatWindow from '../components/chat/ChatWindow';
import AdvocateCard from '../components/advocates/AdvocateCard';
import ViabilityCard from '../components/dashboard/ViabilityCard';
import AdviceCheckPanel from '../components/dashboard/AdviceCheckPanel';
import DocumentChecklist from '../components/dashboard/DocumentChecklist';
import CaseFileSummary from '../components/dashboard/CaseFileSummary';
import AdvocateLeaderboard from '../components/advocates/AdvocateLeaderboard';
import Spinner from '../components/shared/Spinner';
import EmptyState from '../components/shared/EmptyState';
import { useChat } from '../hooks/useChat';
import { useAdvocates } from '../hooks/useAdvocates';
import { 
  MessageSquare, 
  Users, 
  CheckSquare, 
  FileText, 
  Compass, 
  LogOut, 
  Plus, 
  X, 
  Coins, 
  MapPin, 
  User,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Settings
} from 'lucide-react';

const BUDGETS = [500, 1000, 2000, 3000, 5000];

export default function DashboardPage({ session, updateCity, updateBudget, setCaseType, addToast, clearSession, createSession }) {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('chat');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showSessionDropdown, setShowSessionDropdown] = useState(false);
  const [isPromptingBudget, setIsPromptingBudget] = useState(false);
  const [budgetVal, setBudgetVal] = useState('');
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  const {
    messages,
    isLoading: chatLoading,
    sendMessage,
    detectedCase
  } = useChat(session.sessionId);

  const activeCaseType = session.caseType || detectedCase;

  const {
    advocates,
    isLoading: advocatesLoading
  } = useAdvocates(session.city, activeCaseType, session.budget);

  useEffect(() => {
    if (detectedCase && detectedCase !== session.caseType) {
      setCaseType(detectedCase);
      addToast(`Case detected: ${detectedCase}`, 'info');
    }
  }, [detectedCase, session.caseType, setCaseType, addToast]);

  const handleCityChange = async (city) => {
    try {
      await updateCity(city);
      addToast('Session city updated', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleBudgetChange = async (budget) => {
    try {
      await updateBudget(budget);
      addToast('Session budget updated', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleSend = async (text) => {
    if (!session.sessionId) {
      setIsPromptingBudget(true);
      return;
    }
    if (text === 'intake') {
      setActiveTab('chat');
      sendMessage('intake');
      return;
    }
    sendMessage(text);
  };

  const handleStartNewChatClick = () => {
    setIsPromptingBudget(true);
  };

  const handleNewChatSubmit = async (e) => {
    e.preventDefault();
    if (!budgetVal || isCreatingSession) return;
    setIsCreatingSession(true);
    try {
      // Clear old session
      clearSession();
      // Create new session using user's saved city and selected budget
      const targetCity = session.city || user?.city || 'Mumbai';
      await createSession(targetCity, Number(budgetVal));
      setIsPromptingBudget(false);
      setBudgetVal('');
      setActiveTab('chat');
      addToast('New session started', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to start session', 'error');
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handleLogoutClick = () => {
    clearSession();
    logout();
  };

  const sortedAdvocates = [...advocates].sort((a, b) => {
    const scoreA = a.trustScore ?? 0;
    const scoreB = b.trustScore ?? 0;
    return scoreB - scoreA;
  });

  const getChatHistorySummary = () => {
    return messages
      .filter(m => m.role === 'user')
      .map(m => m.content)
      .join('\n');
  };

  const renderActiveSection = () => {
    if (!session.sessionId) {
      return (
        <div className="empty-chat-welcome" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          padding: '40px',
          textAlign: 'center',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          <div style={{
            background: 'var(--accent-dim)',
            color: 'var(--accent)',
            padding: '20px',
            borderRadius: '50%',
            marginBottom: '24px'
          }}>
            <MessageSquare size={48} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', marginBottom: '16px' }}>Begin a Consultation</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', lineHeight: '1.6' }}>
            Consult with LegalLink AI to assess case viability, generate a customized document checklist, verify advice, and match with the top trusted advocates in {session.city || user?.city || 'your city'}.
          </p>
          <button 
            onClick={handleStartNewChatClick}
            className="hero-cta-btn"
            style={{
              padding: '14px 28px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Plus size={18} />
            Start Chat
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'chat':
        return (
          <ChatWindow
            messages={messages}
            isLoading={chatLoading}
            onSend={handleSend}
          />
        );
      case 'advocates':
        return (
          <div className="tab-section">
            <h2 className="tab-section-title" style={{ fontFamily: 'var(--font-serif)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={22} style={{ color: 'var(--accent)' }} />
              Matching Advocates
            </h2>
            {advocatesLoading ? (
              <div className="tab-loading"><Spinner size={32} /></div>
            ) : advocates.length === 0 ? (
              <EmptyState
                icon={<Users size={40} />}
                heading="No advocates found"
                message="No matching advocates found for your budget and city. Try increasing your budget or changing city."
              />
            ) : (
              <div className="advocates-grid">
                {sortedAdvocates.map((adv, idx) => (
                  <AdvocateCard
                    key={adv._id || adv.id || idx}
                    advocate={adv}
                    userBudget={session.budget}
                    animationDelay={idx * 100}
                  />
                ))}
              </div>
            )}
          </div>
        );
      case 'viability':
        return (
          <ViabilityCard
            caseType={activeCaseType}
            sessionDescription={getChatHistorySummary()}
          />
        );
      case 'advice':
        return (
          <AdviceCheckPanel
            caseType={activeCaseType}
          />
        );
      case 'documents':
        return (
          <DocumentChecklist
            caseType={activeCaseType}
            sessionId={session.sessionId}
          />
        );
      case 'casefile':
        return (
          <CaseFileSummary
            sessionId={session.sessionId}
          />
        );
      case 'leaderboard':
        return (
          <AdvocateLeaderboard />
        );
      default:
        return null;
    }
  };

  const menuItems = [
    { id: 'chat', label: 'Chat', icon: <MessageSquare size={18} /> },
    { id: 'advocates', label: 'Advocates', icon: <Users size={18} /> },
    { id: 'advice', label: 'Advice Check', icon: <Sparkles size={18} /> },
    { id: 'documents', label: 'Documents', icon: <CheckSquare size={18} /> },
    { id: 'casefile', label: 'Case File', icon: <FileText size={18} /> },
    { id: 'leaderboard', label: 'Leaderboard', icon: <Compass size={18} /> }
  ];

  return (
    <div className="dashboard-page" style={{ background: 'var(--bg-primary)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header className="dashboard-header-bar" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
        <div className="dashboard-header-left">
          <button
            className="mobile-menu-btn"
            onClick={() => setShowMobileSidebar(true)}
            style={{ color: 'var(--text-primary)' }}
          >
            ☰
          </button>
          <div className="dashboard-logo">
            <span className="logo-icon" style={{ color: 'var(--accent)' }}>⚖</span>
            <span className="logo-text" style={{ fontFamily: 'var(--font-serif)' }}>LegalLink</span>
          </div>
        </div>

        <div className="dashboard-header-right">
          {session.sessionId && (
            <div className="session-dropdown-container">
              <button
                className={`session-dropdown-trigger ${showSessionDropdown ? 'active' : ''}`}
                onClick={() => setShowSessionDropdown(!showSessionDropdown)}
                style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)'
                }}
              >
                <div className="session-trigger-avatar" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
                  <User size={16} />
                </div>
                <div className="session-trigger-info">
                  <span className="session-trigger-label" style={{ color: 'var(--text-secondary)' }}>Your Session</span>
                  <span className="session-trigger-value" style={{ color: 'var(--text-primary)' }}>
                    {session.city || 'Select City'} • ₹{session.budget?.toLocaleString('en-IN') || '0'}
                  </span>
                </div>
                <span className="session-trigger-arrow" style={{ color: 'var(--text-secondary)' }}>▼</span>
              </button>

              {showSessionDropdown && (
                <>
                  <div className="session-dropdown-backdrop" onClick={() => setShowSessionDropdown(false)} />
                  <div className="session-dropdown-menu" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                    <SessionPanel
                      session={session}
                      onCityChange={handleCityChange}
                      onBudgetChange={handleBudgetChange}
                      onRestartSession={handleStartNewChatClick}
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="dashboard-layout" style={{ flex: 1, display: 'flex' }}>
        <aside className={`dashboard-sidebar ${showMobileSidebar ? 'sidebar-mobile-show' : ''}`} style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="sidebar-mobile-header" style={{ borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)' }}>Navigation</h3>
              <button className="sidebar-close-btn" onClick={() => setShowMobileSidebar(false)} style={{ color: 'var(--text-primary)' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '16px' }}>
              <button 
                onClick={handleStartNewChatClick}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: 'var(--accent)',
                  color: 'var(--text-primary)',
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  fontSize: '0.8rem',
                  letterSpacing: '0.05em',
                  transition: 'var(--transition)'
                }}
                className="new-chat-btn"
              >
                <Plus size={16} />
                New Chat
              </button>
            </div>

            <nav className="sidebar-nav" style={{ padding: '0 8px' }}>
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  className={`nav-item ${activeTab === item.id ? 'nav-item-active' : ''}`}
                  onClick={() => {
                    setActiveTab(item.id);
                    setShowMobileSidebar(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-sm)',
                    color: activeTab === item.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                    background: activeTab === item.id ? 'var(--bg-primary)' : 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    fontSize: '0.9rem',
                    transition: 'var(--transition)'
                  }}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
            <button
              onClick={handleLogoutClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-secondary)',
                border: 'none',
                textAlign: 'left',
                fontSize: '0.9rem',
                transition: 'var(--transition)',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.target.style.color = 'var(--text-primary)'}
              onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
            >
              <LogOut size={18} />
              Logout / Back to Login
            </button>
          </div>
        </aside>

        {showMobileSidebar && (
          <div className="sidebar-overlay" onClick={() => setShowMobileSidebar(false)} />
        )}

        <main className="dashboard-main-content" style={{ background: 'var(--bg-primary)', flex: 1, padding: '24px', overflowY: 'auto' }}>
          {renderActiveSection()}
        </main>
      </div>

      {/* Budget Selector Modal */}
      {isPromptingBudget && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '40px',
            width: '100%',
            maxWidth: '440px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
            position: 'relative'
          }}>
            <button 
              onClick={() => setIsPromptingBudget(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                color: 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>

            <form onSubmit={handleNewChatSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  display: 'inline-flex',
                  background: 'var(--accent-dim)',
                  color: 'var(--accent)',
                  padding: '12px',
                  borderRadius: '50%',
                  marginBottom: '16px'
                }}>
                  <Coins size={24} />
                </div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: '8px' }}>Set Session Budget</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.4' }}>
                  Define your maximum consultation budget. This will filter advocates accordingly.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="budget-input-wrapper" style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <span className="currency-prefix" style={{
                    position: 'absolute',
                    left: '16px',
                    color: 'var(--text-secondary)',
                    fontWeight: '600'
                  }}>₹</span>
                  <input
                    type="number"
                    value={budgetVal}
                    onChange={(e) => setBudgetVal(e.target.value)}
                    placeholder="e.g. 2000"
                    min="1"
                    required
                    style={{
                      width: '100%',
                      padding: '12px 12px 12px 32px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {BUDGETS.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBudgetVal(b.toString())}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 'var(--radius-full)',
                      border: budgetVal === b.toString() ? '1px solid var(--accent)' : '1px solid var(--border)',
                      background: budgetVal === b.toString() ? 'var(--accent-dim)' : 'var(--bg-primary)',
                      color: budgetVal === b.toString() ? 'var(--accent)' : 'var(--text-primary)',
                      fontSize: '0.85rem',
                      fontWeight: '500',
                      transition: 'var(--transition)'
                    }}
                  >
                    ₹{b}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={isCreatingSession}
                style={{
                  background: 'var(--accent)',
                  color: 'var(--text-primary)',
                  padding: '14px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                {isCreatingSession ? 'Starting Session...' : 'Start Session'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

