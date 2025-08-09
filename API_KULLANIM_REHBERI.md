# API Kullanım Rehberi

## Genel Bilgiler

Sistem iki farklı authentication yöntemi kullanır:
- **JWT Token**: Kullanıcı girişi ve korumalı endpoint'ler için
- **API Key**: Bazı endpoint'ler için (filoki-api-master-key-2025)

## 1. Authentication API'leri

### Giriş Yapma
```bash
curl -X POST "http://localhost:5000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alper.acar@architectaiagency.com",
    "password": "Acar"
  }'
```

**Yanıt:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "alper.acar@architectaiagency.com",
      "name": "Alper"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## 2. Dokuman Yönetimi API'leri

### Ana Dokuman Tiplerini Getir (Kimlik Doğrulama Gerektirmez)
```bash
curl -X GET "http://localhost:5000/documents/main-doc-types"
```

**Yanıt:**
```json
{
  "success": true,
  "data": [
    {"id": 1, "name": "İnsan Kaynakları", "isActive": true},
    {"id": 2, "name": "Finans", "isActive": true},
    {"id": 3, "name": "Sigorta", "isActive": true},
    {"id": 4, "name": "Filo", "isActive": true},
    {"id": 5, "name": "Diğer", "isActive": true}
  ]
}
```

### Alt Dokuman Tiplerini Getir (Mock Auth)
```bash
curl -X GET "http://localhost:5000/documents/types/1"
```

**Yanıt:** İnsan Kaynakları kategorisindeki 26 alt tip (İşe Giriş Bildirgesi, İş Sözleşmesi, vb.)

## 3. Personnel API'leri

### Personel Çalışma Alanı Atama (JWT Required)
```bash
curl -X POST "http://localhost:5000/api/personnel/addPersonnelWorkArea" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "personnelId": 1,
    "workAreaId": 1,
    "startDate": "2025-01-01"
  }'
```

## 4. Şehir Bilgileri API (API Key Required)

### Türk Şehirlerini Getir
```bash
curl -X GET "http://localhost:5000/api/getCities" \
  -H "X-API-Key: filoki-api-master-key-2025"
```

## 5. Proxy API'leri

### Güvenli Proxy Erişimi (JWT Required)
```bash
curl -X GET "http://localhost:5000/api/proxy/secure/getApiClients" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 6. Health Check

### Sistem Sağlık Kontrolü
```bash
curl -X GET "http://localhost:5000/api/health"
```

## Kullanım Adımları

1. **İlk Giriş:**
   - `/api/auth/login` ile giriş yapın
   - Dönen JWT token'ı saklayın

2. **Korumalı Endpoint'lere Erişim:**
   - `Authorization: Bearer TOKEN` header'ı ekleyin

3. **API Key Gerektiren Endpoint'ler:**
   - `X-API-Key: filoki-api-master-key-2025` header'ı ekleyin

4. **Dokuman İşlemleri:**
   - Önce ana kategorileri getirin
   - Sonra seçilen kategorinin alt tiplerini getirin

## Hata Kodları

- **401**: Yetkisiz erişim (token eksik/geçersiz)
- **403**: Yetkisiz işlem (yetki eksik)
- **404**: Kaynak bulunamadı
- **500**: Sunucu hatası

## Frontend Kullanımı

Dokuman yönetimi sayfasında:
1. Ana kategorilere tıklayın
2. Alt kategoriler otomatik yüklenecek
3. İstediğiniz dokuman tipini seçin

## Production URL'leri

Geliştirme: `http://localhost:5000`
Production: `https://filokiapi.architectaiagency.com`