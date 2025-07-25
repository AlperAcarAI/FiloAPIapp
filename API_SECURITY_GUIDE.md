# API Güvenlik Organizasyon Sistemi

## 🔐 Güvenlik Mimarisi

API'nize güvenli erişim için kapsamlı bir organizasyon sistemi kuruldu. Bu sistem üç ana katmanda çalışır:

### 1. Kimlik Doğrulama (Authentication)
- **API Key Tabanlı**: `x-api-key` header ile güvenli erişim
- **JWT Token Desteği**: Bearer token ile gelişmiş yetkilendirme
- **Çift Katmanlı Güvenlik**: API Key + Token kombinasyonu

### 2. Yetkilendirme (Authorization)
- **Rol Tabanlı Erişim Kontrolü (RBAC)**
- **Endpoint Bazlı İzinler**
- **Granüler İzin Sistemi**

### 3. İzleme ve Sınırlama
- **Rate Limiting**: Dakika bazlı istek sınırlaması
- **Detaylı Loglama**: Tüm API istekleri kaydedilir
- **Performans İzleme**: Response time takibi

## 🚀 API Client Oluşturma

### Admin Panel Üzerinden
```bash
# JWT token ile giriş yapın
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# Yeni API Client oluşturun
curl -X POST http://localhost:5000/api/admin/clients \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My App Client",
    "companyId": 1,
    "permissions": ["data:read", "data:write", "asset:read"]
  }'
```

### Demo Client Bilgileri
Sistem başlangıcında otomatik olarak oluşturulan demo client:

- **Client Name**: Demo API Client
- **API Key**: `ak_demo2025key`
- **İzinler**: data:read, data:write, asset:read, asset:write, fleet:read

## 🔑 API Anahtarı Kullanımı

### Temel Kullanım
```bash
curl -X GET http://localhost:5000/api/secure/data \
  -H "x-api-key: ak_demo2025key"
```

### Veri Oluşturma
```bash
curl -X POST http://localhost:5000/api/secure/data \
  -H "x-api-key: ak_demo2025key" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Verisi", "description": "API ile oluşturulan veri"}'
```

## 📊 İzin Sistemi

### Mevcut İzinler
1. **data:read** - Temel veri okuma
2. **data:write** - Temel veri yazma
3. **data:delete** - Veri silme
4. **asset:read** - Varlık okuma
5. **asset:write** - Varlık yazma
6. **asset:manage** - Varlık yönetimi
7. **fleet:read** - Filo veri okuma
8. **fleet:write** - Filo veri yazma
9. **admin:read** - Admin veri erişimi
10. **admin:write** - Admin veri yazma
11. **api:manage** - API yönetimi
12. **user:manage** - Kullanıcı yönetimi
13. **analytics:read** - Analitik veriler
14. **reports:generate** - Rapor oluşturma

### Roller ve İzinler
- **admin**: Tüm izinler
- **api_user**: Temel okuma/yazma izinleri
- **readonly**: Sadece okuma izinleri
- **fleet_manager**: Varlık ve filo yönetimi
- **analyst**: Analitik ve rapor izinleri

## 🛡️ Güvenlik Endpoint'leri

### Korumalı Data Endpoint'leri
```bash
# Veri okuma (data:read izni gerekir)
GET /api/secure/data

# Veri yazma (data:write izni gerekir)
POST /api/secure/data

# Admin verileri (admin:read izni gerekir)
GET /api/secure/admin-data
```

### Rate Limiting
- **Genel Endpoint'ler**: 100 istek/dakika
- **Veri Yazma**: 20 istek/dakika
- **Admin Endpoint'leri**: 10 istek/dakika

## 📈 İzleme ve Analitik

### İstatistik Endpoint'leri
```bash
# Genel sistem istatistikleri
GET /api/admin/stats
Authorization: Bearer JWT_TOKEN

# Client özel istatistikleri
GET /api/admin/clients/{id}/stats
Authorization: Bearer JWT_TOKEN
```

### Log Verileri
Her API isteği şu bilgilerle loglanır:
- Client ID ve Kullanıcı ID
- Endpoint ve HTTP metodu
- IP adresi ve User-Agent
- Request body (GET dışında)
- Response status ve süre
- Hata mesajları

## 🔧 Yönetim Endpoint'leri

### Client Yönetimi
```bash
# Tüm client'ları listele
GET /api/admin/clients

# Client detayları
GET /api/admin/clients/{id}

# Yeni API anahtarı oluştur
POST /api/admin/clients/{id}/keys

# Client'a izin ver
POST /api/admin/clients/{id}/permissions
```

### İzin Yönetimi
```bash
# Tüm izinleri listele
GET /api/admin/permissions

# Yeni izin oluştur
POST /api/admin/permissions
```

## 🚨 Hata Kodları

### Authentication Hataları
- **401 API_KEY_MISSING**: API anahtarı eksik
- **401 INVALID_API_KEY_FORMAT**: Geçersiz format
- **401 INVALID_API_KEY**: Geçersiz anahtar
- **403 TOKEN_VERIFICATION_FAILED**: Token doğrulama hatası

### Authorization Hataları
- **401 CLIENT_NOT_AUTHENTICATED**: Client kimliği doğrulanmamış
- **403 INSUFFICIENT_PERMISSIONS**: Yetersiz izin

### Rate Limiting
- **429 RATE_LIMIT_EXCEEDED**: İstek limiti aşıldı

## 💡 En İyi Uygulamalar

### Güvenlik
1. API anahtarlarını güvenli yerde saklayın
2. HTTPS kullanın (production'da)
3. Gereksiz izinler vermeyin
4. Düzenli olarak anahtarları yenileyin

### Performans
1. Rate limiting limitlerini göz önünde bulundurun
2. Gereksiz isteklerden kaçının
3. Response cache'leme kullanın

### İzleme
1. Log verilerini düzenli kontrol edin
2. Anormal aktiviteyi takip edin
3. İstatistikleri analiz edin

## 🔄 Dış Sunucudan Erişim

### Replit Deployment
Uygulamanız `https://[your-repl-name].[your-username].replit.app` adresinde otomatik olarak erişilebilir durumda.

### Örnek Dış Erişim
```javascript
// JavaScript/Node.js örneği
const response = await fetch('https://your-app.replit.app/api/secure/data', {
  headers: {
    'x-api-key': 'ak_demo2025key',
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data);
```

```python
# Python örneği
import requests

response = requests.get(
    'https://your-app.replit.app/api/secure/data',
    headers={'x-api-key': 'ak_demo2025key'}
)

print(response.json())
```

## 📞 Destek

Herhangi bir sorun yaşadığınızda:
1. Log verilerini kontrol edin
2. İzin ayarlarını doğrulayın
3. Rate limiting durumunu kontrol edin
4. API anahtarının geçerliliğini onaylayın

Bu sistem ile API'nize güvenli, ölçeklenebilir ve izlenebilir erişim sağlayabilirsiniz!