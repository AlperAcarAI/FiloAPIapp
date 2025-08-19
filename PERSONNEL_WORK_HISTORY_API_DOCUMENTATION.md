# Personel Çalışma Geçmişi API Dokümantasyonu

## Genel Bakış

Bu API, personelin tüm çalışma geçmişini kronolojik olarak listeler ve detaylı istatistikler sunar. Her personelin hangi tarihlerde, hangi şantiyelerde (çalışma alanları) ve projelerde çalıştığını gösterir.

## Endpoint'ler

### 1. Personel Çalışma Geçmişi

**Endpoint:** `GET /api/secure/personnel-work-history/{personnelId}`

**Açıklama:** Belirli bir personelin tüm çalışma geçmişini kronolojik olarak listeler

**Path Parametreleri:**
- `personnelId` (zorunlu): Herhangi bir geçerli personel ID (örnek: 1, 3, 19, 123)

**Query Parametreleri:**
- `includeActive` (isteğe bağlı): Aktif atamaları da dahil et (varsayılan: true)
- `limit` (isteğe bağlı): Maksimum kayıt sayısı (varsayılan: 100)

**Örnek İstek:**
```bash
curl -X GET "http://localhost:5000/api/secure/personnel-work-history/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Örnek Yanıt:**
```json
{
  "success": true,
  "message": "Personel çalışma geçmişi başarıyla getirildi.",
  "data": {
    "personnel": {
      "id": 1,
      "name": "API Test",
      "surname": "Personeli",
      "fullName": "API Test Personeli",
      "tcNo": "99887766554"
    },
    "summary": {
      "totalAssignments": 1,
      "activeAssignments": 1,
      "completedAssignments": 0,
      "uniqueWorkAreas": 1,
      "uniqueProjects": 1,
      "totalWorkDays": 217,
      "earliestStartDate": "2025-01-15",
      "latestEndDate": null
    },
    "workHistory": [
      {
        "assignmentId": 1,
        "startDate": "2025-01-15",
        "endDate": null,
        "isActive": true,
        "createdAt": "2025-08-16T15:59:51.732Z",
        "workAreaId": 1,
        "workAreaName": "Güncellenen Test Alanı",
        "workAreaAddress": "Güncellenen Adres",
        "workAreaStartDate": "2025-01-01",
        "workAreaEndDate": "2025-12-31",
        "cityName": "Adana",
        "positionId": 1,
        "positionName": "Filo Yöneticisi",
        "projectId": 3,
        "projectCode": "PRJ-2025-001",
        "projectStatus": "active",
        "projectStartDate": "2025-01-01",
        "projectEndDate": "2025-12-31",
        "projectTotalPrice": "1500000.00",
        "projectCompleteRate": "25.50",
        "poCompanyId": 1,
        "ppCompanyId": 1,
        "workDurationDays": 217
      }
    ],
    "workAreaGroups": [
      {
        "workAreaId": 1,
        "workAreaName": "Güncellenen Test Alanı",
        "workAreaAddress": "Güncellenen Adres",
        "cityName": "Adana",
        "assignments": [
          {
            "assignmentId": 1,
            "startDate": "2025-01-15",
            "endDate": null,
            "isActive": true,
            "createdAt": "2025-08-16T15:59:51.732Z",
            "workAreaId": 1,
            "workAreaName": "Güncellenen Test Alanı",
            "workAreaAddress": "Güncellenen Adres",
            "workAreaStartDate": "2025-01-01",
            "workAreaEndDate": "2025-12-31",
            "cityName": "Adana",
            "positionId": 1,
            "positionName": "Filo Yöneticisi",
            "projectId": 3,
            "projectCode": "PRJ-2025-001",
            "projectStatus": "active",
            "projectStartDate": "2025-01-01",
            "projectEndDate": "2025-12-31",
            "projectTotalPrice": "1500000.00",
            "projectCompleteRate": "25.50",
            "poCompanyId": 1,
            "ppCompanyId": 1,
            "workDurationDays": 217
          }
        ]
      }
    ],
    "totalRecords": 1,
    "filters": {
      "includeActive": true,
      "limit": 100
    }
  }
}
```

### 2. Personel Çalışma Geçmişi Özeti

**Endpoint:** `GET /api/secure/personnel-work-history-summary/{personnelId}`

**Açıklama:** Personelin çalışma geçmişinin özet istatistiklerini getirir

**Path Parametreleri:**
- `personnelId` (zorunlu): Herhangi bir geçerli personel ID (örnek: 1, 3, 19, 123)

**Örnek İstek:**
```bash
curl -X GET "http://localhost:5000/api/secure/personnel-work-history-summary/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Örnek Yanıt:**
```json
{
  "success": true,
  "message": "Personel çalışma geçmişi özeti başarıyla getirildi.",
  "data": {
    "summary": {
      "totalAssignments": "1",
      "activeAssignments": "1",
      "completedAssignments": "0",
      "uniqueWorkAreas": "1",
      "uniqueProjects": "1",
      "totalWorkDays": "217",
      "earliestStartDate": "2025-01-15",
      "latestEndDate": null
    }
  }
}
```

## Özellikler

