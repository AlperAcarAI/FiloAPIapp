# Kesinti İşlem Yönetimi API Kullanım Örnekleri

## 🔐 Authentication
Tüm endpoint'ler JWT authentication gerektirir. Header'da token gönderilmelidir:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 1️⃣ Kesinti İşlemlerini Listele

### İstek
```http
GET /api/secure/outage-processes?status=ongoing&firmId=1&limit=10&offset=0
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Query Parametreleri (Opsiyonel)
- `search` - Kesinti nedeni, bina adı/kodu'nda arama
- `status` - Durum filtresi (planned, ongoing, completed, cancelled)
- `firmId` - Firma ID'ye göre filtre
- `processorFirmId` - İşlemci firma ID'ye göre filtre
- `projectId` - Proje ID'ye göre filtre
- `active` - Aktif/pasif durum (true/false)
- `limit` - Sayfa başına kayıt (varsayılan: 50)
- `offset` - Sayfalama offset (varsayılan: 0)

### Başarılı Cevap (200 OK)
```json
{
  "success": true,
  "message": "Kesinti işlemleri başarıyla getirildi.",
  "data": {
    "outageProcesses": [
      {
        "id": 1,
        "firmId": 1,
        "processorFirmId": 2,
        "causeOfOutage": "Elektrik bakımı",
        "rootBuildName": "A Blok",
        "rootBuildCode": "BLD-001",
        "outputStartPoint": "Ana dağıtım panosu",
        "startDate": "2025-10-30",
        "endDate": "2025-10-30",
        "startClock": "09:00:00",
        "endClock": "17:00:00",
        "areaOfOutage": "Tüm bina",
        "supervisorId": 5,
        "processorSupervisor": "Ahmet Yılmaz",
        "workerChefId": 8,
        "projectId": 3,
        "pyp": "PYP-2025-001",
        "status": "ongoing",
        "isActive": true,
        "createdAt": "2025-10-28T10:00:00.000Z",
        "updatedAt": "2025-10-28T10:00:00.000Z",
        "firmName": "ABC Elektrik A.Ş.",
        "processorFirmName": "XYZ Taşeron Ltd.",
        "supervisorName": "Mehmet Demir",
        "workerChefName": "Ali Kaya",
        "projectCode": "PRJ-2025-001",
        "createdByEmail": "admin@example.com",
        "updatedByEmail": "admin@example.com"
      }
    ],
    "totalCount": 1,
    "limit": 10,
    "offset": 0
  }
}
```

### Hata Cevabı (500)
```json
{
  "success": false,
  "error": "OUTAGE_PROCESSES_FETCH_ERROR",
  "message": "Kesinti işlemleri getirilirken hata oluştu."
}
```

---

## 2️⃣ Kesinti İşlemi Detayı (Personel ve Araçlar Dahil)

### İstek
```http
GET /api/secure/outage-processes/1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Başarılı Cevap (200 OK)
```json
{
  "success": true,
  "message": "Kesinti işlemi detayı başarıyla getirildi.",
  "data": {
    "process": {
      "id": 1,
      "firmId": 1,
      "processorFirmId": 2,
      "causeOfOutage": "Elektrik bakımı",
      "rootBuildName": "A Blok",
      "rootBuildCode": "BLD-001",
      "outputStartPoint": "Ana dağıtım panosu",
      "startDate": "2025-10-30",
      "endDate": "2025-10-30",
      "startClock": "09:00:00",
      "endClock": "17:00:00",
      "areaOfOutage": "Tüm bina",
      "supervisorId": 5,
      "processorSupervisor": "Ahmet Yılmaz",
      "workerChefId": 8,
      "projectId": 3,
      "pyp": "PYP-2025-001",
      "status": "ongoing",
      "isActive": true,
      "createdAt": "2025-10-28T10:00:00.000Z",
      "updatedAt": "2025-10-28T10:00:00.000Z",
      "createdBy": 11,
      "updatedBy": 11,
      "firmName": "ABC Elektrik A.Ş.",
      "processorFirmName": "XYZ Taşeron Ltd.",
      "supervisorName": "Mehmet Demir",
      "workerChefName": "Ali Kaya",
      "projectCode": "PRJ-2025-001",
      "createdByEmail": "admin@example.com",
      "updatedByEmail": "admin@example.com"
    },
    "personnels": [
      {
        "id": 10,
        "name": "Ayşe",
        "surname": "Yıldız",
        "tcNo": "12345678901"
      },
      {
        "id": 12,
        "name": "Fatma",
        "surname": "Özdemir",
        "tcNo": "12345678902"
      }
    ],
    "assets": [
      {
        "id": 25,
        "plateNumber": "34 ABC 123",
        "modelYear": 2020
      },
      {
        "id": 28,
        "plateNumber": "06 XYZ 456",
        "modelYear": 2021
      }
    ]
  }
}
```

### Hata Cevabı (404)
```json
{
  "success": false,
  "error": "OUTAGE_PROCESS_NOT_FOUND",
  "message": "Kesinti işlemi bulunamadı."
}
```

