# Implementation Plan - TOTP Authenticator

## 🗓️ Development Phases

### Phase 1: Project Initialization & Setup (2-3 hours)

#### 1.1 Project Structure Setup
```bash
# Initialize monorepo structure
mkdir -p server/src/{routes,utils}
mkdir -p client/src/{components,hooks,lib,styles}
mkdir -p data

# Initialize package.json files
npm init -y (root)
cd server && npm init -y
cd ../client && npm create vite@latest . -- --template react
```

#### 1.2 Backend Dependencies
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "better-sqlite3": "^9.2.2",
    "@journeyapps/sqlcipher": "^5.3.1",
    "express-session": "^1.17.3",
    "express-rate-limit": "^7.1.5",
    "bcrypt": "^5.1.1",
    "otplib": "^12.0.1",
    "qrcode-reader": "^1.0.4",
    "jimp": "^0.22.10",
    "dotenv": "^16.3.1",
    "helmet": "^7.1.0",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

#### 1.3 Frontend Dependencies
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.1",
    "axios": "^1.6.5",
    "zustand": "^4.4.7",
    "qr-scanner": "^1.4.2",
    "@radix-ui/react-*": "shadcn/ui dependencies",
    "tailwindcss": "^3.4.1",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "lucide-react": "^0.303.0"
  }
}
```

#### 1.4 Database Schema Migration
```sql
-- server/src/migrations/001_initial.sql
CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  label TEXT NOT NULL,
  issuer TEXT,
  secret TEXT NOT NULL,
  algorithm TEXT DEFAULT 'SHA1',
  digits INTEGER DEFAULT 6,
  period INTEGER DEFAULT 30,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_accounts_label ON accounts(label);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_sessions_expires ON sessions(expires_at);
```

#### 1.5 Environment Configuration
```bash
# .env.example
NODE_ENV=development
PORT=3000
DB_PATH=./data/app.db
DB_ENCRYPTION_KEY=change-this-to-32-char-secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=$2b$10$HASH_HERE
VIEWER_USERNAME=viewer
VIEWER_PASSWORD_HASH=$2b$10$HASH_HERE
SESSION_SECRET=change-this-session-secret
SESSION_TIMEOUT=86400000
```

---

### Phase 2: Backend Development (3-4 hours)

#### 2.1 Core Backend Files

**server/src/config.js**
```javascript
// Load and validate environment variables
// Export configuration object
```

**server/src/db.js**
```javascript
// SQLite connection with SQLCipher
// Run migrations
// Export database instance
```

**server/src/utils/encryption.js**
```javascript
// encryptSecret(plaintext) -> ciphertext
// decryptSecret(ciphertext) -> plaintext
// Using crypto module with AES-256-GCM
```

**server/src/totp.js**
```javascript
// generateTOTP(secret, algorithm, digits, period)
// parseOtpAuthUrl(url) -> { secret, label, issuer, ... }
// getCurrentCode(account) -> { code, timeRemaining }
```

**server/src/utils/qrcode.js**
```javascript
// parseQRCodeImage(buffer) -> otpauth URL
// Using qrcode-reader + jimp
```

**server/src/utils/session.js**
```javascript
// createSession(username)
// validateSession(sessionId)
// destroySession(sessionId)
// cleanExpiredSessions()
```

**server/src/auth.js**
```javascript
// Middleware: requireAuth
// Middleware: requireAdmin
// hashPassword(password)
// comparePassword(password, hash)
```

#### 2.2 API Routes

**server/src/routes/auth.js**
```javascript
POST   /api/auth/login
  - Validate credentials against hardcoded users
  - Create session
  - Set httpOnly cookie
  - Return user info

POST   /api/auth/logout
  - Destroy session
  - Clear cookie

GET    /api/auth/me
  - Return current user from session
```

**server/src/routes/accounts.js**
```javascript
GET    /api/accounts
  - Fetch all accounts
  - Generate current TOTP codes
  - Return with time_remaining

POST   /api/accounts
  - [requireAdmin]
  - Accept: { label, secret } OR { qrCodeImage }
  - Parse QR if provided
  - Encrypt secret
  - Store in database

DELETE /api/accounts/:id
  - [requireAdmin]
  - Delete from database

