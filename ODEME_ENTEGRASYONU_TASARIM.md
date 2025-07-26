# Ödeme Entegrasyonu Veritabanı Tasarımı
**Tarih:** 26 Ocak 2025  
**Sistem:** Architect FiloApi - Finansal Ödeme Modülü

## 📊 Mevcut Durum Analizi

**Ekran Görüntüsünden Görülen Tablolar:**

1. **FIN_CURRENT_ACCOUNTS** (Ana Tablo)
   - ID (PK)
   - TYPE (Boolean)
   - DESCRIPTION (Varchar)
   - PAYER_COMPANY_ID (FK)
   - PAID_COMPANY_ID (FK)
   - AMOUNT (Int)
   - DATE (Date)
   - ISDONE (Boolean)
   - ISACTIVE (Boolean)

2. **FIN_CURRENT_ACCOUNTS_PROCESSES** (İşlem Takip Tablosu)
   - ID (PK)
   - FIN_CA_ID (FK)
   - DESCRIPTION (Varchar)
   - PAYER_COMPANY_ID (FK)
   - PAID_COMPANY_ID (FK)
   - AMOUNT (Int)
   - DATE (Date)
   - ISACTIVE (Boolean)

## 🎯 Önerilen Geliştirmeler

### 1. FIN_CURRENT_ACCOUNTS Tablosuna Eklenmesi Gereken Sütunlar

```sql
-- Ödeme yöntemi bağlantısı
ALTER TABLE FIN_CURRENT_ACCOUNTS 
ADD COLUMN payment_method_id INTEGER REFERENCES payment_methods(id);

-- Ödeme durumu (beklemede, ödendi, iptal edildi)
ALTER TABLE FIN_CURRENT_ACCOUNTS 
ADD COLUMN payment_status VARCHAR(20) DEFAULT 'beklemede';

-- Ödeme referans numarası
ALTER TABLE FIN_CURRENT_ACCOUNTS 
ADD COLUMN payment_reference VARCHAR(100);

-- Ödeme tarihini gerçek ödeme tarihi olarak ayrıştırma
ALTER TABLE FIN_CURRENT_ACCOUNTS 
ADD COLUMN payment_date DATE;
```

### 2. Süreç Entegrasyonu için Yeni Tablolar

#### A. PAYMENT_TRANSACTIONS (Ödeme İşlemleri)
```sql
CREATE TABLE payment_transactions (
  id SERIAL PRIMARY KEY,
  fin_current_account_id INTEGER REFERENCES FIN_CURRENT_ACCOUNTS(id),
  
  -- Hangi süreçten geldiği
  source_type VARCHAR(20) NOT NULL, -- 'hasar', 'police', 'bakim'
  source_id INTEGER NOT NULL, -- İlgili tablodaki ID
  
  -- Ödeme detayları
  payment_method_id INTEGER REFERENCES payment_methods(id),
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'TRY',
  
  -- Durum bilgileri
  status VARCHAR(20) DEFAULT 'beklemede', -- beklemede, onaylandi, odendi, iptal
  payment_date DATE,
  due_date DATE,
  
  -- Metadata
  description TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);
```

