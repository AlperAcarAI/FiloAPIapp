# 📋 Audit Trail System (Denetim İzi Sistemi)

## 🎯 Genel Bakış

Veritabanındaki tüm değişiklikleri izleyen kapsamlı bir audit sistemi kuruldu. Bu sistem:

- **Kimin** hangi veriyi değiştirdiğini
- **Ne zaman** değiştirdiğini  
- **Hangi alanları** değiştirdiğini
- **Eski ve yeni değerleri** neler olduğunu
- **Hangi IP'den** ve **hangi client'tan** işlem yapıldığını

Tam olarak takip eder.

## 🏗️ Sistem Mimarisi

### Hibrit Yaklaşım
1. **Merkezi Audit Log Tablosu** - Tüm değişiklikler tek yerde
2. **Temel Audit Alanları** - Kritik tablolarda hızlı erişim için
3. **Middleware Sistemi** - Otomatik loglama

### Audit Logs Tablosu
```sql
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  table_name VARCHAR(64) NOT NULL,
  record_id INTEGER NOT NULL,
  operation VARCHAR(10) NOT NULL,  -- INSERT, UPDATE, DELETE
  old_values TEXT,                 -- JSON format
  new_values TEXT,                 -- JSON format  
  changed_fields TEXT[],           -- Değişen alan adları
  user_id INTEGER,                 -- Hangi kullanıcı
  api_client_id INTEGER,           -- Hangi API client
  ip_address VARCHAR(45),          -- IP adresi
  user_agent TEXT,                 -- Browser/client bilgisi
  timestamp TIMESTAMP DEFAULT NOW()
);
```

## 🔧 Kullanım

### Kod İçinde Audit Logging
```javascript
import { auditableInsert, auditableUpdate, auditableDelete } from './audit-middleware';

// Normal insert yerine:
const result = await auditableInsert(
  cities, 
  { name: "Yeni Şehir", countryId: 1 },
  'cities',
  req.auditInfo
);

// Normal update yerine:
const result = await auditableUpdate(
  cities,
  eq(cities.id, 5),
  { name: "Güncellenmiş Şehir" },
  'cities', 
  req.auditInfo
);

// Normal delete yerine:
const result = await auditableDelete(
  cities,
  eq(cities.id, 5),
  'cities',
  req.auditInfo
);
```

### API Endpoint'leri

#### Bir Kaydın Audit Geçmişi
```bash
GET /api/audit/record/cities/5
Authorization: Bearer JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "tableName": "cities",
      "recordId": 5,
      "operation": "UPDATE",
      "oldValues": {"name": "Eski İsim"},
      "newValues": {"name": "Yeni İsim"},
      "changedFields": ["name"],
      "user": {"id": 1, "email": "admin@example.com"},
      "apiClient": {"id": 2, "name": "Demo API Client"},
      "timestamp": "2025-07-25T09:30:00Z"
    }
  ]
}
```

#### Kullanıcı Aktivite Geçmişi
```bash
GET /api/audit/user/1?limit=50
Authorization: Bearer JWT_TOKEN
```

#### Tablo Audit Özeti
```bash
GET /api/audit/table/cities/summary?days=30
Authorization: Bearer JWT_TOKEN
```

#### Genel Audit İstatistikleri
```bash
GET /api/audit/stats?days=7
Authorization: Bearer JWT_TOKEN
```

## 🛡️ Güvenlik Özellikleri

### Otomatik Bilgi Toplama
- **User ID**: JWT token'dan veya API key'den
- **API Client ID**: API key middleware'den
- **IP Address**: Request'ten otomatik
- **User Agent**: Browser/client bilgisi

### Hata Toleransı
- Audit logging hatası uygulamayı durdurmaz
- Kritik olmayan bilgi eksikliği tolere edilir
- Performans optimizasyonları

## 📊 Raporlama

### En Sık Kullanılan Sorgular

```javascript
// Bir kaydın tüm değişiklik geçmişi
const history = await getRecordAuditHistory('cities', 5);

// Kullanıcının son 100 işlemi
const userActivity = await getUserAuditActivity(1, 100);

// Son 30 gün tablo özeti
const tableSummary = await getTableAuditSummary('cities', 30);
```

### Dashboard İstatistikleri
- Günlük/haftalık işlem sayıları
- En aktif kullanıcılar
- En çok değişen tablolar
- Operasyon dağılımları (INSERT/UPDATE/DELETE)

## 🚀 Performans

### Optimizasyonlar
- **Index'ler**: table_name+record_id, user_id, timestamp
- **Asenkron Logging**: Ana işlemi engellemez
- **Batch Operations**: Toplu işlemler için optimize edilmiş
- **TTL Politikası**: Eski audit loglar silinebilir

### Depolama Tahmini
- Her işlem ortalama ~500 bytes
- 1000 işlem/gün = ~15MB/ay
- 1 yıl = ~180MB audit data

## 🔄 Bakım ve Yönetim

### Log Temizliği
```sql
-- 1 yıldan eski audit logları sil
DELETE FROM audit_logs 
WHERE timestamp < NOW() - INTERVAL '1 year';
```

### Performans İzleme
```sql
-- En büyük audit tabloları
SELECT 
  table_name,
  COUNT(*) as record_count,
  MAX(timestamp) as last_activity
FROM audit_logs 
GROUP BY table_name 
ORDER BY record_count DESC;
```

## 💡 En İyi Uygulamalar

### Geliştirici Rehberi
1. **Her CRUD işleminde** audit fonksiyonları kullan
2. **Middleware'i** her endpoint'e ekle
3. **Hassas veriler** için extra kontroller
4. **Toplu işlemlerde** performance'ı göz önünde bulundur

### Veri Güvenliği
- Audit loglar **asla silinmemeli**
- Hassas veriler maskelenebilir
- Access log'lar ayrı tutulabilir
- Compliance gereksinimleri karşılanmalı

Bu sistem ile veritabanındaki her değişiklik tam olarak izlenebilir ve gerektiğinde detaylı raporlar alınabilir.