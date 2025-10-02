# Otto-TP - Online Team-based TOTP Authenticator

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)

**🔐 Self-hosted TOTP authenticator designed for teams and personal use**

[Features](#-features) • [Quick Start](#-quick-start) • [Deployment](#-deployment) • [Configuration](#%EF%B8%8F-configuration)

</div>

---

## 🌟 Features

### 🔒 Security First
- **Self-hosted** - Your secrets stay on your infrastructure
- **Encrypted storage** - All TOTP secrets encrypted at rest (AES-256)
- **Role-based access** - Admin, Viewer, and User roles
- **Session management** - Secure JWT-based authentication (24h sessions)
- **Audit logging** - Track all account operations

### 👥 Team Collaboration
- **Team accounts** - Share TOTP codes with your team
- **Private accounts** - Keep personal authenticators private
- **Dynamic visibility** - Switch between team/private modes
- **User management** - Admins can create/manage team members

### 🎯 User Experience
- **Real-time TOTP generation** - Live countdown timers
- **Quick search** - Find accounts instantly
- **Issuer filtering** - Filter by service provider
- **QR code import** - Upload or paste QR codes
- **Manual entry** - Add accounts via secret key
- **One-click copy** - Copy codes with single click
- **Responsive design** - Works on desktop, tablet, and mobile

### 🚀 Easy Deployment
- **Docker Compose** - Deploy in 60 seconds
- **Single binary** - No complex dependencies
- **SQLite database** - No external database required
- **Automatic backups** - Download complete database backups
- **Environment variables** - Simple configuration

---

## 📋 Quick Start

### Prerequisites

- **Docker** and **Docker Compose** installed
- **Linux/macOS/Windows** with Docker support
- **Port 3000** available (or configure custom port)

### 1. Clone the Repository

```bash
git clone https://github.com/alameddinc/otto-tp.git
cd otto-tp
```

### 2. Configure Environment (Optional)

```bash
cp .env.example .env
```

Edit `.env` to customize:

```env
# Admin credentials (CHANGE IN PRODUCTION!)
ADMIN_PASSWORD=your-secure-admin-password
VIEWER_PASSWORD=your-secure-viewer-password

# Security keys (GENERATE RANDOM 32+ character strings!)
JWT_SECRET=your-jwt-secret-key-change-in-production
ENCRYPTION_KEY=your-encryption-key-32-chars-minimum
```

### 3. Start the Application

```bash
docker-compose up -d
```

### 4. Access the Dashboard

Open your browser and navigate to:

```
http://localhost:3000
```

**Default credentials:**
- Username: `admin`
- Password: `actrt123admin` (or your configured `ADMIN_PASSWORD`)

---

## 🏗️ Deployment Options

### Option 1: Local/Home Server (On-Premise)

Perfect for home labs, family use, or small teams.

```bash
# Clone and start
git clone https://github.com/alameddinc/otto-tp.git
cd otto-tp
docker-compose up -d

# Access via local network
# Example: http://192.168.1.100:3000
```

**Recommended:**
- Set up reverse proxy (Nginx/Caddy) for HTTPS
- Configure firewall rules
- Set up automatic backups (cron job)

### Option 2: Cloud VPS (AWS EC2, DigitalOcean, Hetzner, etc.)

Deploy on any cloud provider with Docker support.

#### AWS EC2 Example

```bash
# 1. Launch EC2 instance (Ubuntu 22.04 LTS, t2.micro or larger)
# 2. Connect via SSH
ssh -i your-key.pem ubuntu@your-ec2-ip

# 3. Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 4. Install Docker Compose
sudo apt update
sudo apt install docker-compose -y

# 5. Clone and deploy
git clone https://github.com/alameddinc/otto-tp.git
cd otto-tp

# 6. Configure environment
cp .env.example .env
nano .env  # Edit passwords and secrets

# 7. Start application
docker-compose up -d

# 8. Configure security group
# Open port 3000 (or your custom port) in AWS Security Group
# Recommended: Use ALB/NLB with SSL certificate
```

#### DigitalOcean Droplet Example

```bash
# 1. Create Droplet (Docker image, $6/month or larger)
# 2. SSH into droplet
ssh root@your-droplet-ip

# 3. Clone and deploy
git clone https://github.com/alameddinc/otto-tp.git
cd otto-tp

# 4. Configure
cp .env.example .env
nano .env

# 5. Start
docker-compose up -d

# 6. Access via droplet IP
# Example: http://your-droplet-ip:3000
```

### Option 3: Behind Reverse Proxy (Production)

For production deployments with HTTPS.

**Nginx Configuration:**

```nginx
server {
    listen 80;
    server_name totp.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name totp.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/totp.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/totp.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Caddy Configuration (Automatic HTTPS):**

```caddy
totp.yourdomain.com {
    reverse_proxy localhost:3000
}
```

### Option 4: Docker Compose with Custom Port

```yaml
# docker-compose.yml
services:
  authenticator:
    build:
      context: .
      dockerfile: Dockerfile.simple
    container_name: otto-tp
    ports:
      - "8080:3000"  # Custom port
    volumes:
      - ./data:/app/data
    environment:
      - ADMIN_PASSWORD=${ADMIN_PASSWORD}
      - VIEWER_PASSWORD=${VIEWER_PASSWORD}
      - JWT_SECRET=${JWT_SECRET}
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}
    restart: unless-stopped
