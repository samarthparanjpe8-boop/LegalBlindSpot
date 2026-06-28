const MAX_USER_MESSAGES = Number(process.env.CHAT_USER_MESSAGE_LIMIT) || 6;
const CHAT_SLOWDOWN_MS = Number(process.env.CHAT_SLOWDOWN_MS) || 3000;

const CASE_LEGAL_PROFILES = {
  'Criminal Defense': {
    sections: [
      'IPC/BNS Section 302 — Murder (life imprisonment or death penalty)',
      'IPC/BNS Section 304 — Culpable homicide not amounting to murder (up to 10 years + fine)',
      'IPC/BNS Section 323 — Voluntarily causing hurt (up to 1 year + fine)',
      'IPC/BNS Section 379 — Theft (up to 3 years + fine)',
      'IPC/BNS Section 420 — Cheating (up to 7 years + fine)',
    ],
    penalties: 'Penalties range from fines and short imprisonment (1–3 years) for minor offences to life imprisonment or death for murder, depending on the offence and evidence.',
    jailTime: 'Minor offences: up to 1–3 years. Serious offences (assault, fraud): 3–10 years. Murder/heinous crimes: life imprisonment or death penalty after trial.',
    evidenceNeeded: ['FIR copy', 'medical reports', 'witness statements', 'CCTV or photos', 'police diary entries'],
    followUpQuestions: [
      'Has an FIR been registered? If yes, what is the FIR number and police station?',
      'Are you the complainant or the accused?',
      'Do you have bail-related concerns or has anyone been arrested?',
    ],
  },
  'Tenant Rights': {
    sections: [
      'Rent Control Act (state-specific) — tenant protection against arbitrary eviction',
      'Transfer of Property Act Section 106 — lease termination notice requirements',
      'Consumer Protection Act — if landlord charged unfair maintenance/fees',
    ],
    penalties: 'Landlords who illegally evict or harass tenants may face civil damages, restoration orders, and in some states criminal penalties for utility cut-offs or lock-outs.',
    jailTime: 'Most tenant disputes are civil. Criminal action (wrongful restraint, trespass) may attract up to 3 years if the landlord used force illegally.',
    evidenceNeeded: ['rent agreement/lease', 'rent receipts', 'bank transfer records', 'notice from landlord', 'photos of property condition'],
    followUpQuestions: [
      'Is your rent agreement registered or only notarized?',
      'Has the landlord given a written eviction notice? When?',
      'Are you current on rent payments?',
    ],
  },
  'Employment Law': {
    sections: [
      'Industrial Disputes Act — wrongful termination and retrenchment',
      'Payment of Wages Act — unpaid salary recovery',
      'POSH Act — workplace sexual harassment complaints',
    ],
    penalties: 'Employers may be ordered to pay back wages, reinstate employees, and pay compensation. POSH violations can lead to fines and license cancellation.',
    jailTime: 'Salary/wrongful termination cases are usually civil. Criminal cases (assault at workplace, fraud) may carry 1–7 years depending on the offence.',
    evidenceNeeded: ['appointment letter', 'salary slips', 'termination letter', 'email/WhatsApp with HR', 'PF/ESI records'],
    followUpQuestions: [
      'Were you terminated verbally or with a written letter?',
      'How long were you employed and what was your last drawn salary?',
      'Did you receive full and final settlement?',
    ],
  },
  'Consumer Complaints': {
    sections: [
      'Consumer Protection Act 2019 — deficiency in service and unfair trade practices',
      'E-commerce Rules — refund and delivery disputes',
    ],
    penalties: 'Consumer forums can order refund, replacement, compensation (often ₹25,000–₹1,00,000+), and punitive damages against the seller/service provider.',
    jailTime: 'Consumer cases are civil. Criminal action under IPC Section 420 (cheating) is possible if fraud is proven — up to 7 years.',
    evidenceNeeded: ['invoice/bill', 'payment proof', 'product photos', 'warranty card', 'complaint emails to company'],
    followUpQuestions: [
      'When did you purchase the product/service and from which company?',
      'Did you raise a complaint with the company first? What was their response?',
      'Do you still have the defective product or only photos?',
    ],
  },
  'Family Law': {
    sections: [
      'Hindu Marriage Act / Special Marriage Act — divorce and judicial separation',
      'Domestic Violence Act — protection orders for abuse victims',
      'Guardian and Wards Act — child custody',
    ],
    penalties: 'Courts may grant maintenance, custody orders, and protection orders. Violating a protection order can lead to imprisonment up to 1 year.',
    jailTime: 'Divorce and custody are civil. Domestic violence (IPC 498A, DV Act) can lead to 1–3 years imprisonment for the abuser if proven.',
    evidenceNeeded: ['marriage certificate', 'photos of injuries', 'medical reports', 'messages showing abuse or neglect', 'income proof for maintenance'],
    followUpQuestions: [
      'Are you seeking divorce, custody, maintenance, or protection from abuse?',
      'How long have you been married and do you have children?',
      'Is there any existing court case or mutual agreement attempt?',
    ],
  },
  'Property Disputes': {
    sections: [
      'Transfer of Property Act — ownership and sale disputes',
      'Specific Relief Act — injunction against illegal possession',
      'Registration Act — validity of property documents',
    ],
    penalties: 'Courts may declare rightful ownership, order eviction of illegal occupants, and award damages for wrongful possession.',
    jailTime: 'Property disputes are civil. Forgery of documents (IPC 467/468) can attract up to 7 years imprisonment.',
    evidenceNeeded: ['sale deed', 'property tax receipts', 'encumbrance certificate', 'survey maps', 'inheritance will'],
    followUpQuestions: [
      'Is the property registered in your name or disputed by another party?',
      'Is someone illegally occupying the property right now?',
      'Do you have an encumbrance certificate from the sub-registrar?',
    ],
  },
  Cybercrime: {
    sections: [
      'IT Act Section 66C — identity theft (up to 3 years + ₹1 lakh fine)',
      'IT Act Section 66D — cheating by personation using computer (up to 3 years + ₹1 lakh fine)',
      'IPC Section 420 — online fraud/cheating (up to 7 years)',
    ],
    penalties: 'Cyber offences carry fines up to ₹1–5 lakh and imprisonment from 1 to 7 years depending on the offence (phishing, fraud, hacking, defamation).',
    jailTime: 'Identity theft/phishing: up to 3 years. Online financial fraud: 3–7 years under IPC 420 and IT Act combined.',
    evidenceNeeded: ['screenshots of chats/transactions', 'bank statements', 'cyber cell complaint copy', 'email headers', 'UPI transaction IDs'],
    followUpQuestions: [
      'Did you report this to the cyber crime portal (cybercrime.gov.in) or local cyber cell?',
      'How much money was lost and through which platform (UPI, bank, social media)?',
      'Do you know the scammer\'s phone number, UPI ID, or account details?',
    ],
  },
  'RTI Cases': {
    sections: [
      'Right to Information Act 2005 Section 6 — filing RTI applications',
      'RTI Act Section 18 — complaint to Information Commission for non-response',
    ],
    penalties: 'Information officers who wrongfully deny information can face penalties up to ₹25,000 deducted from salary. Commission can order disclosure.',
    jailTime: 'RTI matters are administrative/civil. No jail time for the applicant; penalties apply to non-compliant public officials.',
    evidenceNeeded: ['RTI application copy', 'postal receipt', 'PIO response or lack thereof', 'appeal documents'],
    followUpQuestions: [
      'Which government department or public authority did you apply to?',
      'When did you file the RTI and did you receive any response within 30 days?',
      'Have you filed a first appeal yet?',
    ],
  },
};

