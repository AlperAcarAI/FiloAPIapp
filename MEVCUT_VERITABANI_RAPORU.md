# Mevcut Veritabanı Analiz Raporu - FIN_CURRENT_ACCOUNTS
**Tarih:** 26 Ocak 2025  
**Sistem:** Architect FiloApi Management Platform

## 📊 Veritabanı Genel Durumu

### Toplam Tablo Sayısı: 44 Aktif Tablo

**Ana Kategoriler:**
- **API Yönetimi**: 8 tablo (api_clients, api_endpoints, api_keys, vb.)
- **Finansal**: 1 tablo (fin_current_accounts)
- **Varlık Yönetimi**: 6 tablo (assets, asset_documents, vb.)
- **Personel**: 4 tablo (personnel, personnel_documents, vb.)
- **Şirket**: 1 tablo (companies)
- **Referans Tablolar**: 24 tablo (ülkeler, şehirler, araç markaları, vb.)

## 💰 FIN_CURRENT_ACCOUNTS Tablosu Detayı

### Mevcut Yapı:
```sql
fin_current_accounts (
  id                 SERIAL PRIMARY KEY,
  is_debit          BOOLEAN NOT NULL,           -- Borç/Alacak durumu
  description       VARCHAR,                    -- Açıklama
  payer_company_id  INTEGER NOT NULL,          -- Ödeyen şirket
  payee_company_id  INTEGER NOT NULL,          -- Ödeme alan şirket  
  amount_cents      INTEGER NOT NULL,          -- Tutar (kuruş cinsinden)
  transaction_date  DATE NOT NULL,             -- İşlem tarihi
  is_done          BOOLEAN DEFAULT FALSE,      -- Tamamlandı mı?
  is_active        BOOLEAN DEFAULT TRUE        -- Aktif mi?
)
```

### ⚠️ Mevcut Durum:
- **Kayıt Sayısı: 0** (Tablo boş)
- **İlişkiler**: companies tablosuna bağlı (payer/payee)
- **Ödeme Yöntemi Bağlantısı: YOK** ❌
- **Süreç Entegrasyonu: YOK** ❌

## 🏢 İlişkili Tablolar

### 1. COMPANIES Tablosu
```sql
companies (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR NOT NULL,
  tax_no     VARCHAR,
  tax_office VARCHAR, 
  address    VARCHAR,
  phone      VARCHAR,
  city_id    INTEGER,
  is_active  BOOLEAN DEFAULT TRUE
)
```
**Mevcut Veri:** 2 şirket kaydı
- Demo Şirket A.Ş.
- Demo Lojistik A.Ş. (Güncellendi)

### 2. PAYMENT_METHODS Tablosu  
```sql
payment_methods (
  id        SERIAL PRIMARY KEY,
  name      VARCHAR NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
)
```
**Mevcut Veriler (7 kayıt):**
1. Nakit
2. Havale/EFT  
3. Kredi Kartı
4. Vadeli Nakit
5. Çek
6. Senet
7. Diğer

## 🔍 Eksik Özellikler ve İhtiyaçlar

### 1. FIN_CURRENT_ACCOUNTS'a Eklenmesi Gerekenler:

```sql
-- Ödeme yöntemi bağlantısı
payment_method_id INTEGER REFERENCES payment_methods(id),

-- Ödeme durumu takibi
payment_status VARCHAR(20) DEFAULT 'beklemede', 
-- Değerler: 'beklemede', 'onaylandi', 'odendi', 'iptal'

-- Ödeme referans/belge numarası  
payment_reference VARCHAR(100),

-- Gerçek ödeme tarihi (transaction_date'den farklı)
payment_date DATE,

-- Vade tarihi
due_date DATE,

-- Para birimi desteği
currency VARCHAR(3) DEFAULT 'TRY',

-- Notlar/açıklamalar
notes TEXT,

-- Onay süreci
requires_approval BOOLEAN DEFAULT FALSE,
approved_by INTEGER, -- personnel tablosuna referans
approved_at TIMESTAMP,

-- Kategori/süreç türü
source_type VARCHAR(20), -- 'hasar', 'police', 'bakim', 'genel'
source_id INTEGER, -- İlgili tablodaki record ID

-- Timestamp'lar
created_at TIMESTAMP DEFAULT NOW(),
updated_at TIMESTAMP DEFAULT NOW()
```

