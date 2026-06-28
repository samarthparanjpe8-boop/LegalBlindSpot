require('dotenv').config();
const { connectDB } = require('./db/connection');
const User = require('./models/User');
const Advocate = require('./models/Advocate');
const seedAdvocates = require('./data/seedAdvocates');
const bcrypt = require('bcrypt');

const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata', 'Nagpur'];
const DEFAULT_PASSWORD = 'password123';
const LAWYERS_PER_CITY = 10;

async function seed() {
  try {
    await connectDB();
    console.log('\n🌱  LegalLink – Seeding Lawyer Accounts\n');

    // Delete all existing lawyers + advocate profiles
    const deletedUsers = await User.deleteMany({ role: 'lawyer' });
    console.log(`🗑  Deleted ${deletedUsers.deletedCount} existing lawyer users.`);

    const deletedAdvocates = await Advocate.deleteMany({});
    console.log(`🗑  Deleted ${deletedAdvocates.deletedCount} existing advocate profiles.\n`);

    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    // Group seed advocates by city
    const advocatesByCity = {};
    seedAdvocates.forEach((adv) => {
      if (!advocatesByCity[adv.city]) advocatesByCity[adv.city] = [];
      advocatesByCity[adv.city].push(adv);
    });

    const summary = [];
    const advocatesToInsert = [];

    for (const city of CITIES) {
      const cityAdvocates = advocatesByCity[city] || [];
      const citySlug = city.toLowerCase().replace(/\s+/g, '');

      console.log(`📍 ${city} — ${Math.min(cityAdvocates.length, LAWYERS_PER_CITY)} linked accounts`);

      for (let i = 0; i < cityAdvocates.length; i++) {
        const adv = { ...cityAdvocates[i] };

        if (i < LAWYERS_PER_CITY) {
          // Standard predictable login: lawyer.<city><n>@legallink.com
          const email = `lawyer.${citySlug}${i + 1}@legallink.com`;

          const user = new User({
            name: adv.name,
            email,
            passwordHash,
            role: 'lawyer',
            city,
            emailVerified: true,
            maxActiveClients: 15,
            acceptingClients: true,
          });

          await user.save();

          // Link advocate to user
          adv.userId = user._id;
          adv.email = email;
          adv.verified = true;

          summary.push({ city, n: i + 1, email, name: adv.name });
          console.log(`   ✓  ${email}  (${adv.name})`);
        } else {
          // Directory-only (no login)
          adv.userId = undefined;
          adv.verified = false;
        }

        advocatesToInsert.push(adv);
      }

      console.log('');
    }

    await Advocate.insertMany(advocatesToInsert);
    console.log(`\n✅  Seeded ${advocatesToInsert.length} advocate profiles.`);
    console.log(`✅  Created ${summary.length} lawyer login accounts.\n`);

    console.log('═══════════════════════════════════════════════════════════');
    console.log('  LAWYER LOGIN CREDENTIALS (all cities)');
    console.log('  Password for ALL accounts: password123');
    console.log('═══════════════════════════════════════════════════════════');
    CITIES.forEach((city) => {
      const citySlug = city.toLowerCase().replace(/\s+/g, '');
      console.log(`\n  ${city}:`);
      for (let n = 1; n <= LAWYERS_PER_CITY; n++) {
        console.log(`    lawyer.${citySlug}${n}@legallink.com`);
      }
    });
    console.log('\n═══════════════════════════════════════════════════════════\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

seed();
