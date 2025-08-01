import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { tenantStorage } from "./tenant-storage.js";
import { authenticateToken, type AuthRequest } from "./auth";
import { insertAssetSchema, updateAssetSchema, type Asset, type InsertAsset, type UpdateAsset, cities, type City } from "@shared/schema";
import { generateTokenPair, validateRefreshToken, revokeRefreshToken, revokeAllUserRefreshTokens } from "./auth";
import { z } from "zod";
import { db } from "./db";
import { assets } from "@shared/schema";
import { eq, desc, asc, sql, like, ilike, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { registerApiManagementRoutes } from "./api-management-routes";
import documentRoutes from "./document-routes.js";
import companyRoutes from "./company-routes.js";
import assetRoutes from "./asset-routes.js";
import apiAnalyticsRoutes from "./api-analytics-routes.js";
import { apiAnalyticsMiddleware } from "./api-analytics-middleware.js";
import fuelRoutes from "./fuel-routes.js";
import bulkImportRoutes from "./bulk-import-routes.js";
import { 
  rateLimitMiddleware, 
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
import { tenantMiddleware, tenantDatabaseMiddleware, type TenantRequest } from "./tenant-middleware.js";
import tenantRoutes from "./tenant-routes.js";

export async function registerRoutes(app: Express): Promise<Server> {
  // Security headers - tüm isteklere uygula
  app.use(securityHeadersMiddleware);
  
  // Device fingerprinting middleware
  app.use(deviceFingerprintMiddleware);

  // Tenant middleware - tüm API endpoint'leri için
  app.use('/api', tenantMiddleware);
  app.use('/api', tenantDatabaseMiddleware);

  // Tenant management routes
  app.use('/api/tenant', tenantRoutes);

  // API Analytics middleware - Geçici olarak devre dışı

  // API route'larını kaydet - artık tenant-aware
  app.use("/api/documents", documentRoutes);
  app.use("/api/trip-rentals", await import("./trip-rental-routes.js").then(m => m.default));

  // Kullanıcı kimlik doğrulama - Refresh Token sistemi ile (Rate limiting + Security tracking)
  app.post("/api/auth/login", rateLimitMiddleware('login'), async (req: TenantRequest, res) => {
    try {
      const { email, password } = req.body;
      
      // Check if account is locked first - tenant-aware
      const user = await tenantStorage.getUserByUsername(req.db, email);
      if (user) {
        const locked = await isAccountLocked(user.id);
        if (locked) {
          await trackLoginAttempt(email, false, req.ip || 'unknown', req.get('User-Agent'), 'account_locked');
          return res.status(423).json({
            success: false,
            error: "ACCOUNT_LOCKED",
            message: "Hesabınız güvenlik nedeniyle kilitlenmiştir. Lütfen daha sonra tekrar deneyin."
          });
        }
      }
      
      const authenticatedUser = await tenantStorage.authenticateUser(req.db, email, password);
      if (!authenticatedUser) {
        await trackLoginAttempt(email, false, req.ip || 'unknown', req.get('User-Agent'), 'invalid_password');
        return res.status(401).json({
          success: false,
          error: "INVALID_CREDENTIALS",
          message: "Geçersiz email veya şifre"
        });
      }
      
      // IP ve User-Agent bilgilerini al
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');
      
      // Successful login tracking
      await trackLoginAttempt(email, true, req.ip || 'unknown', req.get('User-Agent'));
      
      // Log security event
      await logSecurityEvent('login', {
        userId: authenticatedUser.id,
        severity: 'low',
        description: 'Successful user login',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        deviceFingerprint: req.security?.deviceFingerprint,
      });
      
      // Token çifti oluştur (access + refresh)
      const tokens = await generateTokenPair(
        { id: authenticatedUser.id, username: authenticatedUser.email },
        ipAddress,
        userAgent
      );
      
      res.json({
        success: true,
        message: "Giriş başarılı",
        data: { 
          user: authenticatedUser,
          tenant: {
            id: req.tenant?.id,
            name: req.tenant?.name,
            subdomain: req.tenant?.subdomain
          },
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn,
          refreshExpiresIn: tokens.refreshExpiresIn,
          tokenType: "Bearer"
        }
      });
    } catch (error) {
      console.error("Giriş hatası:", error);
      await logSecurityEvent('login_error', {
        severity: 'medium',
        description: `Login error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });
      res.status(401).json({
        success: false,
        error: "LOGIN_ERROR",
        message: "Giriş başarısız"
      });
    }
  });

  // Refresh Token endpoint - Token yenileme
  app.post("/api/auth/refresh", async (req, res) => {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          error: "MISSING_REFRESH_TOKEN",
          message: "Refresh token gereklidir"
        });
      }

      // Refresh token'ı doğrula
      const tokenData = await validateRefreshToken(refreshToken);
      
      // IP ve User-Agent bilgilerini al
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');
      
      // Eski refresh token'ı iptal et (token rotation güvenliği)
      await revokeRefreshToken(tokenData.id);
      
      // Yeni token çifti oluştur
      const tokens = await generateTokenPair(
        { id: tokenData.userId, username: tokenData.username },
        ipAddress,
        userAgent
      );
      
      res.json({
        success: true,
        message: "Token başarıyla yenilendi",
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn,
          refreshExpiresIn: tokens.refreshExpiresIn,
          tokenType: "Bearer"
        }
      });
    } catch (error) {
      console.error("Token yenileme hatası:", error);
      res.status(401).json({
        success: false,
        error: "INVALID_REFRESH_TOKEN",
        message: error instanceof Error ? error.message : "Geçersiz refresh token"
      });
    }
  });

  // Logout endpoint - Tüm refresh token'ları iptal et
  app.post("/api/auth/logout", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (req.user?.userId) {
        // Kullanıcının tüm refresh token'larını iptal et
        await revokeAllUserRefreshTokens(req.user.userId);
      }
      
      res.json({
        success: true,
        message: "Başarıyla çıkış yapıldı"
      });
    } catch (error) {
      console.error("Çıkış hatası:", error);
      res.status(500).json({
        success: false,
        error: "LOGOUT_ERROR",
        message: "Çıkış işlemi başarısız"
      });
    }
  });

  // Kullanıcı kayıt - Tenant-aware
  app.post("/api/auth/register", rateLimitMiddleware('register'), async (req: TenantRequest, res) => {
    try {
      const { email, password, username } = req.body;
      
      if (!password || !email) {
        return res.status(400).json({
          success: false,
          error: "MISSING_FIELDS",
          message: "Email ve şifre gereklidir"
        });
      }
      
      // Tenant-aware user creation
      const user = await tenantStorage.createUser(req.db, {
        email,
        passwordHash: await bcrypt.hash(password, 10),
        companyId: 1 // Varsayılan şirket ID
      });
      
      res.status(201).json({
        success: true,
        message: "Kullanıcı başarıyla oluşturuldu",
        data: { 
          user,
          tenant: {
            id: req.tenant?.id,
            name: req.tenant?.name,
            subdomain: req.tenant?.subdomain
          }
        }
      });
    } catch (error) {
      console.error("Kayıt hatası:", error);
      res.status(500).json({
        success: false,
        error: "REGISTRATION_ERROR",
        message: "Kullanıcı oluşturulamadı"
      });
    }
  });



  // Test endpoint - API güvenlik test için
  app.get("/api/test-auth", async (req, res) => {
    try {
      res.json({
        success: true,
        message: "Test başarılı - güvenlik aktif değil",
        headers: req.headers
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "TEST_ERROR",
        message: "Test hatası"
      });
    }
  });

  // Cities API - getCities endpoint - Filtreleme desteği ile
  app.get("/api/getCities", async (req, res) => {
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
  // API KEY YÖNETİMİ (JWT ile korunuyor)
  // ========================

  // Kullanıcının kendi API key'lerini listele
  app.get("/api/user/api-keys", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'Kullanıcı kimliği bulunamadı'
        });
      }
      
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
          eq(apiClients.userId, userId),
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

  // Yeni API key oluştur (Domain zorunlu)
  app.post("/api/user/api-keys", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.userId;
      const { name, permissions, allowedDomains } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'UNAUTHORIZED', 
          message: 'Kullanıcı kimliği bulunamadı'
        });
      }

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

  // API key sil (soft delete)
  app.delete("/api/user/api-keys/:keyId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.userId;
      const keyId = parseInt(req.params.keyId);

      if (!userId || !keyId) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_REQUEST',
          message: 'Geçersiz istek'
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
  app.use('/api/secure/documents', documentRoutes);
  
  // Company Management Route'larını kaydet
  app.use('/api/secure', companyRoutes);

  // Asset Management Route'larını kaydet
  app.use('/api/secure', assetRoutes);

  // Audit Route'larını kaydet
  const { registerAuditRoutes } = await import("./audit-routes");
  registerAuditRoutes(app);

  // Financial Route'larını kaydet
  const financialRoutes = await import("./financial-routes.js");
  app.use("/api/secure/financial", financialRoutes.default);

  // Fuel Management Route'larını kaydet
  app.use('/api/secure', fuelRoutes);

  // Bulk Import Route'larını kaydet
  app.use('/api/secure', bulkImportRoutes);

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