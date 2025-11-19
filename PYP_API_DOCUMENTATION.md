# PYP (Proje Yatırım Programı) API Dokümantasyonu

## Genel Bakış

PYP yönetimi için oluşturulan RESTful API endpointleri. Tüm endpointler JWT authentication gerektirir ve `/api/secure` prefix'i altındadır.

## Base URL

```
/api/secure
```

## Authentication

Tüm isteklerde Authorization header gereklidir:

```
Authorization: Bearer <jwt_token>
```

---

## 1. PYP Kayıtlarını Listele

### Endpoint
```
GET /api/secure/project-pyps
```

### Query Parameters

| Parametre | Tip | Zorunlu | Açıklama | Varsayılan |
|-----------|-----|---------|----------|------------|
| `search` | string | Hayır | PYP kodu veya adı ile arama | - |
| `projectId` | integer | Hayır | Belirli projeye ait PYP'ler | - |
| `status` | string | Hayır | Durum filtresi (planned/ongoing/completed/cancelled) | - |
| `active` | boolean | Hayır | Sadece aktif kayıtlar | true |
| `limit` | integer | Hayır | Sayfa başına kayıt sayısı | 50 |
| `offset` | integer | Hayır | Sayfalama offset | 0 |

### İstek Örneği

```bash
curl -X GET "https://your-domain.com/api/secure/project-pyps?search=PYP&active=true&limit=20" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Başarılı Yanıt (200 OK)

```json
{
  "success": true,
  "message": "PYP kayıtları başarıyla getirildi.",
  "data": {
    "pyps": [
      {
        "id": 1,
        "projectId": 5,
        "code": "PYP-2025-001",
        "name": "Ana Transformatör Merkezi PYP",
        "address": "Merkez Mahallesi, Ankara",
        "status": "ongoing",
        "isActive": true,
        "createdAt": "2025-11-19T10:30:00.000Z",
        "updatedAt": "2025-11-19T10:30:00.000Z",
        "projectCode": "PRJ-2025-001"
      },
      {
        "id": 2,
        "projectId": 5,
        "code": "PYP-2025-002",
        "name": "Yedek Hat PYP",
        "address": "Kızılay, Ankara",
        "status": "planned",
        "isActive": true,
        "createdAt": "2025-11-18T14:20:00.000Z",
        "updatedAt": "2025-11-18T14:20:00.000Z",
        "projectCode": "PRJ-2025-001"
      }
    ],
    "totalCount": 2,
    "limit": 20,
    "offset": 0
  }
}
```

---

## 2. PYP Detayını Getir

### Endpoint
```
GET /api/secure/project-pyps/:id
```

### Path Parameters

| Parametre | Tip | Açıklama |
|-----------|-----|----------|
| `id` | integer | PYP ID |

### İstek Örneği

```bash
curl -X GET "https://your-domain.com/api/secure/project-pyps/1" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Başarılı Yanıt (200 OK)

```json
{
  "success": true,
  "message": "PYP detayı başarıyla getirildi.",
  "data": {
    "pyp": {
      "id": 1,
      "projectId": 5,
      "code": "PYP-2025-001",
      "name": "Ana Transformatör Merkezi PYP",
      "address": "Merkez Mahallesi, Ankara",
      "status": "ongoing",
      "isActive": true,
      "createdAt": "2025-11-19T10:30:00.000Z",
      "updatedAt": "2025-11-19T10:30:00.000Z",
      "createdBy": 1,
      "updatedBy": 1,
      "projectCode": "PRJ-2025-001"
    }
  }
}
```

### Hata Yanıtı (404 Not Found)

```json
{
  "success": false,
  "error": "PYP_NOT_FOUND",
  "message": "PYP kaydı bulunamadı."
}
```

---

## 3. Projeye Ait PYP'leri Listele

### Endpoint
```
GET /api/secure/projects/:projectId/pyps
```

### Path Parameters

| Parametre | Tip | Açıklama |
|-----------|-----|----------|
| `projectId` | integer | Proje ID |

### Query Parameters

| Parametre | Tip | Açıklama | Varsayılan |
|-----------|-----|----------|------------|
| `active` | boolean | Sadece aktif kayıtlar | true |

### İstek Örneği

