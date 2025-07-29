# Fleet Management API Dokümantasyonu v2.0 (29 Ocak 2025)

## 🚀 Genel Bakış

Fleet Management API sistemi toplam **138+ endpoint** ile kapsamlı araç filosu yönetimi sağlar. Sistem güvenli JWT authentication ve API key tabanlı çift katmanlı güvenlik kullanır.

**Base URL**: `https://[your-domain]/api`  
**Authentication**: JWT Token + API Key  
**Response Format**: JSON  
**Language**: Turkish

## 🔐 Authentication

### 1. JWT Authentication (Backend API)
```bash
POST /api/backend/auth/login
Content-Type: application/json

{
  "email": "admin@test.com",
  "password": "test123"
}

# Response:
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "admin@test.com",
      "personnelId": 1,
      "workAreaId": 2,
      "positionId": 1,
      "accessLevel": "CORPORATE"
    }
  }
}
```

### 2. API Key Authentication (Secure API)
```bash
GET /api/secure/data
X-API-Key: ak_demo2025key
Authorization: Bearer [JWT_TOKEN]
```

## 📊 API Kategorileri ve Endpoint Sayıları

| Kategori | Endpoint Sayısı | Base Path | Authentication |
|----------|----------------|-----------|----------------|
| **API Management** | 79 | `/api/secure/` | API Key + JWT |
| **Backend API** | 8 | `/api/backend/` | JWT Only |
| **Permission Management** | 6 | `/api/permission-management/` | JWT (Admin) |
| **Analytics** | 6 | `/api/analytics/` | JWT |
| **Specialized CRUD** | 25 | `/api/secure/` | API Key + JWT |
| **Utilities** | 14 | Various | Mixed |
| **TOPLAM** | **138+** |  |  |

## 🏢 1. Backend API (Hiyerarşik Authentication) - 8 Endpoint

### Authentication
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| `POST` | `/api/backend/auth/login` | JWT token alma |

### Data Access (Hierarchical Permissions)
| Method | Endpoint | Açıklama | Permissions |
|--------|----------|----------|-------------|
| `GET` | `/api/backend/assets` | Asset listesi | Work area based |
| `GET` | `/api/backend/personnel` | Personel listesi | Work area based |
| `GET` | `/api/backend/fuel-records` | Yakıt kayıtları | Work area based |
| `GET` | `/api/backend/work-areas` | Çalışma alanları | Hierarchical |

**Hierarchical Access Levels:**
- **WORKSITE**: Sadece kendi şantiye
- **REGIONAL**: Bölgedeki tüm şantiyeler  
- **CORPORATE**: Tüm şirket
- **DEPARTMENT**: Departman bazlı erişim

**Example Request:**
```bash
GET /api/backend/assets?limit=10&search=ABC&companyId=1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Response:
{
  "success": true,
  "data": [
    {
      "id": 18,
      "licensePlate": "34ABC123",
      "brand": "Mercedes",
      "model": "Sprinter",
      "year": 2022,
      "companyId": 1,
      "workAreaId": 2,
      "isActive": true
    }
  ],
  "count": 1,
  "totalCount": 15,
  "message": "Assets başarıyla alındı"
}
```

## 🛡️ 2. Permission Management API - 6 Endpoint

**Admin Email**: `alper.acar@architectaiagency.com`

| Method | Endpoint | Açıklama | Access |
|--------|----------|----------|---------|
| `GET` | `/api/permission-management/users` | Kullanıcı listesi | Admin/Permission Manager |
| `GET` | `/api/permission-management/access-levels` | Yetki seviyeleri | Admin/Permission Manager |
| `POST` | `/api/permission-management/assign-permission` | Yetki atama | Admin/Permission Manager |
| `PUT` | `/api/permission-management/update-permission/:id` | Yetki güncelleme | Admin/Permission Manager |
| `DELETE` | `/api/permission-management/revoke-permission/:id` | Yetki iptali (soft delete) | Admin/Permission Manager |
| `GET` | `/api/permission-management/user-permissions/:userId` | Kullanıcı yetki geçmişi | Admin/Permission Manager |

