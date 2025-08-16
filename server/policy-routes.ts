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
// POLICY TYPES API
// ========================

// GET /api/policy-types - List policy types
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

    // Search filter
    if (search) {
      whereConditions.push(ilike(policyTypes.name, `%${search}%`));
    }

    // Active filter
    if (activeOnly === 'true') {
      whereConditions.push(eq(policyTypes.isActive, true));
    }

    // Build query with conditions
    let query = db
      .select({
        id: policyTypes.id,
        name: policyTypes.name,
        isActive: policyTypes.isActive
      })
      .from(policyTypes);

    // Apply conditions
    if (whereConditions.length > 0) {
      query = query.where(and(...whereConditions));
    }

    // Apply sorting
    const orderColumn = sortBy === 'id' ? policyTypes.id : policyTypes.name;
    const orderDirection = sortOrder === 'desc' ? desc(orderColumn) : asc(orderColumn);
    query = query.orderBy(orderDirection);

    // Apply pagination
    if (limit) {
      query = query.limit(Number(limit));
      if (offset) {
        query = query.offset(Number(offset));
      }
    }

    const policyTypesList = await query;

    res.json({
      success: true,
      message: 'Poliçe türleri başarıyla getirildi.',
      data: {
        policyTypes: policyTypesList,
        totalCount: policyTypesList.length
      }
    });
  } catch (error) {
    console.error('Poliçe türleri getirme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'POLICY_TYPES_FETCH_ERROR',
      message: 'Poliçe türleri getirilirken hata oluştu.'
    });
  }
});

// POST /api/policy-types - Create new policy type
router.post("/", async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Poliçe türü adı gereklidir.'
      });
    }

    const auditInfo = captureAuditInfo(req);
    
    const [newPolicyType] = await auditableInsert(
      db,
      policyTypes,
      { 
        name: name.trim(),
        isActive: true
      },
      auditInfo
    );

    res.status(201).json({
      success: true,
      message: 'Poliçe türü başarıyla oluşturuldu.',
      data: newPolicyType
    });
  } catch (error) {
    console.error('Poliçe türü oluşturma hatası:', error);
    res.status(500).json({
      success: false,
      error: 'POLICY_TYPE_CREATE_ERROR',
      message: 'Poliçe türü oluşturulurken hata oluştu.'
    });
  }
});

// PUT /api/policy-types/:id - Update policy type
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const policyTypeId = parseInt(req.params.id);
    const { name, isActive } = req.body;

    if (!policyTypeId || isNaN(policyTypeId)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_ID',
        message: 'Geçersiz poliçe türü ID\'si.'
      });
    }

    // Check if policy type exists
    const existingPolicyType = await db
      .select()
      .from(policyTypes)
      .where(eq(policyTypes.id, policyTypeId))
      .limit(1);

    if (existingPolicyType.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'POLICY_TYPE_NOT_FOUND',
        message: 'Poliçe türü bulunamadı.'
      });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (isActive !== undefined) updateData.isActive = isActive;

    const auditInfo = captureAuditInfo(req);
    
    await auditableUpdate(
      db,
      policyTypes,
      eq(policyTypes.id, policyTypeId),
      updateData,
      auditInfo
    );

    res.json({
      success: true,
      message: 'Poliçe türü başarıyla güncellendi.',
      data: { id: policyTypeId, ...updateData }
    });
  } catch (error) {
    console.error('Poliçe türü güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'POLICY_TYPE_UPDATE_ERROR',
      message: 'Poliçe türü güncellenirken hata oluştu.'
    });
  }
});

// DELETE /api/policy-types/:id - Soft delete policy type
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const policyTypeId = parseInt(req.params.id);

    if (!policyTypeId || isNaN(policyTypeId)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_ID',
        message: 'Geçersiz poliçe türü ID\'si.'
      });
    }

    // Check if policy type exists
    const existingPolicyType = await db
      .select()
      .from(policyTypes)
      .where(eq(policyTypes.id, policyTypeId))
      .limit(1);

    if (existingPolicyType.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'POLICY_TYPE_NOT_FOUND',
        message: 'Poliçe türü bulunamadı.'
      });
    }

    // Check if policy type is in use
    const policiesUsingType = await db
      .select()
      .from(assetsPolicies)
      .where(and(
        eq(assetsPolicies.policyTypeId, policyTypeId),
        eq(assetsPolicies.isActive, true)
      ))
      .limit(1);

    if (policiesUsingType.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'POLICY_TYPE_IN_USE',
        message: 'Bu poliçe türü aktif poliçelerde kullanıldığı için silinemez.'
      });
    }

    const auditInfo = captureAuditInfo(req);
    
    await auditableUpdate(
      db,
      policyTypes,
      eq(policyTypes.id, policyTypeId),
      { isActive: false },
      auditInfo
    );

    res.json({
      success: true,
      message: 'Poliçe türü başarıyla silindi.'
    });
  } catch (error) {
    console.error('Poliçe türü silme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'POLICY_TYPE_DELETE_ERROR',
      message: 'Poliçe türü silinirken hata oluştu.'
    });
  }
});

// ========================
// ASSETS POLICIES API
// ========================

// GET /api/policies - List asset policies
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

    // Simple policies query for now
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

// GET /api/policies/:id - Get policy details
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

    // Get policy with related data
    const [policyDetails] = await db
      .select({
        id: assetsPolicies.id,
        assetId: assetsPolicies.assetId,
        plateNumber: assets.plateNumber,
        policyTypeId: assetsPolicies.policyTypeId,
        policyTypeName: policyTypes.name,
        sellerCompanyId: assetsPolicies.sellerCompanyId,
        sellerCompanyName: sql<string>`seller.name`,
        sellerCompanyPhone: sql<string>`seller.phone`,
        insuranceCompanyId: assetsPolicies.insuranceCompanyId,
        insuranceCompanyName: sql<string>`insurance.name`,
        insuranceCompanyPhone: sql<string>`insurance.phone`,
        policyNumber: assetsPolicies.policyNumber,
        amountCents: assetsPolicies.amountCents,
        startDate: assetsPolicies.startDate,
        endDate: assetsPolicies.endDate,
        isActive: assetsPolicies.isActive
      })
      .from(assetsPolicies)
      .innerJoin(assets, eq(assetsPolicies.assetId, assets.id))
      .innerJoin(policyTypes, eq(assetsPolicies.policyTypeId, policyTypes.id))
      .innerJoin(sql`companies AS seller`, sql`assets_policies.seller_company_id = seller.id`)
      .innerJoin(sql`companies AS insurance`, sql`assets_policies.insurance_company_id = insurance.id`)
      .where(eq(assetsPolicies.id, policyId))
      .limit(1);

    if (!policyDetails) {
      return res.status(404).json({
        success: false,
        error: 'POLICY_NOT_FOUND',
        message: 'Poliçe bulunamadı.'
      });
    }

    // Get related damages
    const relatedDamages = await db
      .select({
        id: assetsDamageData.id,
        eventDate: assetsDamageData.eventDate,
        damageType: damageTypes.name,
        amountCents: assetsDamageData.amountCents
      })
      .from(assetsDamageData)
      .innerJoin(damageTypes, eq(assetsDamageData.damageTypeId, damageTypes.id))
      .where(and(
        eq(assetsDamageData.policyId, policyId),
        eq(assetsDamageData.isActive, true)
      ))
      .orderBy(desc(assetsDamageData.eventDate));

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
        remainingDays,
        relatedDamages
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

export default router;