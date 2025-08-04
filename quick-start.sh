#!/bin/bash
# Hızlı PM2 Başlatma Script'i

cd /home/root/FiloAPIapp

# PM2'yi temizle ve yeniden başlat
pm2 delete all 2>/dev/null

# Yeni ecosystem.config.cjs oluştur (düzeltilmiş path ile)
cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [{
    name: 'filoki-api',
    script: './dist/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

# Log dizini oluştur
mkdir -p logs

# PM2 ile başlat
pm2 start ecosystem.config.cjs

# Durumu göster
pm2 status

# Kaydet ve startup ayarla
pm2 save
pm2 startup systemd -u root --hp /root

echo ""
echo "PM2 başlatıldı! Logları görmek için: pm2 logs"
echo "API testi için: curl http://localhost:5000/api/health"