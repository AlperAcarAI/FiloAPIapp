# Production Deployment Fix - Kesinti İşlemleri Schema Düzeltmesi

## 🔴 Sorun
Schema.ts'de `projectId` field'ı kaldırıldı ancak ilişkili relation tanımı kaldırılmamış, bu da Drizzle ORM'in crash olmasına neden oldu.

## ✅ Düzeltmeler
1. ✅ `foOutageProcessRelations` içinde `project` relation kaldırıldı
2. ✅ `pyp` relation eklendi (pypId için)
3. ✅ Routes dosyasında `projects` import ve JOIN'leri kaldırıldı
4. ✅ Gereksiz `projectId` referansları temizlendi

---

## 📦 Production'a Deploy Etme Adımları

### 1️⃣ Production Sunucuya Bağlanın
```bash
ssh root@your-server-ip
# veya
ssh user@filokiapi.architectaiagency.com
```

### 2️⃣ Proje Dizinine Gidin
```bash
cd /var/www/filokiapi/FiloAPIapp
```

### 3️⃣ Git ile Güncel Kodu Çekin
```bash
# Mevcut değişiklikleri kaydet (gerekirse)
git stash

# Ana branch'ten çek
git pull origin main

# Veya belirli bir commit
git fetch origin
git reset --hard origin/main
```

### 4️⃣ Dependencies Kontrol/Güncelle
```bash
# Gerekirse
npm install
```

### 5️⃣ Build Edin
```bash
npm run build
```

### 6️⃣ Uygulamayı Yeniden Başlatın
```bash
# PM2 ile
pm2 restart filokiapi

# Veya hepsini
pm2 restart all

# Log'ları izleyin
pm2 logs filokiapi --lines 50
```

### 7️⃣ Kontrol Edin
```bash
# Backend health check
curl http://localhost:5001/api/getCities

# Login test
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@filoki.com","password":"@carAcar54"}'
```

---

## 🧪 Lokal Test (Opsiyonel)

Önce lokal olarak test edip sonra production'a deploy edebilirsiniz:

```bash
# Development mode
npm run dev

# Yeni terminal'de test
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

---

## ✅ Başarı Kriterleri

Deploy sonrası şunları kontrol edin:

1. ✅ PM2 status: `online` olmalı
```bash
pm2 status
```

2. ✅ Log'larda hata yok
```bash
pm2 logs filokiapi --lines 30 --nostream
```

3. ✅ Login çalışıyor
```bash
curl -X POST https://filokiapi.architectaiagency.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'
```

4. ✅ Frontend'den erişilebiliyor
```
https://filokiapi.architectaiagency.com
```

---

## 🚨 Sorun Devam Ederse

### PM2 Log'larına Bakın
```bash
# Error log
pm2 logs filokiapi --err --lines 50

# Tüm log
pm2 logs filokiapi --lines 100
```

### Nginx Log'larına Bakın
```bash
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

### Hard Restart
```bash
pm2 delete filokiapi
pm2 start <your-start-script>
```

---

## 📋 Düzeltilen Dosyalar

1. **shared/schema.ts**
   - `projectId` field kaldırıldı
   - `project` relation kaldırıldı
   - `pyp` relation eklendi
   - `coordinatX` ve `coordinatY` eklendi

2. **server/outage-process-routes.ts**
   - `projects` import kaldırıldı
   - `projectId` JOIN ve SELECT'leri kaldırıldı
   - Query parametresi `pypId` olarak güncellendi
   - Validation kodları sadeleştirildi

---

## 🎯 Sonuç

Bu düzeltmeler sonrası:
- ✅ Backend başarıyla başlayacak
- ✅ 502 Bad Gateway hatası çözülecek
- ✅ Login endpoint çalışacak
- ✅ Tüm API endpoint'leri erişilebilir olacak
