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
      description: 'Kapsamlı filo yönetimi API sistemi. 89 endpoint ile tam güvenlik kontrolü, döküman yönetimi ve sefer kiralama sistemi.',
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
      },
      // ========================
      // REFERENCE DATA ENDPOINTS (Cities, Countries, Car Brands, etc.)
      // ========================
      '/api/secure/getCities': {
        get: {
          tags: ['Referans Veriler'],
          summary: 'Şehir listesi',
          description: '81 il listesini getirir',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Şehir adı araması' },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
            { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } },
            { name: 'sortBy', in: 'query', schema: { type: 'string', enum: ['name', 'id'] } },
            { name: 'sortOrder', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] } }
          ],
          responses: {
            200: {
              description: 'Şehir listesi başarıyla getirildi',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/City' }
                      },
                      count: { type: 'integer', example: 81 },
                      totalCount: { type: 'integer', example: 81 }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/secure/addCity': {
        post: {
          tags: ['Referans Veriler'],
          summary: 'Yeni şehir ekleme',
          description: 'Yeni şehir kaydı oluşturur',
          security: [{ ApiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name'],
                  properties: {
                    name: { type: 'string', example: 'Yeni Şehir' },
                    plateCode: { type: 'string', example: '99' }
                  }
                }
              }
            }
          },
          responses: {
            201: {
              description: 'Şehir başarıyla oluşturuldu',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      '/api/secure/updateCity/{id}': {
        put: {
          tags: ['Referans Veriler'],
          summary: 'Şehir güncelleme',
          description: 'Mevcut şehir kaydını günceller',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Şehir ID' }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', example: 'Güncel Şehir Adı' },
                    plateCode: { type: 'string', example: '34' }
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Şehir başarıyla güncellendi',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      '/api/secure/deleteCity/{id}': {
        delete: {
          tags: ['Referans Veriler'],
          summary: 'Şehir silme',
          description: 'Şehir kaydını siler (soft delete)',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Şehir ID' }
          ],
          responses: {
            200: {
              description: 'Şehir başarıyla silindi',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      // Countries
      '/api/secure/getCountries': {
        get: {
          tags: ['Referans Veriler'],
          summary: 'Ülke listesi',
          description: 'Tüm ülkelerin listesini getirir',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Ülke adı araması' },
            { name: 'phoneCode', in: 'query', schema: { type: 'string' }, description: 'Telefon kodu filtresi' },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
            { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } }
          ],
          responses: {
            200: {
              description: 'Ülke listesi başarıyla getirildi',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Country' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/secure/addCountry': {
        post: {
          tags: ['Referans Veriler'],
          summary: 'Yeni ülke ekleme',
          description: 'Yeni ülke kaydı oluşturur',
          security: [{ ApiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'phoneCode', 'countryCode'],
                  properties: {
                    name: { type: 'string', example: 'Yeni Ülke' },
                    phoneCode: { type: 'string', example: '+999' },
                    countryCode: { type: 'string', example: 'XX' }
                  }
                }
              }
            }
          },
          responses: {
            201: {
              description: 'Ülke başarıyla oluşturuldu',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      '/api/secure/updateCountry/{id}': {
        put: {
          tags: ['Referans Veriler'],
          summary: 'Ülke güncelleme',
          description: 'Mevcut ülke kaydını günceller',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    phoneCode: { type: 'string' },
                    countryCode: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Ülke başarıyla güncellendi',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      '/api/secure/deleteCountry/{id}': {
        delete: {
          tags: ['Referans Veriler'],
          summary: 'Ülke silme',
          description: 'Ülke kaydını siler (soft delete)',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
          ],
          responses: {
            200: {
              description: 'Ülke başarıyla silindi',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      // Car Brands
      '/api/secure/getCarBrands': {
        get: {
          tags: ['Referans Veriler'],
          summary: 'Araç markaları',
          description: 'Tüm araç markalarının listesini getirir',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { name: 'search', in: 'query', schema: { type: 'string' } },
            { name: 'isActive', in: 'query', schema: { type: 'boolean' } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
            { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } }
          ],
          responses: {
            200: {
              description: 'Marka listesi başarıyla getirildi',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/CarBrand' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/secure/addCarBrand': {
        post: {
          tags: ['Referans Veriler'],
          summary: 'Yeni araç markası ekleme',
          description: 'Yeni araç markası kaydı oluşturur',
          security: [{ ApiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name'],
                  properties: {
                    name: { type: 'string', example: 'Tesla' },
                    isActive: { type: 'boolean', example: true }
                  }
                }
              }
            }
          },
          responses: {
            201: {
              description: 'Marka başarıyla oluşturuldu',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      '/api/secure/updateCarBrand/{id}': {
        put: {
          tags: ['Referans Veriler'],
          summary: 'Araç markası güncelleme',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    isActive: { type: 'boolean' }
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Marka başarıyla güncellendi',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      '/api/secure/deleteCarBrand/{id}': {
        delete: {
          tags: ['Referans Veriler'],
          summary: 'Araç markası silme',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
          ],
          responses: {
            200: {
              description: 'Marka başarıyla silindi',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      // Car Models
      '/api/secure/getCarModels': {
        get: {
          tags: ['Referans Veriler'],
          summary: 'Araç modelleri',
          description: 'Tüm araç modellerinin listesini getirir',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { name: 'carBrandId', in: 'query', schema: { type: 'integer' }, description: 'Marka ID filtresi' },
            { name: 'search', in: 'query', schema: { type: 'string' } },
            { name: 'isActive', in: 'query', schema: { type: 'boolean' } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
            { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } }
          ],
          responses: {
            200: {
              description: 'Model listesi başarıyla getirildi',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/CarModel' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/secure/addCarModel': {
        post: {
          tags: ['Referans Veriler'],
          summary: 'Yeni araç modeli ekleme',
          security: [{ ApiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'carBrandId'],
                  properties: {
                    name: { type: 'string', example: 'Model S' },
                    carBrandId: { type: 'integer', example: 1 },
                    isActive: { type: 'boolean', example: true }
                  }
                }
              }
            }
          },
          responses: {
            201: {
              description: 'Model başarıyla oluşturuldu',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      '/api/secure/updateCarModel/{id}': {
        put: {
          tags: ['Referans Veriler'],
          summary: 'Araç modeli güncelleme',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    carBrandId: { type: 'integer' },
                    isActive: { type: 'boolean' }
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Model başarıyla güncellendi',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      '/api/secure/deleteCarModel/{id}': {
        delete: {
          tags: ['Referans Veriler'],
          summary: 'Araç modeli silme',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
          ],
          responses: {
            200: {
              description: 'Model başarıyla silindi',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      // Car Types
      '/api/secure/getCarTypes': {
        get: {
          tags: ['Referans Veriler'],
          summary: 'Araç tipleri',
          description: 'Tüm araç tiplerinin listesini getirir (Kamyon, Otobüs, vs.)',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { name: 'search', in: 'query', schema: { type: 'string' } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
            { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } }
          ],
          responses: {
            200: {
              description: 'Araç tipleri başarıyla getirildi',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      '/api/secure/addCarType': {
        post: {
          tags: ['Referans Veriler'],
          summary: 'Yeni araç tipi ekleme',
          security: [{ ApiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name'],
                  properties: {
                    name: { type: 'string', example: 'Elektrikli Araç' }
                  }
                }
              }
            }
          },
          responses: {
            201: {
              description: 'Araç tipi başarıyla oluşturuldu',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      '/api/secure/updateCarType/{id}': {
        put: {
          tags: ['Referans Veriler'],
          summary: 'Araç tipi güncelleme',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Araç tipi başarıyla güncellendi',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      '/api/secure/deleteCarType/{id}': {
        delete: {
          tags: ['Referans Veriler'],
          summary: 'Araç tipi silme',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
          ],
          responses: {
            200: {
              description: 'Araç tipi başarıyla silindi',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      // Policy Types  
      '/api/secure/getPolicyTypes': {
        get: {
          tags: ['Referans Veriler'],
          summary: 'Poliçe türleri',
          description: 'Tüm poliçe türlerinin listesini getirir',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { name: 'search', in: 'query', schema: { type: 'string' } },
            { name: 'activeOnly', in: 'query', schema: { type: 'boolean' } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
            { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } }
          ],
          responses: {
            200: {
              description: 'Poliçe türleri başarıyla getirildi',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      '/api/secure/addPolicyType': {
        post: {
          tags: ['Referans Veriler'],
          summary: 'Yeni poliçe türü ekleme',
          security: [{ ApiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name'],
                  properties: {
                    name: { type: 'string', example: 'Kasko' },
                    description: { type: 'string', example: 'Araç kasko sigortası' },
                    isActive: { type: 'boolean', example: true }
                  }
                }
              }
            }
          },
          responses: {
            201: {
              description: 'Poliçe türü başarıyla oluşturuldu',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      '/api/secure/updatePolicyType/{id}': {
        put: {
          tags: ['Referans Veriler'],
          summary: 'Poliçe türü güncelleme',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    description: { type: 'string' },
                    isActive: { type: 'boolean' }
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Poliçe türü başarıyla güncellendi',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      '/api/secure/deletePolicyType/{id}': {
        delete: {
          tags: ['Referans Veriler'],
          summary: 'Poliçe türü silme',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
          ],
          responses: {
            200: {
              description: 'Poliçe türü başarıyla silindi',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      // Penalty Types
      '/api/secure/getPenaltyTypes': {
        get: {
          tags: ['Referans Veriler'],
          summary: 'Ceza türleri',
          description: '301 trafik cezası türünün listesini getirir',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { name: 'search', in: 'query', schema: { type: 'string' } },
            { name: 'minAmount', in: 'query', schema: { type: 'integer' }, description: 'Minimum ceza tutarı (kuruş)' },
            { name: 'maxAmount', in: 'query', schema: { type: 'integer' }, description: 'Maksimum ceza tutarı (kuruş)' },
            { name: 'activeOnly', in: 'query', schema: { type: 'boolean' } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
            { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } }
          ],
          responses: {
            200: {
              description: 'Ceza türleri başarıyla getirildi',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      '/api/secure/addPenaltyType': {
        post: {
          tags: ['Referans Veriler'],
          summary: 'Yeni ceza türü ekleme',
          security: [{ ApiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['code', 'description', 'amountCents'],
                  properties: {
                    code: { type: 'string', example: 'HT-301' },
                    description: { type: 'string', example: 'Hız sınırını %30 aşmak' },
                    amountCents: { type: 'integer', example: 123500 },
                    isActive: { type: 'boolean', example: true }
                  }
                }
              }
            }
          },
          responses: {
            201: {
              description: 'Ceza türü başarıyla oluşturuldu',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      '/api/secure/updatePenaltyType/{id}': {
        put: {
          tags: ['Referans Veriler'],
          summary: 'Ceza türü güncelleme',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'string' },
                    description: { type: 'string' },
                    amountCents: { type: 'integer' },
                    isActive: { type: 'boolean' }
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Ceza türü başarıyla güncellendi',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      '/api/secure/deletePenaltyType/{id}': {
        delete: {
          tags: ['Referans Veriler'],
          summary: 'Ceza türü silme',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
          ],
          responses: {
            200: {
              description: 'Ceza türü başarıyla silindi',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      // Payment Methods
      '/api/secure/getPaymentMethods': {
        get: {
          tags: ['Referans Veriler'],
          summary: 'Ödeme yöntemleri',
          description: 'Tüm ödeme yöntemlerinin listesini getirir',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { name: 'search', in: 'query', schema: { type: 'string' } },
            { name: 'activeOnly', in: 'query', schema: { type: 'boolean' } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
            { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } }
          ],
          responses: {
            200: {
              description: 'Ödeme yöntemleri başarıyla getirildi',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      '/api/secure/addPaymentMethod': {
        post: {
          tags: ['Referans Veriler'],
          summary: 'Yeni ödeme yöntemi ekleme',
          security: [{ ApiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name'],
                  properties: {
                    name: { type: 'string', example: 'Kredi Kartı' },
                    description: { type: 'string', example: 'Visa/Mastercard' },
                    isActive: { type: 'boolean', example: true }
                  }
                }
              }
            }
          },
          responses: {
            201: {
              description: 'Ödeme yöntemi başarıyla oluşturuldu',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      '/api/secure/updatePaymentMethod/{id}': {
        put: {
          tags: ['Referans Veriler'],
          summary: 'Ödeme yöntemi güncelleme',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    description: { type: 'string' },
                    isActive: { type: 'boolean' }
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Ödeme yöntemi başarıyla güncellendi',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      '/api/secure/deletePaymentMethod/{id}': {
        delete: {
          tags: ['Referans Veriler'],
          summary: 'Ödeme yöntemi silme',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
          ],
          responses: {
            200: {
              description: 'Ödeme yöntemi başarıyla silindi',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      // Maintenance Types
      '/api/secure/getMaintenanceTypes': {
        get: {
          tags: ['Referans Veriler'],
          summary: 'Bakım türleri',
          description: 'Tüm bakım türlerinin listesini getirir',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { name: 'search', in: 'query', schema: { type: 'string' } },
            { name: 'activeOnly', in: 'query', schema: { type: 'boolean' } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
            { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } }
          ],
          responses: {
            200: {
              description: 'Bakım türleri başarıyla getirildi',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      '/api/secure/addMaintenanceType': {
        post: {
          tags: ['Referans Veriler'],
          summary: 'Yeni bakım türü ekleme',
          security: [{ ApiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name'],
                  properties: {
                    name: { type: 'string', example: 'Yağ Değişimi' },
                    description: { type: 'string', example: 'Motor yağı ve filtre değişimi' },
                    intervalKm: { type: 'integer', example: 10000 },
                    intervalMonths: { type: 'integer', example: 6 },
                    isActive: { type: 'boolean', example: true }
                  }
                }
              }
            }
          },
          responses: {
            201: {
              description: 'Bakım türü başarıyla oluşturuldu',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      '/api/secure/updateMaintenanceType/{id}': {
        put: {
          tags: ['Referans Veriler'],
          summary: 'Bakım türü güncelleme',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    description: { type: 'string' },
                    intervalKm: { type: 'integer' },
                    intervalMonths: { type: 'integer' },
                    isActive: { type: 'boolean' }
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Bakım türü başarıyla güncellendi',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      '/api/secure/deleteMaintenanceType/{id}': {
        delete: {
          tags: ['Referans Veriler'],
          summary: 'Bakım türü silme',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
          ],
          responses: {
            200: {
              description: 'Bakım türü başarıyla silindi',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      // Ownership Types
      '/api/secure/getOwnershipTypes': {
        get: {
          tags: ['Referans Veriler'],
          summary: 'Sahiplik türleri',
          description: 'Tüm sahiplik türlerinin listesini getirir',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { name: 'search', in: 'query', schema: { type: 'string' } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
            { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } }
          ],
          responses: {
            200: {
              description: 'Sahiplik türleri başarıyla getirildi',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      '/api/secure/addOwnershipType': {
        post: {
          tags: ['Referans Veriler'],
          summary: 'Yeni sahiplik türü ekleme',
          security: [{ ApiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name'],
                  properties: {
                    name: { type: 'string', example: 'Kiralık' },
                    description: { type: 'string', example: 'Uzun dönem kiralama' }
                  }
                }
              }
            }
          },
          responses: {
            201: {
              description: 'Sahiplik türü başarıyla oluşturuldu',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      '/api/secure/updateOwnershipType/{id}': {
        put: {
          tags: ['Referans Veriler'],
          summary: 'Sahiplik türü güncelleme',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    description: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Sahiplik türü başarıyla güncellendi',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      '/api/secure/deleteOwnershipType/{id}': {
        delete: {
          tags: ['Referans Veriler'],
          summary: 'Sahiplik türü silme',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
          ],
          responses: {
            200: {
              description: 'Sahiplik türü başarıyla silindi',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      // Document Types
      '/api/secure/getDocMainTypes': {
        get: {
          tags: ['Referans Veriler'],
          summary: 'Ana doküman türleri',
          description: 'Tüm ana doküman türlerinin listesini getirir',
          security: [{ ApiKeyAuth: [] }],
          responses: {
            200: {
              description: 'Ana doküman türleri başarıyla getirildi',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      '/api/secure/addDocMainType': {
        post: {
          tags: ['Referans Veriler'],
          summary: 'Yeni ana doküman türü ekleme',
          security: [{ ApiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name'],
                  properties: {
                    name: { type: 'string', example: 'Ruhsat' }
                  }
                }
              }
            }
          },
          responses: {
            201: {
              description: 'Ana doküman türü başarıyla oluşturuldu',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      '/api/secure/getDocSubTypes': {
        get: {
          tags: ['Referans Veriler'],
          summary: 'Alt doküman türleri',
          description: 'Tüm alt doküman türlerinin listesini getirir',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { name: 'mainTypeId', in: 'query', schema: { type: 'integer' }, description: 'Ana doküman türü ID' }
          ],
          responses: {
            200: {
              description: 'Alt doküman türleri başarıyla getirildi',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      '/api/secure/addDocSubType': {
        post: {
          tags: ['Referans Veriler'],
          summary: 'Yeni alt doküman türü ekleme',
          security: [{ ApiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'docMainTypeId'],
                  properties: {
                    name: { type: 'string', example: 'Araç Ruhsatı' },
                    docMainTypeId: { type: 'integer', example: 1 }
                  }
                }
              }
            }
          },
          responses: {
            201: {
              description: 'Alt doküman türü başarıyla oluşturuldu',
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
      // PERSONNEL MANAGEMENT ENDPOINTS
      // ========================
      '/api/secure/getPersonnel': {
        get: {
          tags: ['Personel Yönetimi'],
          summary: 'Personel listesi',
          description: 'Tüm personel kayıtlarını getirir',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { name: 'search', in: 'query', schema: { type: 'string' }, description: 'İsim veya email araması' },
            { name: 'positionId', in: 'query', schema: { type: 'integer' }, description: 'Pozisyon filtresi' },
            { name: 'workAreaId', in: 'query', schema: { type: 'integer' }, description: 'Çalışma alanı filtresi' },
            { name: 'companyId', in: 'query', schema: { type: 'integer' }, description: 'Şirket filtresi' },
            { name: 'isActive', in: 'query', schema: { type: 'boolean' }, description: 'Aktif/pasif filtresi' },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
            { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } }
          ],
          responses: {
            200: {
              description: 'Personel listesi başarıyla getirildi',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Personnel' }
                      },
                      count: { type: 'integer', example: 50 },
                      totalCount: { type: 'integer', example: 150 }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/secure/addPersonnel': {
        post: {
          tags: ['Personel Yönetimi'],
          summary: 'Yeni personel ekleme',
          description: 'Yeni personel kaydı oluşturur',
          security: [{ ApiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['firstName', 'lastName', 'email', 'phone'],
                  properties: {
                    firstName: { type: 'string', example: 'Ahmet' },
                    lastName: { type: 'string', example: 'Yılmaz' },
                    email: { type: 'string', format: 'email', example: 'ahmet.yilmaz@firma.com' },
                    phone: { type: 'string', example: '+905551234567' },
                    positionId: { type: 'integer', example: 1 },
                    workAreaId: { type: 'integer', example: 2 },
                    companyId: { type: 'integer', example: 1 },
                    startDate: { type: 'string', format: 'date', example: '2024-01-15' },
                    isActive: { type: 'boolean', example: true }
                  }
                }
              }
            }
          },
          responses: {
            201: {
              description: 'Personel başarıyla oluşturuldu',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      '/api/secure/updatePersonnel/{id}': {
        put: {
          tags: ['Personel Yönetimi'],
          summary: 'Personel güncelleme',
          description: 'Mevcut personel kaydını günceller',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Personel ID' }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    phone: { type: 'string' },
                    positionId: { type: 'integer' },
                    workAreaId: { type: 'integer' },
                    companyId: { type: 'integer' },
                    endDate: { type: 'string', format: 'date' },
                    isActive: { type: 'boolean' }
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Personel başarıyla güncellendi',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      '/api/secure/deletePersonnel/{id}': {
        delete: {
          tags: ['Personel Yönetimi'],
          summary: 'Personel silme',
          description: 'Personel kaydını siler (soft delete)',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Personel ID' }
          ],
          responses: {
            200: {
              description: 'Personel başarıyla silindi',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      // Personnel Positions
      '/api/secure/getPersonnelPositions': {
        get: {
          tags: ['Personel Yönetimi'],
          summary: 'Personel pozisyonları',
          description: 'Tüm personel pozisyonlarının listesini getirir',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { name: 'search', in: 'query', schema: { type: 'string' } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
            { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } }
          ],
          responses: {
            200: {
              description: 'Pozisyon listesi başarıyla getirildi',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      '/api/secure/addPersonnelPosition': {
        post: {
          tags: ['Personel Yönetimi'],
          summary: 'Yeni personel pozisyonu ekleme',
          security: [{ ApiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name'],
                  properties: {
                    name: { type: 'string', example: 'Sürücü' },
                    description: { type: 'string', example: 'Araç sürücüsü' }
                  }
                }
              }
            }
          },
          responses: {
            201: {
              description: 'Pozisyon başarıyla oluşturuldu',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      '/api/secure/updatePersonnelPosition/{id}': {
        put: {
          tags: ['Personel Yönetimi'],
          summary: 'Personel pozisyonu güncelleme',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    description: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Pozisyon başarıyla güncellendi',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      '/api/secure/deletePersonnelPosition/{id}': {
        delete: {
          tags: ['Personel Yönetimi'],
          summary: 'Personel pozisyonu silme',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
          ],
          responses: {
            200: {
              description: 'Pozisyon başarıyla silindi',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      // Work Areas
      '/api/secure/getWorkAreas': {
        get: {
          tags: ['Personel Yönetimi'],
          summary: 'Çalışma alanları',
          description: 'Tüm çalışma alanlarının listesini getirir',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { name: 'search', in: 'query', schema: { type: 'string' } },
            { name: 'companyId', in: 'query', schema: { type: 'integer' } },
            { name: 'isActive', in: 'query', schema: { type: 'boolean' } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
            { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } }
          ],
          responses: {
            200: {
              description: 'Çalışma alanları başarıyla getirildi',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      '/api/secure/addWorkArea': {
        post: {
          tags: ['Personel Yönetimi'],
          summary: 'Yeni çalışma alanı ekleme',
          security: [{ ApiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'companyId'],
                  properties: {
                    name: { type: 'string', example: 'İstanbul Şantiyesi' },
                    companyId: { type: 'integer', example: 1 },
                    address: { type: 'string', example: 'Levent, İstanbul' },
                    phone: { type: 'string', example: '+902121234567' },
                    isActive: { type: 'boolean', example: true }
                  }
                }
              }
            }
          },
          responses: {
            201: {
              description: 'Çalışma alanı başarıyla oluşturuldu',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      '/api/secure/updateWorkArea/{id}': {
        put: {
          tags: ['Personel Yönetimi'],
          summary: 'Çalışma alanı güncelleme',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    companyId: { type: 'integer' },
                    address: { type: 'string' },
                    phone: { type: 'string' },
                    isActive: { type: 'boolean' }
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Çalışma alanı başarıyla güncellendi',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      '/api/secure/deleteWorkArea/{id}': {
        delete: {
          tags: ['Personel Yönetimi'],
          summary: 'Çalışma alanı silme',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
          ],
          responses: {
            200: {
              description: 'Çalışma alanı başarıyla silindi',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      // Personnel-Asset Assignment
      '/api/secure/getAssetsPersonnelAssignments': {
        get: {
          tags: ['Personel Yönetimi'],
          summary: 'Personel-araç atamaları',
          description: 'Tüm personel-araç atamalarının listesini getirir',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { name: 'personnelId', in: 'query', schema: { type: 'integer' } },
            { name: 'assetId', in: 'query', schema: { type: 'integer' } },
            { name: 'isActive', in: 'query', schema: { type: 'boolean' } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
            { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } }
          ],
          responses: {
            200: {
              description: 'Atama listesi başarıyla getirildi',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      '/api/secure/addAssetsPersonnelAssignment': {
        post: {
          tags: ['Personel Yönetimi'],
          summary: 'Yeni personel-araç ataması',
          security: [{ ApiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['personnelId', 'assetId', 'assignmentDate'],
                  properties: {
                    personnelId: { type: 'integer', example: 1 },
                    assetId: { type: 'integer', example: 5 },
                    assignmentDate: { type: 'string', format: 'date', example: '2024-01-15' },
                    endDate: { type: 'string', format: 'date', example: '2024-12-31' },
                    notes: { type: 'string', example: 'Ana sürücü olarak atandı' }
                  }
                }
              }
            }
          },
          responses: {
            201: {
              description: 'Atama başarıyla oluşturuldu',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      '/api/secure/updateAssetsPersonnelAssignment/{id}': {
        put: {
          tags: ['Personel Yönetimi'],
          summary: 'Personel-araç ataması güncelleme',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    personnelId: { type: 'integer' },
                    assetId: { type: 'integer' },
                    assignmentDate: { type: 'string', format: 'date' },
                    endDate: { type: 'string', format: 'date' },
                    notes: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Atama başarıyla güncellendi',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      '/api/secure/deleteAssetsPersonnelAssignment/{id}': {
        delete: {
          tags: ['Personel Yönetimi'],
          summary: 'Personel-araç ataması silme',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
          ],
          responses: {
            200: {
              description: 'Atama başarıyla silindi',
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
      // FUEL MANAGEMENT ENDPOINTS
      // ========================
      '/api/secure/fuel-records': {
        get: {
          tags: ['Yakıt Yönetimi'],
          summary: 'Yakıt kayıtları listesi',
          description: 'Tüm yakıt kayıtlarını getirir',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { name: 'assetId', in: 'query', schema: { type: 'integer' }, description: 'Araç ID filtresi' },
            { name: 'personnelId', in: 'query', schema: { type: 'integer' }, description: 'Personel ID filtresi' },
            { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Başlangıç tarihi' },
            { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Bitiş tarihi' },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
            { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } }
          ],
          responses: {
            200: {
              description: 'Yakıt kayıtları başarıyla getirildi',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/FuelRecord' }
                      },
                      count: { type: 'integer', example: 100 },
                      totalCount: { type: 'integer', example: 500 }
                    }
                  }
                }
              }
            }
          }
        },
        post: {
          tags: ['Yakıt Yönetimi'],
          summary: 'Yeni yakıt kaydı ekleme',
          description: 'Yeni yakıt alım kaydı oluşturur',
          security: [{ ApiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['assetId', 'fuelDate', 'liters', 'totalCost', 'odometer'],
                  properties: {
                    assetId: { type: 'integer', example: 5 },
                    personnelId: { type: 'integer', example: 3 },
                    fuelType: { type: 'string', enum: ['GASOLINE', 'DIESEL', 'LPG'], example: 'DIESEL' },
                    liters: { type: 'number', format: 'float', example: 45.5 },
                    totalCost: { type: 'number', format: 'float', example: 1365.75 },
                    unitPrice: { type: 'number', format: 'float', example: 30.02 },
                    stationName: { type: 'string', example: 'Petrol Ofisi' },
                    fuelDate: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' },
                    odometer: { type: 'integer', example: 125000 },
                    notes: { type: 'string', example: 'Tam depo' }
                  }
                }
              }
            }
          },
          responses: {
            201: {
              description: 'Yakıt kaydı başarıyla oluşturuldu',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      '/api/secure/fuel-records/{id}': {
        get: {
          tags: ['Yakıt Yönetimi'],
          summary: 'Yakıt kaydı detayı',
          description: 'Belirli bir yakıt kaydının detaylarını getirir',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Yakıt kaydı ID' }
          ],
          responses: {
            200: {
              description: 'Yakıt kaydı başarıyla getirildi',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: { $ref: '#/components/schemas/FuelRecord' }
                    }
                  }
                }
              }
            }
          }
        },
        put: {
          tags: ['Yakıt Yönetimi'],
          summary: 'Yakıt kaydı güncelleme',
          description: 'Mevcut yakıt kaydını günceller',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Yakıt kaydı ID' }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    assetId: { type: 'integer' },
                    personnelId: { type: 'integer' },
                    fuelType: { type: 'string', enum: ['GASOLINE', 'DIESEL', 'LPG'] },
                    liters: { type: 'number', format: 'float' },
                    totalCost: { type: 'number', format: 'float' },
                    unitPrice: { type: 'number', format: 'float' },
                    stationName: { type: 'string' },
                    fuelDate: { type: 'string', format: 'date-time' },
                    odometer: { type: 'integer' },
                    notes: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Yakıt kaydı başarıyla güncellendi',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        },
        delete: {
          tags: ['Yakıt Yönetimi'],
          summary: 'Yakıt kaydı silme',
          description: 'Yakıt kaydını siler (soft delete)',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Yakıt kaydı ID' }
          ],
          responses: {
            200: {
              description: 'Yakıt kaydı başarıyla silindi',
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
      // FINANCIAL MANAGEMENT ENDPOINTS
      // ========================
      '/api/secure/financial/payment-types': {
        get: {
          tags: ['Finansal İşlemler'],
          summary: 'Ödeme türleri',
          description: 'Tüm ödeme türlerinin listesini getirir',
          security: [{ ApiKeyAuth: [] }],
          responses: {
            200: {
              description: 'Ödeme türleri başarıyla getirildi',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      '/api/secure/financial/current-accounts': {
        get: {
          tags: ['Finansal İşlemler'],
          summary: 'Cari hesap hareketleri',
          description: 'Tüm cari hesap hareketlerini getirir',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { name: 'companyId', in: 'query', schema: { type: 'integer' }, description: 'Şirket ID filtresi' },
            { name: 'paymentType', in: 'query', schema: { type: 'string' }, description: 'Ödeme türü filtresi' },
            { name: 'paymentStatus', in: 'query', schema: { type: 'string', enum: ['pending', 'completed', 'cancelled'] } },
            { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
            { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
            { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } },
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } }
          ],
          responses: {
            200: {
              description: 'Cari hesap hareketleri başarıyla getirildi',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        },
        post: {
          tags: ['Finansal İşlemler'],
          summary: 'Yeni cari hesap hareketi',
          description: 'Yeni cari hesap hareketi oluşturur',
          security: [{ ApiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['companyId', 'dueDate', 'amountCents', 'paymentTypeId'],
                  properties: {
                    companyId: { type: 'integer', example: 1 },
                    dueDate: { type: 'string', format: 'date', example: '2024-02-15' },
                    amountCents: { type: 'integer', example: 150000 },
                    paymentTypeId: { type: 'integer', example: 1 },
                    paymentMethodId: { type: 'integer', example: 2 },
                    paymentStatus: { type: 'string', enum: ['pending', 'completed', 'cancelled'], example: 'pending' },
                    notes: { type: 'string', example: 'Araç kiralama ödemesi' },
                    metadata: { 
                      type: 'object',
                      example: { 
                        assetId: 5,
                        contractNumber: 'KRL-2024-001'
                      }
                    }
                  }
                }
              }
            }
          },
          responses: {
            201: {
              description: 'Cari hesap hareketi başarıyla oluşturuldu',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      '/api/secure/financial/accounts-details': {
        get: {
          tags: ['Finansal İşlemler'],
          summary: 'Hesap detay kayıtları',
          description: 'Cari hesap detay kayıtlarını getirir',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { name: 'accountId', in: 'query', schema: { type: 'integer' }, description: 'Ana hesap ID' },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
            { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } }
          ],
          responses: {
            200: {
              description: 'Hesap detayları başarıyla getirildi',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        },
        post: {
          tags: ['Finansal İşlemler'],
          summary: 'Yeni hesap detay kaydı',
          description: 'Cari hesap için detay kaydı oluşturur',
          security: [{ ApiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['accountId', 'description', 'amountCents'],
                  properties: {
                    accountId: { type: 'integer', example: 1 },
                    description: { type: 'string', example: 'KDV tutarı' },
                    amountCents: { type: 'integer', example: 27000 },
                    quantity: { type: 'number', example: 1 },
                    unitPriceCents: { type: 'integer', example: 27000 }
                  }
                }
              }
            }
          },
          responses: {
            201: {
              description: 'Hesap detayı başarıyla oluşturuldu',
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
      // BULK IMPORT ENDPOINTS
      // ========================
      '/api/secure/bulk-import/csv': {
        post: {
          tags: ['Bulk Import'],
          summary: 'CSV toplu veri aktarımı',
          description: 'CSV dosyasından toplu veri aktarımı yapar (28.000+ satır desteği)',
          security: [{ ApiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['file', 'tableName'],
                  properties: {
                    file: {
                      type: 'string',
                      format: 'binary',
                      description: 'CSV dosyası'
                    },
                    tableName: {
                      type: 'string',
                      enum: ['car_brands', 'car_models', 'cities', 'personnel'],
                      example: 'car_models'
                    },
                    batchSize: {
                      type: 'integer',
                      default: 100,
                      minimum: 10,
                      maximum: 1000,
                      description: 'Batch başına işlenecek satır sayısı'
                    }
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Import başlatıldı',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'object',
                        properties: {
                          importId: { type: 'string', example: 'imp_20240115_123456' },
                          totalRows: { type: 'integer', example: 28451 },
                          status: { type: 'string', example: 'processing' }
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
      '/api/secure/bulk-import/status/{importId}': {
        get: {
          tags: ['Bulk Import'],
          summary: 'Import durumu sorgulama',
          description: 'Devam eden import işleminin durumunu sorgular',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { name: 'importId', in: 'path', required: true, schema: { type: 'string' }, description: 'Import ID' }
          ],
          responses: {
            200: {
              description: 'Import durumu',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'object',
                        properties: {
                          importId: { type: 'string', example: 'imp_20240115_123456' },
                          status: { type: 'string', enum: ['processing', 'completed', 'failed', 'stopped'], example: 'processing' },
                          progress: { type: 'integer', example: 45 },
                          processedRows: { type: 'integer', example: 12750 },
                          totalRows: { type: 'integer', example: 28451 },
                          addedRows: { type: 'integer', example: 12500 },
                          skippedRows: { type: 'integer', example: 250 },
                          errors: { type: 'array', items: { type: 'string' } }
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
      '/api/secure/bulk-import/template/{tableName}': {
        get: {
          tags: ['Bulk Import'],
          summary: 'CSV şablon dosyası',
          description: 'İlgili tablo için CSV şablon dosyasını indirir',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { name: 'tableName', in: 'path', required: true, schema: { type: 'string' }, description: 'Tablo adı' }
          ],
          responses: {
            200: {
              description: 'CSV şablon dosyası',
              content: {
                'text/csv': {
                  schema: {
                    type: 'string',
                    example: 'Marka Kodu,Tip Kodu,Marka Adı,Tip Adı,Kapasite,Tip ID\n001,001,Mercedes-Benz,Sprinter,3,1'
                  }
                }
              }
            }
          }
        }
      },
      '/api/secure/bulk-import/stop-all': {
        post: {
          tags: ['Bulk Import'],
          summary: 'Tüm import işlemlerini durdur',
          description: 'Devam eden tüm import işlemlerini durdurur',
          security: [{ ApiKeyAuth: [] }],
          responses: {
            200: {
              description: 'Import işlemleri durduruldu',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      '/api/secure/bulk-import/clear-status': {
        delete: {
          tags: ['Bulk Import'],
          summary: 'Import geçmişini temizle',
          description: 'Tamamlanmış import kayıtlarını temizler',
          security: [{ ApiKeyAuth: [] }],
          responses: {
            200: {
              description: 'Import geçmişi temizlendi',
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
      // AUDIT SYSTEM ENDPOINTS
      // ========================
      '/api/audit/record/{tableName}/{recordId}': {
        get: {
          tags: ['Audit System'],
          summary: 'Kayıt değişiklik geçmişi',
          description: 'Belirli bir kaydın tüm değişiklik geçmişini getirir',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'tableName', in: 'path', required: true, schema: { type: 'string' }, description: 'Tablo adı' },
            { name: 'recordId', in: 'path', required: true, schema: { type: 'string' }, description: 'Kayıt ID' }
          ],
          responses: {
            200: {
              description: 'Değişiklik geçmişi başarıyla getirildi',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      '/api/audit/user/{userId}': {
        get: {
          tags: ['Audit System'],
          summary: 'Kullanıcı aktiviteleri',
          description: 'Belirli bir kullanıcının tüm aktivitelerini getirir',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'userId', in: 'path', required: true, schema: { type: 'integer' }, description: 'Kullanıcı ID' },
            { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
            { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } }
          ],
          responses: {
            200: {
              description: 'Kullanıcı aktiviteleri başarıyla getirildi',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      '/api/audit/table/{tableName}/summary': {
        get: {
          tags: ['Audit System'],
          summary: 'Tablo değişiklik özeti',
          description: 'Belirli bir tablonun değişiklik özetini getirir',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'tableName', in: 'path', required: true, schema: { type: 'string' }, description: 'Tablo adı' },
            { name: 'days', in: 'query', schema: { type: 'integer', default: 30 }, description: 'Son kaç gün' }
          ],
          responses: {
            200: {
              description: 'Tablo özeti başarıyla getirildi',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      '/api/audit/stats': {
        get: {
          tags: ['Audit System'],
          summary: 'Audit istatistikleri',
          description: 'Genel audit istatistiklerini getirir',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Audit istatistikleri başarıyla getirildi',
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
      // DOCUMENT MANAGEMENT ENDPOINTS
      // ========================
      '/api/documents': {
        get: {
          tags: ['Döküman Yönetimi'],
          summary: 'Döküman listesi',
          description: 'Tüm dökümanları filtreli olarak listeler',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'entityType', in: 'query', schema: { type: 'string', enum: ['personnel', 'asset', 'company', 'work_area'] }, description: 'Entity tipi' },
            { name: 'entityId', in: 'query', schema: { type: 'integer' }, description: 'Entity ID' },
            { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Dosya adı araması' },
            { name: 'docSubTypeId', in: 'query', schema: { type: 'integer' }, description: 'Döküman alt tipi' },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
            { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } }
          ],
          responses: {
            200: {
              description: 'Döküman listesi başarıyla getirildi',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        },
        post: {
          tags: ['Döküman Yönetimi'],
          summary: 'Yeni döküman ekle',
          description: 'Yeni döküman kaydı oluşturur',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['entityType', 'entityId', 'docSubTypeId', 'fileName'],
                  properties: {
                    entityType: { type: 'string', enum: ['personnel', 'asset', 'company', 'work_area'] },
                    entityId: { type: 'integer', example: 5 },
                    docSubTypeId: { type: 'integer', example: 3 },
                    fileName: { type: 'string', example: 'ehliyet_2024.pdf' },
                    filePath: { type: 'string', example: '/uploads/documents/ehliyet_2024.pdf' },
                    fileSize: { type: 'integer', example: 2048000 },
                    notes: { type: 'string', example: 'Ehliyet yenileme belgesi' }
                  }
                }
              }
            }
          },
          responses: {
            201: {
              description: 'Döküman başarıyla oluşturuldu',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      '/api/documents/{id}': {
        get: {
          tags: ['Döküman Yönetimi'],
          summary: 'Döküman detayı',
          description: 'Belirli bir dökümanın detaylarını getirir',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
          ],
          responses: {
            200: {
              description: 'Döküman detayı başarıyla getirildi',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        },
        put: {
          tags: ['Döküman Yönetimi'],
          summary: 'Döküman güncelle',
          description: 'Mevcut döküman bilgilerini günceller',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    fileName: { type: 'string' },
                    notes: { type: 'string' },
                    isActive: { type: 'boolean' }
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Döküman başarıyla güncellendi',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        },
        delete: {
          tags: ['Döküman Yönetimi'],
          summary: 'Döküman sil',
          description: 'Dökümanı soft delete yapar',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
          ],
          responses: {
            200: {
              description: 'Döküman başarıyla silindi',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      '/api/documents/entity/{entityType}/{entityId}': {
        get: {
          tags: ['Döküman Yönetimi'],
          summary: 'Entity dökümanları',
          description: 'Belirli bir entity için tüm dökümanları listeler',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'entityType', in: 'path', required: true, schema: { type: 'string', enum: ['personnel', 'asset', 'company', 'work_area'] } },
            { name: 'entityId', in: 'path', required: true, schema: { type: 'integer' } }
          ],
          responses: {
            200: {
              description: 'Entity dökümanları başarıyla getirildi',
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
      // TRIP RENTAL MANAGEMENT
      // ========================
      '/api/trip-rentals': {
        get: {
          tags: ['Sefer Kiralama'],
          summary: 'Sefer kiralama listesi',
          description: 'Tüm sefer kiralamalarını listeler',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'assetId', in: 'query', schema: { type: 'integer' }, description: 'Araç ID' },
            { name: 'companyId', in: 'query', schema: { type: 'integer' }, description: 'Kiralayan şirket ID' },
            { name: 'driverId', in: 'query', schema: { type: 'integer' }, description: 'Sürücü ID' },
            { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Başlangıç tarihi' },
            { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Bitiş tarihi' },
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['scheduled', 'ongoing', 'completed', 'cancelled'] } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
            { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } }
          ],
          responses: {
            200: {
              description: 'Sefer listesi başarıyla getirildi',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        },
        post: {
          tags: ['Sefer Kiralama'],
          summary: 'Yeni sefer ekle',
          description: 'Yeni sefer kiralama kaydı oluşturur',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['assetId', 'companyId', 'tripDate', 'tripTime', 'fromLocation', 'toLocation', 'tripPriceCents'],
                  properties: {
                    assetId: { type: 'integer', example: 5 },
                    companyId: { type: 'integer', example: 3 },
                    driverId: { type: 'integer', example: 8 },
                    tripDate: { type: 'string', format: 'date', example: '2024-02-15' },
                    tripTime: { type: 'string', example: '08:30' },
                    fromLocation: { type: 'string', example: 'İstanbul Havalimanı' },
                    toLocation: { type: 'string', example: 'Sabiha Gökçen Havalimanı' },
                    tripPriceCents: { type: 'integer', example: 150000 },
                    estimatedKm: { type: 'integer', example: 95 },
                    estimatedDuration: { type: 'integer', example: 120 },
                    notes: { type: 'string', example: 'VIP transfer' }
                  }
                }
              }
            }
          },
          responses: {
            201: {
              description: 'Sefer başarıyla oluşturuldu',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      '/api/trip-rentals/{id}': {
        get: {
          tags: ['Sefer Kiralama'],
          summary: 'Sefer detayı',
          description: 'Belirli bir seferin detaylarını getirir',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
          ],
          responses: {
            200: {
              description: 'Sefer detayı başarıyla getirildi',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        },
        put: {
          tags: ['Sefer Kiralama'],
          summary: 'Sefer güncelle',
          description: 'Mevcut sefer bilgilerini günceller',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', enum: ['scheduled', 'ongoing', 'completed', 'cancelled'] },
                    actualKm: { type: 'integer' },
                    actualDuration: { type: 'integer' },
                    actualPriceCents: { type: 'integer' },
                    notes: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Sefer başarıyla güncellendi',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        },
        delete: {
          tags: ['Sefer Kiralama'],
          summary: 'Sefer iptal et',
          description: 'Seferi iptal eder (soft delete)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
          ],
          responses: {
            200: {
              description: 'Sefer başarıyla iptal edildi',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      '/api/trip-rentals/summary/daily': {
        get: {
          tags: ['Sefer Kiralama'],
          summary: 'Günlük sefer özeti',
          description: 'Belirli bir güne ait sefer özetini getirir',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'date', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Özet tarihi' },
            { name: 'companyId', in: 'query', schema: { type: 'integer' }, description: 'Şirket filtresi' }
          ],
          responses: {
            200: {
              description: 'Günlük özet başarıyla getirildi',
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
      // USER API KEY MANAGEMENT
      // ========================
      '/api/user/api-keys': {
        get: {
          tags: ['Admin İşlemleri'],
          summary: 'Kullanıcı API anahtarları',
          description: 'Giriş yapmış kullanıcının API anahtarlarını listeler',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'API anahtarları başarıyla getirildi',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        },
        post: {
          tags: ['Admin İşlemleri'],
          summary: 'Yeni API anahtarı oluştur',
          description: 'Kullanıcı için yeni API anahtarı oluşturur',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'permissions'],
                  properties: {
                    name: { type: 'string', example: 'Production API Key' },
                    permissions: { 
                      type: 'array', 
                      items: { type: 'string' },
                      example: ['data:read', 'data:write', 'asset:read']
                    },
                    expiresIn: { type: 'integer', example: 365, description: 'Gün cinsinden geçerlilik süresi' }
                  }
                }
              }
            }
          },
          responses: {
            201: {
              description: 'API anahtarı başarıyla oluşturuldu',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'object',
                        properties: {
                          id: { type: 'integer', example: 1 },
                          key: { type: 'string', example: 'ak_prod2025_abc123def456' },
                          name: { type: 'string', example: 'Production API Key' },
                          permissions: { type: 'array', items: { type: 'string' } },
                          expiresAt: { type: 'string', format: 'date-time' }
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
      '/api/user/api-keys/{keyId}': {
        delete: {
          tags: ['Admin İşlemleri'],
          summary: 'API anahtarını sil',
          description: 'API anahtarını soft delete yapar',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'keyId', in: 'path', required: true, schema: { type: 'integer' }, description: 'API anahtarı ID' }
          ],
          responses: {
            200: {
              description: 'API anahtarı başarıyla silindi',
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
      // ADMIN CLIENT MANAGEMENT
      // ========================
      '/api/admin/clients': {
        get: {
          tags: ['Admin İşlemleri'],
          summary: 'API client listesi',
          description: 'Tüm API client kayıtlarını listeler (Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Client adı araması' },
            { name: 'isActive', in: 'query', schema: { type: 'boolean' }, description: 'Aktif/pasif filtresi' },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
            { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } }
          ],
          responses: {
            200: {
              description: 'Client listesi başarıyla getirildi',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        },
        post: {
          tags: ['Admin İşlemleri'],
          summary: 'Yeni API client oluştur',
          description: 'Yeni API client kaydı oluşturur (Admin)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'contactEmail'],
                  properties: {
                    name: { type: 'string', example: 'External Integration Client' },
                    description: { type: 'string', example: 'Dış entegrasyon için client' },
                    contactEmail: { type: 'string', format: 'email', example: 'integration@example.com' },
                    isActive: { type: 'boolean', example: true }
                  }
                }
              }
            }
          },
          responses: {
            201: {
              description: 'Client başarıyla oluşturuldu',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      '/api/admin/clients/{id}': {
        get: {
          tags: ['Admin İşlemleri'],
          summary: 'API client detayı',
          description: 'Belirli bir API client detaylarını getirir (Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Client ID' }
          ],
          responses: {
            200: {
              description: 'Client detayı başarıyla getirildi',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      '/api/admin/clients/{id}/keys': {
        post: {
          tags: ['Admin İşlemleri'],
          summary: 'Client için API key oluştur',
          description: 'Belirli bir client için yeni API key oluşturur (Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Client ID' }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['permissions'],
                  properties: {
                    permissions: { 
                      type: 'array', 
                      items: { type: 'string' },
                      example: ['data:read', 'company:read', 'asset:read']
                    },
                    expiresAt: { type: 'string', format: 'date', example: '2025-12-31' }
                  }
                }
              }
            }
          },
          responses: {
            201: {
              description: 'API key başarıyla oluşturuldu',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      '/api/admin/stats': {
        get: {
          tags: ['Admin İşlemleri'],
          summary: 'Sistem istatistikleri',
          description: 'Genel sistem istatistiklerini getirir (Admin)',
          security: [{ bearerAuth: [] }],
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
                          totalClients: { type: 'integer', example: 45 },
                          activeClients: { type: 'integer', example: 38 },
                          totalApiKeys: { type: 'integer', example: 156 },
                          activeApiKeys: { type: 'integer', example: 142 },
                          totalRequests30Days: { type: 'integer', example: 458920 },
                          totalEndpoints: { type: 'integer', example: 141 }
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
      // ========================
      // API ENDPOINT MANAGEMENT
      // ========================
      '/api/endpoints': {
        get: {
          tags: ['Admin İşlemleri'],
          summary: 'API endpoint listesi',
          description: 'Sistemdeki tüm API endpoint tanımlarını listeler',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Endpoint araması' },
            { name: 'category', in: 'query', schema: { type: 'string' }, description: 'Kategori filtresi' },
            { name: 'isActive', in: 'query', schema: { type: 'boolean' }, description: 'Aktif/pasif filtresi' }
          ],
          responses: {
            200: {
              description: 'Endpoint listesi başarıyla getirildi',
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
      totalEndpoints: 89,
      categories: [
        { name: 'Referans Veriler', count: 22, path: '/api/secure/' },
        { name: 'İş Verisi API', count: 18, path: '/api/secure/' },
        { name: 'Personel Yönetimi', count: 9, path: '/api/secure/' },
        { name: 'Çalışma Alanı', count: 3, path: '/api/secure/' },
        { name: 'Asset Yönetimi', count: 6, path: '/api/secure/assets' },
        { name: 'Şirket Yönetimi', count: 5, path: '/api/secure/companies' },
        { name: 'Dosya İşlemleri', count: 3, path: '/api/secure/documents' },
        { name: 'Döküman Yönetimi', count: 6, path: '/api/documents' },
        { name: 'Sefer Kiralama', count: 6, path: '/api/trip-rentals' },
        { name: 'Admin İşlemleri', count: 8, path: '/api/admin/' },
        { name: 'Analytics', count: 6, path: '/api/analytics/' },
        { name: 'Backend API', count: 5, path: '/api/backend/' },
        { name: 'Bulk Import', count: 4, path: '/api/secure/bulk-import' },
        { name: 'Audit System', count: 4, path: '/api/audit' }
      ],
      authentication: {
        apiKey: 'X-API-Key header required for /api/secure/* endpoints',
        jwt: 'Authorization: Bearer token for /api/backend/* and /api/documents/* endpoints',
        demoKey: 'ak_test123key'
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
