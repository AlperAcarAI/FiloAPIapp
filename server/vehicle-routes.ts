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
router.get('/vehicles', async (req, res) => {
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
router.get('/vehicles/:id', authenticateApiKey, authorizeEndpoint(['data:read', 'asset:read']), async (req, res) => {
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

export default router;
