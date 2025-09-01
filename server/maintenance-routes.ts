import { Router } from "express";
import { z } from "zod";
import { db } from "./db.js";
import { 
  maintenanceTypes, 
  assetsMaintenance, 
  assets, 
  personnel,
  insertMaintenanceTypeSchema,
  updateMaintenanceTypeSchema,
  insertAssetsMaintenanceSchema,
  updateAssetsMaintenanceSchema
} from "../shared/schema.js";
import { authenticateToken, AuthRequest } from "./auth.js";
// Removed hierarchical auth for now - using basic JWT auth
// import { auditLog } from "./audit-middleware.js";
import { eq, and, ilike, desc, asc, sql, gte, lte } from "drizzle-orm";

const router = Router();

// ========================
// BAKIM TÜRLERİ API'LERİ
// ========================

// Bakım türleri listesi
router.get("/maintenance-types", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { search, activeOnly = 'true', limit, offset, sortBy = 'name', sortOrder = 'asc' } = req.query;
    
    // Build conditions
    const conditions = [];
    if (activeOnly === 'true') {
      conditions.push(eq(maintenanceTypes.isActive, true));
    }
    if (search) {
      conditions.push(ilike(maintenanceTypes.name, `%${search}%`));
    }

    // Get total count
    const totalCountQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(maintenanceTypes);
    
    if (conditions.length > 0) {
      totalCountQuery.where(and(...conditions));
    }
    
    const [{ count: totalCount }] = await totalCountQuery;

    // Main query
    let query = db
      .select({
        id: maintenanceTypes.id,
        name: maintenanceTypes.name,
        isActive: maintenanceTypes.isActive
      })
      .from(maintenanceTypes);

    if (conditions.length > 0) {
      query.where(and(...conditions));
    }

    // Sorting
    const orderColumn = sortBy === 'id' ? maintenanceTypes.id : maintenanceTypes.name;
    query.orderBy(sortOrder === 'desc' ? desc(orderColumn) : asc(orderColumn));

    // Pagination
    const finalLimit = limit ? Number(limit) : 50;
    const finalOffset = offset ? Number(offset) : 0;
    query.limit(finalLimit).offset(finalOffset);

    const typesList = await query;

    res.json({
      success: true,
      message: "Bakım türleri başarıyla getirildi",
      data: typesList,
      count: typesList.length,
      totalCount: Number(totalCount),
      pagination: {
        limit: finalLimit,
        offset: finalOffset,
        hasMore: typesList.length === finalLimit
      },
      filters: {
        search: search || null,
        activeOnly: activeOnly === 'true',
        sortBy,
        sortOrder
      }
    });
  } catch (error) {
    console.error("Bakım türleri getirme hatası:", error);
    res.status(500).json({
      success: false,
      error: "MAINTENANCE_TYPES_FETCH_ERROR",
      message: "Bakım türleri listesi alınırken hata oluştu"
    });
  }
});

// Tekil bakım türü
router.get("/maintenance-types/:id", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    const [maintenanceType] = await db
      .select({
        id: maintenanceTypes.id,
        name: maintenanceTypes.name,
        isActive: maintenanceTypes.isActive
      })
      .from(maintenanceTypes)
      .where(eq(maintenanceTypes.id, Number(id)));

    if (!maintenanceType) {
      return res.status(404).json({
        success: false,
        error: "MAINTENANCE_TYPE_NOT_FOUND",
        message: "Bakım türü bulunamadı"
      });
    }

    res.json({
      success: true,
      message: "Bakım türü detayı başarıyla getirildi",
      data: maintenanceType
    });
  } catch (error) {
    console.error("Bakım türü detay hatası:", error);
    res.status(500).json({
      success: false,
      error: "MAINTENANCE_TYPE_DETAIL_ERROR",
      message: "Bakım türü detayı alınırken hata oluştu"
    });
  }
});

