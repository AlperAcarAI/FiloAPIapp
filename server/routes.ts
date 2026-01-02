import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { authenticateToken, type AuthRequest } from "./auth";
import { insertAssetSchema, updateAssetSchema, type Asset, type InsertAsset, type UpdateAsset, cities, type City, companies, users, personnel, paymentMethods } from "@shared/schema";
import { generateTokenPair, validateRefreshToken, revokeRefreshToken, revokeAllUserRefreshTokens } from "./auth";
import { z } from "zod";
import { db } from "./db";
import { assets, countries } from "@shared/schema";
import { eq, desc, asc, sql, like, ilike, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { registerApiManagementRoutes } from "./api-management-routes";
import documentRoutes from "./document-routes.js";
import companyRoutes from "./company-routes.js";
import vehicleRoutes from './vehicle-routes.js';
import personnelRoutes from './personnel-routes.js';
import personnelDetailedRoutes from './personnel-detailed-routes.js';
import personnelWorkAreasRoutes from './personnel-work-areas-routes.js';
import personnelWorkHistoryRoutes from './personnel-work-history-routes.js';
import workAreaRoutes from './work-area-routes.js';
import positionRoutes from './position-routes.js';
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

  // Document Management Routes - Before auth middleware
  app.use('/api/documents', documentRoutes);

  // Position Management Route'larını kaydet - EN ÜSTTE (HTML dönme sorununu önlemek için)
  console.log('📍 Registering Position Routes at /api/secure');
  app.use('/api/secure', positionRoutes);
  console.log('✅ Position Routes registered');

  // API Analytics middleware - Geçici olarak devre dışı

  // API route'larını kaydet
  app.use("/api/trip-rentals", await import("./trip-rental-routes.js").then(m => m.default));
  app.use("/api/rental-agreements", await import("./rental-agreements-routes.js").then(m => m.default));
  app.use("/api/rental-assets", await import("./rental-assets-routes.js").then(m => m.default));
  // Policy management routes
  const policyRoutes = await import("./policy-routes.js").then(m => m.default);
  app.use("/api/policy-types", policyRoutes);
  app.use("/api/policies", policyRoutes);
  // Maintenance management routes
  app.use("/api", await import("./maintenance-routes.js").then(m => m.default));
  
  // Assets policies routes
  app.use("/api/assets-policies", await import("./assets-policies-routes.js").then(m => m.default));
  
  // Penalty management routes
  app.use("/api/penalty-types", await import("./penalty-routes.js").then(m => m.default));
  app.use("/api/penalties", await import("./penalties-routes.js").then(m => m.default));
  
  // Dashboard routes
  app.use("/api/dashboard", await import("./dashboard-routes.js").then(m => m.default));
  
  // Asset Assignment routes
  app.use("/api/asset-assignments", await import("./asset-assignment-routes.js").then(m => m.assetAssignmentRoutes));
  
  // Stuff Management routes
  app.use("/api/stuff", await import("./stuff-routes.js").then(m => m.default));
  
  // Financial routes - removed duplicate mount (see line 949)

  // Kullanıcı kimlik doğrulama - Basitleştirilmiş sistem
  app.post("/api/auth/login", async (req: SecurityRequest, res: Response) => {
    try {
      const { email, password } = req.body;
      
      // Check if account is locked first
      const user = await storage.getUserByUsername(email);
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
      
      // Debug logging for production
      console.log(`Login attempt for email: ${email}`);
      
      const authenticatedUser = await storage.authenticateUser(email, password);
      console.log(`Authentication result: ${!!authenticatedUser}`);
      
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
      
      // Get user permissions if personnelId exists
      let permissions: any[] = [];
      if (authenticatedUser.personnelId) {
        const { personnelAccess, accessTypes, workAreas } = await import('@shared/schema');
        
        const userPermissions = await db
          .select({
            id: personnelAccess.id,
            workareaId: personnelAccess.workareaId,
            workareaName: workAreas.name,
            typeId: personnelAccess.typeId,
            typeName: accessTypes.name,
          })
          .from(personnelAccess)
          .leftJoin(workAreas, eq(personnelAccess.workareaId, workAreas.id))
          .innerJoin(accessTypes, eq(personnelAccess.typeId, accessTypes.id))
          .where(eq(personnelAccess.personnelId, authenticatedUser.personnelId));
        
        // Group permissions by workarea
        const permissionMap = new Map<number | null, { workareaId: number | null; workareaName: string | null; accessCodes: number[] }>();
        
        for (const perm of userPermissions) {
          if (!permissionMap.has(perm.workareaId)) {
            permissionMap.set(perm.workareaId, {
              workareaId: perm.workareaId,
              workareaName: perm.workareaName,
              accessCodes: []
            });
          }
          permissionMap.get(perm.workareaId)!.accessCodes.push(perm.typeId);
        }
        
        permissions = Array.from(permissionMap.values());
      }
      
      // Token çifti oluştur (access + refresh)
      const tokens = await generateTokenPair(
        { id: authenticatedUser.id, email: authenticatedUser.email },
        ipAddress,
        userAgent
      );
      
      res.json({
        success: true,
        message: "Giriş başarılı",
        data: { 
          user: authenticatedUser,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn,
          refreshExpiresIn: tokens.refreshExpiresIn,
          tokenType: "Bearer",
          permissions: permissions
        }
      });
    } catch (error) {
      console.error("Giriş hatası:", error);
      try {
        await logSecurityEvent('login_error', {
          severity: 'medium',
          description: `Login error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        });
      } catch (logError) {
        console.error("Log error:", logError);
      }
      
      res.status(500).json({
        success: false,
        error: "LOGIN_ERROR", 
        message: "Sunucu hatası - giriş işlemi başarısız",
        debug: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
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
        { id: tokenData.userId, email: tokenData.username },
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

  // Kullanıcı kayıt - TC kimlik numarası doğrulaması ile
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { email, password, tcNo, companyName, companyId } = req.body;
      
      if (!password || !email || !tcNo) {
        return res.status(400).json({
          success: false,
          error: "MISSING_FIELDS",
          message: "Email, şifre ve TC kimlik numarası gereklidir"
        });
      }

      // TC kimlik numarası doğrulaması
      const tcNumber = String(tcNo).trim();
      
      // TC kimlik numarası format kontrolü (11 haneli olmalı)
      if (!/^\d{11}$/.test(tcNumber)) {
        return res.status(400).json({
          success: false,
          error: "INVALID_TC_FORMAT",
          message: "TC kimlik numarası 11 haneli olmalıdır"
        });
      }

      // Personel tablosunda TC kimlik numarası kontrolü
      const [existingPersonnel] = await db
        .select({
          id: personnel.id,
          name: personnel.name,
          surname: personnel.surname,
          tcNo: personnel.tcNo,
          isActive: personnel.isActive,
          companyId: personnel.companyId
        })
        .from(personnel)
        .where(eq(personnel.tcNo, BigInt(tcNumber)));

      if (!existingPersonnel) {
        return res.status(403).json({
          success: false,
          error: "TC_NOT_AUTHORIZED",
          message: "Bu TC kimlik numarası ile kayıt yetkiniz bulunmamaktadır. Lütfen yöneticinizle iletişime geçin."
        });
      }

      if (!existingPersonnel.isActive) {
        return res.status(403).json({
          success: false,
          error: "PERSONNEL_INACTIVE",
          message: "Personel kaydınız aktif değildir. Lütfen yöneticinizle iletişime geçin."
        });
      }

      // Bu personnel_id'ye sahip kullanıcı zaten var mı kontrol et
      const [existingUser] = await db
        .select({ id: users.id, email: users.email })
        .from(users)
        .where(eq(users.personnelId, existingPersonnel.id));

      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: "PERSONNEL_ALREADY_REGISTERED",
          message: "Bu personel için zaten bir kullanıcı hesabı mevcut."
        });
      }

      // Email zaten kullanılıyor mu kontrol et
      const [existingEmailUser] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email));

      if (existingEmailUser) {
        return res.status(409).json({
          success: false,
          error: "EMAIL_ALREADY_EXISTS",
          message: "Bu email adresi zaten kullanılmaktadır."
        });
      }

      let finalCompanyId = existingPersonnel.companyId || companyId || 1;
      
      // If companyName is provided, create new company
      if (companyName && companyName.trim()) {
        try {
          const [newCompany] = await db
            .insert(companies)
            .values({
              name: companyName.trim(),
              isActive: true
            })
            .returning();
          
          finalCompanyId = newCompany.id;
        } catch (companyError) {
          console.error("Şirket oluşturma hatası:", companyError);
          return res.status(500).json({
            success: false,
            error: "COMPANY_CREATION_ERROR",
            message: "Şirket oluşturulamadı"
          });
        }
      }
      
      // User creation with personnel_id
      const user = await storage.createUser({
        email,
        passwordHash: await bcrypt.hash(password, 10),
        companyId: finalCompanyId,
        personnelId: existingPersonnel.id
      });
      
      res.status(201).json({
        success: true,
        message: "Kullanıcı başarıyla oluşturuldu ve personel bilgileri eşleştirildi",
        data: { 
          user,
          personnel: {
            id: existingPersonnel.id,
            name: existingPersonnel.name,
            surname: existingPersonnel.surname,
            fullName: `${existingPersonnel.name} ${existingPersonnel.surname}`
          },
          companyId: finalCompanyId
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



  // Test endpoint - Protected (Token gerektirir)
  app.get("/api/test-auth", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      res.json({
        success: true,
        message: "Test başarılı - güvenli endpoint'e erişim sağlandı",
        data: {
          user: req.user,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error("Test auth hatası:", error);
      res.status(500).json({
        success: false,
        error: "TEST_ERROR",
        message: "Test başarısız"
      });
    }
  });

  // Simple login endpoint for production debugging
  app.post("/api/simple-login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      if (email === 'admin@example.com' && password === 'Architect') {
        const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
        
        // Create a simple token without complex auth system
        const simpleToken = jwt.sign(
          { id: 11, email: 'admin@example.com', username: 'admin@example.com' },
          JWT_SECRET,
          { expiresIn: '1h' }
        );
        
        res.json({
          success: true,
          message: "Giriş başarılı",
          data: {
            user: { id: 11, email: 'admin@example.com' },
            accessToken: simpleToken,
            tokenType: "Bearer"
          }
        });
      } else {
        res.status(401).json({
          success: false,
          error: "INVALID_CREDENTIALS",
          message: "Geçersiz email veya şifre"
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "LOGIN_ERROR",
        message: "Giriş başarısız"
      });
    }
  });

  // Legacy secure endpoint aliases for backward compatibility
  app.get("/api/secure/getPersonnel", (req: any, res: any, next: any) => {
    req.url = '/api/secure/personnel';
    req.originalUrl = '/api/secure/personnel';
    next();
  });

  app.get("/api/secure/getAssets", (req: any, res: any, next: any) => {
    req.url = '/api/secure/assets';
    req.originalUrl = '/api/secure/assets';
    next();
  });

  app.get("/api/secure/getCompanies", (req: any, res: any, next: any) => {
    req.url = '/api/secure/companies';
    req.originalUrl = '/api/secure/companies';
    next();
  });

  app.get("/api/secure/getBrands", (req: any, res: any, next: any) => {
    req.url = '/api/secure/brands';
    req.originalUrl = '/api/secure/brands';
    next();
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
        query.where(ilike(cities.name, `%${search}%`));
      }

      // Sıralama
      const orderColumn = sortBy === 'id' ? cities.id : cities.name;
      const orderDirection = sortOrder === 'desc' ? desc(orderColumn) : asc(orderColumn);
      query.orderBy(orderDirection);

      // Sayfalama
      if (limit) {
        query.limit(Number(limit));
        if (offset) {
          query.offset(Number(offset));
        }
      }

      const citiesList = await query;
      
      // Toplam sayı (filtreleme dahil)
      let totalQuery = db.select({ count: sql`count(*)`.as('count') }).from(cities);
      if (search) {
        totalQuery.where(ilike(cities.name, `%${search}%`));
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

  // Payment Methods API - Simple endpoint
  app.get("/api/payment-methods", authenticateToken, async (req, res) => {
    try {
      const { search, activeOnly = 'true', limit, offset, sortBy = 'name', sortOrder = 'asc' } = req.query;
      
      // Build conditions
      const conditions = [];
      if (activeOnly === 'true') {
        conditions.push(eq(paymentMethods.isActive, true));
      }
      if (search) {
        conditions.push(ilike(paymentMethods.name, `%${search}%`));
      }

      // Simple query without complex chaining
      const methodsList = await db
        .select({
          id: paymentMethods.id,
          name: paymentMethods.name,
          isActive: paymentMethods.isActive
        })
        .from(paymentMethods)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(
          sortOrder === 'desc' 
            ? desc(sortBy === 'id' ? paymentMethods.id : paymentMethods.name)
            : asc(sortBy === 'id' ? paymentMethods.id : paymentMethods.name)
        )
        .limit(limit ? Number(limit) : 1000)
        .offset(offset ? Number(offset) : 0);
      
      res.json({
        success: true,
        message: "Ödeme yöntemleri başarıyla getirildi",
        data: {
          paymentMethods: methodsList,
          totalCount: methodsList.length
        }
      });
    } catch (error) {
      console.error("Payment methods getirme hatası:", error);
      res.status(500).json({ 
        success: false,
        error: "PAYMENT_METHODS_FETCH_ERROR",
        message: "Ödeme yöntemleri alınırken hata oluştu" 
      });
    }
  });

  // Vehicles API - Public endpoint (Protected with API Key)
  app.get("/api/vehicles", async (req, res) => {
    try {
      const { search, limit, offset, sortBy = 'id', sortOrder = 'asc', companyId, modelId } = req.query;
      
      let query = db.select({
        id: assets.id,
        plateNumber: assets.plateNumber,
        modelYear: assets.modelYear,
        chassisNo: assets.chassisNo,
        uttsNo: assets.uttsNo,
        isActive: assets.isActive,
        createdAt: assets.createdAt
      }).from(assets);

      // Search filtering
      if (search) {
        query.where(ilike(assets.plateNumber, `%${search}%`));
      }

      // Company filtering
      if (companyId) {
        query.where(eq(assets.ownerCompanyId, Number(companyId)));
      }

      // Model filtering
      if (modelId) {
        query.where(eq(assets.modelId, Number(modelId)));
      }

      // Sorting
      const orderColumn = sortBy === 'plateNumber' ? assets.plateNumber : assets.id;
      const orderDirection = sortOrder === 'desc' ? desc(orderColumn) : asc(orderColumn);
      query.orderBy(orderDirection);

      // Pagination
      if (limit) {
        query.limit(Number(limit));
        if (offset) {
          query.offset(Number(offset));
        }
      }

      const vehicles = await query;
      
      res.json({
        success: true,
        message: "Vehicles başarıyla getirildi",
        data: {
          vehicles,
          totalCount: vehicles.length,
          pagination: {
            limit: limit ? Number(limit) : null,
            offset: offset ? Number(offset) : null
          }
        }
      });
    } catch (error) {
      console.error("Vehicles getirme hatası:", error);
      res.status(500).json({ 
        success: false,
        error: "VEHICLES_FETCH_ERROR",
        message: "Vehicles listesi alınırken bir hata oluştu" 
      });
    }
  });

  // Ülke listesini getir (Public API)
  app.get("/api/getCountries", async (req: Request, res: Response) => {
    try {
      const { limit, offset, search, sortBy = 'name', sortOrder = 'asc' } = req.query;
      
      const validSortByFields = ['name', 'phone_code', 'id'];
      const validSortOrder = ['asc', 'desc'];
      
      const finalSortBy = validSortByFields.includes(sortBy as string) ? sortBy as string : 'name';
      const finalSortOrder = validSortOrder.includes(sortOrder as string) ? sortOrder as string : 'asc';
      
      // Base query
      let query = db.select().from(countries);
      
      // Add search filter if provided
      if (search && typeof search === 'string') {
        query.where(ilike(countries.name, `%${search}%`));
      }
      
      // Get total count for pagination
      const totalCountQuery = db.select({ count: sql<number>`count(*)` }).from(countries);
      if (search && typeof search === 'string') {
        totalCountQuery.where(ilike(countries.name, `%${search}%`));
      }
      const [{ count: totalCount }] = await totalCountQuery;
      
      // Add sorting
      const orderByColumn = finalSortBy === 'name' ? countries.name 
                          : finalSortBy === 'phone_code' ? countries.phoneCode
                          : countries.id;
      
      query.orderBy(finalSortOrder === 'desc' ? desc(orderByColumn) : asc(orderByColumn));
      
      // Add pagination if provided
      if (limit && typeof limit === 'string' && !isNaN(Number(limit))) {
        query.limit(Number(limit));
        
        if (offset && typeof offset === 'string' && !isNaN(Number(offset))) {
          query.offset(Number(offset));
        }
      }
      
      const countriesList = await query;
      
      res.json({
        success: true,
        message: "Ülkeler başarıyla getirildi",
        data: {
          countries: countriesList,
          totalCount,
          pagination: {
            limit: limit ? Number(limit) : null,
            offset: offset ? Number(offset) : null,
            hasMore: limit ? countriesList.length === Number(limit) : false
          },
          filters: {
            search: search || null,
            sortBy: finalSortBy,
            sortOrder: finalSortOrder
          }
        }
      });
    } catch (error) {
      console.error("Countries getirme hatası:", error);
      res.status(500).json({ 
        success: false,
        error: "COUNTRIES_FETCH_ERROR",
        message: "Ülke listesi alınırken bir hata oluştu" 
      });
    }
  });

  // ========================
  // API KEY YÖNETİMİ (JWT ile korunuyor)
  // ========================

  // Kullanıcının kendi API key'lerini listele
  app.get("/api/user/api-keys", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
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
  app.post("/api/user/api-keys", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
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
  app.delete("/api/user/api-keys/:keyId", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
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


  
  // Company Management Route'larını kaydet
  app.use('/api/secure', companyRoutes);

  // Vehicle Management Route'larını kaydet
  app.use('/api/secure', vehicleRoutes);
  
  // Personnel Management Route'larını kaydet
  app.use('/api/secure', personnelRoutes);
  
  // Personnel Detailed Route'larını kaydet
  app.use('/api/secure', personnelDetailedRoutes);
  
  // Personnel Work Areas Route'larını kaydet
  app.use('/api/secure', personnelWorkAreasRoutes);
  
  // Personnel Work History Route'larını kaydet
  app.use('/api/secure', personnelWorkHistoryRoutes);
  
  // Work Area Management Route'larını kaydet
  app.use('/api/secure', workAreaRoutes);

  // Project Management Route'larını kaydet
  app.use('/api/secure', await import('./projects-routes.js').then(m => m.default));
  app.use('/api/secure', await import('./project-completion-routes.js').then(m => m.default));

  // Audit Route'larını kaydet
  const { registerAuditRoutes } = await import("./audit-routes");
  registerAuditRoutes(app);

  // Financial Route'larını kaydet
  const financialRoutes = await import("./financial-routes.js");
  app.use("/api/secure/financial", financialRoutes.default);

  // Fuel Management Route'larını kaydet
  app.use('/api', fuelRoutes);

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

  // Proxy Route'larını kaydet
  const proxyRoutes = await import("./proxy-routes.js");
  app.use("/api/proxy", proxyRoutes.default);

  // Outage Process Management Route'larını kaydet
  const outageProcessRoutes = await import("./outage-process-routes.js");
  app.use("/api/secure", outageProcessRoutes.default);

  // PYP Management Route'larını kaydet
  const projectPypRoutes = await import("./project-pyp-routes.js");
  app.use("/api/secure", projectPypRoutes.default);

  // Personnel Access Management Route'larını kaydet
  console.log("🔧 Loading Personnel Access Routes...");
  const personnelAccessRoutesModule = await import("./personnel-access-routes.js");
  console.log("🔧 Personnel Access Routes loaded:", !!personnelAccessRoutesModule.default);
  app.use("/api/secure", personnelAccessRoutesModule.default);
  console.log("✅ Personnel Access Routes registered at /api/secure");

  // Progress Payment (Hakediş) Management Route'larını kaydet
  console.log("🔧 Loading Progress Payment Routes...");
  const progressPaymentRoutes = await import("./progress-payment-routes.js");
  console.log("🔧 Progress Payment Routes module loaded:", !!progressPaymentRoutes.default);
  app.use("/api/secure", progressPaymentRoutes.default);
  console.log("✅ Progress Payment Routes registered at /api/secure");
  console.log("✅ Materials endpoint should be available at: PUT /api/secure/materials/:id");

  const httpServer = createServer(app);
  return httpServer;
}
