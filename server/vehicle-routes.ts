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
      db,
      assets,
      { ...assetData, ...auditInfo },
      auditInfo
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

/**
 * @swagger
 * /api/secure/car-brands:
 *   get:
 *     summary: Araç Marka Listesi
 *     description: Tüm araç markalarını listeler
 *     tags: [Araç Marka/Model İşlemleri]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Marka adında arama yapmak için
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maksimum sonuç sayısı
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Sayfalama için başlangıç noktası
 *     responses:
 *       200:
 *         description: Markalar başarıyla getirildi
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
 *                   example: "Araç markaları başarıyla getirildi"
 *                 data:
 *                   type: object
 *                   properties:
 *                     brands:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           name:
 *                             type: string
 *                             example: "ALFA ROMEO"
 *                           isActive:
 *                             type: boolean
 *                             example: true
 *                     totalCount:
 *                       type: integer
 *                       example: 50
 */
router.get('/car-brands', authenticateToken, async (req, res) => {
  try {
    const { search, limit, offset, sortBy = 'name', sortOrder = 'asc' } = req.query;
    
    // Base query
    let query = db
      .select({
        id: carBrands.id,
        name: carBrands.name,
        isActive: carBrands.isActive
      })
      .from(carBrands);
    
    // Filters
    const whereConditions = [];
    
    if (search) {
      whereConditions.push(ilike(carBrands.name, `%${search}%`));
    }
    
    if (whereConditions.length > 0) {
      query.where(and(...whereConditions));
    }
    
    // Sorting
    const orderColumn = sortBy === 'id' ? carBrands.id : carBrands.name;
    const orderDirection = sortOrder === 'desc' ? desc(orderColumn) : asc(orderColumn);
    query.orderBy(orderDirection);
    
    // Pagination
    if (limit) {
      query.limit(Number(limit));
      if (offset) {
        query.offset(Number(offset));
      }
    }
    
    const brandsList = await query;
    
    res.json({
      success: true,
      message: 'Araç markaları başarıyla getirildi.',
      data: {
        brands: brandsList,
        totalCount: brandsList.length
      }
    });
  } catch (error) {
    console.error('Araç markaları getirme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'CAR_BRANDS_FETCH_ERROR',
      message: 'Araç markaları getirilirken hata oluştu.'
    });
  }
});

/**
 * @swagger
 * /api/secure/car-brands/{id}:
 *   get:
 *     summary: Araç Marka Detayı
 *     description: Belirli bir araç markasının detaylı bilgilerini getirir
 *     tags: [Araç Marka/Model İşlemleri]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Marka ID
 *     responses:
 *       200:
 *         description: Marka detayı başarıyla getirildi
 *       404:
 *         description: Marka bulunamadı
 */
router.get('/car-brands/:id', authenticateToken, async (req, res) => {
  try {
    const brandId = parseInt(req.params.id);
    
    const [brandDetail] = await db
      .select({
        id: carBrands.id,
        name: carBrands.name,
        isActive: carBrands.isActive
      })
      .from(carBrands)
      .where(eq(carBrands.id, brandId));
    
    if (!brandDetail) {
      return res.status(404).json({
        success: false,
        error: 'BRAND_NOT_FOUND',
        message: 'Araç markası bulunamadı.'
      });
    }
    
    res.json({
      success: true,
      message: 'Araç markası detayı başarıyla getirildi.',
      data: {
        brand: brandDetail
      }
    });
  } catch (error) {
    console.error('Araç markası detayı getirme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'BRAND_DETAIL_ERROR',
      message: 'Araç markası detayı getirilirken hata oluştu.'
    });
  }
});

/**
 * @swagger
 * /api/secure/car-models:
 *   get:
 *     summary: Araç Model Listesi
 *     description: Araç modellerini listeler (marka bilgisi ile birlikte)
 *     tags: [Araç Marka/Model İşlemleri]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Model adında arama yapmak için
 *       - in: query
 *         name: brandId
 *         schema:
 *           type: integer
 *         description: Belirli markaya ait modelleri filtrelemek için
 *       - in: query
 *         name: typeId
 *         schema:
 *           type: integer
 *         description: Belirli araç tipine göre filtrelemek için
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maksimum sonuç sayısı
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Sayfalama için başlangıç noktası
 *     responses:
 *       200:
 *         description: Modeller başarıyla getirildi
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
 *                   example: "Araç modelleri başarıyla getirildi"
 *                 data:
 *                   type: object
 *                   properties:
 *                     models:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           name:
 *                             type: string
 *                             example: "GT 2.0 JTS DISTINCTIVE"
 *                           brandId:
 *                             type: integer
 *                             example: 1
 *                           brandName:
 *                             type: string
 *                             example: "ALFA ROMEO"
 *                           typeId:
 *                             type: integer
 *                             example: 1
 *                           typeName:
 *                             type: string
 *                             example: "Otomobil"
 *                           capacity:
 *                             type: string
 *                             example: "5 kişi"
 *                     totalCount:
 *                       type: integer
 *                       example: 150
 */