// Yeni bakım türü oluştur (Admin gerekli)
router.post("/maintenance-types", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const validatedData = insertMaintenanceTypeSchema.parse(req.body);
    
    const [newMaintenanceType] = await db
      .insert(maintenanceTypes)
      .values(validatedData)
      .returning({
        id: maintenanceTypes.id,
        name: maintenanceTypes.name,
        isActive: maintenanceTypes.isActive
      });

    // Audit log removed for now
    // await auditLog({ ... });

    res.status(201).json({
      success: true,
      message: "Bakım türü başarıyla oluşturuldu",
      data: newMaintenanceType
    });
  } catch (error) {
    console.error("Bakım türü oluşturma hatası:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "VALIDATION_ERROR",
        message: "Geçersiz veri formatı",
        details: error.errors
      });
    }
    res.status(500).json({
      success: false,
      error: "MAINTENANCE_TYPE_CREATE_ERROR",
      message: "Bakım türü oluşturulamadı"
    });
  }
});

// Bakım türü güncelle (Admin gerekli)
router.put("/maintenance-types/:id", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateMaintenanceTypeSchema.parse(req.body);
    
    const [updatedMaintenanceType] = await db
      .update(maintenanceTypes)
      .set(validatedData)
      .where(eq(maintenanceTypes.id, Number(id)))
      .returning({
        id: maintenanceTypes.id,
        name: maintenanceTypes.name,
        isActive: maintenanceTypes.isActive
      });

    if (!updatedMaintenanceType) {
      return res.status(404).json({
        success: false,
        error: "MAINTENANCE_TYPE_NOT_FOUND",
        message: "Bakım türü bulunamadı"
      });
    }

    // Audit log removed for now
    // await auditLog({ ... });

    res.json({
      success: true,
      message: "Bakım türü başarıyla güncellendi",
      data: updatedMaintenanceType
    });
  } catch (error) {
    console.error("Bakım türü güncelleme hatası:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "VALIDATION_ERROR",
        message: "Geçersiz veri formatı",
        details: error.errors
      });
    }
    res.status(500).json({
      success: false,
      error: "MAINTENANCE_TYPE_UPDATE_ERROR",
      message: "Bakım türü güncellenemedi"
    });
  }
});

// Bakım türü sil (Admin gerekli - Soft delete)
router.delete("/maintenance-types/:id", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    const [deletedMaintenanceType] = await db
      .update(maintenanceTypes)
      .set({ isActive: false })
      .where(eq(maintenanceTypes.id, Number(id)))
      .returning({
        id: maintenanceTypes.id,
        name: maintenanceTypes.name,
        isActive: maintenanceTypes.isActive
      });

    if (!deletedMaintenanceType) {
      return res.status(404).json({
        success: false,
        error: "MAINTENANCE_TYPE_NOT_FOUND",
        message: "Bakım türü bulunamadı"
      });
    }

    // Audit log removed for now
    // await auditLog({ ... });

    res.json({
      success: true,
      message: "Bakım türü başarıyla silindi",
      data: deletedMaintenanceType
    });
  } catch (error) {
    console.error("Bakım türü silme hatası:", error);
    res.status(500).json({
      success: false,
      error: "MAINTENANCE_TYPE_DELETE_ERROR",
      message: "Bakım türü silinemedi"
    });
  }
});

// ========================
// BAKIM KAYITLARI API'LERİ
// ========================

