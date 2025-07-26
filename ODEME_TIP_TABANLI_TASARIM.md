# Tip-Tabanlı Ödeme Sistemi Tasarımı
**Tarih:** 26 Ocak 2025  
**Sistem:** Architect FiloApi - Optimize Finansal Ödeme Modülü

## 🎯 Tip-Tabanlı Yaklaşım Avantajları

### ✅ Neden Daha İyi:
- **Tek Tablo**: Tüm ödemeler tek yerde
- **Esnek Yapı**: Yeni ödeme türleri kolayca eklenir
- **Basit Sorgular**: JOIN işlemleri azalır
- **Maintenance**: Daha kolay yönetim
- **Performance**: Daha hızlı sorgular

### ❌ Ayrı Tablo Problemleri:
- Çok fazla tablo karmaşası
- Ortak raporlar için karmaşık UNION'lar
- Her yeni tip için yeni tablo
- Kod tekrarı

## 🏗️ Optimize Tasarım

### 1. FIN_CURRENT_ACCOUNTS (Ana Tablo)

```sql
-- Mevcut tabloya eklenecek sütunlar
ALTER TABLE fin_current_accounts 
ADD COLUMN payment_method_id INTEGER REFERENCES payment_methods(id),
ADD COLUMN payment_status VARCHAR(20) DEFAULT 'beklemede',
ADD COLUMN payment_reference VARCHAR(100),
ADD COLUMN payment_date DATE,
ADD COLUMN due_date DATE,
ADD COLUMN currency VARCHAR(3) DEFAULT 'TRY',

-- ÖNEMLİ: Ödeme türü ve metadata
ADD COLUMN payment_type VARCHAR(20) NOT NULL DEFAULT 'genel',
ADD COLUMN source_type VARCHAR(20), -- 'hasar', 'police', 'bakim', 'genel'
ADD COLUMN source_id INTEGER, -- İlgili kayıt ID'si
ADD COLUMN metadata JSONB, -- Özel alanlar için

-- Onay süreci
ADD COLUMN requires_approval BOOLEAN DEFAULT FALSE,
ADD COLUMN approved_by INTEGER, -- personnel tablosuna referans
ADD COLUMN approved_at TIMESTAMP,

-- Notlar
ADD COLUMN notes TEXT,

-- Timestamp'lar
ADD COLUMN created_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
```

### 2. PAYMENT_TYPES (Ödeme Türleri)

```sql
CREATE TABLE payment_types (
  id SERIAL PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL, -- 'hasar', 'police', 'bakim'
  name VARCHAR(50) NOT NULL, -- 'Hasar Ödemesi', 'Poliçe Primi'
  description TEXT,
  
  -- Metadata şeması (hangi alanlar olacak)
  metadata_schema JSONB, -- JSON Schema tanımı
  
  -- Onay gerekli mi?
  requires_approval BOOLEAN DEFAULT FALSE,
  approval_limit_cents INTEGER, -- Bu tutarın üstü onay gerekir
  
  -- Aktif mi?
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Örnek PAYMENT_TYPES verileri:**
```sql
INSERT INTO payment_types (code, name, metadata_schema, requires_approval, approval_limit_cents) VALUES
('genel', 'Genel Ödeme', '{}', false, NULL),
('hasar', 'Hasar Ödemesi', '{
  "type": "object",
  "properties": {
    "damage_type": {"type": "string"},
    "asset_id": {"type": "integer"},
    "deductible_amount": {"type": "number"},
    "insurance_covered": {"type": "boolean"},
    "repair_shop": {"type": "string"}
  }
}', true, 10000000), -- 100.000 TL üstü onay
('police', 'Poliçe Primi', '{
  "type": "object", 
  "properties": {
    "policy_number": {"type": "string"},
    "asset_id": {"type": "integer"},
    "coverage_type": {"type": "string"},
    "installment_number": {"type": "integer"},
    "total_installments": {"type": "integer"}
  }
}', false, NULL),
('bakim', 'Bakım Gideri', '{
  "type": "object",
  "properties": {
    "asset_id": {"type": "integer"},
    "maintenance_type": {"type": "string"},
    "service_provider": {"type": "string"},
    "parts_cost": {"type": "number"},
    "labor_cost": {"type": "number"},
    "mileage": {"type": "integer"}
  }
}', true, 5000000); -- 50.000 TL üstü onay
```

### 3. Metadata Örnekleri

#### Hasar Ödemesi:
```json
{
  "damage_type": "kaza",
  "asset_id": 15,
  "deductible_amount": 2500.00,
  "insurance_covered": true,
  "repair_shop": "ABC Oto Servis",
  "damage_date": "2025-01-20",
  "police_report_number": "TR2025123456"
}
```

#### Poliçe Primi:
```json
{
  "policy_number": "POL-2025-001234",
  "asset_id": 15,
  "coverage_type": "Kasko",
  "installment_number": 3,
  "total_installments": 12,
  "policy_start_date": "2025-01-01",
  "policy_end_date": "2025-12-31"
}
```

#### Bakım Gideri:
```json
{
  "asset_id": 15,
  "maintenance_type": "Periyodik Bakım",
  "service_provider": "ABC Oto Servis",
  "parts_cost": 1200.50,
  "labor_cost": 800.00,
  "mileage": 45000,
  "next_maintenance_km": 50000
}
```

### 4. İndeksler ve Performans

```sql
-- Performans için kritik indeksler
CREATE INDEX idx_fin_current_accounts_payment_type ON fin_current_accounts(payment_type);
CREATE INDEX idx_fin_current_accounts_source ON fin_current_accounts(source_type, source_id);
CREATE INDEX idx_fin_current_accounts_status ON fin_current_accounts(payment_status);
CREATE INDEX idx_fin_current_accounts_dates ON fin_current_accounts(transaction_date, payment_date);
CREATE INDEX idx_fin_current_accounts_companies ON fin_current_accounts(payer_company_id, payee_company_id);

