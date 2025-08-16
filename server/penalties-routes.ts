import { Router } from "express";
import { db } from "./db";
import { penalties, penaltyTypes, assets, personnel } from "../shared/schema";
import { authenticateToken } from "./auth";
import { eq, and, desc, asc, like, ilike, sql, count, gte, lte, isNull, isNotNull } from "drizzle-orm";
import { auditableInsert, auditableUpdate, auditableDelete, captureAuditInfo } from "./audit-middleware";
import type { Request, Response } from "express";

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// ========================
// PENALTIES API
// ========================

// GET /api/penalties - List penalties
router.get("/", async (req: Request, res: Response) => {
  try {
    const { 
      assetId,
      driverId,
      penaltyTypeId,
      status,
      startDate,
      endDate,
      activeOnly = 'true',
      search,
      sortBy = 'penaltyDate',
      sortOrder = 'desc',
      limit = 20,
      offset = 0
    } = req.query;

    const whereConditions: any[] = [];

    // Asset filter
    if (assetId) {
      whereConditions.push(eq(penalties.assetId, Number(assetId)));
    }

    // Driver filter
    if (driverId) {
      whereConditions.push(eq(penalties.driverId, Number(driverId)));
    }

    // Penalty type filter
    if (penaltyTypeId) {
      whereConditions.push(eq(penalties.penaltyTypeId, Number(penaltyTypeId)));
    }

    // Status filter
    if (status) {
      whereConditions.push(eq(penalties.status, status as string));
    }

    // Date range filters
    if (startDate) {
      whereConditions.push(gte(penalties.penaltyDate, startDate as string));
    }
    if (endDate) {
      whereConditions.push(lte(penalties.penaltyDate, endDate as string));
    }

    // Active filter
    if (activeOnly === 'true') {
      whereConditions.push(eq(penalties.isActive, true));
    }

    // Simple penalties query
    const penaltiesList = await db
      .select({
        id: penalties.id,
        assetId: penalties.assetId,
        driverId: penalties.driverId,
        penaltyTypeId: penalties.penaltyTypeId,
        amountCents: penalties.amountCents,
        discountedAmountCents: penalties.discountedAmountCents,
        penaltyDate: penalties.penaltyDate,
        lastDate: penalties.lastDate,
        status: penalties.status,
        isActive: penalties.isActive,
        createdAt: penalties.createdAt
      })
      .from(penalties)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(sortOrder === 'desc' ? desc(penalties.penaltyDate) : asc(penalties.penaltyDate))
      .limit(Number(limit) || 20)
      .offset(Number(offset) || 0);

    // Calculate remaining days for each penalty
    const penaltiesWithRemainingDays = penaltiesList.map(penalty => {
      let remainingDays = null;
      if (penalty.lastDate) {
        const lastDate = new Date(penalty.lastDate);
        const today = new Date();
        const diffTime = lastDate.getTime() - today.getTime();
        remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
      return {
        ...penalty,
        remainingDays
      };
    });

    res.json({
      success: true,
      message: 'Cezalar başarıyla getirildi.',
      data: {
        penalties: penaltiesWithRemainingDays,
        totalCount: penaltiesList.length
      }
    });
  } catch (error) {
    console.error('Cezalar getirme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'PENALTIES_FETCH_ERROR',
      message: 'Cezalar getirilirken hata oluştu.'
    });
  }
});

