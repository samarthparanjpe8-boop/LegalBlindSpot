require('dotenv').config();
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');
const chokidar = require('chokidar');

const { connectDB } = require('./db/connection');
const Advocate = require('./models/Advocate');
const CaseAssessment = require('./models/CaseAssessment');
const CaseFile = require('./models/CaseFile');
const geminiService = require('./services/geminiService');
const { calculateTrustScore } = require('./services/trustScoreService');
const { runAssessment } = require('./services/viabilityService');
const { runAdviceCheck } = require('./services/adviceCheckerService');
const { runIntakeFlow } = require('./services/intakeService');
const { printAdvocateCard } = require('./utils/display');

const CASES_DIR = path.join(__dirname, 'legallink-cases');

let fileWatcher = null;
let session = null;
let rl = null;

function createSession() {
  return {
    id: String(Date.now()),
    userCity: null,
    userBudget: null,
    detectedCaseType: null,
    conversationHistory: [],
    caseFileId: null,
    caseFolderPath: null,
    uploadFolderPath: null,
    lastUserMessage: null,
    lastViabilityResult: null,
    intakeAnswers: null,
  };
}

function printBanner() {
  console.log(chalk.cyan(`
  +==================================================+
  |     LegalLink -- Free Legal Help for India       |
  |     Powered by Gemini AI  |  Trust Verified      |
  |     Type 'help' for commands  |  'exit' to quit   |
  +==================================================+
`));
}

function printHelp() {
  console.log(chalk.cyan('\n--- Commands ---\n'));
  const commands = [
    ['help', 'Show all commands'],
    ['budget [amount]', 'Update budget e.g. "budget 3000"'],
    ['city [name]', 'Update city e.g. "city Mumbai"'],
    ['advocates', 'Show top 5 matching advocates for current session'],
    ['trust [name]', 'Show full trust breakdown for a named advocate'],
    ['assess', 'Run Case Viability Assessment for current case'],
    ['checkadvice', 'Run Advice Checker flow'],
    ['intake', 'Restart guided intake questionnaire'],
    ['mydocs', 'Show document checklist progress'],
    ['casefile', 'Show full case summary'],
    ['leaderboard', 'Top 5 highest trust score advocates across all cities'],
    ['mysession', 'Show city, budget, case type, session id'],
    ['clear', 'Reset conversation history (keep session)'],
    ['exit', 'Save session summary and quit'],
  ];
  commands.forEach(([cmd, desc]) => {
    console.log(`  ${chalk.white.bold(cmd.padEnd(20))} ${chalk.gray(desc)}`);
  });
  console.log('');
}

function askQuestion(prompt) {
  if (!rl) {
    throw new Error('Terminal input is not ready. Please restart the app.');
  }
  return new Promise((resolve) => {
    rl.question(chalk.white.bold(prompt), (answer) => {
      resolve(answer.trim());
    });
  });
}

async function runOnboarding() {
  session.userCity = await askQuestion('Welcome! Before we begin, which city are you in? ');
  const budgetStr = await askQuestion(
    'What is your maximum budget for a lawyer consultation? (in Rs.) '
  );
  session.userBudget = parseInt(budgetStr.replace(/[^0-9]/g, ''), 10) || 2000;
  console.log(
    chalk.gray(
      `\nSession started. City: ${session.userCity} | Budget: Rs.${session.userBudget}\n`
    )
  );
}

async function queryAdvocates(withinBudget = true) {
  if (!session.detectedCaseType || !session.userCity) {
    return { advocates: [], overBudget: [] };
  }

  const baseFilter = {
    practiceAreas: { $regex: session.detectedCaseType, $options: 'i' },
    city: { $regex: new RegExp(`^${session.userCity}$`, 'i') },
  };

  if (withinBudget && session.userBudget) {
    baseFilter.consultationFeeInr = { $lte: session.userBudget };
  }

  let advocates = await Advocate.find(baseFilter).sort({ ratingAvg: -1 }).limit(5).lean();

  advocates = advocates.map((adv) => ({
    ...adv,
    trustResult: calculateTrustScore(adv),
  }));

  advocates.sort((a, b) => b.trustResult.score - a.trustResult.score);

  if (withinBudget) {
    if (advocates.length > 0) {
      return { advocates: advocates.slice(0, 3), overBudget: [] };
    }
    return queryAdvocates(false);
  }

  return { advocates: [], overBudget: advocates.slice(0, 2) };
}

