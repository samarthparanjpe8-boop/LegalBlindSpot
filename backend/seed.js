require('dotenv').config();
const { connectDB } = require('./db/connection');
const Advocate = require('./models/Advocate');
const seedAdvocates = require('./data/seedAdvocates');

async function seed() {
  try {
    await connectDB();

    // Delete all existing advocates
    const deleted = await Advocate.deleteMany({});
    console.log(`Deleted ${deleted.deletedCount} existing advocates.`);

    // Insert fresh data
    await Advocate.insertMany(seedAdvocates);
    console.log(`${seedAdvocates.length} advocates seeded successfully.`);

    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

seed();