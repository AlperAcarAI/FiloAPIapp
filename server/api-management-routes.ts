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
  countries
} from "@shared/schema";
import { 
  insertApiClientSchema,
  insertApiKeySchema,
  insertApiEndpointSchema,
  insertRoleSchema,
  insertPermissionSchema
} from "@shared/schema";
import { eq, and, desc, sql, count, avg, gte } from "drizzle-orm";
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

export function registerApiManagementRoutes(app: Express) {
  
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