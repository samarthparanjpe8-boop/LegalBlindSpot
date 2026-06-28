const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
  filename: String,
  storedName: String,
  path: String,
  uploadedAt: { type: Date, default: Date.now },
}, { _id: false });

const timelineEventSchema = new mongoose.Schema({
  event: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  description: String,
}, { _id: false });

const caseRequestSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lawyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  advocateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Advocate' },
  sessionId: { type: String },
  caseType: { type: String, required: true },
  city: { type: String, required: true },
  description: { type: String, required: true },
  aiSummary: { type: String },
  clientGender: { type: String },
  budgetInr: { type: Number },
  status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
  caseStatus: {
    type: String,
    enum: ['Pending', 'Accepted', 'In Progress', 'Waiting for Documents', 'Filed', 'Resolved', 'Closed'],
    default: 'Pending',
  },
  declineReason: { type: String },
  acceptedAt: { type: Date },
  startedDate: { type: Date },
  completedAt: { type: Date },
  timeline: [timelineEventSchema],
  attachments: [attachmentSchema],
}, { timestamps: true });

module.exports = mongoose.model('CaseRequest', caseRequestSchema);
