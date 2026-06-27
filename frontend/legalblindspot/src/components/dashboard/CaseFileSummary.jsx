import { useState, useEffect } from 'react';
import Spinner from '../shared/Spinner';
import EmptyState from '../shared/EmptyState';
import Badge from '../shared/Badge';
import AdvocateCard from '../advocates/AdvocateCard';
import * as api from '../../services/api';

export default function CaseFileSummary({ sessionId }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!sessionId) return;
    setIsLoading(true);
    setError(null);

    api.getCaseFile(sessionId)
      .then(res => {
        setData(res);
      })
      .catch(err => {
        setError(err.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [sessionId]);

  if (isLoading) {
    return (
      <div className="case-file-loading">
        <Spinner size={32} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <EmptyState
        icon="⚖"
        heading="Case File Not Ready"
        message="A full case summary will be compiled once you've had a case diagnosed and started verifying elements."
      />
    );
  }

  const caseType = data.caseType || 'General Legal Dispute';

  return (
    <div className="case-file-summary">
      <div className="case-file-header">
        <div>
          <h2>Case File</h2>
          <span className="case-file-session">ID: {sessionId}</span>
        </div>
        <span className="case-file-date">Compiled: {new Date().toLocaleDateString('en-IN')}</span>
      </div>

      <div className="case-file-section">
        <h3 className="section-title">Case Summary</h3>
        <div className="summary-card">
          <div className="summary-badge-row">
            <Badge variant="accent">{caseType}</Badge>
          </div>
          <p className="summary-text">
            {data.summary || 'A detailed summary of your case will be generated automatically as you chat and clarify facts.'}
          </p>
        </div>
      </div>

      {data.documents && data.documents.length > 0 && (
        <div className="case-file-section">
          <h3 className="section-title">Document Checklist Status</h3>
          <div className="case-file-docs">
            {data.documents.map((doc, idx) => (
              <div key={idx} className="case-file-doc-item">
                <span className="doc-status-bullet">✓</span>
                <div className="doc-info">
                  <span className="doc-name">{doc.name}</span>
                  {doc.desc && <span className="doc-desc">{doc.desc}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.adviceChecks && data.adviceChecks.length > 0 && (
        <div className="case-file-section">
          <h3 className="section-title">Advice Verification History</h3>
          <div className="case-file-history">
            {data.adviceChecks.map((check, idx) => (
              <div key={idx} className="history-check-card">
                <div className="history-check-header">
                  <span className="history-check-date">
                    {check.date ? new Date(check.date).toLocaleDateString('en-IN') : 'Recent'}
                  </span>
                  <Badge variant={
                    check.verdict?.toLowerCase().includes('correct') && !check.verdict?.toLowerCase().includes('partial')
                      ? 'success'
                      : check.verdict?.toLowerCase().includes('partial')
                      ? 'warning'
                      : 'danger'
                  }>
                    {check.verdict}
                  </Badge>
                </div>
                <blockquote className="history-quote">"{check.advice}"</blockquote>
                {check.explanation && <p className="history-exp">{check.explanation}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {data.recommendedAdvocates && data.recommendedAdvocates.length > 0 && (
        <div className="case-file-section">
          <h3 className="section-title">Recommended Advocates</h3>
          <div className="case-file-advocates">
            {data.recommendedAdvocates.slice(0, 3).map((adv, idx) => (
              <AdvocateCard key={idx} advocate={adv} compact={true} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
