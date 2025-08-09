import { Router } from 'express';
import { db } from './db.js';
import { eq, and, ilike, desc, asc } from 'drizzle-orm';
import { 
  assets, carModels, carBrands, carTypes, ownershipTypes, companies,
  insertAssetSchema, updateAssetSchema,
  type InsertAsset, type UpdateAsset, type Asset
} from '../shared/schema.js';
import { z } from 'zod';
import { authenticateToken } from './auth.js';
import { 
  auditableInsert,
  auditableUpdate,
  auditableDelete
} from './audit-middleware.js';

const router = Router();

/**
 * @swagger
 * /api/secure/vehicles:
 *   get:
 *     summary: Araç Listesi
 *     description: Tüm araçları listeler (model, marka, tip bilgileri ile birlikte)
 *     tags: [Araç İşlemleri]
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
 *         description: Sadece aktif araçları getirmek için
 *       - in: query
 *         name: modelId
 *         schema:
 *           type: integer
 *         description: Belirli modeldeki araçları filtrelemek için
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: integer
 *         description: Belirli şirketteki araçları filtrelemek için
 *     responses:
 *       200:
 *         description: Araçlar başarıyla getirildi
 *       401:
 *         description: Geçersiz API anahtarı
 */
router.get('/vehicles', authenticateToken, async (req, res) => {
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
      query.where(and(...whereConditions));
    }

    // Execute query with ordering
    const vehiclesList = await query.orderBy(desc(assets.createdAt));
    
    res.json({
      success: true,
      message: 'Araçlar başarıyla getirildi.',
      data: {
        vehicles: vehiclesList,
        totalCount: vehiclesList.length
      }
    });
  } catch (error) {
    console.error('Araç listesi getirme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'VEHICLES_FETCH_ERROR',
      message: 'Araçlar getirilirken hata oluştu.'
    });
  }
});

/**
 * @swagger
 * /api/secure/vehicles/{id}:
 *   get:
 *     summary: Araç Detayı
 *     description: Belirli bir aracın detaylı bilgilerini getirir
 *     tags: [Araç İşlemleri]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Araç ID
 *     responses:
 *       200:
 *         description: Araç detayı başarıyla getirildi
 *       404:
 *         description: Araç bulunamadı
 */
router.get('/vehicles/:id', authenticateToken, async (req, res) => {
  try {
    const vehicleId = parseInt(req.params.id);
    
    const [vehicleDetail] = await db
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
      .where(eq(assets.id, vehicleId));

    if (!vehicleDetail) {
      return res.status(404).json({
        success: false,
        error: 'VEHICLE_NOT_FOUND',
        message: 'Araç bulunamadı.'
      });
    }
    
    res.json({
      success: true,
      message: 'Araç detayı başarıyla getirildi.',
      data: {
        vehicle: vehicleDetail
      }
    });
  } catch (error) {
    console.error('Araç detayı getirme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'VEHICLE_DETAIL_ERROR',
      message: 'Araç detayı getirilirken hata oluştu.'
    });
  }
});

/**
 * @swagger
 * /api/secure/vehicles:
 *   post:
 *     summary: Yeni Araç Oluşturma
 *     description: Yeni bir araç kaydı oluşturur
 *     tags: [Araç İşlemleri]
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
 *                 description: Araç modeli ID
 *               modelYear:
 *                 type: integer
 *                 description: Model yılı
 *               plateNumber:
 *                 type: string
 *                 description: Plaka numarası (benzersiz olmalı)
 *               chassisNo:
 *                 type: string
 *                 description: Şasi numarası (isteğe bağlı)
 *               engineNo:
 *                 type: string
 *                 description: Motor numarası (isteğe bağlı)
 *               ownershipTypeId:
 *                 type: integer
 *                 description: Sahiplik türü ID
 *               ownerCompanyId:
 *                 type: integer
 *                 description: Sahip şirket ID (isteğe bağlı)
 *               registerNo:
 *                 type: string
 *                 description: Ruhsat numarası (isteğe bağlı)
 *               registerDate:
 *                 type: string
 *                 format: date
 *                 description: Ruhsat tarihi (isteğe bağlı)
 *               purchaseDate:
 *                 type: string
 *                 format: date
 *                 description: Satın alma tarihi (isteğe bağlı)
 *               isActive:
 *                 type: boolean
 *                 default: true
 *                 description: Araç aktif mi?
 *     responses:
 *       201:
 *         description: Araç başarıyla oluşturuldu
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Araç başarıyla oluşturuldu."
 *                 data:
 *                   type: object
 *                   properties:
 *                     vehicle:
 *                       type: object
 *       400:
 *         description: Geçersiz veri
 *       409:
 *         description: Plaka numarası zaten kayıtlı
 *       401:
 *         description: Geçersiz API anahtarı
 */
router.post('/vehicles', authenticateToken, async (req, res) => {
  try {
    // Request body validasyonu
    const validationResult = insertAssetSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Geçersiz veri formatı.',
        details: validationResult.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    
    const assetData = validationResult.data;
    
    // Plaka numarası benzersizlik kontrolü
    const existingVehicle = await db
      .select({ id: assets.id })
      .from(assets)
      .where(eq(assets.plateNumber, assetData.plateNumber));
      
    if (existingVehicle.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'DUPLICATE_PLATE_NUMBER',
        message: 'Bu plaka numarası zaten kayıtlı.'
      });
    }
    
    // Audit bilgilerini ekle (eğer middleware kullanıyorsanız)
    const auditInfo = {
      createdBy: (req as any).user?.id, // Auth middleware'den gelen user ID
      updatedBy: (req as any).user?.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Yeni araç oluştur
    const [newVehicle] = await auditableInsert(
      assets,
      { ...assetData, ...auditInfo },
      (req as any).user?.id,
      req.ip,
      req.get('User-Agent')
    );
    
    // Yeni oluşturulan aracın detaylı bilgilerini getir
    const [vehicleDetail] = await db
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
        ownerCompanyName: companies.name
      })
      .from(assets)
      .leftJoin(carModels, eq(assets.modelId, carModels.id))
      .leftJoin(carBrands, eq(carModels.brandId, carBrands.id))
      .leftJoin(carTypes, eq(carModels.typeId, carTypes.id))
      .leftJoin(ownershipTypes, eq(assets.ownershipTypeId, ownershipTypes.id))
      .leftJoin(companies, eq(assets.ownerCompanyId, companies.id))
      .where(eq(assets.id, newVehicle.id));
    
    res.status(201).json({
      success: true,
      message: 'Araç başarıyla oluşturuldu.',
      data: {
        vehicle: vehicleDetail
      }
    });
    
  } catch (error) {
    console.error('Araç oluşturma hatası:', error);
    res.status(500).json({
      success: false,
      error: 'VEHICLE_CREATE_ERROR',
      message: 'Araç oluşturulurken hata oluştu.'
    });
  }
});

export default router;
