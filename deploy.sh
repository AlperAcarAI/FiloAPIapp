#!/bin/bash

echo "🚀 Deploy başlatılıyor..."
echo "Git İşlemleri başlıyor"
# En son commitleri çek
git pull origin main
echo "Git işlemleri tamalandı. npm işlemleri başlıyor.."
# Build al
npm run build
echo "npm işlemleri tamamlandı. süreçler yeniden başlatılıyor"
# PM2 restart
pm2 restart all

echo "✅ Deploy tamamlandı!"
