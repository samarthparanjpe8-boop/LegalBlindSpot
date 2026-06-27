import { useState } from 'react';
import Badge from '../shared/Badge';
import Spinner from '../shared/Spinner';
import * as api from '../../services/api';
import { HelpCircle, CheckCircle, AlertTriangle, AlertOctagon, Scale, BookOpen } from 'lucide-react';

export default function AdviceCheckPanel({ caseType }) {
  const [advice, setAdvice] = useState('');
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [expandedIdx, setExpandedIdx] = useState(null);

  function handleCheck() {
    if (!advice.trim()) return;
    setIsLoading(true);
    setError(null);

    api.checkAdvice(advice.trim(), caseType || '')
      .then(data => {
        setResult(data);
        setHistory(prev => [{ advice: advice.trim(), result: data, date: new Date().toISOString() }, ...prev]);
      })
      .catch(err => setError(err.message))
      .finally(() => setIsLoading(false));
  }

  function getVerdictVariant(verdict) {
    if (!verdict) return 'default';
    const v = verdict.toLowerCase();
    if (v.includes('correct') && !v.includes('partial') && !v.includes('incorrect')) return 'success';
    if (v.includes('partial')) return 'warning';
    if (v.includes('incorrect')) return 'danger';
    if (v.includes('misleading')) return 'purple';
    return 'default';
  }

  return (
    <div className="advice-check" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <HelpCircle size={22} style={{ color: 'var(--accent)' }} />
        <h2 className="advice-check-title" style={{ fontFamily: 'var(--font-serif)', margin: 0 }}>Advice Check</h2>
      </div>

      <div className="advice-check-input-section" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '24px', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <label className="advice-check-label" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '500' }}>
          What advice or statement did you receive?
        </label>
        <textarea
          className="advice-check-textarea"
          value={advice}
          onChange={e => setAdvice(e.target.value)}
          placeholder="e.g. My lawyer said I must pay ₹50,000 immediately to apply for bail, otherwise the court will reject it."
          rows={4}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            outline: 'none',
            fontSize: '1rem',
            resize: 'vertical'
          }}
        />
        <button
          className="advice-check-btn"
          onClick={handleCheck}
          disabled={isLoading || !advice.trim()}
          style={{
            alignSelf: 'flex-start',
            background: 'var(--accent)',
            color: 'var(--text-primary)',
            padding: '12px 24px',
            borderRadius: 'var(--radius-sm)',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontSize: '0.85rem',
            transition: 'var(--transition)'
          }}
        >
          {isLoading ? <Spinner size={16} color="white" /> : 'Check This Advice'}
        </button>
      </div>

      {error && (
        <div className="advice-check-error" style={{ color: 'var(--danger)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertOctagon size={16} />
          {error}
        </div>
      )}

      {result && (
        <div className="advice-check-result" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="advice-result-header" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Badge variant={getVerdictVariant(result.verdict)} size="lg">
              {result.verdict || 'Unknown'}
            </Badge>
            {result.confidence && (
              <Badge variant="default" size="md">
                {result.confidence} Confidence
              </Badge>
            )}
          </div>

          <blockquote className="advice-result-quote" style={{ borderLeft: '3px solid var(--accent)', paddingLeft: '16px', margin: 0, fontStyle: 'italic', color: 'var(--text-primary)' }}>
            "{advice}"
          </blockquote>

          {result.explanation && (
            <p className="advice-result-explanation" style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '0.95rem' }}>{result.explanation}</p>
          )}

          {result.legalBasis && (
            <div className="advice-result-basis" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Scale size={16} style={{ color: 'var(--accent)' }} />
              <span className="advice-basis-label" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '500', marginRight: '8px' }}>Legal Basis:</span>
              <code style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{result.legalBasis}</code>
            </div>
          )}

          {result.recommendation && (
            <div className="advice-result-recommendation" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', padding: '16px', borderRadius: 'var(--radius-sm)' }}>
              <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={16} style={{ color: 'var(--accent)' }} /> Recommended Action
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5', margin: 0 }}>{result.recommendation}</p>
            </div>
          )}
        </div>
      )}

      {history.length > 0 && (
        <div className="advice-check-history" style={{ marginTop: '20px' }}>
          <h4 className="advice-history-title" style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', marginBottom: '12px' }}>Previous Advice Checks</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {history.map((item, i) => (
              <div
                key={i}
                className={`advice-history-item ${expandedIdx === i ? 'advice-history-expanded' : ''}`}
                onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px 16px',
                  cursor: 'pointer',
                  transition: 'var(--transition)'
                }}
              >
                <div className="advice-history-summary" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="advice-history-text" style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    {item.advice.length > 60 ? item.advice.slice(0, 60) + '...' : item.advice}
                  </span>
                  <Badge variant={getVerdictVariant(item.result.verdict)} size="sm">
                    {item.result.verdict || '--'}
                  </Badge>
                </div>
                {expandedIdx === i && item.result.explanation && (
                  <p className="advice-history-detail" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '8px', lineHeight: '1.4', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>{item.result.explanation}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
