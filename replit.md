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
- API Key: `ak_demo2025key`
- İzinler: data:read, data:write, asset:read, asset:write, fleet:read
- Test edildi ve çalışıyor ✅

**Güvenli Endpoint'ler:**
- `GET /api/secure/data` - Korumalı veri okuma
- `POST /api/secure/data` - Korumalı veri yazma  
- `GET /api/secure/admin-data` - Admin verilerine erişim
- Tüm endpoint'ler izin kontrolü yapıyor ✅

**Yönetim Sistemi:**
- `GET /api/admin/clients` - Client listesi
- `POST /api/admin/clients` - Yeni client oluşturma
- `GET /api/admin/stats` - Sistem istatistikleri
- JWT token ile korunuyor ✅

**Dış Erişim Hazır:**
- Sistem 0.0.0.0:5000 adresinde çalışıyor
- Replit otomatik public URL sağlıyor
- API anahtarı ile dış sunuculardan erişim mümkün ✅