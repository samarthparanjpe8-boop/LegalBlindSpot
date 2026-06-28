import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import SessionPanel from '../components/dashboard/SessionPanel';
import ChatWindow from '../components/chat/ChatWindow';
import AdvocateCard from '../components/advocates/AdvocateCard';
import AdviceCheckPanel from '../components/dashboard/AdviceCheckPanel';
import DocumentChecklist from '../components/dashboard/DocumentChecklist';
import ChatHistoryPanel from '../components/dashboard/ChatHistoryPanel';
import Spinner from '../components/shared/Spinner';
import EmptyState from '../components/shared/EmptyState';
import { useChat } from '../hooks/useChat';
import { useAdvocates } from '../hooks/useAdvocates';
import {
  MessageSquare,
  Users,
  CheckSquare,
  LogOut,
  Plus,
  X,
  Coins,
  User,
  Sparkles,
  History,
} from 'lucide-react';

const BUDGETS = [500, 1000, 2000, 3000, 5000];

export default function DashboardPage({
  session,
  updateCity,
  updateBudget,
  setCaseType,
  addToast,
  clearSession,
  createSession,
  switchSession,
}) {
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
    detectedCase,
    intakeComplete,
  } = useChat(session.sessionId, user?.id);

  const activeCaseType = session.caseType || detectedCase;

  const {
    advocates,
    isLoading: advocatesLoading,
    error: advocatesError,
  } = useAdvocates(session.city, activeCaseType, session.budget, intakeComplete);

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
      const targetCity = session.city || user?.city || 'Mumbai';
      await createSession(targetCity, Number(budgetVal));
      setIsPromptingBudget(false);
      setBudgetVal('');
      setActiveTab('chat');
      addToast('New consultation started', 'success');
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

  const handleSelectHistorySession = async (sessionId) => {
    try {
      await switchSession(sessionId);
      setActiveTab('chat');
      addToast('Session loaded from history', 'info');
    } catch (err) {
      addToast(err.message || 'Failed to load session', 'error');
    }
  };

  const sortedAdvocates = [...advocates].sort((a, b) => {
    const scoreA = a.trustScore ?? 0;
    const scoreB = b.trustScore ?? 0;
    return scoreB - scoreA;
  });

  const renderActiveSection = () => {
    if (!session.sessionId) {
      return (
        <div className="empty-chat-welcome glass-card">
          <div className="empty-chat-icon">
            <MessageSquare size={48} />
          </div>
          <h2 className="empty-chat-title">Begin a Consultation</h2>
          <p className="empty-chat-desc">
            Consult with LegalLink AI to assess case viability, generate a customized document checklist, verify advice, and match with trusted advocates in {session.city || user?.city || 'your city'}.
          </p>
          <button onClick={handleStartNewChatClick} className="hero-cta-btn dashboard-start-btn">
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
            intakeComplete={intakeComplete}
          />
        );
      case 'history':
        return (
          <ChatHistoryPanel
            userId={user?.id}
            currentSessionId={session.sessionId}
            onSelectSession={handleSelectHistorySession}
          />
        );
      case 'advocates':
        return (
          <div className="tab-section">
            <h2 className="tab-section-title">
              <Users size={22} className="tab-title-icon" />
              Matching Advocates
            </h2>
            {!intakeComplete ? (
              <EmptyState
                icon={<Users size={40} />}
                heading="Complete your consultation first"
                message="Advocates will appear once you have shared all details about your case — what happened, your evidence, and case-specific information."
              />
            ) : advocatesLoading ? (
              <div className="tab-loading"><Spinner size={32} /></div>
            ) : advocatesError ? (
              <EmptyState
                icon={<Users size={40} />}
                heading="Unable to load advocates"
                message={advocatesError}
              />
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
      case 'advice':
        return <AdviceCheckPanel caseType={activeCaseType} />;
      case 'documents':
        return (
          <DocumentChecklist
            caseType={activeCaseType}
            sessionId={session.sessionId}
          />
        );
      default:
        return null;
    }
  };

  const menuItems = [
    { id: 'chat', label: 'Chat', icon: <MessageSquare size={18} /> },
    { id: 'history', label: 'Chat History', icon: <History size={18} /> },
    { id: 'advocates', label: 'Advocates', icon: <Users size={18} /> },
    { id: 'advice', label: 'Advice Check', icon: <Sparkles size={18} /> },
    { id: 'documents', label: 'Documents', icon: <CheckSquare size={18} /> },
  ];

  return (
    <div className="dashboard-page">
      <header className="dashboard-header-bar glass-panel">
        <div className="dashboard-header-left">
          <button
            className="mobile-menu-btn"
            onClick={() => setShowMobileSidebar(true)}
          >
            ☰
          </button>
          <div className="dashboard-logo">
            <span className="logo-icon">⚖</span>
            <span className="logo-text">LegalLink</span>
          </div>
        </div>

        <div className="dashboard-header-right">
          {session.sessionId && (
            <div className="session-dropdown-container">
              <button
                className={`session-dropdown-trigger glass-card-sm ${showSessionDropdown ? 'active' : ''}`}
                onClick={() => setShowSessionDropdown(!showSessionDropdown)}
              >
                <div className="session-trigger-avatar">
                  <User size={16} />
                </div>
                <div className="session-trigger-info">
                  <span className="session-trigger-label">Your Session</span>
                  <span className="session-trigger-value">
                    {session.city || 'Select City'} • ₹{session.budget?.toLocaleString('en-IN') || '0'}
                  </span>
                </div>
                <span className="session-trigger-arrow">▼</span>
              </button>

              {showSessionDropdown && (
                <>
                  <div className="session-dropdown-backdrop" onClick={() => setShowSessionDropdown(false)} />
                  <div className="session-dropdown-panel">
                    <SessionPanel
                      session={session}
                      onCityChange={handleCityChange}
                      onBudgetChange={handleBudgetChange}
                      onLogout={handleLogoutClick}
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="dashboard-layout">
        <aside className={`dashboard-sidebar glass-panel ${showMobileSidebar ? 'sidebar-mobile-show' : ''}`}>
          <div>
            <div className="sidebar-mobile-header">
              <h3>Navigation</h3>
              <button className="sidebar-close-btn" onClick={() => setShowMobileSidebar(false)}>
                <X size={20} />
              </button>
            </div>

            <nav className="sidebar-nav">
              {session.sessionId && (
                <button
                  type="button"
                  className="nav-item nav-item-new-chat"
                  onClick={() => {
                    handleStartNewChatClick();
                    setShowMobileSidebar(false);
                  }}
                >
                  <Plus size={18} />
                  New Chat
                </button>
              )}
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  className={`nav-item ${activeTab === item.id ? 'nav-item-active' : ''}`}
                  onClick={() => {
                    setActiveTab(item.id);
                    setShowMobileSidebar(false);
                  }}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="sidebar-footer">
            <button onClick={handleLogoutClick} className="sidebar-logout-link">
              <LogOut size={18} />
              Log out
            </button>
          </div>
        </aside>

        {showMobileSidebar && (
          <div className="sidebar-overlay" onClick={() => setShowMobileSidebar(false)} />
        )}

        <main className="dashboard-main-content">
          {renderActiveSection()}
        </main>
      </div>

      {isPromptingBudget && (
        <div className="budget-modal-overlay">
          <div className="budget-modal glass-panel">
            <button className="budget-modal-close" onClick={() => setIsPromptingBudget(false)}>
              <X size={20} />
            </button>

            <form onSubmit={handleNewChatSubmit} className="budget-modal-form">
              <div className="budget-modal-header">
                <div className="budget-modal-icon">
                  <Coins size={24} />
                </div>
                <h3 className="budget-modal-title">
                  {session.sessionId ? 'New Consultation' : 'Set Session Budget'}
                </h3>
                <p className="budget-modal-desc">
                  {session.sessionId
                    ? 'Set a budget for this new consultation. Your city and previous chats will be preserved.'
                    : 'Define your maximum consultation budget. This will filter advocates accordingly.'}
                </p>
              </div>

              <div className="budget-input-wrapper">
                <span className="currency-prefix">₹</span>
                <input
                  type="number"
                  value={budgetVal}
                  onChange={(e) => setBudgetVal(e.target.value)}
                  placeholder="e.g. 2000"
                  min="1"
                  required
                  className="budget-input"
                />
              </div>

              <div className="budget-chips">
                {BUDGETS.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBudgetVal(b.toString())}
                    className={`budget-chip ${budgetVal === b.toString() ? 'budget-chip-active' : ''}`}
                  >
                    ₹{b}
                  </button>
                ))}
              </div>

              <button type="submit" disabled={isCreatingSession} className="budget-submit-btn">
                {isCreatingSession ? 'Starting...' : session.sessionId ? 'Start New Chat' : 'Start Session'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
