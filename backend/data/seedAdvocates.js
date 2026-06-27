const CASE_AREAS = [
  'Property Disputes',
  'Consumer Complaints',
  'Employment Law',
  'Family Law',
  'Criminal Defense',
  'Tenant Rights',
  'Cybercrime',
  'RTI Cases',
];

const cityProfiles = [
  {
    city: 'Mumbai',
    state: 'Maharashtra',
    barPrefix: 'MH',
    phonePrefix: '98200',
    courtPrimary: 'Bombay High Court',
    languages: ['Hindi', 'English', 'Marathi'],
  },
  {
    city: 'Delhi',
    state: 'Delhi',
    barPrefix: 'DL',
    phonePrefix: '98110',
    courtPrimary: 'Delhi High Court',
    languages: ['Hindi', 'English', 'Punjabi'],
  },
  {
    city: 'Bangalore',
    state: 'Karnataka',
    barPrefix: 'KA',
    phonePrefix: '98450',
    courtPrimary: 'Karnataka High Court',
    languages: ['English', 'Kannada', 'Hindi'],
  },
  {
    city: 'Chennai',
    state: 'Tamil Nadu',
    barPrefix: 'TN',
    phonePrefix: '94440',
    courtPrimary: 'Madras High Court',
    languages: ['Tamil', 'English', 'Hindi'],
  },
  {
    city: 'Hyderabad',
    state: 'Telangana',
    barPrefix: 'TS',
    phonePrefix: '98480',
    courtPrimary: 'Telangana High Court',
    languages: ['Telugu', 'Hindi', 'English'],
  },
  {
    city: 'Pune',
    state: 'Maharashtra',
    barPrefix: 'MH',
    phonePrefix: '98230',
    courtPrimary: 'Pune District Court',
    languages: ['Marathi', 'Hindi', 'English'],
  },
  {
    city: 'Kolkata',
    state: 'West Bengal',
    barPrefix: 'WB',
    phonePrefix: '98300',
    courtPrimary: 'Calcutta High Court',
    languages: ['Bengali', 'Hindi', 'English'],
  },
  {
    city: 'Nagpur',
    state: 'Maharashtra',
    barPrefix: 'MH',
    phonePrefix: '98220',
    courtPrimary: 'Bombay High Court Nagpur Bench',
    languages: ['Marathi', 'Hindi', 'English'],
  },
];

const firstNames = [
  'Aarav',
  'Aditi',
  'Akash',
  'Ananya',
  'Arjun',
  'Bhavna',
  'Deepak',
  'Farah',
  'Isha',
  'Kabir',
  'Kavya',
  'Meera',
  'Nikhil',
  'Pooja',
  'Priya',
  'Rahul',
  'Rohan',
  'Sana',
  'Siddharth',
  'Vikram',
];

const lastNames = [
  'Sharma',
  'Mehta',
  'Iyer',
  'Khan',
  'Patel',
  'Rao',
  'Banerjee',
  'Desai',
  'Gupta',
  'Menon',
  'Reddy',
  'Naidu',
  'Joshi',
  'Verma',
  'Singh',
  'Chatterjee',
  'Nair',
  'Kulkarni',
  'Malhotra',
  'Bose',
];

function rotateAreas(start, count = 3) {
  return Array.from({ length: count }, (_, i) => CASE_AREAS[(start + i) % CASE_AREAS.length]);
}

function buildCaseHistory(practiceAreas, cityIndex, lawyerIndex) {
  const historyCount = lawyerIndex % 5 === 0 ? 3 : lawyerIndex % 3 === 0 ? 2 : 1;

  return practiceAreas.slice(0, historyCount).map((caseType, i) => ({
    caseType,
    casesHandled: 8 + cityIndex * 3 + lawyerIndex + i * 4,
    successRate: Math.min(88, 58 + ((cityIndex + lawyerIndex + i * 3) % 28)),
    sampleOutcome: `Handled ${caseType.toLowerCase()} matter in ${cityProfiles[cityIndex].city} with documented client relief.`,
  }));
}

function buildAdvocate(profile, cityIndex, lawyerIndex) {
  const sequence = cityIndex * 20 + lawyerIndex + 1;
  const practiceAreas = rotateAreas(cityIndex + lawyerIndex, lawyerIndex % 4 === 0 ? 4 : 3);
  const experienceYears = 2 + ((cityIndex * 4 + lawyerIndex * 2) % 19);
  const verified = lawyerIndex % 6 !== 0;
  const ratingAvg = Number((3.4 + ((cityIndex + lawyerIndex) % 15) / 10).toFixed(1));
  const totalReviews = 6 + ((cityIndex * 13 + lawyerIndex * 7) % 115);

  return {
    name: `Adv. ${firstNames[lawyerIndex]} ${lastNames[(cityIndex + lawyerIndex) % lastNames.length]}`,
    barRegistrationNo: `${profile.barPrefix}/${2005 + ((cityIndex + lawyerIndex) % 20)}/${String(sequence).padStart(5, '0')}`,
    city: profile.city,
    state: profile.state,
    languages: profile.languages,
    practiceAreas,
    courtPrimary: lawyerIndex % 4 === 3 ? 'District Court' : profile.courtPrimary,
    experienceYears,
    consultationFeeInr: 500 + ((lawyerIndex % 8) * 500),
    bio: `${profile.city}-based advocate handling ${practiceAreas.slice(0, 2).join(' and ').toLowerCase()} matters with ${experienceYears} years of practice.`,
    ratingAvg,
    totalReviews,
    verified,
    phone: `+91-${profile.phonePrefix}${String(10000 + sequence).slice(-5)}`,
    email: `${firstNames[lawyerIndex].toLowerCase()}.${lastNames[(cityIndex + lawyerIndex) % lastNames.length].toLowerCase()}.${profile.city.toLowerCase()}@legallink.example`,
    caseHistory: buildCaseHistory(practiceAreas, cityIndex, lawyerIndex),
  };
}

const advocates = cityProfiles.flatMap((profile, cityIndex) =>
  Array.from({ length: 20 }, (_, lawyerIndex) =>
    buildAdvocate(profile, cityIndex, lawyerIndex)
  )
);

module.exports = advocates;
