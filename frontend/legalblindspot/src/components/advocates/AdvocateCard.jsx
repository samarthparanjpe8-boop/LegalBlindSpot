import { useState } from 'react';
import TrustBadge from '../shared/TrustBadge';
import ScoreBar from '../shared/ScoreBar';
import AdvocateTrustBreakdown from './AdvocateTrustBreakdown';
import { formatCurrency, formatPercent } from '../../utils/formatters';

export default function AdvocateCard({ advocate, userBudget, compact = false, animationDelay = 0 }) {
  const [expanded, setExpanded] = useState(false);

  const adv = advocate;
  const trust = adv.trustResult || adv.trustBreakdown || {};
  const score = adv.trustScore ?? trust.totalScore ?? 0;
  const withinBudget = userBudget ? (adv.consultationFee || 0) <= userBudget : true;

  if (compact) {
    return (
      <div className="advocate-card advocate-card-compact" style={{ animationDelay: `${animationDelay}ms` }}>
        <div className="advocate-card-header">
          <strong className="advocate-card-name">{adv.name}</strong>
          <TrustBadge score={score} size="sm" />
        </div>
        <ScoreBar score={score} label="Trust" showValue />
        <div className="advocate-card-compact-details">
          <span className={`advocate-fee ${withinBudget ? 'fee-ok' : 'fee-over'}`}>
            {formatCurrency(adv.consultationFee)}
          </span>
          {adv.practiceAreas && adv.practiceAreas[0] && (
            <span className="advocate-area">{adv.practiceAreas[0]}</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="advocate-card" style={{ animationDelay: `${animationDelay}ms` }}>
      <div className="advocate-card-header">
        <strong className="advocate-card-name">{adv.name}</strong>
        <TrustBadge score={score} />
      </div>

      <ScoreBar score={score} label="Trust Score" showValue />

      <div className="advocate-details-grid">
        <div className="advocate-detail">
          <span className="detail-icon">@</span>
          <span>{adv.city || '--'}</span>
          {adv.court && <span className="detail-sep">-</span>}
          {adv.court && <span>{adv.court}</span>}
        </div>

        {adv.practiceAreas && adv.practiceAreas.length > 0 && (
          <div className="advocate-detail">
            <span className="detail-icon">||</span>
            <span>{adv.practiceAreas.join(', ')}</span>
          </div>
        )}

        <div className="advocate-detail">
          <span className="detail-icon">$</span>
          <span className={withinBudget ? 'fee-ok' : 'fee-over'}>
            {formatCurrency(adv.consultationFee)}
          </span>
        </div>

        {adv.rating != null && (
          <div className="advocate-detail">
            <span className="detail-icon">*</span>
            <span>{adv.rating}</span>
            {adv.reviewCount != null && (
              <span className="detail-muted">- {adv.reviewCount} reviews</span>
            )}
          </div>
        )}

        {adv.languages && adv.languages.length > 0 && (
          <div className="advocate-detail">
            <span className="detail-icon">A</span>
            <span>{adv.languages.join(', ')}</span>
          </div>
        )}

        {adv.barRegistration && (
          <div className="advocate-detail">
            <span className="detail-icon">V</span>
            <span className="detail-muted">{adv.barRegistration}</span>
          </div>
        )}
      </div>

      {adv.caseHistory && adv.caseHistory.length > 0 && (
        <div className="advocate-case-history">
          <h4 className="case-history-title">Case History</h4>
          {adv.caseHistory.map((c, i) => (
            <div key={i} className="case-history-item">
              <span className="case-history-type">{c.caseType || c.type}</span>
              <span className="case-history-stats">
                {c.count || c.cases} cases - {formatPercent(c.successRate)} success
              </span>
              {c.sampleOutcome && (
                <span className="case-history-outcome">{c.sampleOutcome}</span>
              )}
            </div>
          ))}
        </div>
      )}

      <button
        className="advocate-expand-btn"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? 'Hide trust breakdown' : 'View trust breakdown'}
        <span className={`expand-arrow ${expanded ? 'expand-arrow-up' : ''}`}>v</span>
      </button>

      {expanded && (
        <AdvocateTrustBreakdown
          breakdown={trust.breakdown || trust}
          totalScore={score}
        />
      )}
    </div>
  );
}
