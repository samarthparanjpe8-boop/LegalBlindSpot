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
import ThemeToggle from '../components/shared/ThemeToggle';
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
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [isPromptingBudget, setIsPromptingBudget] = useState(false);
  const [budgetVal, setBudgetVal] = useState('');
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  const {
    messages,
    isLoading: chatLoading,
    sendMessage,
    detectedCase,
    intakeComplete,
    limitReached,
    messagesRemaining,
    cooldownActive,
    clearHistory,
  } = useChat(session.sessionId, user?.id);

  const activeCaseType = session.caseType || detectedCase;

  const advocateCity = (session.city || user?.city || '').trim() || null;

  const {
    advocates,
    isLoading: advocatesLoading,
    error: advocatesError,
  } = useAdvocates(advocateCity, null, null, Boolean(advocateCity));

  useEffect(() => {
    if (!session.sessionId && activeTab === 'documents') {
      setActiveTab('chat');
    }
  }, [session.sessionId, activeTab]);

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
    if (limitReached) {
      addToast('Consultation message limit reached. Start a new chat to continue.', 'info');
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
      clearHistory();
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

  const renderAdvocatesSection = () => (
    <div className="tab-section">
      <h2 className="tab-section-title">
        <Users size={22} className="tab-title-icon" />
        {advocateCity ? `Advocates in ${advocateCity}` : 'City Advocates'}
      </h2>
      {!advocateCity ? (
        <EmptyState
          icon={<Users size={40} />}
          heading="City not set"
          message="Advocates are shown for your city only. Set your city in your profile or start a chat to see local advocates."
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
          message={`No advocates found in ${advocateCity}. Try starting a chat with a different city.`}
        />
      ) : (
        <div className="advocates-grid">
          {sortedAdvocates.map((adv, idx) => (
            <AdvocateCard
              key={adv._id || adv.id || idx}
              advocate={adv}
              userBudget={session.budget}
              animationDelay={idx * 100}
              showConsult={intakeComplete && Boolean(session.sessionId)}
              sessionId={session.sessionId}
              caseType={activeCaseType}
              city={session.city || advocateCity}
              caseSummary={messages
                .filter((m) => m.role === 'user')
                .map((m) => m.content)
                .join('\n')
                .slice(0, 800)}
              onRequestSent={() => addToast('Consultation request sent successfully', 'success')}
            />
          ))}
        </div>
      )}
    </div>
  );

  const renderActiveSection = () => {
    if (activeTab === 'history') {
      return (
        <ChatHistoryPanel
          userId={user?.id}
          currentSessionId={session.sessionId}
          onSelectSession={handleSelectHistorySession}
        />
      );
    }

    if (activeTab === 'advocates') {
      return renderAdvocatesSection();
    }

    if (activeTab === 'advice') {
      return <AdviceCheckPanel caseType={activeCaseType} />;
    }

    if (activeTab === 'documents') {
      if (!session.sessionId) {
        return (
          <EmptyState
            icon={<CheckSquare size={40} />}
            heading="Start a chat first"
            message="Document checklists are generated after you begin a consultation. Click Start Chat to get your customized list."
          />
        );
      }
      return (
        <DocumentChecklist
          caseType={activeCaseType}
          sessionId={session.sessionId}
        />
      );
    }

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

    if (activeTab === 'chat') {
      return (
        <ChatWindow
          messages={messages}
          isLoading={chatLoading}
          onSend={handleSend}
          intakeComplete={intakeComplete}
          limitReached={limitReached}
          messagesRemaining={messagesRemaining}
          cooldownActive={cooldownActive}
        />
      );
    }

    return null;
  };

  const menuItems = [
    { id: 'chat', label: 'Chat', icon: <MessageSquare size={18} /> },
    { id: 'history', label: 'Chat History', icon: <History size={18} /> },
    { id: 'advocates', label: 'Advocates', icon: <Users size={18} /> },
    { id: 'advice', label: 'Advice Check', icon: <Sparkles size={18} /> },
    ...(session.sessionId
      ? [{ id: 'documents', label: 'Documents', icon: <CheckSquare size={18} /> }]
      : []),
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
          <div className="profile-dropdown-container">
            <button
              type="button"
              className={`profile-dropdown-trigger glass-card-sm ${showProfileDropdown ? 'active' : ''}`}
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              aria-label="Open profile menu"
            >
              <div className="profile-trigger-avatar">
                <User size={18} />
              </div>
            </button>

            {showProfileDropdown && (
              <>
                <div
                  className="profile-dropdown-backdrop"
                  onClick={() => setShowProfileDropdown(false)}
                />
                <div className="profile-dropdown-panel">
                  <div className="profile-dropdown-header">
                    <div className="profile-dropdown-avatar">
                      <User size={20} />
                    </div>
                    <div className="profile-dropdown-info">
                      <span className="profile-dropdown-name">{user?.name || 'User'}</span>
                      <span className="profile-dropdown-email">{user?.email}</span>
                      {user?.city && (
                        <span className="profile-dropdown-city">{user.city}</span>
                      )}
                    </div>
                  </div>

                  {session.sessionId ? (
                    <div className="profile-dropdown-session">
                      <SessionPanel
                        session={session}
                        onCityChange={handleCityChange}
                        onBudgetChange={handleBudgetChange}
                        onLogout={handleLogoutClick}
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="profile-logout-btn"
                      onClick={handleLogoutClick}
                    >
                      <LogOut size={16} />
                      Log out
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="dashboard-layout">
        <div className="dashboard-sidebar-rail">
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
                  <span className="nav-item-icon"><Plus size={18} /></span>
                  <span className="nav-item-label">New Chat</span>
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
                  <span className="nav-item-icon">{item.icon}</span>
                  <span className="nav-item-label">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="sidebar-footer">
            <ThemeToggle />
            <button onClick={handleLogoutClick} className="sidebar-logout-link">
              <span className="nav-item-icon"><LogOut size={18} /></span>
              <span className="nav-item-label">Log out</span>
            </button>
          </div>
        </aside>
        </div>

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
