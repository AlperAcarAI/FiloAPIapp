import type { Express } from "express";
import type { ApiRequest } from "./api-security";
import { z } from "zod";
import { db } from "./db";
import { 
  apiClients, 
  apiKeys, 
  apiTokens, 
  apiRequestLogs, 
  apiEndpoints,
  apiClientPermissions,
  permissions,
  roles,
  users,
  companies,
  cities,
  penaltyTypes,
  countries,
  policyTypes,
  paymentMethods,
  maintenanceTypes
} from "@shared/schema";
import { 
  insertApiClientSchema,
  insertApiKeySchema,
  insertApiEndpointSchema,
  insertRoleSchema,
  insertPermissionSchema,
  insertPolicyTypeSchema,
  insertPenaltyTypeSchema,
  updatePenaltyTypeSchema
} from "@shared/schema";
import { eq, and, desc, sql, count, avg, gte, not } from "drizzle-orm";
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
import swaggerUi from 'swagger-ui-express';

export function registerApiManagementRoutes(app: Express) {
  
  // ========================
  // SWAGGER API DOKÜMANTASYONU
  // ========================
  
  const swaggerDocument = {
    openapi: '3.0.0',
    info: {
      title: 'Güvenli API Management Sistemi',
      version: '2.0.0',
      description: 'Sigorta ve filo yönetimi için güvenli referans veri API\'leri. Tüm endpoint\'ler API anahtarı ile korunmaktadır.',
      contact: {
        name: 'API Desteği',
        email: 'api-support@example.com'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' ? 'https://your-domain.replit.app' : 'http://localhost:5000',
        description: process.env.NODE_ENV === 'production' ? 'Production Server' : 'Development Server'
      }
    ],
    paths: {
      '/api/secure/getCities': {
        get: {
          summary: 'Şehirler Listesi',
          description: 'Türkiye\'deki 81 şehrin tam listesini döndürür. Sigorta ve filo yönetimi uygulamaları için kullanılır.',
          tags: ['Referans Veriler'],
          security: [{ ApiKeyAuth: [] }],
          responses: {
            '200': {
              description: 'Başarılı yanıt',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'integer', example: 1 },
                            name: { type: 'string', example: 'Adana' }
                          }
                        }
                      },
                      count: { type: 'integer', example: 81 },
                      timestamp: { type: 'string', example: '2025-01-25T10:30:00.000Z' }
                    }
                  }
                }
              }
            },
            '401': { 
              description: 'Geçersiz API anahtarı',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: false },
                      error: { type: 'string', example: 'UNAUTHORIZED' },
                      message: { type: 'string', example: 'Geçersiz API anahtarı' }
                    }
                  }
                }
              }
            },
            '429': { 
              description: 'Rate limit aşıldı',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: false },
                      error: { type: 'string', example: 'RATE_LIMIT_EXCEEDED' },
                      message: { type: 'string', example: 'Çok fazla istek gönderildi' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/secure/getPenaltyTypes': {
        get: {
          summary: 'Ceza Türleri Listesi',
          description: '301 farklı trafik cezası türünün detaylı listesini döndürür. Filo yönetimi ve sürücü değerlendirme sistemleri için kullanılır.',
          tags: ['Referans Veriler'],
          security: [{ ApiKeyAuth: [] }],
          responses: {
            '200': {
              description: 'Başarılı yanıt',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'integer', example: 1 },
                            name: { type: 'string', example: 'Hız Sınırı Aşımı' },
                            description: { type: 'string', example: 'Belirlenen hız sınırını aşma' },
                            penaltyScore: { type: 'integer', example: 10 },
                            amountCents: { type: 'integer', example: 23500 },
                            discountedAmountCents: { type: 'integer', example: 11750 },
                            isActive: { type: 'boolean', example: true },
                            lastDate: { type: 'string', format: 'date', example: '2025-12-31' }
                          }
                        }
                      },
                      count: { type: 'integer', example: 301 },
                      timestamp: { type: 'string', example: '2025-01-25T10:30:00.000Z' }
                    }
                  }
                }
              }
            },
            '401': { description: 'Geçersiz API anahtarı' },
            '429': { description: 'Rate limit aşıldı' }
          }
        }
      },
      '/api/secure/getCountries': {
        get: {
          summary: 'Ülkeler Listesi',
          description: 'Dünya ülkeleri ve telefon kodlarının tam listesini döndürür. Uluslararası sigorta ve müşteri kayıt sistemleri için kullanılır.',
          tags: ['Referans Veriler'],
          security: [{ ApiKeyAuth: [] }],
          responses: {
            '200': {
              description: 'Başarılı yanıt',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'integer', example: 1 },
                            name: { type: 'string', example: 'Türkiye' },
                            iso_code: { type: 'string', example: 'TR' },
                            phone_code: { type: 'string', example: '+90' }
                          }
                        }
                      },
                      count: { type: 'integer', example: 195 },
                      timestamp: { type: 'string', example: '2025-01-25T10:30:00.000Z' }
                    }
                  }
                }
              }
            },
            '401': { description: 'Geçersiz API anahtarı' },
            '429': { description: 'Rate limit aşıldı' }
          }
        }
      },
      '/api/secure/getPolicyTypes': {
        get: {
          summary: 'Poliçe Türleri Listesi',
          description: 'Sigorta poliçe türlerinin listesini döndürür. Sigorta yönetim sistemleri için kullanılır.',
          tags: ['Referans Veriler'],
          security: [{ ApiKeyAuth: [] }],
          responses: {
            '200': {
              description: 'Başarılı yanıt',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'integer', example: 1 },
                            name: { type: 'string', example: 'Kasko Sigortası' },
                            is_active: { type: 'boolean', example: true }
                          }
                        }
                      },
                      count: { type: 'integer', example: 7 },
                      timestamp: { type: 'string', example: '2025-01-25T10:30:00.000Z' }
                    }
                  }
                }
              }
            },
            '401': { description: 'Geçersiz API anahtarı' },
            '429': { description: 'Rate limit aşıldı' }
          }
        }
      },
      '/api/secure/getPaymentMethods': {
        get: {
          summary: 'Ödeme Yöntemleri Listesi',
          description: 'Ödeme yöntemlerinin listesini döndürür. E-ticaret ve ödeme işleme sistemleri için kullanılır.',
          tags: ['Referans Veriler'],
          security: [{ ApiKeyAuth: [] }],
          responses: {
            '200': {
              description: 'Başarılı yanıt',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'integer', example: 1 },
                            name: { type: 'string', example: 'Kredi Kartı' },
                            is_active: { type: 'boolean', example: true }
                          }
                        }
                      },
                      count: { type: 'integer', example: 7 },
                      timestamp: { type: 'string', example: '2025-01-25T10:30:00.000Z' }
                    }
                  }
                }
              }
            },
            '401': { description: 'Geçersiz API anahtarı' },
            '429': { description: 'Rate limit aşıldı' }
          }
        }
      },
      '/api/secure/addPolicyType': {
        post: {
          summary: 'Yeni Poliçe Tipi Ekle',
          description: 'Sisteme yeni bir poliçe tipi ekler. Aynı isimde bir kayıt varsa hata döndürür.',
          tags: ['Veri İşlemleri'],
          security: [{ ApiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name'],
                  properties: {
                    name: { type: 'string', example: 'Yeni Poliçe Tipi' },
                    isActive: { type: 'boolean', example: true, default: true }
                  }
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Poliçe tipi başarıyla eklendi',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Poliçe tipi başarıyla eklendi.' },
                      data: {
                        type: 'object',
                        properties: {
                          id: { type: 'integer', example: 8 },
                          name: { type: 'string', example: 'Yeni Poliçe Tipi' },
                          isActive: { type: 'boolean', example: true }
                        }
                      },
                      timestamp: { type: 'string', example: '2025-01-25T12:00:00.000Z' }
                    }
                  }
                }
              }
            },
            '400': { description: 'Geçersiz veri formatı' },
            '401': { description: 'Geçersiz API anahtarı' },
            '409': { description: 'Aynı isimde poliçe tipi zaten mevcut' },
            '429': { description: 'Rate limit aşıldı' }
          }
        }
      },
      '/api/secure/addPenaltyType': {
        post: {
          summary: 'Yeni Ceza Türü Ekle',
          description: 'Sisteme yeni bir trafik cezası türü ekler. Detaylı ceza bilgileri ile birlikte.',
          tags: ['Veri İşlemleri'],
          security: [{ ApiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'penaltyScore', 'amountCents', 'discountedAmountCents'],
                  properties: {
                    name: { type: 'string', example: 'Test Ceza Türü' },
                    description: { type: 'string', example: 'Test amaçlı oluşturulan ceza türü' },
                    penaltyScore: { type: 'integer', example: 10 },
                    amountCents: { type: 'integer', example: 50000 },
                    discountedAmountCents: { type: 'integer', example: 37500 },
                    isActive: { type: 'boolean', example: true, default: true },
                    lastDate: { type: 'string', format: 'date', example: '2025-12-31' }
                  }
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Ceza türü başarıyla eklendi',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Ceza türü başarıyla eklendi.' },
                      data: {
                        type: 'object',
                        properties: {
                          id: { type: 'integer', example: 302 },
                          name: { type: 'string', example: 'Test Ceza Türü' },
                          description: { type: 'string', example: 'Test amaçlı oluşturulan ceza türü' },
                          penaltyScore: { type: 'integer', example: 10 },
                          amountCents: { type: 'integer', example: 50000 },
                          discountedAmountCents: { type: 'integer', example: 37500 },
                          isActive: { type: 'boolean', example: true },
                          lastDate: { type: 'string', format: 'date', example: '2025-12-31' }
                        }
                      },
                      timestamp: { type: 'string', example: '2025-01-25T12:00:00.000Z' }
                    }
                  }
                }
              }
            },
            '400': { description: 'Geçersiz veri formatı' },
            '401': { description: 'Geçersiz API anahtarı' },
            '409': { description: 'Aynı isimde ceza türü zaten mevcut' },
            '429': { description: 'Rate limit aşıldı' }
          }
        }
      },
      '/api/secure/updatePenaltyType/{id}': {
        put: {
          summary: 'Ceza Türü Güncelle',
          description: 'Mevcut bir trafik cezası türünü günceller. Sadece gönderilen alanlar güncellenir.',
          tags: ['Veri İşlemleri'],
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Güncellenecek ceza türünün ID\'si',
              schema: { type: 'integer', example: 1 }
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', example: 'Güncellenmiş Ceza Türü' },
                    description: { type: 'string', example: 'Güncelleme testi' },
                    penaltyScore: { type: 'integer', example: 15 },
                    amountCents: { type: 'integer', example: 75000 },
                    discountedAmountCents: { type: 'integer', example: 56250 },
                    isActive: { type: 'boolean', example: true },
                    lastDate: { type: 'string', format: 'date', example: '2025-12-31' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Ceza türü başarıyla güncellendi',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Ceza türü başarıyla güncellendi.' },
                      data: {
                        type: 'object',
                        properties: {
                          id: { type: 'integer', example: 1 },
                          name: { type: 'string', example: 'Güncellenmiş Ceza Türü' },
                          description: { type: 'string', example: 'Güncelleme testi' },
                          penaltyScore: { type: 'integer', example: 15 },
                          amountCents: { type: 'integer', example: 75000 },
                          discountedAmountCents: { type: 'integer', example: 56250 },
                          isActive: { type: 'boolean', example: true },
                          lastDate: { type: 'string', format: 'date', example: '2025-12-31' }
                        }
                      },
                      timestamp: { type: 'string', example: '2025-01-25T12:00:00.000Z' }
                    }
                  }
                }
              }
            },
            '400': { description: 'Geçersiz veri formatı veya ID' },
            '401': { description: 'Geçersiz API anahtarı' },
            '404': { description: 'Ceza türü bulunamadı' },
            '409': { description: 'Aynı isimde başka bir ceza türü zaten mevcut' },
            '429': { description: 'Rate limit aşıldı' }
          }
        }
      },
      '/api/secure/getMaintenanceTypes': {
        get: {
          summary: 'Bakım Türleri Listesi',
          description: 'Araç bakım türlerinin listesini döndürür. Filo yönetimi ve araç bakım takip sistemleri için kullanılır.',
          tags: ['Referans Veriler'],
          security: [{ ApiKeyAuth: [] }],
          responses: {
            '200': {
              description: 'Başarılı yanıt',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'integer', example: 1 },
                            name: { type: 'string', example: 'Muayene' },
                            is_active: { type: 'boolean', example: true }
                          }
                        }
                      },
                      count: { type: 'integer', example: 7 },
                      timestamp: { type: 'string', example: '2025-01-25T10:30:00.000Z' }
                    }
                  }
                }
              }
            },
            '401': { description: 'Geçersiz API anahtarı' },
            '429': { description: 'Rate limit aşıldı' }
          }
        }
      }
    },
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API anahtarınızı X-API-Key header\'ında gönderin. Demo anahtarı: ak_demo2025key'
        }
      }
    },
    tags: [
      {
        name: 'Referans Veriler',
        description: 'Sigorta ve filo yönetimi için temel referans veri API\'leri'
      },
      {
        name: 'Veri İşlemleri',
        description: 'Veri ekleme, güncelleme ve silme işlemleri'
      }
    ]
  };

  // Swagger UI setup
  app.use('/api/docs', swaggerUi.serve);
  app.get('/api/docs', swaggerUi.setup(swaggerDocument, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'API Dokümantasyonu',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha'
    }
  }));
  
  // ========================
  // ADMİN PANEL ROUTE'LARI (JWT ile korunuyor)
  // ========================

  // Tüm API Client'ları listele
  app.get("/api/admin/clients", authenticateToken, async (req, res) => {
    try {
      const clients = await db
        .select({
          id: apiClients.id,
          name: apiClients.name,
          companyId: apiClients.companyId,
          companyName: companies.name,
          isActive: apiClients.isActive,
          createdAt: apiClients.createdAt,
          totalKeys: count(apiKeys.id),
        })
        .from(apiClients)
        .leftJoin(companies, eq(apiClients.companyId, companies.id))
        .leftJoin(apiKeys, eq(apiClients.id, apiKeys.clientId))
        .groupBy(apiClients.id, companies.name)
        .orderBy(desc(apiClients.createdAt));

      res.json({
        success: true,
        data: clients
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "DATABASE_ERROR",
        message: "Client listesi alınamadı."
      });
    }
  });

  // Yeni API Client oluştur
  app.post("/api/admin/clients", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertApiClientSchema.parse(req.body);
      
      const result = await createApiClient(
        validatedData.name,
        validatedData.companyId,
        req.body.permissions || []
      );

      res.status(201).json({
        success: true,
        data: {
          client: result.client,
          apiKey: result.apiKey,
          message: "API Client başarıyla oluşturuldu. API anahtarını güvenli yerde saklayın."
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: "VALIDATION_ERROR",
        message: error instanceof Error ? error.message : "Geçersiz veri."
      });
    }
  });

  // API Client detayları
  app.get("/api/admin/clients/:id", authenticateToken, async (req, res) => {
    try {
      const clientId = parseInt(req.params.id);
      
      const [client] = await db
        .select({
          id: apiClients.id,
          name: apiClients.name,
          companyId: apiClients.companyId,
          companyName: companies.name,
          isActive: apiClients.isActive,
          createdAt: apiClients.createdAt,
        })
        .from(apiClients)
        .leftJoin(companies, eq(apiClients.companyId, companies.id))
        .where(eq(apiClients.id, clientId));

      if (!client) {
        return res.status(404).json({
          success: false,
          error: "CLIENT_NOT_FOUND",
          message: "API Client bulunamadı."
        });
      }

      // Client'ın API anahtarları
      const keys = await db
        .select({
          id: apiKeys.id,
          description: apiKeys.description,
          isActive: apiKeys.isActive,
          createdAt: apiKeys.createdAt,
        })
        .from(apiKeys)
        .where(eq(apiKeys.clientId, clientId))
        .orderBy(desc(apiKeys.createdAt));

      // Client'ın izinleri
      const clientPermissions = await db
        .select({
          id: permissions.id,
          name: permissions.name,
          description: permissions.description,
          grantedAt: apiClientPermissions.grantedAt,
        })
        .from(apiClientPermissions)
        .innerJoin(permissions, eq(apiClientPermissions.permissionId, permissions.id))
        .where(eq(apiClientPermissions.clientId, clientId));

      // Son 30 günün istatistikleri
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const stats = await db
        .select({
          totalRequests: count(apiRequestLogs.id),
          avgResponseTime: avg(apiRequestLogs.responseTime),
          errorCount: count(sql`CASE WHEN ${apiRequestLogs.responseStatus} >= 400 THEN 1 END`),
        })
        .from(apiRequestLogs)
        .where(and(
          eq(apiRequestLogs.clientId, clientId),
          gte(apiRequestLogs.timestamp, thirtyDaysAgo)
        ));

      res.json({
        success: true,
        data: {
          client,
          keys,
          permissions: clientPermissions,
          stats: stats[0]
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "DATABASE_ERROR",
        message: "Client detayları alınamadı."
      });
    }
  });

  // Yeni API anahtarı oluştur
  app.post("/api/admin/clients/:id/keys", authenticateToken, async (req, res) => {
    try {
      const clientId = parseInt(req.params.id);
      const { description } = req.body;

      // Client'ın varlığını kontrol et
      const [client] = await db
        .select()
        .from(apiClients)
        .where(eq(apiClients.id, clientId));

      if (!client) {
        return res.status(404).json({
          success: false,
          error: "CLIENT_NOT_FOUND",
          message: "API Client bulunamadı."
        });
      }

      // Yeni API anahtarı oluştur
      const apiKey = generateApiKey();
      const keyHash = await hashApiKey(apiKey);

      const [newKey] = await db.insert(apiKeys).values({
        clientId,
        keyHash,
        description: description || `${client.name} için API anahtarı`,
        isActive: true
      }).returning();

      res.status(201).json({
        success: true,
        data: {
          keyId: newKey.id,
          apiKey: apiKey,
          description: newKey.description,
          message: "Yeni API anahtarı oluşturuldu. Bu anahtarı güvenli yerde saklayın."
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "DATABASE_ERROR",
        message: "API anahtarı oluşturulamadı."
      });
    }
  });

  // İzin yönetimi - Tüm izinler
  app.get("/api/admin/permissions", authenticateToken, async (req, res) => {
    try {
      const allPermissions = await db
        .select()
        .from(permissions)
        .orderBy(permissions.name);

      res.json({
        success: true,
        data: allPermissions
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "DATABASE_ERROR",
        message: "İzinler listelenemedi."
      });
    }
  });

  // Yeni izin oluştur
  app.post("/api/admin/permissions", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertPermissionSchema.parse(req.body);
      
      const [newPermission] = await db.insert(permissions).values(validatedData).returning();

      res.status(201).json({
        success: true,
        data: newPermission
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: "VALIDATION_ERROR",
        message: error instanceof Error ? error.message : "Geçersiz veri."
      });
    }
  });

  // Client'a izin ver
  app.post("/api/admin/clients/:id/permissions", authenticateToken, async (req, res) => {
    try {
      const clientId = parseInt(req.params.id);
      const { permissionIds } = req.body;

      if (!Array.isArray(permissionIds)) {
        return res.status(400).json({
          success: false,
          error: "INVALID_DATA",
          message: "permissionIds array olmalıdır."
        });
      }

      // Mevcut izinleri kontrol et ve yeni olanları ekle
      const grants = permissionIds.map(permissionId => ({
        clientId,
        permissionId,
        grantedAt: new Date()
      }));

      await db.insert(apiClientPermissions).values(grants);

      res.json({
        success: true,
        message: "İzinler başarıyla verildi."
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "DATABASE_ERROR",
        message: "İzinler verilemedi."
      });
    }
  });

  // ========================
  // API İSTATİSTİKLERİ
  // ========================

  // Genel sistem istatistikleri
  app.get("/api/admin/stats", authenticateToken, async (req, res) => {
    try {
      const stats = await getApiStats();

      // Son 24 saatin istek dağılımı
      const last24Hours = new Date();
      last24Hours.setHours(last24Hours.getHours() - 24);

      const hourlyStats = await db
        .select({
          hour: sql<string>`DATE_TRUNC('hour', ${apiRequestLogs.timestamp})`,
          requestCount: count(apiRequestLogs.id),
          avgResponseTime: avg(apiRequestLogs.responseTime),
        })
        .from(apiRequestLogs)
        .where(gte(apiRequestLogs.timestamp, last24Hours))
        .groupBy(sql`DATE_TRUNC('hour', ${apiRequestLogs.timestamp})`)
        .orderBy(sql`DATE_TRUNC('hour', ${apiRequestLogs.timestamp})`);

      res.json({
        success: true,
        data: {
          ...stats,
          hourlyStats
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "STATS_ERROR",
        message: "İstatistikler alınamadı."
      });
    }
  });

  // Client özel istatistikleri
  app.get("/api/admin/clients/:id/stats", authenticateToken, async (req, res) => {
    try {
      const clientId = parseInt(req.params.id);
      const stats = await getApiStats(clientId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "STATS_ERROR",
        message: "Client istatistikleri alınamadı."
      });
    }
  });

  // ========================
  // API ENDPOINT YÖNETİMİ
  // ========================

  // Tüm endpoint'leri listele
  app.get("/api/admin/endpoints", authenticateToken, async (req, res) => {
    try {
      const endpoints = await db
        .select()
        .from(apiEndpoints)
        .orderBy(apiEndpoints.endpoint);

      res.json({
        success: true,
        data: endpoints
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "DATABASE_ERROR",
        message: "Endpoint'ler listelenemedi."
      });
    }
  });

  // Yeni endpoint ekle
  app.post("/api/admin/endpoints", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertApiEndpointSchema.parse(req.body);
      
      const [newEndpoint] = await db.insert(apiEndpoints).values({
        ...validatedData,
        updatedAt: new Date()
      }).returning();

      res.status(201).json({
        success: true,
        data: newEndpoint
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: "VALIDATION_ERROR",
        message: error instanceof Error ? error.message : "Geçersiz endpoint verisi."
      });
    }
  });

  // ========================
  // KORUNAN API ENDPOINT'LERİ (Örnek)
  // ========================

  // Cities API - Şehir listesi (Okuma izni gerekir)
  app.get(
    "/api/secure/getCities", 
    authenticateApiKey,
    logApiRequest,
    rateLimitMiddleware(100),
    authorizeEndpoint(['data:read']),
    async (req: ApiRequest, res) => {
      try {
        const citiesList = await db.select({
          id: cities.id,
          name: cities.name
        }).from(cities).orderBy(cities.name);
        
        res.json({
          success: true,
          data: citiesList,
          count: citiesList.length,
          clientInfo: {
            id: req.apiClient?.id,
            name: req.apiClient?.name,
            companyId: req.apiClient?.companyId
          },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error("Cities getirme hatası:", error);
        res.status(500).json({
          success: false,
          error: "CITIES_FETCH_ERROR",
          message: "Şehir listesi alınırken bir hata oluştu."
        });
      }
    }
  );

  // Penalty Types API - Ceza türleri listesi (Okuma izni gerekir)
  app.get(
    "/api/secure/getPenaltyTypes", 
    authenticateApiKey,
    logApiRequest,
    rateLimitMiddleware(100),
    authorizeEndpoint(['data:read']),
    async (req: ApiRequest, res) => {
      try {
        const penaltyTypesList = await db.select({
          id: penaltyTypes.id,
          name: penaltyTypes.name,
          description: penaltyTypes.description,
          penaltyScore: penaltyTypes.penaltyScore,
          amountCents: penaltyTypes.amountCents,
          discountedAmountCents: penaltyTypes.discountedAmountCents,
          isActive: penaltyTypes.isActive,
          lastDate: penaltyTypes.lastDate
        }).from(penaltyTypes)
          .where(eq(penaltyTypes.isActive, true))
          .orderBy(penaltyTypes.penaltyScore, penaltyTypes.name);
        
        res.json({
          success: true,
          data: penaltyTypesList,
          count: penaltyTypesList.length,
          clientInfo: {
            id: req.apiClient?.id,
            name: req.apiClient?.name,
            companyId: req.apiClient?.companyId
          },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error("Penalty types getirme hatası:", error);
        res.status(500).json({
          success: false,
          error: "PENALTY_TYPES_FETCH_ERROR",
          message: "Ceza türleri listesi alınırken bir hata oluştu."
        });
      }
    }
  );

  // Countries API - Ülke listesi (Okuma izni gerekir)
  app.get(
    "/api/secure/getCountries", 
    authenticateApiKey,
    logApiRequest,
    rateLimitMiddleware(100),
    authorizeEndpoint(['data:read']),
    async (req: ApiRequest, res) => {
      try {
        const countriesList = await db.select({
          id: countries.id,
          name: countries.name,
          phoneCode: countries.phoneCode
        }).from(countries).orderBy(countries.name);
        
        res.json({
          success: true,
          data: countriesList,
          count: countriesList.length,
          clientInfo: {
            id: req.apiClient?.id,
            name: req.apiClient?.name,
            companyId: req.apiClient?.companyId
          },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error("Countries getirme hatası:", error);
        res.status(500).json({
          success: false,
          error: "COUNTRIES_FETCH_ERROR",
          message: "Ülke listesi alınırken bir hata oluştu."
        });
      }
    }
  );

  // Policy Types API - Poliçe türleri listesi (Okuma izni gerekir)
  app.get(
    "/api/secure/getPolicyTypes", 
    authenticateApiKey,
    logApiRequest,
    rateLimitMiddleware(100),
    authorizeEndpoint(['data:read']),
    async (req: ApiRequest, res) => {
      try {
        const policyTypesList = await db.select({
          id: policyTypes.id,
          name: policyTypes.name
        }).from(policyTypes)
          .where(eq(policyTypes.isActive, true))
          .orderBy(policyTypes.name);
        
        res.json({
          success: true,
          data: policyTypesList,
          count: policyTypesList.length,
          clientInfo: {
            id: req.apiClient?.id,
            name: req.apiClient?.name,
            companyId: req.apiClient?.companyId
          },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error("Policy types getirme hatası:", error);
        res.status(500).json({
          success: false,
          error: "POLICY_TYPES_FETCH_ERROR",
          message: "Poliçe türleri listesi alınırken bir hata oluştu."
        });
      }
    }
  );

  // Payment Methods API - Ödeme yöntemleri listesi (Okuma izni gerekir)
  app.get(
    "/api/secure/getPaymentMethods", 
    authenticateApiKey,
    logApiRequest,
    rateLimitMiddleware(100),
    authorizeEndpoint(['data:read']),
    async (req: ApiRequest, res) => {
      try {
        const paymentMethodsList = await db.select({
          id: paymentMethods.id,
          name: paymentMethods.name
        }).from(paymentMethods)
          .where(eq(paymentMethods.isActive, true))
          .orderBy(paymentMethods.name);
        
        res.json({
          success: true,
          data: paymentMethodsList,
          count: paymentMethodsList.length,
          clientInfo: {
            id: req.apiClient?.id,
            name: req.apiClient?.name,
            companyId: req.apiClient?.companyId
          },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error("Payment methods getirme hatası:", error);
        res.status(500).json({
          success: false,
          error: "PAYMENT_METHODS_FETCH_ERROR",
          message: "Ödeme yöntemleri listesi alınırken bir hata oluştu."
        });
      }
    }
  );

  // Maintenance Types API - Bakım türleri listesi (Okuma izni gerekir)
  app.get(
    "/api/secure/getMaintenanceTypes", 
    authenticateApiKey,
    logApiRequest,
    rateLimitMiddleware(100),
    authorizeEndpoint(['data:read']),
    async (req: ApiRequest, res) => {
      try {
        const maintenanceTypesList = await db.select({
          id: maintenanceTypes.id,
          name: maintenanceTypes.name
        }).from(maintenanceTypes)
          .where(eq(maintenanceTypes.isActive, true))
          .orderBy(maintenanceTypes.name);
        
        res.json({
          success: true,
          data: maintenanceTypesList,
          count: maintenanceTypesList.length,
          clientInfo: {
            id: req.apiClient?.id,
            name: req.apiClient?.name,
            companyId: req.apiClient?.companyId
          },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error("Maintenance types getirme hatası:", error);
        res.status(500).json({
          success: false,
          error: "MAINTENANCE_TYPES_FETCH_ERROR",
          message: "Bakım türleri listesi alınırken bir hata oluştu."
        });
      }
    }
  );

  // Yeni Poliçe Tipi Ekleme API - Yazma izni gerekir
  app.post(
    "/api/secure/addPolicyType", 
    authenticateApiKey,
    logApiRequest,
    rateLimitMiddleware(50),
    authorizeEndpoint(['data:write']),
    async (req: ApiRequest, res) => {
      try {
        // Request body'yi validate et
        const validatedData = insertPolicyTypeSchema.parse(req.body);
        
        // Aynı isimle poliçe tipi var mı kontrol et
        const existingPolicyType = await db.select({
          id: policyTypes.id,
          name: policyTypes.name
        }).from(policyTypes)
          .where(eq(policyTypes.name, validatedData.name))
          .limit(1);
        
        if (existingPolicyType.length > 0) {
          return res.status(409).json({
            success: false,
            error: "DUPLICATE_POLICY_TYPE",
            message: `'${validatedData.name}' isimli poliçe tipi zaten mevcut.`,
            existingPolicyType: existingPolicyType[0],
            clientInfo: {
              id: req.apiClient?.id,
              name: req.apiClient?.name,
              companyId: req.apiClient?.companyId
            },
            timestamp: new Date().toISOString()
          });
        }
        
        // Yeni poliçe tipini ekle
        const [newPolicyType] = await db.insert(policyTypes).values({
          name: validatedData.name,
          isActive: validatedData.isActive ?? true
        }).returning({
          id: policyTypes.id,
          name: policyTypes.name,
          isActive: policyTypes.isActive
        });
        
        res.status(201).json({
          success: true,
          message: "Poliçe tipi başarıyla eklendi.",
          data: newPolicyType,
          clientInfo: {
            id: req.apiClient?.id,
            name: req.apiClient?.name,
            companyId: req.apiClient?.companyId
          },
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.error("Poliçe tipi ekleme hatası:", error);
        
        if (error instanceof z.ZodError) {
          return res.status(400).json({
            success: false,
            error: "VALIDATION_ERROR",
            message: "Geçersiz veri formatı.",
            details: error.errors,
            timestamp: new Date().toISOString()
          });
        }
        
        res.status(500).json({
          success: false,
          error: "POLICY_TYPE_CREATE_ERROR",
          message: "Poliçe tipi eklenirken bir hata oluştu.",
          timestamp: new Date().toISOString()
        });
      }
    }
  );

  // Ceza Türü Ekleme API - Yazma izni gerekir
  app.post(
    "/api/secure/addPenaltyType", 
    authenticateApiKey,
    logApiRequest,
    rateLimitMiddleware(50),
    authorizeEndpoint(['data:write']),
    async (req: ApiRequest, res) => {
      try {
        // Request body'yi validate et
        const validatedData = insertPenaltyTypeSchema.parse(req.body);
        
        // Aynı isimle ceza türü var mı kontrol et
        const existingPenaltyType = await db.select({
          id: penaltyTypes.id,
          name: penaltyTypes.name
        }).from(penaltyTypes)
          .where(eq(penaltyTypes.name, validatedData.name))
          .limit(1);
        
        if (existingPenaltyType.length > 0) {
          return res.status(409).json({
            success: false,
            error: "DUPLICATE_PENALTY_TYPE",
            message: `'${validatedData.name}' isimli ceza türü zaten mevcut.`,
            existingPenaltyType: existingPenaltyType[0],
            clientInfo: {
              id: req.apiClient?.id,
              name: req.apiClient?.name,
              companyId: req.apiClient?.companyId
            },
            timestamp: new Date().toISOString()
          });
        }
        
        // Yeni ceza türünü ekle
        const [newPenaltyType] = await db.insert(penaltyTypes).values({
          name: validatedData.name,
          description: validatedData.description,
          penaltyScore: validatedData.penaltyScore,
          amountCents: validatedData.amountCents,
          discountedAmountCents: validatedData.discountedAmountCents,
          isActive: validatedData.isActive ?? true,
          lastDate: validatedData.lastDate
        }).returning({
          id: penaltyTypes.id,
          name: penaltyTypes.name,
          description: penaltyTypes.description,
          penaltyScore: penaltyTypes.penaltyScore,
          amountCents: penaltyTypes.amountCents,
          discountedAmountCents: penaltyTypes.discountedAmountCents,
          isActive: penaltyTypes.isActive,
          lastDate: penaltyTypes.lastDate
        });
        
        res.status(201).json({
          success: true,
          message: "Ceza türü başarıyla eklendi.",
          data: newPenaltyType,
          clientInfo: {
            id: req.apiClient?.id,
            name: req.apiClient?.name,
            companyId: req.apiClient?.companyId
          },
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.error("Ceza türü ekleme hatası:", error);
        
        if (error instanceof z.ZodError) {
          return res.status(400).json({
            success: false,
            error: "VALIDATION_ERROR",
            message: "Geçersiz veri formatı.",
            details: error.errors,
            timestamp: new Date().toISOString()
          });
        }
        
        res.status(500).json({
          success: false,
          error: "SERVER_ERROR",
          message: "Ceza türü eklenirken sunucu hatası oluştu.",
          timestamp: new Date().toISOString()
        });
      }
    }
  );

  // Ceza Türü Güncelleme API - Yazma izni gerekir
  app.put(
    "/api/secure/updatePenaltyType/:id", 
    authenticateApiKey,
    logApiRequest,
    rateLimitMiddleware(50),
    authorizeEndpoint(['data:write']),
    async (req: ApiRequest, res) => {
      try {
        const penaltyId = parseInt(req.params.id);
        
        if (isNaN(penaltyId)) {
          return res.status(400).json({
            success: false,
            error: "INVALID_ID",
            message: "Geçersiz ceza türü ID",
            timestamp: new Date().toISOString()
          });
        }

        // Request body'yi validate et
        const validatedData = updatePenaltyTypeSchema.parse(req.body);
        
        // Ceza türünün var olup olmadığını kontrol et
        const existingPenalty = await db.select()
          .from(penaltyTypes)
          .where(eq(penaltyTypes.id, penaltyId))
          .limit(1);

        if (existingPenalty.length === 0) {
          return res.status(404).json({
            success: false,
            error: "PENALTY_TYPE_NOT_FOUND",
            message: "Güncellenecek ceza türü bulunamadı",
            timestamp: new Date().toISOString()
          });
        }

        // İsim değiştiriliyorsa mükerrer kontrol yap
        if (validatedData.name) {
          const duplicateCheck = await db.select({
            id: penaltyTypes.id,
            name: penaltyTypes.name
          }).from(penaltyTypes)
            .where(and(
              eq(penaltyTypes.name, validatedData.name),
              not(eq(penaltyTypes.id, penaltyId))
            ))
            .limit(1);

          if (duplicateCheck.length > 0) {
            return res.status(409).json({
              success: false,
              error: "DUPLICATE_PENALTY_TYPE",
              message: `'${validatedData.name}' isimli başka bir ceza türü zaten mevcut.`,
              existingPenaltyType: duplicateCheck[0],
              timestamp: new Date().toISOString()
            });
          }
        }

        // Ceza türünü güncelle
        const [updatedPenaltyType] = await db.update(penaltyTypes)
          .set(validatedData)
          .where(eq(penaltyTypes.id, penaltyId))
          .returning({
            id: penaltyTypes.id,
            name: penaltyTypes.name,
            description: penaltyTypes.description,
            penaltyScore: penaltyTypes.penaltyScore,
            amountCents: penaltyTypes.amountCents,
            discountedAmountCents: penaltyTypes.discountedAmountCents,
            isActive: penaltyTypes.isActive,
            lastDate: penaltyTypes.lastDate
          });

        res.json({
          success: true,
          message: "Ceza türü başarıyla güncellendi.",
          data: updatedPenaltyType,
          clientInfo: {
            id: req.apiClient?.id,
            name: req.apiClient?.name,
            companyId: req.apiClient?.companyId
          },
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error("Ceza türü güncelleme hatası:", error);
        
        if (error instanceof z.ZodError) {
          return res.status(400).json({
            success: false,
            error: "VALIDATION_ERROR",
            message: "Geçersiz veri formatı.",
            details: error.errors,
            timestamp: new Date().toISOString()
          });
        }
        
        res.status(500).json({
          success: false,
          error: "SERVER_ERROR",
          message: "Ceza türü güncellenirken sunucu hatası oluştu.",
          timestamp: new Date().toISOString()
        });
      }
    }
  );

  // Veri listeleme (Okuma izni gerekir)
  app.get(
    "/api/secure/data", 
    authenticateApiKey,
    logApiRequest,
    rateLimitMiddleware(50),
    authorizeEndpoint(['data:read']),
    async (req: ApiRequest, res) => {
      try {
        // Örnek veri döndür
        res.json({
          success: true,
          data: {
            message: "Bu korumalı bir endpoint'tir.",
            clientInfo: req.apiClient,
            timestamp: new Date().toISOString(),
            sampleData: [
              { id: 1, name: "Örnek Veri 1" },
              { id: 2, name: "Örnek Veri 2" }
            ]
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: "SERVER_ERROR",
          message: "Sunucu hatası oluştu."
        });
      }
    }
  );

  // Veri oluşturma (Yazma izni gerekir)
  app.post(
    "/api/secure/data",
    authenticateApiKey,
    logApiRequest,
    rateLimitMiddleware(20),
    authorizeEndpoint(['data:write']),
    async (req: ApiRequest, res) => {
      try {
        const { name, description } = req.body;

        if (!name) {
          return res.status(400).json({
            success: false,
            error: "VALIDATION_ERROR",
            message: "Name alanı gereklidir."
          });
        }

        // Yeni veri oluşturuldu simülasyonu
        const newData = {
          id: Math.floor(Math.random() * 1000),
          name,
          description: description || null,
          createdAt: new Date().toISOString(),
          createdBy: req.apiClient?.name
        };

        res.status(201).json({
          success: true,
          data: newData,
          message: "Veri başarıyla oluşturuldu."
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: "SERVER_ERROR",
          message: "Veri oluşturulamadı."
        });
      }
    }
  );

  // Hassas veri endpoint'i (Admin izni gerekir)
  app.get(
    "/api/secure/admin-data",
    authenticateApiKey,
    logApiRequest,
    rateLimitMiddleware(10),
    authorizeEndpoint(['admin:read']),
    async (req, res) => {
      try {
        res.json({
          success: true,
          data: {
            message: "Bu sadece admin yetkisi olan client'lar için erişilebilir.",
            sensitiveData: {
              systemInfo: "Gizli sistem bilgileri",
              userCount: 42,
              systemHealth: "OK"
            }
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: "SERVER_ERROR",
          message: "Admin verileri alınamadı."
        });
      }
    }
  );
}