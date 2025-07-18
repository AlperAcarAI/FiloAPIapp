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

  // ============== EXTENDED TEST API ENDPOINTS ==============
  // Tüm API tanımlarını test endpoint'leri olarak ekleyelim
  
  // Araç Yönetimi API'leri
  app.get("/api/test/arac-listesi", authenticateApiKey, async (req, res) => {
    try {
      const aracListesi = await db.select().from(araclar);
      res.json({
        success: true,
        data: aracListesi,
        message: "Araç listesi API test endpoint'i",
        api_info: {
          name: "Araç Listesi API",
          description: "Tüm araçları listeler",
          version: "1.0",
          endpoint: "/api/test/arac-listesi"
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Test API hatası" });
    }
  });

  app.post("/api/test/arac-ekle", authenticateApiKey, async (req, res) => {
    try {
      const { plaka, marka, model, tur } = req.body;
      res.json({
        success: true,
        data: {
          message: "Araç ekleme simülasyonu başarılı",
          test_data: { plaka, marka, model, tur, id: "test-" + Date.now() }
        },
        api_info: {
          name: "Araç Ekleme API",
          description: "Yeni araç ekler",
          version: "1.0",
          endpoint: "/api/test/arac-ekle"
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Test API hatası" });
    }
  });

  app.put("/api/test/arac-guncelle/:id", authenticateApiKey, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      res.json({
        success: true,
        data: {
          message: "Araç güncelleme simülasyonu başarılı",
          test_data: { id, ...updateData, updated_at: new Date() }
        },
        api_info: {
          name: "Araç Güncelleme API",
          description: "Araç bilgilerini günceller",
          version: "1.0",
          endpoint: "/api/test/arac-guncelle/:id"
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Test API hatası" });
    }
  });

  app.delete("/api/test/arac-sil/:id", authenticateApiKey, async (req, res) => {
    try {
      const { id } = req.params;
      res.json({
        success: true,
        data: {
          message: "Araç silme simülasyonu başarılı",
          test_data: { deleted_id: id, deleted_at: new Date() }
        },
        api_info: {
          name: "Araç Silme API",
          description: "Araç kaydını siler",
          version: "1.0",
          endpoint: "/api/test/arac-sil/:id"
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Test API hatası" });
    }
  });

  // Şoför Yönetimi API'leri
  app.get("/api/test/sofor-listesi", authenticateApiKey, async (req, res) => {
    try {
      const soforListesi = await db.select().from(soforler);
      res.json({
        success: true,
        data: soforListesi,
        message: "Şoför listesi API test endpoint'i",
        api_info: {
          name: "Şoför Listesi API",
          description: "Tüm şoförleri listeler",
          version: "1.0",
          endpoint: "/api/test/sofor-listesi"
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Test API hatası" });
    }
  });

  app.post("/api/test/sofor-ekle", authenticateApiKey, async (req, res) => {
    try {
      const { ad_soyad, tc_kimlik, ehliyet_no, telefon } = req.body;
      res.json({
        success: true,
        data: {
          message: "Şoför ekleme simülasyonu başarılı",
          test_data: { ad_soyad, tc_kimlik, ehliyet_no, telefon, id: "test-" + Date.now() }
        },
        api_info: {
          name: "Şoför Ekleme API",
          description: "Yeni şoför ekler",
          version: "1.0",
          endpoint: "/api/test/sofor-ekle"
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Test API hatası" });
    }
  });

  app.put("/api/test/sofor-guncelle/:id", authenticateApiKey, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      res.json({
        success: true,
        data: {
          message: "Şoför güncelleme simülasyonu başarılı",
          test_data: { id, ...updateData, updated_at: new Date() }
        },
        api_info: {
          name: "Şoför Güncelleme API",
          description: "Şoför bilgilerini günceller",
          version: "1.0",
          endpoint: "/api/test/sofor-guncelle/:id"
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Test API hatası" });
    }
  });

  app.delete("/api/test/sofor-sil/:id", authenticateApiKey, async (req, res) => {
    try {
      const { id } = req.params;
      res.json({
        success: true,
        data: {
          message: "Şoför silme simülasyonu başarılı",
          test_data: { deleted_id: id, deleted_at: new Date() }
        },
        api_info: {
          name: "Şoför Silme API",
          description: "Şoför kaydını siler",
          version: "1.0",
          endpoint: "/api/test/sofor-sil/:id"
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Test API hatası" });
    }
  });

  // Yolculuk Yönetimi API'leri
  app.get("/api/test/yolculuk-listesi", authenticateApiKey, async (req, res) => {
    try {
      const yolculukListesi = await db.select().from(yolculuklar);
      res.json({
        success: true,
        data: yolculukListesi,
        message: "Yolculuk listesi API test endpoint'i",
        api_info: {
          name: "Yolculuk Listesi API",
          description: "Tüm yolculukları listeler",
          version: "1.0",
          endpoint: "/api/test/yolculuk-listesi"
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Test API hatası" });
    }
  });

  app.post("/api/test/yolculuk-basla", authenticateApiKey, async (req, res) => {
    try {
      const { arac_id, sofor_id, baslangic_konum, bitis_konum } = req.body;
      res.json({
        success: true,
        data: {
          message: "Yolculuk başlatma simülasyonu başarılı",
          test_data: { 
            arac_id, sofor_id, baslangic_konum, bitis_konum, 
            yolculuk_id: "test-" + Date.now(),
            baslangi_zamani: new Date(),
            durum: "devam_ediyor"
          }
        },
        api_info: {
          name: "Yolculuk Başlatma API",
          description: "Yeni yolculuk başlatır",
          version: "1.0",
          endpoint: "/api/test/yolculuk-basla"
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Test API hatası" });
    }
  });

  app.put("/api/test/yolculuk-bitir/:id", authenticateApiKey, async (req, res) => {
    try {
      const { id } = req.params;
      const { bitis_konum, mesafe } = req.body;
      res.json({
        success: true,
        data: {
          message: "Yolculuk bitirme simülasyonu başarılı",
          test_data: { 
            yolculuk_id: id, 
            bitis_konum, 
            mesafe,
            bitis_zamani: new Date(),
            durum: "tamamlandi"
          }
        },
        api_info: {
          name: "Yolculuk Bitirme API",
          description: "Yolculuğu tamamlar",
          version: "1.0",
          endpoint: "/api/test/yolculuk-bitir/:id"
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Test API hatası" });
    }
  });

  // Raporlama API'leri
  app.get("/api/test/arac-raporu", authenticateApiKey, async (req, res) => {
    try {
      const aracListesi = await db.select().from(araclar);
      const toplamArac = aracListesi.length;
      const aktifArac = aracListesi.filter((a: any) => a.durum === 'aktif').length;
      const bakimArac = aracListesi.filter((a: any) => a.durum === 'bakim').length;
      const arizaArac = aracListesi.filter((a: any) => a.durum === 'ariza').length;
      
      res.json({
        success: true,
        data: {
          toplam_arac: toplamArac,
          aktif_arac: aktifArac,
          bakimda_arac: bakimArac,
          arizali_arac: arizaArac,
          kullanim_orani: `${((aktifArac / toplamArac) * 100).toFixed(1)}%`,
          detay: aracListesi
        },
        message: "Araç raporu API test endpoint'i",
        api_info: {
          name: "Araç Raporu API",
          description: "Araç durum raporu",
          version: "1.0",
          endpoint: "/api/test/arac-raporu"
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Test API hatası" });
    }
  });

  app.get("/api/test/sofor-raporu", authenticateApiKey, async (req, res) => {
    try {
      const soforListesi = await db.select().from(soforler);
      const toplamSofor = soforListesi.length;
      const aktifSofor = soforListesi.filter((s: any) => s.durum === 'aktif').length;
      const izinliSofor = soforListesi.filter((s: any) => s.durum === 'izinli').length;
      
      res.json({
        success: true,
        data: {
          toplam_sofor: toplamSofor,
          aktif_sofor: aktifSofor,
          izinli_sofor: izinliSofor,
          musaitlik_orani: `${((aktifSofor / toplamSofor) * 100).toFixed(1)}%`,
          detay: soforListesi
        },
        message: "Şoför raporu API test endpoint'i",
        api_info: {
          name: "Şoför Raporu API",
          description: "Şoför durum raporu",
          version: "1.0",
          endpoint: "/api/test/sofor-raporu"
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Test API hatası" });
    }
  });

  app.get("/api/test/yolculuk-raporu", authenticateApiKey, async (req, res) => {
    try {
      const yolculukListesi = await db.select().from(yolculuklar);
      const toplamYolculuk = yolculukListesi.length;
      const tamamlananYolculuk = yolculukListesi.filter((y: any) => y.durum === 'tamamlandi').length;
      const devamEdenYolculuk = yolculukListesi.filter((y: any) => y.durum === 'devam_ediyor').length;
      
      res.json({
        success: true,
        data: {
          toplam_yolculuk: toplamYolculuk,
          tamamlanan_yolculuk: tamamlananYolculuk,
          devam_eden_yolculuk: devamEdenYolculuk,
          tamamlanma_orani: `${((tamamlananYolculuk / toplamYolculuk) * 100).toFixed(1)}%`,
          detay: yolculukListesi
        },
        message: "Yolculuk raporu API test endpoint'i",
        api_info: {
          name: "Yolculuk Raporu API",
          description: "Yolculuk durum raporu",
          version: "1.0",
          endpoint: "/api/test/yolculuk-raporu"
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Test API hatası" });
    }
  });

  // Bakım Yönetimi API'leri
  app.get("/api/test/bakim-listesi", authenticateApiKey, async (req, res) => {
    try {
      const bakimAraclari = await db.select().from(araclar).where(eq(araclar.durum, 'bakim'));
      res.json({
        success: true,
        data: bakimAraclari.map(arac => ({
          ...arac,
          bakim_turu: "Periyodik Bakım",
          bakim_tarihi: new Date(),
          tahmini_sure: "2-3 gün",
          maliyet: "5,000 TL"
        })),
        message: "Bakım listesi API test endpoint'i",
        api_info: {
          name: "Bakım Listesi API",
          description: "Bakımdaki araçları listeler",
          version: "1.0",
          endpoint: "/api/test/bakim-listesi"
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Test API hatası" });
    }
  });

  app.post("/api/test/bakim-planla", authenticateApiKey, async (req, res) => {
    try {
      const { arac_id, bakim_turu, planli_tarih } = req.body;
      res.json({
        success: true,
        data: {
          message: "Bakım planlama simülasyonu başarılı",
          test_data: { 
            arac_id, 
            bakim_turu, 
            planli_tarih,
            bakim_id: "test-bakim-" + Date.now(),
            durum: "planli"
          }
        },
        api_info: {
          name: "Bakım Planlama API",
          description: "Araç bakımı planlar",
          version: "1.0",
          endpoint: "/api/test/bakim-planla"
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Test API hatası" });
    }
  });

  // Yakıt Yönetimi API'leri
  app.get("/api/test/yakit-durumu", authenticateApiKey, async (req, res) => {
    try {
      const aracListesi = await db.select().from(araclar);
      const yakitDurumu = aracListesi.map((arac: any) => ({
        arac_id: arac.arac_id,
        plaka: arac.plaka,
        marka: arac.marka,
        yakit_seviyesi: arac.yakit_seviyesi,
        depo_kapasitesi: "500L",
        gunluk_tuketim: "80L",
        maliyet: "45 TL/L"
      }));
      
      res.json({
        success: true,
        data: yakitDurumu,
        message: "Yakıt durumu API test endpoint'i",
        api_info: {
          name: "Yakıt Durumu API",
          description: "Araçların yakıt durumunu gösterir",
          version: "1.0",
          endpoint: "/api/test/yakit-durumu"
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Test API hatası" });
    }
  });

  app.post("/api/test/yakit-doldur", authenticateApiKey, async (req, res) => {
    try {
      const { arac_id, litre, istasyon, fiyat } = req.body;
      res.json({
        success: true,
        data: {
          message: "Yakıt doldurma simülasyonu başarılı",
          test_data: { 
            arac_id, 
            litre, 
            istasyon, 
            fiyat,
            tarih: new Date(),
            toplam_maliyet: litre * fiyat,
            fiş_no: "YAK-" + Date.now()
          }
        },
        api_info: {
          name: "Yakıt Doldurma API",
          description: "Yakıt doldurma kaydı",
          version: "1.0",
          endpoint: "/api/test/yakit-doldur"
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Test API hatası" });
    }
  });

  // Konum Takibi API'leri
  app.get("/api/test/konum-takibi", authenticateApiKey, async (req, res) => {
    try {
      const aracListesi = await db.select().from(araclar);
      const konumBilgileri = aracListesi.map((arac: any) => ({
        arac_id: arac.arac_id,
        plaka: arac.plaka,
        son_konum: arac.son_konum,
        enlem: Math.random() * 180 - 90,
        boylam: Math.random() * 360 - 180,
        hiz: Math.floor(Math.random() * 80) + "km/h",
        son_guncelleme: new Date()
      }));
      
      res.json({
        success: true,
        data: konumBilgileri,
        message: "Konum takibi API test endpoint'i",
        api_info: {
          name: "Konum Takibi API",
          description: "Araç konumlarını takip eder",
          version: "1.0",
          endpoint: "/api/test/konum-takibi"
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Test API hatası" });
    }
  });

  // Bildirimlerin API'leri
  app.get("/api/test/bildirimler", authenticateApiKey, async (req, res) => {
    try {
      const bildirimler = [
        {
          id: 1,
          tip: "uyari",
          baslik: "Yakıt Seviyesi Düşük",
          mesaj: "06ABC123 plakalı araç yakıt seviyesi %25'in altında",
          tarih: new Date(),
          okundu: false
        },
        {
          id: 2,
          tip: "bilgi",
          baslik: "Bakım Hatırlatması",
          mesaj: "34DEF456 plakalı araç için bakım zamanı geldi",
          tarih: new Date(),
          okundu: true
        },
        {
          id: 3,
          tip: "kritik",
          baslik: "Araç Arızası",
          mesaj: "42PQR678 plakalı araç arıza bildirimi",
          tarih: new Date(),
          okundu: false
        }
      ];
      
      res.json({
        success: true,
        data: bildirimler,
        message: "Bildirimler API test endpoint'i",
        api_info: {
          name: "Bildirimler API",
          description: "Sistem bildirimlerini listeler",
          version: "1.0",
          endpoint: "/api/test/bildirimler"
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Test API hatası" });
    }
  });

  // Gelişmiş Raporlama API'leri
  app.get("/api/test/gelir-raporu", authenticateApiKey, async (req, res) => {
    try {
      const gelirVerisi = {
        gunluk_gelir: 45000,
        haftalik_gelir: 315000,
        aylik_gelir: 1350000,
        yillik_gelir: 16200000,
        ortalama_gun_gelir: 45000,
        en_kazancli_gun: "Pazartesi",
        gelir_kaynaklari: [
          { kaynak: "Kargo Taşımacılığı", miktar: 850000, yuzde: 63 },
          { kaynak: "Yolcu Taşımacılığı", miktar: 300000, yuzde: 22 },
          { kaynak: "Özel Hizmetler", miktar: 200000, yuzde: 15 }
        ]
      };
      
      res.json({
        success: true,
        data: gelirVerisi,
        message: "Gelir raporu API test endpoint'i",
        api_info: {
          name: "Gelir Raporu API",
          description: "Finansal gelir raporları",
          version: "1.0",
          endpoint: "/api/test/gelir-raporu"
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Test API hatası" });
    }
  });

  app.get("/api/test/gider-raporu", authenticateApiKey, async (req, res) => {
    try {
      const giderVerisi = {
        gunluk_gider: 28000,
        haftalik_gider: 196000,
        aylik_gider: 840000,
        yillik_gider: 10080000,
        ortalama_gun_gider: 28000,
        en_giderli_kategori: "Yakıt",
        gider_kategorileri: [
          { kategori: "Yakıt", miktar: 420000, yuzde: 50 },
          { kategori: "Bakım", miktar: 168000, yuzde: 20 },
          { kategori: "Personel", miktar: 126000, yuzde: 15 },
          { kategori: "Sigorta", miktar: 84000, yuzde: 10 },
          { kategori: "Diğer", miktar: 42000, yuzde: 5 }
        ]
      };
      
      res.json({
        success: true,
        data: giderVerisi,
        message: "Gider raporu API test endpoint'i",
        api_info: {
          name: "Gider Raporu API",
          description: "Finansal gider raporları",
          version: "1.0",
          endpoint: "/api/test/gider-raporu"
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Test API hatası" });
    }
  });

  app.get("/api/test/kar-zarar-raporu", authenticateApiKey, async (req, res) => {
    try {
      const karZararVerisi = {
        net_kar: 510000,
        brut_kar: 1350000,
        kar_marji: 37.8,
        onceki_ay_kar: 480000,
        kar_artis_orani: 6.25,
        karlillik_analizi: {
          en_karlı_hizmet: "Kargo Taşımacılığı",
          en_karlı_rota: "Ankara-İstanbul",
          en_karlı_arac: "Mercedes Actros",
          kar_trendi: "Yükseliş"
        }
      };
      
      res.json({
        success: true,
        data: karZararVerisi,
        message: "Kar-zarar raporu API test endpoint'i",
        api_info: {
          name: "Kar-Zarar Raporu API",
          description: "Karlılık analizi raporları",
          version: "1.0",
          endpoint: "/api/test/kar-zarar-raporu"
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Test API hatası" });
    }
  });

  // Performans Analizi API'leri
  app.get("/api/test/performans-analizi", authenticateApiKey, async (req, res) => {
    try {
      const performansVerisi = {
        genel_performans_skoru: 8.5,
        arac_performansi: {
          ortalama_hiz: 65,
          yakit_verimliligi: 4.2,
          uptime_orani: 94.5,
          zamaninda_teslimat: 96.8
        },
        sofor_performansi: {
          ortalama_puan: 8.7,
          guvenli_surus: 92,
          musteri_memnuniyeti: 4.6,
          zamaninda_varma: 89
        },
        kpi_metrikleri: {
          malyet_per_km: 2.8,
          gelir_per_km: 4.2,
          mudak_basina_kar: 1.4,
          arac_kullanim_orani: 78
        }
      };
      
      res.json({
        success: true,
        data: performansVerisi,
        message: "Performans analizi API test endpoint'i",
        api_info: {
          name: "Performans Analizi API",
          description: "Detaylı performans metrikleri",
          version: "1.0",
          endpoint: "/api/test/performans-analizi"
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Test API hatası" });
    }
  });

  // Güvenlik ve Uyumluluk API'leri
  app.get("/api/test/guvenlik-raporu", authenticateApiKey, async (req, res) => {
    try {
      const guvenlikVerisi = {
        genel_guvenlik_skoru: 9.2,
        kaza_istatistikleri: {
          toplam_kaza: 2,
          hafif_kaza: 1,
          agir_kaza: 1,
          kaza_orani: 0.05,
          kaza_free_gun: 120
        },
        uyumluluk_durumu: {
          ehliyet_gecerliligi: 98,
          muayene_durumu: 95,
          sigorta_durumu: 100,
          izin_belgesi: 97
        },
        risk_analizi: {
          yuksek_risk: 3,
          orta_risk: 8,
          dusuk_risk: 23,
          risk_skoru: 7.8
        }
      };
      
      res.json({
        success: true,
        data: guvenlikVerisi,
        message: "Güvenlik raporu API test endpoint'i",
        api_info: {
          name: "Güvenlik Raporu API",
          description: "Güvenlik ve uyumluluk raporları",
          version: "1.0",
          endpoint: "/api/test/guvenlik-raporu"
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Test API hatası" });
    }
  });

  // Test API'lerinin listesi
  app.get("/api/test/endpoint-listesi", authenticateApiKey, async (req, res) => {
    try {
      const endpoints = [
        // Temel Veriler
        { name: "Araç Listesi", endpoint: "/api/test/araclar", method: "GET", category: "Temel Veriler" },
        { name: "Şoför Listesi", endpoint: "/api/test/soforler", method: "GET", category: "Temel Veriler" },
        { name: "Yolculuk Listesi", endpoint: "/api/test/yolculuklar", method: "GET", category: "Temel Veriler" },
        { name: "Dashboard", endpoint: "/api/test/dashboard", method: "GET", category: "Temel Veriler" },
        
        // Araç Yönetimi
        { name: "Araç Listesi (Detaylı)", endpoint: "/api/test/arac-listesi", method: "GET", category: "Araç Yönetimi" },
        { name: "Araç Ekleme", endpoint: "/api/test/arac-ekle", method: "POST", category: "Araç Yönetimi" },
        { name: "Araç Güncelleme", endpoint: "/api/test/arac-guncelle/:id", method: "PUT", category: "Araç Yönetimi" },
        { name: "Araç Silme", endpoint: "/api/test/arac-sil/:id", method: "DELETE", category: "Araç Yönetimi" },
        
        // Şoför Yönetimi
        { name: "Şoför Listesi (Detaylı)", endpoint: "/api/test/sofor-listesi", method: "GET", category: "Şoför Yönetimi" },
        { name: "Şoför Ekleme", endpoint: "/api/test/sofor-ekle", method: "POST", category: "Şoför Yönetimi" },
        { name: "Şoför Güncelleme", endpoint: "/api/test/sofor-guncelle/:id", method: "PUT", category: "Şoför Yönetimi" },
        { name: "Şoför Silme", endpoint: "/api/test/sofor-sil/:id", method: "DELETE", category: "Şoför Yönetimi" },
        
        // Yolculuk Yönetimi
        { name: "Yolculuk Listesi (Detaylı)", endpoint: "/api/test/yolculuk-listesi", method: "GET", category: "Yolculuk Yönetimi" },
        { name: "Yolculuk Başlatma", endpoint: "/api/test/yolculuk-basla", method: "POST", category: "Yolculuk Yönetimi" },
        { name: "Yolculuk Bitirme", endpoint: "/api/test/yolculuk-bitir/:id", method: "PUT", category: "Yolculuk Yönetimi" },
        
        // Raporlama
        { name: "Araç Raporu", endpoint: "/api/test/arac-raporu", method: "GET", category: "Raporlama" },
        { name: "Şoför Raporu", endpoint: "/api/test/sofor-raporu", method: "GET", category: "Raporlama" },
        { name: "Yolculuk Raporu", endpoint: "/api/test/yolculuk-raporu", method: "GET", category: "Raporlama" },
        { name: "Gelir Raporu", endpoint: "/api/test/gelir-raporu", method: "GET", category: "Raporlama" },
        { name: "Gider Raporu", endpoint: "/api/test/gider-raporu", method: "GET", category: "Raporlama" },
        { name: "Kar-Zarar Raporu", endpoint: "/api/test/kar-zarar-raporu", method: "GET", category: "Raporlama" },
        
        // Bakım Yönetimi
        { name: "Bakım Listesi", endpoint: "/api/test/bakim-listesi", method: "GET", category: "Bakım Yönetimi" },
        { name: "Bakım Planlama", endpoint: "/api/test/bakim-planla", method: "POST", category: "Bakım Yönetimi" },
        
        // Yakıt Yönetimi
        { name: "Yakıt Durumu", endpoint: "/api/test/yakit-durumu", method: "GET", category: "Yakıt Yönetimi" },
        { name: "Yakıt Doldurma", endpoint: "/api/test/yakit-doldur", method: "POST", category: "Yakıt Yönetimi" },
        
        // Konum Takibi
        { name: "Konum Takibi", endpoint: "/api/test/konum-takibi", method: "GET", category: "Konum Takibi" },
        
        // Bildirimler
        { name: "Bildirimler", endpoint: "/api/test/bildirimler", method: "GET", category: "Bildirimler" },
        
        // Performans ve Güvenlik
        { name: "Performans Analizi", endpoint: "/api/test/performans-analizi", method: "GET", category: "Performans" },
        { name: "Güvenlik Raporu", endpoint: "/api/test/guvenlik-raporu", method: "GET", category: "Güvenlik" },
        
        // Sistem
        { name: "Endpoint Listesi", endpoint: "/api/test/endpoint-listesi", method: "GET", category: "Sistem" }
      ];
      
      res.json({
        success: true,
        data: endpoints,
        total: endpoints.length,
        categories: [...new Set(endpoints.map(e => e.category))],
        message: "Test API endpoint'leri listesi",
        api_info: {
          name: "Test API Endpoint Listesi",
          description: "Tüm test API endpoint'lerini kategorilere göre listeler",
          version: "1.0",
          endpoint: "/api/test/endpoint-listesi"
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Test API hatası" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
