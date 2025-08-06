#!/bin/bash

echo "🚀 Production deployment başlatılıyor..."

# Git değişikliklerini commit et ve push et
git add .
git commit -m "Fix: PostgreSQL connection - Switch from Neon to pg driver for production"
git push origin main

# Sunucuya bağlan ve güncelle
ssh root@filokiapi.architectaiagency.com << 'EOF'
set -e

echo "📦 Production update başlatılıyor..."

cd /var/www/filokiapi/FiloAPIapp

# Git pull
git pull origin main

# Dependencies güncelle (pg package eklenmiş olabilir)
npm install

# Build yap
npm run build

# PM2 restart
pm2 restart filokiapi

echo "✅ Production güncellemesi tamamlandı"

# Test et
sleep 3
curl -s https://filokiapi.architectaiagency.com/api/getCities \
  -H "X-API-Key: filoki-api-master-key-2025" \
  -H "Accept: application/json" | head -100

echo ""
echo "📊 PM2 status:"
pm2 status

EOF

echo "🎯 Deployment tamamlandı!"