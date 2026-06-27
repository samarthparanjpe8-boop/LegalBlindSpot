const chalk = require('chalk');
const geminiService = require('./geminiService');
const CaseFile = require('../models/CaseFile');

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

function printAdviceResult(adviceClaimed, result) {
  const border = chalk.yellow;
  const colorFn = verdictColor(result.verdict);

  console.log('');
  console.log(border('  +---------------------------------------------+'));
  console.log(border('  |  Advice Check                               |'));
  console.log(border('  +---------------------------------------------+'));
  console.log(border('  |  You were told:                             |'));
  const claimLines = adviceClaimed.match(/.{1,43}/g) || [adviceClaimed];
  claimLines.forEach((line) => {
    console.log(border('  |') + `  "${line}"`.padEnd(45) + border('|'));
  });
  console.log(border('  +---------------------------------------------+'));
  console.log(
    border('  |') +
      `  Verdict:     ${colorFn(result.verdict)}`.padEnd(53) +
      border('|')
  );
  console.log(
    border('  |') +
      `  Confidence:  ${result.confidence}`.padEnd(45) +
      border('|')
  );
  console.log(border('  +---------------------------------------------+'));
  console.log(border('  |  Explanation:                               |'));
  const explLines = result.explanation.match(/.{1,43}/g) || [result.explanation];
  explLines.forEach((line) => {
    console.log(border('  |') + `  ${line}`.padEnd(45) + border('|'));
  });
  console.log(border('  |                                             |'));
  console.log(border('  |  Legal basis:                               |'));
  const basisLines = result.legalBasis.match(/.{1,43}/g) || [result.legalBasis];
  basisLines.forEach((line) => {
    console.log(border('  |') + `  ${line}`.padEnd(45) + border('|'));
  });
  console.log(border('  +---------------------------------------------+'));
  console.log(border('  |  Recommendation:                            |'));
  const recLines = result.recommendation.match(/.{1,43}/g) || [result.recommendation];
  recLines.forEach((line) => {
    console.log(border('  |') + `  ${line}`.padEnd(45) + border('|'));
  });
  console.log(border('  +---------------------------------------------+'));
  console.log('');
}

async function runAdviceCheck(session, readlineInterface) {
  return new Promise((resolve) => {
    console.log(chalk.white.bold('What did your lawyer or someone tell you? Type it out:'));
    readlineInterface.question(chalk.white.bold('> '), async (input) => {
      const adviceClaimed = input.trim();
      if (!adviceClaimed) {
        console.log(chalk.red('No advice provided.'));
        resolve();
        return;
      }

      try {
        const result = await geminiService.checkAdvice(
          adviceClaimed,
          session.detectedCaseType
        );
        printAdviceResult(adviceClaimed, result);

        if (session.caseFileId) {
          await CaseFile.findByIdAndUpdate(session.caseFileId, {
            $push: {
              adviceChecks: {
                adviceClaimed,
                verdict: result.verdict,
                explanation: result.explanation,
                confidence: result.confidence,
                checkedAt: new Date(),
              },
            },
          });
        }
      } catch (err) {
        console.log(chalk.red.bold(`Advice check failed: ${err.message}`));
      }
      resolve();
    });
  });
}

module.exports = { runAdviceCheck, printAdviceResult };
