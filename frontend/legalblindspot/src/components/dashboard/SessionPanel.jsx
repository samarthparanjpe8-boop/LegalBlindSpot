import { useState } from 'react';
import { formatCurrency } from '../../utils/formatters';

const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata', 'Nagpur'];

export default function SessionPanel({ session, onCityChange, onBudgetChange }) {
  const [editingCity, setEditingCity] = useState(false);
  const [editingBudget, setEditingBudget] = useState(false);
  const [cityValue, setCityValue] = useState(session.city || '');
  const [budgetValue, setBudgetValue] = useState(session.budget || '');

  function handleCitySubmit() {
    if (cityValue && cityValue !== session.city) {
      onCityChange(cityValue);
    }
    setEditingCity(false);
  }

  function handleBudgetSubmit() {
    const num = Number(budgetValue);
    if (num > 0 && num !== session.budget) {
      onBudgetChange(num);
    }
    setEditingBudget(false);
  }

  return (
    <div className="session-panel">
      <div className="session-panel-avatar">U</div>
      <h3 className="session-panel-title">Your Session</h3>

      <div className="session-row">
        <span className="session-row-label">City</span>
        {editingCity ? (
          <div className="session-edit-inline">
            <select
              value={cityValue}
              onChange={e => setCityValue(e.target.value)}
              className="session-edit-select"
              autoFocus
            >
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button className="session-edit-save" onClick={handleCitySubmit}>Save</button>
          </div>
        ) : (
          <div className="session-row-value">
            <span>{session.city || '--'}</span>
            <button className="session-edit-btn" onClick={() => { setCityValue(session.city || CITIES[0]); setEditingCity(true); }}>
              Edit
            </button>
          </div>
        )}
      </div>

      <div className="session-row">
        <span className="session-row-label">Budget</span>
        {editingBudget ? (
          <div className="session-edit-inline">
            <input
              type="number"
              value={budgetValue}
              onChange={e => setBudgetValue(e.target.value)}
              className="session-edit-input"
              autoFocus
            />
            <button className="session-edit-save" onClick={handleBudgetSubmit}>Save</button>
          </div>
        ) : (
          <div className="session-row-value">
            <span>{formatCurrency(session.budget)}</span>
            <button className="session-edit-btn" onClick={() => { setBudgetValue(session.budget || ''); setEditingBudget(true); }}>
              Edit
            </button>
          </div>
        )}
      </div>

      <div className="session-row">
        <span className="session-row-label">Case Type</span>
        <div className="session-row-value">
          <span className={session.caseType ? '' : 'session-not-detected'}>
            {session.caseType || 'Not detected yet'}
          </span>
        </div>
      </div>
    </div>
  );
}
