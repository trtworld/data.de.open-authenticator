# 🚀 Deployment Guide

Complete guide for deploying Authenticator TRT in production.

## 📋 Prerequisites

- Docker & Docker Compose installed
- 1GB+ RAM
- 1GB+ disk space
- (Optional) Domain name for HTTPS
- (Optional) Reverse proxy (nginx/Caddy)

## 🔧 Production Setup

### Step 1: Clone and Configure

```bash
# Clone repository
git clone https://github.com/yourusername/authenticator-trt.git
cd authenticator-trt

# Create production environment file
cp .env.production.example .env.production
```

### Step 2: Generate Secure Keys

```bash
# Generate encryption key (32 characters minimum)
openssl rand -base64 32

# Generate JWT secret
openssl rand -base64 32
```

Update `.env.production`:
```env
ENCRYPTION_KEY=<paste-first-key-here>
JWT_SECRET=<paste-second-key-here>
DB_PATH=/app/data/app.db
NODE_ENV=production
```

### Step 3: (Optional) Change Default Credentials

Edit `lib/auth/index.ts` and update password hashes:

```bash
# Generate new password hash
node -e "console.log(require('bcrypt').hashSync('your-new-password', 10))"
```

Replace the `passwordHash` values in `USERS` object.

### Step 4: Build and Deploy

```bash
# Build Docker image
docker-compose build

# Start container
docker-compose up -d

# Check logs
docker-compose logs -f
```

### Step 5: Verify Deployment

```bash
# Check container status
docker ps | grep authenticator-trt

# Test health endpoint
curl http://localhost:3000/api/auth/me
```

Access: `http://localhost:3000`

## 🔒 HTTPS Setup with nginx

### Create nginx Configuration

```nginx
# /etc/nginx/sites-available/authenticator-trt
server {
    listen 80;
    server_name auth.yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name auth.yourdomain.com;

    # SSL Certificate (Let's Encrypt recommended)
    ssl_certificate /etc/letsencrypt/live/auth.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/auth.yourdomain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Proxy settings
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

### Enable Configuration

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/authenticator-trt /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### Obtain SSL Certificate

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d auth.yourdomain.com
```

## 🔥 Firewall Configuration

```bash
# Allow only specific IPs (replace with your IPs)
sudo ufw allow from 192.168.1.0/24 to any port 3000

# If using nginx
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
```

## 📦 Backup Strategy

### Automated Backup Script

Create `/usr/local/bin/backup-authenticator.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/backup/authenticator"
DATE=$(date +%Y%m%d_%H%M%S)
DB_PATH="/path/to/authenticator-trt/data/app.db"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
cp $DB_PATH "$BACKUP_DIR/app_$DATE.db"

# Keep only last 30 backups
ls -t $BACKUP_DIR/app_*.db | tail -n +31 | xargs rm -f

echo "Backup completed: app_$DATE.db"
```

### Setup Cron Job

```bash
# Make script executable
chmod +x /usr/local/bin/backup-authenticator.sh

# Add to crontab (daily at 2 AM)
crontab -e

# Add this line:
0 2 * * * /usr/local/bin/backup-authenticator.sh
```

## 📊 Monitoring

### Check Container Health

```bash
# Container status
docker-compose ps

# Resource usage
docker stats authenticator-trt

# Logs
docker-compose logs --tail=100 -f
```

### Health Check Endpoint

```bash
# Should return 200 OK
curl -I http://localhost:3000/api/auth/me
```

## 🔄 Updates

### Update Application

```bash
# Pull latest changes
cd /path/to/authenticator-trt
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose build
docker-compose up -d

# Check logs
docker-compose logs -f
```

### Update Dependencies

```bash
# Update npm packages
npm update
npm audit fix

# Rebuild Docker image
docker-compose build --no-cache
docker-compose up -d
```

## 🐛 Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs

# Check environment variables
docker-compose config

# Rebuild from scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Database Locked Error

```bash
# Stop container
docker-compose down

# Check for processes using database
lsof data/app.db

# Restart
docker-compose up -d
```

### Permission Issues

```bash
# Fix data directory permissions
sudo chown -R 1001:1001 data/

# Restart container
docker-compose restart
```

## 📈 Performance Tuning

### SQLite Optimization

Add to `.env.production`:
```env
SQLITE_CACHE_SIZE=10000
SQLITE_PAGE_SIZE=4096
```

### Docker Resource Limits

Update `docker-compose.yml`:
```yaml
services:
  authenticator:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          memory: 256M
```

## 🔐 Security Checklist

- [ ] Changed `ENCRYPTION_KEY` and `JWT_SECRET`
- [ ] Updated default admin/viewer passwords
- [ ] Enabled HTTPS with valid SSL certificate
- [ ] Configured firewall rules
- [ ] Setup automated backups
- [ ] Limited database file permissions (600)
- [ ] Configured reverse proxy security headers
- [ ] Enabled Docker container auto-restart
- [ ] Setup log rotation
- [ ] Documented recovery procedures
- [ ] Tested backup restoration
- [ ] Configured monitoring/alerts

## 📞 Support

For issues and questions:
- GitHub Issues: https://github.com/yourusername/authenticator-trt/issues
- Documentation: Check README.md

---

**Last Updated**: 2025-01-10
