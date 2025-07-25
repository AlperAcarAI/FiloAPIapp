import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authenticateToken } from "./auth";
import { insertAssetSchema, updateAssetSchema, type Asset, type InsertAsset, type UpdateAsset, cities, type City, apis, type Api, type InsertApi, type UpdateApi, insertApiSchema, updateApiSchema } from "@shared/schema";
import { z } from "zod";
import { db } from "./db";
import { assets } from "@shared/schema";
import { eq, ilike, or, count } from "drizzle-orm";
import { registerApiManagementRoutes } from "./api-management-routes";

export async function registerRoutes(app: Express): Promise<Server> {
  // Asset API'leri - Tam CRUD operasyonları

  // GET /assets - Tüm varlıkları listeler
  app.get("/assets", async (req, res) => {
    try {
      const allAssets = await db.select().from(assets).orderBy(assets.createdAt);
      res.json(allAssets);
    } catch (error) {
      console.error("Assets getirme hatası:", error);
      res.status(500).json({ error: "Assets getirilemedi" });
    }
  });

  // GET /assets/:id - Belirli bir asset getirir
  app.get("/assets/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const asset = await db.select().from(assets).where(eq(assets.id, parseInt(id))).limit(1);
      
      if (asset.length === 0) {
        return res.status(404).json({ error: "Asset bulunamadı" });
      }
      
      res.json(asset[0]);
    } catch (error) {
      console.error("Asset getirme hatası:", error);
      res.status(500).json({ error: "Asset getirilemedi" });
    }
  });

  // POST /assets - Yeni bir asset oluşturur
  app.post("/assets", async (req, res) => {
    try {
      const validatedData = insertAssetSchema.parse(req.body);
      const newAsset = await db.insert(assets).values(validatedData).returning();
      res.status(201).json(newAsset[0]);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Geçersiz veri", details: error.errors });
      }
      console.error("Asset oluşturma hatası:", error);
      res.status(500).json({ error: "Asset oluşturulamadı" });
    }
  });

  // PUT /assets/:id - Mevcut asset günceller
  app.put("/assets/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = updateAssetSchema.parse(req.body);
      
      const updatedAsset = await db
        .update(assets)
        .set({ ...validatedData, updatedAt: new Date() })
        .where(eq(assets.id, parseInt(id)))
        .returning();
      
      if (updatedAsset.length === 0) {
        return res.status(404).json({ error: "Asset bulunamadı" });
      }
      
      res.json(updatedAsset[0]);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Geçersiz veri", details: error.errors });
      }
      console.error("Asset güncelleme hatası:", error);
      res.status(500).json({ error: "Asset güncellenemedi" });
    }
  });

  // DELETE /assets/:id - Asset siler
  app.delete("/assets/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deletedAsset = await db
        .delete(assets)
        .where(eq(assets.id, parseInt(id)))
        .returning();
      
      if (deletedAsset.length === 0) {
        return res.status(404).json({ error: "Asset bulunamadı" });
      }
      
      res.json({ message: "Asset başarıyla silindi", asset: deletedAsset[0] });
    } catch (error) {
      console.error("Asset silme hatası:", error);
      res.status(500).json({ error: "Asset silinemedi" });
    }
  });

  // Asset yönetimi için API endpoints
  app.get("/api/assets", authenticateToken, async (req, res) => {
    try {
      const searchTerm = req.query.search as string;
      const statusFilter = req.query.status as string;
      const allAssets = await storage.getAssets(searchTerm, statusFilter);
      res.json(allAssets);
    } catch (error) {
      console.error("Assets getirme hatası:", error);
      res.status(500).json({ error: "Assets getirilemedi" });
    }
  });

  app.get("/api/assets/stats", authenticateToken, async (req, res) => {
    try {
      const stats = await storage.getAssetStats();
      res.json(stats);
    } catch (error) {
      console.error("Asset stats getirme hatası:", error);
      res.status(500).json({ error: "Asset stats getirilemedi" });
    }
  });

  app.get("/api/assets/:id", authenticateToken, async (req, res) => {
    try {
      const asset = await storage.getAsset(parseInt(req.params.id));
      if (!asset) {
        return res.status(404).json({ error: "Asset bulunamadı" });
      }
      res.json(asset);
    } catch (error) {
      console.error("Asset getirme hatası:", error);
      res.status(500).json({ error: "Asset getirilemedi" });
    }
  });

  app.post("/api/assets", authenticateToken, async (req, res) => {
    try {
      const newAsset = await storage.createAsset(req.body);
      res.status(201).json(newAsset);
    } catch (error) {
      console.error("Asset oluşturma hatası:", error);
      res.status(500).json({ error: "Asset oluşturulamadı" });
    }
  });

  app.put("/api/assets/:id", authenticateToken, async (req, res) => {
    try {
      const updatedAsset = await storage.updateAsset(parseInt(req.params.id), req.body);
      if (!updatedAsset) {
        return res.status(404).json({ error: "Asset bulunamadı" });
      }
      res.json(updatedAsset);
    } catch (error) {
      console.error("Asset güncelleme hatası:", error);
      res.status(500).json({ error: "Asset güncellenemedi" });
    }
  });

  app.delete("/api/assets/:id", authenticateToken, async (req, res) => {
    try {
      const success = await storage.deleteAsset(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ error: "Asset bulunamadı" });
      }
      res.json({ message: "Asset başarıyla silindi" });
    } catch (error) {
      console.error("Asset silme hatası:", error);
      res.status(500).json({ error: "Asset silinemedi" });
    }
  });

  // Kullanıcı kimlik doğrulama
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await storage.authenticateUser(email, password);
      if (!user) {
        return res.status(401).json({ error: "Geçersiz email veya şifre" });
      }
      res.json({ user });
    } catch (error) {
      console.error("Giriş hatası:", error);
      res.status(401).json({ error: "Giriş başarısız" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const user = await storage.createUser(req.body);
      res.status(201).json(user);
    } catch (error) {
      console.error("Kayıt hatası:", error);
      res.status(500).json({ error: "Kullanıcı oluşturulamadı" });
    }
  });

  // API Management endpoints
  app.get("/api/apis", async (req, res) => {
    try {
      const searchTerm = req.query.search as string;
      const statusFilter = req.query.status as string;
      
      let query = db.select().from(apis);
      
      if (searchTerm) {
        query = query.where(
          or(
            ilike(apis.name, `%${searchTerm}%`),
            ilike(apis.description, `%${searchTerm}%`)
          )
        );
      }
      
      if (statusFilter && statusFilter !== 'all') {
        query = query.where(eq(apis.status, statusFilter));
      }
      
      const result = await query.orderBy(apis.created_at);
      res.json(result);
    } catch (error) {
      console.error("APIs getirme hatası:", error);
      res.status(500).json({ error: "APIs getirilemedi" });
    }
  });

  app.get("/api/apis/stats", async (req, res) => {
    try {
      const total = await db.select({ count: count() }).from(apis);
      const active = await db.select({ count: count() }).from(apis).where(eq(apis.status, 'aktif'));
      const inactive = await db.select({ count: count() }).from(apis).where(eq(apis.status, 'pasif'));
      const error = await db.select({ count: count() }).from(apis).where(eq(apis.status, 'hata'));
      
      res.json({
        total: total[0].count,
        active: active[0].count,
        inactive: inactive[0].count,
        error: error[0].count
      });
    } catch (error) {
      console.error("API stats hatası:", error);
      res.status(500).json({ error: "API stats getirilemedi" });
    }
  });

  app.post("/api/apis", async (req, res) => {
    try {
      const validatedData = insertApiSchema.parse(req.body);
      const newApi = await db.insert(apis).values({
        ...validatedData,
        created_at: new Date(),
        updated_at: new Date()
      }).returning();
      res.status(201).json(newApi[0]);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Geçersiz veri", details: error.errors });
      }
      console.error("API oluşturma hatası:", error);
      res.status(500).json({ error: "API oluşturulamadı" });
    }
  });

  app.put("/api/apis/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = updateApiSchema.parse(req.body);
      
      const updatedApi = await db
        .update(apis)
        .set({ ...validatedData, updated_at: new Date() })
        .where(eq(apis.api_id, id))
        .returning();
      
      if (updatedApi.length === 0) {
        return res.status(404).json({ error: "API bulunamadı" });
      }
      
      res.json(updatedApi[0]);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Geçersiz veri", details: error.errors });
      }
      console.error("API güncelleme hatası:", error);
      res.status(500).json({ error: "API güncellenemedi" });
    }
  });

  app.delete("/api/apis/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deletedApi = await db
        .delete(apis)
        .where(eq(apis.api_id, id))
        .returning();
      
      if (deletedApi.length === 0) {
        return res.status(404).json({ error: "API bulunamadı" });
      }
      
      res.json({ message: "API başarıyla silindi", api: deletedApi[0] });
    } catch (error) {
      console.error("API silme hatası:", error);
      res.status(500).json({ error: "API silinemedi" });
    }
  });

  // Cities API - getCities endpoint
  app.get("/api/getCities", async (req, res) => {
    try {
      const citiesList = await db.select({
        id: cities.id,
        name: cities.name
      }).from(cities).orderBy(cities.name);
      
      res.json({
        success: true,
        data: citiesList,
        count: citiesList.length
      });
    } catch (error) {
      console.error("Cities getirme hatası:", error);
      res.status(500).json({ 
        success: false,
        error: "Cities getirilemedi",
        message: "Şehir listesi alınırken bir hata oluştu" 
      });
    }
  });

  // API Güvenlik ve Yönetim Route'larını kaydet
  registerApiManagementRoutes(app);

  // Audit Route'larını kaydet
  const { registerAuditRoutes } = await import("./audit-routes");
  registerAuditRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}