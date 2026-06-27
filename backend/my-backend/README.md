# LegalLink Backend

This is the backend repository for the LegalLink application.

## Running the Frontend

### Step 1: Install frontend dependencies
  cd frontend/legalblindspot
  npm install

### Step 2: Create frontend .env
  Create /frontend/legalblindspot/.env with:
  VITE_API_URL=http://localhost:5000

### Step 3: Start the backend API server
  cd backend/my-backend
  node index.js
  (Keep this running in a separate terminal)

### Step 4: Start the frontend
  cd frontend/legalblindspot
  npm run dev
  
  Open http://localhost:3000

### Running both together
  Terminal 1: cd backend/my-backend && node index.js
  Terminal 2: cd frontend/legalblindspot && npm run dev

### Full flow to run everything from scratch
  1. cd backend/my-backend && npm install
  2. node seed.js
  3. node index.js          ← keep running
  4. cd ../../frontend/legalblindspot && npm install
  5. npm run dev            ← keep running
  6. Open http://localhost:3000