// Bakım kayıtları listesi
router.get("/maintenance-records", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { 
      search, 
      assetId, 
      maintenanceTypeId, 
      startDate, 
      endDate, 
      upcomingOnly,
      activeOnly = 'true', 
      limit, 
      offset, 
      sortBy = 'maintenance_date', 
      sortOrder = 'desc' 
    } = req.query;
    
    // Build conditions
    const conditions = [];
    if (activeOnly === 'true') {
      conditions.push(eq(assetsMaintenance.isActive, true));
    }
    if (assetId) {
      conditions.push(eq(assetsMaintenance.assetId, Number(assetId)));
    }
    if (maintenanceTypeId) {
      conditions.push(eq(assetsMaintenance.maintenanceTypeId, Number(maintenanceTypeId)));
    }
    if (startDate) {
      conditions.push(gte(assetsMaintenance.maintenanceDate, String(startDate)));
    }
    if (endDate) {
      conditions.push(lte(assetsMaintenance.maintenanceDate, String(endDate)));
    }
    if (upcomingOnly === 'true') {
      conditions.push(gte(assetsMaintenance.dueByDate, sql`CURRENT_DATE`));
    }
    if (search) {
      conditions.push(ilike(assetsMaintenance.description, `%${search}%`));
    }

    // Get total count
    const totalCountQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(assetsMaintenance);
    
    if (conditions.length > 0) {
      totalCountQuery.where(and(...conditions));
    }
    
    const [{ count: totalCount }] = await totalCountQuery;

    // Main query with joins
    let query = db
      .select({
        id: assetsMaintenance.id,
        assetId: assetsMaintenance.assetId,
        maintenanceTypeId: assetsMaintenance.maintenanceTypeId,
        maintenanceDate: assetsMaintenance.maintenanceDate,
        dueByDate: assetsMaintenance.dueByDate,
        kmReading: assetsMaintenance.kmReading,
        amountCents: assetsMaintenance.amountCents,
        description: assetsMaintenance.description,
        serviceProvider: assetsMaintenance.serviceProvider,
        warrantyUntil: assetsMaintenance.warrantyUntil,
        isActive: assetsMaintenance.isActive,
        createdAt: assetsMaintenance.createdAt,
        updatedAt: assetsMaintenance.updatedAt,
        // Joined data
        plateNumber: assets.plateNumber,
        maintenanceTypeName: maintenanceTypes.name
      })
      .from(assetsMaintenance)
      .leftJoin(assets, eq(assetsMaintenance.assetId, assets.id))
      .leftJoin(maintenanceTypes, eq(assetsMaintenance.maintenanceTypeId, maintenanceTypes.id));

    if (conditions.length > 0) {
      query.where(and(...conditions));
    }

    // Sorting
    let orderColumn;
    switch (sortBy) {
      case 'maintenance_date':
        orderColumn = assetsMaintenance.maintenanceDate;
        break;
      case 'due_by_date':
        orderColumn = assetsMaintenance.dueByDate;
        break;
      case 'amount_cents':
        orderColumn = assetsMaintenance.amountCents;
        break;
      case 'km_reading':
        orderColumn = assetsMaintenance.kmReading;
        break;
      default:
        orderColumn = assetsMaintenance.maintenanceDate;
    }
    query.orderBy(sortOrder === 'desc' ? desc(orderColumn) : asc(orderColumn));

    // Pagination
    const finalLimit = limit ? Number(limit) : 50;
    const finalOffset = offset ? Number(offset) : 0;
    query.limit(finalLimit).offset(finalOffset);

    const recordsList = await query;

    res.json({
      success: true,
      message: "Bakım kayıtları başarıyla getirildi",
      data: recordsList,
      count: recordsList.length,
      totalCount: Number(totalCount),
      pagination: {
        limit: finalLimit,
        offset: finalOffset,
        hasMore: recordsList.length === finalLimit
      },
      filters: {
        search: search || null,
        assetId: assetId ? Number(assetId) : null,
        maintenanceTypeId: maintenanceTypeId ? Number(maintenanceTypeId) : null,
        startDate: startDate || null,
        endDate: endDate || null,
        upcomingOnly: upcomingOnly === 'true',
        activeOnly: activeOnly === 'true',
        sortBy,
        sortOrder
      }
    });
  } catch (error) {
    console.error("Bakım kayıtları getirme hatası:", error);
    res.status(500).json({
      success: false,
      error: "MAINTENANCE_RECORDS_FETCH_ERROR",
      message: "Bakım kayıtları listesi alınırken hata oluştu"
    });
  }
});

