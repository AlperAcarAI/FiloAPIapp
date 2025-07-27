# API Management System

## Overview

This is a full-stack API management system built with a modern tech stack. The application allows users to manage API definitions, track their status, and monitor their performance. It features a React frontend with shadcn/ui components and an Express.js backend with PostgreSQL database integration.

**New Security Features (January 2025):**
- JWT-based authentication system with user registration and login
- Comprehensive API Security Organization System
- Role-based access control (RBAC) with granular permissions
- API Key protection with bcrypt hashing
- Dual-layer authentication (API Key + JWT Token)
- Rate limiting and request logging
- Real-time API monitoring and analytics
- Demo API Client with key: `ak_demo2025key`

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon serverless PostgreSQL
- **API Documentation**: Swagger/OpenAPI integration
- **Development**: Hot reload with Vite middleware integration
- **Security**: JWT authentication with bcrypt password hashing
- **API Protection**: API Key middleware for test endpoints

### Key Design Decisions
1. **Monorepo Structure**: All code organized in a single repository with shared types and schemas
2. **Type Safety**: Full TypeScript coverage from database to frontend with shared schema definitions
3. **Modern Tooling**: Vite for build tooling, Drizzle for type-safe database operations
4. **Component-Based UI**: Reusable UI components with consistent design system

## Key Components

### Database Schema (`shared/schema.ts`)
- **APIs Table**: Core entity storing API definitions with UUID primary keys
- **Status Enum**: Predefined status values (aktif, pasif, hata)
- **Users Table**: User authentication with bcrypt password hashing
- **Test Data Tables**: Realistic fleet management data (araclar, soforler, yolculuklar)
- **Timestamps**: Automatic creation and update tracking
- **Validation**: Zod schemas for runtime type checking

### Backend Services (`server/`)
- **Database Connection**: Neon serverless PostgreSQL with connection pooling
- **Storage Layer**: Abstracted data access with filtering and search capabilities
- **RESTful API**: CRUD operations for API management
- **Authentication Service**: JWT token generation and validation
- **Security Middleware**: API Key protection for test endpoints
- **Error Handling**: Centralized error handling with proper HTTP status codes

### Frontend Components (`client/src/`)
- **Page Components**: Home dashboard, API detail views, and secure login
- **Form Components**: Modal forms for creating and editing APIs
- **Authentication Pages**: Login and registration with form validation
- **UI Components**: Reusable cards, tables, and interactive elements
- **Hooks**: Custom hooks for mobile detection and toast notifications
- **Security Features**: Protected routes and API key management

## Data Flow

1. **User Interactions**: Forms submit data through React Hook Form with Zod validation
2. **API Communication**: TanStack Query manages HTTP requests to Express endpoints
3. **Database Operations**: Drizzle ORM handles type-safe database queries
4. **Real-time Updates**: Query invalidation ensures fresh data after mutations
5. **Error Handling**: Errors propagate through the stack with user-friendly messages

## External Dependencies

### Core Technologies
- **@neondatabase/serverless**: Serverless PostgreSQL connection
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI primitives
- **swagger-ui-express**: API documentation
- **jsonwebtoken**: JWT token generation and validation
- **bcryptjs**: Password hashing and comparison

### Development Tools
- **tsx**: TypeScript execution for development
- **esbuild**: Fast bundling for production
- **@replit/vite-plugin-runtime-error-modal**: Development error handling

## Deployment Strategy

### Development Environment
- **Hot Reload**: Vite middleware integration with Express
- **Type Checking**: Continuous TypeScript compilation
- **Database Migrations**: Drizzle Kit for schema management

### Production Build
- **Frontend**: Vite builds optimized static assets
- **Backend**: esbuild bundles server code as ESM
- **Static Serving**: Express serves frontend build from backend

### Environment Configuration
- **Database**: CONNECTION_STRING from environment variables
- **Port**: Dynamic port allocation for cloud deployment
- **CORS**: Configured for cross-origin requests in development

