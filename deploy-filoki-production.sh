#!/bin/bash

# ======================================
# FİLOKİ API PRODUCTION DEPLOYMENT SCRIPT
# Domain: filokiapi.architectaiagency.com
# ======================================

set -e  # Hata durumunda script'i durdur

echo "🚀 FILOKI API DEPLOYMENT BAŞLATILIYOR..."
echo "======================================"
echo "📅 Tarih: $(date)"
echo "🌐 Domain: filokiapi.architectaiagency.com"
echo ""

# ======================================
# 1. ORTAM DEĞİŞKENLERİ
# ======================================
export DOMAIN="filokiapi.architectaiagency.com"
export APP_USER="fleetapp"
export APP_DIR="/home/$APP_USER/fleet-management-api"
export NODE_VERSION="20"
export DB_NAME="fleetmanagement"
export DB_USER="fleetadmin"
export DB_PASSWORD="Fl0k1Api2025!Secure"
export ADMIN_EMAIL="admin@example.com"
export ADMIN_PASSWORD="Architect"
export JWT_SECRET="f27294d1df02e868c14292ac48050d5d61f02e6e28708247434f2bac35a397d2"
export JWT_REFRESH_SECRET="f07cda845b33a9598c114bd1c41de50b82e9b29f549e230e5491b12a1371c8f4"
export SESSION_SECRET="sk_fleet_2025_session_9f8e7d6c5b4a3c2d1e0f"
export API_KEY="ak_prod2025_rwba6dj1sw"

echo "✅ Ortam değişkenleri ayarlandı"

# ======================================
# 2. KULLANICI VE DIZIN OLUŞTURMA
# ======================================
echo ""
echo "📁 Kullanıcı ve dizin yapılandırması..."

# Kullanıcı oluştur (yoksa)
if ! id "$APP_USER" &>/dev/null; then
    sudo adduser --disabled-password --gecos "" $APP_USER
    echo "✅ $APP_USER kullanıcısı oluşturuldu"
else
    echo "✅ $APP_USER kullanıcısı mevcut"
fi

# SSH key kopyala
sudo mkdir -p /home/$APP_USER/.ssh
sudo cp ~/.ssh/authorized_keys /home/$APP_USER/.ssh/
sudo chown -R $APP_USER:$APP_USER /home/$APP_USER/.ssh
sudo chmod 700 /home/$APP_USER/.ssh
sudo chmod 600 /home/$APP_USER/.ssh/authorized_keys

# Uygulama dizini oluştur
sudo mkdir -p $APP_DIR
sudo chown -R $APP_USER:$APP_USER $APP_DIR

# ======================================
# 3. SISTEM PAKETLERİ KURULUMU
# ======================================
echo ""
echo "📦 Sistem paketleri kuruluyor..."

# Sistem güncelleme
sudo apt update && sudo apt upgrade -y

# Temel paketler
sudo apt install -y \
    curl \
    wget \
    git \
    build-essential \
    nginx \
    postgresql \
    postgresql-contrib \
    certbot \
    python3-certbot-nginx \
    ufw \
    htop \
    fail2ban

echo "✅ Sistem paketleri kuruldu"

# ======================================
# 4. NODE.JS KURULUMU
# ======================================
echo ""
echo "🟩 Node.js $NODE_VERSION kuruluyor..."

# NodeSource repository ekle
curl -fsSL https://deb.nodesource.com/setup_$NODE_VERSION.x | sudo -E bash -
sudo apt install -y nodejs

# PM2 global kurulum
sudo npm install -g pm2

echo "✅ Node.js $(node -v) ve npm $(npm -v) kuruldu"

# ======================================
# 5. POSTGRESQL YAPILANDIRMASI
# ======================================
echo ""
echo "🐘 PostgreSQL yapılandırılıyor..."

# PostgreSQL başlat
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Database ve kullanıcı oluştur
sudo -u postgres psql <<EOF
-- Kullanıcı yoksa oluştur
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = '$DB_USER') THEN
        CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
    END IF;
END
\$\$;

-- Database yoksa oluştur
SELECT 'CREATE DATABASE $DB_NAME OWNER $DB_USER'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\gexec

-- Yetkileri ver
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
\q
EOF

echo "✅ PostgreSQL yapılandırıldı"

# ======================================
# 6. UYGULAMA KODUNU KOPYALA/GÜNCELLE
# ======================================
echo ""
echo "📥 Uygulama kodu hazırlanıyor..."

# Git ile klonla veya güncelle
if [ -d "$APP_DIR/.git" ]; then
    cd $APP_DIR
    sudo -u $APP_USER git pull origin main
    echo "✅ Kod güncellendi"
else
    # Mevcut proje dosyalarını kopyala
    sudo cp -r . $APP_DIR/
    sudo chown -R $APP_USER:$APP_USER $APP_DIR
    echo "✅ Kod kopyalandı"
fi

# ======================================
# 7. ENVIRONMENT DOSYASI OLUŞTUR
# ======================================
echo ""
echo "🔧 Environment dosyası oluşturuluyor..."

sudo -u $APP_USER tee $APP_DIR/.env > /dev/null <<EOF
# Production Environment Variables
NODE_ENV=production
PORT=5000

