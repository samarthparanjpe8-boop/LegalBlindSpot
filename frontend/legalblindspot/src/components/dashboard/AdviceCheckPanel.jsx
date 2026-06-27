import { useState } from 'react';
import Badge from '../shared/Badge';
import Spinner from '../shared/Spinner';
import * as api from '../../services/api';

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
    <div className="advice-check">
      <h2 className="advice-check-title">Advice Check</h2>

      <div className="advice-check-input-section">
        <label className="advice-check-label">What did your lawyer or someone tell you?</label>
        <textarea
          className="advice-check-textarea"
          value={advice}
          onChange={e => setAdvice(e.target.value)}
          placeholder="Paste the legal advice you received here..."
          rows={4}
        />
        <button
          className="advice-check-btn"
          onClick={handleCheck}
          disabled={isLoading || !advice.trim()}
        >
          {isLoading ? <Spinner size={16} color="white" /> : 'Check This Advice'}
        </button>
      </div>

      {error && (
        <div className="advice-check-error">{error}</div>
      )}

      {result && (
        <div className="advice-check-result">
          <div className="advice-result-header">
            <Badge variant={getVerdictVariant(result.verdict)} size="lg">
              {result.verdict || 'Unknown'}
            </Badge>
            {result.confidence && (
              <Badge variant="default" size="md">
                {result.confidence} confidence
              </Badge>
            )}
          </div>

          <blockquote className="advice-result-quote">
            {advice}
          </blockquote>

          {result.explanation && (
            <p className="advice-result-explanation">{result.explanation}</p>
          )}

          {result.legalBasis && (
            <div className="advice-result-basis">
              <span className="advice-basis-label">Legal Basis</span>
              <code>{result.legalBasis}</code>
            </div>
          )}

          {result.recommendation && (
            <div className="advice-result-recommendation">
              <h4>Recommendation</h4>
              <p>{result.recommendation}</p>
            </div>
          )}
        </div>
      )}

      {history.length > 0 && (
        <div className="advice-check-history">
          <h4 className="advice-history-title">Previous Checks</h4>
          {history.map((item, i) => (
            <div
              key={i}
              className={`advice-history-item ${expandedIdx === i ? 'advice-history-expanded' : ''}`}
              onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
            >
              <div className="advice-history-summary">
                <span className="advice-history-text">
                  {item.advice.length > 60 ? item.advice.slice(0, 60) + '...' : item.advice}
                </span>
                <Badge variant={getVerdictVariant(item.result.verdict)} size="sm">
                  {item.result.verdict || '--'}
                </Badge>
              </div>
              {expandedIdx === i && item.result.explanation && (
                <p className="advice-history-detail">{item.result.explanation}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
