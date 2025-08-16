import { Router } from "express";
import { db } from "./db";
import { policyTypes, assetsPolicies, companies, assets, damageTypes, assetsDamageData } from "../shared/schema";
import { authenticateToken } from "./auth";
import { eq, and, desc, asc, like, ilike, sql, count, gte, lte } from "drizzle-orm";
import { auditableInsert, auditableUpdate, auditableDelete, captureAuditInfo } from "./audit-middleware";
import type { Request, Response } from "express";

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// ========================
// ASSETS POLICIES API
// ========================

// GET /api/assets-policies - List asset policies
router.get("/", async (req: Request, res: Response) => {
  try {
    const { 
      assetId,
      policyTypeId,
      insuranceCompanyId,
      activeOnly = 'true',
      expiringInDays,
      search,
      sortBy = 'id',
      sortOrder = 'asc',
      limit = 20,
      offset = 0
    } = req.query;

    const whereConditions: any[] = [];

    // Asset filter
    if (assetId) {
      whereConditions.push(eq(assetsPolicies.assetId, Number(assetId)));
    }

    // Policy type filter
    if (policyTypeId) {
      whereConditions.push(eq(assetsPolicies.policyTypeId, Number(policyTypeId)));
    }

    // Insurance company filter
    if (insuranceCompanyId) {
      whereConditions.push(eq(assetsPolicies.insuranceCompanyId, Number(insuranceCompanyId)));
    }

    // Active filter
    if (activeOnly === 'true') {
      whereConditions.push(eq(assetsPolicies.isActive, true));
    }

    // Expiring filter
    if (expiringInDays) {
      const days = Number(expiringInDays);
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);
      whereConditions.push(lte(assetsPolicies.endDate, futureDate.toISOString().split('T')[0]));
    }

    // Search filter (policy number)
    if (search) {
      whereConditions.push(ilike(assetsPolicies.policyNumber, `%${search}%`));
    }

    // Simple policies query
    const policies = await db
      .select({
        id: assetsPolicies.id,
        assetId: assetsPolicies.assetId,
        policyTypeId: assetsPolicies.policyTypeId,
        sellerCompanyId: assetsPolicies.sellerCompanyId,
        insuranceCompanyId: assetsPolicies.insuranceCompanyId,
        policyNumber: assetsPolicies.policyNumber,
        amountCents: assetsPolicies.amountCents,
        startDate: assetsPolicies.startDate,
        endDate: assetsPolicies.endDate,
        isActive: assetsPolicies.isActive
      })
      .from(assetsPolicies)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(assetsPolicies.id)
      .limit(Number(limit) || 20)
      .offset(Number(offset) || 0);

    // Calculate remaining days for each policy
    const policiesWithRemainingDays = policies.map(policy => {
      let remainingDays = null;
      if (policy.endDate) {
        const endDate = new Date(policy.endDate);
        const today = new Date();
        const diffTime = endDate.getTime() - today.getTime();
        remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
      return {
        ...policy,
        remainingDays
      };
    });

    res.json({
      success: true,
      message: 'Poliçeler başarıyla getirildi.',
      data: {
        policies: policiesWithRemainingDays,
        totalCount: policies.length
      }
    });
  } catch (error) {
    console.error('Poliçeler getirme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'POLICIES_FETCH_ERROR',
      message: 'Poliçeler getirilirken hata oluştu.'
    });
  }
});

