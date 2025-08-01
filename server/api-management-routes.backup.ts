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
| 28 | POST | /api/secure/addMaintenanceType | Bakım türü ekleme |
| 29 | PUT | /api/secure/updateMaintenanceType/{id} | Bakım türü güncelleme |
| 30 | DELETE | /api/secure/deleteMaintenanceType/{id} | Bakım türü silme |
| 31 | GET | /api/secure/getPenaltyTypes | Ceza türleri |
| 32 | POST | /api/secure/addPenaltyType | Ceza türü ekleme |
| 33 | PUT | /api/secure/updatePenaltyType/{id} | Ceza türü güncelleme |
| 34 | DELETE | /api/secure/deletePenaltyType/{id} | Ceza türü silme |
| 35 | GET | /api/secure/getPaymentMethods | Ödeme yöntemleri |
| 36 | POST | /api/secure/addPaymentMethod | Ödeme yöntemi ekleme |
| 37 | PUT | /api/secure/updatePaymentMethod/{id} | Ödeme yöntemi güncelleme |
| 38 | DELETE | /api/secure/deletePaymentMethod/{id} | Ödeme yöntemi silme |
| 39 | GET | /api/secure/getDocTypes | Doküman türleri |
| 40 | POST | /api/secure/addDocMainType | Ana doküman türü ekleme |
| 41 | POST | /api/secure/addDocSubType | Alt doküman türü ekleme |

### 3. Personel Yönetimi (9 API)
| No | Method | Endpoint | Açıklama |
|----|--------|----------|----------|
| 42 | GET | /api/secure/getPersonnel | Personel listesi |
| 43 | POST | /api/secure/addPersonnel | Yeni personel ekleme |
| 44 | PUT | /api/secure/updatePersonnel/{id} | Personel güncelleme |
| 45 | DELETE | /api/secure/deletePersonnel/{id} | Personel silme (soft) |
| 46 | GET | /api/secure/getPersonnelPositions | Personel pozisyonları |
| 47 | POST | /api/secure/addPersonnelPosition | Pozisyon ekleme |
| 48 | PUT | /api/secure/updatePersonnelPosition/{id} | Pozisyon güncelleme |
| 49 | DELETE | /api/secure/deletePersonnelPosition/{id} | Pozisyon silme |
| 50 | GET | /api/secure/getWorkAreas | Çalışma alanları |

### 4. Çalışma Alanı Yönetimi (5 API)
| No | Method | Endpoint | Açıklama |
|----|--------|----------|----------|
| 51 | POST | /api/secure/addWorkArea | Çalışma alanı ekleme |
| 52 | PUT | /api/secure/updateWorkArea/{id} | Çalışma alanı güncelleme |
| 53 | DELETE | /api/secure/deleteWorkArea/{id} | Çalışma alanı silme |

### 5. Şirket Yönetimi (5 API)
| No | Method | Endpoint | Açıklama |
|----|--------|----------|----------|
| 54 | GET | /api/secure/companies | Şirket listesi |
| 55 | POST | /api/secure/companies | Yeni şirket ekleme |
| 56 | GET | /api/secure/companies/{id} | Şirket detayı |
| 57 | PUT | /api/secure/companies/{id} | Şirket güncelleme |
| 58 | DELETE | /api/secure/companies/{id} | Şirket silme (soft) |

### 6. Asset/Araç Yönetimi (6 API)
| No | Method | Endpoint | Açıklama |
|----|--------|----------|----------|
| 59 | GET | /api/secure/assets | Asset listesi |
| 60 | POST | /api/secure/assets | Yeni asset ekleme |
| 61 | GET | /api/secure/assets/{id} | Asset detayı |
| 62 | PUT | /api/secure/assets/{id} | Asset güncelleme |
| 63 | DELETE | /api/secure/assets/{id} | Asset silme (soft) |
| 64 | POST | /api/secure/assignPersonnelToAsset | Personel-Asset atama |

### 7. Dosya İşlemleri (5 API)
| No | Method | Endpoint | Açıklama |
|----|--------|----------|----------|
| 65 | POST | /api/secure/documents/upload | Dosya yükleme (multipart) |
| 66 | GET | /api/secure/documents/asset/{id} | Asset dokümanları |
| 67 | GET | /api/secure/documents/personnel/{id} | Personel dokümanları |

### 8. Admin İşlemleri (8 API)
| No | Method | Endpoint | Açıklama |
|----|--------|----------|----------|
| 68 | GET | /api/admin/clients | API Client listesi |
| 69 | POST | /api/admin/clients | Yeni client oluşturma |
| 70 | GET | /api/admin/stats | Sistem istatistikleri |
| 71 | POST | /api/auth/register | Kullanıcı kaydı |
| 72 | POST | /api/auth/login | Kullanıcı girişi |
| 73 | GET | /api/secure/data | Güvenli veri okuma |
| 74 | POST | /api/secure/data | Güvenli veri yazma |
| 75 | GET | /api/secure/admin-data | Admin veri erişimi |

## Güvenlik Özellikleri
- **API Key Koruması**: Tüm endpoint'ler bcrypt hash'li API key ile korunuyor
- **İzin Sistemi**: 14 farklı izin tipi (data:read, data:write, admin:read, vb.)
- **Rate Limiting**: Endpoint bazlı hız sınırlaması
- **Audit Trail**: Tüm işlemler otomatik loglanıyor
- **Dual Authentication**: API Key + JWT Token destegi

