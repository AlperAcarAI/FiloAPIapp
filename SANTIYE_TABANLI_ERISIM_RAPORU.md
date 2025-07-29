# Şantiye Tabanlı Erişim Kontrolü Raporu

## Senaryo Analizi

**Kullanıcı Profili:** X şantiyesinde çalışan personel
**İhtiyaç:** Sadece kendi şantiyesindeki personel ve araçlarla ilgili işlemleri yapabilme

## Mevcut Sistem Analizi

### ✅ Mevcut Güçlü Yönler
- **API Key Tabanlı Güvenlik:** Her kullanıcının kendi API anahtarı var
- **İzin Sistemi:** Granüler izin kontrolü (data:read, data:write, fleet:read vb.)
- **Personel Yönetimi:** Personnel tablosu mevcut
- **Araç Yönetimi:** Assets tablosu mevcut
- **Şirket Yapısı:** Companies tablosu ile organizasyon desteği

### ❌ Eksik Özellikler
- **Coğrafi/Lokasyon Bazlı Filtreleme:** Şantiye bilgisi yok
- **Kullanıcı-Şantiye İlişkisi:** Personelin hangi şantiyede çalıştığı belirtilmemiş
- **Araç-Şantiye Ataması:** Araçların hangi şantiyede kullanıldığı bilinmiyor
- **API Filtreleme:** Şantiye bazlı veri filtrelemesi yok

### 🔍 Mevcut İlişki Tabloları (Kısmen Kullanılabilir)
- **work_areas tablosu:** Çalışma alanları tanımlı (şantiye benzeri)
- **personnel_work_areas tablosu:** Personel-çalışma alanı ilişkisi mevcut
- **assets_personel_assignment tablosu:** Araç-personel ataması var
- Bu tablolar üzerinden **kısmi çözüm** geliştirilebilir

## Çözüm Alternatifleri

### 🚀 Alternatif 1: Mevcut work_areas Tablosunu Kullanma (Hızlı Çözüm)

#### Avantajlar:
- **work_areas** zaten şantiye benzeri yapı
- **personnel_work_areas** ilişkisi mevcut
- Sadece API filtreleme ve güvenlik eklenmesi yeterli

#### Gerekli Güncellemeler:
```sql
-- API Keys tablosuna çalışma alanı kısıtlaması
ALTER TABLE api_keys
ADD COLUMN work_area_restrictions INTEGER[] DEFAULT NULL;

-- Assets tablosuna aktif çalışma alanı
ALTER TABLE assets
ADD COLUMN current_work_area_id INTEGER REFERENCES work_areas(id);
```

### 🏗️ Alternatif 2: Yeni Şantiye Sistemi (Kapsamlı Çözüm)

