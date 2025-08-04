#!/bin/bash

echo "=== Nginx API Yönlendirme Düzeltmesi ==="
echo ""

# Nginx config dosyasını kontrol et
NGINX_CONFIG="/etc/nginx/sites-available/filokiapi"

echo "Mevcut Nginx config'i kontrol ediliyor..."
if [ -f "$NGINX_CONFIG" ]; then
    echo "Config dosyası bulundu: $NGINX_CONFIG"
    
    # API location bloğu var mı kontrol et
    if grep -q "location /api" "$NGINX_CONFIG"; then
        echo "API location bloğu mevcut."
    else
        echo "API location bloğu eksik! Düzeltiliyor..."
        
        # Yedek al
        cp "$NGINX_CONFIG" "$NGINX_CONFIG.backup"
        
        # API location bloğunu ekle
        cat > /tmp/nginx-api-fix.conf << 'EOF'
server {
    listen 443 ssl;
    server_name filokiapi.architectaiagency.com;

    ssl_certificate /etc/letsencrypt/live/filokiapi.architectaiagency.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/filokiapi.architectaiagency.com/privkey.pem;

    # API isteklerini backend'e yönlendir
    location /api {
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

    # Frontend static dosyaları
    location / {
        root /home/root/FiloAPIapp/dist/client;
        try_files $uri $uri/ /index.html;
    }
}

server {
    listen 80;
    server_name filokiapi.architectaiagency.com;
    return 301 https://$server_name$request_uri;
}
EOF
        
        echo "Yeni config uygulanıyor..."
        cp /tmp/nginx-api-fix.conf "$NGINX_CONFIG"
    fi
    
    # Nginx config test
    nginx -t
    
    # Nginx reload
    systemctl reload nginx
    
    echo ""
    echo "Nginx düzeltildi. API testi yapılıyor..."
    sleep 2
    
    # Test
    curl -s https://filokiapi.architectaiagency.com/api/health | jq .
    
else
    echo "HATA: Nginx config dosyası bulunamadı!"
    echo "Manuel olarak oluşturmanız gerekiyor."
fi

echo ""
echo "=== İşlem Tamamlandı ===
"