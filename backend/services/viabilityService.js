const chalk = require('chalk');
const geminiService = require('./geminiService');

function verdictColor(verdict) {
  switch (verdict) {
    case 'Correct':
      return chalk.green;
    case 'Partially Correct':
      return chalk.yellow;
    case 'Incorrect':
      return chalk.red;
    case 'Misleading':
      return chalk.magenta;
    default:
      return chalk.white;
  }
}

async function runAssessment(session, description, documentsAvailable) {
  if (!session.detectedCaseType) {
    console.log(chalk.red('No case type detected yet. Describe your problem or run intake first.'));
    return null;
  }

  const desc = description || session.lastUserMessage || 'Case described in session';
  const docs = documentsAvailable || [];

  const result = await geminiService.assessViability(
    desc,
    session.detectedCaseType,
    docs
  );

  printViabilityResult(result);
  return result;
}

function printViabilityResult(result) {
  const border = chalk.yellow;
  const worthLabel = result.worthPursuing ? chalk.green('Yes') : chalk.red('No');

  console.log('');
  console.log(border('  +---------------------------------------------+'));
  console.log(border('  |  Case Viability Assessment                  |'));
  console.log(border('  +---------------------------------------------+'));
  console.log(
    border('  |') +
      `  Viability Score:   ${chalk.white.bold(result.viabilityScore)}/100  (${result.verdict})`.padEnd(
        53
      ) +
      border('|')
  );
  console.log(
    border('  |') +
      `  Estimated Cost:    Rs.${result.estimatedCostMin.toLocaleString('en-IN')} - Rs.${result.estimatedCostMax.toLocaleString('en-IN')}`.padEnd(
        53
      ) +
      border('|')
  );
  console.log(
    border('  |') +
      `  Timeline:          ${result.estimatedTimeline}`.padEnd(53) +
      border('|')
  );
  console.log(
    border('  |') +
      `  Worth Pursuing:    ${worthLabel}`.padEnd(53) +
      border('|')
  );
  console.log(border('  +---------------------------------------------+'));
  console.log(border('  |  Strengths:                                  |'));
  (result.strengths || []).forEach((s) => {
    console.log(border('  |') + chalk.green(`    + ${s}`).padEnd(53) + border('|'));
  });
  console.log(border('  |                                             |'));
  console.log(border('  |  Weaknesses:                                |'));
  (result.weaknesses || []).forEach((w) => {
    console.log(border('  |') + chalk.red(`    - ${w}`).padEnd(53) + border('|'));
  });
  console.log(border('  +---------------------------------------------+'));
  console.log(border('  |  Honest Advice:                             |'));
  const adviceLines = result.honestAdvice.match(/.{1,45}/g) || [result.honestAdvice];
  adviceLines.forEach((line) => {
    console.log(border('  |') + chalk.cyan(`  ${line}`).padEnd(53) + border('|'));
  });
  console.log(border('  +---------------------------------------------+'));
  console.log('');
}

module.exports = { runAssessment, printViabilityResult };
