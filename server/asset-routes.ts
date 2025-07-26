import { Router } from 'express';
import { db } from './db.js';
import { eq, and, ilike, desc, asc } from 'drizzle-orm';
import { 
  assets, carModels, carBrands, carTypes, ownershipTypes, companies,
  insertAssetSchema, updateAssetSchema,
  type InsertAsset, type UpdateAsset, type Asset
} from '../shared/schema.js';
import { z } from 'zod';
import { authenticateApiKey, authorizeEndpoint } from './api-security.js';
import { 
  auditableInsert,
  auditableUpdate,
  auditableDelete
} from './audit-middleware.js';

const router = Router();

/**
 * @swagger
 * /api/secure/assets:
 *   get:
 *     summary: Asset/Araç Listesi
 *     description: Tüm asset'leri listeler (model, marka, tip bilgileri ile birlikte)
 *     tags: [Asset İşlemleri]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Plaka numarasında arama yapmak için
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Sadece aktif asset'leri getirmek için
 *       - in: query
 *         name: modelId
 *         schema:
 *           type: integer
 *         description: Belirli modeldeki asset'leri filtrelemek için
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: integer
 *         description: Belirli şirketteki asset'leri filtrelemek için
 *     responses:
 *       200:
 *         description: Asset'ler başarıyla getirildi
 *       401:
 *         description: Geçersiz API anahtarı
 */
router.get('/assets', authenticateApiKey, authorizeEndpoint(['data:read', 'asset:read']), async (req, res) => {
  try {
    const { search, active, modelId, companyId } = req.query;
    
    // Base query with joins
    let query = db
      .select({
        id: assets.id,
        modelId: assets.modelId,
        modelYear: assets.modelYear,
        plateNumber: assets.plateNumber,
        chassisNo: assets.chassisNo,
        engineNo: assets.engineNo,
        ownershipTypeId: assets.ownershipTypeId,
        ownerCompanyId: assets.ownerCompanyId,
        registerNo: assets.registerNo,
        registerDate: assets.registerDate,
        purchaseDate: assets.purchaseDate,
        isActive: assets.isActive,
        createdAt: assets.createdAt,
        updatedAt: assets.updatedAt,
        // Join data
        modelName: carModels.name,
        brandName: carBrands.name,
        typeName: carTypes.name,
        ownershipTypeName: ownershipTypes.name,
        ownerCompanyName: companies.name
      })
      .from(assets)
      .leftJoin(carModels, eq(assets.modelId, carModels.id))
      .leftJoin(carBrands, eq(carModels.brandId, carBrands.id))
      .leftJoin(carTypes, eq(carModels.typeId, carTypes.id))
      .leftJoin(ownershipTypes, eq(assets.ownershipTypeId, ownershipTypes.id))
      .leftJoin(companies, eq(assets.ownerCompanyId, companies.id));

    // Filters
    const whereConditions = [];
    
    if (search) {
      whereConditions.push(ilike(assets.plateNumber, `%${search}%`));
    }
    
    if (active === 'true') {
      whereConditions.push(eq(assets.isActive, true));
    } else if (active === 'false') {
      whereConditions.push(eq(assets.isActive, false));
    }
    
    if (modelId) {
      whereConditions.push(eq(assets.modelId, parseInt(modelId as string)));
    }
    
    if (companyId) {
      whereConditions.push(eq(assets.ownerCompanyId, parseInt(companyId as string)));
    }

    if (whereConditions.length > 0) {
      query = query.where(and(...whereConditions));
    }

    // Execute query with ordering
    const assetsList = await query.orderBy(desc(assets.createdAt));
    
    res.json({
      success: true,
      message: 'Asset\'ler başarıyla getirildi.',
      data: {
        assets: assetsList,
        totalCount: assetsList.length
      }
    });
  } catch (error) {
    console.error('Asset listesi getirme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'ASSETS_FETCH_ERROR',
      message: 'Asset\'ler getirilirken hata oluştu.'
    });
  }
});

/**
 * @swagger
 * /api/secure/assets/{id}:
 *   get:
 *     summary: Asset Detayı
 *     description: Belirli bir asset'in detaylı bilgilerini getirir
 *     tags: [Asset İşlemleri]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Asset ID
 *     responses:
 *       200:
 *         description: Asset detayı başarıyla getirildi
 *       404:
 *         description: Asset bulunamadı
 */
