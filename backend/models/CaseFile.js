const mongoose = require('mongoose');

const documentRequiredSchema = new mongoose.Schema(
  {
    document: String,
    whyNeeded: String,
    uploaded: { type: Boolean, default: false },
  },
  { _id: false }
);

const adviceCheckSchema = new mongoose.Schema(
  {
    adviceClaimed: String,
    verdict: String,
    explanation: String,
    confidence: String,
    checkedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const caseFileSchema = new mongoose.Schema({
  sessionId: String,
  caseType: String,
  city: String,
  budgetInr: Number,
  documentsRequired: [documentRequiredSchema],
  documentsUploaded: [String],
  caseSummary: String,
  adviceChecks: [adviceCheckSchema],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('CaseFile', caseFileSchema);