```bash
curl -X GET "https://your-domain.com/api/secure/projects/5/pyps?active=true" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Başarılı Yanıt (200 OK)

```json
{
  "success": true,
  "message": "Projeye ait PYP kayıtları başarıyla getirildi.",
  "data": {
    "projectId": 5,
    "pyps": [
      {
        "id": 1,
        "code": "PYP-2025-001",
        "name": "Ana Transformatör Merkezi PYP",
        "address": "Merkez Mahallesi, Ankara",
        "status": "ongoing",
        "isActive": true,
        "createdAt": "2025-11-19T10:30:00.000Z",
        "updatedAt": "2025-11-19T10:30:00.000Z"
      },
      {
        "id": 2,
        "code": "PYP-2025-002",
        "name": "Yedek Hat PYP",
        "address": "Kızılay, Ankara",
        "status": "planned",
        "isActive": true,
        "createdAt": "2025-11-18T14:20:00.000Z",
        "updatedAt": "2025-11-18T14:20:00.000Z"
      }
    ],
    "totalCount": 2
  }
}
```

### Hata Yanıtı (404 Not Found)

```json
{
  "success": false,
  "error": "PROJECT_NOT_FOUND",
  "message": "Proje bulunamadı."
}
```

---

## 4. Yeni PYP Kaydı Oluştur

### Endpoint
```
POST /api/secure/project-pyps
```

### Request Body

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| `projectId` | integer | ✅ | İlişkili proje ID |
| `code` | string | ✅ | PYP kodu (proje içinde benzersiz) |
| `name` | string | ✅ | PYP adı |
| `address` | string | ❌ | PYP adresi |
| `status` | string | ❌ | Durum (planned/ongoing/completed/cancelled) |

### İstek Örneği

```bash
curl -X POST "https://your-domain.com/api/secure/project-pyps" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": 5,
    "code": "PYP-2025-003",
    "name": "Yeni Dağıtım Merkezi PYP",
    "address": "Çankaya, Ankara",
    "status": "planned"
  }'
```

### Başarılı Yanıt (201 Created)

```json
{
  "success": true,
  "message": "PYP kaydı başarıyla oluşturuldu.",
  "data": {
    "pyp": {
      "id": 3,
      "projectId": 5,
      "code": "PYP-2025-003",
      "name": "Yeni Dağıtım Merkezi PYP",
      "address": "Çankaya, Ankara",
      "status": "planned",
      "isActive": true,
      "createdAt": "2025-11-19T15:45:00.000Z",
      "updatedAt": "2025-11-19T15:45:00.000Z",
      "createdBy": 1,
      "updatedBy": 1
    }
  }
}
```

### Hata Yanıtları

#### Validation Hatası (400 Bad Request)
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Geçersiz veri formatı.",
  "details": [
    {
      "field": "code",
      "message": "Required"
    }
  ]
}
```

#### Proje Bulunamadı (400 Bad Request)
```json
{
  "success": false,
  "error": "INVALID_PROJECT_ID",
  "message": "Belirtilen proje ID'si (999) bulunamadı."
}
```

#### Kod Çakışması (400 Bad Request)
```json
{
  "success": false,
  "error": "DUPLICATE_PYP_CODE",
  "message": "Bu PYP kodu (PYP-2025-001) bu proje için zaten mevcut."
}
```

---

## 5. PYP Kaydını Güncelle

### Endpoint
```
PUT /api/secure/project-pyps/:id
```

### Path Parameters

| Parametre | Tip | Açıklama |
|-----------|-----|----------|
| `id` | integer | PYP ID |

### Request Body (Tüm Alanlar Opsiyonel)

| Alan | Tip | Açıklama |
|------|-----|----------|
| `code` | string | PYP kodu |
| `name` | string | PYP adı |
| `address` | string | PYP adresi |
| `status` | string | Durum (planned/ongoing/completed/cancelled) |
| `isActive` | boolean | Aktif durumu (soft delete için false) |

### İstek Örneği - Durum Güncelleme

```bash
curl -X PUT "https://your-domain.com/api/secure/project-pyps/1" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed"
  }'
```

### İstek Örneği - Soft Delete

```bash
curl -X PUT "https://your-domain.com/api/secure/project-pyps/1" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "isActive": false
  }'
```

### Başarılı Yanıt (200 OK)