---

## 3️⃣ Yeni Kesinti İşlemi Oluşturma

### İstek (Basit - Sadece Zorunlu Alanlar)
```http
POST /api/secure/outage-processes
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "firmId": 1,
  "processorFirmId": 2,
  "startDate": "2025-10-30"
}
```

### İstek (Detaylı - Tüm Alanlar + Personel ve Araçlar)
```http
POST /api/secure/outage-processes
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "firmId": 1,
  "processorFirmId": 2,
  "causeOfOutage": "Elektrik bakımı nedeniyle planlı kesinti",
  "rootBuildName": "A Blok Ana Bina",
  "rootBuildCode": "BLD-001",
  "outputStartPoint": "Ana dağıtım panosu - 1. Kat",
  "startDate": "2025-10-30",
  "endDate": "2025-10-30",
  "startClock": "09:00:00",
  "endClock": "17:00:00",
  "areaOfOutage": "Tüm bina elektrik şebekesi",
  "supervisorId": 5,
  "processorSupervisor": "Ahmet Yılmaz",
  "workerChefId": 8,
  "projectId": 3,
  "pyp": "PYP-2025-001",
  "status": "planned",
  "isActive": true,
  "personnelIds": [10, 12, 15],
  "assetIds": [25, 28]
}
```

### Request Body Alanları
**Zorunlu:**
- `firmId` (integer) - Kesinti yapan firma ID
- `processorFirmId` (integer) - İşlemi yapan firma ID
- `startDate` (string, YYYY-MM-DD) - Başlangıç tarihi

**Opsiyonel:**
- `causeOfOutage` (string) - Kesinti nedeni
- `rootBuildName` (string, max 255) - Kök bina adı
- `rootBuildCode` (string, max 100) - Kök bina kodu
- `outputStartPoint` (string, max 255) - Başlangıç noktası
- `endDate` (string, YYYY-MM-DD) - Bitiş tarihi
- `startClock` (string, HH:MM:SS) - Başlangıç saati
- `endClock` (string, HH:MM:SS) - Bitiş saati
- `areaOfOutage` (string) - Kesinti alanı
- `supervisorId` (integer) - Denetçi personel ID
- `processorSupervisor` (string, max 255) - İşlemci denetçi
- `workerChefId` (integer) - İşçi şefi personel ID
- `projectId` (integer) - Proje ID
- `pyp` (string) - PYP bilgisi
- `status` (enum: planned/ongoing/completed/cancelled) - Durum (varsayılan: planned)
- `isActive` (boolean) - Aktif mi? (varsayılan: true)
- `personnelIds` (array of integers) - Atanacak personel ID listesi
- `assetIds` (array of integers) - Atanacak araç ID listesi

### Başarılı Cevap (201 Created)
```json
{
  "success": true,
  "message": "Kesinti işlemi başarıyla oluşturuldu.",
  "data": {
    "process": {
      "id": 2,
      "firmId": 1,
      "processorFirmId": 2,
      "causeOfOutage": "Elektrik bakımı nedeniyle planlı kesinti",
      "rootBuildName": "A Blok Ana Bina",
      "startDate": "2025-10-30",
      "endDate": "2025-10-30",
      "status": "planned",
      "createdAt": "2025-10-28T10:30:00.000Z",
      "firmName": "ABC Elektrik A.Ş.",
      "processorFirmName": "XYZ Taşeron Ltd."
    }
  }
}
```

### Hata Cevabı - Validasyon Hatası (400)
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Geçersiz veri formatı.",
  "details": [
    {
      "field": "startDate",
      "message": "Tarih YYYY-MM-DD formatında olmalıdır"
    },
    {
      "field": "firmId",
      "message": "Required"
    }
  ]
}
```

### Hata Cevabı - Foreign Key Hatası (400)
```json
{
  "success": false,
  "error": "INVALID_FIRM_ID",
  "message": "Belirtilen firma ID'si (999) bulunamadı."
}
```

---

## 4️⃣ Kesinti İşlemi Güncelleme

### İstek
```http
PUT /api/secure/outage-processes/1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "status": "completed",
  "endDate": "2025-10-30",
  "endClock": "16:30:00"
}
```

### Request Body (Tüm Alanlar Opsiyonel)
```json
{
  "causeOfOutage": "Güncel kesinti nedeni",
  "rootBuildName": "Güncel bina adı",
  "endDate": "2025-10-31",
  "endClock": "18:00:00",
  "status": "completed",
  "isActive": false
}
```

### Başarılı Cevap (200 OK)
```json
{
  "success": true,
  "message": "Kesinti işlemi başarıyla güncellendi.",
  "data": {
    "process": {
      "id": 1,
      "firmId": 1,
      "processorFirmId": 2,
      "causeOfOutage": "Elektrik bakımı",
      "startDate": "2025-10-30",
      "endDate": "2025-10-30",
      "endClock": "16:30:00",
      "status": "completed",
      "isActive": true,
      "updatedAt": "2025-10-28T10:35:00.000Z"
    }
  }
}
```

### Hata Cevabı (404)
```json
{
  "success": false,
  "error": "OUTAGE_PROCESS_NOT_FOUND",
  "message": "Güncellenecek kesinti işlemi bulunamadı."
}
```

---

## 5️⃣ Kesinti İşlemine Personel Ekle

### İstek
```http
POST /api/secure/outage-processes/1/personnels
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "personnelId": 15
}
```

### Başarılı Cevap (201 Created)
```json
{
  "success": true,
  "message": "Personel başarıyla eklendi."
}
```

### Hata Cevabı - Personel Zaten Ekli (400)
```json
{
  "success": false,
  "error": "PERSONNEL_ALREADY_ASSIGNED",
  "message": "Bu personel zaten bu kesinti işlemine atanmış."
}
```

### Hata Cevabı - Personel Bulunamadı (404)
```json
{
  "success": false,
  "error": "PERSONNEL_NOT_FOUND",
  "message": "Personel bulunamadı."
}
```

---

## 6️⃣ Kesinti İşleminden Personel Çıkar

### İstek
```http
DELETE /api/secure/outage-processes/1/personnels/15
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Başarılı Cevap (200 OK)
```json
{
  "success": true,
  "message": "Personel başarıyla çıkarıldı."
}
```