router.get('/assets/:id', authenticateApiKey, authorizeEndpoint(['data:read', 'asset:read']), async (req, res) => {
  try {
    const assetId = parseInt(req.params.id);
    
    const [assetDetail] = await db
      .select({
        id: assets.id,
        modelId: assets.modelId,
        modelYear: assets.modelYear,
        plateNumber: assets.plateNumber,
        chassisNo: assets.chassisNo,
        engineNo: assets.engineNo,
        ownershipTypeId: assets.ownershipTypeId,
        ownerCompanyId: assets.ownerCompanyId,
        registerNo: assets.registerNo,
        registerDate: assets.registerDate,
        purchaseDate: assets.purchaseDate,
        isActive: assets.isActive,
        createdAt: assets.createdAt,
        updatedAt: assets.updatedAt,
        createdBy: assets.createdBy,
        updatedBy: assets.updatedBy,
        // Join data
        modelName: carModels.name,
        brandName: carBrands.name,
        typeName: carTypes.name,
        ownershipTypeName: ownershipTypes.name,
        ownerCompanyName: companies.name,
        capacity: carModels.capacity,
        modelDetail: carModels.detail
      })
      .from(assets)
      .leftJoin(carModels, eq(assets.modelId, carModels.id))
      .leftJoin(carBrands, eq(carModels.brandId, carBrands.id))
      .leftJoin(carTypes, eq(carModels.typeId, carTypes.id))
      .leftJoin(ownershipTypes, eq(assets.ownershipTypeId, ownershipTypes.id))
      .leftJoin(companies, eq(assets.ownerCompanyId, companies.id))
      .where(eq(assets.id, assetId));

    if (!assetDetail) {
      return res.status(404).json({
        success: false,
        error: 'ASSET_NOT_FOUND',
        message: 'Asset bulunamadı.'
      });
    }
    
    res.json({
      success: true,
      message: 'Asset detayı başarıyla getirildi.',
      data: {
        asset: assetDetail
      }
    });
  } catch (error) {
    console.error('Asset detayı getirme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'ASSET_DETAIL_ERROR',
      message: 'Asset detayı getirilirken hata oluştu.'
    });
  }
});

/**
 * @swagger
 * /api/secure/assets:
 *   post:
 *     summary: Yeni Asset Ekleme
 *     description: Sisteme yeni asset ekler
 *     tags: [Asset İşlemleri]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - modelId
 *               - modelYear
 *               - plateNumber
 *               - ownershipTypeId
 *             properties:
 *               modelId:
 *                 type: integer
 *                 description: Araç model ID
 *               modelYear:
 *                 type: integer
 *                 description: Araç model yılı
 *               plateNumber:
 *                 type: string
 *                 description: Plaka numarası
 *               chassisNo:
 *                 type: string
 *                 description: Şasi numarası
 *               engineNo:
 *                 type: string
 *                 description: Motor numarası
 *               ownershipTypeId:
 *                 type: integer
 *                 description: Sahiplik türü ID
 *               ownerCompanyId:
 *                 type: integer
 *                 description: Sahibi şirket ID
 *               registerNo:
 *                 type: string
 *                 description: Tescil numarası
 *               registerDate:
 *                 type: string
 *                 format: date
 *                 description: Tescil tarihi
 *               purchaseDate:
 *                 type: string
 *                 format: date
 *                 description: Satın alma tarihi
 *     responses:
 *       201:
 *         description: Asset başarıyla eklendi
 *       400:
 *         description: Geçersiz veri
 *       409:
 *         description: Plaka numarası zaten mevcut
 */
router.post('/assets', authenticateApiKey, authorizeEndpoint(['data:write', 'asset:write']), async (req, res) => {
  try {
    // Validate request body
    const validatedData = insertAssetSchema.parse(req.body);
    
    // Check for duplicate plate number
    const existingAsset = await db
      .select({ id: assets.id })
      .from(assets)
      .where(eq(assets.plateNumber, validatedData.plateNumber))
      .limit(1);

    if (existingAsset.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'DUPLICATE_PLATE_NUMBER',
        message: 'Bu plaka numarası zaten mevcut.'
      });
    }

    // Audit info
    const auditInfo = {
      userId: (req as any).user?.id,
      apiClientId: (req as any).apiClient?.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    };

    // Auditable insert
    const [newAsset] = await auditableInsert(
      assets,
      {
        ...validatedData,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      'assets',
      auditInfo
    );
    
    res.status(201).json({
      success: true,
      message: 'Asset başarıyla eklendi.',
      data: {
        asset: newAsset
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Geçersiz veri formatı.',
        details: error.errors
      });
    }
    
    console.error('Asset ekleme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'ASSET_CREATE_ERROR',
      message: 'Asset eklenirken hata oluştu.'
    });
  }
});