```json
{
  "success": true,
  "message": "PYP kaydı başarıyla güncellendi.",
  "data": {
    "pyp": {
      "id": 1,
      "projectId": 5,
      "code": "PYP-2025-001",
      "name": "Ana Transformatör Merkezi PYP",
      "address": "Merkez Mahallesi, Ankara",
      "status": "completed",
      "isActive": true,
      "createdAt": "2025-11-19T10:30:00.000Z",
      "updatedAt": "2025-11-19T15:50:00.000Z",
      "createdBy": 1,
      "updatedBy": 1
    }
  }
}
```

### Hata Yanıtı (404 Not Found)

```json
{
  "success": false,
  "error": "PYP_NOT_FOUND",
  "message": "Güncellenecek PYP kaydı bulunamadı."
}
```

---

## 6. Kesinti İşleminde PYP Kullanımı

### Kesinti İşlemi ile PYP İlişkilendirme

#### Endpoint
```
POST /api/secure/outage-processes
```

#### İstek Örneği

```bash
curl -X POST "https://your-domain.com/api/secure/outage-processes" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "firmId": 1,
    "processorFirmId": 2,
    "projectId": 5,
    "pypId": 1,
    "causeOfOutage": "Planlı bakım çalışması",
    "rootBuildName": "Ana Transformatör",
    "startDate": "2025-11-20",
    "startClock": "09:00:00",
    "status": "planned",
    "supervisorId": 10,
    "workerChefId": 15,
    "personnelIds": [20, 21, 22],
    "assetIds": [5, 6]
  }'
```

#### Başarılı Yanıt (201 Created)

```json
{
  "success": true,
  "message": "Kesinti işlemi başarıyla oluşturuldu.",
  "data": {
    "process": {
      "id": 10,
      "firmId": 1,
      "processorFirmId": 2,
      "causeOfOutage": "Planlı bakım çalışması",
      "rootBuildName": "Ana Transformatör",
      "startDate": "2025-11-20",
      "status": "planned",
      "createdAt": "2025-11-19T16:00:00.000Z",
      "firmName": "ABC Elektrik",
      "processorFirmName": "XYZ Taşeron"
    }
  }
}
```

#### PYP-Proje Uyumsuzluğu Hatası (400 Bad Request)

```json
{
  "success": false,
  "error": "PYP_PROJECT_MISMATCH",
  "message": "Seçilen PYP belirtilen proje ile ilişkili değil."
}
```

#### PYP Bulunamadı Hatası (400 Bad Request)

```json
{
  "success": false,
  "error": "INVALID_PYP_ID",
  "message": "Belirtilen PYP ID'si (999) bulunamadı."
}
```

---

## 7. Kesinti İşlemi Listesinde PYP Bilgileri

### Endpoint
```
GET /api/secure/outage-processes
```

### İstek Örneği

```bash
curl -X GET "https://your-domain.com/api/secure/outage-processes?projectId=5&limit=10" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Başarılı Yanıt (200 OK)

```json
{
  "success": true,
  "message": "Kesinti işlemleri başarıyla getirildi.",
  "data": {
    "outageProcesses": [
      {
        "id": 10,
        "firmId": 1,
        "processorFirmId": 2,
        "projectId": 5,
        "pypId": 1,
        "pypCode": "PYP-2025-001",
        "pypName": "Ana Transformatör Merkezi PYP",
        "causeOfOutage": "Planlı bakım çalışması",
        "startDate": "2025-11-20",
        "status": "planned",
        "isActive": true,
        "createdAt": "2025-11-19T16:00:00.000Z",
        "firmName": "ABC Elektrik",
        "processorFirmName": "XYZ Taşeron",
        "projectCode": "PRJ-2025-001"
      }
    ],
    "totalCount": 1,
    "limit": 10,
    "offset": 0
  }
}
```

---

## 8. Kesinti İşlemi Detayında PYP Bilgileri

### Endpoint
```
GET /api/secure/outage-processes/:id
```

### İstek Örneği

```bash
curl -X GET "https://your-domain.com/api/secure/outage-processes/10" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Başarılı Yanıt (200 OK)

