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



  // Countries API - getCountries endpoint
  app.get("/api/getCountries", async (req, res) => {
    try {
      const { search, limit, offset } = req.query;
      
      // Mock data - Gerçek veritabanı tablosu oluşturulduğunda değiştirilecek
      const countries = [
        { id: 1, name: "Türkiye", code: "TR", phoneCode: "+90" },
        { id: 2, name: "Almanya", code: "DE", phoneCode: "+49" },
        { id: 3, name: "Amerika Birleşik Devletleri", code: "US", phoneCode: "+1" },
        { id: 4, name: "Fransa", code: "FR", phoneCode: "+33" },
        { id: 5, name: "İngiltere", code: "GB", phoneCode: "+44" },
        { id: 6, name: "İtalya", code: "IT", phoneCode: "+39" },
        { id: 7, name: "İspanya", code: "ES", phoneCode: "+34" },
        { id: 8, name: "Hollanda", code: "NL", phoneCode: "+31" },
        { id: 9, name: "Belçika", code: "BE", phoneCode: "+32" },
        { id: 10, name: "Avusturya", code: "AT", phoneCode: "+43" }
      ];

      let filteredCountries = countries;
      
      // Search filter
      if (search) {
        filteredCountries = countries.filter(c => 
          c.name.toLowerCase().includes(search.toString().toLowerCase())
        );
      }

      // Pagination
      const start = offset ? Number(offset) : 0;
      const end = limit ? start + Number(limit) : undefined;
      const paginatedCountries = filteredCountries.slice(start, end);

      res.json({
        success: true,
        message: "Ülkeler başarıyla getirildi",
        data: paginatedCountries
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

  // Car Brands API - getCarBrands endpoint
  app.get("/api/getCarBrands", async (req, res) => {
    try {
      const { search } = req.query;
      
      // Mock data - Gerçek veritabanı tablosu oluşturulduğunda değiştirilecek
      const carBrands = [
        { id: 1, name: "Ford" },
        { id: 2, name: "Mercedes-Benz" },
        { id: 3, name: "BMW" },
        { id: 4, name: "Volkswagen" },
        { id: 5, name: "Audi" },
        { id: 6, name: "Toyota" },
        { id: 7, name: "Honda" },
        { id: 8, name: "Nissan" },
        { id: 9, name: "Renault" },
        { id: 10, name: "Peugeot" },
        { id: 11, name: "Citroen" },
        { id: 12, name: "Fiat" },
        { id: 13, name: "Opel" },
        { id: 14, name: "Hyundai" },
        { id: 15, name: "Kia" }
      ];

      let filteredBrands = carBrands;
      
      // Search filter
      if (search) {
        filteredBrands = carBrands.filter(b => 
          b.name.toLowerCase().includes(search.toString().toLowerCase())
        );
      }

      res.json({
        success: true,
        message: "Araç markaları başarıyla getirildi",
        data: filteredBrands
      });
    } catch (error) {
      console.error("Car brands getirme hatası:", error);
      res.status(500).json({ 
        success: false,
        error: "BRANDS_FETCH_ERROR",
        message: "Araç markaları alınırken bir hata oluştu" 
      });
    }
  });

  // Personnel Positions API - getPersonnelPositions endpoint
  app.get("/api/getPersonnelPositions", async (req, res) => {
    try {
      // Mock data - Gerçek veritabanı tablosu oluşturulduğunda değiştirilecek
      const positions = [
        { id: 1, name: "Şoför" },
        { id: 2, name: "Müdür" },
        { id: 3, name: "Muhasebe" },
        { id: 4, name: "İnsan Kaynakları" },
        { id: 5, name: "Operasyon Uzmanı" },
        { id: 6, name: "Satış Temsilcisi" },
        { id: 7, name: "Teknik Uzman" },
        { id: 8, name: "Yönetici Asistanı" },
        { id: 9, name: "Güvenlik" },
        { id: 10, name: "Temizlik Personeli" }
      ];

      res.json({
        success: true,
        message: "Personel pozisyonları başarıyla getirildi",
        data: positions
      });
    } catch (error) {
      console.error("Personnel positions getirme hatası:", error);
      res.status(500).json({ 
        success: false,
        error: "POSITIONS_FETCH_ERROR",
        message: "Personel pozisyonları alınırken bir hata oluştu" 
      });
    }
  });

  // Car Models API - getCarModels endpoint
  app.get("/api/getCarModels", async (req, res) => {
    try {
      const { brandId } = req.query;
      
      // Mock data - Gerçek veritabanı tablosu oluşturulduğunda değiştirilecek
      const carModels = [
        { id: 1, name: "Transit", brandId: 1 },
        { id: 2, name: "Connect", brandId: 1 },
        { id: 3, name: "Custom", brandId: 1 },
        { id: 4, name: "Sprinter", brandId: 2 },
        { id: 5, name: "Vito", brandId: 2 },
        { id: 6, name: "Citan", brandId: 2 },
        { id: 7, name: "X5", brandId: 3 },
        { id: 8, name: "3 Series", brandId: 3 },
        { id: 9, name: "Crafter", brandId: 4 },
        { id: 10, name: "Transporter", brandId: 4 }
      ];

      let filteredModels = carModels;
      
      // Brand filter
      if (brandId) {
        filteredModels = carModels.filter(m => m.brandId === Number(brandId));
      }

      res.json({
        success: true,
        message: "Araç modelleri başarıyla getirildi",
        data: filteredModels
      });
    } catch (error) {
      console.error("Car models getirme hatası:", error);
      res.status(500).json({ 
        success: false,
        error: "MODELS_FETCH_ERROR",
        message: "Araç modelleri alınırken bir hata oluştu" 
      });
    }
  });

  // Car Types API - getCarTypes endpoint
  app.get("/api/getCarTypes", async (req, res) => {
    try {
      const carTypes = [
        { id: 1, name: "Otomobil" },
        { id: 2, name: "Kamyonet" },
        { id: 3, name: "Minibüs" },
        { id: 4, name: "Midibüs" },
        { id: 5, name: "Otobüs" },
        { id: 6, name: "Kamyon" },
        { id: 7, name: "Çekici" },
        { id: 8, name: "Motosiklet" }
      ];

      res.json({
        success: true,
        message: "Araç tipleri başarıyla getirildi",
        data: carTypes
      });
    } catch (error) {
      console.error("Car types getirme hatası:", error);
      res.status(500).json({ 
        success: false,
        error: "TYPES_FETCH_ERROR",
        message: "Araç tipleri alınırken bir hata oluştu" 
      });
    }
  });

  // Ownership Types API - getOwnershipTypes endpoint
  app.get("/api/getOwnershipTypes", async (req, res) => {
    try {
      const ownershipTypes = [
        { id: 1, name: "Şirket Mülkiyeti" },
        { id: 2, name: "Kiralık" },
        { id: 3, name: "Operasyonel Kiralama" },
        { id: 4, name: "Finansal Kiralama" }
      ];

      res.json({
        success: true,
        message: "Sahiplik türleri başarıyla getirildi",
        data: ownershipTypes
      });
    } catch (error) {
      console.error("Ownership types getirme hatası:", error);
      res.status(500).json({ 
        success: false,
        error: "OWNERSHIP_FETCH_ERROR",
        message: "Sahiplik türleri alınırken bir hata oluştu" 
      });
    }
  });

  // Work Areas API - getWorkAreas endpoint
  app.get("/api/getWorkAreas", async (req, res) => {
    try {
      const workAreas = [
        { id: 1, name: "İstanbul Bölgesi" },
        { id: 2, name: "Ankara Bölgesi" },
        { id: 3, name: "İzmir Bölgesi" },
        { id: 4, name: "Bursa Bölgesi" },
        { id: 5, name: "Antalya Bölgesi" },
        { id: 6, name: "Marmara Bölgesi" },
        { id: 7, name: "Ege Bölgesi" },
        { id: 8, name: "Akdeniz Bölgesi" },
        { id: 9, name: "İç Anadolu Bölgesi" },
        { id: 10, name: "Karadeniz Bölgesi" }
      ];

      res.json({
        success: true,
        message: "Çalışma alanları başarıyla getirildi",
        data: workAreas
      });
    } catch (error) {
      console.error("Work areas getirme hatası:", error);
      res.status(500).json({ 
        success: false,
        error: "AREAS_FETCH_ERROR",
        message: "Çalışma alanları alınırken bir hata oluştu" 
      });
    }
  });

  // Payment Methods API - getPaymentMethods endpoint
  app.get("/api/getPaymentMethods", async (req, res) => {
    try {
      const paymentMethods = [
        { id: 1, name: "Nakit" },
        { id: 2, name: "Kredi Kartı" },
        { id: 3, name: "Havale/EFT" },
        { id: 4, name: "Çek" },
        { id: 5, name: "Senet" }
      ];

      res.json({
        success: true,
        message: "Ödeme yöntemleri başarıyla getirildi",
        data: paymentMethods
      });
    } catch (error) {
      console.error("Payment methods getirme hatası:", error);
      res.status(500).json({ 
        success: false,
        error: "PAYMENT_METHODS_FETCH_ERROR",
        message: "Ödeme yöntemleri alınırken bir hata oluştu" 
      });
    }
  });

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