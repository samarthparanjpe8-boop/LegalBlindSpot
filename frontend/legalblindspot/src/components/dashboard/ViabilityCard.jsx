import { useState } from 'react';
import EmptyState from '../shared/EmptyState';
import Spinner from '../shared/Spinner';
import Badge from '../shared/Badge';
import { formatCurrency } from '../../utils/formatters';
import * as api from '../../services/api';
import { HelpCircle, AlertTriangle, AlertCircle, Coins, Clock, ArrowRight } from 'lucide-react';

export default function ViabilityCard({ caseType, sessionDescription }) {
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasRun, setHasRun] = useState(false);

  function runAssessment() {
    if (!caseType && !sessionDescription) return;
    setIsLoading(true);
    setError(null);

    api.assessViability(sessionDescription || '', caseType || '', [])
      .then(data => {
        setResult(data);
        setHasRun(true);
      })
      .catch(err => setError(err.message))
      .finally(() => setIsLoading(false));
  }

  if (!caseType && !hasRun) {
    return (
      <div className="viability-card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '40px' }}>
        <EmptyState
          icon={<HelpCircle size={40} style={{ color: 'var(--text-secondary)' }} />}
          heading="No case detected yet"
          message="Describe your legal situation in the chat first, then come back here for a viability assessment."
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="viability-card viability-loading" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '40px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
        <Spinner size={32} />
        <span className="viability-loading-text" style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Running assessment...</span>
      </div>
    );
  }

  if (!hasRun) {
    return (
      <div className="viability-card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h2 className="viability-title" style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', margin: 0 }}>Case Viability Assessment</h2>
        <p className="viability-subtitle" style={{ color: 'var(--text-secondary)', margin: 0 }}>Case type: <strong style={{ color: 'var(--text-primary)' }}>{caseType}</strong></p>
        <button 
          className="viability-run-btn" 
          onClick={runAssessment}
          style={{
            alignSelf: 'flex-start',
            background: 'var(--accent)',
            color: 'var(--text-primary)',
            padding: '12px 28px',
            borderRadius: 'var(--radius-sm)',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontSize: '0.85rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'var(--transition)'
          }}
        >
          Run Assessment <ArrowRight size={16} />
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="viability-card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '40px' }}>
        <EmptyState 
          icon={<AlertCircle size={40} style={{ color: 'var(--danger)' }} />} 
          heading="Assessment failed" 
          message={error} 
        />
      </div>
    );
  }

  if (!result) return null;

  const score = result.score ?? result.viabilityScore ?? 0;
  const scoreColor = score > 70 ? 'var(--success)' : score >= 50 ? 'var(--warning)' : 'var(--danger)';
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="viability-card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <h2 className="viability-title" style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', margin: 0 }}>Case Viability Assessment</h2>

      <div className="viability-score-section" style={{ display: 'flex', gap: '32px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="viability-donut" style={{ position: 'relative', width: '120px', height: '120px' }}>
          <svg viewBox="0 0 100 100" className="viability-svg" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
            <circle cx="50" cy="50" r="45" fill="none" stroke="var(--border)" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="45"
              fill="none"
              stroke={scoreColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="viability-donut-fill"
              style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
            />
          </svg>
          <div className="viability-donut-label" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span className="viability-donut-score" style={{ color: scoreColor, fontSize: '2rem', fontWeight: 'bold', lineHeight: 1 }}>{score}</span>
            <span className="viability-donut-max" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>/100</span>
          </div>
        </div>

        <div className="viability-meta" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {result.verdict && (
            <div style={{ marginBottom: '8px' }}>
              <Badge variant={score > 70 ? 'success' : score >= 50 ? 'warning' : 'danger'} size="lg">
                {result.verdict}
              </Badge>
            </div>
          )}
          {result.estimatedCost && (
            <div className="viability-meta-row" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px', fontSize: '0.95rem' }}>
              <span className="viability-meta-label" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}><Coins size={16} /> Estimated Cost</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{result.estimatedCost.min != null
                ? `${formatCurrency(result.estimatedCost.min)} - ${formatCurrency(result.estimatedCost.max)}`
                : result.estimatedCost
              }</span>
            </div>
          )}
          {result.timeline && (
            <div className="viability-meta-row" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px', fontSize: '0.95rem' }}>
              <span className="viability-meta-label" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={16} /> Timeline</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{result.timeline}</span>
            </div>
          )}
        </div>
      </div>

      <div className="viability-columns" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
        {result.strengths && result.strengths.length > 0 && (
          <div className="viability-col" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
            <h4 className="viability-col-title viability-col-strengths" style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', color: 'var(--success)', marginBottom: '16px' }}>Strengths</h4>
            <ul className="viability-list" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {result.strengths.map((s, i) => (
                <li key={i} className="viability-item viability-item-ok" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.4', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ color: 'var(--success)' }}>✓</span> {s}
                </li>
              ))}
            </ul>
          </div>
        )}
        {result.weaknesses && result.weaknesses.length > 0 && (
          <div className="viability-col" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
            <h4 className="viability-col-title viability-col-weaknesses" style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', color: 'var(--danger)', marginBottom: '16px' }}>Risks & Weaknesses</h4>
            <ul className="viability-list" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {result.weaknesses.map((w, i) => (
                <li key={i} className="viability-item viability-item-bad" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.4', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ color: 'var(--danger)' }}>✗</span> {w}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {result.advice && (
        <div className="viability-advice" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
          <h4 className="viability-advice-title" style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', marginBottom: '8px' }}>Honest Advice</h4>
          <p className="viability-advice-text" style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', margin: 0 }}>{result.advice}</p>
        </div>
      )}
    </div>
  );
}
