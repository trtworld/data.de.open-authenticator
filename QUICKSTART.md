# 🚀 Quick Start Guide

En hızlı şekilde Authenticator TRT'yi çalıştırın.

## ⚡ 3 Dakikada Başlat

### Yöntem 1: Otomatik Script (Önerilen)

```bash
# Docker Desktop'ı başlatın (varsa)
# Ardından:

./start.sh
```

Bu script:
- Docker'ın çalıştığını kontrol eder
- `.env.production` oluşturur
- Docker image'ı build eder
- Container'ı başlatır

### Yöntem 2: Manuel

```bash
# 1. Docker Desktop'ı başlat

# 2. Environment dosyasını oluştur
cp .env.production.example .env.production

# 3. Build ve start
docker-compose build
docker-compose up -d

# 4. Erişim
open http://localhost:3000
```

## 🔑 Giriş Bilgileri

- **Admin**: `admin` / `admin` (tüm yetkiler)
- **Viewer**: `viewer` / `viewer` (sadece görüntüleme)

## 📝 İlk Kullanım

1. **Login olun** (admin olarak önerilir)

2. **Add Account** butonuna tıklayın

3. **İki yöntemden birini seçin**:

   **Yöntem A: Manuel Giriş**
   - Account Label: `Gmail - İş`
   - Secret Key: `JBSWY3DPEHPK3PXP` (test için)
   - Add Account

   **Yöntem B: QR Code** (yakında)
   - QR code resmi yükleyin
   - Otomatik parse edilecek

4. **TOTP kodunu görün**
   - 6 haneli kod otomatik yenilenir (30s)
   - Copy butonuyla kopyalayın
   - Login yaparken kullanın

## 🛑 Durdurma

```bash
docker-compose down
```

## 🔄 Yeniden Başlatma

```bash
docker-compose restart
```

## 📊 Logları Görme

```bash
docker-compose logs -f
```

## ❓ Sorun Giderme

### Docker çalışmıyor
```bash
# Docker Desktop'ı başlatın
# macOS: Docker Desktop uygulamasını açın
# Linux: sudo systemctl start docker
```

### Port 3000 kullanımda
```bash
# docker-compose.yml'de portu değiştirin:
ports:
  - "3001:3000"  # 3001 kullanacak

# Ardından:
docker-compose down
docker-compose up -d
```

### Database hatası
```bash
# Data dizinini temizle (DİKKAT: Tüm hesaplar silinir!)
rm -rf data/
mkdir -p data

# Restart
docker-compose restart
```

### Container build olmuyor
```bash
# Cache'siz rebuild
docker-compose build --no-cache
docker-compose up -d
```

## 🔐 Güvenlik Notu

**Geliştirme için:**
- Varsayılan şifreler kullanılabilir
- HTTP yeterli

**Production için:**
- `.env.production`'da güçlü keyler oluşturun:
  ```bash
  openssl rand -base64 32  # ENCRYPTION_KEY
  openssl rand -base64 32  # JWT_SECRET
  ```
- HTTPS kullanın (nginx + Let's Encrypt)
- Firewall kuralları ekleyin
- Düzenli backup alın

## 📚 Daha Fazla

- [DEPLOYMENT.md](DEPLOYMENT.md) - Production deployment
- [README.md](README.md) - Detaylı döküman
- [GitHub Issues](https://github.com/yourusername/authenticator-trt/issues) - Sorunlar

---

**Not**: İlk çalıştırmada database otomatik oluşturulur. `data/app.db` dosyası tüm hesapları saklar.