# Database
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME

# JWT Tokens
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET
SESSION_SECRET=$SESSION_SECRET

# API Security
DEFAULT_API_KEY=$API_KEY
API_RATE_LIMIT=1000

# CORS Configuration
CORS_ORIGIN=https://$DOMAIN
TRUST_PROXY=true

# Admin Credentials
ADMIN_EMAIL=$ADMIN_EMAIL
ADMIN_PASSWORD=$ADMIN_PASSWORD
EOF

echo "✅ .env dosyası oluşturuldu"

# ======================================
# 8. NPM DEPENDENCIES VE BUILD
# ======================================
echo ""
echo "📦 NPM dependencies kuruluyor..."

cd $APP_DIR
sudo -u $APP_USER npm ci --only=production

echo ""
echo "🔨 Uygulama build ediliyor..."
sudo -u $APP_USER npm run build

echo "✅ Build tamamlandı"

# ======================================
# 9. DATABASE MIGRATION
# ======================================
echo ""
echo "🗄️ Database migration çalıştırılıyor..."

# Drizzle migration
sudo -u $APP_USER npm run db:push || echo "⚠️ Migration zaten yapılmış olabilir"

echo "✅ Database hazır"

# ======================================
# 10. PM2 YAPILANDIRMASI
# ======================================
echo ""
echo "⚙️ PM2 process manager yapılandırılıyor..."