### 2. Süreç Entegrasyonu İçin Yeni Tablolar:

#### A. PAYMENT_INSTALLMENTS (Taksitli Ödemeler)
```sql
CREATE TABLE payment_installments (
  id SERIAL PRIMARY KEY,
  fin_current_account_id INTEGER REFERENCES fin_current_accounts(id),
  installment_number INTEGER NOT NULL,
  installment_amount_cents INTEGER NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  is_paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### B. PAYMENT_APPROVALS (Onay Süreci)
```sql  
CREATE TABLE payment_approvals (
  id SERIAL PRIMARY KEY,
  fin_current_account_id INTEGER REFERENCES fin_current_accounts(id),
  approver_id INTEGER, -- personnel tablosuna referans
  approval_status VARCHAR(20) DEFAULT 'beklemede',
  approval_notes TEXT,
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### C. PAYMENT_DOCUMENTS (Ödeme Belgeleri)
```sql
CREATE TABLE payment_documents (
  id SERIAL PRIMARY KEY,  
  fin_current_account_id INTEGER REFERENCES fin_current_accounts(id),
  document_type VARCHAR(50), -- 'fatura', 'makbuz', 'dekont'
  document_number VARCHAR(100),
  document_date DATE,
  file_path VARCHAR(255),
  uploaded_by INTEGER, -- personnel tablosuna referans
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🎯 Öncelikli Geliştirmeler

### 1. Acil (Hemen Yapılmalı):
- FIN_CURRENT_ACCOUNTS'a `payment_method_id` sütunu ekleme
- `payment_status` ve `payment_reference` alanları ekleme  
- Test verisi girişi için API endpoint'leri

### 2. Orta Vadeli (1-2 hafta):
- Taksitli ödeme desteği
- Onay süreç mekanizması
- Ödeme belge yönetimi

### 3. Uzun Vadeli (1 ay):
- Hasar/Poliçe/Bakım süreçleriyle entegrasyon
- Otomatik ödeme hesaplama
- Gelişmiş raporlama

## 📈 Önerilen API Endpoint'leri

### Temel CRUD:
- `GET /api/secure/fin-accounts` - Cari hesap listesi
- `POST /api/secure/fin-accounts` - Yeni cari hesap kaydı
- `PUT /api/secure/fin-accounts/{id}` - Cari hesap güncelleme
- `DELETE /api/secure/fin-accounts/{id}` - Cari hesap silme

### Özel İşlemler:
- `PUT /api/secure/fin-accounts/{id}/payment-method` - Ödeme yöntemi güncelleme
- `PUT /api/secure/fin-accounts/{id}/approve` - Ödeme onaylama
- `PUT /api/secure/fin-accounts/{id}/process` - Ödeme gerçekleştirme
- `GET /api/secure/fin-accounts/pending` - Bekleyen ödemeler
- `GET /api/secure/fin-accounts/by-company/{id}` - Şirket bazlı ödemeler

### Raporlar:
- `GET /api/secure/reports/fin-accounts/summary` - Genel özet
- `GET /api/secure/reports/fin-accounts/by-method` - Ödeme yöntemi bazlı
- `GET /api/secure/reports/fin-accounts/aging` - Yaşlandırma raporu

## ✅ Sonuç ve Öneriler

**Mevcut Durum:** 
- Temel tablo yapısı mevcut ✅
- Ödeme yöntemleri tanımlı ✅  
- Şirket kayıtları mevcut ✅
- **Ancak finansal işlem kaydı yok** ❌

**Önerim:**
1. **Hemen**: `payment_method_id` sütunu ekle
2. **Test verisi** gir (5-10 örnek finansal işlem)
3. **API endpoint'leri** oluştur
4. **Frontend interface** hazırla

Bu yapı kurulduktan sonra hasar, poliçe ve bakım süreçleri kolayca entegre edilebilir.

---
*Rapor Architect FiloApi sistemi için hazırlanmıştır.*