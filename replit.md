# Filoki API Management System

## Overview

This is a full-stack API management system designed to manage API definitions, track their status, and monitor performance. It features a React frontend and an Express.js backend with PostgreSQL. The system integrates robust security features, including JWT authentication, role-based access control, API Key protection, rate limiting, and real-time monitoring. The multi-tenant system has been removed for simplicity, using a straightforward authentication approach instead. Its vision is to provide a comprehensive solution for managing and securing an enterprise's API landscape, enabling efficient operations and robust data protection.

## User Preferences

Preferred communication style: Simple, everyday language.

## Production Deployment

- **Domain**: filokiapi.architectaiagency.com
- **Database**: fleet_db
- **Admin Credentials**: admin@example.com / Architect
- **Status**: Configured for production with JWT secrets and CORS

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