async function queryAllMatchingAdvocates(limit = 5) {
  if (!session.detectedCaseType || !session.userCity) {
    return [];
  }

  let advocates = await Advocate.find({
    practiceAreas: { $regex: session.detectedCaseType, $options: 'i' },
    city: { $regex: new RegExp(`^${session.userCity}$`, 'i') },
    consultationFeeInr: { $lte: session.userBudget || 999999 },
  })
    .sort({ ratingAvg: -1 })
    .limit(limit)
    .lean();

  advocates = advocates.map((adv) => ({
    ...adv,
    trustResult: calculateTrustScore(adv),
  }));

  advocates.sort((a, b) => b.trustResult.score - a.trustResult.score);
  return advocates;
}

function buildContextString(advocatesWithScores) {
  const payload = advocatesWithScores.map((adv) => ({
    name: adv.name,
    city: adv.city,
    fee: adv.consultationFeeInr,
    trustScore: adv.trustResult.score,
    badge: adv.trustResult.breakdown.badge,
    practiceAreas: adv.practiceAreas,
    caseHistory: adv.caseHistory,
  }));

  return `SYSTEM CONTEXT (not visible to user):
City: ${session.userCity} | Budget: Rs.${session.userBudget} | Case: ${session.detectedCaseType}
Matching advocates sorted by trust score:
${JSON.stringify(payload, null, 2)}`;
}

function printBudgetWarning(overBudgetAdvocates) {
  console.log(
    chalk.magenta(
      `\nNo advocates found in ${session.userCity} within Rs.${session.userBudget} for ${session.detectedCaseType}.`
    )
  );
  console.log(chalk.magenta('Closest options above your budget:\n'));
  overBudgetAdvocates.forEach((adv) => {
    printAdvocateCard(adv, adv.trustResult, session.userBudget);
  });
}

async function createCaseFolder(description) {
  const dateStr = new Date().toISOString().slice(0, 10);
  const safeCaseType = (session.detectedCaseType || 'general').replace(/\s+/g, '_');
  const folderName = `${session.id}_${safeCaseType}_${dateStr}`;
  const caseFolder = path.join(CASES_DIR, folderName);
  const uploadFolder = path.join(caseFolder, 'uploaded');

  fs.mkdirSync(uploadFolder, { recursive: true });

  let checklist = [];
  try {
    checklist = await geminiService.getDocumentChecklist(
      session.detectedCaseType,
      description || session.lastUserMessage || ''
    );
  } catch {
    checklist = [
      { document: 'Written agreement or contract', whyNeeded: 'Proves terms of the dispute' },
      { document: 'Payment receipts', whyNeeded: 'Shows financial transactions' },
      { document: 'Communication records', whyNeeded: 'Documents conversations with other party' },
      { document: 'Identity proof', whyNeeded: 'Required for filing' },
    ];
  }

  const checklistText = checklist
    .map((item, i) => `${i + 1}. ${item.document}\n   Why: ${item.whyNeeded}`)
    .join('\n\n');

  fs.writeFileSync(
    path.join(caseFolder, 'checklist.txt'),
    `LegalLink Document Checklist\nCase: ${session.detectedCaseType}\nSession: ${session.id}\n\n${checklistText}`
  );

  fs.writeFileSync(
    path.join(caseFolder, 'DROP_FILES_HERE.txt'),
    `Drop your documents into the /uploaded subfolder.\nLegalLink will detect them automatically.\n\nRequired documents are listed in checklist.txt.`
  );

  const documentsRequired = checklist.map((item) => ({
    document: item.document,
    whyNeeded: item.whyNeeded,
    uploaded: false,
  }));

  const caseFile = await CaseFile.create({
    sessionId: session.id,
    caseType: session.detectedCaseType,
    city: session.userCity,
    budgetInr: session.userBudget,
    documentsRequired,
    documentsUploaded: [],
    caseSummary: description || session.lastUserMessage || '',
  });

  session.caseFileId = caseFile._id;
  session.caseFolderPath = caseFolder;
  session.uploadFolderPath = uploadFolder;

  startFileWatcher(uploadFolder);
  console.log(chalk.gray(`\nCase folder created: ${caseFolder}\n`));
}

