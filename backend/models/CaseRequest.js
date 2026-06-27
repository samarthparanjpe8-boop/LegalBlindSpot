const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
  filename: String,
  path: String,
  uploadedAt: { type: Date, default: Date.now },
}, { _id: false });

const caseRequestSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lawyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  caseType: { type: String, required: true },
  city: { type: String, required: true },
  description: { type: String, required: true },
  budgetInr: { type: Number },
  status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
  attachments: [attachmentSchema],
}, { timestamps: true });

module.exports = mongoose.model('CaseRequest', caseRequestSchema);
