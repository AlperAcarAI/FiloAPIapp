# Penalty APIs - Complete Documentation

## ✅ **API Endpoint'leri**

### **1. Penalty Types (Ceza Türleri) API**

#### **GET /api/penalty-types** - Ceza Türlerini Listele
```bash
GET /api/penalty-types
Authorization: Bearer {JWT_TOKEN}

# Filtreleme parametreleri:
?search=hız                 # İsimde arama
?activeOnly=true           # Sadece aktif türler
?sortBy=name              # Sıralama: name, penaltyScore, amountCents
?sortOrder=asc           # asc veya desc
?limit=20&offset=0      # Sayfalama
```

**Response Örneği:**
```json
{
  "success": true,
  "message": "Ceza türleri başarıyla getirildi.",
  "data": {
    "penaltyTypes": [
      {
        "id": 303,
        "name": "Hız Sınırı Aşma",
        "description": "Belirlenen hız sınırını aşma cezası",
        "penaltyScore": 4,
        "amountCents": 23400,
        "discountedAmountCents": 11700,
        "isActive": true,
        "lastDate": "2025-12-31"
      },
      {
        "id": 304,
        "name": "Kırmızı Işık İhlali",
        "description": "Kırmızı ışık ihlali cezası", 
        "penaltyScore": 6,
        "amountCents": 32500,
        "discountedAmountCents": 16250,
        "isActive": true,
        "lastDate": "2025-12-31"
      }
    ],
    "totalCount": 2
  }
}
```

#### **POST /api/penalty-types** - Yeni Ceza Türü Oluştur
```bash
POST /api/penalty-types
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "name": "Emniyet Kemeri Takmama",
  "description": "Emniyet kemeri takmama cezası",
  "penaltyScore": 3,
  "amountCents": 10800,
  "discountedAmountCents": 5400,
  "lastDate": "2025-12-31"
}
```

#### **PUT /api/penalty-types/:id** - Ceza Türü Güncelle
```bash
PUT /api/penalty-types/303
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "amountCents": 25000,
  "discountedAmountCents": 12500
}
```

#### **DELETE /api/penalty-types/:id** - Ceza Türü Sil (Soft Delete)
```bash
DELETE /api/penalty-types/303
Authorization: Bearer {JWT_TOKEN}
```

---

### **2. Penalties (Cezalar) API**

#### **GET /api/penalties** - Cezaları Listele
```bash
GET /api/penalties
Authorization: Bearer {JWT_TOKEN}

# Filtreleme parametreleri:
?assetId=14               # Belirli araç
?driverId=5              # Belirli sürücü
?penaltyTypeId=303       # Belirli ceza türü
?status=beklemede        # Ceza durumu
?startDate=2025-08-01    # Başlangıç tarihi
?endDate=2025-08-31      # Bitiş tarihi
?activeOnly=true         # Sadece aktif cezalar
?sortBy=penaltyDate      # Sıralama: penaltyDate, amountCents
?sortOrder=desc          # asc veya desc
?limit=20&offset=0       # Sayfalama
```

**Response Örneği:**
```json
{
  "success": true,
  "message": "Cezalar başarıyla getirildi.",
  "data": {
    "penalties": [
      {
        "id": 1,
        "assetId": 14,
        "driverId": null,
        "penaltyTypeId": 303,
        "amountCents": 23400,
        "discountedAmountCents": 11700,
        "penaltyDate": "2025-08-15",
        "lastDate": "2025-09-15",
        "status": "beklemede",
        "isActive": true,
        "createdAt": "2025-08-16T14:07:38.000Z",
        "remainingDays": 30
      }
    ],
    "totalCount": 1
  }
}
```

#### **POST /api/penalties** - Yeni Ceza Oluştur
```bash
POST /api/penalties
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "assetId": 14,
  "driverId": 5,
  "penaltyTypeId": 303,
  "amountCents": 23400,
  "discountedAmountCents": 11700,
  "penaltyDate": "2025-08-15",
  "lastDate": "2025-09-15",
  "status": "beklemede"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Ceza başarıyla oluşturuldu.",
  "data": {
    "id": 1,
    "assetId": 14,
    "driverId": 5,
    "penaltyTypeId": 303,
    "amountCents": 23400,
    "discountedAmountCents": 11700,
    "penaltyDate": "2025-08-15",
    "lastDate": "2025-09-15",
    "status": "beklemede",
    "isActive": true
  }
}
```

#### **GET /api/penalties/:id** - Ceza Detayı
```bash
GET /api/penalties/1
Authorization: Bearer {JWT_TOKEN}
```

**Response:**
```json
{
  "success": true,
  "message": "Ceza detayı başarıyla getirildi.",
  "data": {
    "id": 1,
    "assetId": 14,
    "driverId": 5,
    "penaltyTypeId": 303,
    "amountCents": 23400,
    "discountedAmountCents": 11700,
    "penaltyDate": "2025-08-15",
    "lastDate": "2025-09-15",
    "status": "beklemede",
    "isActive": true,
    "remainingDays": 30
  }
}
```

