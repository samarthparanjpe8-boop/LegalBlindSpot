export const TRUST_TIERS = {
  elite: { label: 'Elite', min: 85, max: 100, color: 'var(--trust-elite)', symbol: 'S' },
  trusted: { label: 'Trusted', min: 70, max: 84, color: 'var(--trust-trusted)', symbol: 'V' },
  established: { label: 'Established', min: 50, max: 69, color: 'var(--trust-established)', symbol: '~' },
  unverified: { label: 'Unverified', min: 30, max: 49, color: 'var(--trust-unverified)', symbol: '!' },
  incomplete: { label: 'Incomplete', min: 0, max: 29, color: 'var(--trust-incomplete)', symbol: 'X' }
};

export function getTierFromScore(score) {
  if (score >= 85) return TRUST_TIERS.elite;
  if (score >= 70) return TRUST_TIERS.trusted;
  if (score >= 50) return TRUST_TIERS.established;
  if (score >= 30) return TRUST_TIERS.unverified;
  return TRUST_TIERS.incomplete;
}

export function getTierColor(score) {
  return getTierFromScore(score).color;
}

export function getTierLabel(score) {
  return getTierFromScore(score).label;
}