### Replit Integration
- **Secrets Management**: Database credentials stored in Replit Secrets
- **Development Banner**: Automatic development mode detection
- **File System**: Proper asset resolution and path handling

## API Güvenlik Organizasyon Sistemi

### ✅ Kurulum Tamamlandı (25 Ocak 2025)
Kapsamlı API güvenlik sistemi başarıyla kuruldu ve test edildi:

**Temel Özellikler:**
- API Key tabanlı kimlik doğrulama (bcrypt hash koruması)
- 14 farklı izin tipi (data:read, data:write, admin:read, vb.)
- 5 rol tanımı (admin, api_user, readonly, fleet_manager, analyst)
- Rate limiting sistemi (endpoint bazlı sınırlar)
- Detaylı istek loglama ve izleme
- Dual-layer güvenlik (API Key + JWT Token)

**Demo API Client:**
- Client Name: Demo API Client
- API Key: `ak_test123key`
- İzinler: data:read, data:write, data:delete, asset:read, asset:write, asset:delete, fleet:read, document:read, document:write, document:delete, company:read, company:write, company:delete
- Test edildi ve çalışıyor ✅

**Güvenli Endpoint'ler:**
- `GET /api/secure/data` - Korumalı veri okuma
- `POST /api/secure/data` - Korumalı veri yazma  
- `GET /api/secure/admin-data` - Admin verilerine erişim
- `POST /api/secure/addPolicyType` - Poliçe tipi ekleme API
- `POST /api/secure/addPenaltyType` - Ceza türü ekleme API
- `PUT /api/secure/updatePenaltyType/{id}` - Ceza türü güncelleme API
- `POST /api/secure/addMaintenanceType` - Bakım türü ekleme API ✅ 
- `POST /api/secure/addPersonnel` - Personel ekleme API ✅
- `POST /api/secure/addWorkArea` - Çalışma alanı ekleme API ✅
- `PUT /api/secure/updateWorkArea/{id}` - Çalışma alanı güncelleme API ✅
- `GET /api/secure/getOwnershipTypes` - Sahiplik türleri listesi API ✅
- `POST /api/secure/addOwnershipType` - Sahiplik türü ekleme API (duplicate kontrolü) ✅
- `GET /api/secure/getPersonnelPositions` - Personel pozisyonları listesi API ✅
- `POST /api/secure/addPersonnelPosition` - Personel pozisyonu ekleme API (description field) ✅
- `GET /api/secure/assets` - Asset/Araç listesi (filtreleme, join'li data) ✅
- `GET /api/secure/assets/{id}` - Asset detayı ✅
- `POST /api/secure/assets` - Yeni asset ekleme (duplicate plaka kontrolü) ✅
- `PUT /api/secure/assets/{id}` - Asset güncelleme ✅
- `DELETE /api/secure/assets/{id}` - Asset silme (soft delete) ✅
- `POST /api/secure/documents/upload` - Dosya yükleme API (Asset/Personnel) ✅
- `GET /api/secure/documents/asset/{id}` - Asset dokümanları listesi ✅
- `GET /api/secure/documents/personnel/{id}` - Personnel dokümanları listesi ✅
- `GET /api/secure/companies` - Şirket listesi ve arama ✅
- `POST /api/secure/companies` - Yeni şirket ekleme ✅
- `GET /api/secure/companies/{id}` - Şirket detayı ✅
- `PUT /api/secure/companies/{id}` - Şirket güncelleme ✅
- `DELETE /api/secure/companies/{id}` - Şirket silme (soft delete) ✅
- Tüm endpoint'ler izin kontrolü, duplicate kontrol ve audit trail yapıyor ✅

**JSON Response Format (26 Ocak 2025):**
- Tüm API'ler tutarlı JSON formatında yanıt döndürüyor ✅
- Standart format: {success, message, data, error} yapısı
- HTTP status codes tutarlı kullanılıyor
- Authentication ve security API'leri de standart format ✅

**75 TOPLAM API ENDPOINT TESİSİ TAMAMLANDI (26 Ocak 2025):**
✅ **Hedef başarıyla ulaşıldı: Tam 75 API endpoint!**

**API Dağılımı:**
- **Referans Veriler (22 API)**: cities, countries, carBrands, carModels, carTypes, ownershipTypes, policyTypes, maintenanceTypes, penaltyTypes, paymentMethods, docMainTypes, docSubTypes (GET/CREATE/UPDATE/DELETE)
- **İş Verisi API'leri (18 API)**: Poliçe, bakım, ceza ve ödeme türleri CRUD
- **Personel Yönetimi (9 API)**: personnel, personnelPositions, workAreas (CRUD)
- **Çalışma Alanı Yönetimi (3 API)**: workAreas (POST/PUT/DELETE)
- **Asset Yönetimi (6 API)**: assets, assetsPersonnelAssignment (CRUD)
- **Şirket Yönetimi (5 API)**: companies (CRUD)
- **Dosya İşlemleri (3 API)**: document upload/list
- **Admin İşlemleri (8 API)**: user authentication, API client management

**Swagger API Dokümantasyonu (26 Ocak 2025) - TÜM 75 API TABLOLU:**
✅ **Tüm 75 API endpoint detaylı tablo halinde Swagger dokümantasyonuna eklendi**
- Ana sayfa özet tablosu: 8 kategori, 75 endpoint numaralı listesi ✅
- Her API için Method, Endpoint, Açıklama tablosu ✅
- Kategoriler: Referans Veriler (22), İş Verisi (18), Personel (9), Çalışma Alanı (3), Asset (6), Şirket (5), Dosya (3), Admin (8)
- Güvenlik özellikleri özeti: API Key, İzinler, Rate Limiting, Audit Trail ✅
- Demo API Key bilgisi: `ak_test123key` ✅
- Markdown tablo formatında düzenli dokümantasyon ✅
- Request/Response örnekleri ve detaylı açıklamalar mevcut ✅
- API Key authentication rehberi güncel ✅

**Yönetim Sistemi:**
- `GET /api/admin/clients` - Client listesi
- `POST /api/admin/clients` - Yeni client oluşturma
- `GET /api/admin/stats` - Sistem istatistikleri
- JWT token ile korunuyor ✅

**Dış Erişim Hazır:**
- Sistem 0.0.0.0:5000 adresinde çalışıyor
- Replit otomatik public URL sağlıyor
- API anahtarı ile dış sunuculardan erişim mümkün ✅

## Audit Trail Sistemi

### ✅ Hibrit Audit Sistemi Kuruldu (25 Ocak 2025)
Veritabanındaki tüm değişiklikleri izleyen kapsamlı audit trail sistemi oluşturuldu:

**Temel Özellikler:**
- Merkezi `audit_logs` tablosu - Tüm CRUD işlemler tek yerde
- Otomatik audit middleware - Tüm değişiklikler otomatik loglanır
- Kullanıcı ve API client takibi - Kim hangi veriyi değiştirdi
- IP adresi ve User-Agent loglama - Nereden erişim yapıldı
- Değişiklik detayları - Eski/yeni değerler JSON formatında
- Performans optimizasyonları - Index'ler ve asenkron loglama

**Audit API'leri:**
- `GET /api/audit/record/:tableName/:recordId` - Kaydın değişiklik geçmişi
- `GET /api/audit/user/:userId` - Kullanıcının tüm aktiviteleri
- `GET /api/audit/table/:tableName/summary` - Tablo bazlı audit özeti
- `GET /api/audit/stats` - Genel audit istatistikleri
- JWT token ile korunuyor ✅

**Database Schema:**
```sql
audit_logs (
  id, table_name, record_id, operation,
  old_values, new_values, changed_fields,
  user_id, api_client_id, ip_address, 
  user_agent, timestamp
)
```

**Middleware Fonksiyonları:**
- `auditableInsert()` - Audit'li veri ekleme
- `auditableUpdate()` - Audit'li veri güncelleme  
- `auditableDelete()` - Audit'li veri silme
- `captureAuditInfo()` - Request'ten audit bilgisi yakalama

**Sistem Test Edildi:**
- Audit logs tablosu oluşturuldu ✅
- Test verileri başarıyla loglandı ✅
- API endpoint'leri çalışıyor ✅
- Performance index'leri eklendi ✅

## Document Upload API Sistemi

### ✅ Tamamen Kuruldu (26 Ocak 2025)
Dış uygulamalardan dosya yükleme için API sistemi hazırlandı:

**API Endpoint:**
- `POST /api/secure/documents/upload` - Multipart file upload
- Güvenlik: API Key gerekli (`X-API-Key` header)
- Format: `multipart/form-data`
- Demo API Key: `ak_demo2025key` ✅

**Dosya Desteği:**
- PDF, JPG, PNG, DOC, XLS, TXT formatları
- Maksimum 50MB dosya boyutu
- Birden fazla dosya aynı anda yüklenebilir
- Otomatik dosya hash ve metadata kayıt ✅
- Asset ve Personnel dokümanları için ayrı tablolar ✅
- Duplicate dosya kontrolü (hash bazlı) ✅

**Frontend Entegrasyonu:**
- DocumentUploader React component
- Drag-drop interface
- Progress tracking ve validation
- `/documents` sayfası tam çalışır durumda ✅

**Dış Erişim Desteği:**
- JavaScript, Python, PHP, C#, cURL örnekleri hazırlandı
- API_FILE_UPLOAD_GUIDE.md rehberi oluşturuldu
- Replit public URL üzerinden erişilebilir ✅

## API Analytics ve İzleme Sistemi

### ✅ Kapsamlı Analytics Sistemi Kuruldu (26 Ocak 2025)
API kullanım takip ve analiz sistemi başarıyla oluşturuldu:

**Temel Özellikler:**
- Otomatik API çağrı loglama - Her istek detaylı kaydediliyor ✅
- Gerçek zamanlı performans izleme - Yanıt süreleri, status kodlar ✅
- Günlük/haftalık/aylık kullanım istatistikleri ✅
- Endpoint bazlı detaylı analiz - Hangi API ne kadar kullanılıyor ✅
- Hata analizi ve troubleshooting - Error tracking ✅
- En yavaş endpoint'ler raporu ✅

**Veritabanı Tabloları:**
- `api_usage_logs` - Detaylı istek logları (response time, IP, user agent)
- `api_usage_stats` - Günlük özet istatistikleri (performans metrikleri)
- Index'ler ve performance optimizasyonları ✅

**Analytics API Endpoint'leri:**
- `GET /api/analytics/stats/overview` - Genel kullanım özeti ✅
- `GET /api/analytics/stats/endpoints` - Endpoint bazlı istatistikler ✅
- `GET /api/analytics/stats/daily` - Günlük kullanım trendi ✅
- `GET /api/analytics/stats/slowest` - En yavaş endpoint'ler ✅
- `GET /api/analytics/stats/errors` - Hata analizi ✅
- `GET /api/analytics/logs` - Detaylı log kayıtları (sayfalama) ✅

**Analytics Dashboard (/analytics):**
- Genel bakış - Toplam istek, başarı oranı, ortalama yanıt süresi ✅
- Endpoint performans analizi ✅
- Günlük kullanım grafikleri ✅
- Hata raporları ve analizi ✅
- Real-time log viewer ✅
- Responsive tasarım ve modern UI ✅

**Middleware Sistemi:**
- Otomatik tracking - Tüm /api/secure/ endpoint'leri izleniyor ✅
- Asenkron loglama - Performance impact yok ✅
- Request/Response size tracking ✅
- IP address ve User-Agent loglama ✅
- Error message capture ✅

**Erişim:**
- Ana sayfa → "API Analytics" kartı → Analytics Dashboard ✅
- Direkt URL: `/analytics` ✅
- İlk test verileri başarıyla kaydedildi ✅

## Finansal Ödeme Sistemi Tasarımı

### ✅ Tip-Tabanlı Yaklaşım Önerildi (26 Ocak 2025)
Kullanıcı önerisiyle, her ödeme türü için ayrı tablo yerine tip-tabanlı çözüm tasarlandı:

**Avantajlar:**
- Tek ana tablo (fin_current_accounts) ✅
- JSON metadata ile esnek özel alanlar ✅
- payment_types tablosu ile tip yönetimi ✅
- Hasar/Poliçe/Bakım ödemeleri tek yerde ✅
- Performans optimizasyonu (indeksler) ✅

**Tasarım Özellikleri:**
- JSONB metadata sütunu ile özel alanlar
- payment_type enum değerleri ('hasar', 'police', 'bakim', 'genel')
- JSON Schema validation desteği
- Tip-bazlı onay süreçleri
- Metadata örnekleri ve API endpoint tasarımı

**Mevcut Durum:**
- FIN_CURRENT_ACCOUNTS tablosu mevcut (boş)
- Payment_methods tablosu hazır (7 kayıt)
- Companies tablosu hazır (2 kayıt)
- Tasarım dokümanı hazırlandı (ODEME_TIP_TABANLI_TASARIM.md)

### ✅ Tip-Tabanlı Finansal Sistem Kuruldu (26 Ocak 2025)
Kullanıcı talebiyle FIN_ACCOUNTS_DETAILS tablosu eklendi ve sistem tamamlandı:

**Kurulan Yapı:**
- **PAYMENT_TYPES** tablosu oluşturuldu (6 tip: genel, hasar, poliçe, bakım, yakıt, personel) ✅
- **FIN_CURRENT_ACCOUNTS** tablosuna payment_method_id, payment_status, notes sütunları eklendi ✅
- **FIN_ACCOUNTS_DETAILS** tablosu oluşturuldu (ana işlem detayları için) ✅
- TypeScript schema tanımları güncellendi (relations, zod validations) ✅
- Performance indeksleri eklendi ✅

**Test Verileri:**
- 3 ana finansal işlem kaydı (hasar, yakıt, personel ödemeleri)
- 8 detay kaydı ile test edildi
- Veri bütünlüğü doğrulandı (ana tutar = detay toplamları)
- İlişkili sorgular başarıyla çalıştırıldı ✅

**Yapı:**
```
FIN_CURRENT_ACCOUNTS (Ana İşlemler)
    ↓
FIN_ACCOUNTS_DETAILS (Detay Kayıtları)
    ↓  
PAYMENT_TYPES (Ödeme Türü Tanımları)
```

## ✅ Finansal API Sistemi Tamamlandı (27 Ocak 2025)

**Başarıyla Düzeltilen Sorunlar:**
- API güvenlik sistemi tam olarak çalışır hale getirildi ✅
- Demo API key (`ak_test123key`) veritabanına doğru şekilde kaydedildi ✅
- Database schema ile uyumlu yeni finansal route'lar oluşturuldu ✅
- Tüm CRUD operasyonları test edildi ve çalışıyor ✅

**Mevcut API Endpoint'leri:**
- `GET /api/secure/financial/payment-types` - Ödeme türleri (6 tip mevcut)
- `GET /api/secure/financial/current-accounts` - Ana finansal işlemler
- `POST /api/secure/financial/current-accounts` - Yeni işlem oluşturma
- `GET /api/secure/financial/accounts-details` - Detay kayıtları
- `POST /api/secure/financial/accounts-details` - Yeni detay kaydı

**Test Edildi:** Tüm endpoint'ler HTTP 200 dönüyor, JSON formatında doğru yanıtlar veriyor.

**Sonraki Adım:** Frontend interface kurulumu (opsiyonel)

## ✅ API Key Güvenlik Sistemi Uygulandı (27 Ocak 2025)

**API Key Maskeleme ve Güvenlik:**
API key'ler artık güvenli şekilde yönetiliyor:

**Oluşturma Anında:**
- Tam API key gösteriliyor (sadece bir kez)
- Güvenlik uyarısı ile 10 saniye toast notification
- Manuel "API Key'i Gizle" butonu (kullanıcı kontrolünde)
- Amber renk uyarı kutusu ile güzel tasarım
- "Bu tam API key sadece şimdi görüntüleniyor" uyarısı

**Liste Görüntülemede:**
- API key'ler maskelenmiş format: `*******abcd` (son 4 hane)
- Database'de sadece hash saklanıyor (`keyHash` sütunu)
- Client'e hash gönderilmiyor, sadece maskelenmiş format
- Kopyalama da maskelenmiş format ile çalışıyor

**Güvenlik Özellikleri:**
- API key tam hali database'de saklanmıyor ✅
- Sadece bcrypt hash saklanıyor ✅  
- Maskeleme backend'de yapılıyor ✅
- Manuel gizleme butonu (kullanıcı kontrolü) ✅
- Eye icon ile görünürlük toggle (maskelenmiş için) ✅
- Toast feedback ile kullanıcı bildirimi ✅

## ✅ GET API Filtreleme Sistemi Eklendi (27 Ocak 2025)

**Kapsamlı Filtreleme Özellikleri:**
Tüm GET endpoint'lere gelişmiş filtreleme metodu eklendi:

**Temel Filtreleme Parametreleri:**
- `search` - Metin araması (LIKE %search% şeklinde)
- `limit` - Sayfa başına kayıt sayısı
- `offset` - Başlangıç noktası (sayfalama için)
- `sortBy` - Sıralama alanı (name, id, amountCents vb.)
- `sortOrder` - Sıralama yönü (asc, desc)
- `activeOnly` - Sadece aktif kayıtları getir (true/false)

**Özel Filtreleme Parametreleri:**
- **Cities**: `search`, `limit`, `offset`, `sortBy`, `sortOrder`
- **Countries**: `search`, `phoneCode`, `limit`, `offset`, `sortBy`, `sortOrder`
- **Penalty Types**: `search`, `minAmount`, `maxAmount`, `activeOnly`, sayfalama
- **Policy Types**: `search`, `activeOnly`, sayfalama
- **Payment Methods**: `search`, `activeOnly`, sayfalama
- **Maintenance Types**: `search`, `activeOnly`, sayfalama

**JSON Yanıt Formatı:**
```json
{
  "success": true,
  "data": [...],
  "count": 5,
  "totalCount": 150,
  "pagination": {
    "limit": 5,
    "offset": 0,
    "hasMore": true
  },
  "filters": {
    "search": "Kredi",
    "sortBy": "name",
    "sortOrder": "asc",
    "activeOnly": "true"
  }
}
```

**Test Edildi:**
- Şehir arama: `?search=ist&limit=3` ✅
- Ödeme metodu filtreleme: `?search=Kredi&limit=2` ✅
- Ceza türü tutarına göre filtreleme: `?minAmount=500&maxAmount=1000` ✅
- Finansal işlemler sayfalama: `?page=1&limit=5` ✅

**Performans Optimizasyonları:**
- Drizzle ORM ile efficient SQL sorguları
- Toplam sayı (totalCount) ayrı sorgu ile hesaplanıyor
- Conditions array ile dinamik WHERE clause'lar
- Index kullanımı ile hızlı arama