-- JSONB için GIN index
CREATE INDEX idx_fin_current_accounts_metadata ON fin_current_accounts USING GIN (metadata);
```

## 🔍 Kullanım Örnekleri

### 1. Hasar Ödemesi Oluşturma:
```sql
INSERT INTO fin_current_accounts (
  is_debit, description, 
  payer_company_id, payee_company_id, 
  amount_cents, transaction_date,
  payment_method_id, payment_type, source_type, source_id,
  metadata, requires_approval
) VALUES (
  true, 'Araç hasarı onarım ödemesi',
  1, 2, 
  250000, '2025-01-26', -- 2500 TL
  3, 'hasar', 'damage', 123,
  '{"damage_type": "kaza", "asset_id": 15, "repair_shop": "ABC Oto Servis"}',
  true
);
```

### 2. Poliçe Primi Ödemesi:
```sql
INSERT INTO fin_current_accounts (
  is_debit, description,
  payer_company_id, payee_company_id,
  amount_cents, transaction_date,
  payment_method_id, payment_type, source_type, source_id,
  metadata, due_date
) VALUES (
  true, 'Araç kasko primi - 3. taksit',
  1, 2,
  180000, '2025-01-26', -- 1800 TL  
  2, 'police', 'policy', 456,
  '{"policy_number": "POL-2025-001234", "installment_number": 3}',
  '2025-02-01'
);
```

### 3. Gelişmiş Sorgular:

```sql
-- Tip bazlı özet rapor
SELECT 
  payment_type,
  COUNT(*) as islem_sayisi,
  SUM(amount_cents)/100.0 as toplam_tutar,
  AVG(amount_cents)/100.0 as ortalama_tutar
FROM fin_current_accounts 
WHERE is_active = true
GROUP BY payment_type;

-- Belirli varlık için tüm ödemeler
SELECT 
  f.*,
  pt.name as payment_type_name,
  pm.name as payment_method_name
FROM fin_current_accounts f
LEFT JOIN payment_types pt ON f.payment_type = pt.code  
LEFT JOIN payment_methods pm ON f.payment_method_id = pm.id
WHERE f.metadata->>'asset_id' = '15'
ORDER BY f.transaction_date DESC;

-- Onay bekleyen ödemeler
SELECT 
  f.*,
  pt.name as payment_type_name,
  c1.name as payer_company,
  c2.name as payee_company
FROM fin_current_accounts f
LEFT JOIN payment_types pt ON f.payment_type = pt.code
LEFT JOIN companies c1 ON f.payer_company_id = c1.id  
LEFT JOIN companies c2 ON f.payee_company_id = c2.id
WHERE f.requires_approval = true 
  AND f.payment_status = 'beklemede';
```

## 🚀 API Endpoint'leri

### Tip-Özel Endpoint'ler:
```
POST /api/secure/payments/damage      - Hasar ödemesi oluştur
POST /api/secure/payments/policy      - Poliçe ödemesi oluştur  
POST /api/secure/payments/maintenance - Bakım ödemesi oluştur
GET  /api/secure/payments/by-type/{type} - Tip bazlı ödeme listesi
GET  /api/secure/payments/by-asset/{id}  - Varlık bazlı ödeme geçmişi
```

### Metadata Validation:
Her ödeme türü için frontend'de otomatik form oluşturma ve validation.

## ✅ Sonuç

Bu yaklaşım ile:
- **1 ana tablo** (fin_current_accounts)
- **1 tip tanım tablosu** (payment_types)  
- **JSON metadata** ile sınırsız esneklik
- **Tip-safe validation** ile veri bütünlüğü
- **Performans optimizasyonu** ile hızlı sorgular

**Çok daha temiz, esnek ve yönetilebilir bir yapı!**

---
*Bu tasarımı onaylıyor musunuz?*