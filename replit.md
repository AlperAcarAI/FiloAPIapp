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
- **Penalty APIs (Aug 16, 2025)**: Complete penalty management system with penalty types and penalties APIs, featuring Turkish error messages, audit logging, and comprehensive filtering
- **Cross-Server CORS**: Frontend-backend separation issue resolved by adding frontend domain to CORS allowedOrigins (August 10, 2025)
- **Document Upload System**: Complete file upload functionality implemented with JWT authentication, duplicate detection, and audit logging (August 9, 2025)
- **Frontend-Backend Separation**: Cross-origin requests working with proper CORS configuration for separate frontend and backend servers (August 10, 2025)
- **Personnel Company Integration**: Added company_id field to personnel table for insurance company tracking with proper database relations (August 10, 2025)
- **API Proxy System**: Secure proxy endpoint `/api/proxy/secure/documents` implemented with JWT authentication, path mapping, and automatic user ID injection (August 10, 2025)
- **Vehicle Brand/Model APIs**: Complete implementation of car brands and models APIs with Turkish documentation, filtering, pagination, and detailed views (August 11, 2025)
- **Personnel Detailed View API**: Advanced personnel_detailed PostgreSQL view with continuous work period tracking using CTEs, window functions, and gap analysis. Turkish column names, first start date calculation, comprehensive analytics, and hierarchical work area filtering - fully operational (August 17, 2025)
- **Personnel IBAN Integration**: Added IBAN field to personnel table and APIs for financial information management. Complete integration includes database schema update, validation, and API support for all CRUD operations. IBAN field included in both list and detail GET endpoints, POST creation, and search functionality (August 17, 2025)
- **Projects Table & Personnel Integration**: Added projects table with PO/PP company tracking, personnel work areas updated with project_id integration, full API support for project-based personnel assignments (August 16, 2025)
- **Personnel Work Areas Direct API**: Dedicated API endpoints for direct access to personnel_work_areas table data with JWT authentication, hierarchical filtering, comprehensive join data (personnel names, work area info, position details, project codes), and advanced filtering by personnelId, workAreaId, projectId. Includes both list and detail endpoints with pagination support (August 18, 2025)
- **Personnel Work History API**: Comprehensive work history tracking API providing chronological view of personnel assignments across work areas and projects. Features detailed statistics (total assignments, work days, unique work areas/projects), automatic duration calculation, work area grouping, and summary analytics. Includes both detailed history and summary endpoints with hierarchical authorization (August 18, 2025)
- **TC Number Registration Validation**: User registration now requires TC (Turkish ID) number validation against personnel table. System automatically matches TC numbers with existing personnel records and assigns personnel_id to user accounts. Prevents unauthorized registrations and ensures only authorized personnel can create user accounts. Includes comprehensive validation for TC format (11 digits), personnel existence, active status, and duplicate prevention (August 19, 2025)
- **Personnel Deletion API**: Soft delete functionality for personnel records with automatic deactivation of related work area assignments. Maintains data integrity while providing audit trails and preserving historical information (August 19, 2025)
- **Project Completion Rate System**: Complete project completion tracking system (0-100%) with database schema updates, API integration, and automatic status management. Projects can be created with initial completion rates and updated via dedicated completion API. System automatically updates project status based on completion percentage: 100% = completed, >0% (from planned) = active. Includes validation, notes support, and comprehensive API documentation (August 19, 2025)
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