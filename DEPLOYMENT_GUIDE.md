# Filoki API Deployment Rehberi

## Hızlı Başlangıç

GitHub'dan son kodu çekip deploy etmek için:

```bash
./deploy.sh
```

## Deploy Script Özellikleri

`deploy.sh` script'i aşağıdaki işlemleri otomatik yapar:

1. **Git Kontrolü**: Yerel değişiklikleri kontrol eder ve saklar
2. **GitHub Senkronizasyonu**: Son kodu çeker
3. **Dependencies**: NPM paketlerini yükler
4. **Build**: TypeScript kodunu derler
5. **Database**: Schema değişikliklerini uygular
6. **PM2**: Uygulamayı yeniden başlatır
7. **Nginx**: Config'i kontrol edip reload eder
8. **Health Check**: Uygulamanın çalıştığını doğrular

## Manuel Deploy Adımları

Eğer script çalışmazsa veya manuel deploy tercih ederseniz:

```bash
# 1. Proje dizinine git
cd /home/root/FiloAPIapp

# 2. GitHub'dan çek
git pull origin main

# 3. Dependencies yükle
npm install

# 4. Build et
npm run build

# 5. Database schema'yı güncelle
npm run db:push

# 6. PM2'yi yeniden başlat
pm2 restart filoki-api

# 7. Nginx'i reload et
systemctl reload nginx
```

## Production Bilgileri

- **Domain**: https://filokiapi.architectaiagency.com
- **API Key**: filoki-api-master-key-2025
- **Admin Login**: alper.acar@architectaiagency.com / Acar
- **Database**: PostgreSQL (filoki_db)

## PM2 Komutları

```bash
# Durum kontrolü
pm2 status

# Logları görüntüle
pm2 logs filoki-api

# Yeniden başlat
pm2 restart filoki-api

# Durdur
pm2 stop filoki-api

# Başlat
pm2 start filoki-api
```

## Sorun Giderme

### 1. Port 5000 Kullanımda
```bash
# Port'u kullanan process'i bul
lsof -i :5000

# PM2'yi tamamen durdur ve başlat
pm2 kill
pm2 start ecosystem.config.js
```

### 2. Database Bağlantı Hatası
```bash
# .env dosyasını kontrol et
cat .env | grep DATABASE_URL

# Database erişimini test et
psql -U postgres -d filoki_db -c "SELECT 1;"
```

### 3. Nginx Hatası
```bash
# Config'i test et
nginx -t

# Error log'u kontrol et
tail -f /var/log/nginx/error.log
```

### 4. SSL Sertifika Yenileme
```bash
# Certbot ile otomatik yenile
certbot renew --nginx
```

## Güvenlik Notları

1. `.env` dosyası production secrets içerir, paylaşmayın
2. API key'i güvenli tutun
3. Database credential'larını düzenli değiştirin
4. PM2 log dosyalarını düzenli temizleyin:
   ```bash
   pm2 flush
   ```

## Yedekleme

Database yedeği almak için:
```bash
pg_dump -U postgres filoki_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

## Monitoring

Uygulama durumunu kontrol etmek için:
```bash
# Health endpoint
curl https://filokiapi.architectaiagency.com/api/health

# PM2 monitoring
pm2 monit
```