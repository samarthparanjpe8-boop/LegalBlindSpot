import ScoreBar from '../shared/ScoreBar';

const COMPONENTS = [
  { key: 'verification', label: 'Verification', max: 25 },
  { key: 'experience', label: 'Experience', max: 20 },
  { key: 'rating', label: 'Rating', max: 20 },
  { key: 'reviews', label: 'Reviews', max: 15 },
  { key: 'profile', label: 'Profile', max: 10 },
  { key: 'courtLevel', label: 'Court Level', max: 10 },
  { key: 'caseHistory', label: 'Case History', max: 10 }
];

export default function AdvocateTrustBreakdown({ breakdown, totalScore }) {
  if (!breakdown) return null;

  return (
    <div className="trust-breakdown">
      <h4 className="trust-breakdown-title">Trust Score Breakdown</h4>
      <div className="trust-breakdown-list">
        {COMPONENTS.map(({ key, label, max }) => {
          const score = breakdown[key] ?? 0;
          return (
            <ScoreBar
              key={key}
              label={label}
              score={score}
              max={max}
            />
          );
        })}
      </div>
      <div className="trust-breakdown-divider" />
      <div className="trust-breakdown-total">
        <span className="trust-breakdown-total-label">Total</span>
        <span className="trust-breakdown-total-value">
          {totalScore}/100
        </span>
      </div>
    </div>
  );
}
