#!/bin/bash
# PM2 Environment Fix Script

cd /home/root/FiloAPIapp

# 1. .env dosyasının varlığını kontrol et
if [ ! -f .env ]; then
    echo "HATA: .env dosyası bulunamadı!"
    exit 1
fi

echo "✓ .env dosyası mevcut"

# 2. PM2'yi durdur
pm2 delete all

# 3. Yeni ecosystem.config.cjs oluştur (dotenv desteği ile)
cat > ecosystem.config.cjs << 'EOF'
const path = require('path');
const dotenv = require('dotenv');

// .env dosyasını yükle
dotenv.config({ path: path.join(__dirname, '.env') });

module.exports = {
  apps: [{
    name: 'filoki-api',
    script: './dist/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      ...process.env,  // Tüm env değişkenlerini al
      NODE_ENV: 'production',
      PORT: process.env.PORT || 5000
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

# 4. dotenv kurulu mu kontrol et
if ! npm list dotenv >/dev/null 2>&1; then
    echo "dotenv kuruluyor..."
    npm install dotenv
fi

# 5. PM2'yi başlat
pm2 start ecosystem.config.cjs

# 6. Durumu kontrol et
sleep 2
pm2 status
pm2 logs --lines 10

# 7. API testi
echo ""
echo "API Testi yapılıyor..."
sleep 3
curl -s http://localhost:5000/api/health | jq . || echo "API henüz hazır değil"

echo ""
echo "✓ PM2 yeniden başlatıldı!"
echo "Logları görmek için: pm2 logs"
echo "Durumu kontrol için: pm2 status"