// POST /api/penalties - Create new penalty
router.post("/", async (req: Request, res: Response) => {
  try {
    const { 
      assetId, 
      driverId, 
      penaltyTypeId,
      amountCents,
      discountedAmountCents,
      penaltyDate,
      lastDate,
      status = 'beklemede'
    } = req.body;

    console.log('Creating penalty with data:', req.body);

    // Validation
    if (!assetId || !penaltyTypeId || !amountCents || !discountedAmountCents || !penaltyDate) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Gerekli alanlar eksik: assetId, penaltyTypeId, amountCents, discountedAmountCents, penaltyDate'
      });
    }

    // Check if asset exists
    const asset = await db
      .select()
      .from(assets)
      .where(eq(assets.id, Number(assetId)))
      .limit(1);

    if (asset.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'ASSET_NOT_FOUND',
        message: 'Belirtilen araç bulunamadı.'
      });
    }

    // Check if penalty type exists
    const penaltyType = await db
      .select()
      .from(penaltyTypes)
      .where(eq(penaltyTypes.id, Number(penaltyTypeId)))
      .limit(1);

    if (penaltyType.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'PENALTY_TYPE_NOT_FOUND',
        message: 'Belirtilen ceza türü bulunamadı.'
      });
    }

    // Check if driver exists (if provided)
    if (driverId) {
      const driver = await db
        .select()
        .from(personnel)
        .where(eq(personnel.id, Number(driverId)))
        .limit(1);

      if (driver.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'DRIVER_NOT_FOUND',
          message: 'Belirtilen sürücü bulunamadı.'
        });
      }
    }

    const auditInfo = captureAuditInfo(req);
    
    const [newPenalty] = await auditableInsert(
      db,
      penalties,
      { 
        assetId: Number(assetId),
        driverId: driverId ? Number(driverId) : null,
        penaltyTypeId: Number(penaltyTypeId),
        amountCents: Number(amountCents),
        discountedAmountCents: Number(discountedAmountCents),
        penaltyDate,
        lastDate: lastDate || null,
        status: status || 'beklemede',
        isActive: true
      },
      auditInfo
    );

    console.log('Penalty created successfully:', newPenalty);

    res.status(201).json({
      success: true,
      message: 'Ceza başarıyla oluşturuldu.',
      data: newPenalty
    });
  } catch (error) {
    console.error('Ceza oluşturma hatası:', error);
    res.status(500).json({
      success: false,
      error: 'PENALTY_CREATE_ERROR',
      message: 'Ceza oluşturulurken hata oluştu.'
    });
  }
});

// GET /api/penalties/:id - Get penalty details
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const penaltyId = parseInt(req.params.id);

    if (!penaltyId || isNaN(penaltyId)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_ID',
        message: 'Geçersiz ceza ID\'si.'
      });
    }

    // Get penalty details
    const [penaltyDetails] = await db
      .select()
      .from(penalties)
      .where(eq(penalties.id, penaltyId))
      .limit(1);

    if (!penaltyDetails) {
      return res.status(404).json({
        success: false,
        error: 'PENALTY_NOT_FOUND',
        message: 'Ceza bulunamadı.'
      });
    }

    // Calculate remaining days
    let remainingDays = null;
    if (penaltyDetails.lastDate) {
      const lastDate = new Date(penaltyDetails.lastDate);
      const today = new Date();
      const diffTime = lastDate.getTime() - today.getTime();
      remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    res.json({
      success: true,
      message: 'Ceza detayı başarıyla getirildi.',
      data: {
        ...penaltyDetails,
        remainingDays
      }
    });
  } catch (error) {
    console.error('Ceza detayı getirme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'PENALTY_DETAIL_FETCH_ERROR',
      message: 'Ceza detayı getirilirken hata oluştu.'
    });
  }
});

// PUT /api/penalties/:id - Update penalty
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const penaltyId = parseInt(req.params.id);
    const updateData = req.body;

    if (!penaltyId || isNaN(penaltyId)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_ID',
        message: 'Geçersiz ceza ID\'si.'
      });
    }

    // Check if penalty exists
    const existingPenalty = await db
      .select()
      .from(penalties)
      .where(eq(penalties.id, penaltyId))
      .limit(1);

    if (existingPenalty.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'PENALTY_NOT_FOUND',
        message: 'Ceza bulunamadı.'
      });
    }

    const auditInfo = captureAuditInfo(req);
    
    await auditableUpdate(
      db,
      penalties,
      eq(penalties.id, penaltyId),
      updateData,
      auditInfo
    );

    res.json({
      success: true,
      message: 'Ceza başarıyla güncellendi.',
      data: { id: penaltyId, ...updateData }
    });
  } catch (error) {
    console.error('Ceza güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'PENALTY_UPDATE_ERROR',
      message: 'Ceza güncellenirken hata oluştu.'
    });
  }
});

// DELETE /api/penalties/:id - Soft delete penalty
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const penaltyId = parseInt(req.params.id);

    if (!penaltyId || isNaN(penaltyId)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_ID',
        message: 'Geçersiz ceza ID\'si.'
      });
    }

    // Check if penalty exists
    const existingPenalty = await db
      .select()
      .from(penalties)
      .where(eq(penalties.id, penaltyId))
      .limit(1);

    if (existingPenalty.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'PENALTY_NOT_FOUND',
        message: 'Ceza bulunamadı.'
      });
    }

    const auditInfo = captureAuditInfo(req);
    
    await auditableUpdate(
      db,
      penalties,
      eq(penalties.id, penaltyId),
      { isActive: false },
      auditInfo
    );

    res.json({
      success: true,
      message: 'Ceza başarıyla silindi.'
    });
  } catch (error) {
    console.error('Ceza silme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'PENALTY_DELETE_ERROR',
      message: 'Ceza silinirken hata oluştu.'
    });
  }
});

export default router;