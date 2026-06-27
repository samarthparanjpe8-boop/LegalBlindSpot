const mongoose = require('mongoose');

const documentChecklistSchema = new mongoose.Schema(
  {
    document: String,
    whyNeeded: String,
  },
  { _id: false }
);

const caseAssessmentSchema = new mongoose.Schema({
  userDescription: String,
  detectedCaseType: String,
  viabilityScore: Number,
  viabilityVerdict: String,
  documentChecklist: [documentChecklistSchema],
  nextSteps: [String],
  urgency: { type: String, enum: ['low', 'medium', 'high'] },
  recommendedAdvocates: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Advocate' }],
  budgetInr: Number,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('CaseAssessment', caseAssessmentSchema);
