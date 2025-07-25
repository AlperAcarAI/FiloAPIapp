# Asset Documents Depolama ve Yayınlama Stratejileri Raporu

## 📋 Mevcut Durum Analizi

### asset_documents Tablo Yapısı
```sql
asset_documents (
  id: SERIAL PRIMARY KEY,
  asset_id: INTEGER NOT NULL → assets.id
  personnel_id: INTEGER → personnel.id  
  doc_type_id: INTEGER NOT NULL → doc_sub_types.id
  description: VARCHAR(255)
  doc_link: TEXT
  upload_date: TIMESTAMP DEFAULT now()
  created_at: TIMESTAMP DEFAULT now()
  created_by: INTEGER → personnel.id
)
```

### Mevcut İlişkiler
- **Assets**: Her dokuman bir varlığa (araç/ekipman) bağlı
- **Personnel**: Dokuman yükleyen ve sorumlu personel takibi
- **Doc Sub Types**: 107 kategoriye dayalı sınıflandırma sistemi
- **Audit Trail**: Tüm değişiklikler audit_logs tablosunda izleniyor

---

## 🗂️ Dokuman Depolama Stratejileri

### 1. **DigitalOcean Sunucu Dosya Sistemi (Önerilen Yaklaşım)**
```
/var/www/documents/
├── assets/
│   ├── {asset_id}/
│   │   ├── {doc_type_id}/
│   │   │   ├── {timestamp}_{filename}
│   │   │   └── thumbnails/
│   │   └── metadata.json
├── temp/
│   └── processing/
└── backups/
    └── {date}/
```

**DigitalOcean Avantajları:**
- ✅ **Maliyet Etkin**: $5-20/ay sunucu + depolama
- ✅ **Tam Kontrol**: Root erişimi ve özel konfigürasyon
- ✅ **Hızlı Erişim**: Aynı sunucuda uygulama + dosyalar
- ✅ **Güvenlik**: UFW firewall + SSH key authentication
- ✅ **Backup**: DigitalOcean Snapshots + rsync
- ✅ **Scalable**: Block Storage ile genişletilebilir (1TB-16TB)

**Teknik Implementasyon:**
- **Sunucu**: Ubuntu 22.04 LTS Droplet
- **Web Server**: Nginx reverse proxy + Express.js
- **File System**: `/var/www/documents/` dizini
- **Permissions**: `www-data` user ile secure access
- **SSL**: Let's Encrypt ile ücretsiz HTTPS

### 2. **DigitalOcean Spaces (Object Storage) - Alternatif**

#### **DO Spaces + CDN Entegrasyonu**
```
Bucket Yapısı:
company-documents/
├── assets/
│   ├── 2025/01/
│   │   ├── asset-123/
│   │   │   ├── insurance/dokuman.pdf
│   │   │   ├── maintenance/rapor.jpg
│   │   │   └── thumbnails/
└── temp/
```

**DigitalOcean Spaces Avantajları:**
- ✅ **S3 Uyumlu API**: Mevcut AWS SDK'ları kullanılabilir
- ✅ **CDN**: Ücretsiz dahili CDN (global erişim)
- ✅ **Maliyet**: $5/ay 250GB + transfer
- ✅ **Entegrasyon**: Aynı platform (Droplet + Spaces)
- ✅ **Backup**: Otomatik replication

**Teknik Implementasyon:**
- doc_link: `https://company-docs.fra1.digitaloceanspaces.com/asset-123/dokuman.pdf`
- CDN URL: `https://company-docs.fra1.cdn.digitaloceanspaces.com/`
- Pre-signed URLs ile güvenli erişim

#### **Replit Storage/Database BLOB**
```sql
ALTER TABLE asset_documents ADD COLUMN 
file_data BYTEA,
file_size INTEGER,
mime_type VARCHAR(100);
```

**Avantajları:**
- ✅ Tek platform yönetimi
- ✅ Transaction güvenliği
- ✅ Kolay backup/restore

**Dezavantajları:**
- ❌ Database boyut sınırları
- ❌ Performance sorunları (büyük dosyalar)
- ❌ Memory kullanımı

### 3. **DigitalOcean Hibrit Yaklaşım (En Optimal)**

**Küçük Dosyalar (< 5MB)**: Droplet `/var/www/documents/`
**Orta Dosyalar (5-50MB)**: Droplet + Block Storage
**Büyük Dosyalar (> 50MB)**: DigitalOcean Spaces
**Arşiv Dosyalar**: Spaces Archive (daha ucuz)

