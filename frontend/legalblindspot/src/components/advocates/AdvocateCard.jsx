import { useState } from 'react';
import TrustBadge from '../shared/TrustBadge';
import ScoreBar from '../shared/ScoreBar';
import AdvocateTrustBreakdown from './AdvocateTrustBreakdown';
import { formatCurrency, formatPercent } from '../../utils/formatters';
import { 
  MapPin, 
  Briefcase, 
  IndianRupee, 
  Star, 
  Languages, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';

export default function AdvocateCard({ advocate, userBudget, compact = false, animationDelay = 0 }) {
  const [expanded, setExpanded] = useState(false);

  const adv = advocate;
  const trust = adv.trustResult || adv.trustBreakdown || {};
  const score = adv.trustScore ?? trust.totalScore ?? 0;
  const withinBudget = userBudget ? (adv.consultationFee || 0) <= userBudget : true;

  if (compact) {
    return (
      <div className="advocate-card advocate-card-compact" style={{ animationDelay: `${animationDelay}ms`, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '16px' }}>
        <div className="advocate-card-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <strong className="advocate-card-name" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>{adv.name}</strong>
          <TrustBadge score={score} size="sm" />
        </div>
        <ScoreBar score={score} label="Trust" showValue />
        <div className="advocate-card-compact-details" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '0.85rem' }}>
          <span className={`advocate-fee ${withinBudget ? 'fee-ok' : 'fee-over'}`} style={{ color: withinBudget ? 'var(--success)' : 'var(--danger)', fontWeight: '600' }}>
            {formatCurrency(adv.consultationFee)}
          </span>
          {adv.practiceAreas && adv.practiceAreas[0] && (
            <span className="advocate-area" style={{ color: 'var(--text-secondary)' }}>{adv.practiceAreas[0]}</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="advocate-card" style={{ animationDelay: `${animationDelay}ms`, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '24px' }}>
      <div className="advocate-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <strong className="advocate-card-name" style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--text-primary)' }}>{adv.name}</strong>
        <TrustBadge score={score} />
      </div>

      <ScoreBar score={score} label="Trust Score" showValue />

      <div className="advocate-details-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', margin: '20px 0' }}>
        <div className="advocate-detail" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          <MapPin size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
          <span>{adv.city || '--'}</span>
          {adv.court && <span className="detail-sep">•</span>}
          {adv.court && <span>{adv.court}</span>}
        </div>

        {adv.practiceAreas && adv.practiceAreas.length > 0 && (
          <div className="advocate-detail" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            <Briefcase size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
            <span>{adv.practiceAreas.join(', ')}</span>
          </div>
        )}

        <div className="advocate-detail" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          <IndianRupee size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
          <span className={withinBudget ? 'fee-ok' : 'fee-over'} style={{ color: withinBudget ? 'var(--success)' : 'var(--danger)', fontWeight: '600' }}>
            {formatCurrency(adv.consultationFee)}
          </span>
        </div>

        {adv.rating != null && (
          <div className="advocate-detail" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            <Star size={16} style={{ color: '#f59e0b', fill: '#f59e0b', flexShrink: 0 }} />
            <span>{adv.rating}</span>
            {adv.reviewCount != null && (
              <span className="detail-muted" style={{ color: 'var(--text-muted)' }}>• {adv.reviewCount} reviews</span>
            )}
          </div>
        )}

        {adv.languages && adv.languages.length > 0 && (
          <div className="advocate-detail" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            <Languages size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
            <span>{adv.languages.join(', ')}</span>
          </div>
        )}

        {adv.barRegistration && (
          <div className="advocate-detail" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            <ShieldCheck size={16} style={{ color: 'var(--success)', flexShrink: 0 }} />
            <span className="detail-muted" style={{ color: 'var(--text-muted)' }}>{adv.barRegistration}</span>
          </div>
        )}
      </div>

      {adv.caseHistory && adv.caseHistory.length > 0 && (
        <div className="advocate-case-history" style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '16px' }}>
          <h4 className="case-history-title" style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', marginBottom: '12px' }}>Case History</h4>
          {adv.caseHistory.map((c, i) => (
            <div key={i} className="case-history-item" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
              <span className="case-history-type" style={{ color: 'var(--text-primary)' }}>{c.caseType || c.type}</span>
              <span className="case-history-stats" style={{ color: 'var(--text-secondary)' }}>
                {c.count || c.cases} cases • {formatPercent(c.successRate)} success
              </span>
            </div>
          ))}
        </div>
      )}

      <button
        className="advocate-expand-btn"
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '10px',
          marginTop: '16px',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.85rem',
          color: 'var(--text-secondary)',
          cursor: 'pointer'
        }}
      >
        {expanded ? 'Hide trust breakdown' : 'View trust breakdown'}
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
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
