#!/bin/bash

# Production Deploy Script for Filoki API
# Production sunucusunda çalıştırılacak

set -e  # Hata durumunda script'i durdur

echo "================================================"
echo "Filoki API Production Deploy"
echo "================================================"
echo ""

# Renkli çıktılar için
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

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

# 1. GitHub'dan çek
log "GitHub'dan son değişiklikler çekiliyor..."
git pull origin main || git pull origin master || error "Git pull başarısız!"

# 2. Dependencies'leri yükle
log "Dependencies yükleniyor..."
npm install --production

# 3. TypeScript build
log "Uygulama build ediliyor..."
npm run build || error "Build başarısız!"

# 4. PM2 process'ini yeniden başlat
log "PM2 process yeniden başlatılıyor..."
pm2 restart filoki-api || error "PM2 restart başarısız!"

# 5. Health check
log "Uygulama health check yapılıyor..."
sleep 5  # Uygulamanın başlaması için bekle

HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health)
if [ "$HEALTH_CHECK" = "200" ]; then
    log "Health check başarılı! ✓"
else
    error "Health check başarısız! HTTP kod: $HEALTH_CHECK"
fi

# 6. Domain kontrolü
log "Domain erişimi kontrol ediliyor..."
DOMAIN_CHECK=$(curl -s -o /dev/null -w "%{http_code}" https://filokiapi.architectaiagency.com/api/health)
if [ "$DOMAIN_CHECK" = "200" ]; then
    log "Domain erişimi başarılı! ✓"
else
    warning "Domain erişimi başarısız! HTTP kod: $DOMAIN_CHECK"
fi

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
log "Deploy tamamlandı!"