// Tekil bakım kaydı
router.get("/maintenance-records/:id", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    const [maintenanceRecord] = await db
      .select({
        id: assetsMaintenance.id,
        assetId: assetsMaintenance.assetId,
        maintenanceTypeId: assetsMaintenance.maintenanceTypeId,
        maintenanceDate: assetsMaintenance.maintenanceDate,
        dueByDate: assetsMaintenance.dueByDate,
        kmReading: assetsMaintenance.kmReading,
        amountCents: assetsMaintenance.amountCents,
        description: assetsMaintenance.description,
        serviceProvider: assetsMaintenance.serviceProvider,
        warrantyUntil: assetsMaintenance.warrantyUntil,
        isActive: assetsMaintenance.isActive,
        createdAt: assetsMaintenance.createdAt,
        updatedAt: assetsMaintenance.updatedAt,
        createdBy: assetsMaintenance.createdBy,
        updatedBy: assetsMaintenance.updatedBy,
        // Joined data
        plateNumber: assets.plateNumber,
        chassisNo: assets.chassisNo,
        maintenanceTypeName: maintenanceTypes.name
      })
      .from(assetsMaintenance)
      .leftJoin(assets, eq(assetsMaintenance.assetId, assets.id))
      .leftJoin(maintenanceTypes, eq(assetsMaintenance.maintenanceTypeId, maintenanceTypes.id))
      .where(eq(assetsMaintenance.id, Number(id)));

    if (!maintenanceRecord) {
      return res.status(404).json({
        success: false,
        error: "MAINTENANCE_RECORD_NOT_FOUND",
        message: "Bakım kaydı bulunamadı"
      });
    }

    res.json({
      success: true,
      message: "Bakım kaydı detayı başarıyla getirildi",
      data: maintenanceRecord
    });
  } catch (error) {
    console.error("Bakım kaydı detay hatası:", error);
    res.status(500).json({
      success: false,
      error: "MAINTENANCE_RECORD_DETAIL_ERROR",
      message: "Bakım kaydı detayı alınırken hata oluştu"
    });
  }
});

// Yeni bakım kaydı oluştur
router.post("/maintenance-records", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const validatedData = insertAssetsMaintenanceSchema.parse(req.body);
    
    // Boş string'leri null'a dönüştür
    if (validatedData.dueByDate === "") validatedData.dueByDate = undefined;
    if (validatedData.warrantyUntil === "") validatedData.warrantyUntil = undefined;
    
    
    const [newMaintenanceRecord] = await db
      .insert(assetsMaintenance)
      .values({
        ...validatedData,
        createdBy: req.user?.personnelId || null,
        updatedBy: req.user?.personnelId || null
      })
      .returning({
        id: assetsMaintenance.id,
        assetId: assetsMaintenance.assetId,
        maintenanceTypeId: assetsMaintenance.maintenanceTypeId,
        maintenanceDate: assetsMaintenance.maintenanceDate,
        dueByDate: assetsMaintenance.dueByDate,
        kmReading: assetsMaintenance.kmReading,
        amountCents: assetsMaintenance.amountCents,
        description: assetsMaintenance.description,
        serviceProvider: assetsMaintenance.serviceProvider,
        warrantyUntil: assetsMaintenance.warrantyUntil,
        isActive: assetsMaintenance.isActive,
        createdAt: assetsMaintenance.createdAt,
        updatedAt: assetsMaintenance.updatedAt
      });

    // Audit log removed for now
    // await auditLog({ ... });

    res.status(201).json({
      success: true,
      message: "Bakım kaydı başarıyla oluşturuldu",
      data: newMaintenanceRecord
    });
  } catch (error) {
    console.error("Bakım kaydı oluşturma hatası:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "VALIDATION_ERROR",
        message: "Geçersiz veri formatı",
        details: error.errors
      });
    }
    res.status(500).json({
      success: false,
      error: "MAINTENANCE_RECORD_CREATE_ERROR",
      message: "Bakım kaydı oluşturulamadı"
    });
  }
});

