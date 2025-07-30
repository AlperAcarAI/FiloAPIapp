# DigitalOcean Deployment Rehberi

## 1. DigitalOcean Droplet Kurulumu

### Droplet Özellikleri
```
- İşletim Sistemi: Ubuntu 22.04 LTS
- Plan: Basic ($24/month - 4GB RAM, 2 CPUs, 80GB SSD)
- Konum: Frankfurt (Türkiye'ye en yakın)
- IPv6 Aktif
- Monitoring Aktif
```

### SSH Key Ekleme
```bash
# Local makinende SSH key oluştur
ssh-keygen -t rsa -b 4096 -c "your-email@example.com"

# Public key'i DigitalOcean'a ekle
cat ~/.ssh/id_rsa.pub
```

## 2. Sunucu İlk Kurulum

### Root Kullanıcı ile Bağlantı
```bash
ssh root@YOUR_DROPLET_IP
```

### Sistem Güncellemesi
```bash
apt update && apt upgrade -y
apt install -y curl wget git nginx certbot python3-certbot-nginx
```

### Node.js Kurulumu (v20)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs
node --version  # v20.x olmalı
npm --version
```

### PostgreSQL Kurulumu
```bash
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql

# PostgreSQL kullanıcı oluşturma
sudo -u postgres psql
```

### PostgreSQL Veritabanı Setup
```sql
-- PostgreSQL konsolu içinde
CREATE USER fleetadmin WITH PASSWORD 'your_strong_password_here';
CREATE DATABASE fleetmanagement OWNER fleetadmin;
GRANT ALL PRIVILEGES ON DATABASE fleetmanagement TO fleetadmin;
\q
```

## 3. Uygulama Kullanıcısı Oluşturma

### Güvenlik için ayrı kullanıcı
```bash
adduser fleetapp
usermod -aG sudo fleetapp
su - fleetapp
```

### SSH Key Kopyalama
```bash
# Root'tan fleetapp kullanıcısına SSH key kopyala
mkdir -p /home/fleetapp/.ssh
cp /root/.ssh/authorized_keys /home/fleetapp/.ssh/
chown -R fleetapp:fleetapp /home/fleetapp/.ssh
chmod 700 /home/fleetapp/.ssh
chmod 600 /home/fleetapp/.ssh/authorized_keys
```

## 4. Git Repository Clone

### fleetapp kullanıcısı ile
```bash
cd /home/fleetapp
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME

# Dependency kurulumu
npm install

# Production build
npm run build
```

## 5. Environment Variables Setup

### .env Dosyası Oluşturma
```bash
nano .env
```

### .env İçeriği
```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://fleetadmin:your_strong_password_here@localhost:5432/fleetmanagement

# JWT Secrets
JWT_SECRET=your_super_secure_jwt_secret_here
SESSION_SECRET=your_super_secure_session_secret_here

# API Security
API_RATE_LIMIT=1000
DEFAULT_API_KEY=ak_prod2025_rwba6dj1sw

# Server Configuration
CORS_ORIGIN=https://yourdomain.com
TRUST_PROXY=true
```

## 6. Database Migration

### Schema ve Test Data
```bash
# PostgreSQL'e bağlan
psql postgresql://fleetadmin:your_password@localhost:5432/fleetmanagement

# Schema dosyalarını çalıştır
\i schema.sql
\i data.sql
\q

# Drizzle migration (eğer varsa)
npm run db:push
```

## 7. PM2 Process Manager

### PM2 Kurulumu
```bash
npm install -g pm2
```

### PM2 Configuration
```bash
# ecosystem.config.js oluştur
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'fleet-management-api',
    script: 'npm',
    args: 'start',
    cwd: '/home/fleetapp/YOUR_REPO_NAME',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max_old_space_size=1024'
  }]
}
```

### PM2 Başlatma
```bash
mkdir logs
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 8. Nginx Reverse Proxy

### Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/fleet-api
```

### Nginx Config İçeriği
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # API requests
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # Frontend static files
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
```

