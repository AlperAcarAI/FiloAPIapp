#!/bin/bash

echo "🔧 Nginx konfigürasyonunu düzeltiliyor..."

# Nginx konfigürasyonunu güncelle - IPv6 yerine IPv4 kullan
cat > /etc/nginx/sites-available/filokiapi << 'EOF'
server {
    server_name filokiapi.architectaiagency.com;

    gzip on;
    gzip_vary on;
    gzip_min_length 1000;
    gzip_types application/javascript application/json text/css text/plain text/xml;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout ayarları
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    client_max_body_size 50M;

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/filokiapi.architectaiagency.com/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/filokiapi.architectaiagency.com/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}

server {
    if ($host = filokiapi.architectaiagency.com) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    listen 80;
    server_name filokiapi.architectaiagency.com;
    return 404; # managed by Certbot
}
EOF

echo "✅ Nginx konfigürasyonu güncellendi"

# Nginx'i test et ve yeniden başlat
nginx -t && systemctl reload nginx

echo "🚀 Nginx yeniden yüklendi"

# PM2'yi yeniden başlat
pm2 restart filokiapi

echo "🎯 Test ediliyor..."
sleep 3

# API test et
curl -s https://filokiapi.architectaiagency.com/api/getCities \
  -H "X-API-Key: filoki-api-master-key-2025" \
  -H "Accept: application/json" | head -20

echo ""
echo "📊 PM2 durumu:"
pm2 status