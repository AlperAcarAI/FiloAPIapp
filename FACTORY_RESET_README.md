# 🏭 Factory Reset - Kullanım Kılavuzu

## ⚠️ ÖNEMLİ UYARILAR

**BU SCRIPT VERİTABANINIZI FABRİKA AYARLARINA GETİRİR!**

- ✅ **Referans tabloları korunur** (marka, model, şehir, ülke vb.)
- ❌ **Tüm işletme verileri silinir** (kullanıcılar, araçlar, projeler, personel vb.)
- 🔐 **Sadece Admin kullanıcısı kalır**

## 📋 Korunan Referans Tabloları

Script şu tabloları **KORUR** (silinmez):

1. `car_brands` - Araç Markaları
2. `car_models` - Araç Modelleri  
3. `car_types` - Araç Tipleri
4. `cities` - Şehirler
5. `company_types` - Şirket Tipleri
6. `countries` - Ülkeler
7. `damage_types` - Hasar Tipleri
8. `doc_main_types` - Doküman Ana Tipleri
9. `doc_sub_types` - Doküman Alt Tipleri
10. `maintenance_types` - Bakım Tipleri
11. `ownership_types` - Sahiplik Tipleri
12. `payment_types` - Ödeme Tipleri
13. `penalty_types` - Ceza Tipleri
14. `policy_types` - Poliçe Tipleri

## 🗑️ Silinecek Tablolar

Aşağıdaki tablolardaki **TÜM VERİLER SİLİNİR**:

- Kullanıcılar (`users`)
- Şirketler (`companies`)
- Personel (`personnel`)
- Araçlar (`assets`)
- Projeler (`projects`)
- Şantiyeler (`work_areas`)
- Finansal kayıtlar (`fin_*`)
- Bakım kayıtları (`assets_maintenance`, `fuel_records`)
- Kiralama sözleşmeleri (`rental_*`)
- Cezalar (`penalties`)
- Dokümanlar (`documents`, `asset_documents`, `personnel_documents`)
- API kayıtları ve loglar
- Güvenlik logları
- Audit kayıtları
- Sessionlar
- **ve diğer tüm işletme verileri**

## 🔐 Reset Sonrası Oluşturulan Veriler

### Default Şirket
- **ID:** 1
- **İsim:** Default
- **Vergi No:** 0000000000

### Admin Kullanıcısı
- **ID:** 1
- **Email:** admin@filoki.com
- **Şifre:** @carAcar54
- **Department:** Admin
- **Position Level:** 10
- **Şirket:** Default (ID: 1)

## 📝 Kullanım Adımları

### 1️⃣ YEDEK ALIN!

**MUTLAKA** veritabanınızın yedeğini alın:

```bash
# PostgreSQL yedekleme
pg_dump -h YOUR_HOST -U YOUR_USER -d YOUR_DATABASE > backup_$(date +%Y%m%d_%H%M%S).sql

# Veya Neon.tech için (eğer kullanıyorsanız)
# Neon Console'dan backup alın
```

### 2️⃣ Script'i Çalıştırın

#### Seçenek A: psql ile (Terminal)

```bash
# .env dosyasından DATABASE_URL'i alarak
source .env
psql $DATABASE_URL -f factory-reset.sql
```

#### Seçenek B: Doğrudan psql komutu ile

```bash
psql -h HOST -U USERNAME -d DATABASE -f factory-reset.sql
```

#### Seçenek C: Neon.tech SQL Editor

1. Neon.tech Console'a gidin
2. SQL Editor'ü açın
3. `factory-reset.sql` dosyasının içeriğini yapıştırın
4. **Run** butonuna basın

### 3️⃣ Doğrulama

Script sonunda otomatik olarak doğrulama sorgular çalışır:

```sql
-- Kullanıcı sayısı (1 olmalı)
SELECT COUNT(*) FROM users;

-- Şirket sayısı (1 olmalı)  
SELECT COUNT(*) FROM companies;

-- Personel sayısı (0 olmalı)
SELECT COUNT(*) FROM personnel;

-- Araç sayısı (0 olmalı)
SELECT COUNT(*) FROM assets;

-- Referans tablolarının korunduğunu kontrol et
SELECT COUNT(*) FROM countries;
SELECT COUNT(*) FROM cities;
SELECT COUNT(*) FROM car_brands;
```

### 4️⃣ Admin ile Giriş Yapın

Reset sonrası sisteme giriş yapın:

- **Email:** admin@filoki.com
- **Şifre:** @carAcar54

## 🔒 Güvenlik Notları

1. **Production'da dikkatli kullanın!** Bu script geri alınamaz.
2. Script çalıştırılmadan önce mutlaka yedek alın.
3. Script transaction içinde çalışır (BEGIN/COMMIT), hata olursa rollback yapılır.
4. Foreign key constraints geçici olarak devre dışı bırakılır, sonra tekrar aktif edilir.
5. Tüm sequence'ler sıfırlanır, yeni kayıtlar ID=1'den başlar (korunan veriler hariç).

## 🛠️ Teknik Detaylar

### Script Ne Yapar?

1. **Foreign key'leri devre dışı bırakır** (`SET session_replication_role = 'replica'`)
2. **Tabloları sıraya göre temizler** (dependency sırasına göre)
3. **Default şirket oluşturur** (ID=1, ON CONFLICT ile güvenli)
4. **Admin kullanıcısı oluşturur** (ID=1, şifreli)
5. **Sequence'leri resetler** (Auto-increment ID'leri sıfırlar)
6. **Foreign key'leri aktif eder** (`SET session_replication_role = 'origin'`)
7. **Transaction'ı commit eder**
8. **Doğrulama sorguları çalıştırır**

### Hata Durumu

Eğer herhangi bir hata oluşursa:
- Transaction otomatik olarak **ROLLBACK** yapılır
- Hiçbir değişiklik kalıcı olmaz
- Veritabanı önceki haline döner

## 📞 Destek

Sorun yaşarsanız:
1. Hata mesajını kontrol edin
2. Veritabanı log'larını inceleyin
3. Yedekten geri yükleme yapın (gerekirse)

## 🎯 Kullanım Senaryoları

Bu script şu durumlarda kullanılır:

- ✅ **Test ortamını sıfırlama**
- ✅ **Demo ortamı hazırlama**
- ✅ **Geliştirme ortamını temizleme**
- ✅ **Yeni müşteri kurulumu**
- ⚠️ **Production sıfırlama** (çok dikkatli!)

---

**Son Güncelleme:** 14.11.2025  
**Versiyon:** 1.0