#### **PUT /api/penalties/:id** - Ceza Güncelle
```bash
PUT /api/penalties/1
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "status": "ödendi",
  "amountCents": 11700
}
```

#### **DELETE /api/penalties/:id** - Ceza Sil (Soft Delete)
```bash
DELETE /api/penalties/1
Authorization: Bearer {JWT_TOKEN}
```

---

## 🔧 **Validation Kuralları**

### **Penalty Types için Gerekli Alanlar:**
- `name` (string, max 100) - Ceza türü adı
- `penaltyScore` (integer) - Ceza puanı
- `amountCents` (integer) - Ceza tutarı (kuruş)
- `discountedAmountCents` (integer) - İndirimli tutar (kuruş)

### **Penalties için Gerekli Alanlar:**
- `assetId` (integer) - Araç ID (mevcut olmalı)
- `penaltyTypeId` (integer) - Ceza türü ID (mevcut olmalı)
- `amountCents` (integer) - Ceza tutarı (kuruş)
- `discountedAmountCents` (integer) - İndirimli tutar (kuruş)
- `penaltyDate` (date, YYYY-MM-DD) - Ceza tarihi

### **Opsiyonel Alanlar:**
- `driverId` (integer) - Sürücü ID
- `lastDate` (date) - Son ödeme tarihi
- `status` (string) - Ceza durumu (default: "beklemede")
- `description` (string) - Açıklama

---

## 📊 **Mevcut Test Verileri**

### **Penalty Types (Ceza Türleri):**
```json
[
  {
    "id": 303,
    "name": "Hız Sınırı Aşma",
    "penaltyScore": 4,
    "amountCents": 23400,    // 234 TL
    "discountedAmountCents": 11700  // 117 TL
  },
  {
    "id": 304,
    "name": "Kırmızı Işık İhlali",
    "penaltyScore": 6,
    "amountCents": 32500,    // 325 TL
    "discountedAmountCents": 16250   // 162.50 TL
  },
  {
    "id": 305,
    "name": "Yanlış Park",
    "penaltyScore": 2,
    "amountCents": 15600,    // 156 TL
    "discountedAmountCents": 7800    // 78 TL
  }
]
```

---

## ⚠️ **Hata Durumları**

### **Asset Not Found (404):**
```json
{
  "success": false,
  "error": "ASSET_NOT_FOUND", 
  "message": "Belirtilen araç bulunamadı."
}
```

### **Penalty Type Not Found (404):**
```json
{
  "success": false,
  "error": "PENALTY_TYPE_NOT_FOUND",
  "message": "Belirtilen ceza türü bulunamadı."
}
```

### **Validation Error (400):**
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Gerekli alanlar eksik: assetId, penaltyTypeId, amountCents, discountedAmountCents, penaltyDate"
}
```

### **Duplicate Name (400):**
```json
{
  "success": false,
  "error": "DUPLICATE_NAME",
  "message": "Bu ceza türü adı zaten mevcut."
}
```

---

## 🔐 **Güvenlik & Özellikler**

- ✅ **JWT Authentication** - Tüm endpoint'ler için gerekli
- ✅ **Audit Logging** - Tüm CRUD işlemleri kayıt altında
- ✅ **Soft Delete** - Veriler fiziksel olarak silinmiyor
- ✅ **Input Validation** - Gelen veriler doğrulanıyor
- ✅ **Turkish Messages** - Tüm mesajlar Türkçe
- ✅ **Date Calculations** - Kalan gün hesaplamaları
- ✅ **Filtering & Sorting** - Gelişmiş filtreleme ve sıralama
- ✅ **Pagination** - Sayfalama desteği

---

## 🚀 **Kullanım Örnekleri**

### **1. Hız Cezası Ekle:**
```bash
POST /api/penalties
{
  "assetId": 14,
  "penaltyTypeId": 303,
  "amountCents": 23400,
  "discountedAmountCents": 11700,
  "penaltyDate": "2025-08-16",
  "lastDate": "2025-09-16"
}
```

### **2. Belirli Araç İçin Cezaları Listele:**
```bash
GET /api/penalties?assetId=14&status=beklemede
```

### **3. Süresi Dolan Cezaları Bul:**
```bash
GET /api/penalties?endDate=2025-08-16&status=beklemede
```

### **4. Yeni Ceza Türü Ekle:**
```bash
POST /api/penalty-types
{
  "name": "Telefon Kullanımı",
  "description": "Araç kullanırken telefon kullanma",
  "penaltyScore": 5,
  "amountCents": 23400,
  "discountedAmountCents": 11700
}
```

Penalty API'leri tamamen hazır ve kullanıma hazır!