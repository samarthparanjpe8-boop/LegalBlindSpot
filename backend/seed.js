require('dotenv').config();
const { connectDB } = require('./db/connection');
const Advocate = require('./models/Advocate');
const seedAdvocates = require('./data/seedAdvocates');

async function seed() {
  try {
    await connectDB();
    const count = await Advocate.countDocuments();
    if (count > 0) {
      console.log(`Database already has ${count} advocates. Skipping seed to avoid duplicates.`);
      console.log('To re-seed, drop the legallink database first.');
      process.exit(0);
    }

    await Advocate.insertMany(seedAdvocates);
    console.log(`25 advocates seeded successfully`);
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
