import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertApiSchema, updateApiSchema } from "@shared/schema";
import { z } from "zod";
import swaggerUi from "swagger-ui-express";

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

  const httpServer = createServer(app);
  return httpServer;
}