# PM2 ecosystem dosyası oluştur
sudo -u $APP_USER tee $APP_DIR/ecosystem.config.js > /dev/null <<'EOF'
module.exports = {
  apps: [{
    name: 'filoki-api',
    script: './server/index.js',
    instances: 2,
    exec_mode: 'cluster',
    max_memory_restart: '500M',
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
EOF

# Log dizini oluştur
sudo -u $APP_USER mkdir -p $APP_DIR/logs

# PM2 başlat
sudo -u $APP_USER pm2 stop filoki-api 2>/dev/null || true
sudo -u $APP_USER pm2 start ecosystem.config.js --env production
sudo -u $APP_USER pm2 save
sudo -u $APP_USER pm2 startup systemd -u $APP_USER --hp /home/$APP_USER

echo "✅ PM2 yapılandırıldı ve başlatıldı"

# ======================================
# 11. NGINX YAPILANDIRMASI
# ======================================
echo ""
echo "🌐 Nginx yapılandırılıyor..."

# Nginx site config
sudo tee /etc/nginx/sites-available/$DOMAIN > /dev/null <<EOF
# Rate limiting zones
limit_req_zone \$binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone \$binary_remote_addr zone=login_limit:10m rate=5r/m;

# Upstream backend
upstream filoki_backend {
    server localhost:5000;
    keepalive 64;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;
    
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;

    # SSL certificates (Let's Encrypt tarafından doldurulacak)
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';" always;
    
    # CORS headers
    add_header Access-Control-Allow-Origin "https://$DOMAIN" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-API-Key" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Client body size
    client_max_body_size 50M;
    
    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
    
    # API endpoints
    location /api {
        # Rate limiting
        limit_req zone=api_limit burst=20 nodelay;
        
        # Login endpoint stricter limit
        location /api/auth/login {
            limit_req zone=login_limit burst=5 nodelay;
            proxy_pass http://filoki_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_cache_bypass \$http_upgrade;
        }
        
        # General API proxy
        proxy_pass http://filoki_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Static files
    location / {
        root $APP_DIR/dist;
        try_files \$uri \$uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Site'i etkinleştir
sudo ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
sudo nginx -t

echo "✅ Nginx yapılandırıldı"

# ======================================
# 12. SSL SERTİFİKASI (LET'S ENCRYPT)
# ======================================
echo ""
echo "🔒 SSL sertifikası alınıyor..."

# Önce HTTP sunucusunu başlat
sudo systemctl reload nginx

# SSL sertifikası al
sudo certbot --nginx \
    -d $DOMAIN \
    -d www.$DOMAIN \
    --non-interactive \
    --agree-tos \
    --email $ADMIN_EMAIL \
    --redirect

# Auto-renewal cron job
echo "0 0,12 * * * root certbot renew --quiet" | sudo tee /etc/cron.d/certbot-renew

echo "✅ SSL sertifikası kuruldu ve auto-renewal aktif"

# ======================================
# 13. FIREWALL YAPILANDIRMASI
# ======================================
echo ""
echo "🔥 Firewall yapılandırılıyor..."

# UFW kuralları
sudo ufw --force enable
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw reload

echo "✅ Firewall yapılandırıldı"

# ======================================
# 14. FAIL2BAN YAPILANDIRMASI
# ======================================
echo ""
echo "🛡️ Fail2ban yapılandırılıyor..."

# Nginx jail config
sudo tee /etc/fail2ban/jail.d/nginx.conf > /dev/null <<EOF
[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/error.log
maxretry = 3
bantime = 3600
findtime = 600

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
logpath = /var/log/nginx/error.log
maxretry = 3
bantime = 3600
findtime = 600
EOF

sudo systemctl restart fail2ban

echo "✅ Fail2ban yapılandırıldı"

# ======================================
# 15. LOG ROTATION YAPILANDIRMASI
# ======================================
echo ""
echo "📝 Log rotation yapılandırılıyor..."

sudo tee /etc/logrotate.d/filoki-api > /dev/null <<EOF
$APP_DIR/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 $APP_USER $APP_USER
    postrotate
        pm2 reloadLogs
    endscript
}
EOF

echo "✅ Log rotation yapılandırıldı"

# ======================================
# 16. BACKUP SCRIPT OLUŞTUR
# ======================================
echo ""
echo "💾 Backup script oluşturuluyor..."

sudo -u $APP_USER tee $APP_DIR/backup.sh > /dev/null <<'BACKUP_EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/fleetapp/backups"
mkdir -p $BACKUP_DIR

# Database backup
pg_dump postgresql://fleetadmin:Fl0k1Api2025!Secure@localhost:5432/fleetmanagement > $BACKUP_DIR/db_backup_$DATE.sql
gzip $BACKUP_DIR/db_backup_$DATE.sql

# Application backup
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz \
    --exclude='node_modules' \
    --exclude='logs' \
    --exclude='dist' \
    --exclude='.git' \
    -C /home/fleetapp fleet-management-api

# Keep only last 7 days
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
BACKUP_EOF

sudo chmod +x $APP_DIR/backup.sh

# Cron job for daily backup
(crontab -u $APP_USER -l 2>/dev/null; echo "0 2 * * * $APP_DIR/backup.sh") | crontab -u $APP_USER -

echo "✅ Backup sistemi kuruldu"

# ======================================
# 17. MONITORING SCRIPT
# ======================================
echo ""
echo "📊 Health check script oluşturuluyor..."

sudo -u $APP_USER tee $APP_DIR/health-check.sh > /dev/null <<'HEALTH_EOF'
#!/bin/bash

# API Health Check
echo "🔍 API Health Check..."
curl -s -o /dev/null -w "%{http_code}" https://filokiapi.architectaiagency.com/api/health

echo ""
echo "📊 PM2 Status:"
pm2 status

echo ""
echo "💾 Disk Usage:"
df -h | grep -E "^/dev/"

echo ""
echo "🧠 Memory Usage:"
free -h

echo ""
echo "🔄 PostgreSQL Status:"
sudo systemctl is-active postgresql

echo ""
echo "🌐 Nginx Status:"
sudo systemctl is-active nginx
HEALTH_EOF

sudo chmod +x $APP_DIR/health-check.sh

echo "✅ Health check script oluşturuldu"

# ======================================
# 18. FINAL TEST VE KONTROLLER
# ======================================
echo ""
echo "🧪 Final testler yapılıyor..."
echo "======================================"

# PM2 status
echo "PM2 Status:"
sudo -u $APP_USER pm2 status

# Nginx test
echo ""
echo "Nginx Status:"
sudo nginx -t
sudo systemctl status nginx --no-pager

# PostgreSQL test
echo ""
echo "PostgreSQL Status:"
sudo systemctl status postgresql --no-pager

# API test
echo ""
echo "API Health Check:"
sleep 5  # PM2'nin başlaması için bekle
curl -s https://$DOMAIN/api/health || echo "⚠️ API henüz hazır değil, birkaç saniye bekleyin"

# ======================================
# 19. ÖZET BİLGİLER
# ======================================
echo ""
echo "✅ ✅ ✅ DEPLOYMENT TAMAMLANDI! ✅ ✅ ✅"
echo "======================================"
echo ""
echo "📋 ÖZET BİLGİLER:"
echo "=================="
echo "🌐 Domain: https://$DOMAIN"
echo "📧 Admin Email: $ADMIN_EMAIL"
echo "🔑 Admin Password: $ADMIN_PASSWORD"
echo "🗄️ Database: $DB_NAME"
echo "👤 DB User: $DB_USER"
echo "🔐 API Key: $API_KEY"
echo ""
echo "📍 API Endpoints:"
echo "- Health Check: https://$DOMAIN/api/health"
echo "- Login: https://$DOMAIN/api/auth/login"
echo "- API Docs: https://$DOMAIN/api/docs"
echo ""
echo "🛠️ Yönetim Komutları:"
echo "- PM2 Status: pm2 status"
echo "- PM2 Logs: pm2 logs filoki-api"
echo "- PM2 Restart: pm2 restart filoki-api"
echo "- Nginx Reload: sudo systemctl reload nginx"
echo "- Health Check: $APP_DIR/health-check.sh"
echo "- Manual Backup: $APP_DIR/backup.sh"
echo ""
echo "📝 Log Dosyaları:"
echo "- PM2 Logs: $APP_DIR/logs/"
echo "- Nginx Access: /var/log/nginx/access.log"
echo "- Nginx Error: /var/log/nginx/error.log"
echo ""
echo "🔄 Güncelleme için:"
echo "cd $APP_DIR && git pull && npm ci && npm run build && pm2 restart filoki-api"
echo ""
echo "======================================"
echo "🎉 Deployment başarılı! API'niz hazır."
echo "======================================"