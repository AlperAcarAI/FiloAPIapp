# Filo Yönetim Sistemi - API Endpoints Listesi

Bu doküman, sistemdeki tüm API endpoint'lerinin kapsamlı bir listesini içerir.

## 🔐 Güvenlik Notu
- **Kimlik Doğrulama**: Kaldırılmış (Ocak 2025)
- **Domain Filtreleme**: Sadece `filokiapi.architectaiagency.com` domain'inden istekler kabul edilir
- **Format**: Tüm API'ler JSON formatında yanıt döner

---

## 📋 REFERANS DATA API'LER

### Ülke ve Şehir
| Method | Endpoint | Açıklama | Parametreler |
|--------|----------|----------|--------------|
| GET | `/api/getCountries` | Ülke listesi | `search`, `limit`, `offset` |

### Araç Bilgileri
| Method | Endpoint | Açıklama | Parametreler |
|--------|----------|----------|--------------|
| GET | `/api/getCarBrands` | Araç markaları | `search` |
| GET | `/api/getCarModels` | Araç modelleri | `brandId` |
| GET | `/api/getCarTypes` | Araç tipleri | - |
| GET | `/api/getOwnershipTypes` | Sahiplik türleri | - |

### Personel ve Organizasyon  
| Method | Endpoint | Açıklama | Parametreler |
|--------|----------|----------|--------------|
| GET | `/api/getPersonnelPositions` | Personel pozisyonları | - |
| GET | `/api/getPersonnel` | Personel listesi | `search`, `positionId`, `limit`, `offset` |
| GET | `/api/getWorkAreas` | Çalışma alanları | - |

### Ödeme ve Finansal
| Method | Endpoint | Açıklama | Parametreler |
|--------|----------|----------|--------------|
| GET | `/api/getPaymentMethods` | Ödeme yöntemleri | - |

### Doküman Tipleri
| Method | Endpoint | Açıklama | Parametreler |
|--------|----------|----------|--------------|
| GET | `/api/getDocMainTypes` | Döküman ana tipleri | - |
| GET | `/api/getDocSubTypes` | Döküman alt tipleri | `mainTypeId` |

### Bakım ve Cezalar
| Method | Endpoint | Açıklama | Parametreler |
|--------|----------|----------|--------------|
| GET | `/api/getMaintenanceTypes` | Bakım türleri | - |
| GET | `/api/getPenaltyTypes` | Ceza türleri | - |
| GET | `/api/getPolicyTypes` | Poliçe türleri | - |

---

## 🚗 ASSET (ARAÇ) YÖNETİMİ

| Method | Endpoint | Açıklama | Parametreler |
|--------|----------|----------|--------------|
| GET | `/api/assets` | Asset listesi | `search`, `active`, `modelId`, `companyId` |
| GET | `/api/assets/:id` | Asset detayı | `id` (path) |
| POST | `/api/assets` | Yeni asset ekleme | Request body |
| PUT | `/api/assets/:id` | Asset güncelleme | `id` (path), Request body |
| DELETE | `/api/assets/:id` | Asset silme (soft delete) | `id` (path) |

---

## 🏢 ŞİRKET YÖNETİMİ  

| Method | Endpoint | Açıklama | Parametreler |
|--------|----------|----------|--------------|
| GET | `/api/companies` | Şirket listesi | `search`, `active`, `cityId` |
| GET | `/api/companies/:id` | Şirket detayı | `id` (path) |
| POST | `/api/companies` | Yeni şirket ekleme | Request body |
| PUT | `/api/companies/:id` | Şirket güncelleme | `id` (path), Request body |
| DELETE | `/api/companies/:id` | Şirket silme (soft delete) | `id` (path) |

---

## ⛽ YAKIT YÖNETİMİ

| Method | Endpoint | Açıklama | Parametreler |
|--------|----------|----------|--------------|
| GET | `/api/fuel-records` | Yakıt kayıtları listesi | `search`, `assetId`, `startDate`, `endDate`, `gasStation`, `limit`, `offset`, `sortBy`, `sortOrder` |
| GET | `/api/fuel-records/:id` | Yakıt kaydı detayı | `id` (path) |
| POST | `/api/fuel-records` | Yeni yakıt kaydı | Request body |
| PUT | `/api/fuel-records/:id` | Yakıt kaydı güncelleme | `id` (path), Request body |
| DELETE | `/api/fuel-records/:id` | Yakıt kaydı silme | `id` (path) |

---

## 💰 FİNANSAL YÖNETİM

### Ödeme Türleri
| Method | Endpoint | Açıklama | Parametreler |
|--------|----------|----------|--------------|
| GET | `/api/financial/payment-types` | Ödeme türleri listesi | - |

### Cari Hesaplar
| Method | Endpoint | Açıklama | Parametreler |
|--------|----------|----------|--------------|
| GET | `/api/financial/current-accounts` | Cari hesap işlemleri | `page`, `limit`, `status`, `search` |
| POST | `/api/financial/current-accounts` | Yeni cari hesap işlemi | Request body |
| PUT | `/api/financial/current-accounts/:id` | Cari hesap güncelleme | `id` (path), Request body |
| DELETE | `/api/financial/current-accounts/:id` | Cari hesap silme | `id` (path) |

### Hesap Detayları
| Method | Endpoint | Açıklama | Parametreler |
|--------|----------|----------|--------------|
| GET | `/api/financial/account-details` | Hesap detayları | `accountId`, `page`, `limit` |
| POST | `/api/financial/account-details` | Yeni hesap detayı | Request body |

---

## 📄 DOKÜMAN YÖNETİMİ

