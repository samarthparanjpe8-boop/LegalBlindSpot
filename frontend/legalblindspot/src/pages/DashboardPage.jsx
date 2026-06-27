import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
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

export default function DashboardPage({ session, updateCity, updateBudget, setCaseType, addToast, clearSession }) {
  const [activeTab, setActiveTab] = useState('chat');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showSessionDropdown, setShowSessionDropdown] = useState(false);

  const {
    messages,
    isLoading: chatLoading,
    sendMessage,
    detectedCase
  } = useChat(session.sessionId, clearSession);

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

  if (!session.sessionId) {
    return <Navigate to="/onboarding" replace />;
  }

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
    if (text === 'intake') {
      setActiveTab('chat');
      sendMessage('intake');
      return;
    }
    sendMessage(text);
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
            <h2 className="tab-section-title">Matching Advocates</h2>
            {advocatesLoading ? (
              <div className="tab-loading"><Spinner size={32} /></div>
            ) : advocates.length === 0 ? (
              <EmptyState
                icon="👥"
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
    { id: 'chat', label: 'Chat' },
    { id: 'advocates', label: 'Advocates' },
    { id: 'advice', label: 'Advice Check' },
    { id: 'documents', label: 'Documents' },
    { id: 'casefile', label: 'Case File' }
  ];

  return (
    <div className="dashboard-page">
      <header className="dashboard-header-bar">
        <div className="dashboard-header-left">
          <button
            className="mobile-menu-btn"
            onClick={() => setShowMobileSidebar(true)}
          >
            ☰ Menu
          </button>
          <div className="dashboard-logo">
            <span className="logo-icon">⚖</span>
            <span className="logo-text">LegalLink</span>
          </div>
        </div>

        <div className="dashboard-header-right">
          <div className="session-dropdown-container">
            <button
              className={`session-dropdown-trigger ${showSessionDropdown ? 'active' : ''}`}
              onClick={() => setShowSessionDropdown(!showSessionDropdown)}
            >
              <div className="session-trigger-avatar">U</div>
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
                <div className="session-dropdown-menu">
                  <SessionPanel
                    session={session}
                    onCityChange={handleCityChange}
                    onBudgetChange={handleBudgetChange}
                    onRestartSession={clearSession}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="dashboard-layout">
        <aside className={`dashboard-sidebar ${showMobileSidebar ? 'sidebar-mobile-show' : ''}`}>
          <div className="sidebar-mobile-header">
            <h3>Navigation</h3>
            <button className="sidebar-close-btn" onClick={() => setShowMobileSidebar(false)}>
              ×
            </button>
          </div>

          <nav className="sidebar-nav">
            {menuItems.map((item) => (
              <button
                key={item.id}
                className={`nav-item ${activeTab === item.id ? 'nav-item-active' : ''}`}
                onClick={() => {
                  setActiveTab(item.id);
                  setShowMobileSidebar(false);
                }}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {showMobileSidebar && (
          <div className="sidebar-overlay" onClick={() => setShowMobileSidebar(false)} />
        )}

        <main className="dashboard-main-content">
          {renderActiveSection()}
        </main>
      </div>
    </div>
  );
}
