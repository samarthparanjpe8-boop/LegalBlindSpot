import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Spinner from '../components/shared/Spinner';

const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata', 'Nagpur'];
const BUDGETS = [500, 1000, 2000, 3000, 5000];

export default function OnboardingPage({ createSession }) {
  const [step, setStep] = useState(1);
  const [city, setCity] = useState('');
  const [budget, setBudget] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleContinue = (e) => {
    e.preventDefault();
    if (city) {
      setStep(2);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!city || !budget) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await createSession(city, Number(budget));
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to start session. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        <div className="onboarding-header">
          <span className="logo-icon">⚖</span>
          <span className="logo-text">LegalLink</span>
        </div>

        {error && <div className="onboarding-error">{error}</div>}

        <div className={`onboarding-step-wrapper ${step === 1 ? 'step-active' : 'step-inactive'}`}>
          {step === 1 && (
            <form onSubmit={handleContinue} className="onboarding-form">
              <h2 className="onboarding-title">Which city are you in?</h2>
              <div className="onboarding-input-group">
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="onboarding-select"
                  required
                >
                  <option value="" disabled>Select a city</option>
                  {CITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="onboarding-btn" disabled={!city}>
                Continue →
              </button>
            </form>
          )}
        </div>

        <div className={`onboarding-step-wrapper ${step === 2 ? 'step-active' : 'step-inactive'}`}>
          {step === 2 && (
            <form onSubmit={handleSubmit} className="onboarding-form">
              <h2 className="onboarding-title">What's your maximum consultation budget?</h2>
              <div className="onboarding-input-group">
                <div className="budget-input-wrapper">
                  <span className="currency-prefix">₹</span>
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="e.g. 2000"
                    className="onboarding-input"
                    min="1"
                    required
                  />
                </div>
                <span className="input-helper">
                  This filters advocates so you only see lawyers within your budget.
                </span>
              </div>

              <div className="budget-chips">
                {BUDGETS.map((b) => (
                  <button
                    key={b}
                    type="button"
                    className={`budget-chip ${Number(budget) === b ? 'chip-active' : ''}`}
                    onClick={() => setBudget(b.toString())}
                  >
                    ₹{b}
                  </button>
                ))}
              </div>

              <div className="onboarding-actions">
                <button
                  type="button"
                  className="onboarding-btn-back"
                  onClick={() => setStep(1)}
                  disabled={isSubmitting}
                >
                  ← Back
                </button>
                <button type="submit" className="onboarding-btn" disabled={isSubmitting || !budget}>
                  {isSubmitting ? <Spinner size={16} color="white" /> : 'Start Chatting →'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
