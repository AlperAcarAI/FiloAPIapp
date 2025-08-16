# Poliçe İşlemleri API'leri

## 📋 Mevcut Poliçe Sistemi

Sistemde zaten **Assets Policies** (Varlık Poliçeleri) tablosu mevcut ve çalışıyor durumda:

### 🏗️ Database Schema
```sql
-- Ana Poliçe Tablosu
CREATE TABLE assets_policies (
  id SERIAL PRIMARY KEY,
  asset_id INTEGER NOT NULL REFERENCES assets(id),
  policy_type_id INTEGER NOT NULL REFERENCES policy_types(id),
  seller_company_id INTEGER NOT NULL REFERENCES companies(id),
  insurance_company_id INTEGER NOT NULL REFERENCES companies(id),
  start_date DATE NOT NULL,
  end_date DATE,
  policy_number VARCHAR(100) NOT NULL,
  amount_cents INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  pid INTEGER
);

-- Poliçe Türleri Tablosu
CREATE TABLE policy_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true
);

-- Hasar Verileri (Poliçe ile ilişkili)
CREATE TABLE assets_damage_data (
  id SERIAL PRIMARY KEY,
  asset_id INTEGER NOT NULL REFERENCES assets(id),
  personnel_id INTEGER REFERENCES personnel(id),
  damage_type_id INTEGER NOT NULL REFERENCES damage_types(id),
  start_date DATE NOT NULL,
  end_date DATE,
  event_date DATE NOT NULL,
  amount_cents INTEGER NOT NULL,
  documents TEXT,
  is_active BOOLEAN DEFAULT true,
  policy_id INTEGER REFERENCES assets_policies(id) -- Poliçe bağlantısı
);
```

## 🚀 Poliçe İşlemleri API Endpoint'leri

### **1. GET /api/assets-policies** - Tüm Poliçeleri Listele
```bash
GET /api/assets-policies?assetId=14&activeOnly=true&limit=20&offset=0
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "success": true,
  "message": "Poliçeler başarıyla getirildi",
  "data": {
    "policies": [
      {
        "id": 1,
        "assetId": 14,
        "plateNumber": "34XYZ789",
        "policyTypeId": 1,
        "policyTypeName": "Kasko Sigortası",
        "sellerCompanyId": 1,
        "sellerCompanyName": "Demo Şirket A.Ş.",
        "insuranceCompanyId": 5,
        "insuranceCompanyName": "Sigorta A.Ş.",
        "policyNumber": "KSK-2025-001234",
        "amountCents": 500000,
        "startDate": "2025-01-01",
        "endDate": "2025-12-31",
        "isActive": true,
        "remainingDays": 139
      }
    ],
    "totalCount": 1,
    "pagination": {
      "limit": 20,
      "offset": 0,
      "hasMore": false
    }
  }
}
```

**Query Parameters:**
- `assetId` (number): Araç ID'si ile filtreleme
- `policyTypeId` (number): Poliçe türü ile filtreleme
- `insuranceCompanyId` (number): Sigorta şirketi ile filtreleme
- `activeOnly` (boolean): Sadece aktif poliçeler
- `expiringInDays` (number): X gün içinde süresi dolacak poliçeler
- `search` (string): Poliçe numarasında arama
- `sortBy` (string): `id`, `startDate`, `endDate`, `amountCents`
- `sortOrder` (string): `asc` veya `desc`

### **2. GET /api/assets-policies/:id** - Poliçe Detayı
```bash
GET /api/assets-policies/1
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "success": true,
  "message": "Poliçe detayı başarıyla getirildi",
  "data": {
    "id": 1,
    "assetId": 14,
    "asset": {
      "plateNumber": "34XYZ789",
      "brand": "Toyota",
      "model": "Corolla",
      "year": 2023
    },
    "policyTypeId": 1,
    "policyType": {
      "id": 1,
      "name": "Kasko Sigortası"
    },
    "sellerCompany": {
      "id": 1,
      "name": "Demo Şirket A.Ş.",
      "phone": "+902125551234"
    },
    "insuranceCompany": {
      "id": 5,
      "name": "Sigorta A.Ş.",
      "phone": "+902125559876"
    },
    "policyNumber": "KSK-2025-001234",
    "amountCents": 500000,
    "startDate": "2025-01-01",
    "endDate": "2025-12-31",
    "isActive": true,
    "remainingDays": 139,
    "relatedDamages": [
      {
        "id": 1,
        "eventDate": "2025-07-15",
        "damageType": "Çarpma",
        "amountCents": 75000
      }
    ]
  }
}
```

