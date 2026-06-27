const mongoose = require('mongoose');
const fs = require('fs');

mongoose.connection.on('error', (err) => {
  fs.writeFileSync('db_test_result.txt', 'ASYNC DB CONNECTION ERROR: ' + err.message + '\nStack: ' + err.stack + '\nAT ' + new Date().toISOString());
  console.error('MongoDB async connection error:', err);
});

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set in .env');
  }
  await mongoose.connect(uri);
}

module.exports = { connectDB };