const EVIDENCE_KEYWORDS = [
  'document', 'proof', 'receipt', 'screenshot', 'email', 'whatsapp',
  'contract', 'agreement', 'photo', 'record', 'certificate', 'evidence',
  'no proof', 'no document', "don't have", 'dont have', 'nothing', 'none',
  'bank statement', 'letter', 'notice', 'fir', 'complaint',
];

function countUserMessages(history) {
  return (history || []).filter((h) => h.role === 'user').length;
}

function hasEvidenceMentioned(history) {
  const allUserText = (history || [])
    .filter((h) => h.role === 'user')
    .map((m) => m.content.toLowerCase())
    .join(' ');
  return EVIDENCE_KEYWORDS.some((k) => allUserText.includes(k));
}

function hasConceptShared(history) {
  const userMsgs = (history || []).filter((h) => h.role === 'user');
  return userMsgs.some((m) => m.content.trim().length > 25);
}

function getIntakePhase(session, currentMessage = '') {
  const history = session.history || [];
  const userMsgs = history.filter((h) => h.role === 'user');
  const allTexts = [...userMsgs.map((m) => m.content), currentMessage].filter(Boolean);

  if (allTexts.length <= 1 && !allTexts.some((t) => t.trim().length > 25)) {
    return 'intro';
  }
  if (!allTexts.some((t) => EVIDENCE_KEYWORDS.some((k) => t.toLowerCase().includes(k)))) {
    return 'evidence';
  }
  return 'solution';
}

