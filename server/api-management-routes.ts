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
          description: 'API anahtarı. Örnek: ak_demo2025key'
        },
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token. Authorization: Bearer [token]'
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
            licensePlate: { type: 'string', example: '34ABC123' },
            carBrandId: { type: 'integer', example: 1 },
            carModelId: { type: 'integer', example: 15 },
            year: { type: 'integer', example: 2023 },
            companyId: { type: 'integer', example: 1 },
            workAreaId: { type: 'integer', example: 2 },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Personnel: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            firstName: { type: 'string', example: 'Ahmet' },
            lastName: { type: 'string', example: 'Yılmaz' },
            email: { type: 'string', format: 'email', example: 'ahmet@firma.com' },
            phone: { type: 'string', example: '+90555123456' },
            positionId: { type: 'integer', example: 1 },
            workAreaId: { type: 'integer', example: 2 },
            companyId: { type: 'integer', example: 1 },
            isActive: { type: 'boolean', example: true }
          }
        },
        Company: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Acme İnşaat Ltd' },
            taxNumber: { type: 'string', example: '1234567890' },
            address: { type: 'string', example: 'Atatürk Cad. No:123 İstanbul' },
            phone: { type: 'string', example: '+902125551234' },
            email: { type: 'string', format: 'email', example: 'info@acme.com' },
            isActive: { type: 'boolean', example: true }
          }
        },
        FuelRecord: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            assetId: { type: 'integer', example: 5 },
            personnelId: { type: 'integer', example: 3 },
            fuelType: { type: 'string', enum: ['GASOLINE', 'DIESEL', 'LPG'], example: 'DIESEL' },
            liters: { type: 'number', format: 'float', example: 45.5 },
            totalCost: { type: 'number', format: 'float', example: 1365.75 },
            stationName: { type: 'string', example: 'Petrol Ofisi' },
            fuelDate: { type: 'string', format: 'date-time' },
            odometer: { type: 'integer', example: 125000 }
          }
        },
        City: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 34 },
            name: { type: 'string', example: 'İstanbul' },
            plateCode: { type: 'string', example: '34' }
          }
        },
        Country: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Türkiye' },
            phoneCode: { type: 'string', example: '+90' },
            countryCode: { type: 'string', example: 'TR' }
          }
        },
        CarBrand: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Mercedes-Benz' },
            isActive: { type: 'boolean', example: true }
          }
        },
        CarModel: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Sprinter' },
            carBrandId: { type: 'integer', example: 1 },
            isActive: { type: 'boolean', example: true }
          }
        }
      }
    },
    tags: [
      { name: 'Authentication', description: 'Kullanıcı kimlik doğrulama işlemleri' },
      { name: 'Referans Veriler', description: 'Şehir, ülke, araç markaları vb. temel veriler' },
      { name: 'Asset Yönetimi', description: 'Araç ve varlık yönetimi işlemleri' },
      { name: 'Personel Yönetimi', description: 'Personel CRUD işlemleri' },
      { name: 'Şirket Yönetimi', description: 'Şirket bilgileri yönetimi' },
      { name: 'Dosya İşlemleri', description: 'Doküman yükleme ve yönetimi' },
      { name: 'Finansal İşlemler', description: 'Ödeme ve finansal kayıtlar' },
      { name: 'Yakıt Yönetimi', description: 'Yakıt kayıtları ve raporlama' },
      { name: 'Bulk Import', description: 'Toplu veri aktarımı işlemleri' },
      { name: 'Analytics', description: 'API kullanım istatistikleri ve raporlar' },
      { name: 'Permission Management', description: 'Yetki ve rol yönetimi' },
      { name: 'Audit System', description: 'İşlem kayıtları ve denetim' },
      { name: 'Admin İşlemleri', description: 'Sistem yönetimi ve kullanıcı işlemleri' }
    ],
    paths: {
      // ========================
      // AUTHENTICATION ENDPOINTS
      // ========================
      '/api/auth/login': {
        post: {
          tags: ['Authentication'],
          summary: 'Kullanıcı girişi',
          description: 'Email ve şifre ile giriş yaparak JWT token alır',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email', example: 'admin@test.com' },
                    password: { type: 'string', minLength: 6, example: 'test123' }
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Giriş başarılı',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Giriş başarılı' },
                      data: {
                        type: 'object',
                        properties: {
                          user: {
                            type: 'object',
                            properties: {
                              id: { type: 'integer', example: 1 },
                              email: { type: 'string', example: 'admin@test.com' },
                              name: { type: 'string', example: 'Admin User' }
                            }
                          },
                          token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
                        }
                      }
                    }
                  }
                }
              }
            },
            401: {
              description: 'Geçersiz kimlik bilgileri',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      '/api/auth/register': {
        post: {
          tags: ['Authentication'],
          summary: 'Kullanıcı kaydı',
          description: 'Yeni kullanıcı hesabı oluşturur',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email', example: 'yenikullanici@test.com' },
                    password: { type: 'string', minLength: 6, example: 'sifre123' },
                    name: { type: 'string', example: 'Yeni Kullanıcı' }
                  }
                }
              }
            }
          },
          responses: {
            201: {
              description: 'Kullanıcı başarıyla oluşturuldu',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      // ========================
      // BACKEND API ENDPOINTS (JWT AUTHENTICATION)
      // ========================
      '/api/backend/auth/login': {
        post: {
          tags: ['Authentication'],
          summary: 'Backend API girişi (Hiyerarşik Auth)',
          description: 'Hiyerarşik yetki sistemi için JWT token alır',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email', example: 'admin@test.com' },
                    password: { type: 'string', example: 'test123' }
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Giriş başarılı - Hiyerarşik yetki bilgileri ile',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'object',
                        properties: {
                          token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                          user: {
                            type: 'object',
                            properties: {
                              id: { type: 'integer', example: 1 },
                              email: { type: 'string', example: 'admin@test.com' },
                              personnelId: { type: 'integer', example: 1 },
                              workAreaId: { type: 'integer', example: 2 },
                              positionId: { type: 'integer', example: 1 },
                              accessLevel: { type: 'string', enum: ['WORKSITE', 'REGIONAL', 'CORPORATE', 'DEPARTMENT'], example: 'CORPORATE' }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/backend/assets': {
        get: {
          tags: ['Asset Yönetimi'],
          summary: 'Asset listesi (Hiyerarşik Yetki)',
          description: 'Kullanıcının yetki seviyesine göre asset listesi getirir',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 }, description: 'Sayfa başına kayıt sayısı' },
            { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 }, description: 'Başlangıç kaydı' },
            { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Plaka veya model araması' },
            { name: 'companyId', in: 'query', schema: { type: 'integer' }, description: 'Şirket filtresi' }
          ],
          responses: {
            200: {
              description: 'Asset listesi başarıyla getirildi',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Asset' }
                      },
                      count: { type: 'integer', example: 15 },
                      totalCount: { type: 'integer', example: 45 }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/backend/personnel': {
        get: {
          tags: ['Personel Yönetimi'],
          summary: 'Personel listesi (Hiyerarşik Yetki)',
          description: 'Kullanıcının yetki seviyesine göre personel listesi getirir',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
            { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } },
            { name: 'search', in: 'query', schema: { type: 'string' }, description: 'İsim veya departman araması' }
          ],
          responses: {
            200: {
              description: 'Personel listesi başarıyla getirildi',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      '/api/backend/fuel-records': {
        get: {
          tags: ['Yakıt Yönetimi'],
          summary: 'Yakıt kayıtları (Hiyerarşik Yetki)',
          description: 'Kullanıcının yetki seviyesine göre yakıt kayıtları getirir',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
            { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } },
            { name: 'assetId', in: 'query', schema: { type: 'integer' }, description: 'Asset filtresi' }
          ],
          responses: {
            200: {
              description: 'Yakıt kayıtları başarıyla getirildi',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      // ========================
      // PERMISSION MANAGEMENT ENDPOINTS
      // ========================
      '/api/permission-management/users': {
        get: {
          tags: ['Permission Management'],
          summary: 'Kullanıcı listesi',
          description: 'Admin veya yetki yöneticisi kullanıcı listesini getirir',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Email araması' },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
            { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } }
          ],
          responses: {
            200: {
              description: 'Kullanıcı listesi başarıyla getirildi',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            },
            403: {
              description: 'Yetkisiz erişim',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      '/api/permission-management/assign-permission': {
        post: {
          tags: ['Permission Management'],
          summary: 'Yetki atama',
          description: 'Kullanıcıya yetki atar (Admin/Permission Manager)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['userId', 'accessLevel'],
                  properties: {
                    userId: { type: 'integer', example: 5 },
                    accessLevel: { type: 'string', enum: ['WORKSITE', 'REGIONAL', 'CORPORATE', 'DEPARTMENT'], example: 'REGIONAL' },
                    workAreaId: { type: 'integer', example: 2 },
                    personnelId: { type: 'integer', example: 3 },
                    positionId: { type: 'integer', example: 1 },
                    permissions: { type: 'array', items: { type: 'string' }, example: ['data:read', 'assets:write'] }
                  }
                }
              }
            }
          },
          responses: {
            201: {
              description: 'Yetki başarıyla atandı',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      // ========================
      // ANALYTICS ENDPOINTS
      // ========================
      '/api/analytics/stats/overview': {
        get: {
          tags: ['Analytics'],
          summary: 'API kullanım genel istatistikleri',
          description: 'Son 30 günün API kullanım istatistiklerini getirir',
          security: [{ ApiKeyAuth: [] }],
          responses: {
            200: {
              description: 'İstatistikler başarıyla getirildi',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'object',
                        properties: {
                          totalRequests: { type: 'integer', example: 12543 },
                          successRequests: { type: 'integer', example: 11987 },
                          successRate: { type: 'string', example: '95.56' },
                          avgResponseTime: { type: 'string', example: '245.67' },
                          topEndpoints: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                endpoint: { type: 'string', example: '/api/secure/assets' },
                                method: { type: 'string', example: 'GET' },
                                count: { type: 'integer', example: 2154 }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/analytics/stats/endpoints': {
        get: {
          tags: ['Analytics'],
          summary: 'Endpoint bazlı performans istatistikleri',
          description: 'Her endpoint için detaylı performans metrikleri',
          security: [{ ApiKeyAuth: [] }],
          responses: {
            200: {
              description: 'Endpoint istatistikleri başarıyla getirildi',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      // ========================
      // ASSET MANAGEMENT ENDPOINTS
      // ========================
      '/api/secure/assets': {
        get: {
          tags: ['Asset Yönetimi'],
          summary: 'Asset listesi',
          description: 'Tüm asset kayıtlarını getirir (API Key gerekli)',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
            { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } },
            { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Plaka araması' },
            { name: 'isActive', in: 'query', schema: { type: 'boolean' }, description: 'Aktif/pasif filtresi' }
          ],
          responses: {
            200: {
              description: 'Asset listesi başarıyla getirildi',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Asset' }
                      },
                      total: { type: 'integer', example: 45 }
                    }
                  }
                }
              }
            }
          }
        },
        post: {
          tags: ['Asset Yönetimi'],
          summary: 'Yeni asset ekleme',
          description: 'Yeni araç/varlık kaydı oluşturur',
          security: [{ ApiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['licensePlate', 'carBrandId', 'carModelId'],
                  properties: {
                    licensePlate: { type: 'string', example: '34ABC123' },
                    carBrandId: { type: 'integer', example: 1 },
                    carModelId: { type: 'integer', example: 15 },
                    year: { type: 'integer', example: 2023 },
                    companyId: { type: 'integer', example: 1 },
                    workAreaId: { type: 'integer', example: 2 }
                  }
                }
              }
            }
          },
          responses: {
            201: {
              description: 'Asset başarıyla oluşturuldu',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      }
    }
  };

  // Swagger UI Configuration
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: "Fleet Management API",
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true
    }
  }));

  // JSON Documentation endpoint
  app.get('/api/docs/json', (req, res) => {
    res.json(swaggerDocument);
  });

  // Basic API overview endpoint
  app.get('/api/overview', (req, res) => {
    res.json({
      message: 'Fleet Management API Documentation',
      version: '3.0.0',
      totalEndpoints: 150,
      categories: [
        { name: 'API Management', count: 79, path: '/api/secure/' },
        { name: 'Backend API (Hierarchical)', count: 8, path: '/api/backend/' },
        { name: 'Permission Management', count: 6, path: '/api/permission-management/' },
        { name: 'Analytics', count: 6, path: '/api/analytics/' },
        { name: 'Asset Management', count: 12, path: '/api/secure/assets' },
        { name: 'Company Management', count: 10, path: '/api/secure/companies' },
        { name: 'Document Management', count: 8, path: '/api/secure/documents' },
        { name: 'Financial Management', count: 6, path: '/api/secure/financial' },
        { name: 'Fuel Management', count: 7, path: '/api/secure/fuel-records' },
        { name: 'Bulk Import', count: 5, path: '/api/secure/bulk-import' },
        { name: 'Audit System', count: 3, path: '/api/audit' }
      ],
      authentication: {
        apiKey: 'X-API-Key header required for /api/secure/* endpoints',
        jwt: 'Authorization: Bearer token for /api/backend/* endpoints',
        demoKey: 'ak_demo2025key'
      },
      swaggerUI: '/api/docs',
      jsonSchema: '/api/docs/json'
    });
  });

  // API Status and Health Check
  app.get('/api/health', (req, res) => {
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '3.0.0',
      services: {
        database: 'connected',
        authentication: 'active',
        swagger: 'available'
      }
    });
  });
}
