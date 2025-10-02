# Otto-TP - TRT İçin Production Deployment Guide

TRT için güvenli, ölçeklenebilir ve kurumsal standartlara uygun deployment rehberi.

## 📋 İçindekiler

1. [Ön Hazırlık](#1-ön-hazırlık)
2. [Sunucu Kurulumu](#2-sunucu-kurulumu)
3. [Güvenlik Konfigürasyonu](#3-güvenlik-konfigürasyonu)
4. [SSL/HTTPS Kurulumu](#4-sslhttps-kurulumu)
5. [Uygulama Deployment](#5-uygulama-deployment)
6. [Yedekleme Stratejisi](#6-yedekleme-stratejisi)
7. [Kullanıcı Yönetimi](#7-kullanıcı-yönetimi)
8. [İzleme ve Bakım](#8-izleme-ve-bakım)

---

## 1. Ön Hazırlık

### 1.1 Gerekli Bilgiler

**Toplanması Gerekenler:**
```
✓ Domain adı: totp.trt.net.tr (örnek)
✓ Sunucu IP adresi
✓ IT yöneticisi iletişim bilgileri
✓ VPN erişim bilgileri (varsa)
✓ Mevcut güvenlik politikaları
✓ Backup sunucu bilgileri
```

### 1.2 Sunucu Gereksinimleri

**Minimum (Test/Staging):**
- CPU: 2 core
- RAM: 2 GB
- Disk: 20 GB SSD
- OS: Ubuntu 22.04 LTS

**Önerilen (Production):**
- CPU: 4 core
- RAM: 4 GB
- Disk: 50 GB SSD
- OS: Ubuntu 22.04 LTS
- Backup: Günlük snapshot

**Kullanıcı Kapasitesi:**
- 50 kullanıcı: Minimum specs yeterli
- 100-500 kullanıcı: Önerilen specs
- 500+ kullanıcı: Ölçeklendirme gerekebilir

---

## 2. Sunucu Kurulumu

### 2.1 Sunucuya Bağlanma

```bash
# SSH ile bağlan
ssh admin@sunucu-ip-adresi

# Sistem güncellemesi
sudo apt update && sudo apt upgrade -y
```

### 2.2 Gerekli Yazılımları Yükle

```bash
# Docker kurulumu
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Docker Compose kurulumu
sudo apt install docker-compose-plugin -y

# Temel araçlar
sudo apt install -y git curl wget nano htop ufw fail2ban
```

### 2.3 Firewall Konfigürasyonu

```bash
# Firewall kuralları
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Durum kontrolü
sudo ufw status verbose
```

---

## 3. Güvenlik Konfigürasyonu

### 3.1 SSH Güvenliği

```bash
# SSH config düzenle
sudo nano /etc/ssh/sshd_config

# Aşağıdaki değişiklikleri yap:
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
Port 2222  # Default port değiştir (opsiyonel)

# SSH servisi yeniden başlat
sudo systemctl restart sshd
```

### 3.2 Fail2Ban Kurulumu

```bash
# Fail2ban konfigürasyonu
sudo nano /etc/fail2ban/jail.local
```

Ekle:
```ini
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/error.log
maxretry = 5
bantime = 3600
```

```bash
# Servisi başlat
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 3.3 TRT Ağ Politikaları

**Eğer TRT içinde VPN kullanılıyorsa:**

```bash
# Sadece VPN IP'lerinden erişime izin ver
sudo ufw delete allow 80/tcp
sudo ufw delete allow 443/tcp
sudo ufw allow from VPN_NETWORK/24 to any port 80
sudo ufw allow from VPN_NETWORK/24 to any port 443
```

**Örnek:**
```bash
# TRT VPN ağı 10.0.0.0/24 ise
sudo ufw allow from 10.0.0.0/24 to any port 80
sudo ufw allow from 10.0.0.0/24 to any port 443
```

---

## 4. SSL/HTTPS Kurulumu

### 4.1 Nginx Kurulumu

```bash
sudo apt install nginx -y
sudo systemctl enable nginx
```

### 4.2 SSL Sertifikası (2 Seçenek)

#### Seçenek A: Let's Encrypt (Public Domain)

```bash
# Certbot kurulumu
sudo apt install certbot python3-certbot-nginx -y

# SSL sertifikası al
sudo certbot --nginx -d totp.trt.net.tr

# Otomatik yenileme testi
sudo certbot renew --dry-run
```

#### Seçenek B: TRT Kurumsal Sertifika

```bash
# Sertifika dosyalarını kopyala
# TRT IT departmanından aldığınız dosyalar:
# - certificate.crt
# - private.key
# - ca-bundle.crt (varsa)

sudo mkdir -p /etc/nginx/ssl/
sudo cp certificate.crt /etc/nginx/ssl/
sudo cp private.key /etc/nginx/ssl/
sudo chmod 600 /etc/nginx/ssl/private.key
```

### 4.3 Nginx Konfigürasyonu

```bash
sudo nano /etc/nginx/sites-available/otto-tp
```

**Konfigürasyon:**
```nginx
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name totp.trt.net.tr;
    return 301 https://$server_name$request_uri;
}

# HTTPS configuration
server {
    listen 443 ssl http2;
    server_name totp.trt.net.tr;

    # SSL Sertifikaları
    ssl_certificate /etc/nginx/ssl/certificate.crt;
    ssl_certificate_key /etc/nginx/ssl/private.key;

    # SSL Güvenlik Ayarları
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Güvenlik Header'ları
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' 'unsafe-inline' 'unsafe-eval'; img-src 'self' data: https:; font-src 'self' data:;" always;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    location /api/auth/login {
        limit_req zone=login burst=2 nodelay;
        proxy_pass http://localhost:3000;
        include /etc/nginx/proxy_params;
    }

    # Ana Proxy
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

        # Timeout ayarları
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Access/Error Logs
    access_log /var/log/nginx/otto-tp-access.log;
    error_log /var/log/nginx/otto-tp-error.log;
}
```

**Proxy params oluştur:**
```bash
sudo nano /etc/nginx/proxy_params
```

```nginx
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
```

**Nginx'i aktifleştir:**
```bash
sudo ln -s /etc/nginx/sites-available/otto-tp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 5. Uygulama Deployment

### 5.1 Projeyi İndir

```bash
# Ana dizine git
cd /opt

# Repository'yi clone et
sudo git clone https://github.com/yourusername/otto-tp.git
sudo chown -R $USER:$USER otto-tp
cd otto-tp
```

### 5.2 Environment Konfigürasyonu

```bash
# .env dosyası oluştur
cp .env.example .env
nano .env
```

**Production .env:**
```env
# Güçlü şifreler oluştur (her biri farklı olmalı)
ADMIN_PASSWORD=TRT2025_Super_Guclu_Admin_Sifresi_123!

VIEWER_PASSWORD=TRT2025_Viewer_Sifresi_456!

# Güvenlik anahtarları (32 karakter)
JWT_SECRET=$(openssl rand -hex 32)
ENCRYPTION_KEY=$(openssl rand -hex 32)

# Audit log retention (2 gün öneriliyor)
AUDIT_RETENTION_DAYS=2

# Organizasyon bilgileri
ORGANIZATION_NAME=TRT
```

**Güvenli şifre oluşturma:**
```bash
# Admin için
openssl rand -base64 24

# Viewer için
openssl rand -base64 24

# JWT Secret için
openssl rand -hex 32

# Encryption Key için
openssl rand -hex 32
```

### 5.3 Docker Compose Düzenle

```bash
nano docker-compose.yml
```

**Production ayarları:**
```yaml
services:
  authenticator:
    build:
      context: .
      dockerfile: Dockerfile.simple
    container_name: otto-tp
    ports:
      - "127.0.0.1:3000:3000"  # Sadece localhost
    volumes:
      - ./data:/app/data
      - ./backups:/app/backups
    environment:
      - NODE_ENV=production
      - PORT=3000
      - HOSTNAME=0.0.0.0
      - JWT_SECRET=${JWT_SECRET}
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}
      - ADMIN_PASSWORD=${ADMIN_PASSWORD}
      - VIEWER_PASSWORD=${VIEWER_PASSWORD}
      - ORGANIZATION_NAME=${ORGANIZATION_NAME}
      - AUDIT_RETENTION_DAYS=${AUDIT_RETENTION_DAYS}
    restart: always
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "5"
```

### 5.4 Uygulamayı Başlat

```bash
# Build ve başlat
docker-compose up -d --build

# Logları kontrol et
docker logs otto-tp -f

# Health check
docker ps
curl http://localhost:3000
```

### 5.5 İlk Giriş ve Test

```bash
# Browser'da aç
https://totp.trt.net.tr

# Default credentials ile giriş yap
Username: admin
Password: (ADMIN_PASSWORD değeri)

# ÖNEMLİ: İlk işler
1. Admin şifresini değiştir
2. Yeni admin kullanıcısı oluştur
3. Default admin hesabını devre dışı bırak
4. Test hesapları oluştur
5. TOTP ekleme/silme/görüntüleme test et
```

---

## 6. Yedekleme Stratejisi

### 6.1 Otomatik Yedekleme Script

```bash
sudo nano /usr/local/bin/backup-otto-tp.sh
```

```bash
#!/bin/bash

# TRT Otto-TP Backup Script
DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="/opt/otto-tp-backups"
RETENTION_DAYS=30

# Dizinleri oluştur
mkdir -p $BACKUP_DIR/{daily,weekly,monthly}

# Database backup
docker exec otto-tp sqlite3 /app/data/app.db ".backup /app/data/backup-$DATE.db"
docker cp otto-tp:/app/data/backup-$DATE.db $BACKUP_DIR/daily/
docker exec otto-tp rm /app/data/backup-$DATE.db

# Compress
gzip $BACKUP_DIR/daily/backup-$DATE.db

# Haftalık backup (Pazartesi)
if [ "$(date +%u)" -eq 1 ]; then
    cp $BACKUP_DIR/daily/backup-$DATE.db.gz $BACKUP_DIR/weekly/
fi

# Aylık backup (Ayın 1'i)
if [ "$(date +%d)" -eq 01 ]; then
    cp $BACKUP_DIR/daily/backup-$DATE.db.gz $BACKUP_DIR/monthly/
fi

# Eski günlük backupları temizle
find $BACKUP_DIR/daily -name "backup-*.db.gz" -mtime +$RETENTION_DAYS -delete

# Eski haftalık backupları temizle (90 gün)
find $BACKUP_DIR/weekly -name "backup-*.db.gz" -mtime +90 -delete

# Eski aylık backupları temizle (365 gün)
find $BACKUP_DIR/monthly -name "backup-*.db.gz" -mtime +365 -delete

# Log
echo "[$(date)] Backup completed: $BACKUP_DIR/daily/backup-$DATE.db.gz" >> /var/log/otto-tp-backup.log

# Backup sunucusuna kopyala (opsiyonel)
# rsync -avz $BACKUP_DIR/ backup-server:/path/to/backups/
```

```bash
sudo chmod +x /usr/local/bin/backup-otto-tp.sh
```

### 6.2 Cron Job Kurulumu

```bash
sudo crontab -e
```

Ekle:
```cron
# Otto-TP günlük backup (her gün 02:00)
0 2 * * * /usr/local/bin/backup-otto-tp.sh >> /var/log/otto-tp-backup.log 2>&1

# Log rotation (haftalık)
0 3 * * 1 tail -n 1000 /var/log/otto-tp-backup.log > /var/log/otto-tp-backup.log.tmp && mv /var/log/otto-tp-backup.log.tmp /var/log/otto-tp-backup.log
```

### 6.3 Backup Restore

```bash
# Backup listesi
ls -lh /opt/otto-tp-backups/daily/

# Restore işlemi
cd /opt/otto-tp
docker-compose down

# Backup dosyasını decompress et
gunzip /opt/otto-tp-backups/daily/backup-YYYYMMDD-HHMMSS.db.gz

# Database dosyasını restore et
cp /opt/otto-tp-backups/daily/backup-YYYYMMDD-HHMMSS.db ./data/app.db

# Uygulamayı başlat
docker-compose up -d
```

---

## 7. Kullanıcı Yönetimi

### 7.1 Rol Tanımları

**Admin (Yönetici):**
- Tüm hesapları görüntüleme
- Hesap ekleme/silme/düzenleme
- Kullanıcı yönetimi
- API key oluşturma
- Audit log görüntüleme
- **Kim olmalı:** IT yöneticileri, güvenlik ekibi

**User (Standart Kullanıcı):**
- Sadece kendi hesaplarını görüntüleme
- Kendi hesaplarını ekleme/silme
- **Kim olmalı:** Normal çalışanlar

**Viewer (Görüntüleyici):**
- Sadece team hesaplarını görüntüleme
- Hiçbir şey ekleyemez/silemez
- **Kim olmalı:** Destek ekibi, operasyon ekibi

### 7.2 Kullanıcı Ekleme

**Web UI üzerinden:**
1. Admin olarak giriş yap
2. Settings → Manage Users
3. Add User
4. Bilgileri gir:
   - Username: personel.adsoyad
   - Password: Güçlü şifre
   - Role: user/viewer/admin
5. Create User

**Toplu kullanıcı ekleme (opsiyonel):**
```bash
# CSV dosyası hazırla: users.csv
# username,password,role
# ahmet.yilmaz,StrongPass123!,user
# mehmet.kaya,AnotherPass456!,viewer

# Script ile ekle (oluşturulması gerekir)
```

### 7.3 Hesap Gruplandırma

**Team Hesapları (Ortak):**
- Departman hesapları: AWS, GitHub, GitLab, etc.
- Visibility: "team" olarak ayarla
- Tüm admin ve viewer kullanıcıları görebilir

**Private Hesapları (Kişisel):**
- Kişisel Google, Facebook, etc.
- Visibility: "private" olarak ayarla
- Sadece hesap sahibi görebilir

### 7.4 Örnek Senaryo

**TRT Yapım Departmanı:**
```
Adminler:
- it.admin (IT yöneticisi)
- guvenlik.admin (Güvenlik sorumlusu)

Users:
- yapim.ahmet (Yapımcı - kendi private hesapları)
- yapim.ayse (Yapımcı - kendi private hesapları)
- yapim.mehmet (Yapımcı - kendi private hesapları)

Viewers:
- destek.ekibi (Destek - team hesaplarını görebilir)

Team Hesapları (Tüm yapımcılar kullanır):
- AWS Production
- GitHub Organization
- GitLab Projects
- Adobe Creative Cloud
```

---

## 8. İzleme ve Bakım

### 8.1 Sistem İzleme

**Container durumu:**
```bash
# Container durumu
docker ps

# Resource kullanımı
docker stats otto-tp

# Loglar
docker logs otto-tp -f --tail 100

# Disk kullanımı
df -h
du -sh /opt/otto-tp/data/
```

### 8.2 Audit Log İzleme

**Web UI üzerinden:**
1. Admin login
2. Dashboard → Audit Logs
3. Filtreleme:
   - Username: Belirli kullanıcı
   - Action: login_failed, account_deleted, etc.
4. İncele: Şüpheli aktiviteler

**Şüpheli Aktiviteler:**
- Çoklu başarısız login denemeleri
- Gece saatlerinde login
- Beklenmedik account silme
- API key oluşturma

### 8.3 Günlük Kontroller

**Her gün (5 dakika):**
```bash
# Container çalışıyor mu?
docker ps | grep otto-tp

# Disk doldu mu?
df -h

# Son backup ne zaman?
ls -lh /opt/otto-tp-backups/daily/ | tail -5
```

**Her hafta (15 dakika):**
- Audit logs kontrol et
- Backup restore testi yap
- SSL sertifika süresi kontrol et
- Güncellemeleri kontrol et

**Her ay (30 dakika):**
- Kullanıcı listesi gözden geçir
- Kullanılmayan hesapları temizle
- Güvenlik güncellemelerini uygula
- Backup stratejisini gözden geçir

### 8.4 Güncelleme Prosedürü

```bash
# 1. Backup al
/usr/local/bin/backup-otto-tp.sh

# 2. Uygulamayı durdur
cd /opt/otto-tp
docker-compose down

# 3. Yeni versiyonu çek
git pull origin main

# 4. Rebuild ve başlat
docker-compose up -d --build

# 5. Logları kontrol et
docker logs otto-tp -f

# 6. Test et
curl https://totp.trt.net.tr
# Browser'da manuel test yap

# 7. Sorun varsa geri al
git checkout <previous-commit>
docker-compose up -d --build
```

### 8.5 İletişim Bilgileri

**Acil Durum İletişim:**
```
IT Yöneticisi: [İsim] - [Telefon] - [Email]
Güvenlik Sorumlusu: [İsim] - [Telefon] - [Email]
Sistem Admini: [İsim] - [Telefon] - [Email]

Çalışma Saatleri: 09:00-18:00
7/24 On-Call: [Telefon]
```

---

## 9. Sorun Giderme

### 9.1 Yaygın Sorunlar

**Uygulama açılmıyor:**
```bash
# Container durumu
docker ps -a

# Loglar
docker logs otto-tp --tail 100

# Port kontrolü
sudo netstat -tlnp | grep 3000

# Nginx durumu
sudo systemctl status nginx
sudo nginx -t
```

**SSL hatası:**
```bash
# Sertifika kontrolü
openssl x509 -in /etc/nginx/ssl/certificate.crt -text -noout

# Nginx config testi
sudo nginx -t

# Logs
sudo tail -f /var/log/nginx/error.log
```

**Login olmuyor:**
```bash
# Database durumu
docker exec otto-tp sqlite3 /app/data/app.db "SELECT username, role FROM users;"

# Şifre sıfırlama (en son çare)
docker-compose down
rm -rf data/app.db
docker-compose up -d
# Default credentials ile giriş yap
```

**Disk dolu:**
```bash
# Alan kontrolü
df -h

# Log temizleme
docker system prune -a
sudo journalctl --vacuum-time=7d

# Eski backupları temizle
find /opt/otto-tp-backups/daily -mtime +30 -delete
```

### 9.2 Destek

**GitHub Issues:**
https://github.com/yourusername/otto-tp/issues

**Email:**
support@yourdomain.com

---

## 10. Checklist (Deployment Öncesi)

### Altyapı
- [ ] Sunucu hazır (Ubuntu 22.04 LTS)
- [ ] Domain ayarlandı (DNS A record)
- [ ] SSH anahtarları kuruldu
- [ ] Firewall kuralları ayarlandı
- [ ] VPN erişimi test edildi

### Güvenlik
- [ ] Güçlü şifreler oluşturuldu
- [ ] JWT_SECRET ve ENCRYPTION_KEY ayarlandı
- [ ] SSL sertifikası kuruldu
- [ ] Fail2ban aktif
- [ ] SSH root login kapalı

### Uygulama
- [ ] Docker ve Docker Compose kuruldu
- [ ] Nginx kuruldu ve konfigüre edildi
- [ ] .env dosyası production değerleri ile dolduruldu
- [ ] Uygulama başarıyla çalışıyor
- [ ] HTTPS üzerinden erişim test edildi

### Backup
- [ ] Backup scripti kuruldu
- [ ] Cron job ayarlandı
- [ ] Backup restore testi yapıldı
- [ ] Backup sunucusu bağlantısı kuruldu (varsa)

### Kullanıcılar
- [ ] Default admin şifresi değiştirildi
- [ ] İlk kullanıcılar oluşturuldu
- [ ] Rol tanımları test edildi
- [ ] Kullanıcı dökümantasyonu hazırlandı

### İzleme
- [ ] Health check çalışıyor
- [ ] Loglar izleniyor
- [ ] Audit logs aktif
- [ ] Alarm sistemi kuruldu (opsiyonel)

### Eğitim
- [ ] IT ekibine eğitim verildi
- [ ] Son kullanıcılara demo yapıldı
- [ ] Dokümantasyon paylaşıldı
- [ ] Destek süreci belirlendi

---

## 11. İletişim ve Destek

**Proje Sahibi:**
Alameddin Çelik
GitHub: https://github.com/alameddinc

**TRT IT Departmanı:**
[İletişim bilgileri eklenecek]

---

## 12. Ek Notlar

### Kapasite Planlama

**50 kullanıcı:**
- Minimum specs yeterli
- Günlük backup: ~50 MB
- Aylık veri: ~1.5 GB

**500 kullanıcı:**
- Önerilen specs gerekli
- Günlük backup: ~200 MB
- Aylık veri: ~6 GB
- CPU/RAM monitoring önemli

**1000+ kullanıcı:**
- Horizontal scaling düşünülmeli
- Load balancer gerekebilir
- Database replication önerilir

### Compliance

**KVKK/GDPR Uyumluluğu:**
- Kullanıcı verisi şifreleniyor ✓
- Audit logs tutuluyor ✓
- Veri saklama süresi ayarlanabilir ✓
- Kullanıcı silme hakkı var ✓

**ISO 27001:**
- Access control ✓
- Encryption at rest ✓
- Audit trail ✓
- Backup/recovery ✓

---

**Son güncelleme:** 2025-10-02
**Versiyon:** 1.0
