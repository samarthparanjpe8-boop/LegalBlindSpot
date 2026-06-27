import { useState, useEffect } from 'react';
import EmptyState from '../shared/EmptyState';
import Spinner from '../shared/Spinner';
import Badge from '../shared/Badge';
import { formatCurrency, formatPercent } from '../../utils/formatters';
import * as api from '../../services/api';
import './ViabilityCard.css';

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
      <div className="viability-card">
        <EmptyState
          icon="?"
          heading="No case detected yet"
          message="Describe your legal situation in the chat first, then come back here for a viability assessment."
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="viability-card viability-loading">
        <Spinner size={32} />
        <span className="viability-loading-text">Running assessment...</span>
      </div>
    );
  }

  if (!hasRun) {
    return (
      <div className="viability-card">
        <h2 className="viability-title">Case Viability Assessment</h2>
        <p className="viability-subtitle">Case type: {caseType}</p>
        <button className="viability-run-btn" onClick={runAssessment}>
          Run Assessment
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="viability-card">
        <EmptyState icon="!" heading="Assessment failed" message={error} />
      </div>
    );
  }

  if (!result) return null;

  const score = result.score ?? result.viabilityScore ?? 0;
  const scoreColor = score > 70 ? 'var(--success)' : score >= 50 ? 'var(--warning)' : 'var(--danger)';
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="viability-card">
      <h2 className="viability-title">Case Viability Assessment</h2>

      <div className="viability-score-section">
        <div className="viability-donut">
          <svg viewBox="0 0 100 100" className="viability-svg">
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
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div className="viability-donut-label">
            <span className="viability-donut-score" style={{ color: scoreColor }}>{score}</span>
            <span className="viability-donut-max">/100</span>
          </div>
        </div>

        <div className="viability-meta">
          {result.verdict && (
            <Badge variant={score > 70 ? 'success' : score >= 50 ? 'warning' : 'danger'} size="lg">
              {result.verdict}
            </Badge>
          )}
          {result.estimatedCost && (
            <div className="viability-meta-row">
              <span className="viability-meta-label">Estimated Cost</span>
              <span>{result.estimatedCost.min != null
                ? `${formatCurrency(result.estimatedCost.min)} - ${formatCurrency(result.estimatedCost.max)}`
                : result.estimatedCost
              }</span>
            </div>
          )}
          {result.timeline && (
            <div className="viability-meta-row">
              <span className="viability-meta-label">Timeline</span>
              <span>{result.timeline}</span>
            </div>
          )}
          {result.worthPursuing != null && (
            <div className="viability-meta-row">
              <span className="viability-meta-label">Worth Pursuing</span>
              <span className={result.worthPursuing ? 'viability-yes' : 'viability-no'}>
                {result.worthPursuing ? 'Yes' : 'No'}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="viability-columns">
        {result.strengths && result.strengths.length > 0 && (
          <div className="viability-col">
            <h4 className="viability-col-title viability-col-strengths">Strengths</h4>
            <ul className="viability-list">
              {result.strengths.map((s, i) => (
                <li key={i} className="viability-item viability-item-ok">{s}</li>
              ))}
            </ul>
          </div>
        )}
        {result.weaknesses && result.weaknesses.length > 0 && (
          <div className="viability-col">
            <h4 className="viability-col-title viability-col-weaknesses">Weaknesses</h4>
            <ul className="viability-list">
              {result.weaknesses.map((w, i) => (
                <li key={i} className="viability-item viability-item-bad">{w}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {result.advice && (
        <div className="viability-advice">
          <h4 className="viability-advice-title">Honest Advice</h4>
          <p className="viability-advice-text">{result.advice}</p>
        </div>
      )}
    </div>
  );
}
