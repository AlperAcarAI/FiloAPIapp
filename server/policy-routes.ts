import { Router } from "express";
import { db } from "./db";
import {
  policyTypes,
  assetsPolicies,
  companies,
  assets,
  damageTypes,
  assetsDamageData,
  carBrands,
  carModels,
  carTypes,
  finCurrentAccounts,
  paymentMethods
} from "../shared/schema";
import { authenticateToken } from "./auth";
import { eq, and, desc, asc, like, ilike, sql, count, gte, lte, inArray } from "drizzle-orm";
import { auditableInsert, auditableUpdate, auditableDelete, captureAuditInfo } from "./audit-middleware";
import { authenticateJWT, requirePermission, type AuthRequest } from "./hierarchical-auth";
import type { Request, Response } from "express";
import { policyNotificationService } from "./policy-notification-service";

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
        isActive: true,
        createdBy: auditInfo.userId,
        updatedBy: auditInfo.userId
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
    updateData.updatedBy = auditInfo.userId;
    updateData.updatedAt = new Date();

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
// ASSETS POLICIES API (for /api/policies route)
// ========================

// GET /api/policies - List asset policies
router.get("/policies", authenticateJWT, async (req: AuthRequest, res: Response) => {
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

// POST /api/policies - Create new asset policy
router.post("/policies", authenticateJWT, async (req: AuthRequest, res: Response) => {
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

    // Validation
    if (!assetId || !policyTypeId || !sellerCompanyId || !insuranceCompanyId || !policyNumber || !amountCents || !startDate) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Gerekli alanlar eksik: assetId, policyTypeId, sellerCompanyId, insuranceCompanyId, policyNumber, amountCents, startDate'
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
        isActive: true,
        createdBy: auditInfo.userId,
        updatedBy: auditInfo.userId
      },
      auditInfo
    );

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

// GET /api/policies/detailed - Get all policies with detailed info
router.get("/policies/detailed", authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const { 
      limit = 20, 
      offset = 0,
      assetId,
      policyTypeId,
      insuranceCompanyId,
      activeOnly = 'true',
      search
    } = req.query;

    // Build where conditions
    const whereConditions: any[] = [];
    
    if (activeOnly === 'true') {
      whereConditions.push(eq(assetsPolicies.isActive, true));
    }
    
    if (assetId) {
      whereConditions.push(eq(assetsPolicies.assetId, Number(assetId)));
    }
    
    if (policyTypeId) {
      whereConditions.push(eq(assetsPolicies.policyTypeId, Number(policyTypeId)));
    }
    
    if (insuranceCompanyId) {
      whereConditions.push(eq(assetsPolicies.insuranceCompanyId, Number(insuranceCompanyId)));
    }
    
    if (search) {
      whereConditions.push(ilike(assetsPolicies.policyNumber, `%${search}%`));
    }

    // Get policies with basic info
    const policies = await db
      .select()
      .from(assetsPolicies)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .limit(Number(limit))
      .offset(Number(offset));

    // Get detailed info for each policy
    const detailedPolicies = await Promise.all(policies.map(async (policy) => {
      // Get asset details
      const [asset] = await db
        .select()
        .from(assets)
        .where(eq(assets.id, policy.assetId))
        .limit(1);

      // Get policy type
      const [policyType] = await db
        .select()
        .from(policyTypes)
        .where(eq(policyTypes.id, policy.policyTypeId))
        .limit(1);

      // Get vehicle model details
      let vehicleDetails = null;
      if (asset?.modelId) {
        const vehicleQuery = await db
          .select({
            modelName: carModels.name,
            brandName: carBrands.name,
            typeName: carTypes.name,
            capacity: carModels.capacity
          })
          .from(carModels)
          .leftJoin(carBrands, eq(carModels.brandId, carBrands.id))
          .leftJoin(carTypes, eq(carModels.typeId, carTypes.id))
          .where(eq(carModels.id, asset.modelId))
          .limit(1);
        
        vehicleDetails = vehicleQuery[0];
      }

      // Get company details
      const [insuranceCompany] = await db
        .select({
          name: companies.name,
          phone: companies.phone,
          address: companies.address
        })
        .from(companies)
        .where(eq(companies.id, policy.insuranceCompanyId))
        .limit(1);

      const [sellerCompany] = await db
        .select({
          name: companies.name,
          phone: companies.phone
        })
        .from(companies)
        .where(eq(companies.id, policy.sellerCompanyId))
        .limit(1);

      // Calculate remaining days
      let remainingDays = null;
      let policyStatus = 'active';
      
      if (policy.endDate) {
        const endDate = new Date(policy.endDate);
        const today = new Date();
        const diffTime = endDate.getTime() - today.getTime();
        remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (remainingDays < 0) {
          policyStatus = 'expired';
        } else if (remainingDays <= 30) {
          policyStatus = 'expiring_soon';
        }
      }

      return {
        // Araç Bilgileri
        arac: {
          plaka: asset?.plateNumber || 'Belirtilmemiş',
          marka: vehicleDetails?.brandName || 'Belirtilmemiş',
          model: vehicleDetails?.modelName || 'Belirtilmemiş',
          tip: vehicleDetails?.typeName || 'Belirtilmemiş',
          yil: asset?.year || 'Belirtilmemiş',
          kapasite: vehicleDetails?.capacity || 'Belirtilmemiş'
        },
        
        // Poliçe Bilgileri
        police: {
          id: policy.id,
          policeNo: policy.policyNumber,
          tur: policyType?.name || 'Belirtilmemiş',
          tutar: policy.amountCents,
          tutarTL: (policy.amountCents / 100).toFixed(2) + ' TL'
        },
        
        // Sigorta Şirketi
        sigortaSirketi: {
          id: policy.insuranceCompanyId,
          ad: insuranceCompany?.name || 'Belirtilmemiş',
          telefon: insuranceCompany?.phone || 'Belirtilmemiş',
          adres: insuranceCompany?.address || 'Belirtilmemiş'
        },
        
        // Süre Bilgileri
        sure: {
          baslangic: policy.startDate,
          bitis: policy.endDate || 'Belirtilmemiş',
          kalanGun: remainingDays,
          durum: policyStatus
        },
        
        // Satıcı Firma
        saticiFirma: {
          id: policy.sellerCompanyId,
          ad: sellerCompany?.name || 'Belirtilmemiş',
          telefon: sellerCompany?.phone || 'Belirtilmemiş'
        }
      };
    }));

    res.json({
      success: true,
      message: 'Detaylı poliçe listesi başarıyla getirildi.',
      data: {
        policies: detailedPolicies,
        totalCount: detailedPolicies.length,
        limit: Number(limit),
        offset: Number(offset)
      }
    });
  } catch (error) {
    console.error('Detaylı poliçe listesi getirme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'POLICIES_DETAIL_FETCH_ERROR',
      message: 'Detaylı poliçe listesi getirilirken hata oluştu.'
    });
  }
});

