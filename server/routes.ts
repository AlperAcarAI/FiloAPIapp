import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authenticateToken } from "./auth";
import { insertAssetSchema, updateAssetSchema, type Asset, type InsertAsset, type UpdateAsset, cities, type City } from "@shared/schema";
import { z } from "zod";
import { db } from "./db";
import { assets } from "@shared/schema";
import { eq, desc, asc, sql, like } from "drizzle-orm";
import { registerApiManagementRoutes } from "./api-management-routes";
import documentRoutes from "./document-routes.js";
import companyRoutes from "./company-routes.js";
import assetRoutes from "./asset-routes.js";
import apiAnalyticsRoutes from "./api-analytics-routes.js";
import { apiAnalyticsMiddleware } from "./api-analytics-middleware.js";

export async function registerRoutes(app: Express): Promise<Server> {
  // API Analytics middleware - Geçici olarak devre dışı

  // Kullanıcı kimlik doğrulama - Standart JSON format
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await storage.authenticateUser(email, password);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: "INVALID_CREDENTIALS",
          message: "Geçersiz email veya şifre"
        });
      }
      res.json({
        success: true,
        message: "Giriş başarılı",
        data: { user }
      });
    } catch (error) {
      console.error("Giriş hatası:", error);
      res.status(401).json({
        success: false,
        error: "LOGIN_ERROR",
        message: "Giriş başarısız"
      });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, name } = req.body;
      console.log("Register request body:", req.body);
      console.log("Password received:", password);
      
      if (!password) {
        return res.status(400).json({
          success: false,
          error: "MISSING_PASSWORD",
          message: "Şifre gereklidir"
        });
      }
      
      const user = await storage.createUser({
        email,
        passwordHash: password,
        name: name || email.split('@')[0]
      });
      res.status(201).json({
        success: true,
        message: "Kullanıcı başarıyla oluşturuldu",
        data: { user }
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
        query = query.where(like(cities.name, `%${search}%`));
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
        totalQuery = totalQuery.where(like(cities.name, `%${search}%`));
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
  const financialRoutes = await import("./financial-routes-fixed.js");
  app.use("/api/secure/financial", financialRoutes.default);

  const httpServer = createServer(app);
  return httpServer;
}