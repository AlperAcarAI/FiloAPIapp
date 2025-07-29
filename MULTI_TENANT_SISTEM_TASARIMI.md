# Multi-Tenant Sistem Tasarımı (29 Ocak 2025)

## 🏢 İki Ana Yaklaşım Analizi

### 1️⃣ AYRI SUNUCU YAKLAŞIMI (Multi-Instance)
**Her müşteri için ayrı sunucu + veritabanı**

**Avantajlar:**
- ✅ **Maksimum Güvenlik**: Veriler tamamen izole
- ✅ **Performans**: Her müşteri kendi kaynaklarını kullanır
- ✅ **Özelleştirme**: Müşteri bazlı kod değişiklikleri kolay
- ✅ **Compliance**: Veri yerelleştirme gereksinimleri karşılanabilir
- ✅ **Backup/Recovery**: Müşteri bazlı yedekleme
- ✅ **Hata İzolasyonu**: Bir müşterinin sorunu diğerlerini etkilemez

**Dezavantajlar:**
- ❌ **Yüksek Maliyet**: Her müşteri için ayrı server + database
- ❌ **Yönetim Karmaşıklığı**: 10 müşteri = 10 sunucu yönetimi
- ❌ **Güncelleme Sorunu**: Her sunucuya ayrı deployment
- ❌ **Kaynak Verimsizliği**: Düşük kullanımlı sunucular boşta kalır

### 2️⃣ TEK SUNUCU YAKLAŞIMI (Multi-Tenant)
**Tüm müşteriler aynı sunucu, tenant_id ile ayrım**

**Avantajlar:**
- ✅ **Maliyet Etkin**: Tek sunucu, paylaşımlı kaynaklar
- ✅ **Kolay Yönetim**: Tek deployment, tek güncelleme
- ✅ **Kaynak Verimliliği**: Load balancing doğal olarak olur
- ✅ **Hızlı Setup**: Yeni müşteri eklemek sadece tenant oluşturmak
- ✅ **Merkezi Monitoring**: Tüm sistem tek yerden izlenir

**Dezavantajlar:**
- ❌ **Güvenlik Riski**: Tenant isolation hatası = veri karışması
- ❌ **Performance Impact**: Bir müşterinin yoğun kullanımı diğerlerini etkiler
- ❌ **Single Point of Failure**: Sunucu çökerse herkes etkilenir
- ❌ **Compliance Zorlukları**: Bazı sektörlerde kabul edilmeyebilir

## 🎯 SİZİN DURUMUNUZ İÇİN ÖNERİ: HİBRİT YAKLAŞIM

Mevcut fleet management sisteminiz için **aşamalı hibrit yaklaşım** öneriyorum:

### AŞAMA 1: MULTI-TENANT BAŞLANGIÇ (İlk 2-5 Müşteri)
- Tek sunucu + tenant_id sistemi
- Hızlı pazara giriş
- Düşük başlangıç maliyeti
- Concept proof için ideal

### AŞAMA 2: HİBRİT SİSTEM (5-20 Müşteri)
- **Premium müşteriler**: Ayrı sunucu (dedicated)
- **Standart müşteriler**: Shared tenant sistem
- Müşteri ihtiyacına göre esnek seçim

### AŞAMA 3: KUBERNETES CONTAINER YAKLAŞIMI (20+ Müşteri)
- Her müşteri için ayrı container
- Shared Kubernetes cluster
- Auto-scaling ve resource isolation
- En iyi her iki dünyanın birleşimi

## 📊 VERİ YAPISI DEĞİŞİKLİKLERİ (Multi-Tenant İçin)

### Mevcut Durumunuz:
```sql
-- Şu anki yapı: Tek şirket sistemi
companies (id, name, address...)  -- Sadece 1-2 kayıt
users (id, email, company_id...)  -- Hepsi aynı şirkete bağlı
```