### **3. POST /api/assets-policies** - Yeni Poliçe Oluştur
```bash
POST /api/assets-policies
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "assetId": 14,
  "policyTypeId": 1,
  "sellerCompanyId": 1,
  "insuranceCompanyId": 5,
  "policyNumber": "KSK-2025-001234",
  "amountCents": 500000,
  "startDate": "2025-01-01",
  "endDate": "2025-12-31"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Poliçe başarıyla oluşturuldu",
  "data": {
    "id": 2,
    "assetId": 14,
    "policyTypeId": 1,
    "policyNumber": "KSK-2025-001234",
    "amountCents": 500000,
    "startDate": "2025-01-01",
    "endDate": "2025-12-31",
    "isActive": true
  }
}
```

### **4. PUT /api/assets-policies/:id** - Poliçe Güncelle
```bash
PUT /api/assets-policies/1
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "amountCents": 600000,
  "endDate": "2026-01-01",
  "isActive": true
}
```

### **5. DELETE /api/assets-policies/:id** - Poliçe Sil
```bash
DELETE /api/assets-policies/1
Authorization: Bearer <JWT_TOKEN>
```

### **6. GET /api/assets-policies/by-asset/:assetId** - Araç Poliçeleri
```bash
GET /api/assets-policies/by-asset/14
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "success": true,
  "message": "Araç poliçeleri başarıyla getirildi",
  "data": {
    "assetInfo": {
      "id": 14,
      "plateNumber": "34XYZ789",
      "brand": "Toyota",
      "model": "Corolla"
    },
    "policies": [
      {
        "id": 1,
        "policyTypeName": "Kasko Sigortası",
        "policyNumber": "KSK-2025-001234",
        "insuranceCompanyName": "Sigorta A.Ş.",
        "amountCents": 500000,
        "startDate": "2025-01-01",
        "endDate": "2025-12-31",
        "status": "Aktif",
        "remainingDays": 139
      }
    ],
    "summary": {
      "totalPolicies": 1,
      "activePolicies": 1,
      "totalAmountCents": 500000,
      "expiringIn30Days": 0
    }
  }
}
```

### **7. GET /api/assets-policies/expiring** - Süresi Yaklaşan Poliçeler
```bash
GET /api/assets-policies/expiring?days=30
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "success": true,
  "message": "Süresi yaklaşan poliçeler getirildi",
  "data": {
    "policies": [
      {
        "id": 1,
        "policyNumber": "KSK-2025-001234",
        "assetId": 14,
        "plateNumber": "34XYZ789",
        "policyTypeName": "Kasko Sigortası",
        "insuranceCompanyName": "Sigorta A.Ş.",
        "endDate": "2025-12-31",
        "remainingDays": 139,
        "priority": "normal"
      }
    ],
    "totalCount": 1,
    "summary": {
      "expiring7Days": 0,
      "expiring15Days": 0,
      "expiring30Days": 1
    }
  }
}
```

## 📊 Poliçe Türleri API'leri

### **8. GET /api/policy-types** - Poliçe Türleri Listele
```bash
GET /api/policy-types?activeOnly=true
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "success": true,
  "message": "Poliçe türleri başarıyla getirildi",
  "data": {
    "policyTypes": [
      {
        "id": 1,
        "name": "Kasko Sigortası",
        "isActive": true
      },
      {
        "id": 2,
        "name": "Trafik Sigortası",
        "isActive": true
      },
      {
        "id": 3,
        "name": "Nakliye Sigortası",
        "isActive": true
      }
    ]
  }
}
```

### **9. POST /api/policy-types** - Yeni Poliçe Türü Ekle
```bash
POST /api/policy-types
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "İş Makinesi Sigortası"
}
```

## 🔧 Hasar İşlemleri API'leri

### **10. GET /api/assets-damage** - Hasar Kayıtları
```bash
GET /api/assets-damage?policyId=1&assetId=14
Authorization: Bearer <JWT_TOKEN>
```

### **11. POST /api/assets-damage** - Yeni Hasar Kaydı
```bash
POST /api/assets-damage
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "assetId": 14,
  "personnelId": 1,
  "damageTypeId": 1,
  "policyId": 1,
  "eventDate": "2025-08-16",
  "amountCents": 75000,
  "documents": "hasar_raporu_001.pdf,foto1.jpg"
}
```

## ✅ API Özellikleri

1. **JWT Authentication**: Tüm endpoint'ler JWT token gerektirir
2. **Türkçe Mesajlar**: Tüm response'lar Türkçe
3. **Cent Bazlı**: Tüm para değerleri cent/kuruş cinsinden
4. **Audit Logging**: Tüm işlemler audit tablosuna loglanır
5. **Soft Delete**: Kayıtlar silinmez, `isActive=false` yapılır
6. **Filtreleme**: Gelişmiş filtreleme ve sıralama özellikleri
7. **Pagination**: Sayfalama desteği (limit/offset)

Bu API'ler poliçe yönetimi, hasar takibi ve sigorta işlemlerinin tamamını kapsamaktadır.