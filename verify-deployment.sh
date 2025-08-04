#!/bin/bash
# Deployment Kontrol Script'i

# Renkler
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== FilokiAPI Deployment Kontrol ===${NC}"
echo ""

# 1. PM2 Durumu
echo -e "${YELLOW}1. PM2 Uygulama Durumu:${NC}"
pm2 status
echo ""

# 2. Port Kontrolü
echo -e "${YELLOW}2. Port 5000 Dinleniyor mu:${NC}"
sudo netstat -tlnp | grep :5000 || echo "Port 5000 dinlenmiyor!"
echo ""

# 3. Nginx Durumu
echo -e "${YELLOW}3. Nginx Servisi:${NC}"
sudo systemctl status nginx | grep "Active:"
echo ""

# 4. Nginx Konfigürasyonu
echo -e "${YELLOW}4. Nginx Site Konfigürasyonu:${NC}"
ls -la /etc/nginx/sites-enabled/
echo ""

# 5. Nginx Error Log
echo -e "${YELLOW}5. Nginx Son Hatalar:${NC}"
sudo tail -n 10 /var/log/nginx/error.log
echo ""

# 6. Domain DNS Kontrolü
echo -e "${YELLOW}6. Domain DNS Kontrolü:${NC}"
echo -n "Domain adını girin (örn: filokiapi.architectaiagency.com): "
read DOMAIN
if [ ! -z "$DOMAIN" ]; then
    echo "DNS Kayıtları:"
    nslookup $DOMAIN || dig $DOMAIN
fi
echo ""

# 7. Firewall Durumu
echo -e "${YELLOW}7. Firewall Durumu:${NC}"
sudo ufw status numbered 2>/dev/null || echo "UFW kurulu değil"
echo ""

# 8. SSL Sertifika Durumu
echo -e "${YELLOW}8. SSL Sertifikası:${NC}"
if [ ! -z "$DOMAIN" ]; then
    sudo certbot certificates | grep -A 3 "$DOMAIN" || echo "SSL sertifikası bulunamadı"
fi
echo ""

# 9. API Health Check
echo -e "${YELLOW}9. API Health Check:${NC}"
curl -s http://localhost:5000/api/health | jq . || echo "API yanıt vermiyor!"
echo ""

# 10. PM2 Logları
echo -e "${YELLOW}10. PM2 Son Loglar:${NC}"
pm2 logs --lines 10 --nostream
echo ""

# Özet
echo -e "${BLUE}=== ÖZET ===${NC}"
echo ""

# PM2 kontrolü
if pm2 list | grep -q "online"; then
    echo -e "${GREEN}✓ PM2 uygulaması çalışıyor${NC}"
else
    echo -e "${RED}✗ PM2 uygulaması çalışmıyor${NC}"
    echo "  Çözüm: pm2 start ecosystem.config.cjs"
fi

# Port kontrolü
if netstat -tlnp 2>/dev/null | grep -q ":5000"; then
    echo -e "${GREEN}✓ Port 5000 dinleniyor${NC}"
else
    echo -e "${RED}✗ Port 5000 dinlenmiyor${NC}"
    echo "  Çözüm: PM2 loglarını kontrol edin: pm2 logs"
fi

# Nginx kontrolü
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✓ Nginx çalışıyor${NC}"
else
    echo -e "${RED}✗ Nginx çalışmıyor${NC}"
    echo "  Çözüm: sudo systemctl start nginx"
fi

# Site config kontrolü
if [ -f "/etc/nginx/sites-enabled/$DOMAIN" ]; then
    echo -e "${GREEN}✓ Nginx site konfigürasyonu mevcut${NC}"
else
    echo -e "${RED}✗ Nginx site konfigürasyonu eksik${NC}"
    echo "  Çözüm: Nginx konfigürasyonunu kontrol edin"
fi

echo ""
echo -e "${YELLOW}Sorun Giderme:${NC}"
echo "1. PM2 yeniden başlat: pm2 restart all"
echo "2. Nginx yeniden başlat: sudo systemctl restart nginx"
echo "3. Firewall kontrol: sudo ufw allow 80/tcp && sudo ufw allow 443/tcp"
echo "4. DNS propagasyonu bekleyin (15-30 dakika)"
echo ""

# Test URL'leri
if [ ! -z "$DOMAIN" ]; then
    echo -e "${YELLOW}Test URL'leri:${NC}"
    echo "HTTP: http://$DOMAIN"
    echo "HTTPS: https://$DOMAIN"
    echo "API: https://$DOMAIN/api/health"
    echo "Swagger: https://$DOMAIN/api-docs"
fi