# Otto-TP Deployment Guide

Complete guide for deploying Otto-TP to production environments.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start-localhome-server)
- [Production Deployment](#production-deployment)
- [Security Checklist](#security-checklist)
- [Monitoring](#monitoring--maintenance)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

**Minimum:**
- CPU: 1 core, RAM: 512 MB, Disk: 1 GB
- OS: Linux, macOS, or Windows with Docker

**Recommended:**
- CPU: 2 cores, RAM: 1 GB, Disk: 5 GB
- OS: Ubuntu 22.04 LTS

### Required Software

1. **Docker** (20.10+)
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

2. **Docker Compose** (2.0+)
```bash
sudo apt install docker-compose-plugin
```

3. **Git**
```bash
sudo apt install git
```

---

## Quick Start (Local/Home Server)

### Step 1: Clone Repository
```bash
git clone https://github.com/yourusername/otto-tp.git
cd otto-tp
```

### Step 2: Configure Environment
```bash
cp .env.example .env
nano .env
```

**⚠️ CRITICAL: Change these immediately!**
```env
ADMIN_PASSWORD=your-strong-password
VIEWER_PASSWORD=your-viewer-password
JWT_SECRET=$(openssl rand -hex 32)
ENCRYPTION_KEY=$(openssl rand -hex 32)
```

### Step 3: Start
```bash
docker-compose up -d
```

### Step 4: Verify
```bash
docker ps | grep otto-tp
docker logs otto-tp
curl http://localhost:3000
```

### Step 5: Login
- URL: http://localhost:3000
- Username: admin
- Password: (your ADMIN_PASSWORD)

---

## Production Deployment

### AWS EC2

```bash
# Launch Ubuntu 22.04 t2.micro or larger
ssh -i key.pem ubuntu@your-ec2-ip

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo apt install docker-compose-plugin

# Deploy
git clone https://github.com/yourusername/otto-tp.git
cd otto-tp
cp .env.example .env
nano .env  # Set production values
docker-compose up -d
```

**Security Group:**
- SSH (22): Your IP only
- HTTP (80): 0.0.0.0/0
- HTTPS (443): 0.0.0.0/0

### DigitalOcean

```bash
# Create $6/month Docker droplet
ssh root@droplet-ip
git clone https://github.com/yourusername/otto-tp.git
cd otto-tp
cp .env.example .env
nano .env
docker-compose up -d
```

---

## Reverse Proxy (HTTPS)

### Nginx with Let's Encrypt

```nginx
# /etc/nginx/sites-available/otto-tp
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
    ssl_protocols TLSv1.2 TLSv1.3;

    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/otto-tp /etc/nginx/sites-enabled/
sudo certbot --nginx -d totp.yourdomain.com
sudo nginx -t && sudo systemctl reload nginx
```

### Caddy (Automatic HTTPS)

```caddy
# /etc/caddy/Caddyfile
totp.yourdomain.com {
    reverse_proxy localhost:3000
    header {
        Strict-Transport-Security "max-age=31536000;"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "SAMEORIGIN"
    }
}
```

```bash
sudo systemctl restart caddy
```

---

## Security Checklist

### Pre-Deployment
- [ ] Change all default passwords
- [ ] Generate strong 32-char secrets
- [ ] Enable HTTPS
- [ ] Configure firewall (ufw allow 22/80/443)
- [ ] Disable password SSH, use keys only

### Post-Deployment
- [ ] Create backup admin user
- [ ] Disable default accounts
- [ ] Set up automated backups
- [ ] Monitor audit logs
- [ ] Test backup restoration

### Network Security
```bash
# Firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# Optional: Fail2Ban
sudo apt install fail2ban
```

---

## Monitoring & Maintenance

### Automated Backups

```bash
#!/bin/bash
# /usr/local/bin/backup-otto-tp.sh

BACKUP_DIR="/backups/otto-tp"
DATE=$(date +%Y%m%d-%H%M%S)

mkdir -p $BACKUP_DIR
docker exec otto-tp sqlite3 /app/data/app.db ".backup /app/data/backup-$DATE.db"
docker cp otto-tp:/app/data/backup-$DATE.db $BACKUP_DIR/
docker exec otto-tp rm /app/data/backup-$DATE.db
gzip $BACKUP_DIR/backup-$DATE.db

# Keep last 30 days
find $BACKUP_DIR -name "backup-*.db.gz" -mtime +30 -delete
```

```bash
chmod +x /usr/local/bin/backup-otto-tp.sh
# Crontab: Daily at 2 AM
0 2 * * * /usr/local/bin/backup-otto-tp.sh
```

### Health Monitoring

```bash
# Container health
docker inspect otto-tp --format='{{.State.Health.Status}}'

# Logs
docker logs otto-tp -f --tail 100

# Resource usage
docker stats otto-tp
```

### Updates

```bash
cd otto-tp
git pull origin main
docker-compose down
docker-compose build --no-cache
docker-compose up -d
docker logs otto-tp
```

---

## Troubleshooting

### App Won't Start
```bash
docker logs otto-tp
lsof -i :3000
docker-compose down && docker-compose up -d
```

### Login Fails
```bash
docker-compose down
rm -rf ./data/app.db
docker-compose up -d
```

### Database Corruption
```bash
docker-compose down
cp /backups/backup.db ./data/app.db
docker-compose up -d
```

### SSL Issues
```bash
sudo certbot renew --force-renewal
sudo certbot certificates
```

---

## Production Checklist

### Infrastructure
- [ ] Server requirements met
- [ ] Domain configured
- [ ] SSL certificate installed
- [ ] Firewall configured
- [ ] Reverse proxy configured

### Security
- [ ] All passwords changed
- [ ] Strong secrets generated
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] SSH key-only authentication

### Backup
- [ ] Automated backups configured
- [ ] Backup restoration tested
- [ ] Log rotation configured
- [ ] Health checks enabled

### Application
- [ ] Default accounts disabled
- [ ] Test accounts created
- [ ] TOTP functionality tested
- [ ] API tested (if used)
- [ ] Audit logs verified

---

## Support

- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
