const mongoose = require('mongoose');

const caseHistoryEntrySchema = new mongoose.Schema(
  {
    caseType: String,
    casesHandled: Number,
    successRate: Number,
    sampleOutcome: String,
  },
  { _id: false }
);

const advocateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  gender: String,
  name: String,
  barRegistrationNo: String,
  city: String,
  state: String,
  languages: [String],
  practiceAreas: [String],
  courtPrimary: String,
  experienceYears: Number,
  consultationFeeInr: Number,
  bio: String,
  ratingAvg: Number,
  totalReviews: Number,
  verified: Boolean,
  phone: String,
  email: String,
  caseHistory: [caseHistoryEntrySchema],
});

module.exports = mongoose.model('Advocate', advocateSchema);
