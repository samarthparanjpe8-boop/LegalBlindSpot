const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  role: {
    type: String,
    enum: ['client', 'lawyer'],
    required: true,
    default: 'client',
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other', 'Prefer not to say'],
  },
  city: {
    type: String,
  },
  maxActiveClients: {
    type: Number,
    default: 15,
  },
  casesCompleted: {
    type: Number,
    default: 0,
  },
  acceptingClients: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', UserSchema);
