# Personel Çalışma Alanı API Dokümantasyonu

## Genel Bakış

Bu API, `personnel_work_areas` tablosuna doğrudan erişim sağlar ve personel çalışma alanı atamalarını yönetir. API, JWT authentication ve hiyerarşik yetkilendirme kullanır.

## Endpoint'ler

### 1. Personel Çalışma Alanı Atamaları Listesi

**Endpoint:** `GET /api/secure/personnel-work-areas`

**Açıklama:** Tüm personel çalışma alanı atamalarını listeler (join bilgileri ile birlikte)

**Query Parametreleri:**
- `personnelId` (isteğe bağlı): Belirli personelin atamalarını filtrelemek için
- `workAreaId` (isteğe bağlı): Belirli çalışma alanının atamalarını filtrelemek için  
- `projectId` (isteğe bağlı): Belirli projenin atamalarını filtrelemek için
- `active` (isteğe bağlı): Sadece aktif atamaları getirmek için (true/false)
- `limit` (isteğe bağlı): Sayfa başına kayıt sayısı (varsayılan: 50)
- `offset` (isteğe bağlı): Sayfalama için offset değeri (varsayılan: 0)

**Örnek İstek:**
```bash
curl -X GET "http://localhost:5000/api/secure/personnel-work-areas?personnelId=1&limit=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Örnek Yanıt:**
```json
{
  "success": true,
  "message": "Personel çalışma alanı atamaları başarıyla getirildi.",
  "data": {
    "assignments": [
      {
        "id": 1,
        "personnelId": 1,
        "workAreaId": 1,
        "positionId": 1,
        "projectId": 3,
        "startDate": "2025-01-15",
        "endDate": null,
        "isActive": true,
        "createdAt": "2025-08-16T15:59:51.732Z",
        "updatedAt": "2025-08-16T15:59:51.732Z",
        "personnelName": "API Test Personeli",
        "personnelTcNo": "99887766554",
        "workAreaName": "Güncellenen Test Alanı",
        "positionName": "Filo Yöneticisi",
        "projectCode": "PRJ-2025-001"
      }
    ],
    "totalCount": 1,
    "limit": 50,
    "offset": 0
  }
}
```

### 2. Personel Çalışma Alanı Ataması Detayı

**Endpoint:** `GET /api/secure/personnel-work-areas/{id}`

**Açıklama:** Belirli bir personel çalışma alanı atamasının detaylı bilgilerini getirir

**Path Parametreleri:**
- `id` (zorunlu): Personel çalışma alanı ataması ID

**Örnek İstek:**
```bash
curl -X GET "http://localhost:5000/api/secure/personnel-work-areas/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Örnek Yanıt:**
```json
{
  "success": true,
  "message": "Personel çalışma alanı ataması detayı başarıyla getirildi.",
  "data": {
    "assignment": {
      "id": 1,
      "personnelId": 1,
      "workAreaId": 1,
      "positionId": 1,
      "projectId": 3,
      "startDate": "2025-01-15",
      "endDate": null,
      "isActive": true,
      "createdAt": "2025-08-16T15:59:51.732Z",
      "updatedAt": "2025-08-16T15:59:51.732Z",
      "personnelName": "API Test Personeli",
      "personnelTcNo": "99887766554",
      "personnelPhone": "05551234567",
      "personnelIban": null,
      "workAreaName": "Güncellenen Test Alanı",
      "workAreaAddress": "Güncellenen Adres",
      "positionName": "Filo Yöneticisi",
      "projectCode": "PRJ-2025-001",
      "projectStatus": "active"
    }
  }
}
```

## Güvenlik

- **Authentication:** JWT Bearer token gerekli
- **Authorization:** Hiyerarşik çalışma alanı filtreleme aktif
- **Work Area Filtering:** Kullanıcı sadece yetkili olduğu çalışma alanlarının verilerini görebilir

## Hata Kodları

- `401`: Geçersiz veya eksik JWT token
- `403`: Yetkisiz erişim (çalışma alanı yetkisi yok)
- `404`: Atama bulunamadı (detail endpoint için)
- `500`: Sunucu hatası

## Özellikler

### Gelişmiş Filtreleme
- Personel ID'ye göre filtreleme
- Çalışma alanı ID'ye göre filtreleme
- Proje ID'ye göre filtreleme
- Aktif/pasif durum filtreleme

### Join Verileri
- Personel adı ve soyadı (birleştirilmiş)
- Personel TC kimlik numarası
- Personel telefon ve IBAN bilgileri (detay endpoint'inde)
- Çalışma alanı adı ve adresi
- Pozisyon adı
- Proje kodu ve durumu

### Sayfalama
- Limit ve offset desteği
- Toplam kayıt sayısı bilgisi

## Teknik Detaylar

- **Database:** PostgreSQL
- **ORM:** Drizzle ORM
- **Join Strategy:** LEFT JOIN (tüm atamalar gösterilir, ilişkili veriler null olabilir)
- **Ordering:** Oluşturulma tarihine göre azalan sırada (en yeni önce)
- **BigInt Handling:** TC numaraları string'e dönüştürülür

## Test Edilmiş Senaryolar

✅ Personel ID'ye göre filtreleme  
✅ Çalışma alanı bazlı yetkilendirme  
✅ Sayfalama işlemleri  
✅ Detail endpoint erişimi  
✅ Join verileri çekimi  
✅ BigInt serialization  

## İlgili Dosyalar

- `server/personnel-work-areas-routes.ts` - Ana route implementasyonu
- `shared/schema.ts` - Database schema tanımları
- `server/hierarchical-auth.ts` - Yetkilendirme middleware'i
- `server/routes.ts` - Route kayıt işlemleri

## Geliştirme Notları

- API basitlik için kompleks şirket join'leri çıkarılmıştır
- Swagger dokümantasyonu dahil edilmiştir
- Error handling Turkish mesajlar içerir
- Hiyerarşik yetkilendirme sistemi ile entegre edilmiştir

## Tarih

**Oluşturulma:** 18 Ağustos 2025  
**Son Güncelleme:** 18 Ağustos 2025