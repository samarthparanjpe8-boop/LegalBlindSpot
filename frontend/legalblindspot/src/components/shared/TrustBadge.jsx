import { getTierFromScore } from '../../utils/trustColors';

export default function TrustBadge({ score, size = 'md' }) {
  const tier = getTierFromScore(score);

  return (
    <span
      className={`trust-badge trust-badge-${size}`}
      style={{ '--tier-color': tier.color }}
    >
      <span className="trust-badge-symbol">{tier.symbol}</span>
      {tier.label}
    </span>
  );
}
