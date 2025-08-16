import { Router } from "express";
import { db } from "./db";
import { penaltyTypes, penalties, assets, personnel } from "../shared/schema";
import { authenticateToken } from "./auth";
import { eq, and, desc, asc, like, ilike, sql, count, gte, lte, isNull, isNotNull } from "drizzle-orm";
import { auditableInsert, auditableUpdate, auditableDelete, captureAuditInfo } from "./audit-middleware";
import type { Request, Response } from "express";

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// ========================
// PENALTY TYPES API
// ========================

// GET /api/penalty-types - List penalty types
router.get("/", async (req: Request, res: Response) => {
  try {
    const { 
      search, 
      activeOnly = 'true',
      sortBy = 'name',
      sortOrder = 'asc',
      limit = 20,
      offset = 0
    } = req.query;

    const whereConditions: any[] = [];

    // Active filter
    if (activeOnly === 'true') {
      whereConditions.push(eq(penaltyTypes.isActive, true));
    }

    // Search filter (name or description)
    if (search) {
      whereConditions.push(ilike(penaltyTypes.name, `%${search}%`));
    }

    // Build query
    let query = db
      .select({
        id: penaltyTypes.id,
        name: penaltyTypes.name,
        description: penaltyTypes.description,
        penaltyScore: penaltyTypes.penaltyScore,
        amountCents: penaltyTypes.amountCents,
        discountedAmountCents: penaltyTypes.discountedAmountCents,
        isActive: penaltyTypes.isActive,
        lastDate: penaltyTypes.lastDate
      })
      .from(penaltyTypes);

    // Apply conditions
    if (whereConditions.length > 0) {
      query = query.where(and(...whereConditions));
    }

    // Apply sorting
    const orderColumn = sortBy === 'penaltyScore' ? penaltyTypes.penaltyScore : 
                       sortBy === 'amountCents' ? penaltyTypes.amountCents : penaltyTypes.name;
    const orderDirection = sortOrder === 'desc' ? desc(orderColumn) : asc(orderColumn);
    query = query.orderBy(orderDirection);

    // Apply pagination
    if (limit) {
      query = query.limit(Number(limit));
      if (offset) {
        query = query.offset(Number(offset));
      }
    }

    const penaltyTypesList = await query;

    res.json({
      success: true,
      message: 'Ceza türleri başarıyla getirildi.',
      data: {
        penaltyTypes: penaltyTypesList,
        totalCount: penaltyTypesList.length
      }
    });
  } catch (error) {
    console.error('Ceza türleri getirme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'PENALTY_TYPES_FETCH_ERROR',
      message: 'Ceza türleri getirilirken hata oluştu.'
    });
  }
});

// POST /api/penalty-types - Create new penalty type
router.post("/", async (req: Request, res: Response) => {
  try {
    const { 
      name, 
      description, 
      penaltyScore, 
      amountCents, 
      discountedAmountCents,
      lastDate 
    } = req.body;

    // Validation
    if (!name || !penaltyScore || !amountCents || !discountedAmountCents) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Gerekli alanlar eksik: name, penaltyScore, amountCents, discountedAmountCents'
      });
    }

    // Check for duplicate name
    const existingType = await db
      .select()
      .from(penaltyTypes)
      .where(eq(penaltyTypes.name, name))
      .limit(1);

    if (existingType.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'DUPLICATE_NAME',
        message: 'Bu ceza türü adı zaten mevcut.'
      });
    }

    const auditInfo = captureAuditInfo(req);
    
    const [newType] = await auditableInsert(
      db,
      penaltyTypes,
      { 
        name: name.trim(),
        description: description?.trim() || null,
        penaltyScore: Number(penaltyScore),
        amountCents: Number(amountCents),
        discountedAmountCents: Number(discountedAmountCents),
        lastDate: lastDate || null,
        isActive: true
      },
      auditInfo
    );

    res.status(201).json({
      success: true,
      message: 'Ceza türü başarıyla oluşturuldu.',
      data: newType
    });
  } catch (error) {
    console.error('Ceza türü oluşturma hatası:', error);
    res.status(500).json({
      success: false,
      error: 'PENALTY_TYPE_CREATE_ERROR',
      message: 'Ceza türü oluşturulurken hata oluştu.'
    });
  }
});

// PUT /api/penalty-types/:id - Update penalty type
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const penaltyTypeId = parseInt(req.params.id);
    const updateData = req.body;

    if (!penaltyTypeId || isNaN(penaltyTypeId)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_ID',
        message: 'Geçersiz ceza türü ID\'si.'
      });
    }

    // Check if penalty type exists
    const existingType = await db
      .select()
      .from(penaltyTypes)
      .where(eq(penaltyTypes.id, penaltyTypeId))
      .limit(1);

    if (existingType.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'PENALTY_TYPE_NOT_FOUND',
        message: 'Ceza türü bulunamadı.'
      });
    }

    const auditInfo = captureAuditInfo(req);
    
    await auditableUpdate(
      db,
      penaltyTypes,
      eq(penaltyTypes.id, penaltyTypeId),
      updateData,
      auditInfo
    );

    res.json({
      success: true,
      message: 'Ceza türü başarıyla güncellendi.',
      data: { id: penaltyTypeId, ...updateData }
    });
  } catch (error) {
    console.error('Ceza türü güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'PENALTY_TYPE_UPDATE_ERROR',
      message: 'Ceza türü güncellenirken hata oluştu.'
    });
  }
});

// DELETE /api/penalty-types/:id - Soft delete penalty type
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const penaltyTypeId = parseInt(req.params.id);

    if (!penaltyTypeId || isNaN(penaltyTypeId)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_ID',
        message: 'Geçersiz ceza türü ID\'si.'
      });
    }

    // Check if penalty type exists
    const existingType = await db
      .select()
      .from(penaltyTypes)
      .where(eq(penaltyTypes.id, penaltyTypeId))
      .limit(1);

    if (existingType.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'PENALTY_TYPE_NOT_FOUND',
        message: 'Ceza türü bulunamadı.'
      });
    }

    const auditInfo = captureAuditInfo(req);
    
    await auditableUpdate(
      db,
      penaltyTypes,
      eq(penaltyTypes.id, penaltyTypeId),
      { isActive: false },
      auditInfo
    );

    res.json({
      success: true,
      message: 'Ceza türü başarıyla silindi.'
    });
  } catch (error) {
    console.error('Ceza türü silme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'PENALTY_TYPE_DELETE_ERROR',
      message: 'Ceza türü silinirken hata oluştu.'
    });
  }
});

export default router;