function startFileWatcher(uploadFolder) {
  if (fileWatcher) {
    fileWatcher.close();
  }

  fileWatcher = chokidar.watch(uploadFolder, {
    ignored: /(^|[\/\\])\../,
    persistent: true,
    ignoreInitial: true,
  });

  fileWatcher.on('add', async (filePath) => {
    const filename = path.basename(filePath);
    await handleDocumentUpload(filename);
  });
}

async function handleDocumentUpload(filename) {
  if (!session.caseFileId) return;

  const caseFile = await CaseFile.findById(session.caseFileId);
  if (!caseFile) return;

  if (!caseFile.documentsUploaded.includes(filename)) {
    caseFile.documentsUploaded.push(filename);
  }

  caseFile.documentsRequired.forEach((doc) => {
    const docLower = doc.document.toLowerCase();
    const fileLower = filename.toLowerCase();
    if (
      fileLower.includes(docLower.split(' ')[0]) ||
      docLower.split(' ').some((word) => word.length > 4 && fileLower.includes(word))
    ) {
      doc.uploaded = true;
    }
  });

  await caseFile.save();

  console.log(chalk.blue(`\nDocument detected: ${filename}`));
  console.log(chalk.blue('Added to your case file.\n'));
  printChecklistProgress(caseFile);
}

function printChecklistProgress(caseFile) {
  const docs = caseFile.documentsRequired || [];
  const uploaded = caseFile.documentsUploaded || [];

  console.log(chalk.white.bold('Checklist progress:'));
  docs.forEach((doc) => {
    if (doc.uploaded) {
      console.log(chalk.green(`  [x] ${doc.document}`));
    } else {
      console.log(chalk.red(`  [ ] ${doc.document} -- still needed`));
    }
  });

  const readyCount = docs.filter((d) => d.uploaded).length;
  console.log(chalk.gray(`\n${readyCount} of ${docs.length} key documents ready.\n`));
}

async function showMyDocs() {
  if (!session.caseFileId) {
    console.log(chalk.red('No case file yet. Describe your legal problem first.'));
    return;
  }
  const caseFile = await CaseFile.findById(session.caseFileId);
  if (!caseFile) {
    console.log(chalk.red('Case file not found.'));
    return;
  }
  printChecklistProgress(caseFile);
  if (caseFile.documentsUploaded.length) {
    console.log(chalk.gray('Uploaded files:'));
    caseFile.documentsUploaded.forEach((f) => console.log(chalk.gray(`  - ${f}`)));
    console.log('');
  }
}

async function showCaseFile() {
  if (!session.caseFileId) {
    console.log(chalk.red('No case file yet. Describe your legal problem first.'));
    return;
  }
  const caseFile = await CaseFile.findById(session.caseFileId);
  if (!caseFile) {
    console.log(chalk.red('Case file not found.'));
    return;
  }

  console.log(chalk.cyan('\n--- Case File Summary ---\n'));
  console.log(chalk.white.bold(`Session ID: ${caseFile.sessionId}`));
  console.log(chalk.white(`Case Type: ${caseFile.caseType}`));
  console.log(chalk.white(`City: ${caseFile.city}`));
  console.log(chalk.white(`Budget: Rs.${caseFile.budgetInr}`));
  console.log(chalk.white(`Summary: ${caseFile.caseSummary}`));
  console.log(chalk.white(`Created: ${caseFile.createdAt.toISOString()}`));

  if (caseFile.adviceChecks && caseFile.adviceChecks.length) {
    console.log(chalk.white.bold('\nAdvice Checks:'));
    caseFile.adviceChecks.forEach((check, i) => {
      console.log(chalk.gray(`  ${i + 1}. "${check.adviceClaimed}" -> ${check.verdict}`));
    });
  }
  console.log('');
}