### Nginx Aktifleştirme
```bash
sudo ln -s /etc/nginx/sites-available/fleet-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 9. SSL Certificate (Let's Encrypt)

### Certbot ile SSL
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### Auto-renewal Test
```bash
sudo certbot renew --dry-run
```

## 10. Firewall Configuration

### UFW Firewall Setup
```bash
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw allow 5432  # PostgreSQL (sadece localhost'tan erişim için)
sudo ufw status
```

## 11. Monitoring ve Logs

### Log Rotation
```bash
sudo nano /etc/logrotate.d/fleet-app
```

```
/home/fleetapp/YOUR_REPO_NAME/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 fleetapp fleetapp
    postrotate
        pm2 reloadLogs
    endscript
}
```

### System Monitoring
```bash
# PM2 monitoring
pm2 monit

# System resources
htop
df -h
free -h
```

## 12. Package.json Scripts Update

```json
{
  "scripts": {
    "start": "NODE_ENV=production node server/index.js",
    "build": "npm run build:client && npm run build:server",
    "build:client": "vite build",
    "build:server": "esbuild server/index.ts --bundle --platform=node --target=node20 --outfile=server/index.js --external:pg-native",
    "dev": "tsx server/index.ts",
    "db:push": "drizzle-kit push:pg"
  }
}
```

## 13. Deployment Script

### deploy.sh Oluşturma
```bash
nano deploy.sh
chmod +x deploy.sh
```

```bash
#!/bin/bash
echo "🚀 Fleet Management API Deployment Started"

# Git pull
git pull origin main

# Install dependencies
npm ci --only=production

# Build application
npm run build

# Restart PM2
pm2 restart fleet-management-api

# Reload Nginx
sudo systemctl reload nginx

echo "✅ Deployment completed successfully!"
echo "🌐 API erişim: https://yourdomain.com/api/docs"
```

## 14. Health Check Endpoint

### API Health Check
```bash
curl -X GET https://yourdomain.com/api/health
```

## 15. Backup Strategy

### Database Backup Script
```bash
nano backup.sh
chmod +x backup.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/fleetapp/backups"
mkdir -p $BACKUP_DIR

# Database backup
pg_dump postgresql://fleetadmin:password@localhost:5432/fleetmanagement > $BACKUP_DIR/db_backup_$DATE.sql

# Compress
gzip $BACKUP_DIR/db_backup_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "Backup completed: db_backup_$DATE.sql.gz"
```

### Cron Job for Backups
```bash
crontab -e
# Her gün saat 02:00'da backup
0 2 * * * /home/fleetapp/backup.sh
```

## 16. Final Checklist

✅ **Droplet Setup**: Ubuntu 22.04, 4GB RAM
✅ **Dependencies**: Node.js 20, PostgreSQL, Nginx
✅ **Database**: Created and migrated
✅ **Environment**: Production .env configured  
✅ **PM2**: Application running with clustering
✅ **Nginx**: Reverse proxy configured
✅ **SSL**: Let's Encrypt certificate
✅ **Firewall**: UFW properly configured
✅ **Monitoring**: PM2 monitoring active
✅ **Backups**: Automated daily backups
✅ **Health Check**: API endpoints responding

## 17. Domain Configuration

### DNS Settings (Namecheap/GoDaddy)
```
Type: A Record
Host: @
Value: YOUR_DROPLET_IP
TTL: 300

Type: A Record  
Host: www
Value: YOUR_DROPLET_IP
TTL: 300
```

## 18. Post-Deployment Testing

### API Test Commands
```bash
# Health check
curl -X GET https://yourdomain.com/api/health

# Authentication test
curl -X GET https://yourdomain.com/api/secure/getCities \
  -H "X-API-Key: ak_prod2025_rwba6dj1sw"

# POST test
curl -X POST https://yourdomain.com/api/secure/addCity \
  -H "X-API-Key: ak_prod2025_rwba6dj1sw" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Şehir"}'
```

**Tahmini Kurulum Süresi**: 2-3 saat
**Aylık Maliyet**: ~$25-30 (Droplet + Domain)
**Performans**: 2 PM2 instance ile 1000+ concurrent user desteği