#!/bin/bash

# Deploy Script for Filoki API
# Bu script GitHub'dan son kodu çeker ve siteyi günceller

set -e  # Hata durumunda script'i durdur

echo "================================================"
echo "Filoki API Deployment Script"
echo "================================================"
echo ""

# Renkli çıktılar için
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Çalışma dizini
APP_DIR="/home/root/FiloAPIapp"
GITHUB_REPO="https://github.com/AlperAcarAI/FiloAPIapp.git"

# Log fonksiyonu
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Dizin kontrolü
if [ ! -d "$APP_DIR" ]; then
    error "Uygulama dizini bulunamadı: $APP_DIR"
fi

cd "$APP_DIR" || error "Dizine geçilemedi: $APP_DIR"

# 1. Git durumunu kontrol et
log "Git durumu kontrol ediliyor..."
if [ -d ".git" ]; then
    # Yerel değişiklikleri kontrol et
    if ! git diff --quiet || ! git diff --staged --quiet; then
        warning "Yerel değişiklikler tespit edildi!"
        echo "Devam etmek istiyor musunuz? (y/n)"
        read -r response
        if [ "$response" != "y" ]; then
            error "Deploy iptal edildi."
        fi
        
        # Yerel değişiklikleri stash'le
        log "Yerel değişiklikler saklanıyor..."
        git stash push -m "Auto-stash before deploy $(date)"
    fi
    
    # GitHub'dan çek
    log "GitHub'dan son değişiklikler çekiliyor..."
    git fetch origin
    git pull origin main || git pull origin master || error "Git pull başarısız!"
else
    error "Git repository bulunamadı. Manuel olarak klonlayın: git clone $GITHUB_REPO"
fi

# 2. .env dosyasını kontrol et
if [ ! -f ".env" ]; then
    error ".env dosyası bulunamadı! Production ayarlarını yapılandırın."
fi

# 3. Dependencies'leri yükle
log "Dependencies yükleniyor..."
npm install --production

# 4. TypeScript build
log "Uygulama build ediliyor..."
npm run build || error "Build başarısız!"

# 5. Database migration (eğer varsa)
if [ -f "drizzle.config.ts" ]; then
    log "Database schema push ediliyor..."
    npm run db:push || warning "Database push başarısız (devam ediliyor)"
fi

# 6. PM2 process'ini yeniden başlat
log "PM2 process yeniden başlatılıyor..."
if pm2 list | grep -q "filoki-api"; then
    pm2 restart filoki-api
else
    # İlk defa başlatma
    pm2 start dist/index.js --name filoki-api \
        --node-args="-r dotenv/config" \
        --max-memory-restart 500M \
        --error logs/error.log \
        --output logs/out.log
fi

# PM2 startup ayarı
pm2 save
pm2 startup systemd -u root --hp /root || true

# 7. Nginx'i kontrol et
log "Nginx konfigürasyonu kontrol ediliyor..."
nginx -t || error "Nginx konfigürasyonu hatalı!"

# Nginx'i reload et
log "Nginx yeniden yükleniyor..."
systemctl reload nginx || error "Nginx reload başarısız!"

# 8. Health check
log "Uygulama health check yapılıyor..."
sleep 5  # Uygulamanın başlaması için bekle

HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health)
if [ "$HEALTH_CHECK" = "200" ]; then
    log "Health check başarılı! ✓"
else
    error "Health check başarısız! HTTP kod: $HEALTH_CHECK"
fi

# 9. Domain kontrolü
log "Domain erişimi kontrol ediliyor..."
DOMAIN_CHECK=$(curl -s -o /dev/null -w "%{http_code}" https://filokiapi.architectaiagency.com/api/health)
if [ "$DOMAIN_CHECK" = "200" ]; then
    log "Domain erişimi başarılı! ✓"
else
    warning "Domain erişimi başarısız! HTTP kod: $DOMAIN_CHECK"
fi

# 10. Son durum
echo ""
echo "================================================"
echo -e "${GREEN}Deploy başarıyla tamamlandı!${NC}"
echo "================================================"
echo ""
echo "Uygulama bilgileri:"
echo "- Local: http://localhost:5000"
echo "- Domain: https://filokiapi.architectaiagency.com"
echo "- API Key: filoki-api-master-key-2025"
echo ""

# PM2 durumu
pm2 status filoki-api

echo ""
echo "Son loglar:"
pm2 logs filoki-api --lines 10 --nostream

echo ""
log "Deploy tamamlandı!"