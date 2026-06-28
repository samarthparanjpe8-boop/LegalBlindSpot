const User = require('../models/User');
const CaseRequest = require('../models/CaseRequest');
const CaseFile = require('../models/CaseFile');
const Advocate = require('../models/Advocate');

const ACTIVE_CASE_STATUSES = ['Accepted', 'In Progress', 'Waiting for Documents', 'Filed'];

async function getLawyerActiveCount(lawyerId) {
  return CaseRequest.countDocuments({
    lawyer: lawyerId,
    status: 'accepted',
    caseStatus: { $in: ACTIVE_CASE_STATUSES },
  });
}

async function getLawyerCapacity(lawyerId) {
  const lawyer = await User.findById(lawyerId).lean();
  const max = lawyer?.maxActiveClients ?? 15;
  const current = await getLawyerActiveCount(lawyerId);
  const accepting = lawyer?.acceptingClients !== false && current < max;
  return {
    max,
    current,
    available: Math.max(0, max - current),
    accepting,
    acceptingClients: lawyer?.acceptingClients !== false,
  };
}

async function enrichAdvocateWithCapacity(advocate, normalizeAdvocate) {
  const normalized = normalizeAdvocate(advocate);
  if (!advocate.userId) {
    return {
      ...normalized,
      userId: null,
      lawyerUserId: null,
      canReceiveRequests: false,
      acceptingClients: false,
      availableSlots: 0,
    };
  }
  const capacity = await getLawyerCapacity(advocate.userId);
  return {
    ...normalized,
    userId: advocate.userId.toString(),
    lawyerUserId: advocate.userId.toString(),
    canReceiveRequests: capacity.accepting,
    acceptingClients: capacity.accepting,
    availableSlots: capacity.available,
    maxActiveClients: capacity.max,
    currentClients: capacity.current,
  };
}

async function createAdvocateForLawyer(user) {
  const existing = await Advocate.findOne({ userId: user._id });
  if (existing) return existing;

  const byEmail = await Advocate.findOne({ email: user.email.toLowerCase() });
  if (byEmail) {
    byEmail.userId = user._id;
    if (user.gender) byEmail.gender = user.gender;
    if (user.city) byEmail.city = user.city;
    if (user.name) byEmail.name = user.name;
    await byEmail.save();
    return byEmail;
  }

  return Advocate.create({
    userId: user._id,
    name: user.name || 'Advocate',
    email: user.email,
    city: user.city || 'Mumbai',
    state: 'Maharashtra',
    gender: user.gender,
    languages: ['English', 'Hindi'],
    practiceAreas: ['General Legal Dispute'],
    courtPrimary: 'District Court',
    experienceYears: 1,
    consultationFeeInr: 2000,
    bio: `${user.name || 'Legal professional'} – registered on LegalLink.`,
    ratingAvg: 4.0,
    totalReviews: 0,
    verified: false,
  });
}

async function buildCaseTimeline(request, client) {
  const events = [];

  if (client?.createdAt) {
    events.push({
      event: 'Account created',
      timestamp: client.createdAt,
      description: 'Client registered on LegalLink',
    });
  }

  const caseFiles = client?._id
    ? await CaseFile.find({ userId: client._id.toString() }).sort({ createdAt: 1 }).lean()
    : [];

  if (request.sessionId) {
    const primary = caseFiles.find((cf) => cf.sessionId === request.sessionId) || caseFiles[0];
    if (primary?.createdAt) {
      events.push({
        event: 'Chat started',
        timestamp: primary.createdAt,
        description: `Consultation session ${primary.sessionId}`,
      });
    }
    if (primary?.chatHistory?.length) {
      const firstMsg = primary.chatHistory[0]?.timestamp || primary.createdAt;
      events.push({
        event: 'Consultation in progress',
        timestamp: firstMsg,
        description: `${primary.chatHistory.length} messages exchanged`,
      });
    }
    (primary?.adviceChecks || []).forEach((check) => {
      events.push({
        event: 'Advice verification',
        timestamp: check.checkedAt,
        description: check.verdict || 'Advice checked',
      });
    });
    (primary?.documentsUploaded || []).forEach((doc) => {
      events.push({
        event: 'Document uploaded',
        timestamp: primary.updatedAt || primary.createdAt,
        description: doc,
      });
    });
  }

  events.push({
    event: 'Lawyer requested',
    timestamp: request.createdAt,
    description: 'Client sent consultation request',
  });

  if (request.acceptedAt) {
    events.push({
      event: 'Lawyer accepted',
      timestamp: request.acceptedAt,
      description: 'Request accepted by lawyer',
    });
  }

  if (request.completedAt) {
    events.push({
      event: 'Case completed',
      timestamp: request.completedAt,
      description: `Status: ${request.caseStatus}`,
    });
  }

  (request.timeline || []).forEach((item) => {
    const exists = events.some(
      (e) => e.event === item.event && new Date(e.timestamp).getTime() === new Date(item.timestamp).getTime()
    );
    if (!exists) events.push(item);
  });

  return events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

async function getLawyerDashboardStats(lawyerId) {
  const [pending, active, completed, capacity, recentRequests] = await Promise.all([
    CaseRequest.countDocuments({ lawyer: lawyerId, status: 'pending' }),
    getLawyerActiveCount(lawyerId),
    CaseRequest.countDocuments({ lawyer: lawyerId, caseStatus: { $in: ['Resolved', 'Closed'] } }),
    getLawyerCapacity(lawyerId),
    CaseRequest.find({ lawyer: lawyerId })
      .sort({ updatedAt: -1 })
      .limit(8)
      .populate('client', 'name gender city email')
      .lean(),
  ]);

  return {
    pendingRequests: pending,
    activeClients: active,
    availableSlots: capacity.available,
    totalCasesCompleted: completed,
    capacity,
    recentActivity: recentRequests.map((r) => ({
      id: r._id,
      clientName: r.client?.name || 'Client',
      caseType: r.caseType,
      status: r.caseStatus,
      requestStatus: r.status,
      timestamp: r.updatedAt,
    })),
  };
}

module.exports = {
  getLawyerActiveCount,
  getLawyerCapacity,
  enrichAdvocateWithCapacity,
  createAdvocateForLawyer,
  buildCaseTimeline,
  getLawyerDashboardStats,
  ACTIVE_CASE_STATUSES,
};
