# DMS POST API - Döküman Ekleme

## Endpoint
```
POST /documents
```

## Kimlik Doğrulama
**JWT Token Gerekli:** `Authorization: Bearer TOKEN`

## İstek Formatı

### Headers
```http
POST /documents HTTP/1.1
Host: localhost:5000
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Request Body
```json
{
  "entityType": "personnel",
  "entityId": 1,
  "docTypeId": 5,
  "title": "Kimlik Fotokopisi",
  "description": "Personel kimlik belgesi fotokopisi",
  "filePath": "/uploads/documents/2025/08/kimlik_123.pdf",
  "fileName": "kimlik_123.pdf",
  "fileSize": 2048576,
  "mimeType": "application/pdf",
  "fileHash": "a1b2c3d4e5f6...",
  "validityStartDate": "2025-01-01",
  "validityEndDate": "2025-12-31"
}
```

## Alan Açıklamaları

### Zorunlu Alanlar
- **entityType**: `"personnel"` | `"asset"` | `"company"` | `"work_area"`
- **entityId**: integer (varlık ID'si)
- **docTypeId**: integer (alt döküman tipi ID'si)
- **title**: string (1-255 karakter)
- **filePath**: string (dosya yolu)
- **fileName**: string (1-255 karakter)

### İsteğe Bağlı Alanlar
- **description**: text (açıklama)
- **fileSize**: integer (byte cinsinden)
- **mimeType**: string (MIME tipi)
- **fileHash**: string (SHA256, maksimum 64 karakter)
- **validityStartDate**: date (YYYY-MM-DD)
- **validityEndDate**: date (YYYY-MM-DD)

## Başarılı Cevap (201 Created)

```json
{
  "success": true,
  "data": {
    "id": 123,
    "entityType": "personnel",
    "entityId": 1,
    "docTypeId": 5,
    "title": "Kimlik Fotokopisi",
    "description": "Personel kimlik belgesi fotokopisi",
    "filePath": "/uploads/documents/2025/08/kimlik_123.pdf",
    "fileName": "kimlik_123.pdf",
    "fileSize": 2048576,
    "mimeType": "application/pdf",
    "fileHash": "a1b2c3d4e5f6...",
    "uploadedBy": 1,
    "uploadDate": "2025-08-09T19:35:00.000Z",
    "validityStartDate": "2025-01-01",
    "validityEndDate": "2025-12-31",
    "isActive": true,
    "createdAt": "2025-08-09T19:35:00.000Z",
    "updatedAt": "2025-08-09T19:35:00.000Z"
  },
  "message": "Döküman başarıyla eklendi"
}
```

## Hata Cevapları

### 400 - Geçersiz Veri (Validation Error)
```json
{
  "success": false,
  "error": "Geçersiz veri",
  "details": [
    {
      "code": "too_small",
      "minimum": 1,
      "type": "string",
      "inclusive": true,
      "exact": false,
      "message": "String must contain at least 1 character(s)",
      "path": ["title"]
    }
  ]
}
```

### 400 - Entity Bulunamadı
```json
{
  "success": false,
  "error": "personnel entity bulunamadı"
}
```

### 400 - Duplicate Dosya
```json
{
  "success": false,
  "error": "Bu dosya zaten yüklenmiş"
}
```

### 401 - Kimlik Doğrulama Hatası
```json
{
  "success": false,
  "error": "NO_TOKEN",
  "message": "Erişim token'ı gerekli. Authorization header'ında Bearer token gönderin."
}
```

### 403 - Yetki Hatası
```json
{
  "success": false,
  "error": "INSUFFICIENT_PERMISSIONS",
  "message": "Bu işlem için yetkiniz yok."
}
```

### 500 - Sunucu Hatası
```json
{
  "success": false,
  "error": "Döküman eklenirken hata oluştu"
}
```

## Örnek cURL Komutları

### Temel Döküman Ekleme
```bash
curl -X POST "http://localhost:5000/documents" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "entityType": "personnel",
    "entityId": 1,
    "docTypeId": 5,
    "title": "Kimlik Fotokopisi",
    "filePath": "/uploads/documents/kimlik.pdf",
    "fileName": "kimlik.pdf"
  }'
```

### Detaylı Döküman Ekleme
```bash
curl -X POST "http://localhost:5000/documents" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "entityType": "asset",
    "entityId": 1,
    "docTypeId": 45,
    "title": "Araç Ruhsatı",
    "description": "06ABC123 plakalı araç ruhsat belgesi",
    "filePath": "/uploads/vehicles/ruhsat_06ABC123.pdf",
    "fileName": "ruhsat_06ABC123.pdf",
    "fileSize": 1024000,
    "mimeType": "application/pdf",
    "fileHash": "sha256hash...",
    "validityStartDate": "2025-01-01",
    "validityEndDate": "2030-01-01"
  }'
```

## Önemli Notlar

1. **Entity Kontrolü**: Belirtilen entityType ve entityId'nin veritabanında mevcut olması gerekir
2. **Duplicate Kontrolü**: fileHash verilirse, aynı hash'e sahip dosya eklenemez
3. **Audit Trail**: Tüm işlemler audit log'larına kaydedilir
4. **uploadedBy**: JWT token'dan otomatik alınır
5. **docTypeId**: Alt döküman tipi ID'si olmalıdır (1-107 arası)

## Entity Type Değerleri
- `personnel`: Personel dökümanları
- `asset`: Varlık/araç dökümanları  
- `company`: Şirket dökümanları
- `work_area`: Çalışma alanı dökümanları