# FiloApi - Fleet Management System Deployment Guide

## Sistem Gereksinimleri

### Minimum Gereksinimler
- **İşletim Sistemi**: Ubuntu 20.04+ veya benzeri Linux dağıtımı
- **Node.js**: v18.0.0 veya üzeri
- **PostgreSQL**: v14.0 veya üzeri
- **RAM**: Minimum 2GB (önerilen 4GB)
- **Disk Alanı**: Minimum 10GB
- **CPU**: 2 vCPU

### Opsiyonel Gereksinimler
- **Redis**: v6.0+ (cache için)
- **Nginx**: Reverse proxy için
- **PM2**: Process yönetimi için

## Kurulum Adımları

### 1. Sistem Paketlerini Güncelleme
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl build-essential
```

### 2. Node.js Kurulumu
```bash
# Node.js v20 kurulumu
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 3. PostgreSQL Kurulumu
```bash
# PostgreSQL kurulumu
sudo apt install -y postgresql postgresql-contrib

# PostgreSQL'e bağlanma
sudo -u postgres psql

# Veritabanı ve kullanıcı oluşturma
CREATE USER fleetuser WITH PASSWORD 'güvenli_şifre';
CREATE DATABASE fleetdb OWNER fleetuser;
GRANT ALL PRIVILEGES ON DATABASE fleetdb TO fleetuser;
\q
```

### 4. Proje Dosyalarını Kopyalama
```bash
# Proje dizini oluşturma
mkdir -p /var/www/fleetapi
cd /var/www/fleetapi

# Dosyaları kopyalama (Git veya SCP ile)
git clone <your-repository-url> .
# veya
scp -r /local/path/* user@server:/var/www/fleetapi/
```

### 5. Environment Variables Ayarlama
```bash
# .env.example'ı kopyalama
cp .env.example .env

# .env dosyasını düzenleme
nano .env
```

**Önemli Environment Variables:**
```env
# Zorunlu Değişkenler
NODE_ENV=production
PORT=5000
HOST=0.0.0.0
DATABASE_URL=postgresql://fleetuser:güvenli_şifre@localhost:5432/fleetdb
JWT_SECRET=minimum_32_karakterlik_güvenli_bir_string
SESSION_SECRET=minimum_32_karakterlik_başka_bir_güvenli_string

# API Güvenliği
API_RATE_LIMIT=1000
DEFAULT_API_KEY=ak_prod2025_güvenli_api_key

# CORS (frontend domain'iniz)
CORS_ORIGIN=https://yourdomain.com
TRUST_PROXY=true

# Dosya Yükleme
MAX_FILE_SIZE=50MB
UPLOAD_PATH=/var/www/fleetapi/uploads
```

### 6. Bağımlılıkları Yükleme
```bash
# Production dependencies
npm ci --production

# Veya tüm dependencies (build için gerekli)
npm install
```

### 7. Veritabanı Migration
```bash
# Veritabanı tablolarını oluşturma
npm run db:push
```

### 8. Projeyi Build Etme
```bash
# Frontend ve backend build
npm run build
```

### 9. Upload Dizinini Oluşturma
```bash
# Upload dizini
mkdir -p uploads
chmod 755 uploads
```

### 10. PM2 ile Çalıştırma (Önerilen)
```bash
# PM2 kurulumu
sudo npm install -g pm2

# Uygulama başlatma
pm2 start npm --name "fleetapi" -- start

# Otomatik başlatma ayarlama
pm2 startup
pm2 save
```

### 11. Nginx Reverse Proxy (Opsiyonel)
```bash
# Nginx kurulumu
sudo apt install -y nginx

# Nginx konfigürasyonu
sudo nano /etc/nginx/sites-available/fleetapi
```

