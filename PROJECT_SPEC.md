# Web-Based TOTP Authenticator - Technical Specification

## 📋 Project Overview

**Type**: On-premise web-based TOTP (Time-based One-Time Password) authenticator
**Purpose**: Google Authenticator alternative accessible via web browser
**Scale**: Max 10 concurrent users
**Priority**: Fast development + Beautiful UI + Simple deployment

## 🎯 Core Requirements

### Functional Requirements
1. **Authentication**
   - 2 hardcoded user accounts: `admin` and `viewer`
   - Session-based authentication
   - No user registration/management needed

2. **TOTP Management**
   - Add accounts via QR code image upload
   - Add accounts via manual secret key input
   - Display multiple accounts with auto-refreshing 6-digit codes
   - Each code refreshes every 30 seconds (standard TOTP)
   - Label/name each account (e.g., "Gmail - Work", "AWS - Production")

3. **User Permissions**
   - **Admin**: Full access (view, add, delete accounts)
   - **Viewer**: Read-only access (view codes only)

4. **User Experience**
   - One-click copy to clipboard
   - Responsive design (desktop + mobile)
   - Real-time code countdown indicator
   - Clean, modern interface

### Non-Functional Requirements
- **Performance**: Handle 10 concurrent users smoothly
- **Security**: Moderate security (on-premise deployment)
- **Deployment**: Single Docker container
- **Maintainability**: Simple, lean architecture

## 🏗️ Technical Architecture

### Technology Stack

**Frontend**:
- React 18+ (with Hooks)
- Tailwind CSS (styling)
- shadcn/ui (component library)
- Vite (build tool)

**Backend**:
- Node.js 20+ LTS
- Express.js (web framework)
- better-sqlite3 (database driver)

**Database**:
- SQLite with @journeyapps/sqlcipher (encryption)

**Deployment**:
- Docker + Docker Compose
- Single container architecture

### System Architecture

```
┌─────────────────────────────────────────┐
│         Docker Container                │
│                                         │
│  ┌──────────────┐    ┌──────────────┐ │
│  │   React SPA  │◄──►│   Express    │ │
│  │  (Frontend)  │    │   (Backend)  │ │
│  └──────────────┘    └──────┬───────┘ │
│                              │         │
│                      ┌───────▼──────┐  │
│                      │   SQLite DB  │  │
│                      │  (Encrypted) │  │
│                      └──────────────┘  │
│                                         │
└─────────────────────────────────────────┘
            ▲
            │ HTTPS (recommended)
            │
       ┌────▼─────┐
       │  Users   │
       └──────────┘
```

## 🗄️ Database Schema

```sql
-- Accounts table (stores TOTP secrets)
CREATE TABLE accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  label TEXT NOT NULL,              -- User-defined name (e.g., "Gmail - Work")
  issuer TEXT,                      -- Service name (e.g., "Google")
  secret TEXT NOT NULL,             -- Base32 encoded secret (encrypted)
  algorithm TEXT DEFAULT 'SHA1',    -- TOTP algorithm
  digits INTEGER DEFAULT 6,         -- Code length
  period INTEGER DEFAULT 30,        -- Refresh interval in seconds
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Sessions table (user authentication)
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,              -- Session ID
  username TEXT NOT NULL,           -- 'admin' or 'viewer'
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
```

## 🔐 Security Design

### Authentication
- **Hardcoded credentials** stored in environment variables:
  - `ADMIN_USERNAME` / `ADMIN_PASSWORD`
  - `VIEWER_USERNAME` / `VIEWER_PASSWORD`
- Passwords hashed with bcrypt (pre-generated hashes)
- Session-based auth with httpOnly cookies
- Session timeout: 24 hours (configurable)

