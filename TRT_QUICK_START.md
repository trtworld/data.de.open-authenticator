# Otto-TP TRT Hızlı Başlangıç

TRT için 1 saatte production'a alma rehberi.

---

## ⚡ Hızlı Kurulum (60 dakika)

### 1️⃣ Sunucu Hazırlığı (15 dk)

```bash
# SSH ile bağlan
ssh admin@sunucu-ip

# Sistem güncellemesi
sudo apt update && sudo apt upgrade -y

# Docker kurulumu
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
sudo apt install docker-compose-plugin -y

# Firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2️⃣ SSL ve Nginx (15 dk)

```bash
# Nginx kurulumu
sudo apt install nginx -y

# SSL sertifikası (TRT IT'den alınan sertifika)
sudo mkdir -p /etc/nginx/ssl/
sudo nano /etc/nginx/ssl/certificate.crt  # Yapıştır
sudo nano /etc/nginx/ssl/private.key     # Yapıştır
sudo chmod 600 /etc/nginx/ssl/private.key

# Nginx konfigürasyonu
sudo nano /etc/nginx/sites-available/otto-tp
```

**Yapıştır:**
```nginx
server {
    listen 80;
    server_name totp.trt.net.tr;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name totp.trt.net.tr;

    ssl_certificate /etc/nginx/ssl/certificate.crt;
    ssl_certificate_key /etc/nginx/ssl/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;

    add_header Strict-Transport-Security "max-age=31536000" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    access_log /var/log/nginx/otto-tp-access.log;
    error_log /var/log/nginx/otto-tp-error.log;
}
```

```bash
# Aktifleştir
sudo ln -s /etc/nginx/sites-available/otto-tp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3️⃣ Uygulama Kurulumu (20 dk)

```bash
# Projeyi indir
cd /opt
sudo git clone https://github.com/yourusername/otto-tp.git
sudo chown -R $USER:$USER otto-tp
cd otto-tp

# Environment dosyası oluştur
cp .env.example .env
nano .env
```

**ÖNEMLİ - .env içeriği:**
```env
# Şifreleri DEĞİŞTİR!
ADMIN_PASSWORD=TRT_Admin_2025_GuclU!Sifre
VIEWER_PASSWORD=TRT_Viewer_2025_GuclU!Sifre

# Bu komutları çalıştır ve sonuçları yapıştır:
# JWT_SECRET=$(openssl rand -hex 32)
# ENCRYPTION_KEY=$(openssl rand -hex 32)
JWT_SECRET=buraya_openssl_komutu_sonucu
ENCRYPTION_KEY=buraya_openssl_komutu_sonucu

AUDIT_RETENTION_DAYS=2
ORGANIZATION_NAME=TRT
```

```bash
# Docker Compose düzenle
nano docker-compose.yml
```

**127.0.0.1:3000 olarak değiştir (güvenlik için):**
```yaml
ports:
  - "127.0.0.1:3000:3000"  # Bu satırı bul ve değiştir
```

```bash
# Başlat
docker-compose up -d --build

# Kontrol et
docker logs otto-tp -f
```

### 4️⃣ İlk Giriş ve Ayarlar (10 dk)

```bash
# Browser'da aç
https://totp.trt.net.tr

# Login
Username: admin
Password: (ADMIN_PASSWORD değerin)
```

**İLK YAPILACAKLAR:**

1. **Yeni admin oluştur:**
   - Settings → Manage Users
   - Username: `trt.admin`
   - Password: Güçlü şifre
   - Role: admin
   - Kaydet

2. **Default admin'i değiştir/devre dışı bırak:**
   - Settings → Manage Users
   - `admin` kullanıcısını bul
   - Şifresini değiştir VEYA devre dışı bırak

3. **Test kullanıcıları oluştur:**
   ```
   Username: test.user
   Password: Test123!
   Role: user

   Username: test.viewer
   Password: Test123!
   Role: viewer
   ```

4. **Test TOTP hesabı ekle:**
   - Dashboard → Add Account
   - Label: Test Google
   - Secret: `JBSWY3DPEHPK3PXP` (test secret)
   - Issuer: Google
   - Visibility: team
   - Save

5. **Test et:**
   - TOTP code kopyala
   - Hesabı sil
   - Logout/login yap
   - Farklı rollerle giriş yap

---

## 📋 Hızlı Kontrol Listesi

### Deployment Öncesi
```
✓ Domain DNS ayarı yapıldı mı?
✓ Sunucu erişimi var mı?
✓ SSL sertifikası hazır mı?
✓ Güçlü şifreler oluşturuldu mu?
✓ .env dosyası dolduruldu mu?
```

### Deployment Sonrası
```
✓ Uygulama açılıyor mu? (https://totp.trt.net.tr)
✓ Login çalışıyor mu?
✓ TOTP ekleme/silme/görüntüleme çalışıyor mu?
✓ Farklı roller test edildi mi?
✓ SSL sertifikası geçerli mi?
✓ Docker container healthy mi?
```

### İlk Hafta
```
✓ Günlük backup çalışıyor mu?
✓ Audit logs düzgün tutuluyor mu?
✓ Kullanıcılar eklendi mi?
✓ IT ekibine eğitim verildi mi?
✓ Son kullanıcılara duyuru yapıldı mı?
```

---

## 🚨 Acil Müdahale

### Uygulama Açılmıyor

```bash
# Container durumu
docker ps -a
docker logs otto-tp --tail 50

# Yeniden başlat
docker-compose restart

# Hala açılmıyorsa
docker-compose down
docker-compose up -d --build
```

### Login Olmuyor

```bash
# Şifreyi kontrol et
cat .env | grep ADMIN_PASSWORD

# Database'e bak
docker exec otto-tp sqlite3 /app/data/app.db "SELECT username FROM users;"

# Son çare: Reset
docker-compose down
rm -rf data/app.db
docker-compose up -d
# Default: admin/actrt123admin ile giriş yap
```

### SSL Hatası

```bash
# Nginx testi
sudo nginx -t

# Sertifika kontrolü
openssl x509 -in /etc/nginx/ssl/certificate.crt -text -noout

# Nginx restart
sudo systemctl restart nginx
```

---

## 📞 İletişim

**Teknik Destek:**
- GitHub Issues: https://github.com/yourusername/otto-tp/issues
- Email: support@domain.com

**TRT IT Departmanı:**
- [İsim]: [Telefon] - [Email]
- 7/24 On-Call: [Telefon]

---

## 📚 Detaylı Dokümantasyon

- **Tam Deployment Guide:** `TRT_DEPLOYMENT.md`
- **Genel Deployment:** `DEPLOYMENT.md`
- **README:** `README.md`
- **API Docs:** https://totp.trt.net.tr/api-docs

---

**⏱️ Toplam Süre:** ~60 dakika
**✅ Deployment Durumu:** Production Ready
**🎯 Son Adım:** IT ekibine eğitim ver!
