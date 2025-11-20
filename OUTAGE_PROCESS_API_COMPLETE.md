# Kesinti İşlemleri API Dokümantasyonu

## 🔐 Authentication
Tüm endpoint'ler JWT Bearer Token ile korunmaktadır.

**Header:**
```
Authorization: Bearer <your_jwt_token>
```

---

## 1️⃣ Kesinti İşlemlerini Listele

### Endpoint
```
GET /api/secure/outage-processes
```

### Query Parametreleri
| Parametre | Tip | Zorunlu | Açıklama |
|-----------|-----|---------|----------|
| search | string | Hayır | Kesinti nedeni, bina adı veya kodu ile arama |
| status | string | Hayır | planned, ongoing, completed, cancelled |
| firmId | integer | Hayır | Firma ID'ye göre filtre |
| processorFirmId | integer | Hayır | İşlemci firma ID'ye göre filtre |
| pypId | integer | Hayır | PYP ID'ye göre filtre |
| active | boolean | Hayır | true/false - Sadece aktif/pasif kayıtlar |
| limit | integer | Hayır | Sayfa başına kayıt (varsayılan: 50) |
| offset | integer | Hayır | Sayfalama başlangıcı (varsayılan: 0) |

### İstek Örnekleri

**Basit Listeleme:**
```bash
GET /api/secure/outage-processes
```

**Filtreleme ile:**
```bash
GET /api/secure/outage-processes?status=ongoing&firmId=5&limit=20
```

**Arama ile:**
```bash
GET /api/secure/outage-processes?search=bakım&active=true
```

**PYP Filtresi ile:**
```bash
GET /api/secure/outage-processes?pypId=12&limit=10&offset=0
```

### Başarılı Cevap (200 OK)
```json
{
  "success": true,
  "message": "Kesinti işlemleri başarıyla getirildi.",
  "data": {
    "outageProcesses": [
      {
        "id": 1,
        "firmId": 5,
        "processorFirmId": 8,
        "causeOfOutage": "Planlı bakım çalışması",
        "rootBuildName": "Ana Transformatör Merkezi",
        "rootBuildCode": "TM-001",
        "outputStartPoint": "A Bloğu",
        "startDate": "2025-11-20",
        "endDate": "2025-11-20",
        "startClock": "09:00:00",
        "endClock": "17:00:00",
        "areaOfOutage": "Merkez bölge",
        "supervisorId": 15,
        "processorSupervisor": "Ahmet Yılmaz",
        "workerChefId": 20,
        "pypId": 12,
        "pypCode": "PYP-2025-001",
        "pypName": "Merkez Bölge PYP",
        "status": "ongoing",
        "isActive": true,
        "createdAt": "2025-11-19T12:30:00.000Z",
        "updatedAt": "2025-11-19T14:15:00.000Z",
        "firmName": "ABC Elektrik A.Ş.",
        "processorFirmName": "XYZ Taşeron Ltd.",
        "supervisorName": "Mehmet Demir",
        "workerChefName": "Ali Kaya",
        "projectCode": "PROJ-2025-01",
        "projectName": "PROJ-2025-01",
        "createdByEmail": "admin@example.com",
        "updatedByEmail": "operator@example.com"
      }
    ],
    "totalCount": 1,
    "limit": 50,
    "offset": 0
  }
}
```

### Hata Cevapları

**401 Unauthorized:**
```json
{
  "success": false,
  "error": "UNAUTHORIZED",
  "message": "Geçersiz veya eksik token."
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "error": "OUTAGE_PROCESSES_FETCH_ERROR",
  "message": "Kesinti işlemleri getirilirken hata oluştu."
}
```

---

## 2️⃣ Kesinti İşlemi Detayı

### Endpoint
```
GET /api/secure/outage-processes/:id
```

### URL Parametreleri
| Parametre | Tip | Zorunlu | Açıklama |
|-----------|-----|---------|----------|
| id | integer | Evet | Kesinti işlem ID |

### İstek Örneği
```bash
GET /api/secure/outage-processes/1
```