### Data Security
- TOTP secrets encrypted at rest using SQLCipher
- Encryption key stored in environment variable: `DB_ENCRYPTION_KEY`
- HTTPS recommended for production (user's responsibility)
- CSRF protection via tokens
- Rate limiting on login endpoint (5 attempts per 15 minutes)

### Authorization
- Middleware checks user role before sensitive operations:
  - `viewer`: GET requests only
  - `admin`: Full CRUD access

## 🎨 User Interface Design

### Pages/Views

**1. Login Page** (`/login`)
- Username input
- Password input
- "Remember me" checkbox (optional)
- Error messages for invalid credentials

**2. Dashboard** (`/`)
- Header with username + logout button
- "Add Account" button (admin only)
- Grid/list of TOTP accounts showing:
  - Account label/issuer
  - Current 6-digit code (large, prominent)
  - Countdown progress bar (30s cycle)
  - Copy button (click to copy code)
  - Delete button (admin only, with confirmation)
- Empty state when no accounts exist

**3. Add Account Modal**
- Two input methods (tabs):
  - **QR Code Upload**: Drag-drop or browse
  - **Manual Entry**: Text input for secret key + label
- Parse `otpauth://` URLs automatically
- Form validation and error handling

### UI Components (shadcn/ui)
- `Button`, `Input`, `Card`, `Dialog`, `Progress`, `Toast`
- `Tabs`, `Label`, `Alert`, `DropdownMenu`

### Design Principles
- **Modern & Clean**: Minimal clutter, focus on codes
- **Accessible**: WCAG 2.1 AA compliance
- **Responsive**: Mobile-first design (320px - 4K)
- **Fast**: Optimistic UI updates, smooth animations

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/login       - Login with username/password
POST   /api/auth/logout      - Logout and destroy session
GET    /api/auth/me          - Get current user info
```

### Accounts
```
GET    /api/accounts         - List all accounts
POST   /api/accounts         - Add new account (admin only)
DELETE /api/accounts/:id     - Delete account (admin only)
GET    /api/accounts/:id/otp - Get current TOTP code
```

### Request/Response Examples

**POST /api/accounts**
```json
{
  "label": "Gmail - Work",
  "secret": "JBSWY3DPEHPK3PXP",  // Base32 secret
  "issuer": "Google",             // Optional
  "algorithm": "SHA1",            // Optional (default: SHA1)
  "digits": 6,                    // Optional (default: 6)
  "period": 30                    // Optional (default: 30)
}
```

**GET /api/accounts**
```json
{
  "accounts": [
    {
      "id": 1,
      "label": "Gmail - Work",
      "issuer": "Google",
      "algorithm": "SHA1",
      "digits": 6,
      "period": 30,
      "current_code": "123456",
      "time_remaining": 12  // seconds until refresh
    }
  ]
}
```

## 📦 Project Structure

```
authenticator/
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── package.json
├── README.md
│
├── server/                 # Backend (Node.js + Express)
│   ├── src/
│   │   ├── index.js       # Entry point
│   │   ├── config.js      # Environment config
│   │   ├── db.js          # SQLite connection + migrations
│   │   ├── auth.js        # Authentication middleware
│   │   ├── totp.js        # TOTP generation logic
│   │   ├── routes/
│   │   │   ├── auth.js    # Auth routes
│   │   │   └── accounts.js # Account routes
│   │   └── utils/
│   │       ├── encryption.js  # Secret encryption/decryption
│   │       ├── qrcode.js      # QR code parsing
│   │       └── session.js     # Session management
│   └── tests/             # Unit tests (optional)
│
├── client/                # Frontend (React + Vite)
│   ├── public/
│   ├── src/
│   │   ├── main.jsx       # Entry point
│   │   ├── App.jsx        # Root component
│   │   ├── components/
│   │   │   ├── LoginForm.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── AccountCard.jsx
│   │   │   ├── AddAccountDialog.jsx
│   │   │   └── ui/        # shadcn/ui components
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   └── useAccounts.js
│   │   ├── lib/
│   │   │   └── api.js     # API client (fetch wrapper)
│   │   └── styles/
│   │       └── globals.css
│   ├── vite.config.js
│   └── tailwind.config.js
│
└── data/                  # Persistent volume mount
    └── app.db             # SQLite database (created at runtime)
```

## 🚀 Deployment

### Environment Variables
```bash
# .env file
NODE_ENV=production
PORT=3000

# Database
DB_PATH=/app/data/app.db
DB_ENCRYPTION_KEY=your-strong-32-char-encryption-key

# Authentication (bcrypt hashed passwords)
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=$2b$10$... (bcrypt hash)
VIEWER_USERNAME=viewer
VIEWER_PASSWORD_HASH=$2b$10$... (bcrypt hash)

# Session
SESSION_SECRET=your-strong-session-secret
SESSION_TIMEOUT=86400000  # 24 hours in ms
```

### Docker Compose
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
```

### Deployment Steps
1. Clone repository
2. Copy `.env.example` to `.env` and configure
3. Generate password hashes: `npm run hash-password`
4. Run: `docker-compose up -d`
5. Access: `http://localhost:3000`
6. **(Recommended)** Set up reverse proxy (nginx) with SSL

## 🛡️ Security Recommendations

### For On-Premise Deployment
1. **Network Isolation**: Deploy on internal network only
2. **HTTPS**: Use reverse proxy (nginx/Caddy) with Let's Encrypt or self-signed cert
3. **Firewall**: Restrict access to authorized IP ranges
4. **Backups**: Regular encrypted backups of SQLite database
5. **Monitoring**: Basic logging of authentication attempts
6. **Updates**: Regular dependency updates for security patches

### Optional Enhancements (Future)
- TOTP for the authenticator itself (meta-2FA)
- Audit logging (who viewed which codes when)
- Export/import functionality
- Browser extension for auto-fill

## 📝 Development Timeline

**Phase 1: Core Setup (2-3 hours)**
- Project initialization
- Database setup with encryption
- Basic Express server with auth

**Phase 2: Backend API (3-4 hours)**
- TOTP generation logic
- QR code parsing
- Account CRUD endpoints
- Session management

**Phase 3: Frontend UI (4-5 hours)**
- React app setup with Vite
- shadcn/ui integration
- Login page
- Dashboard with account cards
- Add account modal

**Phase 4: Integration & Testing (2-3 hours)**
- Frontend-backend integration
- Manual testing
- Docker configuration
- Documentation

**Total Estimate**: 11-15 hours for MVP

## 🎯 Success Criteria

✅ Two users can log in with different permissions
✅ Admin can add accounts via QR or manual secret
✅ TOTP codes display and refresh every 30 seconds
✅ Codes can be copied to clipboard
✅ Admin can delete accounts
✅ Viewer has read-only access
✅ Responsive UI works on mobile + desktop
✅ Single Docker container deployment
✅ Secrets encrypted at rest

## 🔄 Future Enhancements (Out of Scope)

- User management (registration, password reset)
- Multi-user account isolation (each user has their own accounts)
- Backup/restore functionality
- Browser extension
- Mobile app (React Native)
- Hardware token support (YubiKey)
- API rate limiting per user
- Audit logging