**Permission Assignment Example:**
```bash
POST /api/permission-management/assign-permission
Authorization: Bearer [ADMIN_JWT_TOKEN]
Content-Type: application/json

{
  "userId": 2,
  "accessLevel": "REGIONAL",
  "accessScope": {
    "allowedWorkAreaIds": [1, 2, 3],
    "permissions": ["data:read", "data:write", "fleet:read"]
  },
  "validUntil": "2025-12-31T23:59:59Z"
}
```

## 🔒 3. Secure API (API Key Authentication) - 104+ Endpoint

### API Key Management
**Demo API Key**: `ak_demo2025key`

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| `GET` | `/api/secure/data` | Korumalı veri okuma |
| `POST` | `/api/secure/data` | Korumalı veri yazma |
| `GET` | `/api/secure/admin-data` | Admin verilerine erişim |

### Asset Management (6 endpoints)
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| `GET` | `/api/secure/assets` | Asset listesi (filtreleme, join'li data) |
| `GET` | `/api/secure/assets/{id}` | Asset detayı |
| `POST` | `/api/secure/assets` | Yeni asset ekleme (duplicate plaka kontrolü) |
| `PUT` | `/api/secure/assets/{id}` | Asset güncelleme |
| `DELETE` | `/api/secure/assets/{id}` | Asset silme (soft delete) |
| `GET` | `/api/secure/assets-assignment` | Asset-personel atamaları |

### Company Management (5 endpoints)
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| `GET` | `/api/secure/companies` | Şirket listesi ve arama |
| `POST` | `/api/secure/companies` | Yeni şirket ekleme |
| `GET` | `/api/secure/companies/{id}` | Şirket detayı |
| `PUT` | `/api/secure/companies/{id}` | Şirket güncelleme |
| `DELETE` | `/api/secure/companies/{id}` | Şirket silme (soft delete) |

### Document Management (5 endpoints)
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| `POST` | `/api/secure/documents/upload` | Dosya yükleme API (Asset/Personnel) |
| `GET` | `/api/secure/documents/asset/{id}` | Asset dokümanları listesi |
| `GET` | `/api/secure/documents/personnel/{id}` | Personnel dokümanları listesi |
| `GET` | `/api/secure/documents/{id}` | Dokümantasyon detayı |
| `DELETE` | `/api/secure/documents/{id}` | Doküman silme |

### Financial Management (5 endpoints)
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| `GET` | `/api/secure/financial/payment-types` | Ödeme türleri |
| `GET` | `/api/secure/financial/current-accounts` | Ana finansal işlemler |
| `POST` | `/api/secure/financial/current-accounts` | Yeni işlem oluşturma |
| `GET` | `/api/secure/financial/accounts-details` | Detay kayıtları |
| `POST` | `/api/secure/financial/accounts-details` | Yeni detay kaydı |

### Fuel Management (5 endpoints)
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| `GET` | `/api/secure/fuel-records` | Yakıt kayıtları listesi |
| `POST` | `/api/secure/fuel-records` | Yeni yakıt kaydı |
| `GET` | `/api/secure/fuel-records/{id}` | Yakıt kaydı detayı |
| `PUT` | `/api/secure/fuel-records/{id}` | Yakıt kaydı güncelleme |
| `DELETE` | `/api/secure/fuel-records/{id}` | Yakıt kaydı silme |

### Bulk Import (5 endpoints)
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| `POST` | `/api/secure/bulk-import/csv` | CSV toplu aktarım |
| `GET` | `/api/secure/bulk-import/status/{id}` | Import durumu takibi |
| `GET` | `/api/secure/bulk-import/template/{table}` | CSV template indirme |
| `POST` | `/api/secure/bulk-import/stop/{id}` | Import durdurma |
| `GET` | `/api/secure/bulk-import/history` | Import geçmişi |

## 📊 4. Analytics & Monitoring API - 6 Endpoint

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| `GET` | `/api/analytics/stats/overview` | Genel kullanım özeti |
| `GET` | `/api/analytics/stats/endpoints` | Endpoint bazlı istatistikler |
| `GET` | `/api/analytics/stats/daily` | Günlük kullanım trendi |
| `GET` | `/api/analytics/stats/slowest` | En yavaş endpoint'ler |
| `GET` | `/api/analytics/stats/errors` | Hata analizi |
| `GET` | `/api/analytics/logs` | Detaylı log kayıtları (sayfalama) |

## 📋 5. Audit Trail API - 4 Endpoint

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| `GET` | `/api/audit/record/:tableName/:recordId` | Kaydın değişiklik geçmişi |
| `GET` | `/api/audit/user/:userId` | Kullanıcının tüm aktiviteleri |
| `GET` | `/api/audit/table/:tableName/summary` | Tablo bazlı audit özeti |
| `GET` | `/api/audit/stats` | Genel audit istatistikleri |

## 🔧 6. API Management Routes (79 Endpoint)

**En kapsamlı API koleksiyonu** - Referans veriler ve CRUD işlemler:

### Referans Veri API'leri (~40 endpoint)
- **Cities/Countries**: Şehir ve ülke yönetimi
- **Car Brands/Models**: Araç marka ve modelleri
- **Car Types**: Araç türleri
- **Ownership Types**: Sahiplik türleri
- **Policy Types**: Poliçe türleri
- **Maintenance Types**: Bakım türleri
- **Penalty Types**: Ceza türleri
- **Payment Methods**: Ödeme yöntemleri
- **Personnel Positions**: Personel pozisyonları
- **Work Areas**: Çalışma alanları

### İş Verisi API'leri (~39 endpoint)
- **Personnel Management**: Personel CRUD
- **Fleet Operations**: Araç operasyonları
- **Financial Operations**: Mali işlemler
- **Maintenance Records**: Bakım kayıtları
- **Penalty Records**: Ceza kayıtları

**Örnek API Pattern:**
```bash
# Her referans veri için standart CRUD:
GET    /api/secure/getCities              # Liste
POST   /api/secure/addCity                # Ekleme  
PUT    /api/secure/updateCity/{id}        # Güncelleme
DELETE /api/secure/deleteCity/{id}        # Silme

# Filtreleme ve sayfalama:
GET /api/secure/getCities?search=istanbul&limit=10&offset=0&sortBy=name&sortOrder=asc
```

## 📝 Response Format Standartları

### Başarılı Yanıt:
```json
{
  "success": true,
  "data": [...],
  "message": "İşlem başarılı",
  "count": 10,
  "totalCount": 150,
  "pagination": {
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

### Hata Yanıtı:
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Gerekli alanlar eksik",
  "details": {
    "field": "email",
    "code": "REQUIRED"
  }
}
```

## 🚨 Error Codes

| Code | HTTP Status | Açıklama |
|------|-------------|----------|
| `UNAUTHORIZED` | 401 | Kimlik doğrulama gerekli |
| `FORBIDDEN` | 403 | Yetki yetersiz |
| `NOT_FOUND` | 404 | Kayıt bulunamadı |
| `VALIDATION_ERROR` | 400 | Veri validasyon hatası |
| `DUPLICATE_ENTRY` | 409 | Duplicate kayıt |
| `RATE_LIMIT_EXCEEDED` | 429 | Rate limit aşıldı |
| `INTERNAL_ERROR` | 500 | Sunucu hatası |

## 🏆 Sonuç

**Toplam API Endpoint**: 138+  
**Güvenlik**: Çift katmanlı (JWT + API Key)  
**Dil**: Türkçe yanıtlar  
**Format**: JSON  
**Rate Limiting**: Aktif  
**Audit Trail**: Tam kayıt  
**Documentation**: Bu dokümantasyon  

Fleet Management API sistemi production-ready durumda ve tam kapsamlı araç filosu yönetimi sağlar.