GET    /api/accounts/:id/otp
  - Generate fresh TOTP code
  - Return { code, timeRemaining }
```

#### 2.3 Express Server Setup

**server/src/index.js**
```javascript
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// Initialize database
require('./db');

// Middleware
app.use(helmet());
app.use(cors({ credentials: true }));
app.use(express.json({ limit: '10mb' })); // For QR images
app.use(session({ ... }));

// Rate limiting on login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5
});
app.use('/api/auth/login', loginLimiter);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/accounts', require('./routes/accounts'));

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('../client/dist'));
}

app.listen(PORT);
```

---

### Phase 3: Frontend Development (4-5 hours)

#### 3.1 Setup Tailwind + shadcn/ui
```bash
cd client
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input card dialog progress toast
npx shadcn-ui@latest add tabs label alert dropdown-menu
```

#### 3.2 API Client

**client/src/lib/api.js**
```javascript
// axios instance with credentials
// API methods:
// - login(username, password)
// - logout()
// - getMe()
// - getAccounts()
// - addAccount(data)
// - deleteAccount(id)
// - getOTP(id)
```

#### 3.3 State Management

**client/src/hooks/useAuth.js**
```javascript
// Zustand store for authentication
// - user: { username, role }
// - login(username, password)
// - logout()
// - checkAuth() - on mount
```

**client/src/hooks/useAccounts.js**
```javascript
// Zustand store for accounts
// - accounts: []
// - fetchAccounts()
// - addAccount(data)
// - deleteAccount(id)
// - updateCode(accountId, code, timeRemaining)
```

#### 3.4 Components

**client/src/components/LoginForm.jsx**
```jsx
// Form with username + password inputs
// Submit button with loading state
// Error message display
// Redirect to dashboard on success
```

**client/src/components/Dashboard.jsx**
```jsx
// Header: username, logout button
// Add Account button (if admin)
// Grid of AccountCard components
// Empty state if no accounts
// Auto-refresh every second to update codes
```

**client/src/components/AccountCard.jsx**
```jsx
// Display:
// - Label + Issuer
// - Large TOTP code (123 456 format)
// - Progress bar (time remaining)
// - Copy button -> clipboard
// - Delete button (admin only)
//
// Auto-update when time_remaining changes
```

**client/src/components/AddAccountDialog.jsx**
```jsx
// Dialog with tabs:
// 1. QR Code Upload
//    - Drag-drop zone
//    - File input (accept: image/*)
//    - Preview image
//
// 2. Manual Entry
//    - Label input
//    - Secret input (base32)
//    - Issuer input (optional)
//
// Submit button
// Error handling
```

#### 3.5 Routing

**client/src/App.jsx**
```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

<Routes>
  <Route path="/login" element={<LoginForm />} />
  <Route path="/" element={
    <PrivateRoute>
      <Dashboard />
    </PrivateRoute>
  } />
</Routes>
```

#### 3.6 TOTP Code Auto-Refresh Logic
```javascript
// In Dashboard component:
useEffect(() => {
  const interval = setInterval(() => {
    // For each account:
    // 1. Calculate time remaining in current 30s window
    // 2. If < 1 second, fetch new code from API
    // 3. Update local state with new code + timeRemaining
  }, 1000);

  return () => clearInterval(interval);
}, [accounts]);
```

---

### Phase 4: Integration & Testing (2-3 hours)

#### 4.1 Docker Configuration

**Dockerfile**
```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy server
COPY server/package*.json ./server/
RUN cd server && npm ci --production

# Copy client build
COPY client/dist ./client/dist

# Copy server source
COPY server/src ./server/src

WORKDIR /app/server
EXPOSE 3000

CMD ["node", "src/index.js"]
```

**docker-compose.yml**
```yaml
version: '3.8'

services:
  authenticator:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
    env_file:
      - .env
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:3000/api/auth/me"]
      interval: 30s
      timeout: 10s
      retries: 3
