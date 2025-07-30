import type { Express } from "express";
import type { ApiRequest } from "./api-security";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db, pool } from "./db";
import { 
  apiClients, 
  apiKeys, 
  apiTokens, 
  apiRequestLogs, 
  apiEndpoints,
  apiClientPermissions,
  apiRateLimit,
  auditLogs,
  apiUsageLogs,
  apiUsageStats,
  permissions,
  roles,
  users,
  companies,
  cities,
  penaltyTypes,
  countries,
  policyTypes,
  paymentMethods,
  maintenanceTypes,
  personnel,
  workAreas,
  docMainTypes,
  docSubTypes,
  carBrands,
  carModels,
  carTypes,
  ownershipTypes,
  personnelPositions,
  personnelWorkAreas,
  assetsPersonelAssignment
} from "@shared/schema";
import { 
  insertApiClientSchema,
  insertApiKeySchema,
  insertApiEndpointSchema,
  insertRoleSchema,
  insertPermissionSchema,
  insertPolicyTypeSchema,
  insertPenaltyTypeSchema,
  updatePenaltyTypeSchema,
  insertMaintenanceTypeSchema,
  insertPersonnelSchema,
  insertWorkAreaSchema,
  updateWorkAreaSchema,
  insertCarBrandSchema,
  insertCarModelSchema,
  insertOwnershipTypeSchema,
  updateOwnershipTypeSchema,
  insertPersonnelPositionSchema,
  updatePersonnelPositionSchema,
  insertPersonnelWorkAreaSchema,
  updatePersonnelWorkAreaSchema,
  insertAssetsPersonelAssignmentSchema,
  updateAssetsPersonelAssignmentSchema
} from "@shared/schema";
import { eq, and, desc, asc, sql, count, avg, gte, lte, not, like, ilike } from "drizzle-orm";
import { 
  authenticateApiKey,
  authenticateApiToken,
  authorizeEndpoint,
  rateLimitMiddleware,
  logApiRequest,
  createApiClient,
  generateApiKey,
  hashApiKey,
  generateApiToken,
  getApiStats
} from "./api-security";
import { authenticateToken } from "./auth";
import { auditableInsert, auditableUpdate, auditableDelete, captureAuditInfo } from "./audit-middleware";
import swaggerUi from 'swagger-ui-express';

export function registerApiManagementRoutes(app: Express) {
  
  // ========================
  // SWAGGER API DOKÜMANTASYONU
  // ========================
  
  const swaggerDocument = {
    openapi: '3.0.0',
    info: {
      title: 'FiloApi - Fleet Management System',
      version: '3.0.0',
      description: 'Kapsamlı filo yönetimi API sistemi. 138+ endpoint ile tam güvenlik kontrolü.',
      contact: {
        name: 'API Desteği',
        email: 'alper.acar@architectaiagency.com'
      },
      license: {
        name: 'Private License',
        url: '#'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' ? 'https://your-domain.replit.app' : 'http://localhost:5000',
        description: process.env.NODE_ENV === 'production' ? 'Production Server' : 'Development Server'
      }
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API anahtarı. Örnek: ak_prod2025_rwba6dj1sw'
        }
      },
      schemas: {
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'İşlem başarılı' },
            data: { type: 'object' },
            error: { type: 'string' }
          }
        },
        City: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Istanbul' }
          }
        },
        Asset: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            plateNumber: { type: 'string', example: '34ABC123' },
            modelName: { type: 'string', example: 'Ford Transit' },
            year: { type: 'integer', example: 2023 }
          }
        }
      }
    },
    tags: [
      { name: 'Referans Veriler', description: 'Şehir, ülke, araç markaları vb. temel veriler' },
      { name: 'Asset Yönetimi', description: 'Araç ve varlık yönetimi işlemleri' },
      { name: 'Personel Yönetimi', description: 'Personel CRUD işlemleri' },
      { name: 'Şirket Yönetimi', description: 'Şirket bilgileri yönetimi' },
      { name: 'Dosya İşlemleri', description: 'Doküman yükleme ve yönetimi' },
      { name: 'Finansal İşlemler', description: 'Ödeme ve finansal kayıtlar' },
      { name: 'Admin İşlemleri', description: 'Sistem yönetimi ve kullanıcı işlemleri' }
    ]
  };

  // Basic API documentation endpoint
  app.get('/api/docs', (req, res) => {
    res.json({
      message: 'Fleet Management API Documentation',
      version: '1.0.0',
      endpoints: {
        total: 75,
        categories: [
          'Referans Veriler (22 API)',
          'İş Verisi (18 API)',
          'Personel Yönetimi (9 API)',
          'Çalışma Alanı (3 API)',
          'Asset Yönetimi (6 API)',
          'Şirket Yönetimi (5 API)',
          'Dosya İşlemleri (3 API)',
          'Admin İşlemleri (8 API)'
        ]
      },
      authentication: 'API Key Required (X-API-Key header)',
      demoKey: 'ak_test123key'
    });
  });
}
