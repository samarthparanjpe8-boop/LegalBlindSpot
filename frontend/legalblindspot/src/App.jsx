import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import OnboardingPage from './pages/OnboardingPage';
import DashboardPage from './pages/DashboardPage';
import { useSession } from './hooks/useSession';
import './App.css';

export default function App() {
  const { session, createSession, updateCity, updateBudget, setCaseType } = useSession();
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  return (
    <BrowserRouter>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/onboarding"
            element={
              session.sessionId ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <OnboardingPage createSession={createSession} />
              )
            }
          />
          <Route
            path="/dashboard"
            element={
              <DashboardPage
                session={session}
                updateCity={updateCity}
                updateBudget={updateBudget}
                setCaseType={setCaseType}
                addToast={addToast}
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <div className="toast-container">
          {toasts.map((t) => (
            <div key={t.id} className={`toast toast-${t.type}`}>
              <span className="toast-icon">
                {t.type === 'success' && '✓'}
                {t.type === 'error' && '✕'}
                {t.type === 'info' && 'ℹ'}
                {t.type === 'warning' && '⚠'}
              </span>
              <span className="toast-message">{t.message}</span>
            </div>
          ))}
        </div>
      </div>
    </BrowserRouter>
  );
}