```

#### 4.2 Build Scripts

**package.json (root)**
```json
{
  "scripts": {
    "dev:server": "cd server && npm run dev",
    "dev:client": "cd client && npm run dev",
    "build": "npm run build:client && npm run build:server",
    "build:client": "cd client && npm run build",
    "build:server": "cd server && npm ci --production",
    "hash-password": "node scripts/hash-password.js",
    "docker:build": "docker-compose build",
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down"
  }
}
```

#### 4.3 Password Hashing Utility

**scripts/hash-password.js**
```javascript
const bcrypt = require('bcrypt');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Enter password to hash: ', async (password) => {
  const hash = await bcrypt.hash(password, 10);
  console.log('\nBcrypt hash:');
  console.log(hash);
  rl.close();
});
```

#### 4.4 Testing Checklist

**Manual Testing**:
- [ ] Login as admin
- [ ] Login as viewer
- [ ] Invalid credentials show error
- [ ] Add account via QR code upload
- [ ] Add account via manual secret
- [ ] TOTP codes display correctly
- [ ] Codes refresh every 30 seconds
- [ ] Copy to clipboard works
- [ ] Admin can delete accounts
- [ ] Viewer cannot delete accounts
- [ ] Viewer cannot add accounts
- [ ] Logout works
- [ ] Session persists on refresh
- [ ] Responsive design on mobile
- [ ] Multiple tabs sync correctly

**Security Testing**:
- [ ] Sessions expire after timeout
- [ ] httpOnly cookies prevent XSS
- [ ] Rate limiting blocks brute force
- [ ] Encrypted secrets in database
- [ ] Viewer cannot access admin endpoints

#### 4.5 Documentation

**README.md**
```markdown
# TOTP Authenticator

## Quick Start
1. Copy `.env.example` to `.env`
2. Generate password hashes: `npm run hash-password`
3. Update `.env` with hashes
4. Run: `docker-compose up -d`
5. Access: http://localhost:3000

## Default Credentials
- Admin: admin / (set in .env)
- Viewer: viewer / (set in .env)

## Adding Accounts
1. Login as admin
2. Click "Add Account"
3. Upload QR code OR paste secret key
4. Codes auto-refresh every 30 seconds
```

---

## 🎯 Implementation Order

### Day 1: Backend Foundation
1. ✅ Project structure
2. ✅ Database setup + migrations
3. ✅ Authentication system
4. ✅ TOTP generation logic
5. ✅ API routes (auth + accounts)

### Day 2: Frontend + Integration
6. ✅ React setup with Tailwind + shadcn/ui
7. ✅ Login page
8. ✅ Dashboard with account cards
9. ✅ Add account dialog (QR + manual)
10. ✅ Auto-refresh logic
11. ✅ Docker configuration
12. ✅ Testing + deployment

---

## 🚀 Quick Start Commands

```bash
# Development
npm run dev:server    # Backend on :3000
npm run dev:client    # Frontend on :5173

# Production Build
npm run build         # Build both client + server
npm run hash-password # Generate bcrypt hashes

# Docker Deployment
npm run docker:build  # Build image
npm run docker:up     # Start container
npm run docker:down   # Stop container

# Access
http://localhost:3000 # Production (Docker)
http://localhost:5173 # Development (Vite)
```

---

## 📋 Pre-Launch Checklist

- [ ] Environment variables configured
- [ ] Password hashes generated
- [ ] Database encryption key set (32 chars)
- [ ] Session secret set (random string)
- [ ] Docker container builds successfully
- [ ] Volume mount for persistent data
- [ ] HTTPS reverse proxy configured (optional)
- [ ] Firewall rules applied (optional)
- [ ] Backup strategy defined
- [ ] Admin credentials shared securely

---

## 🔧 Troubleshooting

**Issue: "Database is encrypted"**
- Solution: Ensure `DB_ENCRYPTION_KEY` matches between runs

**Issue: "Session not persisting"**
- Solution: Check `SESSION_SECRET` is set, cookies enabled

**Issue: "QR code not parsing"**
- Solution: Ensure QR contains `otpauth://totp/...` URL

**Issue: "Codes don't match Google Authenticator"**
- Solution: Check system time is synced (NTP)

---

## 📈 Future Enhancements Priority

1. **Export/Import** - Backup and restore accounts
2. **Audit Logging** - Track code access history
3. **Search/Filter** - Find accounts quickly
4. **Categories/Tags** - Organize many accounts
5. **Browser Extension** - Quick access from toolbar
6. **Mobile App** - Native iOS/Android