### Başarılı Cevap (200 OK)
```json
{
  "success": true,
  "message": "Kesinti işlemi detayı başarıyla getirildi.",
  "data": {
    "process": {
      "id": 1,
      "firmId": 5,
      "processorFirmId": 8,
      "causeOfOutage": "Planlı bakım çalışması",
      "rootBuildName": "Ana Transformatör Merkezi",
      "rootBuildCode": "TM-001",
      "outputStartPoint": "A Bloğu",
      "startDate": "2025-11-20",
      "endDate": "2025-11-20",
      "startClock": "09:00:00",
      "endClock": "17:00:00",
      "areaOfOutage": "Merkez bölge",
      "supervisorId": 15,
      "processorSupervisor": "Ahmet Yılmaz",
      "workerChefId": 20,
      "pypId": 12,
      "pypCode": "PYP-2025-001",
      "pypName": "Merkez Bölge PYP",
      "status": "ongoing",
      "isActive": true,
      "createdAt": "2025-11-19T12:30:00.000Z",
      "updatedAt": "2025-11-19T14:15:00.000Z",
      "createdBy": 1,
      "updatedBy": 2,
      "firmName": "ABC Elektrik A.Ş.",
      "processorFirmName": "XYZ Taşeron Ltd.",
      "supervisorName": "Mehmet Demir",
      "workerChefName": "Ali Kaya",
      "projectCode": "PROJ-2025-01",
      "createdByEmail": "admin@example.com",
      "updatedByEmail": "operator@example.com"
    },
    "personnels": [
      {
        "id": 25,
        "name": "Ahmet",
        "surname": "Yılmaz",
        "tcNo": "12345678901"
      },
      {
        "id": 30,
        "name": "Mehmet",
        "surname": "Kara",
        "tcNo": "98765432101"
      }
    ],
    "assets": [
      {
        "id": 10,
        "plateNumber": "34 ABC 123",
        "modelYear": 2020
      },
      {
        "id": 15,
        "plateNumber": "06 XYZ 456",
        "modelYear": 2019
      }
    ]
  }
}
```

### Hata Cevapları

**404 Not Found:**
```json
{
  "success": false,
  "error": "OUTAGE_PROCESS_NOT_FOUND",
  "message": "Kesinti işlemi bulunamadı."
}
```

---

## 3️⃣ Yeni Kesinti İşlemi Oluşturma

### Endpoint
```
POST /api/secure/outage-processes
```

### İstek Body
```json
{
  "firmId": 5,
  "processorFirmId": 8,
  "causeOfOutage": "Planlı bakım çalışması",
  "rootBuildName": "Ana Transformatör Merkezi",
  "rootBuildCode": "TM-001",
  "outputStartPoint": "A Bloğu",
  "startDate": "2025-11-20",
  "endDate": "2025-11-20",
  "startClock": "09:00:00",
  "endClock": "17:00:00",
  "areaOfOutage": "Merkez bölge",
  "supervisorId": 15,
  "processorSupervisor": "Ahmet Yılmaz",
  "workerChefId": 20,
  "pypId": 12,
  "status": "planned",
  "coordinatX": "41.0082",
  "coordinatY": "28.9784",
  "personnelIds": [25, 30, 35],
  "assetIds": [10, 15]
}
```

### Zorunlu Alanlar
- `firmId` (integer)
- `processorFirmId` (integer)
- `startDate` (string, YYYY-MM-DD)

### Opsiyonel Alanlar
- `causeOfOutage` (string)
- `rootBuildName` (string)
- `rootBuildCode` (string)
- `outputStartPoint` (string)
- `endDate` (string, YYYY-MM-DD)
- `startClock` (string, HH:MM:SS)
- `endClock` (string, HH:MM:SS)
- `areaOfOutage` (text)
- `supervisorId` (integer)
- `processorSupervisor` (string)
- `workerChefId` (integer)
- `pypId` (integer)
- `status` (string: planned/ongoing/completed/cancelled)
- `coordinatX` (string)
- `coordinatY` (string)
- `personnelIds` (integer array) - Toplu personel atama
- `assetIds` (integer array) - Toplu araç atama

### Başarılı Cevap (201 Created)
```json
{
  "success": true,
  "message": "Kesinti işlemi başarıyla oluşturuldu.",
  "data": {
    "process": {
      "id": 15,
      "firmId": 5,
      "processorFirmId": 8,
      "causeOfOutage": "Planlı bakım çalışması",
      "rootBuildName": "Ana Transformatör Merkezi",
      "startDate": "2025-11-20",
      "endDate": "2025-11-20",
      "status": "planned",
      "createdAt": "2025-11-19T16:45:00.000Z",
      "firmName": "ABC Elektrik A.Ş.",
      "processorFirmName": "XYZ Taşeron Ltd."
    }
  }
}
```