/**
 * @swagger
 * /api/secure/assets/{id}:
 *   put:
 *     summary: Asset Güncelleme
 *     description: Mevcut asset bilgilerini günceller
 *     tags: [Asset İşlemleri]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Asset ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               modelId:
 *                 type: integer
 *               modelYear:
 *                 type: integer
 *               plateNumber:
 *                 type: string
 *               chassisNo:
 *                 type: string
 *               engineNo:
 *                 type: string
 *               ownershipTypeId:
 *                 type: integer
 *               ownerCompanyId:
 *                 type: integer
 *               registerNo:
 *                 type: string
 *               registerDate:
 *                 type: string
 *                 format: date
 *               purchaseDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Asset başarıyla güncellendi
 *       404:
 *         description: Asset bulunamadı
 *       409:
 *         description: Plaka numarası başka asset'te mevcut
 */
router.put('/assets/:id', authenticateApiKey, authorizeEndpoint(['data:write', 'asset:write']), async (req, res) => {
  try {
    const assetId = parseInt(req.params.id);
    
    // Validate request body
    const validatedData = updateAssetSchema.parse(req.body);
    
    // Check if asset exists
    const existingAsset = await db
      .select({ id: assets.id, plateNumber: assets.plateNumber })
      .from(assets)
      .where(eq(assets.id, assetId))
      .limit(1);

    if (existingAsset.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'ASSET_NOT_FOUND',
        message: 'Asset bulunamadı.'
      });
    }

    // Check for duplicate plate number (if plate number is being changed)
    if (validatedData.plateNumber && validatedData.plateNumber !== existingAsset[0].plateNumber) {
      const duplicateAsset = await db
        .select({ id: assets.id })
        .from(assets)
        .where(and(
          eq(assets.plateNumber, validatedData.plateNumber),
          eq(assets.id, assetId) // Exclude current asset
        ))
        .limit(1);

      if (duplicateAsset.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'DUPLICATE_PLATE_NUMBER',
          message: 'Bu plaka numarası başka bir asset\'te mevcut.'
        });
      }
    }

    // Audit info
    const auditInfo = {
      userId: (req as any).user?.id,
      apiClientId: (req as any).apiClient?.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    };

    // Auditable update
    const [updatedAsset] = await auditableUpdate(
      assets,
      eq(assets.id, assetId),
      {
        ...validatedData,
        updatedAt: new Date()
      },
      'assets',
      auditInfo
    );
    
    res.json({
      success: true,
      message: 'Asset başarıyla güncellendi.',
      data: {
        asset: updatedAsset
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Geçersiz veri formatı.',
        details: error.errors
      });
    }
    
    console.error('Asset güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'ASSET_UPDATE_ERROR',
      message: 'Asset güncellenirken hata oluştu.'
    });
  }
});

/**
 * @swagger
 * /api/secure/assets/{id}:
 *   delete:
 *     summary: Asset Silme
 *     description: Asset'i siler (soft delete - is_active = false)
 *     tags: [Asset İşlemleri]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Asset ID
 *     responses:
 *       200:
 *         description: Asset başarıyla silindi
 *       404:
 *         description: Asset bulunamadı
 */
router.delete('/assets/:id', authenticateApiKey, authorizeEndpoint(['data:delete', 'asset:delete']), async (req, res) => {
  try {
    const assetId = parseInt(req.params.id);
    
    // Check if asset exists
    const existingAsset = await db
      .select({ id: assets.id })
      .from(assets)
      .where(eq(assets.id, assetId))
      .limit(1);

    if (existingAsset.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'ASSET_NOT_FOUND',
        message: 'Asset bulunamadı.'
      });
    }

    // Audit info
    const auditInfo = {
      userId: (req as any).user?.id,
      apiClientId: (req as any).apiClient?.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    };

    // Soft delete (isActive = false)
    const [deletedAsset] = await auditableUpdate(
      assets,
      eq(assets.id, assetId),
      { 
        isActive: false,
        updatedAt: new Date()
      },
      'assets',
      auditInfo
    );
    
    res.json({
      success: true,
      message: 'Asset başarıyla silindi.',
      data: {
        asset: deletedAsset
      }
    });
  } catch (error) {
    console.error('Asset silme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'ASSET_DELETE_ERROR',
      message: 'Asset silinirken hata oluştu.'
    });
  }
});

export default router;