### Multi-Tenant Yapısı:
```sql
-- 1. Tenant (Kiracı) tablosu eklenir
tenants (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,          -- "ABC Lojistik Ltd."
  subdomain VARCHAR(50) UNIQUE,        -- "abc-lojistik"
  database_name VARCHAR(50),           -- Ayrı DB kullanılacaksa
  subscription_plan VARCHAR(20),       -- "basic", "premium", "enterprise"
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP,
  settings JSONB                       -- Tenant özel ayarları
);

-- 2. Tüm ana tablolara tenant_id eklenir
companies (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id),  -- YENİ!
  name VARCHAR(100),
  address TEXT,
  ...
);

users (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id),  -- YENİ!
  email VARCHAR(100),
  company_id INTEGER REFERENCES companies(id),
  ...
);

assets (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id),  -- YENİ!
  company_id INTEGER REFERENCES companies(id),
  license_plate VARCHAR(20),
  ...
);

-- 3. Tüm tablolara tenant_id index'i eklenir
CREATE INDEX idx_companies_tenant ON companies(tenant_id);
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_assets_tenant ON assets(tenant_id);
```

## 🔐 GÜVENLİK KATMANLARI

### 1. API Seviyesi Tenant İzolasyonu
```javascript
// Middleware: Her istekte tenant kontrolü
const tenantMiddleware = (req, res, next) => {
  const tenantId = req.headers['x-tenant-id'] || 
                   req.subdomain || 
                   req.user.tenantId;
  
  if (!tenantId) {
    return res.status(403).json({error: 'Tenant ID gerekli'});
  }
  
  req.tenantId = tenantId;
  next();
};

// Tüm sorgularada tenant filter otomatik
const getAssets = async (req, res) => {
  const assets = await db.select()
    .from(assets)
    .where(eq(assets.tenant_id, req.tenantId));  // ZORUNLU!
};
```

### 2. Database Seviyesi Row Level Security (RLS)
```sql
-- PostgreSQL RLS ile ekstra güvenlik
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON assets
  FOR ALL TO application_role
  USING (tenant_id = current_setting('app.current_tenant_id')::INTEGER);
```

### 3. Subdomain Bazlı Erişim
```
https://abc-lojistik.fleetmanager.com  → Tenant ID: 1
https://xyz-tasima.fleetmanager.com    → Tenant ID: 2
https://demo.fleetmanager.com          → Tenant ID: 999 (demo)
```

## 💰 MALİYET ANALİZİ

### Mevcut Tek Şirket Sistemi:
- 1 Sunucu: $50/ay
- 1 Database: $30/ay
- **Toplam: $80/ay**

### Multi-Tenant Seçenekleri:
| Yaklaşım | 5 Müşteri | 10 Müşteri | 20 Müşteri |
|----------|-----------|------------|------------|
| **Ayrı Sunucular** | $400/ay | $800/ay | $1,600/ay |
| **Multi-Tenant** | $120/ay | $200/ay | $350/ay |
| **Hibrit** | $250/ay | $400/ay | $600/ay |

## 🚀 UYGULAMA PLANI

### HEMEN BAŞLANGIÇ (1-2 Hafta):
1. `tenants` tablosu oluştur
2. Mevcut şirketi ilk tenant olarak kaydet
3. Tüm tablolara `tenant_id` kolonu ekle
4. API middleware'ine tenant kontrolü ekle

### ORTA VADE (1-2 Ay):
1. Subdomain yönlendirme sistemi
2. Tenant bazlı kullanıcı kaydı
3. Billing/subscription sistemi
4. Admin paneli (super admin)

### UZUN VADE (3-6 Ay):
1. Container/Kubernetes geçişi
2. Tenant bazlı özelleştirmeler
3. Dedicated hosting seçeneği
4. White-label çözümleri

## 🎯 SONUÇ VE ÖNERİ

**Sizin için en uygun yol:** Multi-tenant başlangıç → Hibrit geçiş

**Nedenler:**
- Fleet management genelde orta ölçekli şirketler (aynı profil)
- Veri yapınız multi-tenant'a uygun
- Hızlı pazara giriş kritik
- Maliyet avantajı büyük müşteri sayısında belirgin

Bu yaklaşımla 6 ay içinde 10-15 müşteriyle çalışan, ölçeklenebilir bir SaaS platformunuz olabilir!