async function showLeaderboard() {
  const allAdvocates = await Advocate.find({}).lean();
  const scored = allAdvocates
    .map((adv) => ({ ...adv, trustResult: calculateTrustScore(adv) }))
    .sort((a, b) => b.trustResult.score - a.trustResult.score)
    .slice(0, 5);

  console.log(chalk.cyan('\n--- Trust Score Leaderboard ---\n'));
  scored.forEach((adv, i) => {
    console.log(
      chalk.white(
        `${i + 1}. ${adv.name} (${adv.city}) -- ${adv.trustResult.score}/100 [${adv.trustResult.breakdown.badge}]`
      )
    );
  });
  console.log('');
}

async function showTrustBreakdown(nameQuery) {
  if (!nameQuery) {
    console.log(chalk.red('Usage: trust [advocate name]'));
    return;
  }
  const advocate = await Advocate.findOne({
    name: { $regex: nameQuery, $options: 'i' },
  }).lean();

  if (!advocate) {
    console.log(chalk.red(`No advocate found matching "${nameQuery}".`));
    return;
  }

  const trustResult = calculateTrustScore(advocate);
  printAdvocateCard(advocate, trustResult, session.userBudget);
}

async function handleCommand(input) {
  const parts = input.trim().split(/\s+/);
  const cmd = parts[0].toLowerCase();

  switch (cmd) {
    case 'help':
      printHelp();
      return true;

    case 'budget': {
      const amount = parseInt(parts[1], 10);
      if (!amount) {
        console.log(chalk.red('Usage: budget [amount]'));
      } else {
        session.userBudget = amount;
        console.log(chalk.green(`Budget updated to Rs.${amount}`));
      }
      return true;
    }

    case 'city': {
      const city = parts.slice(1).join(' ');
      if (!city) {
        console.log(chalk.red('Usage: city [name]'));
      } else {
        session.userCity = city;
        console.log(chalk.green(`City updated to ${city}`));
      }
      return true;
    }

    case 'advocates': {
      if (!session.detectedCaseType) {
        console.log(chalk.red('No case type detected yet. Describe your problem first.'));
        return true;
      }
      const matching = await queryAllMatchingAdvocates(5);
      if (matching.length) {
        matching.forEach((adv) => printAdvocateCard(adv, adv.trustResult, session.userBudget));
      } else {
        const { overBudget } = await queryAdvocates(true);
        if (overBudget.length) {
          printBudgetWarning(overBudget);
        } else {
          console.log(chalk.magenta('No matching advocates found.'));
        }
      }
      return true;
    }

    case 'trust':
      await showTrustBreakdown(parts.slice(1).join(' '));
      return true;

    case 'assess':
      await runAssessment(session);
      return true;

    case 'checkadvice':
      await runAdviceCheck(session, rl);
      return true;

    case 'intake':
      await runIntakeFlow(session, rl);
      if (session.detectedCaseType && !session.caseFileId) {
        await createCaseFolder('');
        await runAssessment(session);
      }
      return true;

    case 'mydocs':
      await showMyDocs();
      return true;

    case 'casefile':
      await showCaseFile();
      return true;

    case 'leaderboard':
      await showLeaderboard();
      return true;

    case 'mysession':
      console.log(chalk.cyan('\n--- Session ---'));
      console.log(chalk.white(`ID: ${session.id}`));
      console.log(chalk.white(`City: ${session.userCity || 'not set'}`));
      console.log(chalk.white(`Budget: Rs.${session.userBudget || 'not set'}`));
      console.log(chalk.white(`Case Type: ${session.detectedCaseType || 'not detected'}`));
      console.log('');
      return true;

    case 'clear':
      session.conversationHistory = [];
      console.log(chalk.green('Conversation history cleared.'));
      return true;

    case 'exit':
      await saveAndExit();
      return 'exit';

    default:
      return false;
  }
}

async function saveAndExit() {
  if (session.detectedCaseType && session.lastUserMessage) {
    try {
      const advocates = await queryAllMatchingAdvocates(3);
      await CaseAssessment.create({
        userDescription: session.lastUserMessage,
        detectedCaseType: session.detectedCaseType,
        viabilityScore: session.lastViabilityResult?.viabilityScore || null,
        viabilityVerdict: session.lastViabilityResult?.verdict || null,
        documentChecklist: session.lastViabilityResult
          ? []
          : [],
        nextSteps: [],
        urgency: 'medium',
        recommendedAdvocates: advocates.map((a) => a._id),
        budgetInr: session.userBudget,
      });
    } catch {
      // non-fatal on exit
    }
  }

  if (fileWatcher) fileWatcher.close();
  console.log(chalk.gray('\nThank you for using LegalLink. Goodbye.\n'));
  rl.close();
  process.exit(0);
}