**Nginx Konfigürasyonu:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    client_max_body_size 50M;
}
```

```bash
# Konfigürasyonu aktifleştirme
sudo ln -s /etc/nginx/sites-available/fleetapi /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 12. SSL Sertifikası (Let's Encrypt)
```bash
# Certbot kurulumu
sudo apt install -y certbot python3-certbot-nginx

# SSL sertifikası alma
sudo certbot --nginx -d yourdomain.com
```

## Güvenlik Ayarları

### Firewall Konfigürasyonu
```bash
# UFW kurulumu ve ayarlama
sudo apt install -y ufw
sudo ufw allow 22/tcp  # SSH
sudo ufw allow 80/tcp  # HTTP
sudo ufw allow 443/tcp # HTTPS
sudo ufw enable
```

### Dosya İzinleri
```bash
# Güvenli dosya izinleri
sudo chown -R www-data:www-data /var/www/fleetapi
sudo chmod -R 755 /var/www/fleetapi
sudo chmod 600 /var/www/fleetapi/.env
```

## Monitoring ve Logging

### PM2 Monitoring
```bash
# Logları görüntüleme
pm2 logs fleetapi

# Process durumu
pm2 status

# CPU/Memory kullanımı
pm2 monit
```

### Sistem Logları
```bash
# Nginx logları
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# PostgreSQL logları
tail -f /var/log/postgresql/postgresql-*.log
```

## Backup Stratejisi

### Veritabanı Backup
```bash
# Manuel backup
pg_dump -U fleetuser fleetdb > backup_$(date +%Y%m%d_%H%M%S).sql

# Otomatik backup (cron)
crontab -e
# Ekle: 0 2 * * * pg_dump -U fleetuser fleetdb > /backups/fleetdb_$(date +\%Y\%m\%d).sql
```

### Dosya Backup
```bash
# Upload dosyaları backup
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz uploads/
```

## Sorun Giderme

### Port Kontrol
```bash
# 5000 portunu kontrol
sudo lsof -i :5000
```

### PostgreSQL Bağlantı Testi
```bash
# Bağlantıyı test et
psql -h localhost -U fleetuser -d fleetdb
```

### PM2 Reset
```bash
pm2 stop fleetapi
pm2 delete fleetapi
pm2 start npm --name "fleetapi" -- start
```

## API Endpoint'leri

### Ana Endpoint'ler
- **API Dokümantasyon**: `GET /api/docs`
- **API Overview**: `GET /api/overview`
- **Health Check**: `GET /api/health`
- **Auth Login**: `POST /api/auth/login`
- **Auth Refresh**: `POST /api/auth/refresh`

### API Anahtarı Kullanımı
```bash
# API anahtarı ile istek örneği
curl -H "X-API-Key: ak_prod2025_your_key" https://yourdomain.com/api/secure/assets
```

### JWT Token Kullanımı
```bash
# Login
curl -X POST https://yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your_password"}'

# Token ile istek
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" https://yourdomain.com/api/backend/users
```

## Performans Optimizasyonu

### Node.js Ayarları
```bash
# PM2 cluster mode (multi-core)
pm2 start npm --name "fleetapi" -i max -- start
```

### PostgreSQL Optimizasyonu
```sql
-- postgresql.conf ayarları
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
```

## Güncelleme Prosedürü

```bash
# Backup al
pg_dump -U fleetuser fleetdb > backup_before_update.sql

# Uygulamayı durdur
pm2 stop fleetapi

# Güncellemeleri çek
git pull origin main
# veya yeni dosyaları kopyala

# Dependencies güncelle
npm install

# Build et
npm run build

# Database migrations
npm run db:push

# Uygulamayı başlat
pm2 start fleetapi
```

## İletişim ve Destek

**Proje Bilgileri:**
- **Versiyon**: 3.0.0
- **API Endpoint Sayısı**: 138+
- **Güvenlik**: JWT + API Key authentication
- **Veritabanı**: PostgreSQL with Drizzle ORM

---

**NOT**: Bu dokümantasyon production deployment için hazırlanmıştır. Development ortamında `npm run dev` komutu ile direkt çalıştırabilirsiniz.