### Hata Cevabı (404)
```json
{
  "success": false,
  "error": "ASSIGNMENT_NOT_FOUND",
  "message": "Personel ataması bulunamadı."
}
```

---

## 7️⃣ Kesinti İşlemine Araç Ekle

### İstek
```http
POST /api/secure/outage-processes/1/assets
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "assetId": 30
}
```

### Başarılı Cevap (201 Created)
```json
{
  "success": true,
  "message": "Araç başarıyla eklendi."
}
```

### Hata Cevabı - Araç Zaten Ekli (400)
```json
{
  "success": false,
  "error": "ASSET_ALREADY_ASSIGNED",
  "message": "Bu araç zaten bu kesinti işlemine atanmış."
}
```

### Hata Cevabı - Araç Bulunamadı (404)
```json
{
  "success": false,
  "error": "ASSET_NOT_FOUND",
  "message": "Araç bulunamadı."
}
```

---

## 8️⃣ Kesinti İşleminden Araç Çıkar

### İstek
```http
DELETE /api/secure/outage-processes/1/assets/30
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Başarılı Cevap (200 OK)
```json
{
  "success": true,
  "message": "Araç başarıyla çıkarıldı."
}
```

### Hata Cevabı (404)
```json
{
  "success": false,
  "error": "ASSIGNMENT_NOT_FOUND",
  "message": "Araç ataması bulunamadı."
}
```

---

## 🔄 Kullanım Senaryoları

### Senaryo 1: Yeni Kesinti İşlemi Oluşturma (Tam Akış)
```bash
# 1. Kesinti işlemi oluştur
curl -X POST https://api.example.com/api/secure/outage-processes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firmId": 1,
    "processorFirmId": 2,
    "startDate": "2025-10-30",
    "status": "planned"
  }'

# Response: { "data": { "process": { "id": 5 } } }

# 2. Personel ekle
curl -X POST https://api.example.com/api/secure/outage-processes/5/personnels \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"personnelId": 10}'

# 3. Araç ekle
curl -X POST https://api.example.com/api/secure/outage-processes/5/assets \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"assetId": 25}'

# 4. Durumu güncelle
curl -X PUT https://api.example.com/api/secure/outage-processes/5 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "ongoing"}'
```

### Senaryo 2: Devam Eden Kesintileri Listele
```bash
curl -X GET "https://api.example.com/api/secure/outage-processes?status=ongoing&active=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Senaryo 3: Belirli Firmaya Ait Kesintileri Ara
```bash
curl -X GET "https://api.example.com/api/secure/outage-processes?firmId=1&search=elektrik" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📝 Notlar

1. **Tarih Formatı:** Tüm tarihler `YYYY-MM-DD` formatında
2. **Saat Formatı:** Saatler `HH:MM:SS` formatında (opsiyonel)
3. **Status Değerleri:** planned, ongoing, completed, cancelled
4. **Cascade Silme:** Ana kayıt silinirse personel ve araç atamaları otomatik silinir
5. **Unique Constraint:** Aynı personel/araç bir kesinti işlemine birden fazla kez eklenemez
6. **Audit Trail:** Tüm işlemler created_by, updated_by ile izlenir
7. **Soft Delete:** is_active=false yaparak kayıtlar pasif hale getirilir

---

## ⚠️ Önemli Güvenlik Notları

- Tüm endpoint'ler JWT authentication gerektirir
- Token'ın süresi dolmuşsa 401 Unauthorized hatası alırsınız
- Geçersiz ID'ler için 404 Not Found döner
- Validasyon hatalarında detaylı field bilgisi verilir
- Foreign key hataları açıklayıcı mesajlarla döner