// GET /api/policies/:id - Get policy details
router.get("/policies/:id", authenticateJWT, async (req: AuthRequest, res: Response) => {
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

// GET /api/policies/:id/detailed - Get detailed policy info with vehicle and payment details
router.get("/policies/:id/detailed", authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const policyId = parseInt(req.params.id);

    if (!policyId || isNaN(policyId)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_ID',
        message: 'Geçersiz poliçe ID\'si.'
      });
    }

    // Get basic policy details first
    const [policyBasic] = await db
      .select()
      .from(assetsPolicies)
      .where(eq(assetsPolicies.id, policyId))
      .limit(1);
    
    if (!policyBasic) {
      return res.status(404).json({
        success: false,
        error: 'POLICY_NOT_FOUND',
        message: 'Poliçe bulunamadı.'
      });
    }

    // Get asset details
    const [asset] = await db
      .select()
      .from(assets)
      .where(eq(assets.id, policyBasic.assetId))
      .limit(1);

    // Company-based authorization check
    const userContext = req.userContext;
    if (userContext && userContext.accessLevel !== 'CORPORATE') {
      // Check if user has access to this asset's company
      if (asset?.ownerCompanyId) {
        // For non-CORPORATE users, check if they have access to the company
        if (userContext.companyId && userContext.companyId !== asset.ownerCompanyId) {
          return res.status(403).json({
            success: false,
            error: 'FORBIDDEN',
            message: 'Bu poliçeyi görüntüleme yetkiniz yok'
          });
        }
      }
    }

    // Get policy type
    const [policyType] = await db
      .select()
      .from(policyTypes)
      .where(eq(policyTypes.id, policyBasic.policyTypeId))
      .limit(1);

    const policyDetails = {
      ...policyBasic,
      plateNumber: asset?.plateNumber,
      vehicleYear: asset?.year,
      modelId: asset?.modelId,
      policyTypeName: policyType?.name
    };

    // Get vehicle model details
    let vehicleDetails = null;
    if (policyDetails.modelId) {
      const vehicleQuery = await db
        .select({
          modelName: carModels.name,
          brandId: carModels.brandId,
          brandName: carBrands.name,
          typeId: carModels.typeId,
          typeName: carTypes.name,
          capacity: carModels.capacity
        })
        .from(carModels)
        .leftJoin(carBrands, eq(carModels.brandId, carBrands.id))
        .leftJoin(carTypes, eq(carModels.typeId, carTypes.id))
        .where(eq(carModels.id, policyDetails.modelId))
        .limit(1);
      
      vehicleDetails = vehicleQuery[0];
    }

    // Get company details
    const [insuranceCompany] = await db
      .select({
        name: companies.name,
        phone: companies.phone,
        address: companies.address
      })
      .from(companies)
      .where(eq(companies.id, policyDetails.insuranceCompanyId))
      .limit(1);

    const [sellerCompany] = await db
      .select({
        name: companies.name,
        phone: companies.phone
      })
      .from(companies)
      .where(eq(companies.id, policyDetails.sellerCompanyId))
      .limit(1);

    // Get payment information from financial accounts
    let paymentInfo = null;
    try {
      const paymentQuery = await db
        .select({
          id: finCurrentAccounts.id,
          payerCompanyId: finCurrentAccounts.payerCompanyId,
          paymentMethodId: finCurrentAccounts.paymentMethodId,
          transactionDate: finCurrentAccounts.transactionDate,
          paymentStatus: finCurrentAccounts.paymentStatus,
          paymentReference: finCurrentAccounts.paymentReference,
          notes: finCurrentAccounts.notes,
          isDone: finCurrentAccounts.isDone,
          payerCompanyName: companies.name,
          paymentMethodName: paymentMethods.name
        })
        .from(finCurrentAccounts)
        .leftJoin(companies, eq(finCurrentAccounts.payerCompanyId, companies.id))
        .leftJoin(paymentMethods, eq(finCurrentAccounts.paymentMethodId, paymentMethods.id))
        .where(and(
          ilike(finCurrentAccounts.description, `%Poliçe%`),
          ilike(finCurrentAccounts.description, `%${policyDetails.policyNumber}%`),
          eq(finCurrentAccounts.isActive, true)
        ))
        .limit(1);
      
      paymentInfo = paymentQuery[0] || null;
    } catch (err) {
      console.error('Ödeme bilgisi alınamadı:', err);
    }

    // Calculate remaining days
    let remainingDays = null;
    let policyStatus = 'active';
    
    if (policyDetails.endDate) {
      const endDate = new Date(policyDetails.endDate);
      const today = new Date();
      const diffTime = endDate.getTime() - today.getTime();
      remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (remainingDays < 0) {
        policyStatus = 'expired';
      } else if (remainingDays <= 30) {
        policyStatus = 'expiring_soon';
      }
    }

    // Format response
    const response = {
      success: true,
      message: 'Poliçe detayları başarıyla getirildi.',
      data: {
        // Araç Bilgileri
        arac: {
          plaka: policyDetails.plateNumber,
          marka: vehicleDetails?.brandName || 'Belirtilmemiş',
          model: vehicleDetails?.modelName || 'Belirtilmemiş',
          tip: vehicleDetails?.typeName || 'Belirtilmemiş',
          yil: policyDetails.vehicleYear || 'Belirtilmemiş',
          kapasite: vehicleDetails?.capacity || 'Belirtilmemiş'
        },
        
        // Poliçe Bilgileri
        police: {
          id: policyDetails.id,
          policeNo: policyDetails.policyNumber,
          tur: policyDetails.policyTypeName,
          tutar: policyDetails.amountCents,
          tutarTL: (policyDetails.amountCents / 100).toFixed(2) + ' TL'
        },
        
        // Sigorta Şirketi
        sigortaSirketi: {
          id: policyDetails.insuranceCompanyId,
          ad: insuranceCompany?.name || 'Belirtilmemiş',
          telefon: insuranceCompany?.phone || 'Belirtilmemiş',
          adres: insuranceCompany?.address || 'Belirtilmemiş'
        },
        
        // Süre Bilgileri
        sure: {
          baslangic: policyDetails.startDate,
          bitis: policyDetails.endDate || 'Belirtilmemiş',
          kalanGun: remainingDays,
          durum: policyStatus
        },
        
        // Ödeme Bilgileri
        odemeBilgileri: paymentInfo ? {
          odeyenSirket: paymentInfo.payerCompanyName || 'Belirtilmemiş',
          odeyenSirketId: paymentInfo.payerCompanyId,
          yontem: paymentInfo.paymentMethodName || 'Belirtilmemiş',
          tarih: paymentInfo.transactionDate || 'Belirtilmemiş',
          durum: paymentInfo.isDone ? 'Ödendi' : (paymentInfo.paymentStatus || 'Belirtilmemiş'),
          referans: paymentInfo.paymentReference || 'Belirtilmemiş',
          notlar: paymentInfo.notes || ''
        } : {
          odeyenSirket: 'Belirtilmemiş',
          yontem: 'Belirtilmemiş',
          tarih: 'Belirtilmemiş',
          durum: 'Belirtilmemiş'
        },
        
        // Satıcı Firma
        saticiFirma: {
          id: policyDetails.sellerCompanyId,
          ad: sellerCompany?.name || 'Belirtilmemiş',
          telefon: sellerCompany?.phone || 'Belirtilmemiş'
        }
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Detaylı poliçe bilgisi getirme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'POLICY_DETAIL_FETCH_ERROR',
      message: 'Detaylı poliçe bilgisi getirilirken hata oluştu.'
    });
  }
});

// ========================
// TEST ENDPOINT FOR POLICY NOTIFICATIONS
// ========================

// POST /api/test/policy-notifications - Manually trigger policy notification check (development only)
router.post("/test/policy-notifications", async (req: Request, res: Response) => {
  // Only allow in development environment
  if (process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'dev') {
    return res.status(403).json({
      success: false,
      error: 'FORBIDDEN',
      message: 'Bu endpoint sadece development ortamında kullanılabilir.'
    });
  }

  try {
    console.log('🧪 Test endpoint: Manuel poliçe bildirim kontrolü başlatıldı');

    await policyNotificationService.runDailyNotificationCheck();

    res.json({
      success: true,
      message: 'Poliçe bildirim kontrolü başarıyla tamamlandı. Loglara bakarak detayları görebilirsiniz.',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Test endpoint hatası:', error);
    res.status(500).json({
      success: false,
      error: 'TEST_NOTIFICATION_ERROR',
      message: 'Bildirim kontrolü sırasında hata oluştu.',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;