async function processMessage(message) {
  session.lastUserMessage = message;

  const detection = await geminiService.detectCaseAndBudget(message);

  if (detection.budgetMentioned) {
    session.userBudget = detection.budgetMentioned;
  }
  if (detection.cityMentioned) {
    session.userCity = detection.cityMentioned;
  }

  const isNewCase =
    detection.caseType && !session.detectedCaseType;

  if (isNewCase) {
    session.detectedCaseType = detection.caseType;
    console.log(chalk.gray(`\nCase type detected: ${detection.caseType}\n`));

    try {
      session.lastViabilityResult = await runAssessment(session, message);
    } catch {
      session.lastViabilityResult = null;
    }
    try {
      await createCaseFolder(message);
    } catch {
      // case folder is optional; chat continues
    }
  }

  if (detection.legalProblemDetected && !session.detectedCaseType) {
    await runIntakeFlow(session, rl);
    if (session.detectedCaseType && !session.caseFileId) {
      await createCaseFolder(message);
      session.lastViabilityResult = await runAssessment(session, message);
    }
  }

  let { advocates, overBudget } = await queryAdvocates(true);

  const contextString = session.detectedCaseType
    ? buildContextString(advocates.length ? advocates : overBudget)
    : '';

  const spinner = ora({ text: 'LegalLink is thinking...', color: 'cyan' }).start();
  let firstToken = true;

  try {
    session.conversationHistory = await geminiService.chat(
      message,
      session.conversationHistory,
      contextString,
      (token) => {
        if (firstToken) {
          spinner.stop();
          firstToken = false;
          process.stdout.write(chalk.cyan('\nLegalLink: '));
        }
        process.stdout.write(chalk.cyan(token));
      }
    );

    if (firstToken) spinner.stop();
    console.log('\n');
  } catch (err) {
    spinner.fail(chalk.red.bold(`Error: ${err.message}`));
    return;
  }

  if (advocates.length) {
    console.log(chalk.cyan('Recommended advocates:\n'));
    advocates.forEach((adv) => printAdvocateCard(adv, adv.trustResult, session.userBudget));
  } else if (overBudget.length && session.detectedCaseType) {
    printBudgetWarning(overBudget);
  }

  if (detection.legalProblemDetected || isNewCase) {
    try {
      await CaseAssessment.create({
        userDescription: message,
        detectedCaseType: session.detectedCaseType,
        viabilityScore: session.lastViabilityResult?.viabilityScore || null,
        viabilityVerdict: session.lastViabilityResult?.verdict || null,
        documentChecklist: [],
        nextSteps: [],
        urgency: detection.urgency || 'medium',
        recommendedAdvocates: advocates.map((a) => a._id),
        budgetInr: session.userBudget,
      });
    } catch {
      // non-fatal
    }
  }
}

async function main() {
  fs.mkdirSync(CASES_DIR, { recursive: true });

  try {
    await connectDB();
  } catch (err) {
    console.error(chalk.red.bold(`MongoDB connection failed: ${err.message}`));
    process.exit(1);
  }

  session = createSession();
  printBanner();

  rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  await runOnboarding();

  const promptLoop = () => {
    rl.question(chalk.white.bold('\nYou: '), async (input) => {
      const trimmed = input.trim();
      if (!trimmed) {
        promptLoop();
        return;
      }

      const cmdResult = await handleCommand(trimmed);
      if (cmdResult === 'exit') return;
      if (cmdResult === true) {
        promptLoop();
        return;
      }

      await processMessage(trimmed);
      promptLoop();
    });
  };

  promptLoop();
}

main().catch((err) => {
  console.error(chalk.red.bold('LegalLink encountered an error. Please try again.'));
  if (process.env.DEBUG) {
    console.error(chalk.gray(err.message));
  }
  process.exit(1);
});
