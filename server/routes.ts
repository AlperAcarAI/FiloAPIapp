import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authenticateToken } from "./auth";
import { insertAssetSchema, updateAssetSchema, type Asset, type InsertAsset, type UpdateAsset, cities, type City } from "@shared/schema";
import { z } from "zod";
import { db } from "./db";
import { assets } from "@shared/schema";
import { eq } from "drizzle-orm";
import { registerApiManagementRoutes } from "./api-management-routes";
import documentRoutes from "./document-routes.js";
import companyRoutes from "./company-routes.js";
import assetRoutes from "./asset-routes.js";
import apiAnalyticsRoutes from "./api-analytics-routes.js";
import { apiAnalyticsMiddleware } from "./api-analytics-middleware.js";

export async function registerRoutes(app: Express): Promise<Server> {
  // API Analytics middleware - Tüm API çağrılarını takip et
  app.use(apiAnalyticsMiddleware);

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



  // Cities API - getCities endpoint - Standart JSON format
  app.get("/api/getCities", async (req, res) => {
    try {
      const citiesList = await db.select({
        id: cities.id,
        name: cities.name
      }).from(cities).orderBy(cities.name);
      
      res.json({
        success: true,
        message: "Şehirler başarıyla getirildi",
        data: {
          cities: citiesList,
          totalCount: citiesList.length
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

  const httpServer = createServer(app);
  return httpServer;
}