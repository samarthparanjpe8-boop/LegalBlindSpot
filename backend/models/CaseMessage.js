const mongoose = require('mongoose');

const caseMessageSchema = new mongoose.Schema({
  caseRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CaseRequest',
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  senderRole: {
    type: String,
    enum: ['client', 'lawyer'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  attachments: [{
    filename: String,
    storedName: String,
    path: String,
  }],
  read: {
    type: Boolean,
    default: false,
  },
  readAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for efficient queries
caseMessageSchema.index({ caseRequest: 1, createdAt: -1 });
caseMessageSchema.index({ sender: 1 });
caseMessageSchema.index({ caseRequest: 1, read: 1 });

module.exports = mongoose.model('CaseMessage', caseMessageSchema);