router.get('/car-models', authenticateToken, async (req, res) => {
  try {
    const { search, brandId, typeId, limit, offset, sortBy = 'name', sortOrder = 'asc' } = req.query;
    
    // Build where conditions
    const whereConditions = [];
    
    if (search) {
      whereConditions.push(ilike(carModels.name, `%${search}%`));
    }
    
    if (brandId) {
      whereConditions.push(eq(carModels.brandId, parseInt(brandId as string)));
    }
    
    if (typeId) {
      whereConditions.push(eq(carModels.typeId, parseInt(typeId as string)));
    }
    
    // Build base query
    let baseQuery = db
      .select({
        id: carModels.id,
        name: carModels.name,
        brandId: carModels.brandId,
        typeId: carModels.typeId,
        capacity: carModels.capacity,
        detail: carModels.detail,
        isActive: carModels.isActive,
        brandName: carBrands.name,
        typeName: carTypes.name
      })
      .from(carModels)
      .leftJoin(carBrands, eq(carModels.brandId, carBrands.id))
      .leftJoin(carTypes, eq(carModels.typeId, carTypes.id));
    
    // Apply conditions dynamically
    if (whereConditions.length > 0) {
      baseQuery = baseQuery.where(and(...whereConditions));
    }
    
    // Apply sorting
    const orderColumn = sortBy === 'id' ? carModels.id : carModels.name;
    const orderDirection = sortOrder === 'desc' ? desc(orderColumn) : asc(orderColumn);
    baseQuery = baseQuery.orderBy(orderDirection);
    
    // Apply pagination
    if (limit) {
      baseQuery = baseQuery.limit(Number(limit));
      if (offset) {
        baseQuery = baseQuery.offset(Number(offset));
      }
    }
    
    const modelsList = await baseQuery;
    
    res.json({
      success: true,
      message: 'Araç modelleri başarıyla getirildi.',
      data: {
        models: modelsList,
        totalCount: modelsList.length
      }
    });
  } catch (error) {
    console.error('Araç modelleri getirme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'CAR_MODELS_FETCH_ERROR',
      message: 'Araç modelleri getirilirken hata oluştu.'
    });
  }
});

/**
 * @swagger
 * /api/secure/car-models/{id}:
 *   get:
 *     summary: Araç Model Detayı
 *     description: Belirli bir araç modelinin detaylı bilgilerini getirir
 *     tags: [Araç Marka/Model İşlemleri]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Model ID
 *     responses:
 *       200:
 *         description: Model detayı başarıyla getirildi
 *       404:
 *         description: Model bulunamadı
 */
router.get('/car-models/:id', authenticateToken, async (req, res) => {
  try {
    const modelId = parseInt(req.params.id);
    
    const [modelDetail] = await db
      .select({
        id: carModels.id,
        name: carModels.name,
        brandId: carModels.brandId,
        typeId: carModels.typeId,
        capacity: carModels.capacity,
        detail: carModels.detail,
        isActive: carModels.isActive,
        // Join data
        brandName: carBrands.name,
        typeName: carTypes.name
      })
      .from(carModels)
      .leftJoin(carBrands, eq(carModels.brandId, carBrands.id))
      .leftJoin(carTypes, eq(carModels.typeId, carTypes.id))
      .where(eq(carModels.id, modelId));
    
    if (!modelDetail) {
      return res.status(404).json({
        success: false,
        error: 'MODEL_NOT_FOUND',
        message: 'Araç modeli bulunamadı.'
      });
    }
    
    res.json({
      success: true,
      message: 'Araç modeli detayı başarıyla getirildi.',
      data: {
        model: modelDetail
      }
    });
  } catch (error) {
    console.error('Araç modeli detayı getirme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'MODEL_DETAIL_ERROR',
      message: 'Araç modeli detayı getirilirken hata oluştu.'
    });
  }
});

// =============================================
// SAHİPLİK TÜRLERİ (OWNERSHIP TYPES) API'LERİ
// =============================================