// Bakım kaydı güncelle
router.put("/maintenance-records/:id", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateAssetsMaintenanceSchema.parse(req.body);
    
    // Boş string'leri null'a dönüştür
    if (validatedData.dueByDate === "") validatedData.dueByDate = undefined;
    if (validatedData.warrantyUntil === "") validatedData.warrantyUntil = undefined;
    
    const [updatedMaintenanceRecord] = await db
      .update(assetsMaintenance)
      .set({
        ...validatedData,
        updatedBy: req.user?.personnelId || null,
        updatedAt: new Date()
      })
      .where(eq(assetsMaintenance.id, Number(id)))
      .returning({
        id: assetsMaintenance.id,
        assetId: assetsMaintenance.assetId,
        maintenanceTypeId: assetsMaintenance.maintenanceTypeId,
        maintenanceDate: assetsMaintenance.maintenanceDate,
        dueByDate: assetsMaintenance.dueByDate,
        kmReading: assetsMaintenance.kmReading,
        amountCents: assetsMaintenance.amountCents,
        description: assetsMaintenance.description,
        serviceProvider: assetsMaintenance.serviceProvider,
        warrantyUntil: assetsMaintenance.warrantyUntil,
        isActive: assetsMaintenance.isActive,
        createdAt: assetsMaintenance.createdAt,
        updatedAt: assetsMaintenance.updatedAt
      });

    if (!updatedMaintenanceRecord) {
      return res.status(404).json({
        success: false,
        error: "MAINTENANCE_RECORD_NOT_FOUND",
        message: "Bakım kaydı bulunamadı"
      });
    }

    // Audit log removed for now
    // await auditLog({ ... });

    res.json({
      success: true,
      message: "Bakım kaydı başarıyla güncellendi",
      data: updatedMaintenanceRecord
    });
  } catch (error) {
    console.error("Bakım kaydı güncelleme hatası:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "VALIDATION_ERROR",
        message: "Geçersiz veri formatı",
        details: error.errors
      });
    }
    res.status(500).json({
      success: false,
      error: "MAINTENANCE_RECORD_UPDATE_ERROR",
      message: "Bakım kaydı güncellenemedi"
    });
  }
});

// Bakım kaydı sil (Soft delete)
router.delete("/maintenance-records/:id", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    const [deletedMaintenanceRecord] = await db
      .update(assetsMaintenance)
      .set({ 
        isActive: false,
        updatedBy: req.user?.personnelId || null,
        updatedAt: new Date()
      })
      .where(eq(assetsMaintenance.id, Number(id)))
      .returning({
        id: assetsMaintenance.id,
        assetId: assetsMaintenance.assetId,
        maintenanceTypeId: assetsMaintenance.maintenanceTypeId,
        maintenanceDate: assetsMaintenance.maintenanceDate,
        isActive: assetsMaintenance.isActive
      });

    if (!deletedMaintenanceRecord) {
      return res.status(404).json({
        success: false,
        error: "MAINTENANCE_RECORD_NOT_FOUND",
        message: "Bakım kaydı bulunamadı"
      });
    }

    // Audit log removed for now
    // await auditLog({ ... });

    res.json({
      success: true,
      message: "Bakım kaydı başarıyla silindi",
      data: deletedMaintenanceRecord
    });
  } catch (error) {
    console.error("Bakım kaydı silme hatası:", error);
    res.status(500).json({
      success: false,
      error: "MAINTENANCE_RECORD_DELETE_ERROR",
      message: "Bakım kaydı silinemedi"
    });
  }
});

export default router;