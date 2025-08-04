import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
// Authentication removed
import { insertAssetSchema, updateAssetSchema, type Asset, type InsertAsset, type UpdateAsset, cities, type City, companies, users } from "@shared/schema";
// Token management imports removed
import { z } from "zod";
import { db } from "./db";
import { assets } from "@shared/schema";
import { eq, desc, asc, sql, like, ilike, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { registerApiManagementRoutes } from "./api-management-routes";
import documentRoutes from "./document-routes.js";
import companyRoutes from "./company-routes.js";
import assetRoutes from "./asset-routes.js";
import apiAnalyticsRoutes from "./api-analytics-routes.js";
import { apiAnalyticsMiddleware } from "./api-analytics-middleware.js";
import fuelRoutes from "./fuel-routes.js";
import bulkImportRoutes from "./bulk-import-routes.js";
import { 
  trackLoginAttempt, 
  isAccountLocked, 
  securityHeadersMiddleware,
  deviceFingerprintMiddleware,
  logSecurityEvent,
  type SecurityRequest 
} from "./security-middleware.js";
import { registerSecurityRoutes } from "./security-routes.js";
import { generateApiKey, hashApiKey } from "./api-security.js";
import { apiKeys, apiClients } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Security headers - tüm isteklere uygula
  app.use(securityHeadersMiddleware);
  
  // Device fingerprinting middleware
  app.use(deviceFingerprintMiddleware);

  // API Analytics middleware - Geçici olarak devre dışı

  // API route'larını kaydet
  app.use("/api/documents", documentRoutes);
  app.use("/api/trip-rentals", await import("./trip-rental-routes.js").then(m => m.default));

  // Tüm authentication endpoint'leri kaldırıldı
  // API'ler artık doğrudan erişilebilir durumda



  // Cities API - getCities endpoint - Filtreleme desteği ile
  app.get("/api/getCities", async (req, res) => {
    try {
      const { search, limit, offset, sortBy = 'name', sortOrder = 'asc' } = req.query;
      
      // Build the query with proper chaining
      const orderColumn = sortBy === 'id' ? cities.id : cities.name;
      const orderDirection = sortOrder === 'desc' ? desc(orderColumn) : asc(orderColumn);
      
      let citiesQuery = db.select({
        id: cities.id,
        name: cities.name
      })
      .from(cities);
      
      // Apply search filter if provided
      if (search) {
        citiesQuery = citiesQuery.where(ilike(cities.name, `%${search}%`));
      }
      
      // Apply ordering
      citiesQuery = citiesQuery.orderBy(orderDirection);
      
      // Apply pagination
      if (limit) {
        citiesQuery = citiesQuery.limit(Number(limit));
      }
      if (offset) {
        citiesQuery = citiesQuery.offset(Number(offset));
      }
      
      const citiesList = await citiesQuery;
      
      // Get total count
      const countQuery = db.select({ count: sql`count(*)` })
        .from(cities);
        
      let countQueryWithFilter = countQuery;
      if (search) {
        countQueryWithFilter = countQuery.where(ilike(cities.name, `%${search}%`));
      }
      
      const totalResult = await countQueryWithFilter;
      const totalCount = Number(totalResult[0].count);
      
      res.json({
        success: true,
        message: "Şehirler başarıyla getirildi",
        data: {
          cities: citiesList,
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
          }
        }
      });
    } catch (error) {
      console.error("Cities getirme hatası:", error);
      res.status(500).json({ 
        success: false,
        error: "CITIES_FETCH_ERROR",
        message: "Şehir listesi alınırken bir hata oluştu" 
      });
    }
  });

  // ========================
  // API KEY YÖNETİMİ (Artık authentication gerektirmiyor)
  // ========================

  // API key'lerini listele (authentication yok)
  app.get("/api/user/api-keys", async (req: Request, res: Response) => {
    try {
      const userApiKeys = await db
        .select({
          id: apiKeys.id,
          name: apiClients.name,
          permissions: apiKeys.permissions,
          allowedDomains: apiKeys.allowedDomains,
          isActive: apiKeys.isActive,
          createdAt: apiKeys.createdAt,
          lastUsedAt: apiKeys.lastUsedAt
        })
        .from(apiKeys)
        .leftJoin(apiClients, eq(apiKeys.clientId, apiClients.id))
        .where(and(
          eq(apiKeys.isActive, true),
          eq(apiClients.isActive, true)
        ));

      // Mask API keys for security
      const maskedKeys = userApiKeys.map(key => ({
        ...key,
        key: '•••••••••••' + (key.id.toString().slice(-4)) // Show last 4 digits of ID
      }));

      res.json({
        success: true,
        data: maskedKeys
      });
    } catch (error) {
      console.error("API keys listesi hatası:", error);
      res.status(500).json({
        success: false,
        error: "API_KEYS_FETCH_ERROR",
        message: "API keys listesi alınamadı"
      });
    }
  });

  // Yeni API key oluştur (Domain zorunlu) - authentication yok
  app.post("/api/user/api-keys", async (req: Request, res: Response) => {
    try {
      const { name, permissions, allowedDomains, userId = 1 } = req.body; // Default userId

      if (!name || !permissions || !allowedDomains) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_FIELDS',
          message: 'İsim, izinler ve allowed domains alanları zorunludur'
        });
      }

      if (!Array.isArray(allowedDomains) || allowedDomains.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_DOMAINS',
          message: 'En az bir domain belirtmelisiniz'
        });
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
      const apiKey = generateApiKey();  
      const keyHash = await hashApiKey(apiKey);

      const [newKey] = await db
        .insert(apiKeys)
        .values({
          clientId: newClient.id,
          keyHash,
          permissions,
          allowedDomains,
          isActive: true
        })
        .returning();

      res.status(201).json({
        success: true,
        message: "API key başarıyla oluşturuldu",
        data: {
          apiKey: {
            id: newKey.id,
            name,
            key: apiKey, // Tam API key sadece oluşturma anında
            permissions,
            allowedDomains,
            isActive: true,
            createdAt: newKey.createdAt,
            warning: "Bu tam API key sadece şimdi görüntüleniyor! Güvenli bir yerde saklayın."
          }
        }
      });
    } catch (error) {
      console.error("API key oluşturma hatası:", error);
      res.status(500).json({
        success: false,
        error: "API_KEY_CREATE_ERROR",
        message: "API key oluşturulamadı"
      });
    }
  });

  // API key sil (soft delete) - authentication yok
  app.delete("/api/user/api-keys/:keyId", async (req: Request, res: Response) => {
    try {
      const keyId = parseInt(req.params.keyId);

      if (!keyId) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_REQUEST',
          message: 'Geçersiz istek'
        });
      }

      // Key'in varlığını kontrol et
      const [existingKey] = await db
        .select()
        .from(apiKeys)
        .leftJoin(apiClients, eq(apiKeys.clientId, apiClients.id))
        .where(eq(apiKeys.id, keyId));

      if (!existingKey) {
        return res.status(404).json({
          success: false,
          error: 'API_KEY_NOT_FOUND',
          message: 'API key bulunamadı'
        });
      }

      // Soft delete - API key'i pasif yap
      await db
        .update(apiKeys)
        .set({ 
          isActive: false,
          lastUsedAt: new Date()
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
      console.error("API key silme hatası:", error);
      res.status(500).json({
        success: false,
        error: "API_KEY_DELETE_ERROR",
        message: "API key silinemedi"
      });
    }
  });

  // API Güvenlik ve Yönetim Route'larını kaydet
  registerApiManagementRoutes(app);

  // API Analytics routes
  app.use('/api/analytics', apiAnalyticsRoutes);

  // Document Management Route'larını kaydet  
  app.use('/api/documents', documentRoutes);
  
  // Company Management Route'larını kaydet
  app.use('/api', companyRoutes);

  // Asset Management Route'larını kaydet
  app.use('/api', assetRoutes);

  // Audit Route'larını kaydet
  const { registerAuditRoutes } = await import("./audit-routes");
  registerAuditRoutes(app);

  // Financial Route'larını kaydet
  const financialRoutes = await import("./financial-routes.js");
  app.use("/api/financial", financialRoutes.default);

  // Fuel Management Route'larını kaydet
  app.use('/api', fuelRoutes);

  // Bulk Import Route'larını kaydet
  app.use('/api', bulkImportRoutes);

  // Backend API Route'larını kaydet (Hiyerarşik sistem)
  const backendApiRoutes = await import("./backend-api.js");
  app.use("/api/backend", backendApiRoutes.default);

  // Permission Management Route'larını kaydet (Admin yetkisi gerekli)
  const permissionRoutes = await import("./permission-management-routes.js");
  app.use("/api/permission-management", permissionRoutes.default);

  // Security Route'larını kaydet (Advanced Security System)
  registerSecurityRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}