```json
{
  "success": true,
  "message": "Kesinti işlemi detayı başarıyla getirildi.",
  "data": {
    "process": {
      "id": 10,
      "firmId": 1,
      "processorFirmId": 2,
      "projectId": 5,
      "pypId": 1,
      "pypCode": "PYP-2025-001",
      "pypName": "Ana Transformatör Merkezi PYP",
      "causeOfOutage": "Planlı bakım çalışması",
      "rootBuildName": "Ana Transformatör",
      "startDate": "2025-11-20",
      "startClock": "09:00:00",
      "endClock": null,
      "status": "planned",
      "supervisorId": 10,
      "workerChefId": 15,
      "isActive": true,
      "firmName": "ABC Elektrik",
      "processorFirmName": "XYZ Taşeron",
      "supervisorName": "Ahmet Yılmaz",
      "workerChefName": "Mehmet Demir",
      "projectCode": "PRJ-2025-001"
    },
    "personnels": [
      {
        "id": 20,
        "name": "Ali",
        "surname": "Kara",
        "tcNo": "12345678901"
      }
    ],
    "assets": [
      {
        "id": 5,
        "plateNumber": "34 ABC 123",
        "modelYear": 2022
      }
    ]
  }
}
```

---

## Hata Kodları

| Kod | HTTP Status | Açıklama |
|-----|-------------|----------|
| `PYP_NOT_FOUND` | 404 | PYP kaydı bulunamadı |
| `PROJECT_NOT_FOUND` | 404 | Proje bulunamadı |
| `INVALID_PROJECT_ID` | 400 | Geçersiz proje ID |
| `INVALID_PYP_ID` | 400 | Geçersiz PYP ID |
| `DUPLICATE_PYP_CODE` | 400 | PYP kodu zaten mevcut |
| `PYP_PROJECT_MISMATCH` | 400 | PYP ile proje uyumsuz |
| `VALIDATION_ERROR` | 400 | Veri doğrulama hatası |
| `UNAUTHORIZED` | 401 | Yetkisiz erişim |
| `PYP_FETCH_ERROR` | 500 | PYP getirme hatası |
| `PYP_CREATE_ERROR` | 500 | PYP oluşturma hatası |
| `PYP_UPDATE_ERROR` | 500 | PYP güncelleme hatası |

---

## İş Akışı Örnekleri

### Senaryo 1: Yeni Proje için PYP Oluştur ve Kesinti İşleminde Kullan

```bash
# 1. Önce PYP kaydı oluştur
curl -X POST "https://your-domain.com/api/secure/project-pyps" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": 5,
    "code": "PYP-2025-004",
    "name": "Acil Bakım PYP",
    "address": "Yenimahalle, Ankara",
    "status": "planned"
  }'

# 2. Dönen PYP ID'sini (örn. 4) kullanarak kesinti işlemi oluştur
curl -X POST "https://your-domain.com/api/secure/outage-processes" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firmId": 1,
    "processorFirmId": 2,
    "projectId": 5,
    "pypId": 4,
    "causeOfOutage": "Acil arıza",
    "startDate": "2025-11-21",
    "status": "ongoing"
  }'
```

### Senaryo 2: PYP Durumunu Güncelle (Tamamlandı Olarak İşaretle)

```bash
curl -X PUT "https://your-domain.com/api/secure/project-pyps/1" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed"
  }'
```

### Senaryo 3: PYP'yi Soft Delete (Pasif Yap)

```bash
curl -X PUT "https://your-domain.com/api/secure/project-pyps/1" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "isActive": false
  }'
```

### Senaryo 4: Projeye Ait Tüm PYP'leri Listele

```bash
curl -X GET "https://your-domain.com/api/secure/projects/5/pyps?active=true" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Önemli Notlar

1. **PYP Kodu Benzersizliği**: Aynı proje içinde aynı PYP kodu kullanılamaz (UNIQUE constraint)
2. **Soft Delete**: Hard DELETE endpoint yok - pasif yapmak için `isActive: false` kullanın
3. **PYP-Proje İlişkisi**: Kesinti işleminde kullanılan PYP mutlaka belirtilen proje ile ilişkili olmalıdır
4. **Audit Alanları**: `createdBy`, `updatedBy`, `createdAt`, `updatedAt` otomatik yönetilir
5. **Default Status**: Yeni PYP kaydı oluşturulurken status belirtilmezse `"planned"` olarak ayarlanır

---

## Database İlişkileri

```
projects (1) ──────< (N) project_pyps
                           │
                           │
                           │ (1)
                           │
fo_outage_process (N) ─────┘
        │
        │ (project_id FK)
        │
        └────> projects
```

- Bir projede birden fazla PYP olabilir
- Bir kesinti işlemi bir PYP'ye referans verebilir (opsiyonel)
- PYP kaydı silinirse (soft delete), ona bağlı kesinti kayıtları etkilenmez (NULL olarak kalır)