function getLegalProfile(caseType) {
  return CASE_LEGAL_PROFILES[caseType] || {
    sections: [
      'Relevant IPC/BNS sections depend on the specific facts of your case',
      'Consumer Protection Act, Contract Act, or special statutes may also apply',
    ],
    penalties: 'Penalties vary by offence — from monetary compensation in civil matters to imprisonment in criminal cases.',
    jailTime: 'Jail time applies only in criminal matters and ranges from fines to several years depending on the offence severity.',
    evidenceNeeded: ['written agreements', 'payment records', 'communication logs', 'identity proof', 'photos or witness details'],
    followUpQuestions: [
      'Can you describe exactly what happened and when?',
      'Who is the other party involved?',
      'What outcome are you hoping for — compensation, justice, or settlement?',
    ],
  };
}

function formatAdvocateLine(advocates) {
  if (!advocates.length) {
    return 'Once intake is complete, I can match you with advocates in your city within your budget.';
  }
  const names = advocates.slice(0, 3).map((a) => `${a.name} (₹${a.consultationFeeInr || a.consultationFee}, trust ${a.trustScore}/100)`);
  return `Matching advocates: ${names.join('; ')}. You can view full profiles in the Advocates tab.`;
}

function buildIntroReply(message, detection, session) {
  const caseType = detection.caseType || session.caseType;
  const profile = caseType ? getLegalProfile(caseType) : null;

  let intro = 'Hello, I\'m LegalLink. I\'ll help you understand your legal position step by step.\n\n';
  intro += '**Step 1 — Understanding your problem**\n';
  intro += 'Please tell me:\n';
  intro += '• What exactly happened?\n';
  intro += '• When did it happen (date or approximate time)?\n';
  intro += '• Who is the other party (person, company, landlord, employer, etc.)?\n';

  if (caseType && profile) {
    intro += `\nBased on what you've shared, this looks like a **${caseType}** matter. `;
    intro += `Relevant laws may include: ${profile.sections.slice(0, 2).join('; ')}.\n`;
  } else if (detection.legalProblemDetected) {
    intro += '\nI can see you have a legal concern. Share a few more details so I can identify the correct laws that apply.\n';
  }

  intro += '\nNote: This is for informational purposes only and not formal legal advice.';
  return intro;
}

