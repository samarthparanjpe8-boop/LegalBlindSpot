# LegalLink -- Terminal Chatbot

## What is this?

LegalLink is a free terminal-based legal assistant for first-time users in India. It helps you understand your legal situation in plain language, assess whether your case is worth pursuing, verify lawyer credibility through computed trust scores, check if legal advice you received sounds correct, and find advocates within your budget sorted by trustworthiness.

## Features

- AI-powered legal guidance using Google Gemini (gemini-2.5-flash-lite, free tier)
- Guided intake questionnaire for vague legal problems
- Case viability assessment with cost and timeline estimates
- Trust score system (0-100) computed at runtime for every advocate
- Advocate matching by city, case type, and budget
- Advice checker to verify claims made by lawyers or others
- Document vault with automatic file detection via folder watching
- MongoDB persistence for case assessments and case files
- 25 seeded advocates across major Indian cities

## Prerequisites

- Node.js v18 or higher
- MongoDB running locally (or MongoDB Atlas URI)
- A free Google Gemini API key

## Setup -- Step by Step

### Step 1: Install dependencies

```
cd backend
npm install
```

### Step 2: Get your free Gemini API key

1. Go to https://aistudio.google.com/app/apikey
2. Sign in with any Google account
3. Click "Create API Key"
4. Copy the key -- it starts with "AIza..."

Note: Gemini 1.5 Flash has been retired by Google. LegalLink uses `gemini-2.5-flash-lite` by default (free tier). You can override with `GEMINI_MODEL` in `.env`.
Free tier limits vary by model; see https://ai.google.dev/gemini-api/docs/rate-limits

### Step 3: Set up MongoDB

Option A -- Local MongoDB:

1. Install MongoDB from https://www.mongodb.com/try/download/community
2. Start it: `mongod --dbpath /data/db`
3. Your URI is: `mongodb://localhost:27017/legallink`

Option B -- MongoDB Atlas (free cloud):

1. Go to https://www.mongodb.com/atlas
2. Create a free account, then create a free M0 cluster
3. Click Connect, then Drivers, then copy the connection string
4. Replace `<password>` with your password in the string

### Step 4: Create your .env file

Create a file called `.env` inside `/backend` with this content:

```
GEMINI_API_KEY=AIzaXXXXXXXXXXXXXXXXXXXXXXXX
MONGODB_URI=mongodb://localhost:27017/legallink
GEMINI_MODEL=gemini-2.5-flash-lite
```

Never commit this file -- it is already in `.gitignore`.

### Step 5: Seed the database

```
node seed.js
```

You should see: `25 advocates seeded successfully`

Run this only once. Running it again will skip seeding to avoid duplicates.

### Step 6: Start the chatbot

```
node chat.js
```

Or:

```
npm start
```

## How to use it

### Basic flow

1. Enter your city when asked
2. Enter your budget in Rs. when asked
3. Describe your legal problem in plain language
4. LegalLink will detect your case type, assess viability, and recommend lawyers within your budget sorted by trust score

### Commands reference

| Command | Description |
|---------|-------------|
| `budget [amount]` | Update your budget e.g. "budget 3000" |
| `city [name]` | Update your city e.g. "city Mumbai" |
| `advocates` | Show matching lawyers for your session |
| `trust [name]` | Show full trust score breakdown for a lawyer |
| `assess` | Run case viability assessment |
| `checkadvice` | Check if legal advice you received is accurate |
| `intake` | Run guided questionnaire to identify your case type |
| `mydocs` | Show your document checklist progress |
| `casefile` | Show your full case summary |
| `leaderboard` | Top 5 most trusted lawyers across all cities |
| `mysession` | Show your current session details |
| `clear` | Reset conversation (keeps city and budget) |
| `exit` | Exit and save session |

## Trust Score explained

Each lawyer receives a score from 0-100 computed from:

- Verification status (25 pts)
- Years of experience (20 pts)
- Rating average (20 pts)
- Number of reviews (15 pts)
- Profile completeness (10 pts)
- Specialisation and court level (10 pts)
- Case history bonus (up to +10 pts, capped at 100 total)

Badges:

| Badge | Score Range |
|-------|-------------|
| Elite | 85-100 |
| Trusted | 70-84 |
| Established | 50-69 |
| Unverified | 30-49 |
| Incomplete | 0-29 |

## Document vault

When a case is detected, LegalLink creates a folder at:

```
/backend/legallink-cases/[sessionId]_[caseType]_[date]/
```

Drop your documents into the `/uploaded` subfolder.
LegalLink will detect them automatically and update your checklist.

## Troubleshooting

**"Cannot find module @google/generative-ai"**
Run `npm install` again inside `/backend`.

**"MongooseServerSelectionError"**
MongoDB is not running. Start it with `mongod`, or check your `MONGODB_URI` in `.env`.

**"API key not valid"**
Double check your `GEMINI_API_KEY` in `.env`. Make sure there are no spaces around the `=` sign.

**"0 advocates seeded"**
Delete the database and re-run: `node seed.js`

## Example conversation

```
LegalLink: Which city are you in?
You: Mumbai

LegalLink: What is your maximum budget for a consultation? (in Rs.)
You: 2000

You: My landlord has not returned my security deposit of Rs.50,000
     even though I moved out 3 months ago. He keeps making excuses.

LegalLink: [detects Tenant Rights case]
           [runs viability assessment automatically]
           [shows 3 advocates in Mumbai under Rs.2000, sorted by trust score]

You: checkadvice
LegalLink: What did your lawyer tell you?
You: My lawyer said I can only file in civil court not consumer court
LegalLink: [checks advice and returns verdict with explanation]
```