### Hata Cevapları

**400 Bad Request - Validasyon Hatası:**
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Geçersiz veri formatı.",
  "details": [
    {
      "field": "startDate",
      "message": "Tarih YYYY-MM-DD formatında olmalıdır"
    }
  ]
}
```

**400 Bad Request - Geçersiz Firma:**
```json
{
  "success": false,
  "error": "INVALID_FIRM_ID",
  "message": "Belirtilen firma ID'si (999) bulunamadı."
}
```

**400 Bad Request - Geçersiz PYP:**
```json
{
  "success": false,
  "error": "INVALID_PYP_ID",
  "message": "Belirtilen PYP ID'si (50) bulunamadı."
}
```

---

## 4️⃣ Kesinti İşlemi Güncelleme

### Endpoint
```
PUT /api/secure/outage-processes/:id
```

### URL Parametreleri
| Parametre | Tip | Zorunlu | Açıklama |
|-----------|-----|---------|----------|
| id | integer | Evet | Kesinti işlem ID |

### İstek Body (Partial Update)
```json
{
  "status": "completed",
  "endDate": "2025-11-20",
  "endClock": "16:30:00",
  "areaOfOutage": "Güncellenmiş alan bilgisi"
}
```

### Güncellenebilir Alanlar
Tüm alanlar opsiyoneldir (partial update):
- `status` (string)
- `endDate` (string)
- `endClock` (string)
- `causeOfOutage` (string)
- `rootBuildName` (string)
- `rootBuildCode` (string)
- `areaOfOutage` (string)
- `pypId` (integer)
- `isActive` (boolean)
- vb.

### Başarılı Cevap (200 OK)
```json
{
  "success": true,
  "message": "Kesinti işlemi başarıyla güncellendi.",
  "data": {
    "process": {
      "id": 1,
      "firmId": 5,
      "processorFirmId": 8,
      "causeOfOutage": "Planlı bakım çalışması",
      "rootBuildName": "Ana Transformatör Merkezi",
      "status": "completed",
      "endDate": "2025-11-20",
      "endClock": "16:30:00",
      "areaOfOutage": "Güncellenmiş alan bilgisi",
      "updatedAt": "2025-11-19T17:00:00.000Z",
      "isActive": true
    }
  }
}
```

### Hata Cevapları

**404 Not Found:**
```json
{
  "success": false,
  "error": "OUTAGE_PROCESS_NOT_FOUND",
  "message": "Güncellenecek kesinti işlemi bulunamadı."
}
```

**400 Bad Request - Geçersiz PYP:**
```json
{
  "success": false,
  "error": "INVALID_PYP_ID",
  "message": "Belirtilen PYP ID'si (99) bulunamadı."
}
```

---

## 5️⃣ Kesinti İşlemine Personel Ekle

### Endpoint
```
POST /api/secure/outage-processes/:id/personnels
```

### URL Parametreleri
| Parametre | Tip | Zorunlu | Açıklama |
|-----------|-----|---------|----------|
| id | integer | Evet | Kesinti işlem ID |

### İstek Body
```json
{
  "personnelId": 25
}
```

### Başarılı Cevap (201 Created)
```json
{
  "success": true,
  "message": "Personel başarıyla eklendi."
}
```

### Hata Cevapları

**400 Bad Request - Zaten Atanmış:**
```json
{
  "success": false,
  "error": "PERSONNEL_ALREADY_ASSIGNED",
  "message": "Bu personel zaten bu kesinti işlemine atanmış."
}
```

**404 Not Found - İşlem Bulunamadı:**
```json
{
  "success": false,
  "error": "OUTAGE_PROCESS_NOT_FOUND",
  "message": "Kesinti işlemi bulunamadı."
}
```

**404 Not Found - Personel Bulunamadı:**
```json
{
  "success": false,
  "error": "PERSONNEL_NOT_FOUND",
  "message": "Personel bulunamadı."
}
```

---

## 6️⃣ Kesinti İşleminden Personel Çıkar

### Endpoint
```
DELETE /api/secure/outage-processes/:id/personnels/:personnelId
```

### URL Parametreleri
| Parametre | Tip | Zorunlu | Açıklama |
|-----------|-----|---------|----------|
| id | integer | Evet | Kesinti işlem ID |
| personnelId | integer | Evet | Personel ID |

### İstek Örneği
```bash
DELETE /api/secure/outage-processes/1/personnels/25
```

### Başarılı Cevap (200 OK)
```json
{
  "success": true,
  "message": "Personel başarıyla çıkarıldı."
}
```

### Hata Cevapları

**404 Not Found:**
```json
{
  "success": false,
  "error": "ASSIGNMENT_NOT_FOUND",
  "message": "Personel ataması bulunamadı."
}
```

---

## 7️⃣ Kesinti İşlemine Araç Ekle

### Endpoint
```
POST /api/secure/outage-processes/:id/assets
```

### URL Parametreleri
| Parametre | Tip | Zorunlu | Açıklama |
|-----------|-----|---------|----------|
| id | integer | Evet | Kesinti işlem ID |

### İstek Body
```json
{
  "assetId": 10
}
```

### Başarılı Cevap (201 Created)
```json
{
  "success": true,
  "message": "Araç başarıyla eklendi."
}
```

### Hata Cevapları

**400 Bad Request - Zaten Atanmış:**
```json
{
  "success": false,
  "error": "ASSET_ALREADY_ASSIGNED",
  "message": "Bu araç zaten bu kesinti işlemine atanmış."
}
```

**404 Not Found - İşlem Bulunamadı:**
```json
{
  "success": false,
  "error": "OUTAGE_PROCESS_NOT_FOUND",
  "message": "Kesinti işlemi bulunamadı."
}
```

**404 Not Found - Araç Bulunamadı:**
```json
{
  "success": false,
  "error": "ASSET_NOT_FOUND",
  "message": "Araç bulunamadı."
}
```

---

## 8️⃣ Kesinti İşleminden Araç Çıkar

### Endpoint
```
DELETE /api/secure/outage-processes/:id/assets/:assetId
```

### URL Parametreleri
| Parametre | Tip | Zorunlu | Açıklama |
|-----------|-----|---------|----------|
| id | integer | Evet | Kesinti işlem ID |
| assetId | integer | Evet | Araç ID |

### İstek Örneği
```bash
DELETE /api/secure/outage-processes/1/assets/10
```

### Başarılı Cevap (200 OK)
```json
{
  "success": true,
  "message": "Araç başarıyla çıkarıldı."
}
```

### Hata Cevapları

**404 Not Found:**
```json
{
  "success": false,
  "error": "ASSIGNMENT_NOT_FOUND",
  "message": "Araç ataması bulunamadı."
}
```

---

## 🔄 Kullanım Senaryoları

### Senaryo 1: Yeni Kesinti İşlemi Oluşturma

```javascript
// 1. Kesinti işlemi oluştur
POST /api/secure/outage-processes
{
  "firmId": 5,
  "processorFirmId": 8,
  "startDate": "2025-11-20",
  "pypId": 12,
  "status": "planned"
}

