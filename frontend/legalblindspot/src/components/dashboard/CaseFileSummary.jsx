import { useState, useEffect } from 'react';
import Spinner from '../shared/Spinner';
import EmptyState from '../shared/EmptyState';
import Badge from '../shared/Badge';
import AdvocateCard from '../advocates/AdvocateCard';
import * as api from '../../services/api';
import { Scale, CheckCircle, Clock, Award, Shield } from 'lucide-react';

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
      <div className="case-file-loading" style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <Spinner size={32} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '40px', borderRadius: 'var(--radius-lg)' }}>
        <EmptyState
          icon={<Scale size={40} style={{ color: 'var(--text-secondary)' }} />}
          heading="Case File Not Ready"
          message="A full case summary will be compiled once you've had a case diagnosed and started verifying elements."
        />
      </div>
    );
  }

  const caseType = data.caseType || 'General Legal Dispute';

  return (
    <div className="case-file-summary" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="case-file-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '20px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', margin: 0 }}>Case File</h2>
          <span className="case-file-session" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Session ID: {sessionId}</span>
        </div>
        <span className="case-file-date" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Compiled: {new Date().toLocaleDateString('en-IN')}</span>
      </div>

      <div className="case-file-section">
        <h3 className="section-title" style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', marginBottom: '12px' }}>Case Summary</h3>
        <div className="summary-card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '20px', borderRadius: 'var(--radius-md)' }}>
          <div className="summary-badge-row" style={{ marginBottom: '12px' }}>
            <Badge variant="accent">{caseType}</Badge>
          </div>
          <p className="summary-text" style={{ color: 'var(--text-primary)', lineHeight: '1.6', margin: 0 }}>
            {data.summary || 'A detailed summary of your case will be generated automatically as you chat and clarify facts.'}
          </p>
        </div>
      </div>

      {data.documents && data.documents.length > 0 && (
        <div className="case-file-section">
          <h3 className="section-title" style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', marginBottom: '12px' }}>Document Checklist Status</h3>
          <div className="case-file-docs" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {data.documents.map((doc, idx) => (
              <div key={idx} className="case-file-doc-item" style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: 'var(--radius-sm)' }}>
                <CheckCircle size={16} style={{ color: 'var(--success)', marginTop: '2px', flexShrink: 0 }} />
                <div className="doc-info">
                  <span className="doc-name" style={{ display: 'block', fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: '500' }}>{doc.name}</span>
                  {doc.desc && <span className="doc-desc" style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{doc.desc}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.adviceChecks && data.adviceChecks.length > 0 && (
        <div className="case-file-section">
          <h3 className="section-title" style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', marginBottom: '12px' }}>Advice Verification History</h3>
          <div className="case-file-history" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data.adviceChecks.map((check, idx) => (
              <div key={idx} className="history-check-card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '20px', borderRadius: 'var(--radius-md)' }}>
                <div className="history-check-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span className="history-check-date" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={14} />
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
                <blockquote className="history-quote" style={{ borderLeft: '3px solid var(--accent)', paddingLeft: '12px', margin: '0 0 12px 0', fontStyle: 'italic', color: 'var(--text-primary)' }}>"{check.advice}"</blockquote>
                {check.explanation && <p className="history-exp" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>{check.explanation}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {data.recommendedAdvocates && data.recommendedAdvocates.length > 0 && (
        <div className="case-file-section">
          <h3 className="section-title" style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', marginBottom: '12px' }}>Recommended Advocates</h3>
          <div className="case-file-advocates" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            {data.recommendedAdvocates.slice(0, 3).map((adv, idx) => (
              <AdvocateCard key={idx} advocate={adv} compact={true} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