**Maliyet Optimizasyonu:**
- Aktif dosyalar: Droplet SSD (hızlı erişim)
- Eski dosyalar: Spaces (maliyet etkin)
- Otomatik lifecycle policy ile transfer

---

## 📤 Dokuman Yayınlama Stratejileri

### 1. **API-Based Erişim**
```typescript
GET /api/secure/documents/{assetId}
GET /api/secure/documents/download/{documentId}
POST /api/secure/documents/upload
PUT /api/secure/documents/{documentId}
DELETE /api/secure/documents/{documentId}
```

**Güvenlik Katmanları:**
- JWT Token authentication
- API Key protection  
- Role-based access (admin, asset_read, asset_write)
- Document-level permissions

### 2. **Direct Download Links**
```typescript
// Geçici download linki (24 saat geçerli)
GET /api/secure/documents/{id}/download-link
Response: {
  downloadUrl: "https://temp-url.com/doc/12345?token=xyz&expires=1234567890",
  expiresAt: "2025-01-26T14:00:00Z"
}
```

### 3. **Streaming ve Preview**
```typescript
// PDF preview için
GET /api/secure/documents/{id}/preview
// Büyük dosyalar için streaming
GET /api/secure/documents/{id}/stream
```

---

## 🔐 Güvenlik ve Erişim Kontrolleri

### 1. **Rol Tabanlı Erişim**
```typescript
// Yeni permission'lar
const documentPermissions = [
  'document:read',     // Dokuman okuma
  'document:write',    // Dokuman yükleme
  'document:delete',   // Dokuman silme  
  'document:admin',    // Tüm haklar
  'asset:documents'    // Varlık dokümanları
];
```

### 2. **Dokuman Seviyesi Güvenlik**
```sql
ALTER TABLE asset_documents ADD COLUMN
visibility VARCHAR(20) DEFAULT 'private', -- public, private, restricted
access_level INTEGER DEFAULT 1, -- 1-5 gizlilik seviyesi
allowed_roles TEXT[] -- Specific role access
```

### 3. **Watermarking ve DRM**
- PDF'lere otomatik watermark ekleme
- Download tracking (kim, ne zaman)
- Print protection (kritik dokümanlar için)

---

## 📊 Metadata ve İndeksleme

### 1. **Gelişmiş Metadata**
```sql
ALTER TABLE asset_documents ADD COLUMN
file_size INTEGER,
mime_type VARCHAR(100),
file_hash VARCHAR(64), -- Duplicate detection
tags TEXT[], -- Searchable tags
extracted_text TEXT, -- OCR/PDF text extraction
thumbnail_path TEXT,
version_number INTEGER DEFAULT 1
```

### 2. **Full-Text Search**
```sql
-- PostgreSQL Full-Text Search
ALTER TABLE asset_documents ADD COLUMN
search_vector tsvector;

CREATE INDEX idx_documents_search 
ON asset_documents USING gin(search_vector);
```

### 3. **Dokuman Versiyonlama**
```sql
CREATE TABLE document_versions (
  id SERIAL PRIMARY KEY,
  document_id INTEGER REFERENCES asset_documents(id),
  version_number INTEGER,
  file_path TEXT,
  created_at TIMESTAMP DEFAULT now(),
  created_by INTEGER REFERENCES personnel(id),
  change_note TEXT
);
```

---

## 🔄 Workflow ve Süreç Yönetimi

### 1. **Dokuman Onay Süreci**
```sql
CREATE TABLE document_approvals (
  id SERIAL PRIMARY KEY,
  document_id INTEGER REFERENCES asset_documents(id),
  approver_id INTEGER REFERENCES personnel(id),
  status VARCHAR(20), -- pending, approved, rejected
  approval_date TIMESTAMP,
  notes TEXT
);
```

### 2. **Otomatik İşleme Pipeline**
```typescript
// Upload sonrası otomatik işlemler
const documentPipeline = [
  'virusScan',           // Virüs tarama
  'thumbnailGenerate',   // Thumbnail oluşturma
  'textExtraction',      // OCR/PDF text
  'metadataExtraction',  // Exif, properties
  'duplicateCheck',      // Hash-based duplicate
  'notifyStakeholders'   // İlgili personele bildirim
];
```

### 3. **Retention Policy**
```sql
ALTER TABLE asset_documents ADD COLUMN
retention_date DATE, -- Auto-delete date
archive_status VARCHAR(20) DEFAULT 'active' -- active, archived, deleted
```

---

## 📱 Frontend Entegrasyonu

