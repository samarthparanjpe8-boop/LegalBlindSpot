function scoreExperience(years) {
  if (years >= 15) return 20;
  if (years >= 10) return 15;
  if (years >= 5) return 10;
  if (years >= 2) return 5;
  return 0;
}

function scoreRating(rating) {
  if (rating >= 4.8) return 20;
  if (rating >= 4.5) return 16;
  if (rating >= 4.0) return 12;
  if (rating >= 3.5) return 8;
  if (rating >= 3.0) return 4;
  return 0;
}

function scoreReviewCount(count) {
  if (count >= 100) return 15;
  if (count >= 50) return 12;
  if (count >= 20) return 8;
  if (count >= 5) return 4;
  return 0;
}

function scoreProfileCompleteness(advocate) {
  let pts = 0;
  if (advocate.bio) pts += 2;
  if (advocate.phone) pts += 2;
  if (advocate.email) pts += 2;
  if (advocate.barRegistrationNo) pts += 2;
  if (advocate.languages && advocate.languages.length >= 2) pts += 2;
  return pts;
}

function scoreSpecialisationDepth(advocate) {
  let pts = 0;
  const areas = advocate.practiceAreas || [];
  if (areas.length >= 4) pts += 5;
  else if (areas.length >= 2) pts += 3;
  else if (areas.length === 1) pts += 1;

  const court = advocate.courtPrimary || '';
  if (court.includes('High Court') || court.includes('Supreme Court')) {
    pts += 5;
  }
  return Math.min(pts, 10);
}

function scoreCaseHistoryBonus(advocate) {
  const history = advocate.caseHistory || [];
  let bonus = 0;

  if (history.length >= 3) bonus += 5;

  const highSuccess = history.some((entry) => entry.successRate >= 75);
  if (highSuccess) bonus += 2;

  const totalCases = history.reduce((sum, entry) => sum + (entry.casesHandled || 0), 0);
  if (totalCases >= 50) bonus += 3;

  return bonus;
}

function calculateTrustScore(advocate) {
  const verification = advocate.verified ? 25 : 0;
  const experience = scoreExperience(advocate.experienceYears || 0);
  const rating = scoreRating(advocate.ratingAvg || 0);
  const reviewCount = scoreReviewCount(advocate.totalReviews || 0);
  const profileCompleteness = scoreProfileCompleteness(advocate);
  const specialisationDepth = scoreSpecialisationDepth(advocate);
  const caseHistoryBonus = scoreCaseHistoryBonus(advocate);

  const baseTotal =
    verification +
    experience +
    rating +
    reviewCount +
    profileCompleteness +
    specialisationDepth;

  const total = Math.min(100, baseTotal + caseHistoryBonus);
  const { getTrustBadge } = require('../utils/trustBadge');
  const { label: badge } = getTrustBadge(total);

  return {
    score: total,
    breakdown: {
      verification,
      experience,
      rating,
      reviewCount,
      profileCompleteness,
      specialisationDepth,
      caseHistoryBonus,
      total,
      badge,
    },
  };
}

module.exports = { calculateTrustScore };
