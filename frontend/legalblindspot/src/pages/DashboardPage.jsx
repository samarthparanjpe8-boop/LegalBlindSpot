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

export default function DashboardPage({ session, updateCity, updateBudget, setCaseType, addToast }) {
  const [activeTab, setActiveTab] = useState('chat');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  if (!session.sessionId) {
    return <Navigate to="/onboarding" replace />;
  }

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
  const topAdvocates = sortedAdvocates.slice(0, 3);

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
    { id: 'viability', label: 'Case Viability' },
    { id: 'advice', label: 'Advice Check' },
    { id: 'documents', label: 'Documents' },
    { id: 'casefile', label: 'Case File' },
    { id: 'leaderboard', label: 'Leaderboard' }
  ];

  return (
    <div className="dashboard-page">
      <header className="dashboard-header-bar">
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
      </header>

      <div className="dashboard-layout">
        <aside className={`dashboard-sidebar ${showMobileSidebar ? 'sidebar-mobile-show' : ''}`}>
          <div className="sidebar-mobile-header">
            <h3>Navigation</h3>
            <button className="sidebar-close-btn" onClick={() => setShowMobileSidebar(false)}>
              ×
            </button>
          </div>

          <SessionPanel
            session={session}
            onCityChange={handleCityChange}
            onBudgetChange={handleBudgetChange}
          />

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

        <aside className="dashboard-right-panel">
          <h3 className="right-panel-heading">Matching Advocates</h3>
          <div className="right-panel-list">
            {advocatesLoading ? (
              <div className="right-panel-loading"><Spinner size={24} /></div>
            ) : topAdvocates.length === 0 ? (
              <div className="right-panel-empty">No matching advocates found.</div>
            ) : (
              topAdvocates.map((adv, idx) => (
                <AdvocateCard
                  key={adv._id || adv.id || idx}
                  advocate={adv}
                  userBudget={session.budget}
                  compact={true}
                  animationDelay={idx * 100}
                />
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
