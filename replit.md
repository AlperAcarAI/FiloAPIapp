# Filoki API Management System

## Overview

This is a full-stack API management system designed to manage API definitions, track their status, and monitor performance. It features a React frontend and an Express.js backend with PostgreSQL. The system integrates robust security features, including JWT authentication, role-based access control, API Key protection, rate limiting, and real-time monitoring. The multi-tenant system has been removed for simplicity, using a straightforward authentication approach instead. Its vision is to provide a comprehensive solution for managing and securing an enterprise's API landscape, enabling efficient operations and robust data protection.

## User Preferences

Preferred communication style: Simple, everyday language.

## Production Deployment

- **Domain**: filokiapi.architectaiagency.com
- **Database**: filoki_db (PostgreSQL local instance)
- **Admin Credentials**: alper.acar@architectaiagency.com / Acar
- **Status**: Production deployment active with PM2, Nginx, SSL
- **API Key**: filoki-api-master-key-2025 (single master key for all protected endpoints)
- **Authentication**: JWT-based with refresh tokens (login endpoint is public, no API key required)
- **Database Driver**: PostgreSQL (pg) - switched from Neon serverless for production compatibility
- **Working Endpoints**: 
  - /api/getCities (200 OK - returns Turkish cities)
  - /api/health (200 OK)
  - /api/docs (Swagger documentation)
- **Recent Fixes**: Database connection issue resolved by switching from @neondatabase/serverless to pg driver
- **Column Rename (Aug 14, 2025)**: Successfully renamed `km_hour_limit` to `km_month_limit` in rental_assets table with complete API updates
- **Policy APIs (Aug 16, 2025)**: Implemented comprehensive policy management APIs with full CRUD operations for policy types and asset policies
- **Cross-Server CORS**: Frontend-backend separation issue resolved by adding frontend domain to CORS allowedOrigins (August 10, 2025)
- **Document Upload System**: Complete file upload functionality implemented with JWT authentication, duplicate detection, and audit logging (August 9, 2025)
- **Frontend-Backend Separation**: Cross-origin requests working with proper CORS configuration for separate frontend and backend servers (August 10, 2025)
- **Personnel Company Integration**: Added company_id field to personnel table for insurance company tracking with proper database relations (August 10, 2025)
- **API Proxy System**: Secure proxy endpoint `/api/proxy/secure/documents` implemented with JWT authentication, path mapping, and automatic user ID injection (August 10, 2025)
- **Vehicle Brand/Model APIs**: Complete implementation of car brands and models APIs with Turkish documentation, filtering, pagination, and detailed views (August 11, 2025)
- **Deployment Date**: August 6, 2025

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **Routing**: Wouter
- **State Management**: TanStack Query
- **UI Components**: shadcn/ui (built on Radix UI)
- **Styling**: Tailwind CSS
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM (Neon serverless)
- **API Documentation**: Swagger/OpenAPI integration
- **Security**: JWT authentication, bcrypt password hashing, API Key middleware
- **Monorepo Structure**: Shared types and schemas across frontend and backend
- **Type Safety**: Full TypeScript coverage with shared schema definitions

### Key Design Decisions
- **Component-Based UI**: Reusable UI components for consistent design.
- **Simplified Authentication**: Basic JWT-based authentication without complex multi-tenant architecture for easier development and maintenance.
- **Unified Document System**: Polymorphic `documents` table for various entity types (personnel, asset, company, work_area).
- **Hybrid Audit System**: Centralized `audit_logs` table tracking all database changes with user and API client info.
- **Domain-Based API Key Restrictions**: API keys are restricted to specified domains (including wildcard and subdomain support).
- **Hierarchical Authorization System**: Session-based access control with JSON-based `access_scope` for flexible, multi-level hierarchy (Site, Region, HQ, Department).
- **Soft Delete**: Instead of hard deletion, records are marked as `isActive = false` to preserve data integrity and audit trails.
- **Type-Based Financial System**: A single `fin_current_accounts` table with JSON metadata for flexible handling of different payment types (damage, policy, maintenance, general).
- **Advanced API Filtering**: All GET endpoints support common filtering parameters (`search`, `limit`, `offset`, `sortBy`, `sortOrder`, `activeOnly`) and specific filters for relevant entities.
- **Bulk CSV Import**: Optimized for large data imports with micro-batching, duplicate prevention, progress tracking, and error handling for entities like vehicle brands and models.

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