import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import OnboardingPage from './pages/OnboardingPage';
import DashboardPage from './pages/DashboardPage';
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import MagicLinkHandler from './pages/MagicLinkHandler';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import LawyerDashboard from './pages/LawyerDashboard';
import LawyerClientCasePage from './pages/LawyerClientCasePage';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { useSession } from './hooks/useSession';

export default function App() {
  const { session, createSession, updateCity, updateBudget, setCaseType, clearSession, switchSession } = useSession();
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
      <ThemeProvider>
        <AuthProvider>
          <div className="app-container">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route
              path="/onboarding"
              element={<Navigate to="/dashboard" replace />}
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute requiredRole="client">
                  <DashboardPage
                    session={session}
                    updateCity={updateCity}
                    updateBudget={updateBudget}
                    setCaseType={setCaseType}
                    clearSession={clearSession}
                    switchSession={switchSession}
                    addToast={addToast}
                    createSession={createSession}
                  />
                </ProtectedRoute>
              }
            />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/magic-link" element={<MagicLinkHandler />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route
              path="/lawyer"
              element={
                <ProtectedRoute requiredRole="lawyer">
                  <LawyerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lawyer/clients/:requestId"
              element={
                <ProtectedRoute requiredRole="lawyer">
                  <LawyerClientCasePage />
                </ProtectedRoute>
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
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