function buildEvidenceReply(message, detection, session) {
  const caseType = detection.caseType || session.caseType || 'your case';
  const profile = getLegalProfile(caseType);

  let reply = `Thank you for explaining your situation. I understand this is a **${caseType}** matter.\n\n`;
  reply += '**Step 2 — Evidence & documents**\n';
  reply += 'Strong cases depend on proof. Please tell me what you have:\n';
  profile.evidenceNeeded.forEach((doc) => {
    reply += `• ${doc}\n`;
  });
  reply += '\nEven if you don\'t have everything, mention what exists (screenshots, messages, receipts) or what is missing.\n';

  if (profile.sections.length) {
    reply += `\n**Preliminary applicable law:** ${profile.sections[0]}\n`;
  }

  const question = profile.followUpQuestions[0];
  if (question) {
    reply += `\n**Question for you:** ${question}\n`;
  }

  reply += '\nNote: This is for informational purposes only and not formal legal advice.';
  return reply;
}

function buildSolutionReply(message, detection, session, advocates) {
  const caseType = detection.caseType || session.caseType || 'General Legal Matter';
  const profile = getLegalProfile(caseType);

  let reply = `Based on what you've shared, here is my assessment for your **${caseType}** case.\n\n`;
  reply += '**Step 3 — Legal analysis & recommended solution**\n\n';

  reply += '**Applicable IPC / legal sections:**\n';
  profile.sections.forEach((s) => {
    reply += `• ${s}\n`;
  });

  reply += `\n**Expected penalties:** ${profile.penalties}\n`;
  reply += `\n**Possible jail time (if criminal):** ${profile.jailTime}\n`;

  reply += '\n**Recommended next steps:**\n';
  reply += '1. Collect and organize all documents listed above.\n';
  reply += '2. Write a short timeline of events (dates, people, amounts).\n';
  reply += '3. Consult a qualified advocate before paying large fees or signing anything.\n';
  reply += '4. File complaints through the correct forum (police/cyber cell, consumer forum, labour court, or civil court).\n';

  reply += `\n${formatAdvocateLine(advocates)}\n`;

  reply += '\n**Follow-up questions:**\n';
  profile.followUpQuestions.forEach((q, i) => {
    reply += `${i + 1}. ${q}\n`;
  });

  reply += '\nNote: This is for informational purposes only and not formal legal advice.';
  return reply;
}

function buildLimitReachedReply(session) {
  const caseType = session.caseType || 'your consultation';
  return (
    `**Consultation limit reached**\n\n` +
    `You have used all ${MAX_USER_MESSAGES} messages allowed for this session. ` +
    `To continue discussing your ${caseType} matter, please start a new consultation from the sidebar.\n\n` +
    `Your chat history is saved and you can review it anytime under Chat History.\n\n` +
    `Note: This is for informational purposes only and not formal legal advice.`
  );
}

function isLimitReached(session) {
  return countUserMessages(session.history || []) >= MAX_USER_MESSAGES;
}

function buildStructuredReply(message, session, detection, advocates) {
  if (isLimitReached(session)) {
    return buildLimitReachedReply(session);
  }

  const phase = getIntakePhase(session, message);

  switch (phase) {
    case 'intro':
      return buildIntroReply(message, detection, session);
    case 'evidence':
      return buildEvidenceReply(message, detection, session);
    case 'solution':
    default:
      return buildSolutionReply(message, detection, session, advocates);
  }
}

function buildRateLimitReply() {
  return (
    '**AI service limit reached**\n\n' +
    'Our legal AI is temporarily unavailable due to high demand or API quota limits. ' +
    'Please wait a few minutes and try again, or start a new session later.\n\n' +
    'Your message was received — you can still browse advocates and saved chat history.\n\n' +
    'Note: This is for informational purposes only and not formal legal advice.'
  );
}

function isRateLimitError(err) {
  const msg = err && err.message ? err.message : String(err);
  return msg.includes('429') || msg.includes('Too Many Requests') || msg.includes('quota');
}

module.exports = {
  MAX_USER_MESSAGES,
  CHAT_SLOWDOWN_MS,
  countUserMessages,
  getIntakePhase,
  isLimitReached,
  isRateLimitError,
  buildStructuredReply,
  buildLimitReachedReply,
  buildRateLimitReply,
};