#### A) Şantiye Tablosu (worksites)
```sql
CREATE TABLE worksites (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  code VARCHAR(20) UNIQUE,
  address TEXT,
  city_id INTEGER REFERENCES cities(id),
  company_id INTEGER REFERENCES companies(id),
  manager_id INTEGER REFERENCES personnel(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### B) Personnel Tablosuna Şantiye Referansı
```sql
ALTER TABLE personnel 
ADD COLUMN worksite_id INTEGER REFERENCES worksites(id);
```

#### C) Assets Tablosuna Şantiye Referansı
```sql
ALTER TABLE assets
ADD COLUMN current_worksite_id INTEGER REFERENCES worksites(id);
```

#### D) API Keys Tablosuna Şantiye Kısıtlaması
```sql
ALTER TABLE api_keys
ADD COLUMN worksite_restrictions INTEGER[] DEFAULT NULL;
-- NULL = tüm şantiyelere erişim, [1,2,3] = sadece belirtilen şantiyelere erişim
```

### 2. API Güvenlik Sistemi Güncellemeleri

#### A) Şantiye Bazlı Authorization Middleware
```javascript
// Şantiye erişim kontrolü
function authorizeWorksite(requiredWorksiteId) {
  return async (req, res, next) => {
    const apiClient = req.apiClient;
    
    // Eğer worksite_restrictions null ise, tüm şantiyelere erişim var
    if (!apiClient.worksite_restrictions) {
      return next();
    }
    
    // Kullanıcının sadece kendi şantiyesine erişimi var mı?
    if (!apiClient.worksite_restrictions.includes(requiredWorksiteId)) {
      return res.status(403).json({
        success: false,
        error: 'WORKSITE_ACCESS_DENIED',
        message: 'Bu şantiye verilerine erişim yetkiniz yok'
      });
    }
    
    next();
  };
}
```

#### B) Otomatik Veri Filtreleme
```javascript
// Personnel listesini şantiye bazlı filtrele
app.get('/api/secure/personnel', authenticateApiKey, async (req, res) => {
  const worksiteFilter = req.apiClient.worksite_restrictions;
  
  let query = db.select().from(personnel);
  
  if (worksiteFilter && worksiteFilter.length > 0) {
    query = query.where(inArray(personnel.worksiteId, worksiteFilter));
  }
  
  const results = await query;
  res.json({ success: true, data: results });
});
```

### 3. Yeni API Endpoint'leri

#### A) Şantiye Yönetimi (5 API)
- `GET /api/secure/worksites` - Şantiye listesi
- `POST /api/secure/worksites` - Yeni şantiye oluşturma
- `GET /api/secure/worksites/{id}` - Şantiye detayı
- `PUT /api/secure/worksites/{id}` - Şantiye güncelleme
- `DELETE /api/secure/worksites/{id}` - Şantiye silme (soft delete)

#### B) Şantiye-Personel İlişkileri (3 API)
- `GET /api/secure/worksites/{id}/personnel` - Şantiye personelleri
- `POST /api/secure/worksites/{id}/assign-personnel` - Personel atama
- `DELETE /api/secure/worksites/{id}/personnel/{personnelId}` - Personel çıkarma

#### C) Şantiye-Araç İlişkileri (3 API)
- `GET /api/secure/worksites/{id}/assets` - Şantiye araçları
- `POST /api/secure/worksites/{id}/assign-asset` - Araç atama
- `PUT /api/secure/assets/{id}/transfer-worksite` - Araç şantiye transferi

### 4. Frontend Güncellemeleri

#### A) Şantiye Seçim Dashboard'ı
```jsx
// Kullanıcı giriş yaptıktan sonra şantiye seçimi
function WorksiteSelector() {
  const { user } = useAuth();
  const availableWorksites = user.allowedWorksites;
  
  return (
    <Select onValueChange={setSelectedWorksite}>
      <SelectTrigger>
        <SelectValue placeholder="Şantiye seçin" />
      </SelectTrigger>
      <SelectContent>
        {availableWorksites.map(site => (
          <SelectItem key={site.id} value={site.id}>
            {site.name} - {site.code}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

#### B) Şantiye Bazlı Veri Filtreleme
- Tüm liste sayfalarında (personel, araçlar, yakıt kayıtları) şantiye filtresi
- Header'da aktif şantiye gösterimi
- Şantiye değiştirme özelliği

### 5. İmplementasyon Adımları

#### Aşama 1: Database Schema (2 saat)
1. Worksites tablosu oluşturma
2. Mevcut tablolara foreign key'ler ekleme
3. Test verileri oluşturma (3-5 örnek şantiye)

#### Aşama 2: API Güvenlik Sistemi (3 saat)
1. Worksite authorization middleware
2. API key'lere şantiye kısıtlaması ekleme
3. Mevcut endpoint'leri güncelleme

#### Aşama 3: Yeni API'ler (2 saat)
1. Şantiye CRUD API'leri
2. İlişki yönetimi API'leri
3. Swagger dokümantasyonu

#### Aşama 4: Frontend Geliştirme (3 saat)
1. Şantiye yönetim sayfaları
2. Veri filtreleme güncellemeleri
3. Kullanıcı deneyimi iyileştirmeleri

#### Aşama 5: Test ve Doğrulama (1 saat)
1. Senaryo testleri
2. İzin kontrolü testleri
3. Performans testleri

## Örnek Kullanım Senaryosu

### Şantiye Çalışanı API Key'i
```json
{
  "clientName": "Ahmet Yılmaz - İnşaat Şantiye Şefi",
  "apiKey": "ak_worksite_ahmet2025",
  "permissions": ["data:read", "fleet:read", "personnel:read"],
  "worksite_restrictions": [3], // Sadece 3 numaralı şantiye
  "isActive": true
}
```

### API Çağrısı Örnekleri
```bash
# Kendi şantiyesinin personellerini listeler (otomatik filtrelenir)
GET /api/secure/personnel
Headers: X-API-Key: ak_worksite_ahmet2025
Response: Sadece 3 numaralı şantiyedeki personeller

# Kendi şantiyesinin araçlarını listeler
GET /api/secure/assets
Headers: X-API-Key: ak_worksite_ahmet2025
Response: Sadece 3 numaralı şantiyedeki araçlar

# Başka şantiyenin verilerine erişmeye çalışır
GET /api/secure/worksites/5/assets
Headers: X-API-Key: ak_worksite_ahmet2025
Response: 403 Forbidden - "Bu şantiye verilerine erişim yetkiniz yok"
```

## Güvenlik Avantajları

1. **Veri İzolasyonu:** Her şantiye kendi verilerini görür
2. **Yetki Sınırlaması:** Coğrafi bazlı erişim kontrolü
3. **Audit Trail:** Hangi şantiyeden ne işlem yapıldığı izlenir
4. **Esneklik:** Multi-şantiye erişimi de mümkün (yönetici hesapları için)

## Önerilen Çözüm: Alternatif 1 (Mevcut work_areas Kullanımı)

### Neden Bu Alternatif?
1. **Hızlı implementasyon:** Mevcut altyapı kullanılır
2. **Minimum değişiklik:** Sadece API güvenlik katmanı eklenir
3. **Test edilmiş:** work_areas ve personnel_work_areas zaten çalışıyor
4. **Maliyet etkin:** 5 saat geliştirme vs 11 saat

### İmplementasyon Adımları (Alternatif 1)

#### 1. Database Güncellemeleri (1 saat)
```sql
-- API Keys'e çalışma alanı kısıtlaması
ALTER TABLE api_keys
ADD COLUMN work_area_restrictions INTEGER[] DEFAULT NULL;

-- Assets'e aktif çalışma alanı (opsiyonel)
ALTER TABLE assets
ADD COLUMN current_work_area_id INTEGER REFERENCES work_areas(id);
```

#### 2. API Güvenlik Middleware (2 saat)
```javascript
// Çalışma alanı bazlı filtreleme
function filterByWorkArea(req, res, next) {
  const restrictions = req.apiClient.work_area_restrictions;
  if (restrictions && restrictions.length > 0) {
    req.workAreaFilter = restrictions;
  }
  next();
}
```

#### 3. Mevcut API'lerin Güncellenmesi (1 saat)
- Personnel listesi: work_area filtrelemesi
- Assets listesi: current_work_area_id filtrelemesi
- Personel atama: aynı çalışma alanı kontrolü

#### 4. Frontend Güncellemeleri (1 saat)
- Çalışma alanı seçici
- Header'da aktif çalışma alanı gösterimi
- Filtreli veri görüntüleme

### Test Senaryosu
```bash
# X şantiyesi çalışanı API Key'i
{
  "clientName": "Mehmet Demir - X Şantiye Sorumlusu",
  "apiKey": "ak_xsantiye_mehmet2025",
  "permissions": ["data:read", "fleet:read", "personnel:read"],
  "work_area_restrictions": [2], // Sadece 2 ID'li çalışma alanı
  "isActive": true
}

# API çağrısı sonucu
GET /api/secure/personnel
Response: Sadece çalışma alanı ID=2'deki personeller
```

## Sonuç

**Önerilen Çözüm:** Alternatif 1 - Mevcut work_areas Kullanımı

- **Hazır Durum:** %85 (work_areas ve personnel_work_areas mevcut)
- **Gerekli Geliştirme:** ~5 saat
- **Yeni API:** 0 (mevcut API'ler güncellenir)
- **Risk:** Düşük (mevcut sistem üzerinde çalışır)

Bu yaklaşımla X şantiyesindeki çalışan, sadece kendi çalışma alanındaki (şantiye) personel ve araç verilerini görüp işlem yapabilir. Sistem güvenli, hızlı ve maliyet etkin şekilde hayata geçer.