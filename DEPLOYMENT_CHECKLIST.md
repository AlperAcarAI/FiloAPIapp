# DigitalOcean Deployment Checklist

## ✅ Ön Hazırlık
- [ ] DigitalOcean hesabı oluşturuldu
- [ ] SSH key çifti oluşturuldu
- [ ] Domain satın alındı (opsiyonel)
- [ ] Git repository hazırlandı

## ✅ Droplet Kurulumu
- [ ] Ubuntu 22.04 LTS Droplet oluşturuldu (4GB RAM önerili)
- [ ] SSH key eklendi
- [ ] Droplet IP adresi not edildi
- [ ] SSH ile bağlantı test edildi

## ✅ Sistem Güncellemesi
```bash
ssh root@YOUR_DROPLET_IP
apt update && apt upgrade -y
```

## ✅ Gerekli Yazılımları Kurma
```bash
# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs

# PostgreSQL
apt install -y postgresql postgresql-contrib

# Nginx
apt install -y nginx

# SSL için Certbot
apt install -y certbot python3-certbot-nginx

# PM2 (Process Manager)
npm install -g pm2

# Diğer araçlar
apt install -y git curl wget htop
```

## ✅ PostgreSQL Kurulumu
```bash
sudo -u postgres psql
```
```sql
CREATE USER fleetadmin WITH PASSWORD 'güçlü_şifre_buraya';
CREATE DATABASE fleetmanagement OWNER fleetadmin;
GRANT ALL PRIVILEGES ON DATABASE fleetmanagement TO fleetadmin;
\q
```

## ✅ Uygulama Kullanıcısı
```bash
adduser fleetapp
usermod -aG sudo fleetapp
su - fleetapp
```

## ✅ Kod Repository Clone
```bash
cd /home/fleetapp
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
npm install
```

## ✅ Environment Variables
```bash
nano .env
```
```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://fleetadmin:şifre@localhost:5432/fleetmanagement
JWT_SECRET=süper_güçlü_jwt_secret_32_karakter_minimum
SESSION_SECRET=süper_güçlü_session_secret_32_karakter
API_RATE_LIMIT=1000
DEFAULT_API_KEY=ak_prod2025_rwba6dj1sw
```

## ✅ Database Migration
```bash
# PostgreSQL'e bağlan ve schema'yı çalıştır
psql postgresql://fleetadmin:şifre@localhost:5432/fleetmanagement
\i schema.sql
\i data.sql
\q

# Drizzle migration (varsa)
npm run db:push
```

## ✅ PM2 Configuration
```bash
# ecosystem.config.js dosyası zaten proje içinde mevcut
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## ✅ Nginx Setup
```bash
sudo cp nginx.conf /etc/nginx/sites-available/fleet-api
sudo ln -s /etc/nginx/sites-available/fleet-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## ✅ SSL Certificate (Domain varsa)
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
sudo certbot renew --dry-run
```

## ✅ Firewall Configuration
```bash
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw status
```

## ✅ Backup Setup
```bash
# backup.sh scripti zaten proje içinde mevcut
chmod +x backup.sh

# Cron job ekle
crontab -e
# Bu satırı ekle: 0 2 * * * /home/fleetapp/YOUR_REPO/backup.sh
```

## ✅ Health Check Setup
```bash
chmod +x health-check.sh

# Test et
./health-check.sh http://localhost:5000
```

## ✅ Son Testler
```bash
# API Health Check
curl -X GET http://localhost:5000/api/health

# Authentication Test
curl -X GET http://localhost:5000/api/secure/getCities \
  -H "X-API-Key: ak_prod2025_rwba6dj1sw"

# PM2 Status
pm2 status

# Nginx Status
sudo systemctl status nginx

# PostgreSQL Status
sudo systemctl status postgresql
```

## ✅ Domain Configuration (Opsiyonel)
**DNS Ayarları:**
```
A Record: @ → YOUR_DROPLET_IP
A Record: www → YOUR_DROPLET_IP
TTL: 300
```

## ✅ Monitoring Setup
```bash
# PM2 monitoring
pm2 monit

# Log rotation
sudo nano /etc/logrotate.d/fleet-app
```

## ✅ Production URL'ler
- **API Base**: `https://yourdomain.com/api/`
- **Health Check**: `https://yourdomain.com/api/health`
- **API Docs**: `https://yourdomain.com/api/docs`
- **Dashboard**: `https://yourdomain.com/`

## ✅ Güvenlik Checklist
- [ ] Strong passwords used
- [ ] SSH key authentication
- [ ] Firewall configured
- [ ] SSL certificate installed
- [ ] Rate limiting configured
- [ ] Security headers added
- [ ] Database access restricted

## ✅ Performance Checklist
- [ ] PM2 clustering enabled (2 instances)
- [ ] Nginx gzip compression
- [ ] Static file caching
- [ ] Database indexes optimized
- [ ] Log rotation configured

## ✅ Backup Checklist
- [ ] Daily automated backups
- [ ] Backup retention policy (7 days)
- [ ] Database backup tested
- [ ] Application backup tested
- [ ] Recovery procedure documented

## 🚀 Final Deployment
```bash
# Son deployment
./deploy.sh

# Production'da test
./health-check.sh https://yourdomain.com
```

## 📊 Monitoring Commands
```bash
# PM2 Status
pm2 status
pm2 logs
pm2 monit

# System Resources
htop
df -h
free -h

# Nginx Logs
sudo tail -f /var/log/nginx/fleet-api-access.log
sudo tail -f /var/log/nginx/fleet-api-error.log

# Application Logs
tail -f logs/combined.log
```

## 🔧 Troubleshooting
```bash
# PM2 restart
pm2 restart all

# Nginx restart
sudo systemctl restart nginx

# PostgreSQL restart
sudo systemctl restart postgresql

# Check ports
sudo netstat -tlnp | grep :5000
sudo netstat -tlnp | grep :80
```

## 💰 Maliyet Tahmini
- **Droplet (4GB)**: $24/month
- **Domain**: $10-15/year
- **SSL**: Free (Let's Encrypt)
- **Toplam**: ~$25-30/month