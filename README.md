# LegalLink - AI-Powered Legal Consultation Platform

A comprehensive legal consultation platform that connects clients with trusted advocates in India, featuring AI-powered case assessment, real-time encrypted chat, and trust-based lawyer matching.

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18 or newer
- **MongoDB** (local instance or MongoDB Atlas)
- **Gemini API Key** (from [Google AI Studio](https://makersuite.google.com/app/apikey))

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd LegalLine
```

2. **Backend Setup**

Open a terminal:
```bash
cd backend
npm install
```

Create `backend/.env` file:
```env
GEMINI_API_KEY=your_gemini_api_key
MONGODB_URI=your_mongodb_connection_string
GEMINI_MODEL=gemini-2.5-flash-lite
PORT=5000
JWT_SECRET=your-jwt-secret-min-32-chars
ENCRYPTION_KEY=your-64-character-hex-key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FRONTEND_URL=http://localhost:5173
APP_URL=http://localhost:3000
```

Generate encryption key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Seed the advocates database:
```bash
npm run seed
```

Start the backend:
```bash
npm start
```

Backend runs at: `http://localhost:5000`

3. **Frontend Setup**

Open a second terminal:
```bash
cd frontend/legalblindspot
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

## 📁 Project Structure

```
LegalLine/
├── backend/                    # Node.js API Server
│   ├── models/                # MongoDB schemas
│   │   ├── Advocate.js       # Lawyer profiles
│   │   ├── CaseFile.js       # Client case files
│   │   ├── CaseMessage.js    # Encrypted chat messages
│   │   ├── CaseRequest.js    # Consultation requests
│   │   └── User.js           # User accounts
│   ├── services/             # Business logic
│   │   ├── geminiService.js  # AI integration
│   │   ├── trustScoreService.js  # Trust calculation
│   │   └── encryption.js     # AES-256-GCM encryption
│   ├── data/                 # Seed data
│   │   └── seedAdvocates.js # 160 advocates (8 cities)
│   ├── server.js             # Express + Socket.io server
│   └── chat.js               # Terminal chatbot (legacy)
├── frontend/
│   └── legalblindspot/       # React + Vite app
│       ├── src/
│       │   ├── components/   # React components
│       │   │   ├── chat/     # AI chat interface
│       │   │   ├── shared/   # Shared components
│       │   │   │   └── CaseChat.jsx  # Real-time lawyer chat
│       │   │   ├── dashboard/  # Dashboard panels
│       │   │   └── lawyer/   # Lawyer dashboard
│       │   ├── pages/        # Page components
│       │   │   ├── DashboardPage.jsx
│       │   │   ├── LawyerClientCasePage.jsx
│       │   │   └── ClientLawyerChatPage.jsx
│       │   ├── hooks/        # Custom React hooks
│       │   ├── context/      # React context providers
│       │   └── services/     # API calls
│       └── package.json
└── README.md
```

## 🎯 Features

### For Clients

- **AI Legal Consultation**: Chat with AI to assess case viability
- **Case Viability Assessment**: Get scores, costs, timelines, and advice
- **Document Checklist**: AI-generated checklist based on case type
- **Advocate Matching**: Find trusted lawyers by city, case type, and budget
- **Trust Scores**: Transparent lawyer trust metrics
- **Real-Time Chat**: Encrypted messaging with lawyers
- **Case History**: Track all consultations and documents

### For Lawyers

- **Dashboard**: Manage client requests and cases
- **Capacity Management**: Set availability and client limits
- **Case Management**: Track case status and timeline
- **Private Notes**: Add confidential case notes
- **Document Access**: View client-uploaded documents
- **Real-Time Chat**: Secure communication with clients
- **Trust Profile**: Build and display trust metrics

### Security Features

- **AES-256-GCM Encryption**: All sensitive data encrypted at rest
- **JWT Authentication**: Secure token-based auth
- **Role-Based Access**: Client vs lawyer permissions
- **Email Verification**: Magic link authentication
- **Socket.io**: Real-time encrypted messaging

## 🏃 Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend/legalblindspot
npm run dev
```

Access at: `http://localhost:5173`

### Production Build

**Frontend:**
```bash
cd frontend/legalblindspot
npm run build
```

**Backend:**
```bash
cd backend
NODE_ENV=production npm start
```

### Terminal Chatbot (Legacy)

```bash
cd backend
npm run chat
```

## 🔧 Available Scripts

### Backend

- `npm start` - Start production server
- `npm run dev` - Start development server with hot reload
- `npm run seed` - Seed advocates database
- `npm run chat` - Run terminal chatbot

### Frontend

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## 🧪 Testing

### Health Check

```bash
curl http://localhost:5000/api/health
```

Expected: `{"ok": true}`

### API Endpoints

- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/chat` - AI chat
- `GET /api/advocates` - List advocates
- `POST /api/requests` - Create consultation request

## 📊 Database

### MongoDB Collections

- **users**: Client and lawyer accounts
- **advocates**: Lawyer profiles and trust data
- **casefiles**: Client consultation sessions
- **caserequests**: Lawyer consultation requests
- **casemessages**: Encrypted chat messages
- **caseassessments**: AI viability assessments
- **lawyernotes**: Private lawyer notes

### Seed Data

160 advocates across 8 cities:
- Mumbai, Delhi, Bangalore, Chennai
- Hyderabad, Pune, Kolkata, Nagpur
- 20 advocates per city with varying specializations

## 🔐 Environment Variables

Required in `backend/.env`:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/legalblindspot

# Security
JWT_SECRET=your-jwt-secret-min-32-chars
ENCRYPTION_KEY=your-64-character-hex-key

# AI
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash-lite

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Frontend
FRONTEND_URL=http://localhost:5173
APP_URL=http://localhost:3000
```

## 🐛 Troubleshooting

### Backend won't start
- Check MongoDB is running: `mongod` or verify Atlas connection
- Verify `.env` file exists with correct values
- Check port 5000 is not in use

### Frontend build fails
- Clear node_modules: `rm -rf node_modules && npm install`
- Check Node.js version (18+ required)

### AI chat not working
- Verify GEMINI_API_KEY is valid
- Check API quota in Google AI Studio
- Check network connectivity

### Real-time chat not connecting
- Verify Socket.io is running on backend
- Check CORS settings in server.js
- Ensure both frontend and backend are running

## 📚 Additional Documentation

- **TECHNICAL_DOCUMENTATION.md** - In-depth technical architecture
- **DEPLOYMENT.md** - Production deployment guide (internal)
- **ENCRYPTION_DOCUMENTATION.md** - Encryption details (internal)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

Proprietary - All rights reserved

## 📞 Support

For technical issues or questions, refer to the technical documentation or contact the development team.