| Method | Endpoint | Açıklama | Parametreler |
|--------|----------|----------|--------------|
| GET | `/api/documents` | Doküman listesi | `entityType`, `entityId`, `mainTypeId`, `page`, `limit` |
| GET | `/api/documents/:id` | Doküman detayı | `id` (path) |
| POST | `/api/documents` | Yeni doküman yükleme | Multipart form data |
| PUT | `/api/documents/:id` | Doküman güncelleme | `id` (path), Request body |
| DELETE | `/api/documents/:id` | Doküman silme | `id` (path) |
| GET | `/api/documents/:id/download` | Doküman indirme | `id` (path) |

---

## 🚐 SEFER KİRALAMA YÖNETİMİ

| Method | Endpoint | Açıklama | Parametreler |
|--------|----------|----------|--------------|
| GET | `/api/trip-rentals` | Sefer kiralamaları | `page`, `limit`, `status`, `startDate`, `endDate` |
| GET | `/api/trip-rentals/:id` | Sefer detayı | `id` (path) |
| POST | `/api/trip-rentals` | Yeni sefer kiralama | Request body |
| PUT | `/api/trip-rentals/:id` | Sefer güncelleme | `id` (path), Request body |
| DELETE | `/api/trip-rentals/:id` | Sefer silme | `id` (path) |

---

## 👥 PERSONEL YÖNETİMİ

| Method | Endpoint | Açıklama | Parametreler |
|--------|----------|----------|--------------|
| GET | `/api/backend/personnel` | Personel listesi | `page`, `limit`, `search`, `workAreaId`, `positionId`, `isActive` |
| GET | `/api/backend/personnel/:id` | Personel detayı | `id` (path) |
| POST | `/api/backend/personnel` | Yeni personel ekleme | Request body |
| PUT | `/api/backend/personnel/:id` | Personel güncelleme | `id` (path), Request body |
| DELETE | `/api/backend/personnel/:id` | Personel silme | `id` (path) |

---

## 📊 ANALİTİK VE RAPORLAMA

### Genel İstatistikler
| Method | Endpoint | Açıklama | Parametreler |
|--------|----------|----------|--------------|
| GET | `/api/analytics/stats/overview` | Genel sistem istatistikleri | - |
| GET | `/api/analytics/stats/endpoints` | Endpoint kullanım istatistikleri | - |
| GET | `/api/analytics/stats/daily` | Günlük kullanım istatistikleri | `startDate`, `endDate` |
| GET | `/api/analytics/stats/slowest` | En yavaş endpoint'ler | - |
| GET | `/api/analytics/stats/errors` | Hata istatistikleri | - |

### API Logları
| Method | Endpoint | Açıklama | Parametreler |
|--------|----------|----------|--------------|
| GET | `/api/analytics/logs` | API kullanım logları | `page`, `limit`, `endpoint`, `method`, `statusCode` |

---

## 📦 TOPLU İŞLEMLER

| Method | Endpoint | Açıklama | Parametreler |
|--------|----------|----------|--------------|
| POST | `/api/bulk-import/assets` | Toplu asset içe aktarma | CSV/Excel file |
| POST | `/api/bulk-import/personnel` | Toplu personel içe aktarma | CSV/Excel file |
| POST | `/api/bulk-import/fuel-records` | Toplu yakıt kaydı içe aktarma | CSV/Excel file |
| GET | `/api/bulk-import/template/:type` | İçe aktarma şablonu indirme | `type` (assets, personnel, fuel) |

---

## 🔐 YETKİ YÖNETİMİ

| Method | Endpoint | Açıklama | Parametreler |
|--------|----------|----------|--------------|
| GET | `/api/permission-management/users` | Kullanıcı listesi | - |
| GET | `/api/permission-management/access-levels` | Erişim seviyeleri | - |
| POST | `/api/permission-management/assign-permission` | Yetki atama | Request body |
| PUT | `/api/permission-management/update-permission/:id` | Yetki güncelleme | `id` (path), Request body |
| DELETE | `/api/permission-management/revoke-permission/:id` | Yetki iptal | `id` (path) |
| GET | `/api/permission-management/user-permissions/:userId` | Kullanıcı yetkileri | `userId` (path) |

---

## 🏠 TENANT YÖNETİMİ

| Method | Endpoint | Açıklama | Parametreler |
|--------|----------|----------|--------------|
| GET | `/api/tenant/health` | Tenant durumu | - |
| GET | `/api/tenant/info` | Tenant bilgileri | - |
| POST | `/api/tenant/create` | Yeni tenant oluşturma | Request body |
| GET | `/api/tenant/list` | Tenant listesi | - |
| PATCH | `/api/tenant/:subdomain/deactivate` | Tenant deaktivasyonu | `subdomain` (path) |

---

## 📋 API YANIT FORMATı

Tüm API'ler aşağıdaki JSON formatında yanıt döner:

### Başarılı Yanıt
```json
{
  "success": true,
  "message": "İşlem açıklaması",
  "data": {
    // Dönen veri
  }
}
```

### Hata Yanıtı
```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Hata açıklaması",
  "details": {
    // Detaylı hata bilgisi (opsiyonel)
  }
}
```

### Sayfalama ile Yanıt
```json
{
  "success": true,
  "message": "İşlem açıklaması",
  "data": [],
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "totalRecords": 100,
    "limit": 10,
    "offset": 0
  }
}
```

---

## 🔄 GÜNCELLEMELER

**Son Güncelleme**: Ocak 2025
- Tüm kimlik doğrulama endpoint'leri kaldırıldı
- Domain filtreleme aktif (filokiapi.architectaiagency.com)
- JSON yanıt formatına geçildi
- Eksik referans data API'leri eklendi

**Toplam Endpoint Sayısı**: ~90+ endpoint