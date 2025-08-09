# API İstek ve Cevap Formatları

## 1. Ana Döküman Tiplerini Getir

### İstek
```http
GET /documents/main-doc-types HTTP/1.1
Host: localhost:5000
Content-Type: application/json
```

**Query Parametreleri:**
- `isActive` (isteğe bağlı): "true" | "false" (varsayılan: "true")

**Örnek İstek:**
```bash
curl -X GET "http://localhost:5000/documents/main-doc-types?isActive=true"
```

### Cevap
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "İnsan Kaynakları",
      "isActive": true
    },
    {
      "id": 2,
      "name": "Finans",
      "isActive": true
    },
    {
      "id": 3,
      "name": "Sigorta",
      "isActive": true
    },
    {
      "id": 4,
      "name": "Filo",
      "isActive": true
    },
    {
      "id": 5,
      "name": "Diğer",
      "isActive": true
    }
  ],
  "message": "Ana döküman tipleri başarıyla getirildi"
}
```

## 2. Alt Döküman Tiplerini Getir (Kimlik Doğrulama Gerektirmez)

### İstek
```http
GET /documents/types/{mainTypeId} HTTP/1.1
Host: localhost:5000
Content-Type: application/json
```

**Path Parametreleri:**
- `mainTypeId`: Ana döküman tipi ID'si (1-5 arası)

**Query Parametreleri:**
- `isActive` (isteğe bağlı): "true" | "false" (varsayılan: "true")

**Örnek İstek:**
```bash
curl -X GET "http://localhost:5000/documents/types/1?isActive=true"
```

### Cevap
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "İşe Giriş Bildirgesi",
      "mainTypeId": 1,
      "isActive": true
    },
    {
      "id": 2,
      "name": "İşten Çıkış Bildirgesi",
      "mainTypeId": 1,
      "isActive": true
    },
    {
      "id": 3,
      "name": "İstifa Belgesi",
      "mainTypeId": 1,
      "isActive": true
    }
  ],
  "message": "Alt döküman tipleri başarıyla getirildi"
}
```

## 3. Giriş Yapma (Authentication)

### İstek
```http
POST /api/auth/login HTTP/1.1
Host: localhost:5000
Content-Type: application/json

{
  "email": "alper.acar@architectaiagency.com",
  "password": "Acar"
}
```

### Cevap
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "alper.acar@architectaiagency.com",
      "name": "Alper",
      "surname": "Acar"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Giriş başarılı"
}
```

## 4. Personel Çalışma Alanı Atama

### İstek
```http
POST /api/personnel/addPersonnelWorkArea HTTP/1.1
Host: localhost:5000
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "personnelId": 1,
  "workAreaId": 1,
  "startDate": "2025-01-01",
  "endDate": "2025-12-31"
}
```

### Cevap
```json
{
  "success": true,
  "data": {
    "id": 1,
    "personnelId": 1,
    "workAreaId": 1,
    "startDate": "2025-01-01T00:00:00.000Z",
    "endDate": "2025-12-31T00:00:00.000Z",
    "isActive": true
  },
  "message": "Personel çalışma alanı başarıyla atandı"
}
```

## 5. Şehirleri Getir

### İstek
```http
GET /api/getCities HTTP/1.1
Host: localhost:5000
X-API-Key: filoki-api-master-key-2025
```

### Cevap
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Adana",
      "plateCode": "01"
    },
    {
      "id": 2,
      "name": "Adıyaman",
      "plateCode": "02"
    }
  ]
}
```

## 6. Sistem Sağlık Kontrolü

### İstek
```http
GET /api/health HTTP/1.1
Host: localhost:5000
```

### Cevap
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-08-09T19:25:00.000Z",
  "version": "1.0.0"
}
```

## Hata Formatları

### 401 Unauthorized
```json
{
  "success": false,
  "error": "NO_TOKEN",
  "message": "Erişim token'ı gerekli. Authorization header'ında Bearer token gönderin."
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "INSUFFICIENT_PERMISSIONS",
  "message": "Bu işlem için yetkiniz yok."
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "NOT_FOUND",
  "message": "Kaynak bulunamadı"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "INTERNAL_ERROR",
  "message": "Sunucu hatası oluştu"
}
```

## Header Gereksinimleri

### JWT Token Gerekli Endpoint'ler
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### API Key Gerekli Endpoint'ler
```http
X-API-Key: filoki-api-master-key-2025
```

### Standart Header'lar
```http
Content-Type: application/json
Accept: application/json
```