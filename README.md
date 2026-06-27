# LegalBlindSpot / LegalLink Running Guide

This project has two parts:

- `backend`: Node.js API, MongoDB models, Gemini chatbot logic, advocate seed data
- `frontend/legalblindspot`: React + Vite web app

## Prerequisites

- Node.js 18 or newer
- MongoDB connection string, local or Atlas
- Gemini API key

## 1. Backend Setup

Open a terminal from the project root:

```bash
cd backend
npm install
```

Create `backend/.env` if it does not already exist:

```env
GEMINI_API_KEY=your_gemini_api_key
MONGODB_URI=your_mongodb_connection_string
GEMINI_MODEL=gemini-2.5-flash-lite
PORT=5000
```

Seed the advocates database:

```bash
npm run seed
```

The seed contains `160` advocates total: `20` each for Mumbai, Delhi, Bangalore, Chennai, Hyderabad, Pune, Kolkata, and Nagpur.

If the database already has advocates, the seed script skips duplicates. To load fresh seed data, clear the existing advocates collection/database first, then run `npm run seed` again.

Start the backend API:

```bash
npm start
```

Backend should run at:

```text
http://localhost:5000
```

Health check:

```text
http://localhost:5000/api/health
```

## 2. Frontend Setup

Open a second terminal from the project root:

```bash
cd frontend/legalblindspot
npm install
npm run dev
```

Vite will print the local URL, usually one of:

```text
http://localhost:5173
http://127.0.0.1:3000
```

Open that URL in the browser.

## 3. Normal Run Commands

Terminal 1:

```bash
cd backend
npm start
```

Terminal 2:

```bash
cd frontend/legalblindspot
npm run dev
```

## 4. Optional Terminal Chatbot

The backend API is used by the web app. If you want the old terminal chatbot mode:

```bash
cd backend
npm run chat
```

## 5. Useful Checks

Frontend lint:

```bash
cd frontend/legalblindspot
npm run lint
```

Frontend production build:

```bash
cd frontend/legalblindspot
npm run build
```

Backend syntax check:

```bash
node -c backend/server.js
```

## 6. What Should Work

- Onboarding creates a backend session.
- Chat sends messages to `POST /api/chat`.
- Case type is detected from chat.
- Viability assessment returns score, verdict, cost, timeline, and advice.
- If viability score is below `50`, backend marks it as `Case is not fit for fighting`.
- Advocates tab and sidebar load matching lawyers by city, case type, and budget.
- Nagpur is supported.
- Leaderboard loads top advocates by trust score.
