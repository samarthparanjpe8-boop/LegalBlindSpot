const chalk = require('chalk');
const { formatBadge } = require('./trustBadge');

function printAdvocateCard(advocate, trustResult, userBudget) {
  const border = chalk.yellow;
  const gray = chalk.gray;
  const { score, breakdown } = trustResult;
  const badge = formatBadge(score);
  const fee = advocate.consultationFeeInr;
  const withinBudget = userBudget == null || fee <= userBudget;
  const feeText = withinBudget
    ? chalk.green(`Rs.${fee.toLocaleString('en-IN')} per consultation`)
    : chalk.red(
        `Rs.${fee.toLocaleString('en-IN')} per consultation (Rs.${(fee - userBudget).toLocaleString('en-IN')} over budget)`
      );

  const areas = (advocate.practiceAreas || []).join(', ');
  const langs = (advocate.languages || []).join(', ');
  const verifiedMark = advocate.verified ? 'Yes' : 'No';

  console.log(border('  +---------------------------------------------+'));
  console.log(
    border('  |') +
      `  ${advocate.name}`.padEnd(38) +
      badge.padStart(19) +
      border('|')
  );
  console.log(border(`  |  Trust Score: ${score}/100`.padEnd(45) + '|'));
  console.log(border('  +---------------------------------------------+'));
  console.log(
    border('  |') +
      `  ${advocate.city}  |  ${advocate.courtPrimary}`.padEnd(43) +
      border('|')
  );
  console.log(border('  |') + `  Practice: ${areas}`.slice(0, 44).padEnd(43) + border('|'));
  console.log(border('  |') + `  ${feeText}`.slice(0, 43).padEnd(43) + border('|'));
  console.log(
    border('  |') +
      `  Rating: ${advocate.ratingAvg}  |  ${advocate.totalReviews} reviews`.padEnd(43) +
      border('|')
  );
  console.log(border('  |') + `  Languages: ${langs}`.slice(0, 43).padEnd(43) + border('|'));
  console.log(
    border('  |') +
      `  Bar Reg: ${advocate.barRegistrationNo || 'N/A'}`.slice(0, 43).padEnd(43) +
      border('|')
  );
  console.log(border('  +---------------------------------------------+'));

  const history = advocate.caseHistory || [];
  if (history.length > 0) {
    console.log(border('  |  Case Experience:'.padEnd(45) + '|'));
    history.forEach((entry) => {
      const line = `  ${entry.caseType} -> ${entry.casesHandled} cases, ${entry.successRate}% success`;
      console.log(border('  |') + line.slice(0, 43).padEnd(43) + border('|'));
      const outcome = `  "${entry.sampleOutcome}"`;
      console.log(border('  |') + outcome.slice(0, 43).padEnd(43) + border('|'));
    });
    console.log(border('  +---------------------------------------------+'));
  }

  console.log(border('  |  Score breakdown:'.padEnd(45) + '|'));
  console.log(
    border('  |') +
      gray(
        `  Verified: ${verifiedMark}    Experience: ${breakdown.experience}/20`.padEnd(41)
      ) +
      border('|')
  );
  console.log(
    border('  |') +
      gray(`  Rating: ${breakdown.rating}/20  Reviews: ${breakdown.reviewCount}/15`.padEnd(41)) +
      border('|')
  );
  console.log(
    border('  |') +
      gray(
        `  Profile: ${breakdown.profileCompleteness}/10  Court: ${breakdown.specialisationDepth}/10`.padEnd(
          41
        )
      ) +
      border('|')
  );
  console.log(
    border('  |') +
      gray(`  Case History bonus: +${breakdown.caseHistoryBonus}`.padEnd(41)) +
      border('|')
  );
  console.log(border('  +---------------------------------------------+'));
  console.log('');
}

module.exports = { printAdvocateCard };
