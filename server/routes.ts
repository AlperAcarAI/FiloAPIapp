import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authenticateToken } from "./auth";
import { insertVarlikSchema, updateVarlikSchema, type Varlik, type InsertVarlik, type UpdateVarlik } from "@shared/schema";
import { z } from "zod";
import { db } from "./db";
import { varliklar } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  // Varlık API'leri - Tam CRUD operasyonları

  // GET /varliklar - Tüm varlıkları listeler
  app.get("/varliklar", async (req, res) => {
    try {
      const allVarliklar = await db.select().from(varliklar).orderBy(varliklar.created_at);
      res.json(allVarliklar);
    } catch (error) {
      console.error("Varlıklar getirme hatası:", error);
      res.status(500).json({ error: "Varlıklar getirilemedi" });
    }
  });

  // GET /varliklar/:varlik_id - Belirli bir varlığı getirir
  app.get("/varliklar/:varlik_id", async (req, res) => {
    try {
      const { varlik_id } = req.params;
      const varlik = await db.select().from(varliklar).where(eq(varliklar.varlik_id, varlik_id)).limit(1);
      
      if (varlik.length === 0) {
        return res.status(404).json({ error: "Varlık bulunamadı" });
      }
      
      res.json(varlik[0]);
    } catch (error) {
      console.error("Varlık getirme hatası:", error);
      res.status(500).json({ error: "Varlık getirilemedi" });
    }
  });

  // POST /varliklar - Yeni bir varlık oluşturur
  app.post("/varliklar", async (req, res) => {
    try {
      const validatedData = insertVarlikSchema.parse(req.body);
      const newVarlik = await db.insert(varliklar).values(validatedData).returning();
      res.status(201).json(newVarlik[0]);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Geçersiz veri", details: error.errors });
      }
      console.error("Varlık oluşturma hatası:", error);
      res.status(500).json({ error: "Varlık oluşturulamadı" });
    }
  });

  // PUT /varliklar/:varlik_id - Mevcut varlığı günceller
  app.put("/varliklar/:varlik_id", async (req, res) => {
    try {
      const { varlik_id } = req.params;
      const validatedData = updateVarlikSchema.parse(req.body);
      
      const updatedVarlik = await db
        .update(varliklar)
        .set({ ...validatedData, updated_at: new Date() })
        .where(eq(varliklar.varlik_id, varlik_id))
        .returning();
      
      if (updatedVarlik.length === 0) {
        return res.status(404).json({ error: "Varlık bulunamadı" });
      }
      
      res.json(updatedVarlik[0]);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Geçersiz veri", details: error.errors });
      }
      console.error("Varlık güncelleme hatası:", error);
      res.status(500).json({ error: "Varlık güncellenemedi" });
    }
  });

  // DELETE /varliklar/:varlik_id - Varlığı siler
  app.delete("/varliklar/:varlik_id", async (req, res) => {
    try {
      const { varlik_id } = req.params;
      const deletedVarlik = await db
        .delete(varliklar)
        .where(eq(varliklar.varlik_id, varlik_id))
        .returning();
      
      if (deletedVarlik.length === 0) {
        return res.status(404).json({ error: "Varlık bulunamadı" });
      }
      
      res.json({ message: "Varlık başarıyla silindi", varlik: deletedVarlik[0] });
    } catch (error) {
      console.error("Varlık silme hatası:", error);
      res.status(500).json({ error: "Varlık silinemedi" });
    }
  });

  // Mevcut API yönetimi route'ları (sadece gerekli olanlar)
  app.get("/api/apis", authenticateToken, async (req, res) => {
    try {
      const apis = await storage.getAllApis();
      res.json(apis);
    } catch (error) {
      console.error("API'ler getirme hatası:", error);
      res.status(500).json({ error: "API'ler getirilemedi" });
    }
  });

  app.post("/api/apis", authenticateToken, async (req, res) => {
    try {
      const newApi = await storage.createApi(req.body);
      res.status(201).json(newApi);
    } catch (error) {
      console.error("API oluşturma hatası:", error);
      res.status(500).json({ error: "API oluşturulamadı" });
    }
  });

  app.put("/api/apis/:id", authenticateToken, async (req, res) => {
    try {
      const updatedApi = await storage.updateApi(req.params.id, req.body);
      if (!updatedApi) {
        return res.status(404).json({ error: "API bulunamadı" });
      }
      res.json(updatedApi);
    } catch (error) {
      console.error("API güncelleme hatası:", error);
      res.status(500).json({ error: "API güncellenemedi" });
    }
  });

  app.delete("/api/apis/:id", authenticateToken, async (req, res) => {
    try {
      const success = await storage.deleteApi(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "API bulunamadı" });
      }
      res.json({ message: "API başarıyla silindi" });
    } catch (error) {
      console.error("API silme hatası:", error);
      res.status(500).json({ error: "API silinemedi" });
    }
  });

  app.get("/api/apis/stats", authenticateToken, async (req, res) => {
    try {
      const stats = await storage.getApiStats();
      res.json(stats);
    } catch (error) {
      console.error("API istatistikleri getirme hatası:", error);
      res.status(500).json({ error: "İstatistikler getirilemedi" });
    }
  });

  // Kullanıcı kimlik doğrulama
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const { user, token } = await storage.authenticateUser(username, password);
      res.json({ user, token });
    } catch (error) {
      console.error("Giriş hatası:", error);
      res.status(401).json({ error: "Geçersiz kullanıcı adı veya şifre" });
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

  const httpServer = createServer(app);
  return httpServer;
}