/**
 * @swagger
 * /api/secure/ownership-types:
 *   get:
 *     summary: Sahiplik türlerini listele
 *     description: Tüm sahiplik türlerini getirir (filtreleme ve sayfalama destekli)
 *     tags: [Sahiplik Türleri]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         description: Sahiplik türü adında arama yapın
 *         schema:
 *           type: string
 *           example: "Şirket"
 *       - in: query
 *         name: limit
 *         description: Döndürülecek kayıt sayısı
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           example: 10
 *       - in: query
 *         name: offset
 *         description: Atlanacak kayıt sayısı
 *         schema:
 *           type: integer
 *           minimum: 0
 *           example: 0
 *       - in: query
 *         name: sortBy
 *         description: Sıralama alanı
 *         schema:
 *           type: string
 *           enum: [id, name]
 *           example: "name"
 *       - in: query
 *         name: sortOrder
 *         description: Sıralama yönü
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           example: "asc"
 *       - in: query
 *         name: activeOnly
 *         description: Sadece aktif kayıtları getir
 *         schema:
 *           type: boolean
 *           example: true
 *     responses:
 *       200:
 *         description: Sahiplik türleri başarıyla getirildi
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
 *                   example: "Sahiplik türleri başarıyla getirildi."
 *                 data:
 *                   type: object
 *                   properties:
 *                     ownershipTypes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           name:
 *                             type: string
 *                             example: "Şirket Mülkiyeti"
 *                           isActive:
 *                             type: boolean
 *                             example: true
 *                     totalCount:
 *                       type: integer
 *                       example: 5
 */
router.get('/ownership-types', authenticateToken, async (req, res) => {
  try {
    const { search, limit, offset, sortBy = 'name', sortOrder = 'asc', activeOnly } = req.query;
    
    // Build where conditions
    const whereConditions = [];
    
    if (search) {
      whereConditions.push(ilike(ownershipTypes.name, `%${search}%`));
    }
    
    if (activeOnly === 'true') {
      whereConditions.push(eq(ownershipTypes.isActive, true));
    }
    
    // Build base query
    let baseQuery = db
      .select({
        id: ownershipTypes.id,
        name: ownershipTypes.name,
        isActive: ownershipTypes.isActive
      })
      .from(ownershipTypes);
    
    // Apply conditions
    if (whereConditions.length > 0) {
      baseQuery = baseQuery.where(and(...whereConditions));
    }
    
    // Apply sorting
    const orderColumn = sortBy === 'id' ? ownershipTypes.id : ownershipTypes.name;
    const orderDirection = sortOrder === 'desc' ? desc(orderColumn) : asc(orderColumn);
    baseQuery = baseQuery.orderBy(orderDirection);
    
    // Apply pagination
    if (limit) {
      baseQuery = baseQuery.limit(Number(limit));
      if (offset) {
        baseQuery = baseQuery.offset(Number(offset));
      }
    }
    
    const ownershipTypesList = await baseQuery;
    
    res.json({
      success: true,
      message: 'Sahiplik türleri başarıyla getirildi.',
      data: {
        ownershipTypes: ownershipTypesList,
        totalCount: ownershipTypesList.length
      }
    });
  } catch (error) {
    console.error('Sahiplik türleri getirme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'OWNERSHIP_TYPES_FETCH_ERROR',
      message: 'Sahiplik türleri getirilirken hata oluştu.'
    });
  }
});

/**
 * @swagger
 * /api/secure/ownership-types/{id}:
 *   get:
 *     summary: Sahiplik türü detayını getir
 *     description: Belirtilen ID'ye sahip sahiplik türünün detaylarını getirir
 *     tags: [Sahiplik Türleri]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Sahiplik türü ID'si
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Sahiplik türü detayı başarıyla getirildi
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
 *                   example: "Sahiplik türü detayı başarıyla getirildi."
 *                 data:
 *                   type: object
 *                   properties:
 *                     ownershipType:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 1
 *                         name:
 *                           type: string
 *                           example: "Şirket Mülkiyeti"
 *                         isActive:
 *                           type: boolean
 *                           example: true
 *       404:
 *         description: Sahiplik türü bulunamadı
 */
router.get('/ownership-types/:id', authenticateToken, async (req, res) => {
  try {
    const ownershipTypeId = parseInt(req.params.id);
    
    if (isNaN(ownershipTypeId)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_ID',
        message: 'Geçersiz sahiplik türü ID\'si.'
      });
    }
    
    const [ownershipTypeDetail] = await db
      .select({
        id: ownershipTypes.id,
        name: ownershipTypes.name,
        isActive: ownershipTypes.isActive
      })
      .from(ownershipTypes)
      .where(eq(ownershipTypes.id, ownershipTypeId));
    
    if (!ownershipTypeDetail) {
      return res.status(404).json({
        success: false,
        error: 'OWNERSHIP_TYPE_NOT_FOUND',
        message: 'Sahiplik türü bulunamadı.'
      });
    }
    
    res.json({
      success: true,
      message: 'Sahiplik türü detayı başarıyla getirildi.',
      data: {
        ownershipType: ownershipTypeDetail
      }
    });
  } catch (error) {
    console.error('Sahiplik türü detayı getirme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'OWNERSHIP_TYPE_DETAIL_ERROR',
      message: 'Sahiplik türü detayı getirilirken hata oluştu.'
    });
  }
});

export default router;