#### B. DAMAGE_PAYMENTS (Hasar Ödemeleri)
```sql
CREATE TABLE damage_payments (
  id SERIAL PRIMARY KEY,
  damage_id INTEGER, -- damages tablosuna referans
  fin_current_account_id INTEGER REFERENCES FIN_CURRENT_ACCOUNTS(id),
  payment_transaction_id INTEGER REFERENCES payment_transactions(id),
  
  -- Hasar-özel alanlar
  damage_amount DECIMAL(15,2),
  deductible_amount DECIMAL(15,2), -- Muafiyet tutarı
  covered_amount DECIMAL(15,2), -- Sigorta kapsamındaki tutar
  
  -- Durum
  is_insurance_covered BOOLEAN DEFAULT false,
  approval_status VARCHAR(20) DEFAULT 'beklemede',
  
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### C. POLICY_PAYMENTS (Poliçe Ödemeleri)
```sql
CREATE TABLE policy_payments (
  id SERIAL PRIMARY KEY,
  policy_id INTEGER, -- policies tablosuna referans
  fin_current_account_id INTEGER REFERENCES FIN_CURRENT_ACCOUNTS(id),
  payment_transaction_id INTEGER REFERENCES payment_transactions(id),
  
  -- Poliçe-özel alanlar
  premium_amount DECIMAL(15,2), -- Prim tutarı
  installment_number INTEGER, -- Taksit numarası
  total_installments INTEGER, -- Toplam taksit sayısı
  
  -- Tarihler
  policy_start_date DATE,
  policy_end_date DATE,
  installment_due_date DATE,
  
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### D. MAINTENANCE_PAYMENTS (Bakım Ödemeleri)
```sql
CREATE TABLE maintenance_payments (
  id SERIAL PRIMARY KEY,
  maintenance_id INTEGER, -- maintenances tablosuna referans
  fin_current_account_id INTEGER REFERENCES FIN_CURRENT_ACCOUNTS(id),
  payment_transaction_id INTEGER REFERENCES payment_transactions(id),
  
  -- Bakım-özel alanlar
  maintenance_type_id INTEGER REFERENCES maintenance_types(id),
  labor_cost DECIMAL(15,2), -- İşçilik
  parts_cost DECIMAL(15,2), -- Parça maliyeti
  total_cost DECIMAL(15,2), -- Toplam maliyet
  
  -- Onay süreci
  approval_required BOOLEAN DEFAULT true,
  approved_by INTEGER, -- personnel tablosuna referans
  approved_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. Gelişmiş Ödeme Yöntemleri Tablosu

```sql
-- Mevcut payment_methods tablosunu genişletme
ALTER TABLE payment_methods 
ADD COLUMN method_type VARCHAR(20), -- 'nakit', 'kredi_karti', 'banka_transferi', 'cek'
ADD COLUMN requires_approval BOOLEAN DEFAULT false,
ADD COLUMN max_amount DECIMAL(15,2), -- Maksimum işlem tutarı
ADD COLUMN processing_fee_rate DECIMAL(5,4) DEFAULT 0, -- İşlem ücreti oranı
ADD COLUMN description TEXT;
```

## 🔗 İlişki Yapısı

```
FIN_CURRENT_ACCOUNTS (Ana Ödeme Kaydı)
    ↓
PAYMENT_TRANSACTIONS (Detaylı İşlem Takibi)
    ↓
├── DAMAGE_PAYMENTS (Hasar ödemeleri)
├── POLICY_PAYMENTS (Poliçe ödemeleri)
└── MAINTENANCE_PAYMENTS (Bakım ödemeleri)

PAYMENT_METHODS ← (tüm tablolar buraya bağlı)
```

## 🎯 API Endpoint'leri (Yeni)

1. **Ödeme İşlemleri**
   - `POST /api/secure/payments/create` - Yeni ödeme kaydı
   - `PUT /api/secure/payments/{id}/approve` - Ödeme onaylama
   - `PUT /api/secure/payments/{id}/process` - Ödeme gerçekleştirme
   - `GET /api/secure/payments/pending` - Bekleyen ödemeler

2. **Süreç Ödemeleri**
   - `POST /api/secure/payments/damage` - Hasar ödemesi
   - `POST /api/secure/payments/policy` - Poliçe ödemesi
   - `POST /api/secure/payments/maintenance` - Bakım ödemesi

3. **Raporlar**
   - `GET /api/secure/reports/payments/summary` - Ödeme özeti
   - `GET /api/secure/reports/payments/by-method` - Ödeme yöntemi bazlı
   - `GET /api/secure/reports/payments/by-process` - Süreç bazlı

## ✅ Avantajlar

1. **Merkezi Ödeme Takibi**: Tüm ödemeler FIN_CURRENT_ACCOUNTS'da
2. **Süreç Entegrasyonu**: Her süreçten gelen ödemeler bağlantılı
3. **Detaylı İzleme**: İşlem geçmişi ve onay süreçleri
4. **Esnek Ödeme Yöntemleri**: Farklı ödeme türleri desteklenir
5. **Raporlama**: Kapsamlı finansal raporlar

## 🚨 Dikkat Edilmesi Gerekenler

1. **Mevcut Veri**: Var olan FIN_CURRENT_ACCOUNTS verilerini korumak
2. **Geriye Uyumluluk**: Eski sistemi bozmamak
3. **Performance**: Index'lerin eklenmesi gerekli
4. **Güvenlik**: Finansal veriler için ekstra koruma

---

**ONAY BEKLİYOR:** Bu yapıyı kurmaya başlayayım mı?