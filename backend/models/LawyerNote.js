const mongoose = require('mongoose');

const lawyerNoteSchema = new mongoose.Schema({
  lawyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  caseRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'CaseRequest', required: true },
  content: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('LawyerNote', lawyerNoteSchema);
