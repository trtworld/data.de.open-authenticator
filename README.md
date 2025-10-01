# 🔐 Authenticator TRT

An open-source, self-hosted web-based TOTP (Time-based One-Time Password) authenticator. A modern alternative to Google Authenticator that runs in your browser.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED)

## ✨ Features

- 🌐 **Web-based**: Access your TOTP codes from any browser
- 🔒 **Self-hosted**: Full control over your sensitive data
- 🎨 **Modern UI**: Beautiful, responsive design with dark mode support
- 📱 **Mobile-friendly**: Works seamlessly on desktop and mobile devices
- 🔄 **Real-time updates**: Codes refresh automatically every 30 seconds
- 📋 **One-click copy**: Copy codes to clipboard with a single click
- 🎭 **Role-based access**: Admin and viewer roles for different permission levels
- 🐳 **Docker support**: Easy deployment with Docker Compose

## 🚀 Quick Start

### Using Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/authenticator-trt.git
   cd authenticator-trt
   ```

2. **Create production environment file**
   ```bash
   cp .env.production.example .env.production

   # Generate secure keys
   openssl rand -base64 32  # Use this for ENCRYPTION_KEY
   openssl rand -base64 32  # Use this for JWT_SECRET

   # Edit .env.production and update the keys
   nano .env.production
   ```

3. **Build and run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**

   Open your browser and navigate to `http://localhost:3000`

5. **Login with default credentials**
   - Admin: `admin` / `admin`
   - Viewer: `viewer` / `viewer`

   ⚠️ **Security Note**: These are hardcoded credentials for on-premise deployment. Change them in `lib/auth/index.ts` if needed.

### Local Development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Run development server**
   ```bash
   npm run dev
   ```

3. **Open browser**
   ```
   http://localhost:3000
   ```

## 🎯 Usage

### Adding Accounts

**Admin users** can add new TOTP accounts using two methods:

#### 1. Manual Entry
- Click "Add Account" button
- Enter account label (e.g., "Gmail - Work")
- Enter the secret key (Base32 encoded)
- Click "Add Account"

#### 2. QR Code Upload (Coming Soon)
- Click "Add Account" button
- Switch to "QR Code" tab
- Upload a screenshot of your QR code
- The secret will be extracted automatically

### Managing Accounts

- **View Codes**: All users can view TOTP codes and copy them to clipboard
- **Delete Accounts**: Only admin users can delete accounts
- **Auto-refresh**: Codes automatically refresh every 30 seconds
- **Progress Indicator**: Visual countdown shows time remaining for current code

### User Roles

- **Admin**: Full access (view, add, delete accounts)
- **Viewer**: Read-only access (view codes only)

## 🏗️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (React 19)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Deployment**: Docker & Docker Compose

## 📦 Project Structure

```
authenticator-trt/
├── app/                      # Next.js app directory
│   ├── dashboard/           # Dashboard page
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Login page
│   └── globals.css          # Global styles
├── components/              # React components
│   ├── ui/                  # shadcn/ui components
│   ├── account-card.tsx     # TOTP account card
│   └── add-account-dialog.tsx
├── lib/                     # Utilities
│   ├── utils.ts             # Helper functions
│   └── mock-data.ts         # Mock data for demo
├── types/                   # TypeScript types
│   └── index.ts
├── Dockerfile               # Docker configuration
├── docker-compose.yml       # Docker Compose config
└── package.json             # Dependencies
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file for local development:

```bash
# Will be used in future backend integration
NODE_ENV=development
```

## 🐳 Docker Deployment

### Build image
```bash
docker-compose build
```

### Start container
```bash
docker-compose up -d
```

### View logs
```bash
docker-compose logs -f
```

### Stop container
```bash
docker-compose down
```

## 🗺️ Roadmap

- [x] Mock UI with demo accounts
- [x] Backend API with real TOTP generation
- [x] Database integration (SQLite)
- [x] User authentication (JWT-based)
- [x] Secret encryption at rest (AES-256-GCM)
- [x] Docker production deployment
- [ ] QR code image parsing (client-side ready, needs server-side canvas)
- [ ] Export/import functionality
- [ ] Account search and filtering
- [ ] Account categories/tags
- [ ] Browser extension
- [ ] 2FA for the authenticator itself
- [ ] Audit logging

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Security Notice

**Current Status**: **Production-ready** with the following security features:

✅ **Implemented**:
- TOTP secrets encrypted with AES-256-GCM
- JWT-based session management
- bcrypt password hashing
- SQLite database with WAL mode
- Environment-based secrets
- Role-based access control (Admin/Viewer)

⚠️ **Important for Production**:
- **Change encryption keys**: Update `ENCRYPTION_KEY` and `JWT_SECRET` in `.env.production`
- **Use HTTPS**: Deploy behind reverse proxy (nginx/Caddy) with SSL
- **Change default passwords**: Update hardcoded credentials in `lib/auth/index.ts`
- **Firewall rules**: Restrict access to authorized IP ranges
- **Regular backups**: Backup `data/app.db` regularly
- **Update dependencies**: Run `npm audit` and update packages regularly

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [shadcn/ui](https://ui.shadcn.com/) - UI component library
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Lucide](https://lucide.dev/) - Beautiful icon set

## 📧 Contact

Project Link: [https://github.com/yourusername/authenticator-trt](https://github.com/yourusername/authenticator-trt)

---

**Note**: This is currently a mock UI implementation. Backend integration with real TOTP generation, database, and authentication will be implemented in the next phase.
