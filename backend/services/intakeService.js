const chalk = require('chalk');
const geminiService = require('./geminiService');

const Q1_OPTIONS = {
  1: 'individual',
  2: 'company',
  3: 'government',
  4: 'employer',
  5: 'landlord',
  6: 'family',
};

const Q2_BRANCHES = {
  landlord: {
    question: 'What happened?',
    options: {
      1: 'Wont return my security deposit',
      2: 'Trying to evict me illegally',
      3: 'Entered my home without permission',
      4: 'Not maintaining the property',
      5: 'Something else',
    },
  },
  employer: {
    question: 'What happened?',
    options: {
      1: 'Wrongful termination / fired unfairly',
      2: 'Salary not paid',
      3: 'Workplace harassment',
      4: 'PF / gratuity not given',
      5: 'Something else',
    },
  },
  company: {
    question: 'What happened?',
    options: {
      1: 'Sold me a defective product',
      2: 'Didnt deliver a service I paid for',
      3: 'Fraud or cheating',
      4: 'Data privacy violation',
      5: 'Something else',
    },
  },
  government: {
    question: 'What happened?',
    options: {
      1: 'Denied a service or benefit I am entitled to',
      2: 'Property acquisition / demolition notice',
      3: 'RTI request ignored',
      4: 'Police inaction',
      5: 'Something else',
    },
  },
  individual: {
    question: 'What happened?',
    options: {
      1: 'Physical assault',
      2: 'Cheating / fraud',
      3: 'Defamation',
      4: 'Property dispute',
      5: 'Something else',
    },
  },
  family: {
    question: 'What happened?',
    options: {
      1: 'Divorce or separation',
      2: 'Child custody',
      3: 'Property / inheritance dispute',
      4: 'Domestic violence',
      5: 'Something else',
    },
  },
};

const Q3_OPTIONS = {
  1: 'Written agreement or contract',
  2: 'WhatsApp or email messages',
  3: 'Receipts or payment proof',
  4: 'Photos or videos',
  5: 'Witness(es)',
  6: 'None of the above',
};

function askQuestion(rl, prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => resolve(answer.trim()));
  });
}

function printOptions(options) {
  Object.entries(options).forEach(([key, label]) => {
    console.log(chalk.gray(`  ${key}. ${label}`));
  });
}

async function runIntakeFlow(session, rl) {
  console.log(chalk.cyan('\n--- Guided Intake ---\n'));

  console.log(chalk.white.bold('Who is the other party involved?'));
  printOptions({
    1: 'An individual / person',
    2: 'A company or business',
    3: 'The government or a public body',
    4: 'My employer',
    5: 'My landlord or property owner',
    6: 'A family member',
  });

  const q1Answer = await askQuestion(rl, chalk.white.bold('Enter number: '));
  const partyType = Q1_OPTIONS[parseInt(q1Answer, 10)];

  if (!partyType) {
    console.log(chalk.red('Invalid selection. Intake cancelled.'));
    return null;
  }

  const branch = Q2_BRANCHES[partyType];
  console.log(chalk.white.bold(`\n${branch.question}`));
  printOptions(branch.options);

  const q2Answer = await askQuestion(rl, chalk.white.bold('Enter number: '));
  const q2Label = branch.options[parseInt(q2Answer, 10)] || 'Something else';

  console.log(chalk.white.bold('\nDo you have any of these? (select all that apply, comma-separated)'));
  printOptions(Q3_OPTIONS);

  const q3Answer = await askQuestion(rl, chalk.white.bold('Enter numbers (e.g. 1,3,5): '));
  const q3Selections = q3Answer
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => Q3_OPTIONS[n])
    .map((n) => Q3_OPTIONS[n]);

  const answers = {
    otherParty: partyType,
    whatHappened: q2Label,
    documentsAvailable: q3Selections.length ? q3Selections : ['None of the above'],
  };

  try {
    const result = await geminiService.runIntake(answers);

    console.log(chalk.cyan('\n--- Intake Result ---\n'));
    console.log(chalk.white.bold(`Case Type: ${result.detectedCaseType}`));
    console.log(chalk.cyan(result.explanation));
    console.log(chalk.gray(`Filing cost: ${result.filingCost}`));
    console.log(chalk.gray(`Common outcome: ${result.commonOutcome}`));
    console.log(
      chalk.white(
        `Suggested to proceed: ${result.suggestProceed ? 'Yes' : 'No'}`
      )
    );
    console.log('');

    session.detectedCaseType = result.detectedCaseType;
    session.intakeAnswers = answers;
    return result;
  } catch (err) {
    console.log(chalk.red.bold(`Intake failed: ${err.message}`));
    return null;
  }
}

module.exports = { runIntakeFlow };