// POST /api/assets-policies - Create new asset policy
router.post("/", async (req: Request, res: Response) => {
  try {
    const { 
      assetId, 
      policyTypeId, 
      sellerCompanyId, 
      insuranceCompanyId,
      policyNumber,
      amountCents,
      startDate,
      endDate 
    } = req.body;

    console.log('Creating policy with data:', req.body);

    // Validation
    if (!assetId || !policyTypeId || !sellerCompanyId || !insuranceCompanyId || !policyNumber || !amountCents || !startDate) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Gerekli alanlar eksik: assetId, policyTypeId, sellerCompanyId, insuranceCompanyId, policyNumber, amountCents, startDate'
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

    // Check if policy type exists
    const policyType = await db
      .select()
      .from(policyTypes)
      .where(eq(policyTypes.id, Number(policyTypeId)))
      .limit(1);

    if (policyType.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'POLICY_TYPE_NOT_FOUND',
        message: 'Belirtilen poliçe türü bulunamadı.'
      });
    }

    // Check for duplicate policy number for this asset
    const existingPolicy = await db
      .select()
      .from(assetsPolicies)
      .where(and(
        eq(assetsPolicies.assetId, Number(assetId)),
        eq(assetsPolicies.policyNumber, policyNumber),
        eq(assetsPolicies.isActive, true)
      ))
      .limit(1);

    if (existingPolicy.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'DUPLICATE_POLICY',
        message: 'Bu araç için aynı poliçe numarası zaten mevcut.'
      });
    }

    const auditInfo = captureAuditInfo(req);
    
    const [newPolicy] = await auditableInsert(
      db,
      assetsPolicies,
      { 
        assetId: Number(assetId),
        policyTypeId: Number(policyTypeId),
        sellerCompanyId: Number(sellerCompanyId),
        insuranceCompanyId: Number(insuranceCompanyId),
        policyNumber: policyNumber.trim(),
        amountCents: Number(amountCents),
        startDate,
        endDate: endDate || null,
        isActive: true
      },
      auditInfo
    );

    console.log('Policy created successfully:', newPolicy);

    res.status(201).json({
      success: true,
      message: 'Poliçe başarıyla oluşturuldu.',
      data: newPolicy
    });
  } catch (error) {
    console.error('Poliçe oluşturma hatası:', error);
    res.status(500).json({
      success: false,
      error: 'POLICY_CREATE_ERROR',
      message: 'Poliçe oluşturulurken hata oluştu.'
    });
  }
});

// GET /api/assets-policies/:id - Get policy details
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const policyId = parseInt(req.params.id);

    if (!policyId || isNaN(policyId)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_ID',
        message: 'Geçersiz poliçe ID\'si.'
      });
    }

    // Get policy details
    const [policyDetails] = await db
      .select()
      .from(assetsPolicies)
      .where(eq(assetsPolicies.id, policyId))
      .limit(1);

    if (!policyDetails) {
      return res.status(404).json({
        success: false,
        error: 'POLICY_NOT_FOUND',
        message: 'Poliçe bulunamadı.'
      });
    }

    // Calculate remaining days
    let remainingDays = null;
    if (policyDetails.endDate) {
      const endDate = new Date(policyDetails.endDate);
      const today = new Date();
      const diffTime = endDate.getTime() - today.getTime();
      remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    res.json({
      success: true,
      message: 'Poliçe detayı başarıyla getirildi.',
      data: {
        ...policyDetails,
        remainingDays
      }
    });
  } catch (error) {
    console.error('Poliçe detayı getirme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'POLICY_DETAIL_FETCH_ERROR',
      message: 'Poliçe detayı getirilirken hata oluştu.'
    });
  }
});

// PUT /api/assets-policies/:id - Update asset policy
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const policyId = parseInt(req.params.id);
    const updateData = req.body;

    if (!policyId || isNaN(policyId)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_ID',
        message: 'Geçersiz poliçe ID\'si.'
      });
    }

    // Check if policy exists
    const existingPolicy = await db
      .select()
      .from(assetsPolicies)
      .where(eq(assetsPolicies.id, policyId))
      .limit(1);

    if (existingPolicy.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'POLICY_NOT_FOUND',
        message: 'Poliçe bulunamadı.'
      });
    }

    const auditInfo = captureAuditInfo(req);
    
    await auditableUpdate(
      db,
      assetsPolicies,
      eq(assetsPolicies.id, policyId),
      updateData,
      auditInfo
    );

    res.json({
      success: true,
      message: 'Poliçe başarıyla güncellendi.',
      data: { id: policyId, ...updateData }
    });
  } catch (error) {
    console.error('Poliçe güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'POLICY_UPDATE_ERROR',
      message: 'Poliçe güncellenirken hata oluştu.'
    });
  }
});

// DELETE /api/assets-policies/:id - Soft delete asset policy
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const policyId = parseInt(req.params.id);

    if (!policyId || isNaN(policyId)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_ID',
        message: 'Geçersiz poliçe ID\'si.'
      });
    }

    // Check if policy exists
    const existingPolicy = await db
      .select()
      .from(assetsPolicies)
      .where(eq(assetsPolicies.id, policyId))
      .limit(1);

    if (existingPolicy.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'POLICY_NOT_FOUND',
        message: 'Poliçe bulunamadı.'
      });
    }

    const auditInfo = captureAuditInfo(req);
    
    await auditableUpdate(
      db,
      assetsPolicies,
      eq(assetsPolicies.id, policyId),
      { isActive: false },
      auditInfo
    );

    res.json({
      success: true,
      message: 'Poliçe başarıyla silindi.'
    });
  } catch (error) {
    console.error('Poliçe silme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'POLICY_DELETE_ERROR',
      message: 'Poliçe silinirken hata oluştu.'
    });
  }
});

export default router;