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
import { auditableInsert, auditableUpdate, auditableDelete, captureAuditInfo } from "./audit-middleware";
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
      '/api/secure/addMaintenanceType': {
        post: {
          summary: 'Yeni Bakım Türü Ekle',
          description: 'Sisteme yeni bir bakım türü ekler. Araç bakım kategorileri için kullanılır.',
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
                    name: { type: 'string', example: 'Test Bakım Türü' },
                    isActive: { type: 'boolean', example: true, default: true }
                  }
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Bakım türü başarıyla eklendi',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Bakım türü başarıyla eklendi.' },
                      data: {
                        type: 'object',
                        properties: {
                          id: { type: 'integer', example: 8 },
                          name: { type: 'string', example: 'Test Bakım Türü' },
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
            '409': { description: 'Aynı isimde bakım türü zaten mevcut' },
            '429': { description: 'Rate limit aşıldı' }
          }
        }
      },
      '/api/secure/addWorkArea': {
        post: {
          summary: 'Yeni Çalışma Alanı Ekle',
          description: 'Sisteme yeni çalışma alanı ekler. Aynı şehirde aynı isimde alan kontrolü yapar.',
          tags: ['Veri İşlemleri'],
          security: [{ ApiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['cityId', 'name', 'startDate'],
                  properties: {
                    cityId: { type: 'integer', example: 1, description: 'Şehir ID (cities tablosundan)' },
                    name: { type: 'string', example: 'Merkez Ofis' },
                    address: { type: 'string', example: 'Atatürk Caddesi No:123' },
                    managerId: { type: 'integer', example: 1, description: 'Yönetici personel ID' },
                    startDate: { type: 'string', format: 'date', example: '2025-01-01' },
                    endDate: { type: 'string', format: 'date', example: '2025-12-31' },
                    isActive: { type: 'boolean', example: true, default: true }
                  }
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Çalışma alanı başarıyla eklendi',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Çalışma alanı başarıyla eklendi.' },
                      data: {
                        type: 'object',
                        properties: {
                          id: { type: 'integer', example: 1 },
                          cityId: { type: 'integer', example: 1 },
                          name: { type: 'string', example: 'Merkez Ofis' },
                          address: { type: 'string', example: 'Atatürk Caddesi No:123' },
                          managerId: { type: 'integer', example: 1 },
                          startDate: { type: 'string', format: 'date', example: '2025-01-01' },
                          endDate: { type: 'string', format: 'date', example: '2025-12-31' },
                          isActive: { type: 'boolean', example: true }
                        }
                      },
                      timestamp: { type: 'string', example: '2025-01-25T14:00:00.000Z' }
                    }
                  }
                }
              }
            },
            '400': { description: 'Geçersiz veri formatı' },
            '401': { description: 'Geçersiz API anahtarı' },
            '409': { 
              description: 'Aynı şehirde aynı isimde çalışma alanı zaten mevcut',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: false },
                      error: { type: 'string', example: 'DUPLICATE_WORK_AREA' },
                      message: { type: 'string', example: "Bu şehirde 'Merkez Ofis' isimli çalışma alanı zaten mevcut." }
                    }
                  }
                }
              }
            },
            '429': { description: 'Rate limit aşıldı' }
          }
        }
      },
      '/api/secure/updateWorkArea/{id}': {
        put: {
          summary: 'Çalışma Alanı Güncelle',
          description: 'Mevcut çalışma alanı bilgilerini günceller.',
          tags: ['Veri İşlemleri'],
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'integer' },
              description: 'Güncellenecek çalışma alanının ID\'si'
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    cityId: { type: 'integer', example: 2 },
                    name: { type: 'string', example: 'Güncellenen Ofis' },
                    address: { type: 'string', example: 'Yeni Adres' },
                    managerId: { type: 'integer', example: 2 },
                    startDate: { type: 'string', format: 'date', example: '2025-02-01' },
                    endDate: { type: 'string', format: 'date', example: '2025-11-30' },
                    isActive: { type: 'boolean', example: false }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Çalışma alanı başarıyla güncellendi',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Çalışma alanı başarıyla güncellendi.' },
                      data: {
                        type: 'object',
                        properties: {
                          id: { type: 'integer', example: 1 },
                          cityId: { type: 'integer', example: 2 },
                          name: { type: 'string', example: 'Güncellenen Ofis' },
                          address: { type: 'string', example: 'Yeni Adres' },
                          managerId: { type: 'integer', example: 2 },
                          startDate: { type: 'string', format: 'date', example: '2025-02-01' },
                          endDate: { type: 'string', format: 'date', example: '2025-11-30' },
                          isActive: { type: 'boolean', example: false }
                        }
                      }
                    }
                  }
                }
              }
            },
            '400': { description: 'Geçersiz veri formatı veya ID' },
            '401': { description: 'Geçersiz API anahtarı' },
            '404': { description: 'Çalışma alanı bulunamadı' },
            '409': { description: 'Aynı şehirde aynı isimde çalışma alanı zaten mevcut' },
            '429': { description: 'Rate limit aşıldı' }
          }
        }
      },
      '/api/secure/getDocTypes': {
        get: {
          summary: 'Doküman Türleri API',
          description: 'Sistemde tanımlı doküman türlerinin listesini döndürür. Dosya yükleme işlemleri için kategori bilgisi sağlar.',
          tags: ['Dosya İşlemleri'],
          security: [{ ApiKeyAuth: [] }],
          responses: {
            '200': {
              description: 'Dokuman kategorileri başarıyla getirildi',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Dokuman kategorileri başarıyla getirildi.' },
                      data: {
                        type: 'object',
                        properties: {
                          docTypes: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                id: { type: 'integer', example: 1 },
                                name: { type: 'string', example: 'İnsan Kaynakları' },
                                isActive: { type: 'boolean', example: true },
                                subTypes: {
                                  type: 'array',
                                  items: {
                                    type: 'object',
                                    properties: {
                                      id: { type: 'integer', example: 1 },
                                      name: { type: 'string', example: 'İşe Giriş Bildirgesi' },
                                      isActive: { type: 'boolean', example: true },
                                      mainTypeId: { type: 'integer', example: 1 }
                                    }
                                  }
                                }
                              }
                            }
                          },
                          statistics: {
                            type: 'object',
                            properties: {
                              totalMainTypes: { type: 'integer', example: 5 },
                              totalSubTypes: { type: 'integer', example: 107 },
                              categoriesBreakdown: {
                                type: 'array',
                                items: {
                                  type: 'object',
                                  properties: {
                                    mainType: { type: 'string', example: 'İnsan Kaynakları' },
                                    subTypeCount: { type: 'integer', example: 27 }
                                  }
                                }
                              }
                            }
                          }
                        }
                      },
                      timestamp: { type: 'string', example: '2025-01-25T14:15:00.000Z' }
                    }
                  }
                }
              }
            },
            '401': { description: 'Geçersiz API anahtarı' },
            '403': { description: 'Okuma yetkisi yok' },
            '429': { description: 'Rate limit aşıldı' },
            '500': { description: 'Sunucu hatası' }
          }
        }
      },
      '/api/secure/addPersonnel': {
        post: {
          summary: 'Yeni Personel Ekle',
          description: 'Sisteme yeni personel ekler. TC numarası ile mükerrer kayıt kontrolü yapar.',
          tags: ['Veri İşlemleri'],
          security: [{ ApiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'surname'],
                  properties: {
                    tcNo: { type: 'string', example: '12345678901', description: 'TC Kimlik Numarası (11 haneli)' },
                    name: { type: 'string', example: 'Ahmet' },
                    surname: { type: 'string', example: 'Yılmaz' },
                    birthdate: { type: 'string', format: 'date', example: '1990-01-01' },
                    nationId: { type: 'integer', example: 1, description: 'Ülke ID (countries tablosundan)' },
                    birthplaceId: { type: 'integer', example: 1, description: 'Doğum yeri ID (cities tablosundan)' },
                    address: { type: 'string', example: 'Örnek Mahalle, Örnek Sokak No:1' },
                    phoneNo: { type: 'string', example: '05551234567' },
                    status: { type: 'string', example: 'aktif' },
                    isActive: { type: 'boolean', example: true, default: true }
                  }
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Personel başarıyla eklendi',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Personel başarıyla eklendi.' },
                      data: {
                        type: 'object',
                        properties: {
                          id: { type: 'integer', example: 101 },
                          tcNo: { type: 'string', example: '12345678901' },
                          name: { type: 'string', example: 'Ahmet' },
                          surname: { type: 'string', example: 'Yılmaz' },
                          birthdate: { type: 'string', format: 'date', example: '1990-01-01' },
                          phoneNo: { type: 'string', example: '05551234567' },
                          status: { type: 'string', example: 'aktif' },
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
            '409': { 
              description: 'Aynı TC numaralı personel zaten mevcut',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: false },
                      error: { type: 'string', example: 'DUPLICATE_TC_NUMBER' },
                      message: { type: 'string', example: '12345678901 TC numaralı personel zaten kayıtlı.' },
                      existingPersonnel: {
                        type: 'object',
                        properties: {
                          id: { type: 'integer', example: 50 },
                          name: { type: 'string', example: 'Mehmet' },
                          surname: { type: 'string', example: 'Demir' },
                          tcNo: { type: 'string', example: '12345678901' }
                        }
                      }
                    }
                  }
                }
              }
            },
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
      },
      '/api/secure/documents/upload': {
        post: {
          summary: 'Dosya Yükleme API',
          description: 'Dış uygulamalardan multipart/form-data ile dosya yükleme işlemi. Desteklenen formatlar: PDF, JPG, PNG, DOC, XLS, TXT. Maksimum dosya boyutu: 50MB.',
          tags: ['Dosya İşlemleri'],
          security: [{ ApiKeyAuth: [] }],
          requestBody: {
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['docTypeId', 'files'],
                  properties: {
                    assetId: {
                      type: 'integer',
                      description: 'Asset ID (araç, ekipman vb.) - assetId veya personnelId gerekli',
                      example: 1
                    },
                    personnelId: {
                      type: 'integer',
                      description: 'Personnel ID (personel) - assetId veya personnelId gerekli',
                      example: 1
                    },
                    docTypeId: {
                      type: 'integer', 
                      description: 'Doküman tipi ID (15=Muayene Raporu, 16=Sigorta Poliçesi vb.)',
                      example: 15
                    },
                    description: {
                      type: 'string',
                      description: 'Dosya açıklaması (opsiyonel)',
                      example: 'Araç muayene raporu 2025'
                    },
                    files: {
                      type: 'array',
                      items: {
                        type: 'string',
                        format: 'binary'
                      },
                      description: 'Yüklenecek dosyalar (birden fazla dosya desteklenir)'
                    }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Dosya yükleme başarılı',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: '3 dosya başarıyla yüklendi.' },
                      data: {
                        type: 'object',
                        properties: {
                          uploadedDocuments: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                id: { type: 'integer', example: 123 },
                                fileName: { type: 'string', example: 'muayene_raporu.pdf' },
                                fileSize: { type: 'integer', example: 1024576 },
                                mimeType: { type: 'string', example: 'application/pdf' },
                                fileHash: { type: 'string', example: 'sha256:abc123...' },
                                uploadPath: { type: 'string', example: '/uploads/assets/1/15/file.pdf' }
                              }
                            }
                          },
                          totalFiles: { type: 'integer', example: 3 },
                          successCount: { type: 'integer', example: 3 },
                          duplicateCount: { type: 'integer', example: 0 }
                        }
                      }
                    }
                  }
                }
              }
            },
            '400': {
              description: 'Geçersiz dosya formatı veya boyut',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: false },
                      error: { type: 'string', example: 'INVALID_FILE_TYPE' },
                      message: { type: 'string', example: 'Desteklenmeyen dosya formatı' }
                    }
                  }
                }
              }
            },
            '401': { description: 'Geçersiz API anahtarı veya yetki yok' },
            '413': { description: 'Dosya boyutu çok büyük (>50MB)' },
            '429': { description: 'Rate limit aşıldı' }
          }
        }
      },
      '/api/secure/documents/asset/{assetId}': {
        get: {
          summary: 'Asset Dokümanları Listesi',
          description: 'Belirli bir asset\'e ait tüm dokümanları listeler',
          tags: ['Dosya İşlemleri'],
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            {
              name: 'assetId',
              in: 'path',
              required: true,
              description: 'Asset ID',
              schema: {
                type: 'integer',
                example: 1
              }
            }
          ],
          responses: {
            '200': {
              description: 'Dokümanlar başarıyla getirildi',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Dokümanlar başarıyla getirildi.' },
                      data: {
                        type: 'object',
                        properties: {
                          assetId: { type: 'integer', example: 1 },
                          documents: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                id: { type: 'integer', example: 123 },
                                fileName: { type: 'string', example: 'muayene_raporu.pdf' },
                                docTypeName: { type: 'string', example: 'Muayene Raporu' },
                                fileSize: { type: 'integer', example: 1024576 },
                                uploadDate: { type: 'string', example: '2025-01-25T10:30:00.000Z' },
                                description: { type: 'string', example: 'Yıllık muayene raporu' }
                              }
                            }
                          },
                          totalCount: { type: 'integer', example: 5 }
                        }
                      }
                    }
                  }
                }
              }
            },
            '401': { description: 'Geçersiz API anahtarı' },
            '404': { description: 'Asset bulunamadı' }
          }
        }
      },
      '/api/secure/documents/personnel/{personnelId}': {
        get: {
          summary: 'Personnel Dokümanları Listesi',
          description: 'Belirli bir personele ait tüm dokümanları listeler',
          tags: ['Dosya İşlemleri'],
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            {
              name: 'personnelId',
              in: 'path',
              required: true,
              description: 'Personnel ID',
              schema: {
                type: 'integer',
                example: 1
              }
            }
          ],
          responses: {
            '200': {
              description: 'Personnel dokümanları başarıyla getirildi',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Personnel dokümanları başarıyla getirildi.' },
                      data: {
                        type: 'object',
                        properties: {
                          personnelId: { type: 'integer', example: 1 },
                          documents: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                id: { type: 'integer', example: 123 },
                                fileName: { type: 'string', example: 'cv_document.pdf' },
                                docTypeName: { type: 'string', example: 'CV/Özgeçmiş' },
                                fileSize: { type: 'integer', example: 1024576 },
                                uploadDate: { type: 'string', example: '2025-01-25T10:30:00.000Z' },
                                description: { type: 'string', example: 'Personel özgeçmiş dokümanı' }
                              }
                            }
                          },
                          totalCount: { type: 'integer', example: 3 }
                        }
                      }
                    }
                  }
                }
              }
            },
            '401': { description: 'Geçersiz API anahtarı' },
            '404': { description: 'Personnel bulunamadı' }
          }
        }
      },
      '/api/secure/companies': {
        get: {
          summary: 'Şirketler Listesi',
          description: 'Sistemdeki tüm şirketleri listeler. Filtreleme ve arama destekler.',
          tags: ['Şirket Yönetimi'],
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            {
              name: 'search',
              in: 'query',
              description: 'Şirket adında arama',
              schema: { type: 'string', example: 'Demo' }
            },
            {
              name: 'active',
              in: 'query', 
              description: 'Aktif şirketleri filtrele',
              schema: { type: 'boolean', example: true }
            }
          ],
          responses: {
            '200': {
              description: 'Şirketler başarıyla getirildi',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Şirketler başarıyla getirildi.' },
                      data: {
                        type: 'object',
                        properties: {
                          companies: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                id: { type: 'integer', example: 1 },
                                name: { type: 'string', example: 'Demo Şirket A.Ş.' },
                                taxNo: { type: 'string', example: '1234567890' },
                                taxOffice: { type: 'string', example: 'Beşiktaş Vergi Dairesi' },
                                address: { type: 'string', example: 'İstanbul' },
                                phone: { type: 'string', example: '+90 212 555 0101' },
                                isActive: { type: 'boolean', example: true },
                                cityName: { type: 'string', example: 'İstanbul' },
                                countryName: { type: 'string', example: 'Türkiye' }
                              }
                            }
                          },
                          totalCount: { type: 'integer', example: 5 }
                        }
                      }
                    }
                  }
                }
              }
            },
            '401': { description: 'Geçersiz API anahtarı' }
          }
        },
        post: {
          summary: 'Yeni Şirket Ekleme',
          description: 'Sisteme yeni şirket ekler. Vergi numarası unique olmalıdır.',
          tags: ['Şirket Yönetimi'],
          security: [{ ApiKeyAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'taxNo', 'cityId'],
                  properties: {
                    name: { type: 'string', example: 'Yeni Şirket Ltd.' },
                    taxNo: { type: 'string', example: '9876543210' },
                    taxOffice: { type: 'string', example: 'Kadıköy Vergi Dairesi' },
                    address: { type: 'string', example: 'Kadıköy/İstanbul' },
                    phone: { type: 'string', example: '+90 216 555 0202' },
                    cityId: { type: 'integer', example: 34 }
                  }
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Şirket başarıyla eklendi',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Şirket başarıyla eklendi.' },
                      data: {
                        type: 'object',
                        properties: {
                          id: { type: 'integer', example: 6 },
                          name: { type: 'string', example: 'Yeni Şirket Ltd.' },
                          taxNo: { type: 'string', example: '9876543210' },
                          isActive: { type: 'boolean', example: true }
                        }
                      }
                    }
                  }
                }
              }
            },
            '400': { description: 'Geçersiz veri' },
            '409': { description: 'Vergi numarası zaten kullanımda' }
          }
        }
      },
      '/api/secure/companies/{id}': {
        get: {
          summary: 'Şirket Detayı',
          description: 'Belirli bir şirketin detay bilgilerini getirir',
          tags: ['Şirket Yönetimi'],
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Şirket ID',
              schema: { type: 'integer', example: 1 }
            }
          ],
          responses: {
            '200': {
              description: 'Şirket detayı başarıyla getirildi',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Şirket detayı başarıyla getirildi.' },
                      data: {
                        type: 'object',
                        properties: {
                          id: { type: 'integer', example: 1 },
                          name: { type: 'string', example: 'Demo Şirket A.Ş.' },
                          taxNo: { type: 'string', example: '1234567890' },
                          taxOffice: { type: 'string', example: 'Beşiktaş Vergi Dairesi' },
                          address: { type: 'string', example: 'İstanbul' },
                          phone: { type: 'string', example: '+90 212 555 0101' },
                          isActive: { type: 'boolean', example: true },
                          cityName: { type: 'string', example: 'İstanbul' },
                          countryName: { type: 'string', example: 'Türkiye' }
                        }
                      }
                    }
                  }
                }
              }
            },
            '404': { description: 'Şirket bulunamadı' }
          }
        },
        put: {
          summary: 'Şirket Güncelleme',
          description: 'Mevcut şirket bilgilerini günceller',
          tags: ['Şirket Yönetimi'],
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Şirket ID',
              schema: { type: 'integer', example: 1 }
            }
          ],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', example: 'Güncellenmiş Şirket A.Ş.' },
                    taxOffice: { type: 'string', example: 'Yeni Vergi Dairesi' },
                    address: { type: 'string', example: 'Yeni Adres' },
                    phone: { type: 'string', example: '+90 212 555 0999' },
                    cityId: { type: 'integer', example: 6 },
                    isActive: { type: 'boolean', example: true }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Şirket başarıyla güncellendi',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Şirket başarıyla güncellendi.' }
                    }
                  }
                }
              }
            },
            '404': { description: 'Şirket bulunamadı' }
          }
        },
        delete: {
          summary: 'Şirket Silme (Soft Delete)',
          description: 'Şirketi soft delete ile siler (isActive=false)',
          tags: ['Şirket Yönetimi'],
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Şirket ID',
              schema: { type: 'integer', example: 1 }
            }
          ],
          responses: {
            '200': {
              description: 'Şirket başarıyla silindi',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Şirket başarıyla silindi.' }
                    }
                  }
                }
              }
            },
            '404': { description: 'Şirket bulunamadı' }
          }
        }
      },
      '/api/secure/assets': {
        get: {
          summary: 'Asset/Araç Listesi',
          description: 'Sistemdeki tüm asset\'leri listeler. Filtreleme ve arama destekler.',
          tags: ['Asset Yönetimi'],
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            {
              name: 'search',
              in: 'query',
              description: 'Plaka veya şasi numarasında arama',
              schema: { type: 'string', example: '34ABC123' }
            },
            {
              name: 'active',
              in: 'query',
              description: 'Aktif asset\'leri filtrele',
              schema: { type: 'boolean', example: true }
            },
            {
              name: 'brandId',
              in: 'query',
              description: 'Marka ID ile filtrele',
              schema: { type: 'integer', example: 1 }
            }
          ],
          responses: {
            '200': {
              description: 'Asset\'ler başarıyla getirildi',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Asset\'ler başarıyla getirildi.' },
                      data: {
                        type: 'object',
                        properties: {
                          assets: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                id: { type: 'integer', example: 1 },
                                plateNumber: { type: 'string', example: '34ABC123' },
                                chassisNo: { type: 'string', example: 'CHASSIS123' },
                                engineNo: { type: 'string', example: 'ENGINE123' },
                                modelYear: { type: 'integer', example: 2023 },
                                modelName: { type: 'string', example: 'Actros' },
                                brandName: { type: 'string', example: 'Mercedes-Benz' },
                                typeName: { type: 'string', example: 'Kamyon' },
                                ownershipTypeName: { type: 'string', example: 'Şirket Mülkiyeti' },
                                ownerCompanyName: { type: 'string', example: 'Demo Şirket A.Ş.' },
                                isActive: { type: 'boolean', example: true }
                              }
                            }
                          },
                          totalCount: { type: 'integer', example: 10 }
                        }
                      }
                    }
                  }
                }
              }
            },
            '401': { description: 'Geçersiz API anahtarı' }
          }
        },
        post: {
          summary: 'Yeni Asset Ekleme',
          description: 'Sisteme yeni asset ekler. Plaka numarası unique olmalıdır.',
          tags: ['Asset Yönetimi'],
          security: [{ ApiKeyAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['modelId', 'modelYear', 'plateNumber', 'chassisNo', 'engineNo', 'ownershipTypeId', 'ownerCompanyId'],
                  properties: {
                    modelId: { type: 'integer', example: 6, description: 'Model ID (car_models tablosundan)' },
                    modelYear: { type: 'integer', example: 2023 },
                    plateNumber: { type: 'string', example: '34XYZ999' },
                    chassisNo: { type: 'string', example: 'NEW_CHASSIS_999' },
                    engineNo: { type: 'string', example: 'NEW_ENGINE_999' },
                    ownershipTypeId: { type: 'integer', example: 1 },
                    ownerCompanyId: { type: 'integer', example: 1 },
                    registerNo: { type: 'string', example: 'REG2023999' },
                    registerDate: { type: 'string', format: 'date', example: '2023-01-15' },
                    purchaseDate: { type: 'string', format: 'date', example: '2023-01-10' }
                  }
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Asset başarıyla eklendi',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Asset başarıyla eklendi.' },
                      data: {
                        type: 'object',
                        properties: {
                          id: { type: 'integer', example: 15 },
                          plateNumber: { type: 'string', example: '34XYZ999' },
                          isActive: { type: 'boolean', example: true }
                        }
                      }
                    }
                  }
                }
              }
            },
            '400': { description: 'Geçersiz veri' },
            '409': { description: 'Plaka numarası zaten kullanımda' }
          }
        }
      },
      '/api/secure/assets/{id}': {
        get: {
          summary: 'Asset Detayı',
          description: 'Belirli bir asset\'in detay bilgilerini getirir',
          tags: ['Asset Yönetimi'],
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Asset ID',
              schema: { type: 'integer', example: 1 }
            }
          ],
          responses: {
            '200': {
              description: 'Asset detayı başarıyla getirildi',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Asset detayı başarıyla getirildi.' },
                      data: {
                        type: 'object',
                        properties: {
                          id: { type: 'integer', example: 1 },
                          plateNumber: { type: 'string', example: '34ABC123' },
                          chassisNo: { type: 'string', example: 'CHASSIS123' },
                          engineNo: { type: 'string', example: 'ENGINE123' },
                          modelYear: { type: 'integer', example: 2023 },
                          modelName: { type: 'string', example: 'Actros' },
                          brandName: { type: 'string', example: 'Mercedes-Benz' },
                          typeName: { type: 'string', example: 'Kamyon' },
                          ownershipTypeName: { type: 'string', example: 'Şirket Mülkiyeti' },
                          ownerCompanyName: { type: 'string', example: 'Demo Şirket A.Ş.' },
                          isActive: { type: 'boolean', example: true }
                        }
                      }
                    }
                  }
                }
              }
            },
            '404': { description: 'Asset bulunamadı' }
          }
        },
        put: {
          summary: 'Asset Güncelleme',
          description: 'Mevcut asset bilgilerini günceller',
          tags: ['Asset Yönetimi'],
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Asset ID',
              schema: { type: 'integer', example: 1 }
            }
          ],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    chassisNo: { type: 'string', example: 'UPDATED_CHASSIS_123' },
                    engineNo: { type: 'string', example: 'UPDATED_ENGINE_123' },
                    ownerCompanyId: { type: 'integer', example: 2 },
                    isActive: { type: 'boolean', example: true }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Asset başarıyla güncellendi',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Asset başarıyla güncellendi.' }
                    }
                  }
                }
              }
            },
            '404': { description: 'Asset bulunamadı' }
          }
        },
        delete: {
          summary: 'Asset Silme (Soft Delete)',
          description: 'Asset\'i soft delete ile siler (isActive=false)',
          tags: ['Asset Yönetimi'],
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Asset ID',
              schema: { type: 'integer', example: 1 }
            }
          ],
          responses: {
            '200': {
              description: 'Asset başarıyla silindi',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Asset başarıyla silindi.' }
                    }
                  }
                }
              }
            },
            '404': { description: 'Asset bulunamadı' }
          }
        }
      },
      '/api/getCities': {
        get: {
          summary: 'Şehirler Listesi (Genel)',
          description: 'Türkiye\'deki 81 şehrin listesi. API key gerektirmez.',
          tags: ['Genel API\'ler'],
          responses: {
            '200': {
              description: 'Şehirler başarıyla getirildi',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Şehirler başarıyla getirildi' },
                      data: {
                        type: 'object',
                        properties: {
                          cities: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                id: { type: 'integer', example: 1 },
                                name: { type: 'string', example: 'Adana' }
                              }
                            }
                          },
                          totalCount: { type: 'integer', example: 81 }
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
      '/api/secure/getCarBrands': {
        get: {
          summary: 'Araç Markaları Listesi',
          description: 'Sistemdeki aktif araç markalarının listesini döndürür.',
          tags: ['Marka/Model Yönetimi'],
          security: [{ ApiKeyAuth: [] }],
          responses: {
            '200': {
              description: 'Araç markaları başarıyla getirildi',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Araç markaları başarıyla getirildi.' },
                      data: {
                        type: 'object',
                        properties: {
                          brands: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                id: { type: 'integer', example: 1 },
                                name: { type: 'string', example: 'Mercedes-Benz' },
                                isActive: { type: 'boolean', example: true }
                              }
                            }
                          },
                          totalCount: { type: 'integer', example: 25 }
                        }
                      }
                    }
                  }
                }
              }
            },
            '401': { description: 'Geçersiz API anahtarı' }
          }
        }
      },
      '/api/secure/addCarBrand': {
        post: {
          summary: 'Yeni Araç Markası Ekleme',
          description: 'Sisteme yeni araç markası ekler. Marka adı unique olmalıdır.',
          tags: ['Marka/Model Yönetimi'],
          security: [{ ApiKeyAuth: [] }],
          requestBody: {
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
            '201': {
              description: 'Araç markası başarıyla eklendi',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Araç markası başarıyla eklendi.' },
                      data: {
                        type: 'object',
                        properties: {
                          id: { type: 'integer', example: 26 },
                          name: { type: 'string', example: 'Tesla' },
                          isActive: { type: 'boolean', example: true }
                        }
                      }
                    }
                  }
                }
              }
            },
            '400': { description: 'Geçersiz veri' },
            '409': { description: 'Marka adı zaten kullanımda' }
          }
        }
      },
      '/api/secure/getCarModels': {
        get: {
          summary: 'Araç Modelleri Listesi',
          description: 'Sistemdeki aktif araç modellerinin listesini döndürür. Marka ID ile filtreleme destekler.',
          tags: ['Marka/Model Yönetimi'],
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            {
              name: 'brandId',
              in: 'query',
              description: 'Belirli bir markaya ait modelleri filtrele',
              schema: { type: 'integer', example: 1 }
            }
          ],
          responses: {
            '200': {
              description: 'Araç modelleri başarıyla getirildi',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Araç modelleri başarıyla getirildi.' },
                      data: {
                        type: 'object',
                        properties: {
                          models: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                id: { type: 'integer', example: 6 },
                                brandId: { type: 'integer', example: 1 },
                                name: { type: 'string', example: 'Actros' },
                                typeId: { type: 'integer', example: 8 },
                                capacity: { type: 'integer', example: 40 },
                                detail: { type: 'string', example: 'Ağır tonajlı kamyon' },
                                isActive: { type: 'boolean', example: true },
                                brandName: { type: 'string', example: 'Mercedes-Benz' },
                                typeName: { type: 'string', example: 'Kamyon' }
                              }
                            }
                          },
                          totalCount: { type: 'integer', example: 15 },
                          filters: {
                            type: 'object',
                            properties: {
                              brandId: { type: 'integer', example: 1 }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            '401': { description: 'Geçersiz API anahtarı' }
          }
        }
      },
      '/api/secure/addCarModel': {
        post: {
          summary: 'Yeni Araç Modeli Ekleme',
          description: 'Sisteme yeni araç modeli ekler. Aynı marka altında model adı unique olmalıdır.',
          tags: ['Marka/Model Yönetimi'],
          security: [{ ApiKeyAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['brandId', 'name', 'typeId', 'capacity'],
                  properties: {
                    brandId: { type: 'integer', example: 1, description: 'Marka ID' },
                    name: { type: 'string', example: 'Model S' },
                    typeId: { type: 'integer', example: 3, description: 'Araç tipi ID' },
                    capacity: { type: 'integer', example: 5, description: 'Kapasite' },
                    detail: { type: 'string', example: 'Elektrikli sedan araç' },
                    isActive: { type: 'boolean', example: true }
                  }
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Araç modeli başarıyla eklendi',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Araç modeli başarıyla eklendi.' },
                      data: {
                        type: 'object',
                        properties: {
                          id: { type: 'integer', example: 25 },
                          brandId: { type: 'integer', example: 1 },
                          name: { type: 'string', example: 'Model S' },
                          typeId: { type: 'integer', example: 3 },
                          capacity: { type: 'integer', example: 5 },
                          detail: { type: 'string', example: 'Elektrikli sedan araç' },
                          isActive: { type: 'boolean', example: true },
                          brandName: { type: 'string', example: 'Tesla' },
                          typeName: { type: 'string', example: 'Otomobil' }
                        }
                      }
                    }
                  }
                }
              }
            },
            '400': { description: 'Geçersiz veri veya mevcut olmayan marka/tip ID' },
            '409': { description: 'Aynı marka altında model adı zaten kullanımda' }
          }
        }
      },
      '/api/secure/getCarTypes': {
        get: {
          summary: 'Araç Tipleri Listesi',
          description: 'Sistemdeki aktif araç tiplerinin listesini döndürür. Model ekleme için gereklidir.',
          tags: ['Marka/Model Yönetimi'],
          security: [{ ApiKeyAuth: [] }],
          responses: {
            '200': {
              description: 'Araç tipleri başarıyla getirildi',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Araç tipleri başarıyla getirildi.' },
                      data: {
                        type: 'object',
                        properties: {
                          types: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                id: { type: 'integer', example: 1 },
                                name: { type: 'string', example: 'Otomobil' },
                                isActive: { type: 'boolean', example: true }
                              }
                            }
                          },
                          totalCount: { type: 'integer', example: 50 }
                        }
                      }
                    }
                  }
                }
              }
            },
            '401': { description: 'Geçersiz API anahtarı' }
          }
        }
      },
      '/api/secure/getOwnershipTypes': {
        get: {
          summary: 'Sahiplik Türleri Listesi',
          description: 'Araç sahiplik türlerinin listesini döndürür (Şirket Mülkiyeti, Kiralık, Leasing, vb.).',
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
                      message: { type: 'string', example: 'Sahiplik türleri başarıyla getirildi.' },
                      data: {
                        type: 'object',
                        properties: {
                          ownershipTypes: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                id: { type: 'integer', example: 1 },
                                name: { type: 'string', example: 'Şirket Mülkiyeti' },
                                isActive: { type: 'boolean', example: true }
                              }
                            }
                          },
                          totalCount: { type: 'integer', example: 4 }
                        }
                      }
                    }
                  }
                }
              }
            },
            '401': { description: 'Geçersiz API anahtarı' }
          }
        }
      },
      '/api/secure/addOwnershipType': {
        post: {
          summary: 'Yeni Sahiplik Türü Ekleme',
          description: 'Sisteme yeni sahiplik türü ekler. Aynı isimde tür kontrolü yapar.',
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
                    name: { type: 'string', example: 'Operasyonel Kiralama', description: 'Sahiplik türü adı' },
                    isActive: { type: 'boolean', example: true, default: true }
                  }
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Sahiplik türü başarıyla eklendi',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Sahiplik türü başarıyla eklendi.' },
                      data: {
                        type: 'object',
                        properties: {
                          id: { type: 'integer', example: 5 },
                          name: { type: 'string', example: 'Operasyonel Kiralama' },
                          isActive: { type: 'boolean', example: true }
                        }
                      }
                    }
                  }
                }
              }
            },
            '400': { description: 'Geçersiz veri formatı' },
            '409': { 
              description: 'Aynı isimde sahiplik türü zaten mevcut',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: false },
                      error: { type: 'string', example: 'DUPLICATE_OWNERSHIP_TYPE' },
                      message: { type: 'string', example: 'Bu isimde sahiplik türü zaten mevcut.' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/secure/getPersonnelPositions': {
        get: {
          summary: 'Personel Pozisyonları Listesi',
          description: 'Sistemde tanımlı personel pozisyonlarının listesini döndürür (Filo Yöneticisi, Şoför, vb.).',
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
                      message: { type: 'string', example: 'Personel pozisyonları başarıyla getirildi.' },
                      data: {
                        type: 'object',
                        properties: {
                          positions: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                id: { type: 'integer', example: 1 },
                                name: { type: 'string', example: 'Filo Yöneticisi' },
                                description: { type: 'string', example: 'Araç filosunu yöneten ve operasyonları denetleyen personel' },
                                isActive: { type: 'boolean', example: true }
                              }
                            }
                          },
                          totalCount: { type: 'integer', example: 8 }
                        }
                      }
                    }
                  }
                }
              }
            },
            '401': { description: 'Geçersiz API anahtarı' }
          }
        }
      },
      '/api/secure/addPersonnelPosition': {
        post: {
          summary: 'Yeni Personel Pozisyonu Ekleme',
          description: 'Sisteme yeni personel pozisyonu ekler. Aynı isimde pozisyon kontrolü yapar.',
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
                    name: { type: 'string', example: 'Araç Bakım Teknisyeni', description: 'Pozisyon adı' },
                    description: { type: 'string', example: 'Araç bakım ve onarım işlemlerinden sorumlu teknik personel' },
                    isActive: { type: 'boolean', example: true, default: true }
                  }
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Personel pozisyonu başarıyla eklendi',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Personel pozisyonu başarıyla eklendi.' },
                      data: {
                        type: 'object',
                        properties: {
                          id: { type: 'integer', example: 9 },
                          name: { type: 'string', example: 'Araç Bakım Teknisyeni' },
                          description: { type: 'string', example: 'Araç bakım ve onarım işlemlerinden sorumlu teknik personel' },
                          isActive: { type: 'boolean', example: true }
                        }
                      }
                    }
                  }
                }
              }
            },
            '400': { description: 'Geçersiz veri formatı' },
            '409': { 
              description: 'Aynı isimde personel pozisyonu zaten mevcut',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: false },
                      error: { type: 'string', example: 'DUPLICATE_PERSONNEL_POSITION' },
                      message: { type: 'string', example: 'Bu isimde personel pozisyonu zaten mevcut.' }
                    }
                  }
                }
              }
            }
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
      },
      {
        name: 'Dosya İşlemleri',
        description: 'Dosya yükleme, listeleme ve doküman yönetimi API\'leri'
      },
      {
        name: 'Şirket Yönetimi',
        description: 'Şirket bilgileri yönetimi - ekleme, güncelleme, listeleme, silme'
      },
      {
        name: 'Asset Yönetimi',
        description: 'Araç ve asset yönetimi - ekleme, güncelleme, listeleme, silme'
      },
      {
        name: 'Genel API\'ler',
        description: 'API anahtarı gerektirmeyen genel API\'ler'
      },
      {
        name: 'Marka/Model Yönetimi',
        description: 'Araç marka ve model yönetimi - ekleme, listeleme'
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

  // POST endpoint - Bakım türü ekleme
  app.post(
    "/api/secure/addMaintenanceType",
    authenticateApiKey,
    logApiRequest,
    rateLimitMiddleware(30),
    authorizeEndpoint(['data:write', 'asset:write']),
    async (req: ApiRequest, res) => {
      try {
        // Request body'yi validate et
        const validatedData = insertMaintenanceTypeSchema.parse(req.body);
        
        // Aynı isimde bakım türü var mı kontrol et
        const existing = await db
          .select()
          .from(maintenanceTypes)
          .where(eq(maintenanceTypes.name, validatedData.name))
          .limit(1);

        if (existing.length > 0) {
          return res.status(409).json({
            success: false,
            error: 'DUPLICATE_MAINTENANCE_TYPE',
            message: `'${validatedData.name}' isimli bakım türü zaten mevcut.`,
            existingMaintenanceType: {
              id: existing[0].id,
              name: existing[0].name
            },
            timestamp: new Date().toISOString()
          });
        }

        // Yeni bakım türü ekle
        const [insertedMaintenanceType] = await db.insert(maintenanceTypes)
          .values(validatedData)
          .returning({
            id: maintenanceTypes.id,
            name: maintenanceTypes.name,
            isActive: maintenanceTypes.isActive
          });

        res.status(201).json({
          success: true,
          message: 'Bakım türü başarıyla eklendi.',
          data: insertedMaintenanceType,
          clientInfo: {
            id: req.apiClient?.id,
            name: req.apiClient?.name,
            companyId: req.apiClient?.companyId
          },
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('Bakım türü ekleme hatası:', error);
        if (error instanceof z.ZodError) {
          return res.status(400).json({
            success: false,
            error: 'VALIDATION_ERROR',
            message: 'Geçersiz veri formatı.',
            details: error.errors,
            timestamp: new Date().toISOString()
          });
        }
        res.status(500).json({
          success: false,
          error: 'SERVER_ERROR',
          message: 'Bakım türü eklenirken sunucu hatası oluştu.',
          timestamp: new Date().toISOString()
        });
      }
    }
  );

  // POST endpoint - Personel ekleme
  app.post(
    "/api/secure/addPersonnel",
    authenticateApiKey,
    logApiRequest,
    rateLimitMiddleware(20),
    authorizeEndpoint(['data:write']),
    async (req: ApiRequest, res) => {
      try {
        // API için özel personnel schema - TC numarasını string olarak kabul et
        const apiPersonnelSchema = z.object({
          tcNo: z.string().optional().transform((val) => val ? BigInt(val) : undefined),
          name: z.string(),
          surname: z.string(),
          birthdate: z.string().optional(),
          nationId: z.number().optional(),
          birthplaceId: z.number().optional(),
          address: z.string().optional(),
          phoneNo: z.string().optional(),
          status: z.string().optional(),
          isActive: z.boolean().optional().default(true)
        });
        
        const validatedData = apiPersonnelSchema.parse(req.body);
        
        // TC numarası kontrolü - aynı TC numarasında personel var mı kontrol et
        if (validatedData.tcNo) {
          const existingPersonnel = await db
            .select()
            .from(personnel)
            .where(eq(personnel.tcNo, validatedData.tcNo))
            .limit(1);

          if (existingPersonnel.length > 0) {
            return res.status(409).json({
              success: false,
              error: 'DUPLICATE_TC_NUMBER',
              message: `${validatedData.tcNo} TC numaralı personel zaten kayıtlı.`,
              existingPersonnel: {
                id: existingPersonnel[0].id,
                name: existingPersonnel[0].name,
                surname: existingPersonnel[0].surname,
                tcNo: existingPersonnel[0].tcNo?.toString()
              },
              timestamp: new Date().toISOString()
            });
          }
        }

        // Yeni personel ekle
        const [insertedPersonnel] = await db.insert(personnel)
          .values(validatedData)
          .returning({
            id: personnel.id,
            tcNo: personnel.tcNo,
            name: personnel.name,
            surname: personnel.surname,
            birthdate: personnel.birthdate,
            phoneNo: personnel.phoneNo,
            status: personnel.status,
            isActive: personnel.isActive
          });

        res.status(201).json({
          success: true,
          message: 'Personel başarıyla eklendi.',
          data: {
            ...insertedPersonnel,
            tcNo: insertedPersonnel.tcNo?.toString() // BigInt'i string'e çevir
          },
          clientInfo: {
            id: req.apiClient?.id,
            name: req.apiClient?.name,
            companyId: req.apiClient?.companyId
          },
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('Personel ekleme hatası:', error);
        if (error instanceof z.ZodError) {
          return res.status(400).json({
            success: false,
            error: 'VALIDATION_ERROR',
            message: 'Geçersiz veri formatı.',
            details: error.errors,
            timestamp: new Date().toISOString()
          });
        }
        res.status(500).json({
          success: false,
          error: 'SERVER_ERROR',
          message: 'Personel eklenirken sunucu hatası oluştu.',
          timestamp: new Date().toISOString()
        });
      }
    }
  );

  // POST endpoint - Çalışma alanı ekleme
  app.post(
    "/api/secure/addWorkArea",
    authenticateApiKey,
    logApiRequest,
    rateLimitMiddleware(20),
    authorizeEndpoint(['data:write']),
    async (req: ApiRequest, res) => {
      try {
        // API için özel workArea schema - date alanlarını string olarak kabul et
        const apiWorkAreaSchema = z.object({
          cityId: z.number(),
          name: z.string(),
          address: z.string().optional(),
          managerId: z.number().optional(),
          startDate: z.string(),
          endDate: z.string().optional(),
          isActive: z.boolean().optional().default(true)
        });
        
        const validatedData = apiWorkAreaSchema.parse(req.body);
        
        // İsim kontrolü - aynı şehirde aynı isimde çalışma alanı var mı kontrol et
        const existingWorkArea = await db
          .select()
          .from(workAreas)
          .where(and(
            eq(workAreas.name, validatedData.name),
            eq(workAreas.cityId, validatedData.cityId)
          ))
          .limit(1);

        if (existingWorkArea.length > 0) {
          return res.status(409).json({
            success: false,
            error: 'DUPLICATE_WORK_AREA',
            message: `Bu şehirde '${validatedData.name}' isimli çalışma alanı zaten mevcut.`,
            existingWorkArea: {
              id: existingWorkArea[0].id,
              name: existingWorkArea[0].name,
              cityId: existingWorkArea[0].cityId
            },
            timestamp: new Date().toISOString()
          });
        }

        // Yeni çalışma alanı ekle
        const [insertedWorkArea] = await db.insert(workAreas)
          .values(validatedData)
          .returning({
            id: workAreas.id,
            cityId: workAreas.cityId,
            name: workAreas.name,
            address: workAreas.address,
            managerId: workAreas.managerId,
            startDate: workAreas.startDate,
            endDate: workAreas.endDate,
            isActive: workAreas.isActive
          });

        res.status(201).json({
          success: true,
          message: 'Çalışma alanı başarıyla eklendi.',
          data: insertedWorkArea,
          clientInfo: {
            id: req.apiClient?.id,
            name: req.apiClient?.name,
            companyId: req.apiClient?.companyId
          },
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('Çalışma alanı ekleme hatası:', error);
        if (error instanceof z.ZodError) {
          return res.status(400).json({
            success: false,
            error: 'VALIDATION_ERROR',
            message: 'Geçersiz veri formatı.',
            details: error.errors,
            timestamp: new Date().toISOString()
          });
        }
        res.status(500).json({
          success: false,
          error: 'SERVER_ERROR',
          message: 'Çalışma alanı eklenirken sunucu hatası oluştu.',
          timestamp: new Date().toISOString()
        });
      }
    }
  );

  // PUT endpoint - Çalışma alanı güncelleme
  app.put(
    "/api/secure/updateWorkArea/:id",
    authenticateApiKey,
    logApiRequest,
    rateLimitMiddleware(20),
    authorizeEndpoint(['data:write']),
    async (req: ApiRequest, res) => {
      try {
        const workAreaId = parseInt(req.params.id);
        
        if (isNaN(workAreaId)) {
          return res.status(400).json({
            success: false,
            error: 'INVALID_ID',
            message: 'Geçersiz çalışma alanı ID.',
            timestamp: new Date().toISOString()
          });
        }

        // API için partial update schema
        const apiUpdateWorkAreaSchema = z.object({
          cityId: z.number().optional(),
          name: z.string().optional(),
          address: z.string().optional(),
          managerId: z.number().optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          isActive: z.boolean().optional()
        });
        
        const validatedData = apiUpdateWorkAreaSchema.parse(req.body);

        // Çalışma alanının var olup olmadığını kontrol et
        const existingWorkArea = await db.select({
          id: workAreas.id,
          name: workAreas.name,
          cityId: workAreas.cityId
        }).from(workAreas)
          .where(eq(workAreas.id, workAreaId))
          .limit(1);

        if (existingWorkArea.length === 0) {
          return res.status(404).json({
            success: false,
            error: 'WORK_AREA_NOT_FOUND',
            message: 'Güncellenecek çalışma alanı bulunamadı.',
            timestamp: new Date().toISOString()
          });
        }

        // İsim ve şehir değiştiriliyorsa mükerrer kontrol yap
        if (validatedData.name || validatedData.cityId) {
          const newName = validatedData.name || existingWorkArea[0].name;
          const newCityId = validatedData.cityId || existingWorkArea[0].cityId;
          
          const duplicateCheck = await db.select({
            id: workAreas.id,
            name: workAreas.name
          }).from(workAreas)
            .where(and(
              eq(workAreas.name, newName),
              eq(workAreas.cityId, newCityId),
              not(eq(workAreas.id, workAreaId))
            ))
            .limit(1);

          if (duplicateCheck.length > 0) {
            return res.status(409).json({
              success: false,
              error: "DUPLICATE_WORK_AREA",
              message: `Bu şehirde '${newName}' isimli başka bir çalışma alanı zaten mevcut.`,
              existingWorkArea: duplicateCheck[0],
              timestamp: new Date().toISOString()
            });
          }
        }

        // Çalışma alanını güncelle
        const [updatedWorkArea] = await db.update(workAreas)
          .set(validatedData)
          .where(eq(workAreas.id, workAreaId))
          .returning({
            id: workAreas.id,
            cityId: workAreas.cityId,
            name: workAreas.name,
            address: workAreas.address,
            managerId: workAreas.managerId,
            startDate: workAreas.startDate,
            endDate: workAreas.endDate,
            isActive: workAreas.isActive
          });

        res.json({
          success: true,
          message: "Çalışma alanı başarıyla güncellendi.",
          data: updatedWorkArea,
          clientInfo: {
            id: req.apiClient?.id,
            name: req.apiClient?.name,
            companyId: req.apiClient?.companyId
          },
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error("Çalışma alanı güncelleme hatası:", error);
        
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
          message: "Çalışma alanı güncellenirken sunucu hatası oluştu.",
          timestamp: new Date().toISOString()
        });
      }
    }
  );

  // GET endpoint - Dokuman kategorileri listeleme
  app.get(
    "/api/secure/getDocTypes",
    authenticateApiKey,
    logApiRequest,
    rateLimitMiddleware(100),
    authorizeEndpoint(['data:read']),
    async (req: ApiRequest, res) => {
      try {
        // Ana kategorileri ve alt kategorilerini join ile çek
        const docTypesData = await db
          .select({
            mainTypeId: docMainTypes.id,
            mainTypeName: docMainTypes.name,
            mainTypeActive: docMainTypes.isActive,
            subTypeId: docSubTypes.id,
            subTypeName: docSubTypes.name,
            subTypeActive: docSubTypes.isActive
          })
          .from(docMainTypes)
          .leftJoin(docSubTypes, eq(docMainTypes.id, docSubTypes.mainTypeId))
          .where(eq(docMainTypes.isActive, true))
          .orderBy(docMainTypes.id, docSubTypes.id);

        // Veriyi hiyerarşik yapıya dönüştür
        const docTypesHierarchy = docTypesData.reduce((acc, row) => {
          // Ana kategoriyi bul veya oluştur
          let mainCategory = acc.find(cat => cat.id === row.mainTypeId);
          if (!mainCategory) {
            mainCategory = {
              id: row.mainTypeId,
              name: row.mainTypeName,
              isActive: row.mainTypeActive,
              subTypes: []
            };
            acc.push(mainCategory);
          }

          // Alt kategori varsa ekle
          if (row.subTypeId && row.subTypeName && row.subTypeActive) {
            mainCategory.subTypes.push({
              id: row.subTypeId,
              name: row.subTypeName,
              isActive: row.subTypeActive,
              mainTypeId: row.mainTypeId
            });
          }

          return acc;
        }, [] as Array<{
          id: number;
          name: string;
          isActive: boolean;
          subTypes: Array<{
            id: number;
            name: string;
            isActive: boolean;
            mainTypeId: number;
          }>;
        }>);

        // İstatistikleri hesapla
        const stats = {
          totalMainTypes: docTypesHierarchy.length,
          totalSubTypes: docTypesHierarchy.reduce((sum, main) => sum + main.subTypes.length, 0),
          categoriesBreakdown: docTypesHierarchy.map(main => ({
            mainType: main.name,
            subTypeCount: main.subTypes.length
          }))
        };

        res.json({
          success: true,
          message: 'Dokuman kategorileri başarıyla getirildi.',
          data: {
            docTypes: docTypesHierarchy,
            statistics: stats
          },
          clientInfo: {
            id: req.apiClient?.id,
            name: req.apiClient?.name,
            companyId: req.apiClient?.companyId
          },
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('Dokuman kategorileri getirme hatası:', error);
        res.status(500).json({
          success: false,
          error: 'SERVER_ERROR',
          message: 'Dokuman kategorileri getirilirken sunucu hatası oluştu.',
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

  // ========================
  // MARKA VE MODEL API'LERİ
  // ========================

  // GET endpoint - Car Brands listesi
  app.get(
    "/api/secure/getCarBrands",
    authenticateApiKey,
    logApiRequest,
    rateLimitMiddleware(100),
    authorizeEndpoint(['data:read']),
    async (req: ApiRequest, res) => {
      try {
        const brandsList = await db.select({
          id: carBrands.id,
          name: carBrands.name,
          isActive: carBrands.isActive
        }).from(carBrands)
          .where(eq(carBrands.isActive, true))
          .orderBy(carBrands.name);
        
        res.json({
          success: true,
          message: "Araç markaları başarıyla getirildi.",
          data: {
            brands: brandsList,
            totalCount: brandsList.length
          },
          clientInfo: {
            id: req.apiClient?.id,
            name: req.apiClient?.name,
            companyId: req.apiClient?.companyId
          },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error("Car brands getirme hatası:", error);
        res.status(500).json({
          success: false,
          error: "CAR_BRANDS_FETCH_ERROR",
          message: "Araç markaları alınırken bir hata oluştu."
        });
      }
    }
  );

  // POST endpoint - Car Brand ekleme
  app.post(
    "/api/secure/addCarBrand",
    authenticateApiKey,
    logApiRequest,
    rateLimitMiddleware(20),
    authorizeEndpoint(['data:write']),
    async (req: ApiRequest, res) => {
      try {
        const validatedData = insertCarBrandSchema.parse(req.body);
        
        // Aynı isimde marka var mı kontrol et
        const existing = await db
          .select()
          .from(carBrands)
          .where(eq(carBrands.name, validatedData.name))
          .limit(1);

        if (existing.length > 0) {
          return res.status(409).json({
            success: false,
            error: 'DUPLICATE_CAR_BRAND',
            message: `'${validatedData.name}' isimli araç markası zaten mevcut.`,
            existingBrand: {
              id: existing[0].id,
              name: existing[0].name,
              isActive: existing[0].isActive
            },
            timestamp: new Date().toISOString()
          });
        }

        // Yeni marka ekle
        const [insertedBrand] = await db.insert(carBrands)
          .values(validatedData)
          .returning({
            id: carBrands.id,
            name: carBrands.name,
            isActive: carBrands.isActive
          });

        res.status(201).json({
          success: true,
          message: 'Araç markası başarıyla eklendi.',
          data: insertedBrand,
          clientInfo: {
            id: req.apiClient?.id,
            name: req.apiClient?.name,
            companyId: req.apiClient?.companyId
          },
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('Car brand ekleme hatası:', error);
        if (error instanceof z.ZodError) {
          return res.status(400).json({
            success: false,
            error: 'VALIDATION_ERROR',
            message: 'Geçersiz veri formatı.',
            details: error.errors,
            timestamp: new Date().toISOString()
          });
        }
        res.status(500).json({
          success: false,
          error: 'SERVER_ERROR',
          message: 'Araç markası eklenirken sunucu hatası oluştu.',
          timestamp: new Date().toISOString()
        });
      }
    }
  );

  // GET endpoint - Car Models listesi (marka ID ile filtreleme destekler)
  app.get(
    "/api/secure/getCarModels",
    authenticateApiKey,
    logApiRequest,
    rateLimitMiddleware(100),
    authorizeEndpoint(['data:read']),
    async (req: ApiRequest, res) => {
      try {
        const { brandId } = req.query;
        
        let query = db.select({
          id: carModels.id,
          brandId: carModels.brandId,
          name: carModels.name,
          typeId: carModels.typeId,
          capacity: carModels.capacity,
          detail: carModels.detail,
          isActive: carModels.isActive,
          brandName: carBrands.name,
          typeName: carTypes.name
        }).from(carModels)
          .leftJoin(carBrands, eq(carModels.brandId, carBrands.id))
          .leftJoin(carTypes, eq(carModels.typeId, carTypes.id))
          .where(eq(carModels.isActive, true));

        // Brand ID ile filtreleme - where clause'u overwrite etmek yerine and condition ekle
        if (brandId && !isNaN(parseInt(brandId as string))) {
          query = db.select({
            id: carModels.id,
            brandId: carModels.brandId,
            name: carModels.name,
            typeId: carModels.typeId,
            capacity: carModels.capacity,
            detail: carModels.detail,
            isActive: carModels.isActive,
            brandName: carBrands.name,
            typeName: carTypes.name
          }).from(carModels)
            .leftJoin(carBrands, eq(carModels.brandId, carBrands.id))
            .leftJoin(carTypes, eq(carModels.typeId, carTypes.id))
            .where(and(
              eq(carModels.isActive, true),
              eq(carModels.brandId, parseInt(brandId as string))
            ));
        }

        const modelsList = await query.orderBy(carBrands.name, carModels.name);
        
        res.json({
          success: true,
          message: "Araç modelleri başarıyla getirildi.",
          data: {
            models: modelsList,
            totalCount: modelsList.length,
            filters: {
              brandId: brandId ? parseInt(brandId as string) : null
            }
          },
          clientInfo: {
            id: req.apiClient?.id,
            name: req.apiClient?.name,
            companyId: req.apiClient?.companyId
          },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error("Car models getirme hatası:", error);
        res.status(500).json({
          success: false,
          error: "CAR_MODELS_FETCH_ERROR",
          message: "Araç modelleri alınırken bir hata oluştu."
        });
      }
    }
  );

  // POST endpoint - Car Model ekleme
  app.post(
    "/api/secure/addCarModel",
    authenticateApiKey,
    logApiRequest,
    rateLimitMiddleware(20),
    authorizeEndpoint(['data:write']),
    async (req: ApiRequest, res) => {
      try {
        const validatedData = insertCarModelSchema.parse(req.body);
        
        // Aynı marka ve isimde model var mı kontrol et
        const existing = await db
          .select()
          .from(carModels)
          .where(and(
            eq(carModels.brandId, validatedData.brandId),
            eq(carModels.name, validatedData.name)
          ))
          .limit(1);

        if (existing.length > 0) {
          // Brand adını al
          const [brand] = await db.select({ name: carBrands.name })
            .from(carBrands)
            .where(eq(carBrands.id, validatedData.brandId))
            .limit(1);

          return res.status(409).json({
            success: false,
            error: 'DUPLICATE_CAR_MODEL',
            message: `'${brand?.name || 'Bilinmeyen marka'}' markasında '${validatedData.name}' isimli model zaten mevcut.`,
            existingModel: {
              id: existing[0].id,
              brandId: existing[0].brandId,
              name: existing[0].name,
              isActive: existing[0].isActive
            },
            timestamp: new Date().toISOString()
          });
        }

        // Brand ve Type kontrolü
        const [brand] = await db.select({ name: carBrands.name })
          .from(carBrands)
          .where(eq(carBrands.id, validatedData.brandId))
          .limit(1);

        const [type] = await db.select({ name: carTypes.name })
          .from(carTypes)
          .where(eq(carTypes.id, validatedData.typeId))
          .limit(1);

        if (!brand) {
          return res.status(400).json({
            success: false,
            error: 'INVALID_BRAND_ID',
            message: 'Geçersiz marka ID.',
            timestamp: new Date().toISOString()
          });
        }

        if (!type) {
          return res.status(400).json({
            success: false,
            error: 'INVALID_TYPE_ID',
            message: 'Geçersiz araç tipi ID.',
            timestamp: new Date().toISOString()
          });
        }

        // Yeni model ekle
        const [insertedModel] = await db.insert(carModels)
          .values(validatedData)
          .returning({
            id: carModels.id,
            brandId: carModels.brandId,
            name: carModels.name,
            typeId: carModels.typeId,
            capacity: carModels.capacity,
            detail: carModels.detail,
            isActive: carModels.isActive
          });

        res.status(201).json({
          success: true,
          message: 'Araç modeli başarıyla eklendi.',
          data: {
            ...insertedModel,
            brandName: brand.name,
            typeName: type.name
          },
          clientInfo: {
            id: req.apiClient?.id,
            name: req.apiClient?.name,
            companyId: req.apiClient?.companyId
          },
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('Car model ekleme hatası:', error);
        if (error instanceof z.ZodError) {
          return res.status(400).json({
            success: false,
            error: 'VALIDATION_ERROR',
            message: 'Geçersiz veri formatı.',
            details: error.errors,
            timestamp: new Date().toISOString()
          });
        }
        res.status(500).json({
          success: false,
          error: 'SERVER_ERROR',
          message: 'Araç modeli eklenirken sunucu hatası oluştu.',
          timestamp: new Date().toISOString()
        });
      }
    }
  );

  // GET endpoint - Car Types listesi (model ekleme için gerekli)
  app.get(
    "/api/secure/getCarTypes",
    authenticateApiKey,
    logApiRequest,
    rateLimitMiddleware(100),
    authorizeEndpoint(['data:read']),
    async (req: ApiRequest, res) => {
      try {
        const typesList = await db.select({
          id: carTypes.id,
          name: carTypes.name,
          isActive: carTypes.isActive
        }).from(carTypes)
          .where(eq(carTypes.isActive, true))
          .orderBy(carTypes.name);
        
        res.json({
          success: true,
          message: "Araç tipleri başarıyla getirildi.",
          data: {
            types: typesList,
            totalCount: typesList.length
          },
          clientInfo: {
            id: req.apiClient?.id,
            name: req.apiClient?.name,
            companyId: req.apiClient?.companyId
          },
          timestamp: new Date().toISOString()
        });


      } catch (error) {
        console.error("Car types getirme hatası:", error);
        res.status(500).json({
          success: false,
          error: "CAR_TYPES_FETCH_ERROR",
          message: "Araç tipleri alınırken bir hata oluştu."
        });
      }
    }
  );

  // ========================
  // OWNERSHIP TYPES CRUD API'LERİ
  // ========================

  // GET endpoint - Ownership Types listesi
  app.get(
    "/api/secure/getOwnershipTypes",
    authenticateApiKey,
    logApiRequest,
    rateLimitMiddleware(100),
    authorizeEndpoint(['data:read']),
    async (req: ApiRequest, res) => {
      try {
        const ownershipTypesList = await db.select({
          id: ownershipTypes.id,
          name: ownershipTypes.name,
          isActive: ownershipTypes.isActive
        }).from(ownershipTypes)
          .where(eq(ownershipTypes.isActive, true))
          .orderBy(ownershipTypes.name);
        
        res.json({
          success: true,
          message: "Sahiplik türleri başarıyla getirildi.",
          data: {
            ownershipTypes: ownershipTypesList,
            totalCount: ownershipTypesList.length
          },
          clientInfo: {
            id: req.apiClient?.id,
            name: req.apiClient?.name,
            companyId: req.apiClient?.companyId
          },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error("Ownership types getirme hatası:", error);
        res.status(500).json({
          success: false,
          error: "OWNERSHIP_TYPES_FETCH_ERROR",
          message: "Sahiplik türleri alınırken bir hata oluştu."
        });
      }
    }
  );

  // POST endpoint - Ownership Type ekleme
  app.post(
    "/api/secure/addOwnershipType",
    authenticateApiKey,
    logApiRequest,
    rateLimitMiddleware(20),
    authorizeEndpoint(['data:write']),
    async (req: ApiRequest, res) => {
      try {
        const validatedData = insertOwnershipTypeSchema.parse(req.body);
        
        // Aynı isimde sahiplik türü var mı kontrol et
        const existing = await db
          .select()
          .from(ownershipTypes)
          .where(eq(ownershipTypes.name, validatedData.name))
          .limit(1);

        if (existing.length > 0) {
          return res.status(409).json({
            success: false,
            error: 'DUPLICATE_OWNERSHIP_TYPE',
            message: `'${validatedData.name}' isimli sahiplik türü zaten mevcut.`,
            existingOwnershipType: {
              id: existing[0].id,
              name: existing[0].name,
              isActive: existing[0].isActive
            },
            timestamp: new Date().toISOString()
          });
        }

        // Yeni sahiplik türü ekle
        const [insertedOwnershipType] = await db.insert(ownershipTypes)
          .values(validatedData)
          .returning({
            id: ownershipTypes.id,
            name: ownershipTypes.name,
            isActive: ownershipTypes.isActive
          });

        res.status(201).json({
          success: true,
          message: 'Sahiplik türü başarıyla eklendi.',
          data: insertedOwnershipType,
          clientInfo: {
            id: req.apiClient?.id,
            name: req.apiClient?.name,
            companyId: req.apiClient?.companyId
          },
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('Ownership type ekleme hatası:', error);
        if (error instanceof z.ZodError) {
          return res.status(400).json({
            success: false,
            error: 'VALIDATION_ERROR',
            message: 'Geçersiz veri formatı.',
            details: error.errors,
            timestamp: new Date().toISOString()
          });
        }
        res.status(500).json({
          success: false,
          error: 'SERVER_ERROR',
          message: 'Sahiplik türü eklenirken sunucu hatası oluştu.',
          timestamp: new Date().toISOString()
        });
      }
    }
  );

  // ========================
  // PERSONNEL POSITIONS CRUD API'LERİ  
  // ========================

  // GET endpoint - Personnel Positions listesi
  app.get(
    "/api/secure/getPersonnelPositions",
    authenticateApiKey,
    logApiRequest,
    rateLimitMiddleware(100),
    authorizeEndpoint(['data:read']),
    async (req: ApiRequest, res) => {
      try {
        const positionsList = await db.select({
          id: personnelPositions.id,
          name: personnelPositions.name,
          description: personnelPositions.description,
          isActive: personnelPositions.isActive
        }).from(personnelPositions)
          .where(eq(personnelPositions.isActive, true))
          .orderBy(personnelPositions.name);
        
        res.json({
          success: true,
          message: "Personel pozisyonları başarıyla getirildi.",
          data: {
            positions: positionsList,
            totalCount: positionsList.length
          },
          clientInfo: {
            id: req.apiClient?.id,
            name: req.apiClient?.name,
            companyId: req.apiClient?.companyId
          },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error("Personnel positions getirme hatası:", error);
        res.status(500).json({
          success: false,
          error: "PERSONNEL_POSITIONS_FETCH_ERROR",
          message: "Personel pozisyonları alınırken bir hata oluştu."
        });
      }
    }
  );

  // POST endpoint - Personnel Position ekleme
  app.post(
    "/api/secure/addPersonnelPosition",
    authenticateApiKey,
    logApiRequest,
    rateLimitMiddleware(20),
    authorizeEndpoint(['data:write']),
    async (req: ApiRequest, res) => {
      try {
        const validatedData = insertPersonnelPositionSchema.parse(req.body);
        
        // Aynı isimde pozisyon var mı kontrol et
        const existing = await db
          .select()
          .from(personnelPositions)
          .where(eq(personnelPositions.name, validatedData.name))
          .limit(1);

        if (existing.length > 0) {
          return res.status(409).json({
            success: false,
            error: 'DUPLICATE_PERSONNEL_POSITION',
            message: `'${validatedData.name}' isimli personel pozisyonu zaten mevcut.`,
            existingPosition: {
              id: existing[0].id,
              name: existing[0].name,
              description: existing[0].description,
              isActive: existing[0].isActive
            },
            timestamp: new Date().toISOString()
          });
        }

        // Yeni pozisyon ekle
        const [insertedPosition] = await db.insert(personnelPositions)
          .values(validatedData)
          .returning({
            id: personnelPositions.id,
            name: personnelPositions.name,
            description: personnelPositions.description,
            isActive: personnelPositions.isActive
          });

        res.status(201).json({
          success: true,
          message: 'Personel pozisyonu başarıyla eklendi.',
          data: insertedPosition,
          clientInfo: {
            id: req.apiClient?.id,
            name: req.apiClient?.name,
            companyId: req.apiClient?.companyId
          },
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('Personnel position ekleme hatası:', error);
        if (error instanceof z.ZodError) {
          return res.status(400).json({
            success: false,
            error: 'VALIDATION_ERROR',
            message: 'Geçersiz veri formatı.',
            details: error.errors,
            timestamp: new Date().toISOString()
          });
        }
        res.status(500).json({
          success: false,
          error: 'SERVER_ERROR',
          message: 'Personel pozisyonu eklenirken sunucu hatası oluştu.',
          timestamp: new Date().toISOString()
        });
      }
    }
  );

  // ========================
  // ASSETS PERSONNEL ASSIGNMENT CRUD API
  // ========================

  // GET /api/secure/getAssetsPersonnelAssignments
  app.get("/api/secure/getAssetsPersonnelAssignments", 
    authenticateApiKey,
    authorizeEndpoint(["data:read", "asset:read"]),
    rateLimitMiddleware,
    async (req: ApiRequest, res: any) => {
      try {
        const { assetId, personnelId, active } = req.query;

        const assignments = await db.select({
          id: assetsPersonelAssignment.id,
          assetId: assetsPersonelAssignment.assetId,
          personnelId: assetsPersonelAssignment.personnelId,
          startDate: assetsPersonelAssignment.startDate,
          endDate: assetsPersonelAssignment.endDate,
          isActive: assetsPersonelAssignment.isActive,
        }).from(assetsPersonelAssignment)
        .orderBy(desc(assetsPersonelAssignment.id));


        
        await logApiRequest(req, "/api/secure/getAssetsPersonnelAssignments", "GET", 200);

        res.json({
          success: true,
          message: "Araç-personel atamaları başarıyla getirildi.",
          data: {
            assignments,
            totalCount: assignments.length
          },
          clientInfo: {
            id: req.apiClient!.id,
            name: req.apiClient!.name,
            companyId: req.apiClient!.companyId
          },
          timestamp: new Date().toISOString()
        });

      } catch (error: any) {
        console.error("Assets personnel assignments fetch error:", error);
        await logApiRequest(req, "/api/secure/getAssetsPersonnelAssignments", "GET", 500, error?.message);
        res.status(500).json({
          success: false,
          message: "Araç-personel atamaları getirilirken hata oluştu.",
          error: error?.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  );

  // POST /api/secure/addAssetsPersonnelAssignment
  app.post("/api/secure/addAssetsPersonnelAssignment",
    authenticateApiKey,
    authorizeEndpoint(["data:write", "asset:write"]),
    rateLimitMiddleware,
    async (req: ApiRequest, res: any) => {
      try {
        const validatedData = insertAssetsPersonelAssignmentSchema.parse(req.body);

        // Çakışma kontrolü - aynı tarih aralığında aynı personel başka araçta atanmış mı?
        const existingAssignment = await db.select()
          .from(assetsPersonelAssignment)
          .where(
            and(
              eq(assetsPersonelAssignment.personnelId, validatedData.personnelId),
              eq(assetsPersonelAssignment.isActive, true),
              // Start date çakışma kontrolü
              sql`${assetsPersonelAssignment.startDate} <= ${validatedData.endDate || new Date('2099-12-31')} AND (${assetsPersonelAssignment.endDate} IS NULL OR ${assetsPersonelAssignment.endDate} >= ${validatedData.startDate})`
            )
          );

        if (existingAssignment.length > 0) {
          return res.status(400).json({
            success: false,
            message: "Bu personel belirtilen tarih aralığında başka bir araçta görevli.",
            error: "Date conflict",
            timestamp: new Date().toISOString()
          });
        }

        const [result] = await db.insert(assetsPersonelAssignment)
          .values(validatedData)
          .returning();

        await logApiRequest(req, "/api/secure/addAssetsPersonnelAssignment", "POST", 201);

        res.status(201).json({
          success: true,
          message: "Araç-personel ataması başarıyla eklendi.",
          data: result,
          clientInfo: {
            id: req.apiClient!.id,
            name: req.apiClient!.name,
            companyId: req.apiClient!.companyId
          },
          timestamp: new Date().toISOString()
        });

      } catch (error: any) {
        console.error("Assets personnel assignment add error:", error);
        await logApiRequest(req, "/api/secure/addAssetsPersonnelAssignment", "POST", 400, error?.message);
        
        if (error instanceof z.ZodError) {
          return res.status(400).json({
            success: false,
            message: "Geçersiz veri formatı.",
            error: error.errors,
            timestamp: new Date().toISOString()
          });
        }

        res.status(500).json({
          success: false,
          message: "Araç-personel ataması eklenirken hata oluştu.",
          error: error?.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  );

  // PUT /api/secure/updateAssetsPersonnelAssignment/:id
  app.put("/api/secure/updateAssetsPersonnelAssignment/:id",
    authenticateApiKey,
    authorizeEndpoint(["data:write", "asset:write"]),
    rateLimitMiddleware,
    async (req: ApiRequest, res: any) => {
      try {
        const id = Number(req.params.id);
        if (isNaN(id)) {
          return res.status(400).json({
            success: false,
            message: "Geçersiz ID parametresi.",
            error: "Invalid ID",
            timestamp: new Date().toISOString()
          });
        }

        const validatedData = updateAssetsPersonelAssignmentSchema.parse(req.body);

        // Var olan atamayı kontrol et
        const existing = await db.select()
          .from(assetsPersonelAssignment)
          .where(eq(assetsPersonelAssignment.id, id))
          .limit(1);

        if (existing.length === 0) {
          return res.status(404).json({
            success: false,
            message: "Araç-personel ataması bulunamadı.",
            error: "Not found",
            timestamp: new Date().toISOString()
          });
        }

        const [result] = await db.update(assetsPersonelAssignment)
          .set(validatedData)
          .where(eq(assetsPersonelAssignment.id, id))
          .returning();

        await logApiRequest(req, "/api/secure/updateAssetsPersonnelAssignment", "PUT", 200);

        res.json({
          success: true,
          message: "Araç-personel ataması başarıyla güncellendi.",
          data: result,
          clientInfo: {
            id: req.apiClient!.id,
            name: req.apiClient!.name,
            companyId: req.apiClient!.companyId
          },
          timestamp: new Date().toISOString()
        });

      } catch (error: any) {
        console.error("Assets personnel assignment update error:", error);
        await logApiRequest(req, "/api/secure/updateAssetsPersonnelAssignment", "PUT", 400, error?.message);
        
        if (error instanceof z.ZodError) {
          return res.status(400).json({
            success: false,
            message: "Geçersiz veri formatı.",
            error: error.errors,
            timestamp: new Date().toISOString()
          });
        }

        res.status(500).json({
          success: false,
          message: "Araç-personel ataması güncellenirken hata oluştu.",
          error: error?.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  );

  // DELETE /api/secure/deleteAssetsPersonnelAssignment/:id
  app.delete("/api/secure/deleteAssetsPersonnelAssignment/:id",
    authenticateApiKey,
    authorizeEndpoint(["data:delete", "asset:delete"]),
    rateLimitMiddleware,
    async (req: ApiRequest, res: any) => {
      try {
        const id = Number(req.params.id);
        if (isNaN(id)) {
          return res.status(400).json({
            success: false,
            message: "Geçersiz ID parametresi.",
            error: "Invalid ID",
            timestamp: new Date().toISOString()
          });
        }

        // Var olan atamayı kontrol et
        const existing = await db.select()
          .from(assetsPersonelAssignment)
          .where(eq(assetsPersonelAssignment.id, id))
          .limit(1);

        if (existing.length === 0) {
          return res.status(404).json({
            success: false,
            message: "Araç-personel ataması bulunamadı.",
            error: "Not found",
            timestamp: new Date().toISOString()
          });
        }

        // Soft delete (isActive = false)
        const [result] = await db.update(assetsPersonelAssignment)
          .set({ isActive: false })
          .where(eq(assetsPersonelAssignment.id, id))
          .returning();

        await logApiRequest(req, "/api/secure/deleteAssetsPersonnelAssignment", "DELETE", 200);

        res.json({
          success: true,
          message: "Araç-personel ataması başarıyla silindi.",
          data: result,
          clientInfo: {
            id: req.apiClient!.id,
            name: req.apiClient!.name,
            companyId: req.apiClient!.companyId
          },
          timestamp: new Date().toISOString()
        });

      } catch (error: any) {
        console.error("Assets personnel assignment delete error:", error);
        await logApiRequest(req, "/api/secure/deleteAssetsPersonnelAssignment", "DELETE", 500, error?.message);
        
        res.status(500).json({
          success: false,
          message: "Araç-personel ataması silinirken hata oluştu.",
          error: error?.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  );
}