```

---

## ⚙️ Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ADMIN_PASSWORD` | Yes | `actrt123admin` | Admin user password |
| `VIEWER_PASSWORD` | Yes | `actrt123viewer` | Viewer user password |
| `JWT_SECRET` | Yes | Random | JWT signing secret (32+ chars) |
| `ENCRYPTION_KEY` | Yes | Random | TOTP secret encryption key (32 chars) |
| `PORT` | No | `3000` | Application port |
| `NODE_ENV` | No | `production` | Node environment |

### Security Best Practices

1. **Change default passwords immediately**
   ```bash
   # Generate strong passwords
   openssl rand -base64 24
   ```

2. **Use strong encryption keys**
   ```bash
   # Generate 32-character encryption key
   openssl rand -hex 32
   ```

3. **Enable HTTPS in production**
   - Use reverse proxy (Nginx, Caddy, Traefik)
   - Obtain SSL certificate (Let's Encrypt)

4. **Restrict network access**
   - Use firewall rules
   - VPN for remote access
   - IP whitelisting

5. **Regular backups**
   - Download database backups via Admin menu
   - Automate backups with cron jobs
   ```bash
   # Example backup script
   0 2 * * * docker exec otto-tp sqlite3 /app/data/app.db ".backup /app/data/backup-$(date +\%Y\%m\%d).db"
   ```

---

## 📦 Database Backups

### Manual Backup (via UI)

1. Login as admin
2. Click **Settings** (⚙️) → **Download Backup**
3. Save `.db` file securely

### Automated Backup (Script)

```bash
#!/bin/bash
# backup-otto-tp.sh

BACKUP_DIR="/backups/otto-tp"
DATE=$(date +%Y%m%d-%H%M%S)
CONTAINER="otto-tp"

mkdir -p $BACKUP_DIR

docker exec $CONTAINER sqlite3 /app/data/app.db ".backup /app/data/backup-$DATE.db"
docker cp $CONTAINER:/app/data/backup-$DATE.db $BACKUP_DIR/
docker exec $CONTAINER rm /app/data/backup-$DATE.db

# Keep only last 30 days
find $BACKUP_DIR -name "backup-*.db" -mtime +30 -delete

echo "Backup completed: $BACKUP_DIR/backup-$DATE.db"
```

Add to cron:
```bash
crontab -e
# Daily at 2 AM
0 2 * * * /path/to/backup-otto-tp.sh
```

---

## 🔌 API Access

Otto-TP provides REST APIs for programmatic access to TOTP codes and account management. Only **admin** users can create and use API keys.

### Create API Key

1. Login as admin user
2. Navigate to **API Keys** page (from dashboard)
3. Create a new API key with a descriptive name
4. **Copy the key immediately** - it won't be shown again!

### Authentication

All API requests require Bearer token authentication:

```bash
curl -H "Authorization: Bearer otto_your_api_key_here" \
  https://your-domain.com/api/v1/totp/generate?account_id=123
```

### Available Endpoints

#### 1. Generate TOTP Code

**GET** `/api/v1/totp/generate`

Generate a TOTP code for a specific account.

**Query Parameters:**
- `account_id` (number): Account ID
- `account_code` (string): Account code in format `issuer:label` (e.g., `google:user@example.com`)

**Example Request:**
```bash
# By account ID
curl -H "Authorization: Bearer otto_abc123..." \
  http://localhost:3000/api/v1/totp/generate?account_id=1

# By account code
curl -H "Authorization: Bearer otto_abc123..." \
  "http://localhost:3000/api/v1/totp/generate?account_code=google:user@example.com"
```

**Example Response:**
```json
{
  "code": "123456",
  "timeRemaining": 25,
  "account": {
    "id": 1,
    "label": "user@example.com",
    "issuer": "Google"
  }
}
```

#### 2. Export Accounts

**GET** `/api/v1/accounts/export`

Export accounts in various formats.

**Query Parameters:**
- `format` (string): `json` | `csv` | `otpauth` (default: `json`)
- `filter` (string): `team` | `private` | `all` (default: `all`)
- `include_secrets` (boolean): `true` | `false` (default: `false`) - Only for JSON/CSV

**Example Requests:**
```bash
# Export as JSON (without secrets)
curl -H "Authorization: Bearer otto_abc123..." \
  http://localhost:3000/api/v1/accounts/export?format=json

# Export as CSV with secrets
curl -H "Authorization: Bearer otto_abc123..." \
  "http://localhost:3000/api/v1/accounts/export?format=csv&include_secrets=true" \
  -o accounts.csv

# Export as OTPAuth URLs
curl -H "Authorization: Bearer otto_abc123..." \
  http://localhost:3000/api/v1/accounts/export?format=otpauth
```

**JSON Response Example:**
```json
{
  "accounts": [
    {
      "id": 1,
      "label": "user@example.com",
      "issuer": "Google",
      "algorithm": "SHA1",
      "digits": 6,
      "period": 30,
      "visibility": "team",
      "created_by": "admin"
    }
  ],
  "exported_at": "2025-10-02T12:00:00.000Z",
  "total": 1,
  "format": "json",
  "filter": "all"
}
```

**OTPAuth Response Example:**
```json
{
  "urls": [
    "otpauth://totp/Google:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Google&algorithm=SHA1&digits=6&period=30"
  ],
  "exported_at": "2025-10-02T12:00:00.000Z",
  "total": 1,
  "format": "otpauth",
  "filter": "all"
}
```

### Use Cases

#### 1. ETL Process with 2FA

Integrate TOTP codes into your ETL pipeline for services requiring 2FA:

```python
import requests
import time

API_KEY = "otto_your_api_key_here"
BASE_URL = "http://localhost:3000"

def get_totp_code(account_code):
    headers = {"Authorization": f"Bearer {API_KEY}"}
    response = requests.get(
        f"{BASE_URL}/api/v1/totp/generate",
        params={"account_code": account_code},
        headers=headers
    )
    return response.json()["code"]

# Use in ETL process
totp_code = get_totp_code("salesforce:etl-service@company.com")
salesforce_client.login(username, password, totp_code)
# Continue with data extraction...
```

#### 2. CI/CD Pipeline Integration

```yaml
# .github/workflows/deploy.yml
- name: Get TOTP for deployment
  run: |
    TOTP=$(curl -H "Authorization: Bearer ${{ secrets.OTTO_API_KEY }}" \
      "${{ secrets.OTTO_URL }}/api/v1/totp/generate?account_code=aws:deploy-user")
    echo "TOTP_CODE=$(echo $TOTP | jq -r '.code')" >> $GITHUB_ENV

- name: Deploy with 2FA
  run: |
    aws-deploy --totp ${{ env.TOTP_CODE }}
```

#### 3. Automated Backup & Migration

```bash
#!/bin/bash
# Export all accounts and backup
curl -H "Authorization: Bearer $API_KEY" \
  "http://localhost:3000/api/v1/accounts/export?format=json&include_secrets=true" \
  -o accounts-backup-$(date +%Y%m%d).json
```

### API Security

- **Admin Only**: Only users with `admin` role can create and use API keys
- **Key Expiration**: Set expiration dates for API keys (max 365 days)
- **Revocation**: Delete API keys instantly from UI
- **Visibility Control**: API respects account visibility (team/private)
- **Rate Limiting**: Consider implementing rate limits in production
- **HTTPS Only**: Always use HTTPS in production environments

---

## 🔄 Updates

### Update to Latest Version

```bash
cd otto-tp
git pull origin main
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Check Current Version

```bash
docker logs otto-tp | grep "Next.js"
```

---

## 👥 User Management

### Default Users

| Username | Role | Default Password |
|----------|------|------------------|
| `admin` | Admin | `actrt123admin` |
| `viewer` | Viewer | `actrt123viewer` |

### Roles Explained

- **Admin**: Full access - manage accounts, users, visibility, backups
- **Viewer**: Read-only access - view team accounts, own private accounts
- **User**: Standard access - view team accounts, own private accounts

### Create New Users

1. Login as `admin`
2. Click **Settings** (⚙️) → **Manage Users**
3. Click **Add User**
4. Enter username, password, and role
5. Click **Create User**

---

## 🆘 Troubleshooting

### Application won't start

```bash
# Check logs
docker-compose logs -f

# Restart container
docker-compose restart

# Rebuild from scratch
docker-compose down
docker-compose up -d --build
```

### Login fails with "Invalid credentials"

```bash
# Reset to default password
docker-compose down
rm -rf ./data
docker-compose up -d
```

### Port already in use

```bash
# Check what's using port 3000
lsof -i :3000

# Or change port in docker-compose.yml
ports:
  - "8080:3000"
```

### Database corruption

```bash
# Restore from backup
docker-compose down
cp /path/to/backup.db ./data/app.db
docker-compose up -d
```

---

## 🏢 Use Cases

### Corporate/Enterprise
- IT teams managing service accounts
- DevOps teams sharing infrastructure credentials
- Security teams with shared authenticators
- Support teams accessing customer accounts (with audit trail)

### Small Teams
- Startup founders sharing business accounts
- Freelancer teams with client access
- Remote teams with shared services
- Agency teams managing multiple clients

### Personal/Family
- Family members sharing streaming services
- Couples sharing financial accounts
- Personal backup of authenticators
- Multiple device access to same codes

---

## 🛠️ Development

### Local Development Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

### Project Structure

```
otto-tp/
├── app/                    # Next.js 15 app directory
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard page
│   └── page.tsx          # Login page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── *.tsx             # Custom components
├── lib/                   # Utilities and libraries
│   ├── db/               # Database schema and queries
│   ├── auth/             # Authentication logic
│   └── totp/             # TOTP generation
├── data/                  # SQLite database (created on first run)
├── docker-compose.yml     # Docker Compose config
├── Dockerfile.simple      # Production Dockerfile
└── README.md             # This file
```

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 🙏 Acknowledgments

Developed with ❤️ as open source by [Alameddin Çelik](https://github.com/alameddinc)

---

## 🇵🇸 Support

Free Palestine 🇵🇸

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/alameddinc/otto-tp/issues)
- **Discussions**: [GitHub Discussions](https://github.com/alameddinc/otto-tp/discussions)

---

<div align="center">

**⭐ If you find this project useful, please consider giving it a star! ⭐**

</div>