## Demo API Key
\`ak_test123key\` - Test amaçlı kullanıma hazır demo anahtarı.

`,
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
          description: 'Türkiye\'deki 81 şehrin tam listesini döndürür. Filtreleme ve sayfalama destekli.',
          tags: ['Referans Veriler'],
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            {
              name: 'search',
              in: 'query',
              description: 'Şehir adında arama yapmak için',
              required: false,
              schema: { type: 'string', example: 'ist' }
            },
            {
              name: 'limit',
              in: 'query',
              description: 'Sayfa başına kayıt sayısı',
              required: false,
              schema: { type: 'integer', example: 10 }
            }
          ],
          responses: {
            '200': {
              description: 'Başarılı yanıt',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/City' }
                          },
                          count: { type: 'integer', example: 5 },
                          totalCount: { type: 'integer', example: 81 }
                        }
                      }
                    ]
                  },
                  example: {
                    success: true,
                    data: [
                      { id: 1, name: 'Adana' },
                      { id: 6, name: 'Ankara' },
                      { id: 34, name: 'Istanbul' }
                    ],
                    count: 3,
                    totalCount: 81,
                    message: 'Şehirler başarıyla getirildi'
                  }
                }
              }
            },
            '401': {
              description: 'Yetkisiz erişim - Geçersiz API anahtarı'
            }
          }
        }
      },
      '/api/secure/getCountries': {
        get: {
          summary: 'Ülkeler Listesi',
          description: 'Dünya ülkelerinin listesini telefon kodları ile döndürür.',
          tags: ['Referans Veriler'],
          security: [{ ApiKeyAuth: [] }],
          responses: {
            '200': {
              description: 'Başarılı yanıt',
              content: {
                'application/json': {
                  example: {
                    success: true,
                    data: [
                      { id: 1, name: 'Türkiye', phoneCode: '+90' },
                      { id: 2, name: 'Amerika Birleşik Devletleri', phoneCode: '+1' }
                    ],
                    message: 'Ülkeler başarıyla getirildi'
                  }
                }
              }
            }
          }
        }
      },
      '/api/secure/assets': {
        get: {
          summary: 'Araç Listesi',
          description: 'Şirket araçlarının listesini döndürür. Filtreleme ve arama destekli.',
          tags: ['Asset Yönetimi'],
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            {
              name: 'search',
              in: 'query',
              description: 'Plaka numarası veya model adında arama',
              required: false,
              schema: { type: 'string', example: '34ABC' }
            },
            {
              name: 'workAreaId',
              in: 'query',
              description: 'Çalışma alanına göre filtreleme',
              required: false,
              schema: { type: 'integer', example: 1 }
            }
          ],
          responses: {
            '200': {
              description: 'Başarılı yanıt',
              content: {
                'application/json': {
                  example: {
                    success: true,
                    data: [
                      {
                        id: 1,
                        plateNumber: '34ABC123',
                        modelName: 'Ford Transit',
                        year: 2023,
                        isActive: true
                      }
                    ],
                    message: 'Araçlar başarıyla getirildi'
                  }
                }
              }
            }
          }
        },
        post: {
          summary: 'Yeni Araç Ekleme',
          description: 'Sisteme yeni araç kaydı oluşturur.',
          tags: ['Asset Yönetimi'],
          security: [{ ApiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    plateNumber: { type: 'string', example: '34XYZ789' },
                    modelId: { type: 'integer', example: 1 },
                    year: { type: 'integer', example: 2023 },
                    workAreaId: { type: 'integer', example: 1 },
                    ownershipTypeId: { type: 'integer', example: 1 },
                    isActive: { type: 'boolean', example: true }
                  },
                  required: ['plateNumber', 'modelId', 'year']
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Araç başarıyla eklendi',
              content: {
                'application/json': {
                  example: {
                    success: true,
                    message: 'Araç başarıyla eklendi',
                    data: { id: 123 }
                  }
                }
              }
            }
          }
        }
      },
      '/api/secure/getPersonnel': {
        get: {
          summary: 'Personel Listesi',
          description: 'Şirket personelinin listesini döndürür.',
          tags: ['Personel Yönetimi'],
          security: [{ ApiKeyAuth: [] }],
          responses: {
            '200': {
              description: 'Başarılı yanıt',
              content: {
                'application/json': {
                  example: {
                    success: true,
                    data: [
                      {
                        id: 1,
                        name: 'Ahmet Yılmaz',
                        position: 'Şoför',
                        phone: '0532-123-4567',
                        isActive: true
                      }
                    ],
                    message: 'Personel listesi başarıyla getirildi'
                  }
                }
              }
            }
          }
        }
      },
      '/api/secure/documents/upload': {
        post: {
          summary: 'Dosya Yükleme',
          description: 'Asset veya personel için dosya yükler. Multipart form data kullanır.',
          tags: ['Dosya İşlemleri'],
          security: [{ ApiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    files: {
                      type: 'array',
                      items: { type: 'string', format: 'binary' }
                    },
                    assetId: { type: 'integer', example: 1 },
                    personnelId: { type: 'integer', example: 1 },
                    docTypeId: { type: 'integer', example: 1 }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Dosya başarıyla yüklendi',
              content: {
                'application/json': {
                  example: {
                    success: true,
                    message: 'Dosya başarıyla yüklendi',
                    data: { fileCount: 1 }
                  }
                }
              }
            }
          }
        }
      }
    }
  };
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
      },
      
      // ========================
      // EKSİK API'LER - ÖZET TANIMLAR
      // ========================
      
      '/api/secure/addCity': {
        post: {
          summary: 'Şehir Ekleme',
          description: 'Yeni şehir ekler (81 il sistemi)',
          tags: ['Admin İşlemleri'],
          security: [{ ApiKeyAuth: [] }]
        }
      },
      '/api/secure/updateCity/{id}': {
        put: {
          summary: 'Şehir Güncelleme',
          description: 'Şehir bilgilerini günceller',
          tags: ['Admin İşlemleri'],
          security: [{ ApiKeyAuth: [] }]
        }
      },
      '/api/secure/deleteCity/{id}': {
        delete: {
          summary: 'Şehir Silme',
          description: 'Şehir kaydını soft delete ile siler',
          tags: ['Admin İşlemleri'],
          security: [{ ApiKeyAuth: [] }]
        }
      },
      '/api/secure/addCountry': {
        post: {
          summary: 'Ülke Ekleme',
          description: 'Yeni ülke ekler',
          tags: ['Admin İşlemleri'],
          security: [{ ApiKeyAuth: [] }]
        }
      },
      '/api/secure/updateCountry/{id}': {
        put: {
          summary: 'Ülke Güncelleme',
          description: 'Ülke bilgilerini günceller',
          tags: ['Admin İşlemleri'],
          security: [{ ApiKeyAuth: [] }]
        }
      },
      '/api/secure/deleteCountry/{id}': {
        delete: {
          summary: 'Ülke Silme',
          description: 'Ülke kaydını soft delete ile siler',
          tags: ['Admin İşlemleri'],
          security: [{ ApiKeyAuth: [] }]
        }
      },
      '/api/secure/updateCarBrand/{id}': {
        put: {
          summary: 'Araç Markası Güncelleme',
          description: 'Araç markası bilgilerini günceller',
          tags: ['Veri İşlemleri'],
          security: [{ ApiKeyAuth: [] }]
        }
      },
      '/api/secure/deleteCarBrand/{id}': {
        delete: {
          summary: 'Araç Markası Silme',
          description: 'Araç markasını soft delete ile siler',
          tags: ['Veri İşlemleri'],
          security: [{ ApiKeyAuth: [] }]
        }
      },
      '/api/secure/updateCarModel/{id}': {
        put: {
          summary: 'Araç Modeli Güncelleme',
          description: 'Araç modeli bilgilerini günceller',
          tags: ['Veri İşlemleri'],
          security: [{ ApiKeyAuth: [] }]
        }
      },
      '/api/secure/deleteCarModel/{id}': {
        delete: {
          summary: 'Araç Modeli Silme',
          description: 'Araç modelini soft delete ile siler',
          tags: ['Veri İşlemleri'],
          security: [{ ApiKeyAuth: [] }]
        }
      },
      '/api/secure/updateCarType/{id}': {
        put: {
          summary: 'Araç Tipi Güncelleme',
          description: 'Araç tipi bilgilerini günceller',
          tags: ['Veri İşlemleri'],
          security: [{ ApiKeyAuth: [] }]
        }
      },
      '/api/secure/deleteCarType/{id}': {
        delete: {
          summary: 'Araç Tipi Silme',
          description: 'Araç tipini soft delete ile siler',
          tags: ['Veri İşlemleri'],
          security: [{ ApiKeyAuth: [] }]
        }
      },
      '/api/secure/updatePolicyType/{id}': {
        put: {
          summary: 'Poliçe Türü Güncelleme',
          description: 'Poliçe türü bilgilerini günceller',
          tags: ['Veri İşlemleri'],
          security: [{ ApiKeyAuth: [] }]
        }
      },
      '/api/secure/deletePolicyType/{id}': {
        delete: {
          summary: 'Poliçe Türü Silme',
          description: 'Poliçe türünü soft delete ile siler',
          tags: ['Veri İşlemleri'],
          security: [{ ApiKeyAuth: [] }]
        }
      },
      '/api/secure/updateMaintenanceType/{id}': {
        put: {
          summary: 'Bakım Türü Güncelleme',
          description: 'Bakım türü bilgilerini günceller',
          tags: ['Veri İşlemleri'],
          security: [{ ApiKeyAuth: [] }]
        }
      },
      '/api/secure/deleteMaintenanceType/{id}': {
        delete: {
          summary: 'Bakım Türü Silme',
          description: 'Bakım türünü soft delete ile siler',
          tags: ['Veri İşlemleri'],
          security: [{ ApiKeyAuth: [] }]
        }
      },
      '/api/secure/deletePenaltyType/{id}': {
        delete: {
          summary: 'Ceza Türü Silme',
          description: 'Ceza türünü soft delete ile siler',
          tags: ['Veri İşlemleri'],
          security: [{ ApiKeyAuth: [] }]
        }
      },
      '/api/secure/updatePaymentMethod/{id}': {
        put: {
          summary: 'Ödeme Yöntemi Güncelleme',
          description: 'Ödeme yöntemi bilgilerini günceller',
          tags: ['Veri İşlemleri'],
          security: [{ ApiKeyAuth: [] }]
        }
      },
      '/api/secure/deletePaymentMethod/{id}': {
        delete: {
          summary: 'Ödeme Yöntemi Silme',
          description: 'Ödeme yöntemini soft delete ile siler',
          tags: ['Veri İşlemleri'],
          security: [{ ApiKeyAuth: [] }]
        }
      },
      '/api/secure/getPersonnel': {
        get: {
          summary: 'Personel Listesi',
          description: 'Sistemdeki tüm personel kayıtlarını listeler',
          tags: ['Personel Yönetimi'],
          security: [{ ApiKeyAuth: [] }]
        }
      },
      '/api/secure/updatePersonnel/{id}': {
        put: {
          summary: 'Personel Güncelleme',
          description: 'Personel bilgilerini günceller',
          tags: ['Personel Yönetimi'],
          security: [{ ApiKeyAuth: [] }]
        }
      },
      '/api/secure/deletePersonnel/{id}': {
        delete: {
          summary: 'Personel Silme',
          description: 'Personel kaydını soft delete ile siler',
          tags: ['Personel Yönetimi'],
          security: [{ ApiKeyAuth: [] }]
        }
      },
      '/api/secure/updatePersonnelPosition/{id}': {
        put: {
          summary: 'Personel Pozisyonu Güncelleme',
          description: 'Personel pozisyonu bilgilerini günceller',
          tags: ['Personel Yönetimi'],
          security: [{ ApiKeyAuth: [] }]
        }
      },
      '/api/secure/deletePersonnelPosition/{id}': {
        delete: {
          summary: 'Personel Pozisyonu Silme',
          description: 'Personel pozisyonunu soft delete ile siler',
          tags: ['Personel Yönetimi'],
          security: [{ ApiKeyAuth: [] }]
        }
      },
      '/api/secure/updateWorkArea/{id}': {
        put: {
          summary: 'Çalışma Alanı Güncelleme',
          description: 'Çalışma alanı bilgilerini günceller',
          tags: ['Çalışma Alanı Yönetimi'],
          security: [{ ApiKeyAuth: [] }]
        }
      },
      '/api/secure/deleteWorkArea/{id}': {
        delete: {
          summary: 'Çalışma Alanı Silme',
          description: 'Çalışma alanını soft delete ile siler',
          tags: ['Çalışma Alanı Yönetimi'],
          security: [{ ApiKeyAuth: [] }]
        }
      },
      '/api/secure/companies/{id}': {
        get: {
          summary: 'Şirket Detayı',
          description: 'Belirli şirketin detay bilgilerini getirir',
          tags: ['Şirket Yönetimi'],
          security: [{ ApiKeyAuth: [] }]
        },
        put: {
          summary: 'Şirket Güncelleme',
          description: 'Şirket bilgilerini günceller',
          tags: ['Şirket Yönetimi'],
          security: [{ ApiKeyAuth: [] }]
        },
        delete: {
          summary: 'Şirket Silme',
          description: 'Şirketi soft delete ile siler',
          tags: ['Şirket Yönetimi'],
          security: [{ ApiKeyAuth: [] }]
        }
      },
      '/api/secure/assets/{id}': {
        get: {
          summary: 'Asset Detayı',
          description: 'Belirli asset/aracın detay bilgilerini getirir',
          tags: ['Asset Yönetimi'],
          security: [{ ApiKeyAuth: [] }]
        },
        put: {
          summary: 'Asset Güncelleme',
          description: 'Asset/araç bilgilerini günceller',
          tags: ['Asset Yönetimi'],
          security: [{ ApiKeyAuth: [] }]
        },
        delete: {
          summary: 'Asset Silme',
          description: 'Asset/aracı soft delete ile siler',
          tags: ['Asset Yönetimi'],
          security: [{ ApiKeyAuth: [] }]
        }
      },
      '/api/secure/assignPersonnelToAsset': {
        post: {
          summary: 'Asset-Personel Atama',
          description: 'Personeli bir asset/araca atar',
          tags: ['Asset Yönetimi'],
          security: [{ ApiKeyAuth: [] }]
        }
      },
      '/api/secure/documents/asset/{id}': {
        get: {
          summary: 'Asset Dokümanları',
          description: 'Asset/araçla ilgili dokümanları listeler',
          tags: ['Dosya İşlemleri'],
          security: [{ ApiKeyAuth: [] }]
        }
      },
      '/api/secure/documents/personnel/{id}': {
        get: {
          summary: 'Personel Dokümanları',
          description: 'Personelle ilgili dokümanları listeler',
          tags: ['Dosya İşlemleri'],
          security: [{ ApiKeyAuth: [] }]
        }
      },
      '/api/admin/stats': {
        get: {
          summary: 'Sistem İstatistikleri',
          description: 'API kullanım istatistikleri ve sistem durumu',
          tags: ['Admin İşlemleri'],
          security: [{ ApiKeyAuth: [] }]
        }
      },
      '/api/auth/register': {
        post: {
          summary: 'Kullanıcı Kaydı',
          description: 'Yeni kullanıcı kaydı oluşturur',
          tags: ['Admin İşlemleri'],
          security: [{ ApiKeyAuth: [] }]
        }
      },
      '/api/auth/login': {
        post: {
          summary: 'Kullanıcı Girişi',
          description: 'Kullanıcı girişi yapar ve JWT token döndürür',
          tags: ['Admin İşlemleri']
        }
      },
      '/api/secure/admin-data': {
        get: {
          summary: 'Admin Veri Erişimi',
          description: 'Admin seviyesi veri erişimi',
          tags: ['Admin İşlemleri'],
          security: [{ ApiKeyAuth: [] }]
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
        name: 'Personel Yönetimi',
        description: 'Personel bilgileri yönetimi - CRUD operasyonları'
      },
      {
        name: 'Çalışma Alanı Yönetimi',
        description: 'Çalışma alanları yönetimi - CRUD operasyonları'
      },
      {
        name: 'Admin İşlemleri',
        description: 'Sistem yönetimi ve admin işlemleri'
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
  // KULLANICI API KEY YÖNETİMİ (JWT ile korunuyor)
  // ========================

  // Kullanıcının kendi API key'lerini listele (maskelenmiş)
  app.get("/api/user/api-keys", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      
      const userApiKeys = await db
        .select({
          id: apiKeys.id,
          name: apiClients.name,
          keyHash: apiKeys.keyHash, // Hash'i alacağız maskeleme için
          permissions: apiKeys.permissions,
          isActive: apiKeys.isActive,
          createdAt: apiKeys.createdAt,
          lastUsedAt: apiKeys.lastUsedAt,
          usageCount: sql<number>`0`.as('usageCount')
        })
        .from(apiKeys)
        .leftJoin(apiClients, eq(apiKeys.clientId, apiClients.id))
        .where(and(
          eq(apiClients.userId, userId),
          eq(apiKeys.isActive, true), // Sadece aktif API key'ler
          eq(apiClients.isActive, true) // Sadece aktif client'lar
        ));

      // API key'leri maskeleme - son 4 hane görünür  
      const maskedApiKeys = userApiKeys.map(key => {
        // keyHash'den son 4 karakter al ve maskele
        const maskedKey = key.keyHash ? `*******${key.keyHash.slice(-4)}` : '*******xxxx';
        
        return {
          ...key,
          key: maskedKey, // Maskelenmiş key
          keyHash: undefined // Hash'i client'e gönderme
        };
      });

      res.json(maskedApiKeys);
    } catch (error) {
      console.error("Error fetching user API keys:", error);
      res.status(500).json({ 
        success: false, 
        message: "API key'ler alınamadı",
        error: error instanceof Error ? error.message : 'Bilinmeyen hata'
      });
    }
  });

  // Yeni API key oluştur
  app.post("/api/user/api-keys", authenticateToken, async (req: any, res) => {
    try {
      console.log('API key oluşturma başladı');
      const userId = req.user.userId;
      const { name, permissions } = req.body;
      console.log('Request data:', { userId, name, permissions });

      if (!name || !Array.isArray(permissions) || permissions.length === 0) {
        return res.status(400).json({
          success: false,
          message: "API key ismi ve izinler gereklidir"
        });
      }

      console.log('Received permissions:', permissions);
      
      // Basit izin doğrulama - sadece read, write, admin
      const validPermissions = ['read', 'write', 'admin'];
      const invalidPermissions = permissions.filter(p => !validPermissions.includes(p));
      if (invalidPermissions.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Geçersiz izinler: ${invalidPermissions.join(', ')}. Sadece şunlar geçerli: read, write, admin`
        });
      }

      // Basit izinleri detaylı izinlere çevir
      let detailedPermissions = [];
      if (permissions.includes('read')) {
        detailedPermissions.push('data:read', 'asset:read', 'personnel:read', 'company:read', 'document:read');
      }
      if (permissions.includes('write')) {
        detailedPermissions.push('data:write', 'asset:write', 'personnel:write', 'company:write', 'document:write');
      }
      if (permissions.includes('admin')) {
        detailedPermissions.push('data:read', 'data:write', 'data:update', 'data:delete',
          'asset:read', 'asset:write', 'asset:update', 'asset:delete',
          'personnel:read', 'personnel:write', 'personnel:update', 'personnel:delete',
          'company:read', 'company:write', 'company:update', 'company:delete',
          'document:read', 'document:write', 'document:delete');
      }

      // API Client oluştur
      const [newClient] = await db
        .insert(apiClients)
        .values({
          name,
          userId,
          isActive: true
        })
        .returning();

      // API Key oluştur
      const apiKey = `ak_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      const hashedKey = await bcrypt.hash(apiKey, 10);

      console.log('Creating API key with:', {
        clientId: newClient.id,
        hashedKey: hashedKey.substring(0, 20) + '...',
        permissions: detailedPermissions
      });
      
      // Simple Drizzle ORM insert - schema'ya göre
      const [newApiKey] = await db
        .insert(apiKeys)
        .values({
          clientId: newClient.id,
          keyHash: hashedKey,
          permissions: detailedPermissions, // Dynamic permissions
          isActive: true
        })
        .returning();
      
      console.log('New API Key created:', newApiKey);
      
      // Oluşturma anında tam API key göster - sadece bir kez!
      res.json({
        success: true,
        message: "API key başarıyla oluşturuldu",
        data: {
          apiKey: {
            id: newApiKey.id,
            name: newClient.name,
            key: apiKey, // TAM API KEY - sadece oluşturma anında görünür
            permissions: detailedPermissions,
            isActive: true,
            createdAt: newApiKey.createdAt,
            warning: "Bu API key sadece şimdi görüntüleniyor. Lütfen güvenli bir yerde saklayın. Bir daha tam halini göremeyeceksiniz."
          }
        }
      });

    } catch (error) {
      console.error("Error creating API key:", error);
      res.status(500).json({
        success: false,
        message: "API key oluşturulamadı",
        error: error instanceof Error ? error.message : 'Bilinmeyen hata'
      });
    }
  });

  // API key sil
  app.delete("/api/user/api-keys/:keyId", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const keyId = parseInt(req.params.keyId);

      if (!keyId) {
        return res.status(400).json({
          success: false,
          message: "Geçersiz API key ID"
        });
      }

      // Kullanıcının key'ine sahip olduğunu doğrula
      const [existingKey] = await db
        .select()
        .from(apiKeys)
        .leftJoin(apiClients, eq(apiKeys.clientId, apiClients.id))
        .where(and(eq(apiKeys.id, keyId), eq(apiClients.userId, userId)));

      if (!existingKey) {
        return res.status(404).json({
          success: false,
          message: "API key bulunamadı"
        });
      }

      // Soft delete - API key'i pasif yap
      await db
        .update(apiKeys)
        .set({ 
          isActive: false,
          lastUsedAt: new Date() // Son işlem zamanını güncelle
        })
        .where(eq(apiKeys.id, keyId));

      // API client'ı da pasif yap
      await db
        .update(apiClients)
        .set({ isActive: false })
        .where(eq(apiClients.id, existingKey.api_keys.clientId));

      res.json({
        success: true,
        message: "API key başarıyla silindi"
      });

    } catch (error) {
      console.error("Error deleting API key:", error);
      res.status(500).json({
        success: false,
        message: "API key silinemedi",
        error: error instanceof Error ? error.message : 'Bilinmeyen hata'
      });
    }
  });

  // ========================
  // API ENDPOINT'LERİ YÖNETİMİ 
  // ========================

  // Tüm API endpoint'leri listele (Dashboard için)
  app.get("/api/endpoints", authenticateToken, async (req, res) => {
    try {
      const endpoints = await db
        .select()
        .from(apiEndpoints)
        .orderBy(desc(apiEndpoints.createdAt));

      // Frontend için uygun format
      const formattedEndpoints = endpoints.map(endpoint => ({
        id: endpoint.id,
        name: endpoint.name,
        method: endpoint.method,
        path: endpoint.endpoint,  // endpoint -> path olarak map et
        description: endpoint.description,
        status: endpoint.isActive ? 'active' : 'inactive',  // boolean -> string
        createdAt: endpoint.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: endpoint.updatedAt?.toISOString() || new Date().toISOString()
      }));

      res.json({
        success: true,
        data: formattedEndpoints,
        count: formattedEndpoints.length
      });

    } catch (error) {
      console.error("Error fetching API endpoints:", error);
      res.status(500).json({
        success: false,
        message: "API endpoint'leri alınamadı",
        error: error instanceof Error ? error.message : 'Bilinmeyen hata'
      });
    }
  });

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

  // Cities API - Şehir listesi (Filtreleme desteği ile)
  app.get(
    "/api/secure/getCities", 
    authenticateApiKey,
    logApiRequest,
    rateLimitMiddleware(100),
    authorizeEndpoint(['data:read']),
    async (req: ApiRequest, res) => {
      try {
        const { search, limit, offset, sortBy = 'name', sortOrder = 'asc' } = req.query;
        
        let query = db.select({
          id: cities.id,
          name: cities.name
        }).from(cities);

        // Search filtrelemesi
        if (search) {
          query = query.where(ilike(cities.name, `%${search}%`));
        }

        // Sıralama
        const orderColumn = sortBy === 'id' ? cities.id : cities.name;
        const orderDirection = sortOrder === 'desc' ? desc(orderColumn) : asc(orderColumn);
        query = query.orderBy(orderDirection);

        // Sayfalama
        if (limit) {
          query = query.limit(Number(limit));
          if (offset) {
            query = query.offset(Number(offset));
          }
        }

        const citiesList = await query;
        
        // Toplam sayı (filtreleme dahil)
        let totalQuery = db.select({ count: sql`count(*)` }).from(cities);
        if (search) {
          totalQuery = totalQuery.where(ilike(cities.name, `%${search}%`));
        }
        const totalResult = await totalQuery;
        const totalCount = Number(totalResult[0].count);
        
        res.json({
          success: true,
          data: citiesList,
          count: citiesList.length,
          totalCount,
          pagination: {
            limit: limit ? Number(limit) : null,
            offset: offset ? Number(offset) : null,
            hasMore: limit ? citiesList.length === Number(limit) : false
          },
          filters: {
            search: search || null,
            sortBy,
            sortOrder
          },
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

  // Penalty Types API - Ceza türleri listesi (Filtreleme desteği ile)
  app.get(
    "/api/secure/getPenaltyTypes", 
    authenticateApiKey,
    logApiRequest,
    rateLimitMiddleware(100),
    authorizeEndpoint(['data:read']),
    async (req: ApiRequest, res) => {
      try {
        const { search, limit, offset, sortBy = 'penaltyScore', sortOrder = 'asc', minAmount, maxAmount, activeOnly = 'true' } = req.query;
        
        let query = db.select({
          id: penaltyTypes.id,
          name: penaltyTypes.name,
          description: penaltyTypes.description,
          penaltyScore: penaltyTypes.penaltyScore,
          amountCents: penaltyTypes.amountCents,
          discountedAmountCents: penaltyTypes.discountedAmountCents,
          isActive: penaltyTypes.isActive,
          lastDate: penaltyTypes.lastDate
        }).from(penaltyTypes);

        // Filtreleme conditions
        const conditions = [];
        
        if (activeOnly === 'true') {
          conditions.push(eq(penaltyTypes.isActive, true));
        }
        
        if (search) {
          conditions.push(ilike(penaltyTypes.name, `%${search}%`));
        }
        
        if (minAmount) {
          conditions.push(gte(penaltyTypes.amountCents, Number(minAmount) * 100));
        }
        
        if (maxAmount) {
          conditions.push(lte(penaltyTypes.amountCents, Number(maxAmount) * 100));
        }

        if (conditions.length > 0) {
          query = query.where(and(...conditions));
        }

        // Sıralama
        let orderColumn = penaltyTypes.penaltyScore;
        if (sortBy === 'name') orderColumn = penaltyTypes.name;
        else if (sortBy === 'amountCents') orderColumn = penaltyTypes.amountCents;
        
        const orderDirection = sortOrder === 'desc' ? desc(orderColumn) : asc(orderColumn);
        query = query.orderBy(orderDirection, penaltyTypes.name);

        // Sayfalama
        if (limit) {
          query = query.limit(Number(limit));
          if (offset) {
            query = query.offset(Number(offset));
          }
        }

        const penaltyTypesList = await query;
        
        // Toplam sayı (filtreleme dahil)
        let totalQuery = db.select({ count: sql`count(*)` }).from(penaltyTypes);
        if (conditions.length > 0) {
          totalQuery = totalQuery.where(and(...conditions));
        }
        const totalResult = await totalQuery;
        const totalCount = Number(totalResult[0].count);
        
        res.json({
          success: true,
          data: penaltyTypesList,
          count: penaltyTypesList.length,
          totalCount,
          pagination: {
            limit: limit ? Number(limit) : null,
            offset: offset ? Number(offset) : null,
            hasMore: limit ? penaltyTypesList.length === Number(limit) : false
          },
          filters: {
            search: search || null,
            sortBy,
            sortOrder,
            minAmount: minAmount || null,
            maxAmount: maxAmount || null,
            activeOnly
          },
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

  // Countries API - Ülke listesi (Filtreleme desteği ile)
  app.get(
    "/api/secure/getCountries", 
    authenticateApiKey,
    logApiRequest,
    rateLimitMiddleware(100),
    authorizeEndpoint(['data:read']),
    async (req: ApiRequest, res) => {
      try {
        const { search, limit, offset, sortBy = 'name', sortOrder = 'asc', phoneCode } = req.query;
        
        let query = db.select({
          id: countries.id,
          name: countries.name,
          phoneCode: countries.phoneCode
        }).from(countries);

        // Filtreleme conditions
        const conditions = [];
        
        if (search) {
          conditions.push(ilike(countries.name, `%${search}%`));
        }
        
        if (phoneCode) {
          conditions.push(eq(countries.phoneCode, phoneCode as string));
        }

        if (conditions.length > 0) {
          query = query.where(and(...conditions));
        }

        // Sıralama
        const orderColumn = sortBy === 'phoneCode' ? countries.phoneCode : countries.name;
        const orderDirection = sortOrder === 'desc' ? desc(orderColumn) : asc(orderColumn);
        query = query.orderBy(orderDirection);

        // Sayfalama
        if (limit) {
          query = query.limit(Number(limit));
          if (offset) {
            query = query.offset(Number(offset));
          }
        }

        const countriesList = await query;
        
        // Toplam sayı (filtreleme dahil)
        let totalQuery = db.select({ count: sql`count(*)` }).from(countries);
        if (conditions.length > 0) {
          totalQuery = totalQuery.where(and(...conditions));
        }
        const totalResult = await totalQuery;
        const totalCount = Number(totalResult[0].count);
        
        res.json({
          success: true,
          data: countriesList,
          count: countriesList.length,
          totalCount,
          pagination: {
            limit: limit ? Number(limit) : null,
            offset: offset ? Number(offset) : null,
            hasMore: limit ? countriesList.length === Number(limit) : false
          },
          filters: {
            search: search || null,
            sortBy,
            sortOrder,
            phoneCode: phoneCode || null
          },
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

  // Policy Types API - Poliçe türleri listesi (Filtreleme desteği ile)
  app.get(
    "/api/secure/getPolicyTypes", 
    authenticateApiKey,
    logApiRequest,
    rateLimitMiddleware(100),
    authorizeEndpoint(['data:read']),
    async (req: ApiRequest, res) => {
      try {
        const { search, limit, offset, sortBy = 'name', sortOrder = 'asc', activeOnly = 'true' } = req.query;
        
        let query = db.select({
          id: policyTypes.id,
          name: policyTypes.name
        }).from(policyTypes);

        // Filtreleme conditions
        const conditions = [];
        
        if (activeOnly === 'true') {
          conditions.push(eq(policyTypes.isActive, true));
        }
        
        if (search) {
          conditions.push(ilike(policyTypes.name, `%${search}%`));
        }

        if (conditions.length > 0) {
          query = query.where(and(...conditions));
        }

        // Sıralama
        const orderColumn = sortBy === 'id' ? policyTypes.id : policyTypes.name;
        const orderDirection = sortOrder === 'desc' ? desc(orderColumn) : asc(orderColumn);
        query = query.orderBy(orderDirection);

        // Sayfalama
        if (limit) {
          query = query.limit(Number(limit));
          if (offset) {
            query = query.offset(Number(offset));
          }
        }

        const policyTypesList = await query;
        
        // Toplam sayı (filtreleme dahil)
        let totalQuery = db.select({ count: sql`count(*)` }).from(policyTypes);
        if (conditions.length > 0) {
          totalQuery = totalQuery.where(and(...conditions));
        }
        const totalResult = await totalQuery;
        const totalCount = Number(totalResult[0].count);
        
        res.json({
          success: true,
          data: policyTypesList,
          count: policyTypesList.length,
          totalCount,
          pagination: {
            limit: limit ? Number(limit) : null,
            offset: offset ? Number(offset) : null,
            hasMore: limit ? policyTypesList.length === Number(limit) : false
          },
          filters: {
            search: search || null,
            sortBy,
            sortOrder,
            activeOnly
          },
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

  // Payment Methods API - Ödeme yöntemleri listesi (Filtreleme desteği ile)
  app.get(
    "/api/secure/getPaymentMethods", 
    authenticateApiKey,
    logApiRequest,
    rateLimitMiddleware(100),
    authorizeEndpoint(['data:read']),
    async (req: ApiRequest, res) => {
      try {
        const { search, limit, offset, sortBy = 'name', sortOrder = 'asc', activeOnly = 'true' } = req.query;
        
        let query = db.select({
          id: paymentMethods.id,
          name: paymentMethods.name
        }).from(paymentMethods);

        // Filtreleme conditions
        const conditions = [];
        
        if (activeOnly === 'true') {
          conditions.push(eq(paymentMethods.isActive, true));
        }
        
        if (search) {
          conditions.push(ilike(paymentMethods.name, `%${search}%`));
        }

        if (conditions.length > 0) {
          query = query.where(and(...conditions));
        }

        // Sıralama
        const orderColumn = sortBy === 'id' ? paymentMethods.id : paymentMethods.name;
        const orderDirection = sortOrder === 'desc' ? desc(orderColumn) : asc(orderColumn);
        query = query.orderBy(orderDirection);

        // Sayfalama
        if (limit) {
          query = query.limit(Number(limit));
          if (offset) {
            query = query.offset(Number(offset));
          }
        }

        const paymentMethodsList = await query;
        
        // Toplam sayı (filtreleme dahil)
        let totalQuery = db.select({ count: sql`count(*)` }).from(paymentMethods);
        if (conditions.length > 0) {
          totalQuery = totalQuery.where(and(...conditions));
        }
        const totalResult = await totalQuery;
        const totalCount = Number(totalResult[0].count);
        
        res.json({
          success: true,
          data: paymentMethodsList,
          count: paymentMethodsList.length,
          totalCount,
          pagination: {
            limit: limit ? Number(limit) : null,
            offset: offset ? Number(offset) : null,
            hasMore: limit ? paymentMethodsList.length === Number(limit) : false
          },
          filters: {
            search: search || null,
            sortBy,
            sortOrder,
            activeOnly
          },
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

  // Maintenance Types API - Bakım türleri listesi (Filtreleme desteği ile)
  app.get(
    "/api/secure/getMaintenanceTypes", 
    authenticateApiKey,
    logApiRequest,
    rateLimitMiddleware(100),
    authorizeEndpoint(['data:read']),
    async (req: ApiRequest, res) => {
      try {
        const { search, limit, offset, sortBy = 'name', sortOrder = 'asc', activeOnly = 'true' } = req.query;
        
        let query = db.select({
          id: maintenanceTypes.id,
          name: maintenanceTypes.name
        }).from(maintenanceTypes);

        // Filtreleme conditions
        const conditions = [];
        
        if (activeOnly === 'true') {
          conditions.push(eq(maintenanceTypes.isActive, true));
        }
        
        if (search) {
          conditions.push(ilike(maintenanceTypes.name, `%${search}%`));
        }

        if (conditions.length > 0) {
          query = query.where(and(...conditions));
        }

        // Sıralama
        const orderColumn = sortBy === 'id' ? maintenanceTypes.id : maintenanceTypes.name;
        const orderDirection = sortOrder === 'desc' ? desc(orderColumn) : asc(orderColumn);
        query = query.orderBy(orderDirection);

        // Sayfalama
        if (limit) {
          query = query.limit(Number(limit));
          if (offset) {
            query = query.offset(Number(offset));
          }
        }

        const maintenanceTypesList = await query;
        
        // Toplam sayı (filtreleme dahil)
        let totalQuery = db.select({ count: sql`count(*)` }).from(maintenanceTypes);
        if (conditions.length > 0) {
          totalQuery = totalQuery.where(and(...conditions));
        }
        const totalResult = await totalQuery;
        const totalCount = Number(totalResult[0].count);
        
        res.json({
          success: true,
          data: maintenanceTypesList,
          count: maintenanceTypesList.length,
          totalCount,
          pagination: {
            limit: limit ? Number(limit) : null,
            offset: offset ? Number(offset) : null,
            hasMore: limit ? maintenanceTypesList.length === Number(limit) : false
          },
          filters: {
            search: search || null,
            sortBy,
            sortOrder,
            activeOnly
          },
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

  // ========================
  // PERSONNEL CRUD API (GET, PUT, DELETE)
  // ========================

  // GET /api/secure/getPersonnel
  app.get("/api/secure/getPersonnel", 
    authenticateApiKey,
    authorizeEndpoint(["data:read", "company:read"]),
    rateLimitMiddleware,
    async (req: ApiRequest, res: any) => {
      try {
        const { search, active } = req.query;

        let query = db.select({
          id: personnel.id,
          name: personnel.name,
          surname: personnel.surname,
          tcno: personnel.tcno,
          phone: personnel.phone,
          email: personnel.email,
          birthDate: personnel.birthDate,
          hireDate: personnel.hireDate,
          isActive: personnel.isActive,
        }).from(personnel);

        if (active !== undefined) {
          query = query.where(eq(personnel.isActive, active === 'true'));
        }

        const personnelList = await query.orderBy(desc(personnel.id));
        
        await logApiRequest(req, "/api/secure/getPersonnel", "GET", 200);

        res.json({
          success: true,
          message: "Personel listesi başarıyla getirildi.",
          data: {
            personnel: personnelList,
            totalCount: personnelList.length
          },
          clientInfo: {
            id: req.apiClient!.id,
            name: req.apiClient!.name,
            companyId: req.apiClient!.companyId
          },
          timestamp: new Date().toISOString()
        });

      } catch (error: any) {
        console.error("Personnel fetch error:", error);
        await logApiRequest(req, "/api/secure/getPersonnel", "GET", 500, error?.message);
        res.status(500).json({
          success: false,
          message: "Personel listesi getirilirken hata oluştu.",
          error: error?.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  );

  // PUT /api/secure/updatePersonnel/:id
  app.put("/api/secure/updatePersonnel/:id",
    authenticateApiKey,
    authorizeEndpoint(["data:write", "company:write"]),
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

        const validatedData = insertPersonnelSchema.partial().parse(req.body);

        // Var olan personeli kontrol et
        const existing = await db.select()
          .from(personnel)
          .where(eq(personnel.id, id))
          .limit(1);

        if (existing.length === 0) {
          return res.status(404).json({
            success: false,
            message: "Personel bulunamadı.",
            error: "Not found",
            timestamp: new Date().toISOString()
          });
        }

        // TC Kimlik No. değişiyorsa mükerrer kontrol
        if (validatedData.tcno && validatedData.tcno !== existing[0].tcno) {
          const duplicateCheck = await db.select()
            .from(personnel)
            .where(and(
              eq(personnel.tcno, validatedData.tcno),
              not(eq(personnel.id, id))
            ));

          if (duplicateCheck.length > 0) {
            return res.status(400).json({
              success: false,
              message: "Bu TC Kimlik No. zaten kayıtlı.",
              error: "Duplicate TCNO",
              timestamp: new Date().toISOString()
            });
          }
        }

        const [result] = await db.update(personnel)
          .set(validatedData)
          .where(eq(personnel.id, id))
          .returning();

        await logApiRequest(req, "/api/secure/updatePersonnel", "PUT", 200);

        res.json({
          success: true,
          message: "Personel başarıyla güncellendi.",
          data: result,
          clientInfo: {
            id: req.apiClient!.id,
            name: req.apiClient!.name,
            companyId: req.apiClient!.companyId
          },
          timestamp: new Date().toISOString()
        });

      } catch (error: any) {
        console.error("Personnel update error:", error);
        await logApiRequest(req, "/api/secure/updatePersonnel", "PUT", 400, error?.message);
        
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
          message: "Personel güncellenirken hata oluştu.",
          error: error?.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  );

  // DELETE /api/secure/deletePersonnel/:id
  app.delete("/api/secure/deletePersonnel/:id",
    authenticateApiKey,
    authorizeEndpoint(["data:delete", "company:delete"]),
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

        // Var olan personeli kontrol et
        const existing = await db.select()
          .from(personnel)
          .where(eq(personnel.id, id))
          .limit(1);

        if (existing.length === 0) {
          return res.status(404).json({
            success: false,
            message: "Personel bulunamadı.",
            error: "Not found",
            timestamp: new Date().toISOString()
          });
        }

        // Soft delete (isActive = false)
        const [result] = await db.update(personnel)
          .set({ isActive: false })
          .where(eq(personnel.id, id))
          .returning();

        await logApiRequest(req, "/api/secure/deletePersonnel", "DELETE", 200);

        res.json({
          success: true,
          message: "Personel başarıyla silindi.",
          data: result,
          clientInfo: {
            id: req.apiClient!.id,
            name: req.apiClient!.name,
            companyId: req.apiClient!.companyId
          },
          timestamp: new Date().toISOString()
        });

      } catch (error: any) {
        console.error("Personnel delete error:", error);
        await logApiRequest(req, "/api/secure/deletePersonnel", "DELETE", 500, error?.message);
        
        res.status(500).json({
          success: false,
          message: "Personel silinirken hata oluştu.",
          error: error?.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  );

  // ========================
  // WORK AREAS CRUD API (GET, DELETE)
  // ========================

  // GET /api/secure/getWorkAreas
  app.get("/api/secure/getWorkAreas", 
    authenticateApiKey,
    authorizeEndpoint(["data:read", "company:read"]),
    rateLimitMiddleware,
    async (req: ApiRequest, res: any) => {
      try {
        const { active } = req.query;

        let query = db.select({
          id: workAreas.id,
          name: workAreas.name,
          cityId: workAreas.cityId,
          address: workAreas.address,
          managerPersonnelId: workAreas.managerPersonnelId,
          isActive: workAreas.isActive,
        }).from(workAreas);

        if (active !== undefined) {
          query = query.where(eq(workAreas.isActive, active === 'true'));
        }

        const workAreasList = await query.orderBy(desc(workAreas.id));
        
        await logApiRequest(req, "/api/secure/getWorkAreas", "GET", 200);

        res.json({
          success: true,
          message: "Çalışma alanları başarıyla getirildi.",
          data: {
            workAreas: workAreasList,
            totalCount: workAreasList.length
          },
          clientInfo: {
            id: req.apiClient!.id,
            name: req.apiClient!.name,
            companyId: req.apiClient!.companyId
          },
          timestamp: new Date().toISOString()
        });

      } catch (error: any) {
        console.error("Work areas fetch error:", error);
        await logApiRequest(req, "/api/secure/getWorkAreas", "GET", 500, error?.message);
        res.status(500).json({
          success: false,
          message: "Çalışma alanları getirilirken hata oluştu.",
          error: error?.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  );

  // DELETE /api/secure/deleteWorkArea/:id
  app.delete("/api/secure/deleteWorkArea/:id",
    authenticateApiKey,
    authorizeEndpoint(["data:delete", "company:delete"]),
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

        // Var olan çalışma alanını kontrol et
        const existing = await db.select()
          .from(workAreas)
          .where(eq(workAreas.id, id))
          .limit(1);

        if (existing.length === 0) {
          return res.status(404).json({
            success: false,
            message: "Çalışma alanı bulunamadı.",
            error: "Not found",
            timestamp: new Date().toISOString()
          });
        }

        // Soft delete (isActive = false)
        const [result] = await db.update(workAreas)
          .set({ isActive: false })
          .where(eq(workAreas.id, id))
          .returning();

        await logApiRequest(req, "/api/secure/deleteWorkArea", "DELETE", 200);

        res.json({
          success: true,
          message: "Çalışma alanı başarıyla silindi.",
          data: result,
          clientInfo: {
            id: req.apiClient!.id,
            name: req.apiClient!.name,
            companyId: req.apiClient!.companyId
          },
          timestamp: new Date().toISOString()
        });

      } catch (error: any) {
        console.error("Work area delete error:", error);
        await logApiRequest(req, "/api/secure/deleteWorkArea", "DELETE", 500, error?.message);
        
        res.status(500).json({
          success: false,
          message: "Çalışma alanı silinirken hata oluştu.",
          error: error?.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  );

  // ========================
  // CAR BRANDS CRUD API (CREATE, UPDATE, DELETE)
  // ========================

  // POST /api/secure/addCarBrand
  app.post("/api/secure/addCarBrand",
    authenticateApiKey,
    authorizeEndpoint(["data:write", "asset:write"]),
    rateLimitMiddleware,
    async (req: ApiRequest, res: any) => {
      try {
        const validatedData = insertCarBrandSchema.parse(req.body);

        // Duplicate check
        const existingBrand = await db.select()
          .from(carBrands)
          .where(eq(carBrands.name, validatedData.name))
          .limit(1);

        if (existingBrand.length > 0) {
          return res.status(409).json({
            success: false,
            message: "Bu marka adı zaten kayıtlı.",
            error: "DUPLICATE_BRAND",
            timestamp: new Date().toISOString()
          });
        }

        const [result] = await db.insert(carBrands)
          .values(validatedData)
          .returning();

        await logApiRequest(req, "/api/secure/addCarBrand", "POST", 201);

        res.status(201).json({
          success: true,
          message: "Araç markası başarıyla eklendi.",
          data: result,
          clientInfo: {
            id: req.apiClient!.id,
            name: req.apiClient!.name,
            companyId: req.apiClient!.companyId
          },
          timestamp: new Date().toISOString()
        });

      } catch (error: any) {
        console.error("Car brand add error:", error);
        await logApiRequest(req, "/api/secure/addCarBrand", "POST", 400, error?.message);
        
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
          message: "Araç markası eklenirken hata oluştu.",
          error: error?.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  );

  // PUT /api/secure/updateCarBrand/:id
  app.put("/api/secure/updateCarBrand/:id",
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

        const validatedData = insertCarBrandSchema.partial().parse(req.body);

        const existing = await db.select()
          .from(carBrands)
          .where(eq(carBrands.id, id))
          .limit(1);

        if (existing.length === 0) {
          return res.status(404).json({
            success: false,
            message: "Araç markası bulunamadı.",
            error: "Not found",
            timestamp: new Date().toISOString()
          });
        }

        const [result] = await db.update(carBrands)
          .set(validatedData)
          .where(eq(carBrands.id, id))
          .returning();

        await logApiRequest(req, "/api/secure/updateCarBrand", "PUT", 200);

        res.json({
          success: true,
          message: "Araç markası başarıyla güncellendi.",
          data: result,
          clientInfo: {
            id: req.apiClient!.id,
            name: req.apiClient!.name,
            companyId: req.apiClient!.companyId
          },
          timestamp: new Date().toISOString()
        });

      } catch (error: any) {
        console.error("Car brand update error:", error);
        await logApiRequest(req, "/api/secure/updateCarBrand", "PUT", 400, error?.message);
        
        res.status(500).json({
          success: false,
          message: "Araç markası güncellenirken hata oluştu.",
          error: error?.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  );

  // DELETE /api/secure/deleteCarBrand/:id
  app.delete("/api/secure/deleteCarBrand/:id",
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

        const existing = await db.select()
          .from(carBrands)
          .where(eq(carBrands.id, id))
          .limit(1);

        if (existing.length === 0) {
          return res.status(404).json({
            success: false,
            message: "Araç markası bulunamadı.",
            error: "Not found",
            timestamp: new Date().toISOString()
          });
        }

        const [result] = await db.update(carBrands)
          .set({ isActive: false })
          .where(eq(carBrands.id, id))
          .returning();

        await logApiRequest(req, "/api/secure/deleteCarBrand", "DELETE", 200);

        res.json({
          success: true,
          message: "Araç markası başarıyla silindi.",
          data: result,
          clientInfo: {
            id: req.apiClient!.id,
            name: req.apiClient!.name,
            companyId: req.apiClient!.companyId
          },
          timestamp: new Date().toISOString()
        });

      } catch (error: any) {
        console.error("Car brand delete error:", error);
        await logApiRequest(req, "/api/secure/deleteCarBrand", "DELETE", 500, error?.message);
        
        res.status(500).json({
          success: false,
          message: "Araç markası silinirken hata oluştu.",
          error: error?.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  );

  // ========================
  // CAR MODELS CRUD API (UPDATE, DELETE)
  // ========================

  // PUT /api/secure/updateCarModel/:id
  app.put("/api/secure/updateCarModel/:id",
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

        const validatedData = insertCarModelSchema.partial().parse(req.body);

        const existing = await db.select()
          .from(carModels)
          .where(eq(carModels.id, id))
          .limit(1);

        if (existing.length === 0) {
          return res.status(404).json({
            success: false,
            message: "Araç modeli bulunamadı.",
            error: "Not found",
            timestamp: new Date().toISOString()
          });
        }

        const [result] = await db.update(carModels)
          .set(validatedData)
          .where(eq(carModels.id, id))
          .returning();

        await logApiRequest(req, "/api/secure/updateCarModel", "PUT", 200);

        res.json({
          success: true,
          message: "Araç modeli başarıyla güncellendi.",
          data: result,
          clientInfo: {
            id: req.apiClient!.id,
            name: req.apiClient!.name,
            companyId: req.apiClient!.companyId
          },
          timestamp: new Date().toISOString()
        });

      } catch (error: any) {
        console.error("Car model update error:", error);
        await logApiRequest(req, "/api/secure/updateCarModel", "PUT", 400, error?.message);
        
        res.status(500).json({
          success: false,
          message: "Araç modeli güncellenirken hata oluştu.",
          error: error?.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  );

  // DELETE /api/secure/deleteCarModel/:id
  app.delete("/api/secure/deleteCarModel/:id",
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

        const existing = await db.select()
          .from(carModels)
          .where(eq(carModels.id, id))
          .limit(1);

        if (existing.length === 0) {
          return res.status(404).json({
            success: false,
            message: "Araç modeli bulunamadı.",
            error: "Not found",
            timestamp: new Date().toISOString()
          });
        }

        const [result] = await db.update(carModels)
          .set({ isActive: false })
          .where(eq(carModels.id, id))
          .returning();

        await logApiRequest(req, "/api/secure/deleteCarModel", "DELETE", 200);

        res.json({
          success: true,
          message: "Araç modeli başarıyla silindi.",
          data: result,
          clientInfo: {
            id: req.apiClient!.id,
            name: req.apiClient!.name,
            companyId: req.apiClient!.companyId
          },
          timestamp: new Date().toISOString()
        });

      } catch (error: any) {
        console.error("Car model delete error:", error);
        await logApiRequest(req, "/api/secure/deleteCarModel", "DELETE", 500, error?.message);
        
        res.status(500).json({
          success: false,
          message: "Araç modeli silinirken hata oluştu.",
          error: error?.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  );

  // ========================
  // OWNERSHIP TYPES CRUD API (UPDATE, DELETE)
  // ========================

  // PUT /api/secure/updateOwnershipType/:id
  app.put("/api/secure/updateOwnershipType/:id",
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

        const validatedData = updateOwnershipTypeSchema.parse(req.body);

        const existing = await db.select()
          .from(ownershipTypes)
          .where(eq(ownershipTypes.id, id))
          .limit(1);

        if (existing.length === 0) {
          return res.status(404).json({
            success: false,
            message: "Sahiplik türü bulunamadı.",
            error: "Not found",
            timestamp: new Date().toISOString()
          });
        }

        const [result] = await db.update(ownershipTypes)
          .set(validatedData)
          .where(eq(ownershipTypes.id, id))
          .returning();

        await logApiRequest(req, "/api/secure/updateOwnershipType", "PUT", 200);

        res.json({
          success: true,
          message: "Sahiplik türü başarıyla güncellendi.",
          data: result,
          clientInfo: {
            id: req.apiClient!.id,
            name: req.apiClient!.name,
            companyId: req.apiClient!.companyId
          },
          timestamp: new Date().toISOString()
        });

      } catch (error: any) {
        console.error("Ownership type update error:", error);
        await logApiRequest(req, "/api/secure/updateOwnershipType", "PUT", 400, error?.message);
        
        res.status(500).json({
          success: false,
          message: "Sahiplik türü güncellenirken hata oluştu.",
          error: error?.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  );

  // DELETE /api/secure/deleteOwnershipType/:id
  app.delete("/api/secure/deleteOwnershipType/:id",
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

        const existing = await db.select()
          .from(ownershipTypes)
          .where(eq(ownershipTypes.id, id))
          .limit(1);

        if (existing.length === 0) {
          return res.status(404).json({
            success: false,
            message: "Sahiplik türü bulunamadı.",
            error: "Not found",
            timestamp: new Date().toISOString()
          });
        }

        const [result] = await db.update(ownershipTypes)
          .set({ isActive: false })
          .where(eq(ownershipTypes.id, id))
          .returning();

        await logApiRequest(req, "/api/secure/deleteOwnershipType", "DELETE", 200);

        res.json({
          success: true,
          message: "Sahiplik türü başarıyla silindi.",
          data: result,
          clientInfo: {
            id: req.apiClient!.id,
            name: req.apiClient!.name,
            companyId: req.apiClient!.companyId
          },
          timestamp: new Date().toISOString()
        });

      } catch (error: any) {
        console.error("Ownership type delete error:", error);
        await logApiRequest(req, "/api/secure/deleteOwnershipType", "DELETE", 500, error?.message);
        
        res.status(500).json({
          success: false,
          message: "Sahiplik türü silinirken hata oluştu.",
          error: error?.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  );

  // ========================
  // PERSONNEL POSITIONS CRUD API (UPDATE, DELETE)
  // ========================

  // PUT /api/secure/updatePersonnelPosition/:id
  app.put("/api/secure/updatePersonnelPosition/:id",
    authenticateApiKey,
    authorizeEndpoint(["data:write", "company:write"]),
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

        const validatedData = updatePersonnelPositionSchema.parse(req.body);

        const existing = await db.select()
          .from(personnelPositions)
          .where(eq(personnelPositions.id, id))
          .limit(1);

        if (existing.length === 0) {
          return res.status(404).json({
            success: false,
            message: "Personel pozisyonu bulunamadı.",
            error: "Not found",
            timestamp: new Date().toISOString()
          });
        }

        const [result] = await db.update(personnelPositions)
          .set(validatedData)
          .where(eq(personnelPositions.id, id))
          .returning();

        await logApiRequest(req, "/api/secure/updatePersonnelPosition", "PUT", 200);

        res.json({
          success: true,
          message: "Personel pozisyonu başarıyla güncellendi.",
          data: result,
          clientInfo: {
            id: req.apiClient!.id,
            name: req.apiClient!.name,
            companyId: req.apiClient!.companyId
          },
          timestamp: new Date().toISOString()
        });

      } catch (error: any) {
        console.error("Personnel position update error:", error);
        await logApiRequest(req, "/api/secure/updatePersonnelPosition", "PUT", 400, error?.message);
        
        res.status(500).json({
          success: false,
          message: "Personel pozisyonu güncellenirken hata oluştu.",
          error: error?.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  );

  // DELETE /api/secure/deletePersonnelPosition/:id
  app.delete("/api/secure/deletePersonnelPosition/:id",
    authenticateApiKey,
    authorizeEndpoint(["data:delete", "company:delete"]),
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

        const existing = await db.select()
          .from(personnelPositions)
          .where(eq(personnelPositions.id, id))
          .limit(1);

        if (existing.length === 0) {
          return res.status(404).json({
            success: false,
            message: "Personel pozisyonu bulunamadı.",
            error: "Not found",
            timestamp: new Date().toISOString()
          });
        }

        const [result] = await db.update(personnelPositions)
          .set({ isActive: false })
          .where(eq(personnelPositions.id, id))
          .returning();

        await logApiRequest(req, "/api/secure/deletePersonnelPosition", "DELETE", 200);

        res.json({
          success: true,
          message: "Personel pozisyonu başarıyla silindi.",
          data: result,
          clientInfo: {
            id: req.apiClient!.id,
            name: req.apiClient!.name,
            companyId: req.apiClient!.companyId
          },
          timestamp: new Date().toISOString()
        });

      } catch (error: any) {
        console.error("Personnel position delete error:", error);
        await logApiRequest(req, "/api/secure/deletePersonnelPosition", "DELETE", 500, error?.message);
        
        res.status(500).json({
          success: false,
          message: "Personel pozisyonu silinirken hata oluştu.",
          error: error?.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  );

  // ========================
  // POLICY TYPES CRUD API (UPDATE, DELETE)
  // ========================

  // PUT /api/secure/updatePolicyType/:id
  app.put("/api/secure/updatePolicyType/:id",
    authenticateApiKey,
    authorizeEndpoint(["data:write", "company:write"]),
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

        const validatedData = insertPolicyTypeSchema.partial().parse(req.body);

        const existing = await db.select().from(policyTypes).where(eq(policyTypes.id, id)).limit(1);
        if (existing.length === 0) {
          return res.status(404).json({
            success: false,
            message: "Poliçe türü bulunamadı.",
            error: "Not found",
            timestamp: new Date().toISOString()
          });
        }

        const [result] = await db.update(policyTypes).set(validatedData).where(eq(policyTypes.id, id)).returning();
        await logApiRequest(req, "/api/secure/updatePolicyType", "PUT", 200);

        res.json({
          success: true,
          message: "Poliçe türü başarıyla güncellendi.",
          data: result,
          clientInfo: { id: req.apiClient!.id, name: req.apiClient!.name, companyId: req.apiClient!.companyId },
          timestamp: new Date().toISOString()
        });
      } catch (error: any) {
        await logApiRequest(req, "/api/secure/updatePolicyType", "PUT", 400, error?.message);
        res.status(500).json({
          success: false,
          message: "Poliçe türü güncellenirken hata oluştu.",
          error: error?.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  );

  // DELETE /api/secure/deletePolicyType/:id
  app.delete("/api/secure/deletePolicyType/:id",
    authenticateApiKey,
    authorizeEndpoint(["data:delete", "company:delete"]),
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

        const existing = await db.select().from(policyTypes).where(eq(policyTypes.id, id)).limit(1);
        if (existing.length === 0) {
          return res.status(404).json({
            success: false,
            message: "Poliçe türü bulunamadı.",
            error: "Not found",
            timestamp: new Date().toISOString()
          });
        }

        const [result] = await db.update(policyTypes).set({ isActive: false }).where(eq(policyTypes.id, id)).returning();
        await logApiRequest(req, "/api/secure/deletePolicyType", "DELETE", 200);

        res.json({
          success: true,
          message: "Poliçe türü başarıyla silindi.",
          data: result,
          clientInfo: { id: req.apiClient!.id, name: req.apiClient!.name, companyId: req.apiClient!.companyId },
          timestamp: new Date().toISOString()
        });
      } catch (error: any) {
        await logApiRequest(req, "/api/secure/deletePolicyType", "DELETE", 500, error?.message);
        res.status(500).json({
          success: false,
          message: "Poliçe türü silinirken hata oluştu.",
          error: error?.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  );

  // ========================
  // MAINTENANCE TYPES CRUD API (UPDATE, DELETE)
  // ========================

  // PUT /api/secure/updateMaintenanceType/:id
  app.put("/api/secure/updateMaintenanceType/:id",
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

        const validatedData = insertMaintenanceTypeSchema.partial().parse(req.body);

        const existing = await db.select().from(maintenanceTypes).where(eq(maintenanceTypes.id, id)).limit(1);
        if (existing.length === 0) {
          return res.status(404).json({
            success: false,
            message: "Bakım türü bulunamadı.",
            error: "Not found",
            timestamp: new Date().toISOString()
          });
        }

        const [result] = await db.update(maintenanceTypes).set(validatedData).where(eq(maintenanceTypes.id, id)).returning();
        await logApiRequest(req, "/api/secure/updateMaintenanceType", "PUT", 200);

        res.json({
          success: true,
          message: "Bakım türü başarıyla güncellendi.",
          data: result,
          clientInfo: { id: req.apiClient!.id, name: req.apiClient!.name, companyId: req.apiClient!.companyId },
          timestamp: new Date().toISOString()
        });
      } catch (error: any) {
        await logApiRequest(req, "/api/secure/updateMaintenanceType", "PUT", 400, error?.message);
        res.status(500).json({
          success: false,
          message: "Bakım türü güncellenirken hata oluştu.",
          error: error?.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  );

  // DELETE /api/secure/deleteMaintenanceType/:id
  app.delete("/api/secure/deleteMaintenanceType/:id",
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

        const existing = await db.select().from(maintenanceTypes).where(eq(maintenanceTypes.id, id)).limit(1);
        if (existing.length === 0) {
          return res.status(404).json({
            success: false,
            message: "Bakım türü bulunamadı.",
            error: "Not found",
            timestamp: new Date().toISOString()
          });
        }

        const [result] = await db.update(maintenanceTypes).set({ isActive: false }).where(eq(maintenanceTypes.id, id)).returning();
        await logApiRequest(req, "/api/secure/deleteMaintenanceType", "DELETE", 200);

        res.json({
          success: true,
          message: "Bakım türü başarıyla silindi.",
          data: result,
          clientInfo: { id: req.apiClient!.id, name: req.apiClient!.name, companyId: req.apiClient!.companyId },
          timestamp: new Date().toISOString()
        });
      } catch (error: any) {
        await logApiRequest(req, "/api/secure/deleteMaintenanceType", "DELETE", 500, error?.message);
        res.status(500).json({
          success: false,
          message: "Bakım türü silinirken hata oluştu.",
          error: error?.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  );

  // ========================
  // PENALTY TYPES DELETE API
  // ========================

  // DELETE /api/secure/deletePenaltyType/:id
  app.delete("/api/secure/deletePenaltyType/:id",
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

        const existing = await db.select().from(penaltyTypes).where(eq(penaltyTypes.id, id)).limit(1);
        if (existing.length === 0) {
          return res.status(404).json({
            success: false,
            message: "Ceza türü bulunamadı.",
            error: "Not found",
            timestamp: new Date().toISOString()
          });
        }

        const [result] = await db.update(penaltyTypes).set({ isActive: false }).where(eq(penaltyTypes.id, id)).returning();
        await logApiRequest(req, "/api/secure/deletePenaltyType", "DELETE", 200);

        res.json({
          success: true,
          message: "Ceza türü başarıyla silindi.",
          data: result,
          clientInfo: { id: req.apiClient!.id, name: req.apiClient!.name, companyId: req.apiClient!.companyId },
          timestamp: new Date().toISOString()
        });
      } catch (error: any) {
        await logApiRequest(req, "/api/secure/deletePenaltyType", "DELETE", 500, error?.message);
        res.status(500).json({
          success: false,
          message: "Ceza türü silinirken hata oluştu.",
          error: error?.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  );

  // ========================
  // CITIES CRUD API (CREATE, UPDATE, DELETE)
  // ========================

  // POST /api/secure/addCity
  app.post("/api/secure/addCity",
    authenticateApiKey,
    authorizeEndpoint(["data:write", "admin:write"]),
    rateLimitMiddleware,
    async (req: ApiRequest, res: any) => {
      try {
        const validatedData = insertCitySchema.parse(req.body);

        const existing = await db.select().from(cities).where(eq(cities.name, validatedData.name)).limit(1);
        if (existing.length > 0) {
          return res.status(409).json({
            success: false,
            message: "Bu şehir adı zaten kayıtlı.",
            error: "DUPLICATE_CITY",
            timestamp: new Date().toISOString()
          });
        }

        const [result] = await db.insert(cities).values(validatedData).returning();
        await logApiRequest(req, "/api/secure/addCity", "POST", 201);

        res.status(201).json({
          success: true,
          message: "Şehir başarıyla eklendi.",
          data: result,
          clientInfo: { id: req.apiClient!.id, name: req.apiClient!.name, companyId: req.apiClient!.companyId },
          timestamp: new Date().toISOString()
        });
      } catch (error: any) {
        await logApiRequest(req, "/api/secure/addCity", "POST", 400, error?.message);
        res.status(500).json({
          success: false,
          message: "Şehir eklenirken hata oluştu.",
          error: error?.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  );

  // PUT /api/secure/updateCity/:id  
  app.put("/api/secure/updateCity/:id",
    authenticateApiKey,
    authorizeEndpoint(["data:write", "admin:write"]),
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

        const validatedData = insertCitySchema.partial().parse(req.body);

        const existing = await db.select().from(cities).where(eq(cities.id, id)).limit(1);
        if (existing.length === 0) {
          return res.status(404).json({
            success: false,
            message: "Şehir bulunamadı.",
            error: "Not found",
            timestamp: new Date().toISOString()
          });
        }

        const [result] = await db.update(cities).set(validatedData).where(eq(cities.id, id)).returning();
        await logApiRequest(req, "/api/secure/updateCity", "PUT", 200);

        res.json({
          success: true,
          message: "Şehir başarıyla güncellendi.",
          data: result,
          clientInfo: { id: req.apiClient!.id, name: req.apiClient!.name, companyId: req.apiClient!.companyId },
          timestamp: new Date().toISOString()
        });
      } catch (error: any) {
        await logApiRequest(req, "/api/secure/updateCity", "PUT", 400, error?.message);
        res.status(500).json({
          success: false,
          message: "Şehir güncellenirken hata oluştu.",
          error: error?.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  );

  // DELETE /api/secure/deleteCity/:id
  app.delete("/api/secure/deleteCity/:id",
    authenticateApiKey,
    authorizeEndpoint(["data:delete", "admin:delete"]),
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

        const existing = await db.select().from(cities).where(eq(cities.id, id)).limit(1);
        if (existing.length === 0) {
          return res.status(404).json({
            success: false,
            message: "Şehir bulunamadı.",
            error: "Not found",
            timestamp: new Date().toISOString()
          });
        }

        const [result] = await db.update(cities).set({ isActive: false }).where(eq(cities.id, id)).returning();
        await logApiRequest(req, "/api/secure/deleteCity", "DELETE", 200);

        res.json({
          success: true,
          message: "Şehir başarıyla silindi.",
          data: result,
          clientInfo: { id: req.apiClient!.id, name: req.apiClient!.name, companyId: req.apiClient!.companyId },
          timestamp: new Date().toISOString()
        });
      } catch (error: any) {
        await logApiRequest(req, "/api/secure/deleteCity", "DELETE", 500, error?.message);
        res.status(500).json({
          success: false,
          message: "Şehir silinirken hata oluştu.",
          error: error?.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  );

  // ========================
  // COUNTRIES CRUD API (CREATE, UPDATE, DELETE)
  // ========================

  // POST /api/secure/addCountry
  app.post("/api/secure/addCountry",
    authenticateApiKey,
    authorizeEndpoint(["data:write", "admin:write"]),
    rateLimitMiddleware,
    async (req: ApiRequest, res: any) => {
      try {
        const validatedData = insertCountrySchema.parse(req.body);

        const existing = await db.select().from(countries).where(eq(countries.name, validatedData.name)).limit(1);
        if (existing.length > 0) {
          return res.status(409).json({
            success: false,
            message: "Bu ülke adı zaten kayıtlı.",
            error: "DUPLICATE_COUNTRY",
            timestamp: new Date().toISOString()
          });
        }

        const [result] = await db.insert(countries).values(validatedData).returning();
        await logApiRequest(req, "/api/secure/addCountry", "POST", 201);

        res.status(201).json({
          success: true,
          message: "Ülke başarıyla eklendi.",
          data: result,
          clientInfo: { id: req.apiClient!.id, name: req.apiClient!.name, companyId: req.apiClient!.companyId },
          timestamp: new Date().toISOString()
        });
      } catch (error: any) {
        await logApiRequest(req, "/api/secure/addCountry", "POST", 400, error?.message);
        res.status(500).json({
          success: false,
          message: "Ülke eklenirken hata oluştu.",
          error: error?.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  );

  // PUT /api/secure/updateCountry/:id
  app.put("/api/secure/updateCountry/:id",
    authenticateApiKey,
    authorizeEndpoint(["data:write", "admin:write"]),
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

        const validatedData = insertCountrySchema.partial().parse(req.body);

        const existing = await db.select().from(countries).where(eq(countries.id, id)).limit(1);
        if (existing.length === 0) {
          return res.status(404).json({
            success: false,
            message: "Ülke bulunamadı.",
            error: "Not found",
            timestamp: new Date().toISOString()
          });
        }

        const [result] = await db.update(countries).set(validatedData).where(eq(countries.id, id)).returning();
        await logApiRequest(req, "/api/secure/updateCountry", "PUT", 200);

        res.json({
          success: true,
          message: "Ülke başarıyla güncellendi.",
          data: result,
          clientInfo: { id: req.apiClient!.id, name: req.apiClient!.name, companyId: req.apiClient!.companyId },
          timestamp: new Date().toISOString()
        });
      } catch (error: any) {
        await logApiRequest(req, "/api/secure/updateCountry", "PUT", 400, error?.message);
        res.status(500).json({
          success: false,
          message: "Ülke güncellenirken hata oluştu.",
          error: error?.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  );

  // DELETE /api/secure/deleteCountry/:id
  app.delete("/api/secure/deleteCountry/:id",
    authenticateApiKey,
    authorizeEndpoint(["data:delete", "admin:delete"]),
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

        const existing = await db.select().from(countries).where(eq(countries.id, id)).limit(1);
        if (existing.length === 0) {
          return res.status(404).json({
            success: false,
            message: "Ülke bulunamadı.",
            error: "Not found",
            timestamp: new Date().toISOString()
          });
        }

        const [result] = await db.update(countries).set({ isActive: false }).where(eq(countries.id, id)).returning();
        await logApiRequest(req, "/api/secure/deleteCountry", "DELETE", 200);

        res.json({
          success: true,
          message: "Ülke başarıyla silindi.",
          data: result,
          clientInfo: { id: req.apiClient!.id, name: req.apiClient!.name, companyId: req.apiClient!.companyId },
          timestamp: new Date().toISOString()
        });
      } catch (error: any) {
        await logApiRequest(req, "/api/secure/deleteCountry", "DELETE", 500, error?.message);
        res.status(500).json({
          success: false,
          message: "Ülke silinirken hata oluştu.",
          error: error?.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  );

  // ========================
  // CAR TYPES CRUD API (CREATE, UPDATE, DELETE)
  // ========================

  // POST /api/secure/addCarType
  app.post("/api/secure/addCarType",
    authenticateApiKey,
    authorizeEndpoint(["data:write", "asset:write"]),
    rateLimitMiddleware,
    async (req: ApiRequest, res: any) => {
      try {
        const validatedData = insertCarTypeSchema.parse(req.body);

        const existing = await db.select().from(carTypes).where(eq(carTypes.name, validatedData.name)).limit(1);
        if (existing.length > 0) {
          return res.status(409).json({
            success: false,
            message: "Bu araç tipi zaten kayıtlı.",
            error: "DUPLICATE_CAR_TYPE",
            timestamp: new Date().toISOString()
          });
        }

        const [result] = await db.insert(carTypes).values(validatedData).returning();
        await logApiRequest(req, "/api/secure/addCarType", "POST", 201);

        res.status(201).json({
          success: true,
          message: "Araç tipi başarıyla eklendi.",
          data: result,
          clientInfo: { id: req.apiClient!.id, name: req.apiClient!.name, companyId: req.apiClient!.companyId },
          timestamp: new Date().toISOString()
        });
      } catch (error: any) {
        await logApiRequest(req, "/api/secure/addCarType", "POST", 400, error?.message);
        res.status(500).json({
          success: false,
          message: "Araç tipi eklenirken hata oluştu.",
          error: error?.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  );

  // PUT /api/secure/updateCarType/:id
  app.put("/api/secure/updateCarType/:id",
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

        const validatedData = insertCarTypeSchema.partial().parse(req.body);

        const existing = await db.select().from(carTypes).where(eq(carTypes.id, id)).limit(1);
        if (existing.length === 0) {
          return res.status(404).json({
            success: false,
            message: "Araç tipi bulunamadı.",
            error: "Not found",
            timestamp: new Date().toISOString()
          });
        }

        const [result] = await db.update(carTypes).set(validatedData).where(eq(carTypes.id, id)).returning();
        await logApiRequest(req, "/api/secure/updateCarType", "PUT", 200);

        res.json({
          success: true,
          message: "Araç tipi başarıyla güncellendi.",
          data: result,
          clientInfo: { id: req.apiClient!.id, name: req.apiClient!.name, companyId: req.apiClient!.companyId },
          timestamp: new Date().toISOString()
        });
      } catch (error: any) {
        await logApiRequest(req, "/api/secure/updateCarType", "PUT", 400, error?.message);
        res.status(500).json({
          success: false,
          message: "Araç tipi güncellenirken hata oluştu.",
          error: error?.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  );

  // DELETE /api/secure/deleteCarType/:id
  app.delete("/api/secure/deleteCarType/:id",
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

        const existing = await db.select().from(carTypes).where(eq(carTypes.id, id)).limit(1);
        if (existing.length === 0) {
          return res.status(404).json({
            success: false,
            message: "Araç tipi bulunamadı.",
            error: "Not found",
            timestamp: new Date().toISOString()
          });
        }

        const [result] = await db.update(carTypes).set({ isActive: false }).where(eq(carTypes.id, id)).returning();
        await logApiRequest(req, "/api/secure/deleteCarType", "DELETE", 200);

        res.json({
          success: true,
          message: "Araç tipi başarıyla silindi.",
          data: result,
          clientInfo: { id: req.apiClient!.id, name: req.apiClient!.name, companyId: req.apiClient!.companyId },
          timestamp: new Date().toISOString()
        });
      } catch (error: any) {
        await logApiRequest(req, "/api/secure/deleteCarType", "DELETE", 500, error?.message);
        res.status(500).json({
          success: false,
          message: "Araç tipi silinirken hata oluştu.",
          error: error?.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  );

  // ========================
  // PAYMENT METHODS CRUD API (CREATE, UPDATE, DELETE, GET)
  // ========================

  // POST /api/secure/addPaymentMethod
  app.post("/api/secure/addPaymentMethod",
    authenticateApiKey,
    authorizeEndpoint(["data:write", "company:write"]),
    rateLimitMiddleware,
    async (req: ApiRequest, res: any) => {
      try {
        const validatedData = insertPaymentMethodSchema.parse(req.body);

        const existing = await db.select().from(paymentMethods).where(eq(paymentMethods.name, validatedData.name)).limit(1);
        if (existing.length > 0) {
          return res.status(409).json({
            success: false,
            message: "Bu ödeme yöntemi zaten kayıtlı.",
            error: "DUPLICATE_PAYMENT_METHOD",
            timestamp: new Date().toISOString()
          });
        }

        const [result] = await db.insert(paymentMethods).values(validatedData).returning();
        await logApiRequest(req, "/api/secure/addPaymentMethod", "POST", 201);

        res.status(201).json({
          success: true,
          message: "Ödeme yöntemi başarıyla eklendi.",
          data: result,
          clientInfo: { id: req.apiClient!.id, name: req.apiClient!.name, companyId: req.apiClient!.companyId },
          timestamp: new Date().toISOString()
        });
      } catch (error: any) {
        await logApiRequest(req, "/api/secure/addPaymentMethod", "POST", 400, error?.message);
        res.status(500).json({
          success: false,
          message: "Ödeme yöntemi eklenirken hata oluştu.",
          error: error?.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  );

  // PUT /api/secure/updatePaymentMethod/:id
  app.put("/api/secure/updatePaymentMethod/:id",
    authenticateApiKey,
    authorizeEndpoint(["data:write", "company:write"]),
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

        const validatedData = insertPaymentMethodSchema.partial().parse(req.body);

        const existing = await db.select().from(paymentMethods).where(eq(paymentMethods.id, id)).limit(1);
        if (existing.length === 0) {
          return res.status(404).json({
            success: false,
            message: "Ödeme yöntemi bulunamadı.",
            error: "Not found",
            timestamp: new Date().toISOString()
          });
        }

        const [result] = await db.update(paymentMethods).set(validatedData).where(eq(paymentMethods.id, id)).returning();
        await logApiRequest(req, "/api/secure/updatePaymentMethod", "PUT", 200);

        res.json({
          success: true,
          message: "Ödeme yöntemi başarıyla güncellendi.",
          data: result,
          clientInfo: { id: req.apiClient!.id, name: req.apiClient!.name, companyId: req.apiClient!.companyId },
          timestamp: new Date().toISOString()
        });
      } catch (error: any) {
        await logApiRequest(req, "/api/secure/updatePaymentMethod", "PUT", 400, error?.message);
        res.status(500).json({
          success: false,
          message: "Ödeme yöntemi güncellenirken hata oluştu.",
          error: error?.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  );

  // DELETE /api/secure/deletePaymentMethod/:id
  app.delete("/api/secure/deletePaymentMethod/:id",
    authenticateApiKey,
    authorizeEndpoint(["data:delete", "company:delete"]),
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

        const existing = await db.select().from(paymentMethods).where(eq(paymentMethods.id, id)).limit(1);
        if (existing.length === 0) {
          return res.status(404).json({
            success: false,
            message: "Ödeme yöntemi bulunamadı.",
            error: "Not found",
            timestamp: new Date().toISOString()
          });
        }

        const [result] = await db.update(paymentMethods).set({ isActive: false }).where(eq(paymentMethods.id, id)).returning();
        await logApiRequest(req, "/api/secure/deletePaymentMethod", "DELETE", 200);

        res.json({
          success: true,
          message: "Ödeme yöntemi başarıyla silindi.",
          data: result,
          clientInfo: { id: req.apiClient!.id, name: req.apiClient!.name, companyId: req.apiClient!.companyId },
          timestamp: new Date().toISOString()
        });
      } catch (error: any) {
        await logApiRequest(req, "/api/secure/deletePaymentMethod", "DELETE", 500, error?.message);
        res.status(500).json({
          success: false,
          message: "Ödeme yöntemi silinirken hata oluştu.",
          error: error?.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  );

  // ========================
  // DOC MAIN TYPES API (POST)
  // ========================

  // POST /api/secure/addDocMainType
  app.post("/api/secure/addDocMainType",
    authenticateApiKey,
    authorizeEndpoint(["data:write", "document:write"]),
    rateLimitMiddleware,
    async (req: ApiRequest, res: any) => {
      try {
        const validatedData = insertDocMainTypeSchema.parse(req.body);

        const existing = await db.select().from(docMainTypes).where(eq(docMainTypes.name, validatedData.name)).limit(1);
        if (existing.length > 0) {
          return res.status(409).json({
            success: false,
            message: "Bu dokuman ana türü zaten kayıtlı.",
            error: "DUPLICATE_DOC_MAIN_TYPE",
            timestamp: new Date().toISOString()
          });
        }

        const [result] = await db.insert(docMainTypes).values(validatedData).returning();
        await logApiRequest(req, "/api/secure/addDocMainType", "POST", 201);

        res.status(201).json({
          success: true,
          message: "Dokuman ana türü başarıyla eklendi.",
          data: result,
          clientInfo: { id: req.apiClient!.id, name: req.apiClient!.name, companyId: req.apiClient!.companyId },
          timestamp: new Date().toISOString()
        });
      } catch (error: any) {
        await logApiRequest(req, "/api/secure/addDocMainType", "POST", 400, error?.message);
        res.status(500).json({
          success: false,
          message: "Dokuman ana türü eklenirken hata oluştu.",
          error: error?.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  );

  // ========================
  // DOC SUB TYPES API (POST)
  // ========================

  // POST /api/secure/addDocSubType
  app.post("/api/secure/addDocSubType",
    authenticateApiKey,
    authorizeEndpoint(["data:write", "document:write"]),
    rateLimitMiddleware,
    async (req: ApiRequest, res: any) => {
      try {
        const validatedData = insertDocSubTypeSchema.parse(req.body);

        const existing = await db.select().from(docSubTypes).where(eq(docSubTypes.name, validatedData.name)).limit(1);
        if (existing.length > 0) {
          return res.status(409).json({
            success: false,
            message: "Bu dokuman alt türü zaten kayıtlı.",
            error: "DUPLICATE_DOC_SUB_TYPE",
            timestamp: new Date().toISOString()
          });
        }

        const [result] = await db.insert(docSubTypes).values(validatedData).returning();
        await logApiRequest(req, "/api/secure/addDocSubType", "POST", 201);

        res.status(201).json({
          success: true,
          message: "Dokuman alt türü başarıyla eklendi.",
          data: result,
          clientInfo: { id: req.apiClient!.id, name: req.apiClient!.name, companyId: req.apiClient!.companyId },
          timestamp: new Date().toISOString()
        });
      } catch (error: any) {
        await logApiRequest(req, "/api/secure/addDocSubType", "POST", 400, error?.message);
        res.status(500).json({
          success: false,
          message: "Dokuman alt türü eklenirken hata oluştu.",
          error: error?.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  );
}