### 1. **Drag & Drop Upload**
```typescript
// React component örneği
const DocumentUploader = {
  multipleFiles: true,
  allowedTypes: ['.pdf', '.jpg', '.png', '.doc', '.xls'],
  maxSize: '50MB',
  preview: true,
  progressBar: true
};
```

### 2. **Dokuman Görüntüleyici**
```typescript
// Built-in viewer
const DocumentViewer = {
  pdfViewer: 'PDF.js integration',
  imageViewer: 'Zoom, rotate capabilities', 
  officeViewer: 'Office Online/Google Docs',
  videoPlayer: 'HTML5 video player'
};
```

---

## 🚀 Önerilen Implementasyon Roadmap

### **Faz 1: Temel Altyapı (1-2 hafta)**
1. Cloud storage entegrasyonu (AWS S3/Google Cloud)
2. Upload/Download API'leri
3. Temel güvenlik katmanları
4. Dosya tipine göre validator

### **Faz 2: Güvenlik ve Yetkilendirme (1 hafta)**
1. Rol tabanlı erişim kontrolleri  
2. Document-level permissions
3. Audit trail entegrasyonu
4. Temporary download links

### **Faz 3: Gelişmiş Özellikler (2-3 hafta)**
1. Full-text search implementasyonu
2. Thumbnail generation
3. Document versioning
4. Approval workflow

### **Faz 4: Frontend ve UX (1-2 hafta)**
1. Drag & drop uploader
2. Document viewer/preview
3. Advanced search interface
4. Batch operations

---

## 💰 DigitalOcean Maliyet Analizi

### **Sunucu Maliyetleri (Aylık)**
- **Basic Droplet**: $5/ay (1vCPU, 1GB RAM, 25GB SSD)
- **Production Droplet**: $20/ay (2vCPU, 4GB RAM, 80GB SSD)  
- **Block Storage**: $0.10/GB/ay (ek depolama gerekirse)
- **Spaces Object Storage**: $5/ay (250GB + CDN)

### **Örnek Senaryo (1000 dokuman, ~10GB)**
- **Sadece Droplet**: $20/ay (80GB SSD yeterli)
- **Droplet + Spaces**: $25/ay (hibrit yaklaşım)
- **Toplam**: $20-25/ay (diğer cloud'lara göre çok uygun)

### **Development Effort**
- Temel dosya upload/download: 20-30 saat
- Güvenlik ve yetkilendirme: 30-40 saat  
- Frontend entegrasyonu: 20-30 saat
- **Toplam**: 70-100 saat

### **Operasyonel (DigitalOcean)**
- **Backup**: Droplet Snapshots ($1/snapshot) + otomatik rsync
- **Monitoring**: DigitalOcean Monitoring (ücretsiz)
- **SSL**: Let's Encrypt (ücretsiz)
- **Maintenance**: Minimal (Ubuntu LTS + unattended-upgrades)

---

## 🎯 DigitalOcean İçin En Optimal Çözüm

**Önerilen Yaklaşım**: **DigitalOcean Droplet + Spaces Hibrit Sistemi**

### **Aşama 1: Temel Sistem (Sadece Droplet)**
1. **DigitalOcean Droplet** ($20/ay) - ana depolama
2. **PostgreSQL** (aynı sunucuda) - metadata
3. **Nginx** - reverse proxy ve static file serving
4. **JWT + API Key** güvenlik katmanları
5. **Let's Encrypt** - ücretsiz SSL

### **Aşama 2: Ölçeklendirme (Spaces Ekleme)**
1. **DigitalOcean Spaces** - büyük dosyalar
2. **CDN** - global hızlı erişim
3. **Lifecycle policy** - otomatik arşivleme
4. **Block Storage** - ek kapasite

### **Teknik Konfigürasyon**
```bash
# Droplet Kurulumu
- Ubuntu 22.04 LTS
- Docker + Docker Compose (container'lı deployment)
- Nginx (reverse proxy + SSL termination)
- PostgreSQL (containerized)
- Node.js uygulaması (containerized)
```

### **Avantajları**
- ✅ **Tek Platform**: Tüm altyapı DigitalOcean'da
- ✅ **Maliyet Etkin**: $20-25/ay başlangıç
- ✅ **Basit Yönetim**: Tek dashboard
- ✅ **Türkiye'ye Yakın**: Frankfurt datacenter (düşük latency)
- ✅ **Ölçeklenebilir**: Kolayca upgrade edilebilir

Bu yaklaşım **maliyet-etkin, yönetilebilir ve performanslı** bir dokuman sistemi sağlar.

**Başlangıç Stratejisi**: Droplet'te prototype, sonra Spaces entegrasyonu.