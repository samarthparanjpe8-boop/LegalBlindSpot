import { useState } from 'react';
import { formatCurrency } from '../../utils/formatters';
import { MapPin, Coins, FileText, RefreshCw, User, Check, Edit2 } from 'lucide-react';

const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata', 'Nagpur'];

export default function SessionPanel({ session, onCityChange, onBudgetChange, onRestartSession }) {
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
    <div className="session-panel" style={{ padding: '20px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', minWidth: '280px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
        <div style={{ background: 'var(--accent-dim)', color: 'var(--accent)', padding: '8px', borderRadius: '50%' }}>
          <User size={16} />
        </div>
        <h3 className="session-panel-title" style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', margin: 0 }}>Active Session</h3>
      </div>

      <div className="session-row" style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
        <span className="session-row-label" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MapPin size={14} /> City
        </span>
        {editingCity ? (
          <div className="session-edit-inline" style={{ display: 'flex', gap: '8px' }}>
            <select
              value={cityValue}
              onChange={e => setCityValue(e.target.value)}
              className="session-edit-select"
              autoFocus
              style={{
                flex: 1,
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem'
              }}
            >
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button 
              className="session-edit-save" 
              onClick={handleCitySubmit}
              style={{
                background: 'var(--accent)',
                color: 'var(--text-primary)',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                fontWeight: '600'
              }}
            >
              <Check size={14} />
            </button>
          </div>
        ) : (
          <div className="session-row-value" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-primary)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.95rem' }}>{session.city || '--'}</span>
            <button 
              className="session-edit-btn" 
              onClick={() => { setCityValue(session.city || CITIES[0]); setEditingCity(true); }}
              style={{ color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center' }}
            >
              <Edit2 size={12} />
            </button>
          </div>
        )}
      </div>

      <div className="session-row" style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
        <span className="session-row-label" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Coins size={14} /> Budget
        </span>
        {editingBudget ? (
          <div className="session-edit-inline" style={{ display: 'flex', gap: '8px' }}>
            <input
              type="number"
              value={budgetValue}
              onChange={e => setBudgetValue(e.target.value)}
              className="session-edit-input"
              autoFocus
              style={{
                flex: 1,
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem'
              }}
            />
            <button 
              className="session-edit-save" 
              onClick={handleBudgetSubmit}
              style={{
                background: 'var(--accent)',
                color: 'var(--text-primary)',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                fontWeight: '600'
              }}
            >
              <Check size={14} />
            </button>
          </div>
        ) : (
          <div className="session-row-value" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-primary)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.95rem' }}>{formatCurrency(session.budget)}</span>
            <button 
              className="session-edit-btn" 
              onClick={() => { setBudgetValue(session.budget || ''); setEditingBudget(true); }}
              style={{ color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center' }}
            >
              <Edit2 size={12} />
            </button>
          </div>
        )}
      </div>

      <div className="session-row" style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '24px' }}>
        <span className="session-row-label" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FileText size={14} /> Case Type
        </span>
        <div className="session-row-value" style={{ background: 'var(--bg-primary)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.95rem' }}>
          <span className={session.caseType ? '' : 'session-not-detected'} style={{ color: session.caseType ? 'var(--text-primary)' : 'var(--text-muted)' }}>
            {session.caseType || 'Not detected yet'}
          </span>
        </div>
      </div>

      <button 
        className="session-restart-btn" 
        onClick={onRestartSession}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          background: 'transparent',
          border: '1px solid var(--border)',
          color: 'var(--text-primary)',
          padding: '10px',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.8rem',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          transition: 'var(--transition)'
        }}
        onMouseEnter={(e) => { e.target.style.background = 'rgba(255, 255, 255, 0.05)'; }}
        onMouseLeave={(e) => { e.target.style.background = 'transparent'; }}
      >
        <RefreshCw size={14} />
        New Consultation
      </button>
    </div>
  );
}
