import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertApiSchema, updateApiSchema } from "@shared/schema";
import { z } from "zod";
import swaggerUi from "swagger-ui-express";
import { db } from "./db";
import { araclar, soforler, yolculuklar, users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { authenticateToken, authenticateApiKey, generateToken, hashPassword, comparePassword, type AuthRequest } from "./auth";

const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "API Management System",
    version: "1.0.0",
    description: "API tanımlarını yönetmek için RESTful API servisi",
  },
  servers: [
    {
      url: "/api",
      description: "Development server",
    },
  ],
  paths: {
    "/apis": {
      get: {
        summary: "Tüm API'leri listele",
        parameters: [
          {
            name: "search",
            in: "query",
            description: "Arama terimi",
            schema: { type: "string" },
          },
          {
            name: "status",
            in: "query",
            description: "Durum filtresi",
            schema: { type: "string", enum: ["aktif", "pasif", "hata"] },
          },
        ],
        responses: {
          200: {
            description: "Başarılı",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Api" },
                },
              },
            },
          },
        },
      },
      post: {
        summary: "Yeni API ekle",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/InsertApi" },
            },
          },
        },
        responses: {
          201: {
            description: "Başarıyla oluşturuldu",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Api" },
              },
            },
          },
        },
      },
    },
    "/apis/{id}": {
      get: {
        summary: "API detayını getir",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Başarılı",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Api" },
              },
            },
          },
          404: {
            description: "API bulunamadı",
          },
        },
      },
      put: {
        summary: "API'yi güncelle",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateApi" },
            },
          },
        },
        responses: {
          200: {
            description: "Başarıyla güncellendi",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Api" },
              },
            },
          },
          404: {
            description: "API bulunamadı",
          },
        },
      },
      delete: {
        summary: "API'yi sil",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          204: {
            description: "Başarıyla silindi",
          },
          404: {
            description: "API bulunamadı",
          },
        },
      },
    },
    "/apis/stats": {
      get: {
        summary: "API istatistikleri",
        responses: {
          200: {
            description: "Başarılı",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    total: { type: "number" },
                    active: { type: "number" },
                    inactive: { type: "number" },
                    error: { type: "number" },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Api: {
        type: "object",
        properties: {
          api_id: { type: "string" },
          ad: { type: "string" },
          aciklama: { type: "string" },
          durum: { type: "string", enum: ["aktif", "pasif", "hata"] },
          son_calistigi: { type: "string", format: "date-time" },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
        },
      },
      InsertApi: {
        type: "object",
        required: ["ad", "aciklama"],
        properties: {
          ad: { type: "string" },
          aciklama: { type: "string" },
          durum: { type: "string", enum: ["aktif", "pasif", "hata"] },
          son_calistigi: { type: "string", format: "date-time" },
        },
      },
      UpdateApi: {
        type: "object",
        properties: {
          ad: { type: "string" },
          aciklama: { type: "string" },
          durum: { type: "string", enum: ["aktif", "pasif", "hata"] },
          son_calistigi: { type: "string", format: "date-time" },
        },
      },
    },
  },
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Swagger documentation
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  // API Stats endpoint
  app.get("/api/apis/stats", async (req, res) => {
    try {
      const stats = await storage.getApiStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching API stats:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get all APIs
  app.get("/api/apis", async (req, res) => {
    try {
      const { search, status } = req.query;
      const apis = await storage.getApis(
        search as string,
        status as string
      );
      res.json(apis);
    } catch (error) {
      console.error("Error fetching APIs:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get single API
  app.get("/api/apis/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const api = await storage.getApi(id);
      
      if (!api) {
        return res.status(404).json({ message: "API not found" });
      }
      
      res.json(api);
    } catch (error) {
      console.error("Error fetching API:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create new API
  app.post("/api/apis", async (req, res) => {
    try {
      const validatedData = insertApiSchema.parse(req.body);
      const newApi = await storage.createApi(validatedData);
      res.status(201).json(newApi);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      console.error("Error creating API:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update API
  app.put("/api/apis/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = updateApiSchema.parse(req.body);
      const updatedApi = await storage.updateApi(id, validatedData);
      
      if (!updatedApi) {
        return res.status(404).json({ message: "API not found" });
      }
      
      res.json(updatedApi);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      console.error("Error updating API:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete API
  app.delete("/api/apis/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteApi(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "API not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting API:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Export APIs as JSON
  app.get("/api/apis/export/json", async (req, res) => {
    try {
      const apis = await storage.getApis();
      res.setHeader('Content-Disposition', 'attachment; filename="apis.json"');
      res.setHeader('Content-Type', 'application/json');
      res.json(apis);
    } catch (error) {
      console.error("Error exporting APIs:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ============== AUTH ENDPOINTS ==============
  
  // Kullanıcı kaydı
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: "Kullanıcı adı ve şifre gerekli"
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Şifre en az 6 karakter olmalı"
        });
      }

      // Kullanıcı adı kontrolü
      const [existingUser] = await db.select().from(users).where(eq(users.username, username));
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Bu kullanıcı adı zaten kullanılıyor"
        });
      }

      // Şifreyi hash'le
      const hashedPassword = await hashPassword(password);

      // Kullanıcı oluştur
      const [newUser] = await db
        .insert(users)
        .values({
          username,
          password: hashedPassword
        })
        .returning();

      // Token oluştur
      const token = generateToken({ id: newUser.id, username: newUser.username });

      res.status(201).json({
        success: true,
        message: "Kullanıcı başarıyla oluşturuldu",
        data: {
          token,
          user: {
            id: newUser.id,
            username: newUser.username
          }
        }
      });
    } catch (error) {
      console.error("Kayıt hatası:", error);
      res.status(500).json({
        success: false,
        message: "Kayıt sırasında bir hata oluştu"
      });
    }
  });

  // Kullanıcı girişi
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: "Kullanıcı adı ve şifre gerekli"
        });
      }

      // Kullanıcı bul
      const [user] = await db.select().from(users).where(eq(users.username, username));
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Kullanıcı adı veya şifre yanlış"
        });
      }

      // Şifre kontrol
      const isPasswordValid = await comparePassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Kullanıcı adı veya şifre yanlış"
        });
      }

      // Token oluştur
      const token = generateToken({ id: user.id, username: user.username });

      res.json({
        success: true,
        message: "Giriş başarılı",
        data: {
          token,
          user: {
            id: user.id,
            username: user.username
          }
        }
      });
    } catch (error) {
      console.error("Giriş hatası:", error);
      res.status(500).json({
        success: false,
        message: "Giriş sırasında bir hata oluştu"
      });
    }
  });

  // Kullanıcı profili (korumalı)
  app.get("/api/auth/profile", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = req.user;
      res.json({
        success: true,
        data: {
          id: user!.id,
          username: user!.username
        }
      });
    } catch (error) {
      console.error("Profil hatası:", error);
      res.status(500).json({
        success: false,
        message: "Profil bilgileri alınırken hata oluştu"
      });
    }
  });

  // ============== TEST API ENDPOINTS ==============
  // These endpoints simulate the actual fleet management APIs
  // Güvenlik: API Key veya JWT token gerekli
  
  // Araç Listesi API test endpoint
  app.get("/api/test/araclar", authenticateApiKey, async (req, res) => {
    try {
      const { status, marka, tur } = req.query;
      
      let aracListesi;
      if (status) {
        aracListesi = await db.select().from(araclar).where(eq(araclar.durum, status as any));
      } else {
        aracListesi = await db.select().from(araclar);
      }
      
      res.json({
        success: true,
        data: aracListesi,
        message: "Araç listesi başarıyla alındı",
        count: aracListesi.length
      });
    } catch (error) {
      console.error("Araç listesi API hatası:", error);
      res.status(500).json({ 
        success: false, 
        message: "Araç listesi alınırken hata oluştu" 
      });
    }
  });

  // Şoför Listesi API test endpoint  
  app.get("/api/test/soforler", authenticateApiKey, async (req, res) => {
    try {
      const { durum } = req.query;
      
      let soforListesi;
      if (durum) {
        soforListesi = await db.select().from(soforler).where(eq(soforler.durum, durum as string));
      } else {
        soforListesi = await db.select().from(soforler);
      }
      
      res.json({
        success: true,
        data: soforListesi,
        message: "Şoför listesi başarıyla alındı",
        count: soforListesi.length
      });
    } catch (error) {
      console.error("Şoför listesi API hatası:", error);
      res.status(500).json({ 
        success: false, 
        message: "Şoför listesi alınırken hata oluştu" 
      });
    }
  });

  // Yolculuk Listesi API test endpoint
  app.get("/api/test/yolculuklar", authenticateApiKey, async (req, res) => {
    try {
      const { durum } = req.query;
      
      let yolculukListesi;
      if (durum) {
        yolculukListesi = await db.select({
          yolculuk_id: yolculuklar.yolculuk_id,
          baslangic_noktasi: yolculuklar.baslangic_noktasi,
          bitis_noktasi: yolculuklar.bitis_noktasi,
          baslama_zamani: yolculuklar.baslama_zamani,
          bitis_zamani: yolculuklar.bitis_zamani,
          mesafe: yolculuklar.mesafe,
          durum: yolculuklar.durum,
          arac_plaka: araclar.plaka,
          sofor_adi: soforler.ad_soyad
        })
        .from(yolculuklar)
        .leftJoin(araclar, eq(yolculuklar.arac_id, araclar.arac_id))
        .leftJoin(soforler, eq(yolculuklar.sofor_id, soforler.sofor_id))
        .where(eq(yolculuklar.durum, durum as string));
      } else {
        yolculukListesi = await db.select({
          yolculuk_id: yolculuklar.yolculuk_id,
          baslangic_noktasi: yolculuklar.baslangic_noktasi,
          bitis_noktasi: yolculuklar.bitis_noktasi,
          baslama_zamani: yolculuklar.baslama_zamani,
          bitis_zamani: yolculuklar.bitis_zamani,
          mesafe: yolculuklar.mesafe,
          durum: yolculuklar.durum,
          arac_plaka: araclar.plaka,
          sofor_adi: soforler.ad_soyad
        })
        .from(yolculuklar)
        .leftJoin(araclar, eq(yolculuklar.arac_id, araclar.arac_id))
        .leftJoin(soforler, eq(yolculuklar.sofor_id, soforler.sofor_id));
      }
      
      res.json({
        success: true,
        data: yolculukListesi,
        message: "Yolculuk listesi başarıyla alındı",
        count: yolculukListesi.length
      });
    } catch (error) {
      console.error("Yolculuk listesi API hatası:", error);
      res.status(500).json({ 
        success: false, 
        message: "Yolculuk listesi alınırken hata oluştu" 
      });
    }
  });

  // Araç Detay API test endpoint
  app.get("/api/test/araclar/:id", authenticateApiKey, async (req, res) => {
    try {
      const { id } = req.params;
      const [arac] = await db.select().from(araclar).where(eq(araclar.arac_id, id));
      
      if (!arac) {
        return res.status(404).json({
          success: false,
          message: "Araç bulunamadı"
        });
      }
      
      res.json({
        success: true,
        data: arac,
        message: "Araç detayı başarıyla alındı"
      });
    } catch (error) {
      console.error("Araç detay API hatası:", error);
      res.status(500).json({ 
        success: false, 
        message: "Araç detayı alınırken hata oluştu" 
      });
    }
  });

  // API Test Dashboard endpoint
  app.get("/api/test/dashboard", authenticateApiKey, async (req, res) => {
    try {
      const tumAraclar = await db.select().from(araclar);
      const tumSoforler = await db.select().from(soforler);
      const tumYolculuklar = await db.select().from(yolculuklar);
      
      const aktifAraclar = await db.select().from(araclar).where(eq(araclar.durum, 'aktif'));
      const devamEdenYolculuklar = await db.select().from(yolculuklar).where(eq(yolculuklar.durum, 'devam_ediyor'));
      
      res.json({
        success: true,
        data: {
          toplam_arac: tumAraclar.length,
          aktif_arac: aktifAraclar.length,
          toplam_sofor: tumSoforler.length,
          devam_eden_yolculuk: devamEdenYolculuklar.length,
          toplam_yolculuk: tumYolculuklar.length
        },
        message: "Dashboard verileri başarıyla alındı"
      });
    } catch (error) {
      console.error("Dashboard API hatası:", error);
      res.status(500).json({ 
        success: false, 
        message: "Dashboard verileri alınırken hata oluştu" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