// 2. Personel ekle
POST /api/secure/outage-processes/15/personnels
{ "personnelId": 25 }

POST /api/secure/outage-processes/15/personnels
{ "personnelId": 30 }

// 3. Araç ekle
POST /api/secure/outage-processes/15/assets
{ "assetId": 10 }
```

### Senaryo 2: Toplu Atama ile Oluşturma

```javascript
// Tek istekle personel ve araç ataması
POST /api/secure/outage-processes
{
  "firmId": 5,
  "processorFirmId": 8,
  "startDate": "2025-11-20",
  "pypId": 12,
  "personnelIds": [25, 30, 35],
  "assetIds": [10, 15]
}
```

### Senaryo 3: Kesinti İşlemi Tamamlama

```javascript
// Durumu güncelle
PUT /api/secure/outage-processes/15
{
  "status": "completed",
  "endDate": "2025-11-20",
  "endClock": "17:00:00"
}
```

---

## 📝 Notlar

1. **Tarih Formatı:** Tüm tarihler `YYYY-MM-DD` formatında olmalıdır
2. **Saat Formatı:** Saatler `HH:MM:SS` formatında olmalıdır
3. **Durum Değerleri:** `planned`, `ongoing`, `completed`, `cancelled`
4. **PYP İlişkisi:** PYP ID kullanılarak proje bilgisine dolaylı erişim sağlanır
5. **Toplu Atama:** `personnelIds` ve `assetIds` ile tek istekte çoklu atama yapılabilir
6. **Unique Constraint:** Aynı personel veya araç bir kesinti işleminde birden fazla kez atanamaz
7. **Koordinatlar:** `coordinatX` ve `coordinatY` opsiyonel koordinat bilgileri
