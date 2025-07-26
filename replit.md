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

**Swagger API Dokümantasyonu (26 Ocak 2025):**
- Tüm API'ler Swagger dokümantasyonunda mevcut ✅
- Company Management API'leri eklendi (GET, POST, PUT, DELETE)
- Asset Management API'leri eklendi (GET, POST, PUT, DELETE)
- Genel API'ler kategorisi eklendi (/api/getCities)
- 6 ana kategori: Referans Veriler, Veri İşlemleri, Dosya İşlemleri, Şirket Yönetimi, Asset Yönetimi, Genel API'ler
- Request/Response örnekleri ve detaylı açıklamalar ✅
- API Key authentication rehberi mevcut ✅

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