### 📊 Kapsamlı İstatistikler
- **Toplam Atama Sayısı**: Personelin toplam iş ataması sayısı
- **Aktif/Tamamlanan Atamalar**: Devam eden ve bitmiş atamalar
- **Benzersiz Çalışma Alanları**: Kaç farklı şantiyede çalıştığı
- **Benzersiz Projeler**: Kaç farklı projede yer aldığı
- **Toplam Çalışma Günü**: Tüm atamalardaki toplam gün sayısı
- **İlk/Son Çalışma Tarihleri**: Kariyer başlangıç ve bitiş tarihleri

### 🏗️ Şantiye ve Proje Detayları
- **Çalışma Alanı Bilgileri**: Şantiye adı, adresi, şehir bilgisi
- **Proje Detayları**: Proje kodu, durumu, başlangıç/bitiş tarihleri
- **Finansal Bilgiler**: Proje toplam değeri, tamamlanma oranı
- **Şirket Bilgileri**: PO (ana yüklenici) ve PP (alt yüklenici) şirket ID'leri

### 📅 Zaman Analizi
- **Çalışma Süresi Hesaplama**: Her atama için otomatik gün hesaplama
- **Aktif Atama Desteği**: Devam eden atamalar için güncel tarihe kadar hesaplama
- **Kronolojik Sıralama**: En yeni atamalardan eskiye doğru sıralama

### 🗂️ Gruplandırma
- **Çalışma Alanına Göre Gruplandırma**: Aynı şantiyedeki tüm atamalar birlikte
- **Hiyerarşik Veri Yapısı**: Hem liste hem de gruplandırılmış görünüm

## Güvenlik ve Yetkilendirme

- **JWT Authentication**: Bearer token ile kimlik doğrulama
- **Hiyerarşik Filtreleme**: Kullanıcı sadece yetkili olduğu çalışma alanlarını görebilir
- **Personel Varlık Kontrolü**: Geçersiz personel ID'leri için 404 hatası

## Hata Kodları

- `404`: Personel bulunamadı veya çalışma geçmişi yok
- `401`: Geçersiz veya eksik JWT token
- `403`: Yetkisiz erişim (çalışma alanı yetkisi yok)
- `500`: Sunucu hatası

## Kullanım Senaryoları

### 1. Herhangi Bir Personelin Çalışma Geçmişi
```bash
# 19 ID'li personelin çalışma geçmişi
curl -X GET "http://localhost:5000/api/secure/personnel-work-history/19" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 1 ID'li personelin çalışma geçmişi  
curl -X GET "http://localhost:5000/api/secure/personnel-work-history/1" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3 ID'li personelin çalışma geçmişi
curl -X GET "http://localhost:5000/api/secure/personnel-work-history/3" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. İnsan Kaynakları Analizi
```bash
# Personelin toplam deneyimini analiz et
curl -X GET "http://localhost:5000/api/secure/personnel-work-history-summary/19" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Proje Geçmişi İnceleme
```bash
# Personelin hangi projelerde çalıştığını gör
curl -X GET "http://localhost:5000/api/secure/personnel-work-history/19?includeActive=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Şantiye Deneyimi Değerlendirmesi
```bash
# Sadece tamamlanmış atamaları gör
curl -X GET "http://localhost:5000/api/secure/personnel-work-history/19?includeActive=false" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. Dinamik Personel Sorgulama
```bash
# Herhangi bir personel ID'si ile çalışır
PERSONNEL_ID=123
curl -X GET "http://localhost:5000/api/secure/personnel-work-history/${PERSONNEL_ID}" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Teknik Detaylar

- **Database Joins**: personnel_work_areas, personnel, work_areas, cities, personnel_positions, projects
- **Hesaplama**: PostgreSQL DATE arithmetic ile gün hesaplama
- **Sıralama**: Start date DESC, created_at DESC
- **Performans**: Index'li sorgular ve pagination desteği

## Test Edilmiş Senaryolar

✅ **Dinamik Personel ID**: API herhangi bir personel ID'si ile çalışır  
✅ **Personel ID 1**: Çalışma geçmişi var - tam veri dönüşü  
✅ **Personel ID 3**: Personel var ama çalışma geçmişi yok - boş array  
✅ **Personel ID 19**: Personel bulunamadı - 404 hatası  
✅ **Özet İstatistikler**: Toplam atama, gün, şantiye, proje sayısı hesaplama  
✅ **Aktif/Pasif Atama Filtreleme**: includeActive parametresi  
✅ **Çalışma Günü Hesaplama**: Otomatik tarih aritmetiği  
✅ **Hiyerarşik Yetkilendirme**: JWT ve çalışma alanı filtreleme  
✅ **Şantiye ve Proje Detayları**: Join'li tam veri  

## İlgili Dosyalar

- `server/personnel-work-history-routes.ts` - Ana API implementasyonu
- `shared/schema.ts` - Database schema tanımları
- `server/hierarchical-auth.ts` - Yetkilendirme middleware'i
- `server/routes.ts` - Route kayıt işlemleri

## Geliştirme Notları

- **Karmaşık Join'ler**: Şirket bilgileri için basitleştirilmiş yaklaşım
- **BigInt Handling**: TC numaraları string'e dönüştürülür
- **Null Handling**: Projesi olmayan atamalar için null değer desteği
- **TypeScript**: Full type safety ile geliştirilmiştir

Bu API, personel yönetimi ve proje takibi için kritik veri sağlar ve şirketlerin insan kaynakları analizlerinde önemli rol oynar.

## Tarih

**Oluşturulma:** 18 Ağustos 2025  
**Son Test:** 18 Ağustos 2025  
**Test Sonucu:** ✅ Başarılı