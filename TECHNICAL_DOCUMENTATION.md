# LegalLink Technical Documentation

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Backend Architecture](#backend-architecture)
3. [Frontend Architecture](#frontend-architecture)
4. [Data Flow](#data-flow)
5. [AI Integration](#ai-integration)
6. [Real-Time Communication](#real-time-communication)
7. [Security Implementation](#security-implementation)
8. [Database Schema](#database-schema)
9. [API Reference](#api-reference)
10. [Trust Score Algorithm](#trust-score-algorithm)

## System Architecture

LegalLink follows a modern full-stack architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Browser                        │
│                    (React + Vite SPA)                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTPS/TLS
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    Express.js Server                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   REST API   │  │  Socket.io   │  │  Middleware  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │
    ┌────────────────────┼────────────────────┐
    │                    │                    │
┌───▼────┐        ┌─────▼─────┐       ┌──────▼──────┐
│ MongoDB│        │ Gemini AI │       │  SMTP Email │
│ Database│        │  Service  │       │   Service   │
└────────┘        └───────────┘       └─────────────┘
```

### Technology Stack

**Backend:**
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Real-time**: Socket.io
- **Authentication**: JWT (JSON Web Tokens)
- **Encryption**: AES-256-GCM (Node.js crypto)
- **Email**: Nodemailer
- **AI**: Google Gemini API

**Frontend:**
- **Framework**: React 18
- **Build Tool**: Vite
- **Routing**: React Router v6
- **State Management**: React Context API + Custom Hooks
- **UI Components**: Lucide React Icons
- **Styling**: CSS-in-JS (styled-jsx) + Global CSS
- **Real-time**: Socket.io Client

## Backend Architecture

### Server Structure (server.js)

The Express server is organized into middleware, routes, and Socket.io handlers:

```javascript
// 1. Configuration & Setup
- Environment variables (.env)
- CORS configuration
- Body parsing
- Static file serving
- JWT authentication middleware

// 2. Database Connection
- MongoDB connection via Mongoose
- Connection error handling
- Model imports

// 3. Socket.io Setup
- HTTP server creation
- Socket.io instance with CORS
- User connection tracking
- Room-based messaging

// 4. REST API Routes
- Authentication routes (/api/auth/*)
- Chat routes (/api/chat/*)
- Advocate routes (/api/advocates/*)
- Case request routes (/api/requests/*)
- Lawyer dashboard routes (/api/lawyer/*)

// 5. Socket.io Event Handlers
- Connection authentication
- Room joining (case rooms)
- Message sending/receiving
- Read receipts
- Disconnect handling
```

### Middleware Chain

```javascript
Request → CORS → JSON Parser → Auth Middleware → Route Handler → Response
```

**Authentication Middleware:**
```javascript
function authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.sendStatus(401);
  
  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) return res.sendStatus(403);
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    next();
  });
}
```

### Service Layer Pattern

Business logic is separated into service modules:

```
services/
├── geminiService.js        # AI chat & case analysis
├── trustScoreService.js   # Trust score calculation
├── viabilityService.js    # Case viability assessment
├── adviceCheckerService.js # Legal advice verification
├── intakeService.js       # Guided intake flow
├── chatFlowService.js     # Chat flow management
├── lawyerService.js       # Lawyer-specific operations
└── encryption.js          # AES-256-GCM encryption
```

## Frontend Architecture

### Component Hierarchy

```
App.jsx
├── AuthProvider (Context)
│   └── User authentication state
├── ThemeProvider (Context)
│   └── Dark/light theme state
└── Routes
    ├── LandingPage
    ├── LoginPage
    ├── SignupPage
    ├── DashboardPage (Client)
    │   ├── ChatWindow (AI chat)
    │   ├── SessionPanel
    │   ├── ChatHistoryPanel
    │   ├── AdvocateCard
    │   ├── DocumentChecklist
    │   └── LawyerChatsList
    ├── LawyerDashboard (Lawyer)
    │   ├── LawyerPanels
    │   ├── CapacityPanel
    │   └── RequestList
    ├── LawyerClientCasePage
    │   ├── Overview
    │   ├── Chat History (AI)
    │   ├── Real-Time Chat (CaseChat)
    │   ├── Documents
    │   └── Notes
    └── ClientLawyerChatPage
        └── CaseChat (Real-time)
```

### State Management

**Context Providers:**
1. **AuthContext**: User authentication, login/logout, token management
2. **ThemeContext**: Dark/light theme toggle

**Custom Hooks:**
- `useChat`: Manages AI chat state, messages, loading
- `useSession`: Manages consultation sessions
- `useAdvocates': Fetches and filters advocates

**Local State:**
- Component-level state for UI interactions
- Form state for inputs
- Modal state for overlays

### API Service Layer

All API calls centralized in `services/api.js`:

```javascript
// Request wrapper with authentication
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { 
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
  // ... error handling
}

// Example API functions
export async function sendMessage(message, sessionId, history, userId)
export async function getAdvocates(city, caseType, maxBudget)
export async function createCaseRequest(formData)
export async function getClientRequests()
```

## Data Flow

### 1. User Registration Flow

```
Client → POST /api/auth/signup
  ↓
Server: Hash password, encrypt sensitive fields
  ↓
MongoDB: Create user document
  ↓
Server: Generate JWT token
  ↓
Email Service: Send verification email
  ↓
Client: Store token, redirect to verification
```

### 2. AI Chat Flow

```
Client → POST /api/chat { message, sessionId }
  ↓
Server: Retrieve session from memory/DB
  ↓
geminiService: Detect case type and budget
  ↓
geminiService: Generate AI response
  ↓
viabilityService: Assess case viability (if applicable)
  ↓
Server: Encrypt and save to CaseFile
  ↓
Server: Return response + advocate matches
  ↓
Client: Display response, update UI
```

### 3. Lawyer-Client Real-Time Chat Flow

```
Client: Connect via Socket.io
  ↓
Socket: Emit 'authenticate' with JWT
  ↓
Server: Verify token, set socket.userId
  ↓
Client: Emit 'join_case' with requestId
  ↓
Server: Verify access, join room `case_{requestId}`
  ↓
Client: Emit 'send_message' { content }
  ↓
Server: Encrypt content, save to CaseMessage
  ↓
Server: Emit 'new_message' to room (decrypted)
  ↓
All clients in room: Receive and display message
```

### 4. Consultation Request Flow

```
Client: Submit consultation form
  ↓
Client: POST /api/requests (multipart/form-data)
  ↓
Server: Authenticate, validate data
  ↓
Server: Encrypt description, create CaseRequest
  ↓
Server: Upload files to /uploads
  ↓
MongoDB: Save request with 'Pending' status
  ↓
Server: Notify matching lawyers (via Socket.io)
  ↓
Lawyer: View in dashboard, accept/reject
  ↓
Server: Update status, notify client
```

## AI Integration

### Gemini Service Architecture

The AI service handles multiple AI-powered features:

```javascript
services/geminiService.js
├── chatReply()          // Main chat conversation
├── detectCaseAndBudget() // Extract case type from text
├── assessViability()     // Evaluate case strength
├── checkAdvice()         // Verify legal advice
├── getDocumentChecklist() // Generate document list
└── runIntake()           // Guided questionnaire
```

### Chat Reply Process

```javascript
async function chatReply(message, history, context, onToken) {
  // 1. Build system prompt
  const systemPrompt = buildSystemPrompt(context);
  
  // 2. Prepare conversation history
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map(h => ({ role: h.role, content: h.content })),
    { role: 'user', content: message }
  ];
  
  // 3. Call Gemini API with streaming
  const response = await model.generateContentStream(messages);
  
  // 4. Stream tokens to client
  let fullContent = '';
  for await (const chunk of response.stream) {
    const token = chunk.text();
    fullContent += token;
    onToken(token); // Real-time streaming
  }
  
  // 5. Update history
  const updatedHistory = [
    ...history,
    { role: 'user', content: message },
    { role: 'assistant', content: fullContent }
  ];
  
  return { content: fullContent, history: updatedHistory };
}
```

### Context Building

The AI receives context about:
- User's city and budget
- Detected case type
- Matching advocates (sorted by trust score)
- Intake phase (intro/evidence/solution)
- Conversation history

### Rate Limiting

To prevent API abuse:
- Maximum user messages per session
- Slowdown between messages (CHAT_SLOWDOWN_MS)
- Rate limit detection and graceful degradation

## Real-Time Communication

### Socket.io Architecture

**Server-Side (server.js):**

```javascript
// 1. Setup
const io = new Server(httpServer, {
  cors: { origin: allowedOrigins }
});

// 2. Connection handling
io.on('connection', (socket) => {
  socket.on('authenticate', async (token) => {
    // Verify JWT, set socket.userId
  });
  
  socket.on('join_case', async (caseRequestId) => {
    // Verify access, join room
    socket.join(`case_${caseRequestId}`);
  });
  
  socket.on('send_message', async (data) => {
    // Encrypt, save, broadcast to room
  });
  
  socket.on('mark_read', async (caseRequestId) => {
    // Update read status, notify sender
  });
});
```

**Client-Side (CaseChat.jsx):**

```javascript
// 1. Connect
const socket = io(SOCKET_URL);

// 2. Authenticate
socket.emit('authenticate', token);

// 3. Join case room
socket.emit('join_case', requestId);

// 4. Listen for messages
socket.on('new_message', (message) => {
  setMessages(prev => [...prev, message]);
});

// 5. Send message
socket.emit('send_message', {
  caseRequestId: requestId,
  content: newMessage
});
```

### Room-Based Messaging

Each case has a dedicated room: `case_{requestId}`

- Only authorized users can join
- Messages broadcast to all room members
- Read receipts tracked per user
- Disconnect handling for cleanup

## Security Implementation

### Encryption Layer

All sensitive data encrypted before database storage:

```javascript
// Encryption (utils/encryption.js)
function encrypt(text) {
  const key = getEncryptionKey(); // From env
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

// Decryption
function decrypt(encryptedData) {
  const key = getEncryptionKey();
  const [ivHex, tagHex, encrypted] = encryptedData.split(':');
  
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(tagHex, 'hex');
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

### Authentication Flow

```javascript
// 1. Registration
POST /api/auth/signup
  → Hash password (bcrypt)
  → Encrypt sensitive fields
  → Create user
  → Generate verification token
  → Send magic link email

// 2. Login
POST /api/auth/login
  → Find user by email
  → Compare password hash
  → Generate JWT (7-day expiry)
  → Return token + user data

// 3. Protected Routes
GET /api/chat/history
  → Extract Bearer token
  → Verify JWT signature
  → Extract user info
  → Check role (client/lawyer)
  → Proceed or return 403
```

### Role-Based Access Control

```javascript
function requireRole(role) {
  return (req, res, next) => {
    if (req.user?.role !== role) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

// Usage
app.get('/api/lawyer/dashboard', 
  authenticateToken, 
  requireRole('lawyer'), 
  getLawyerDashboard
);
```

## Database Schema

### User Model

```javascript
{
  _id: ObjectId,
  name: String (encrypted),
  email: String (unique, indexed),
  passwordHash: String (bcrypt),
  role: String ('client' | 'lawyer'),
  city: String (encrypted),
  gender: String (encrypted),
  emailVerified: Boolean,
  maxActiveClients: Number (lawyer only),
  createdAt: Date,
  updatedAt: Date
}
```

### Advocate Model

```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  city: String,
  consultationFeeInr: Number,
  practiceAreas: [String],
  courtPrimary: String,
  barRegistrationNo: String,
  ratingAvg: Number,
  totalReviews: Number,
  caseHistory: [{
    caseType: String,
    outcome: String,
    years: Number
  }],
  createdAt: Date
}
```

### CaseFile Model

```javascript
{
  _id: ObjectId,
  sessionId: String (unique),
  userId: ObjectId (ref: User),
  chatName: String,
  caseType: String (encrypted),
  city: String (encrypted),
  budgetInr: Number,
  caseSummary: String (encrypted),
  documentsRequired: [{
    document: String,
    whyNeeded: String,
    uploaded: Boolean
  }],
  documentsUploaded: [String],
  chatHistory: String (encrypted JSON),
  adviceChecks: [Object],
  createdAt: Date,
  updatedAt: Date
}
```

### CaseRequest Model

```javascript
{
  _id: ObjectId,
  client: ObjectId (ref: User),
  lawyer: ObjectId (ref: User),
  status: String ('Pending' | 'Accepted' | 'Rejected' | 'Closed'),
  caseType: String,
  city: String,
  budgetInr: Number,
  description: String (encrypted),
  aiSummary: String (encrypted),
  attachments: [{
    filename: String,
    storedName: String,
    path: String
  }],
  timeline: [{
    event: String,
    timestamp: Date,
    description: String
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### CaseMessage Model

```javascript
{
  _id: ObjectId,
  caseRequest: ObjectId (ref: CaseRequest),
  sender: ObjectId (ref: User),
  senderRole: String ('client' | 'lawyer'),
  content: String (encrypted),
  attachments: [{
    filename: String,
    storedName: String,
    path: String
  }],
  read: Boolean,
  readAt: Date,
  createdAt: Date
}
```

## API Reference

### Authentication Endpoints

#### POST /api/auth/signup
Register a new user.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword",
  "role": "client",
  "city": "Mumbai",
  "gender": "Male"
}
```

**Response:** 201 Created
```json
{
  "message": "User registered. Verification email sent."
}
```

#### POST /api/auth/login
Authenticate user and get JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword"
}
```

**Response:** 200 OK
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "john@example.com",
    "role": "client",
    "name": "John Doe",
    "city": "Mumbai"
  }
}
```

### Chat Endpoints

#### POST /api/chat
Send message to AI chatbot.

**Request Body:**
```json
{
  "message": "I have a property dispute",
  "sessionId": "1234567890",
  "userId": "507f1f77bcf86cd799439011",
  "history": []
}
```

**Response:** 200 OK
```json
{
  "reply": "I understand you have a property dispute...",
  "caseType": "Property Dispute",
  "city": "Mumbai",
  "budget": 5000,
  "viability": {
    "viabilityScore": 75,
    "verdict": "Case has merit",
    "estimatedCost": { "min": 50000, "max": 100000 },
    "timeline": "6-12 months"
  },
  "advocates": [...],
  "intakeComplete": true
}
```

#### GET /api/chat/history/:sessionId
Get chat history for a session.

**Response:** 200 OK
```json
{
  "sessionId": "1234567890",
  "messages": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ],
  "caseType": "Property Dispute",
  "city": "Mumbai",
  "budget": 5000
}
```

### Advocate Endpoints

#### GET /api/advocates
List advocates with filters.

**Query Parameters:**
- `city` (required): City name
- `caseType` (optional): Filter by practice area
- `maxBudget` (optional): Filter by consultation fee

**Response:** 200 OK
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Adv. Rajesh Kumar",
    "city": "Mumbai",
    "consultationFee": 2000,
    "practiceAreas": ["Property", "Civil"],
    "trustScore": 85,
    "rating": 4.5,
    "canReceiveRequests": true
  }
]
```

### Case Request Endpoints

#### POST /api/requests
Create consultation request.

**Request:** multipart/form-data
```
formData.append('lawyerId', '507f1f77bcf86cd799439011');
formData.append('sessionId', '1234567890');
formData.append('description', 'I need help with...');
formData.append('attachments', file1);
formData.append('attachments', file2);
```

**Response:** 201 Created
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "status": "Pending",
  "client": "507f1f77bcf86cd799439011",
  "lawyer": "507f1f77bcf86cd799439013"
}
```

#### PATCH /api/requests/:id/decision
Accept or reject request (lawyer only).

**Request Body:**
```json
{
  "decision": "accept",
  "reason": "Case looks viable"
}
```

**Response:** 200 OK

### Socket.io Events

#### Client → Server

**authenticate**
```javascript
socket.emit('authenticate', token);
```

**join_case**
```javascript
socket.emit('join_case', requestId);
```

**send_message**
```javascript
socket.emit('send_message', {
  caseRequestId: requestId,
  content: "Hello"
});
```

**mark_read**
```javascript
socket.emit('mark_read', requestId);
```

#### Server → Client

**authenticated**
```javascript
socket.on('authenticated', ({ userId, role }) => {
  // Connection successful
});
```

**new_message**
```javascript
socket.on('new_message', (message) => {
  // New message received
});
```

**unread_count**
```javascript
socket.on('unread_count', ({ count }) => {
  // Update unread badge
});
```

**messages_read**
```javascript
socket.on('messages_read', ({ caseRequestId }) => {
  // Mark messages as read
});
```

## Trust Score Algorithm

The trust score is calculated by `trustScoreService.js` based on multiple factors:

### Factors

1. **Experience (0-25 points)**
   - Years of practice
   - Bar registration duration
   - Case history diversity

2. **Rating (0-30 points)**
   - Average rating (1-5 stars)
   - Total review count
   - Rating consistency

3. **Specialization (0-20 points)**
   - Number of practice areas
   - Relevance to case type
   - Depth in specialization

4. **Availability (0-15 points)**
   - Current client load
   - Response time
   - Acceptance rate

5. **Success Rate (0-10 points)**
   - Case outcomes
   - Client satisfaction
   - Repeat clients

### Calculation

```javascript
function calculateTrustScore(advocate) {
  const experience = calculateExperience(advocate); // 0-25
  const rating = calculateRating(advocate); // 0-30
  const specialization = calculateSpecialization(advocate); // 0-20
  const availability = calculateAvailability(advocate); // 0-15
  const successRate = calculateSuccessRate(advocate); // 0-10
  
  const totalScore = experience + rating + specialization + availability + successRate;
  
  return {
    score: totalScore,
    breakdown: {
      experience,
      rating,
      specialization,
      availability,
      successRate
    },
    badge: getBadge(totalScore)
  };
}

function getBadge(score) {
  if (score >= 90) return 'Elite';
  if (score >= 75) return 'Trusted';
  if (score >= 60) return 'Established';
  if (score >= 40) return 'Verified';
  return 'Incomplete';
}
```

### Badge System

- **Elite** (90-100): Top-tier advocates with exceptional track record
- **Trusted** (75-89): Highly reliable with strong reputation
- **Established** (60-74): Experienced professionals
- **Verified** (40-59): Basic credentials verified
- **Incomplete** (0-39): Insufficient data

## Performance Optimization

### Database Indexing

```javascript
// User indexes
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1 });

// Advocate indexes
AdvocateSchema.index({ city: 1, ratingAvg: -1 });
AdvocateSchema.index({ practiceAreas: 1 });

// CaseFile indexes
CaseFileSchema.index({ sessionId: 1 }, { unique: true });
CaseFileSchema.index({ userId: 1, createdAt: -1 });

// CaseMessage indexes
CaseMessageSchema.index({ caseRequest: 1, createdAt: -1 });
CaseMessageSchema.index({ sender: 1 });
```

### Caching Strategy

- Session data stored in memory (Map)
- Decrypted data cached during request lifecycle
- Advocate list cached with TTL
- Static assets served via CDN in production

### API Rate Limiting

- Chat messages: Maximum per session
- API requests: Per-user limits
- Socket.io connections: Per-user limits

## Error Handling

### Global Error Handler

```javascript
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid ID format' });
  }
  
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  res.status(500).json({ error: 'Internal server error' });
});
```

### Client-Side Error Handling

```javascript
try {
  const response = await api.sendMessage(message, sessionId);
  // Handle success
} catch (error) {
  // Show user-friendly error
  addToast(error.message, 'error');
  
  // Log for debugging
  console.error('API Error:', error);
}
```

## Monitoring and Logging

### Server Logging

```javascript
console.log(`[${new Date().toISOString()}] User ${userId} connected`);
console.error(`[${new Date().toISOString()}] Error in chat: ${err.message}`);
```

### Client Logging

```javascript
// Development only
if (import.meta.env.DEV) {
  console.log('Chat message sent:', message);
}
```

### Health Monitoring

```javascript
app.get('/api/health', (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  };
  res.json(health);
});
```

## Testing Strategy

### Unit Tests (Planned)

- Service layer functions
- Encryption/decryption utilities
- Trust score calculation
- AI response parsing

### Integration Tests (Planned)

- API endpoint testing
- Database operations
- Socket.io events

### E2E Tests (Planned)

- User registration flow
- Chat interaction
- Consultation request flow
- Real-time messaging

## Future Enhancements

### Planned Features

1. **Video Consultations**: Integration with WebRTC
2. **Document Analysis**: AI-powered document review
3. **Payment Integration**: Secure payment processing
4. **Calendar Integration**: Scheduling system
5. **Mobile Apps**: React Native applications
6. **Advanced Analytics**: Case outcome prediction
7. **Multi-language Support**: Regional language support

### Technical Improvements

1. **Redis Caching**: For session and data caching
2. **Message Queue**: For email and notification processing
3. **Microservices**: Split into separate services
4. **GraphQL**: Alternative to REST API
5. **TypeScript**: For type safety
6. **Testing**: Comprehensive test suite

## Conclusion

LegalLink is a sophisticated legal consultation platform that combines AI-powered case assessment with real-time lawyer-client communication. The architecture prioritizes security, scalability, and user experience while maintaining compliance with legal and data protection requirements.

The system's modular design allows for easy extension and maintenance, with clear separation of concerns between the frontend, backend, and AI services.
