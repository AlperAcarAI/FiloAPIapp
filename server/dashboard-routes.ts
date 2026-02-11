import express from 'express';
import { db } from './db.js';
import { eq, desc, asc, sql, like, ilike, and, or, inArray } from 'drizzle-orm';
import { 
  assets, 
  personnel, 
  assetsMaintenance as maintenance, 
  personnelWorkAreas,
  workAreas,
  assetsPersonelAssignment as assetAssignments,
  personnelPositions,
  projects,
  cities,
  carModels,
  carBrands
} from '@shared/schema.js';
import { authenticateJWT, filterByWorkArea, type AuthRequest } from './hierarchical-auth.js';

const router = express.Router();

/**
 * @swagger
 * /api/dashboard/vehicles:
 *   get:
 *     summary: Dashboard araç listesi - Hierarchical authorization ile
 *     description: Tüm araçların detaylı bilgilerini, şoför ataması, şantiye bilgisi, bakım istatistikleri ile getirir. Kullanıcının yetkisi dahilindeki veriler gösterilir.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Plaka, marka, model veya şoför adında arama
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *         description: Marka filtresi
 *       - in: query
 *         name: model
 *         schema:
 *           type: string
 *         description: Model filtresi
 *       - in: query
 *         name: driverId
 *         schema:
 *           type: integer
 *         description: Şoför ID filtresi
 *       - in: query
 *         name: workSiteId
 *         schema:
 *           type: integer
 *         description: Şantiye ID filtresi
 *       - in: query
 *         name: activeOnly
 *         schema:
 *           type: boolean
 *         description: Sadece aktif araçları göster (varsayılan true)
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [plateNumber, lastMaintenance, totalCost, maintenanceCount, brand, model]
 *         description: Sıralama kriteri
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sıralama yönü (varsayılan asc)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 500
 *         description: Sayfa başına kayıt sayısı (varsayılan 50)
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Başlangıç konumu (varsayılan 0)
 *     responses:
 *       200:
 *         description: Dashboard araç listesi başarıyla getirildi
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
 *                   example: Dashboard araç listesi başarıyla getirildi
 *                 data:
 *                   type: object
 *                   properties:
 *                     vehicles:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           vehicleId:
 *                             type: integer
 *                             example: 1
 *                           plateNumber:
 *                             type: string
 *                             example: "34ABC123"
 *                           brand:
 *                             type: string
 *                             example: "Ford"
 *                           model:
 *                             type: string
 *                             example: "Transit"
 *                           year:
 *                             type: integer
 *                             example: 2022
 *                           chassisNumber:
 *                             type: string
 *                             example: "WF0XXXGBXXXXX1234"
 *                           engineNumber:
 *                             type: string
 *                             example: "ABCD123456"
 *                           uttsNumber:
 *                             type: string
 *                             example: "UTTS123456"
 *                           registrationNumber:
 *                             type: string
 *                             example: "REG789012"
 *                           registrationDate:
 *                             type: string
 *                             format: date
 *                             example: "2022-01-15"
 *                           purchaseDate:
 *                             type: string
 *                             format: date
 *                             example: "2022-01-10"
 *                           maintenanceCount:
 *                             type: integer
 *                             example: 5
 *                           lastMaintenanceDate:
 *                             type: string
 *                             format: date
 *                             example: "2025-08-15"
 *                           totalCostCents:
 *                             type: integer
 *                             example: 2500000
 *                           currentDriver:
 *                             type: object
 *                             nullable: true
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 example: 25
 *                               name:
 *                                 type: string
 *                                 example: "Ahmet"
 *                               surname:
 *                                 type: string
 *                                 example: "Yılmaz"
 *                           currentWorkSite:
 *                             type: object
 *                             nullable: true
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 example: 10
 *                               name:
 *                                 type: string
 *                                 example: "İstanbul Şantiye A"
 *                               location:
 *                                 type: string
 *                                 example: "Kadıköy"
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalVehicles:
 *                           type: integer
 *                           example: 150
 *                         activeVehicles:
 *                           type: integer
 *                           example: 145
 *                         totalMaintenanceCost:
 *                           type: integer
 *                           example: 15000000
 *                         avgMaintenancePerVehicle:
 *                           type: number
 *                           example: 3.2
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 150
 *                         offset:
 *                           type: integer
 *                           example: 0
 *                         limit:
 *                           type: integer
 *                           example: 50
 *                         hasMore:
 *                           type: boolean
 *                           example: true
 *       401:
 *         description: Kimlik doğrulama hatası
 *       403:
 *         description: Yetkisiz erişim
 *       500:
 *         description: Sunucu hatası
 */
router.get('/vehicles', authenticateJWT, filterByWorkArea, async (req: AuthRequest, res) => {
  try {
    const {
      search,
      brand,
      model,
      driverId,
      workSiteId,
      activeOnly = 'true',
      sortBy = 'plateNumber',
      sortOrder = 'asc',
      limit = '50',
      offset = '0'
    } = req.query;

    const limitNum = Math.min(parseInt(limit as string) || 50, 500);
    const offsetNum = parseInt(offset as string) || 0;
    const isActiveOnly = activeOnly === 'true';

    // Build main query with complex JOINs
    let baseQuery = db
      .select({
        // Vehicle basic info
        vehicleId: assets.id,
        plateNumber: assets.plateNumber,
        modelYear: assets.modelYear,
        chassisNo: assets.chassisNo,
        engineNo: assets.engineNo,
        uttsNo: assets.uttsNo,
        registerNo: assets.registerNo,
        registerDate: assets.registerDate,
        purchaseDate: assets.purchaseDate,
        isActive: assets.isActive,
        
        // Current driver info from asset assignments
        currentDriverId: personnel.id,
        currentDriverName: personnel.name,
        currentDriverSurname: personnel.surname,
        
        // Current work site info
        currentWorkSiteId: workAreas.id,
        currentWorkSiteName: workAreas.name,
        currentWorkSiteLocation: cities.name,
        
        // Maintenance count subquery
        maintenanceCount: sql<number>`(
          SELECT COUNT(*)::integer 
          FROM assets_maintenance am 
          WHERE am.asset_id = ${assets.id} 
          AND am.is_active = true
        )`.as('maintenanceCount'),
        
        // Last maintenance date subquery
        lastMaintenanceDate: sql<string>`(
          SELECT MAX(am.maintenance_date)::text 
          FROM assets_maintenance am 
          WHERE am.asset_id = ${assets.id} 
          AND am.is_active = true
        )`.as('lastMaintenanceDate'),
        
        // Total maintenance cost subquery
        totalCostCents: sql<number>`(
          SELECT COALESCE(SUM(am.amount_cents), 0)::integer 
          FROM assets_maintenance am 
          WHERE am.asset_id = ${assets.id} 
          AND am.is_active = true
        )`.as('totalCostCents'),
        
        // Brand and model from relations
        brandName: carBrands.name,
        modelName: carModels.name
      })
      .from(assets)
      // Join with car models and brands
      .leftJoin(carModels, eq(assets.modelId, carModels.id))
      .leftJoin(carBrands, eq(carModels.brandId, carBrands.id))
      // Join with current asset assignments to get driver
      .leftJoin(
        assetAssignments,
        and(
          eq(assets.id, assetAssignments.assetId),
          eq(assetAssignments.isActive, true)
        )
      )
      // Join with personnel to get driver details
      .leftJoin(personnel, eq(assetAssignments.personnelId, personnel.id))
      // Join with personnel work areas to get current work site
      .leftJoin(
        personnelWorkAreas,
        and(
          eq(personnel.id, personnelWorkAreas.personnelId),
          eq(personnelWorkAreas.isActive, true)
        )
      )
      // Join with work areas to get work site details
      .leftJoin(workAreas, eq(personnelWorkAreas.workAreaId, workAreas.id))
      // Join with cities for work site location
      .leftJoin(cities, eq(workAreas.cityId, cities.id));

    // Apply filters
    const whereConditions = [];

    // Active filter
    if (isActiveOnly) {
      whereConditions.push(eq(assets.isActive, true));
    }

    // Search filter
    if (search) {
      const searchTerm = `%${search}%`;
      whereConditions.push(
        or(
          ilike(assets.plateNumber, searchTerm),
          ilike(carBrands.name, searchTerm),
          ilike(carModels.name, searchTerm),
          ilike(sql`${personnel.name} || ' ' || ${personnel.surname}`, searchTerm)
        )
      );
    }

    // Brand filter
    if (brand) {
      whereConditions.push(ilike(carBrands.name, `%${brand}%`));
    }

    // Model filter
    if (model) {
      whereConditions.push(ilike(carModels.name, `%${model}%`));
    }

    // Driver filter
    if (driverId) {
      whereConditions.push(eq(personnel.id, parseInt(driverId as string)));
    }

    // Work site filter
    if (workSiteId) {
      whereConditions.push(eq(workAreas.id, parseInt(workSiteId as string)));
    }

    // HIERARCHICAL AUTHORIZATION FILTER
    // Apply work area restrictions based on user's access scope
    if (req.workAreaFilter && req.workAreaFilter.length > 0) {
      // User has restricted access - filter by allowed work areas
      whereConditions.push(
        or(
          // Include vehicles with drivers assigned to allowed work areas
          inArray(workAreas.id, req.workAreaFilter),
          // Include vehicles without driver assignments (unassigned vehicles)
          sql`${personnel.id} IS NULL`
        )
      );
    }
    // If req.workAreaFilter is null, user has CORPORATE access - no additional filtering

    // Apply all conditions
    let finalBaseQuery = baseQuery;
    if (whereConditions.length > 0) {
      finalBaseQuery = baseQuery.where(and(...whereConditions));
    }

    // Apply sorting
    let orderBy;
    const isDesc = sortOrder === 'desc';
    
    switch (sortBy) {
      case 'plateNumber':
        orderBy = isDesc ? desc(assets.plateNumber) : asc(assets.plateNumber);
        break;
      case 'brand':
        orderBy = isDesc ? desc(carBrands.name) : asc(carBrands.name);
        break;
      case 'model':
        orderBy = isDesc ? desc(carModels.name) : asc(carModels.name);
        break;
      case 'lastMaintenance':
        orderBy = isDesc 
          ? desc(sql`(SELECT MAX(am.maintenance_date) FROM assets_maintenance am WHERE am.asset_id = ${assets.id} AND am.is_active = true)`)
          : asc(sql`(SELECT MAX(am.maintenance_date) FROM assets_maintenance am WHERE am.asset_id = ${assets.id} AND am.is_active = true)`);
        break;
      case 'maintenanceCount':
        orderBy = isDesc 
          ? desc(sql`(SELECT COUNT(*) FROM assets_maintenance am WHERE am.asset_id = ${assets.id} AND am.is_active = true)`)
          : asc(sql`(SELECT COUNT(*) FROM assets_maintenance am WHERE am.asset_id = ${assets.id} AND am.is_active = true)`);
        break;
      case 'totalCost':
        orderBy = isDesc 
          ? desc(sql`(SELECT COALESCE(SUM(am.amount_cents), 0) FROM assets_maintenance am WHERE am.asset_id = ${assets.id} AND am.is_active = true)`)
          : asc(sql`(SELECT COALESCE(SUM(am.amount_cents), 0) FROM assets_maintenance am WHERE am.asset_id = ${assets.id} AND am.is_active = true)`);
        break;
      default:
        orderBy = asc(assets.plateNumber);
    }

    const finalQuery = finalBaseQuery.orderBy(orderBy);

    // Get total count for pagination
    const countQuery = db
      .select({ count: sql<number>`count(*)`.as('count') })
      .from(assets)
      .leftJoin(carModels, eq(assets.modelId, carModels.id))
      .leftJoin(carBrands, eq(carModels.brandId, carBrands.id))
      .leftJoin(
        assetAssignments,
        and(
          eq(assets.id, assetAssignments.assetId),
          eq(assetAssignments.isActive, true)
        )
      )
      .leftJoin(personnel, eq(assetAssignments.personnelId, personnel.id))
      .leftJoin(
        personnelWorkAreas,
        and(
          eq(personnel.id, personnelWorkAreas.personnelId),
          eq(personnelWorkAreas.isActive, true)
        )
      )
      .leftJoin(workAreas, eq(personnelWorkAreas.workAreaId, workAreas.id));

    let finalCountQuery = countQuery;
    if (whereConditions.length > 0) {
      finalCountQuery = countQuery.where(and(...whereConditions));
    }

    // Execute queries
    const [vehicles, totalResult] = await Promise.all([
      finalQuery.limit(limitNum).offset(offsetNum),
      finalCountQuery
    ]);

    const total = totalResult[0]?.count || 0;

    // Calculate summary statistics (with authorization filtering)
    const summaryQuery = db
      .select({
        totalVehicles: sql<number>`COUNT(DISTINCT ${assets.id})`.as('totalVehicles'),
        activeVehicles: sql<number>`COUNT(DISTINCT CASE WHEN ${assets.isActive} = true THEN ${assets.id} END)`.as('activeVehicles'),
        totalMaintenanceCost: sql<number>`COALESCE(SUM(${maintenance.amountCents}), 0)`.as('totalMaintenanceCost'),
        totalMaintenanceCount: sql<number>`COUNT(${maintenance.id})`.as('totalMaintenanceCount')
      })
      .from(assets)
      .leftJoin(maintenance, and(eq(assets.id, maintenance.assetId), eq(maintenance.isActive, true)))
      .leftJoin(
        assetAssignments,
        and(
          eq(assets.id, assetAssignments.assetId),
          eq(assetAssignments.isActive, true)
        )
      )
      .leftJoin(personnel, eq(assetAssignments.personnelId, personnel.id))
      .leftJoin(
        personnelWorkAreas,
        and(
          eq(personnel.id, personnelWorkAreas.personnelId),
          eq(personnelWorkAreas.isActive, true)
        )
      )
      .leftJoin(workAreas, eq(personnelWorkAreas.workAreaId, workAreas.id));

    // Apply same authorization filtering to summary
    const summaryWhereConditions = [];
    if (req.workAreaFilter && req.workAreaFilter.length > 0) {
      summaryWhereConditions.push(
        or(
          inArray(workAreas.id, req.workAreaFilter),
          sql`${personnel.id} IS NULL`
        )
      );
    }

    let finalSummaryQuery = summaryQuery;
    if (summaryWhereConditions.length > 0) {
      finalSummaryQuery = summaryQuery.where(and(...summaryWhereConditions));
    }

    const [summaryResult] = await finalSummaryQuery;

    // Format response data
    const formattedVehicles = vehicles.map(vehicle => ({
      vehicleId: vehicle.vehicleId,
      plateNumber: vehicle.plateNumber,
      brand: vehicle.brandName,
      model: vehicle.modelName,
      year: vehicle.modelYear,
      chassisNumber: vehicle.chassisNo,
      engineNumber: vehicle.engineNo,
      uttsNumber: vehicle.uttsNo,
      registrationNumber: vehicle.registerNo,
      registrationDate: vehicle.registerDate,
      purchaseDate: vehicle.purchaseDate,
      maintenanceCount: vehicle.maintenanceCount || 0,
      lastMaintenanceDate: vehicle.lastMaintenanceDate,
      totalCostCents: vehicle.totalCostCents || 0,
      currentDriver: vehicle.currentDriverId ? {
        id: vehicle.currentDriverId,
        name: vehicle.currentDriverName,
        surname: vehicle.currentDriverSurname
      } : null,
      currentWorkSite: vehicle.currentWorkSiteId ? {
        id: vehicle.currentWorkSiteId,
        name: vehicle.currentWorkSiteName,
        location: vehicle.currentWorkSiteLocation
      } : null
    }));

    const avgMaintenancePerVehicle = summaryResult.totalVehicles > 0 
      ? Number((summaryResult.totalMaintenanceCount / summaryResult.totalVehicles).toFixed(2))
      : 0;

    res.json({
      success: true,
      message: 'Dashboard araç listesi başarıyla getirildi',
      data: {
        vehicles: formattedVehicles,
        summary: {
          totalVehicles: summaryResult.totalVehicles || 0,
          activeVehicles: summaryResult.activeVehicles || 0,
          totalMaintenanceCost: summaryResult.totalMaintenanceCost || 0,
          avgMaintenancePerVehicle
        },
        pagination: {
          total,
          offset: offsetNum,
          limit: limitNum,
          hasMore: offsetNum + limitNum < total
        }
      }
    });

  } catch (error) {
    console.error('Dashboard araç listesi hatası:', error);
    res.status(500).json({
      success: false,
      error: 'DASHBOARD_FETCH_ERROR',
      message: 'Dashboard araç listesi getirilirken hata oluştu.',
      details: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
});

/**
 * @swagger
 * /api/dashboard/personnel:
 *   get:
 *     summary: Dashboard personel listesi - Hierarchical authorization ile
 *     description: Tüm personellerin detaylı bilgilerini, mevcut iş alanı, pozisyon, proje bilgisi, çalışma istatistikleri ile getirir. Kullanıcının yetkisi dahilindeki veriler gösterilir.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Personel adı, soyadı veya TC kimlik numarasında arama
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: integer
 *         description: Şirket ID filtresi
 *       - in: query
 *         name: positionId
 *         schema:
 *           type: integer
 *         description: Pozisyon ID filtresi
 *       - in: query
 *         name: workAreaId
 *         schema:
 *           type: integer
 *         description: İş alanı ID filtresi
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: integer
 *         description: Proje ID filtresi
 *       - in: query
 *         name: activeOnly
 *         schema:
 *           type: boolean
 *         description: Sadece aktif personelleri göster (varsayılan true)
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, surname, startDate, assignmentCount, company, position, workArea]
 *         description: Sıralama kriteri
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sıralama yönü (varsayılan asc)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 500
 *         description: Sayfa başına kayıt sayısı (varsayılan 50)
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Başlangıç konumu (varsayılan 0)
 *     responses:
 *       200:
 *         description: Dashboard personel listesi başarıyla getirildi
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
 *                   example: "Dashboard personel listesi başarıyla getirildi"
 *                 data:
 *                   type: object
 *                   properties:
 *                     personnel:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           personnelId:
 *                             type: integer
 *                           tcNo:
 *                             type: string
 *                           name:
 *                             type: string
 *                           surname:
 *                             type: string
 *                           phoneNo:
 *                             type: string
 *                           birthdate:
 *                             type: string
 *                             format: date
 *                           status:
 *                             type: string
 *                           assignmentCount:
 *                             type: integer
 *                           firstAssignmentDate:
 *                             type: string
 *                             format: date
 *                           lastAssignmentDate:
 *                             type: string
 *                             format: date
 *                           activeAssignments:
 *                             type: integer
 *                           currentCompany:
 *                             type: object
 *                             nullable: true
 *                           currentWorkArea:
 *                             type: object
 *                             nullable: true
 *                           currentPosition:
 *                             type: object
 *                             nullable: true
 *                           currentProject:
 *                             type: object
 *                             nullable: true
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalPersonnel:
 *                           type: string
 *                         activePersonnel:
 *                           type: string
 *                         totalAssignments:
 *                           type: string
 *                         avgAssignmentsPerPersonnel:
 *                           type: number
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: string
 *                         offset:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         hasMore:
 *                           type: boolean
 *       401:
 *         description: Kimlik doğrulama hatası
 *       403:
 *         description: Yetki hatası
 *       500:
 *         description: Sunucu hatası
 */
router.get('/personnel', authenticateJWT, filterByWorkArea, async (req: AuthRequest, res) => {
  try {
    const {
      search,
      companyId,
      positionId,
      workAreaId,
      projectId,
      activeOnly = 'true',
      sortBy = 'name',
      sortOrder = 'asc',
      limit = '50',
      offset = '0'
    } = req.query as Record<string, string>;

    const limitNum = Math.min(parseInt(limit) || 50, 500);
    const offsetNum = parseInt(offset) || 0;
    const isDesc = sortOrder === 'desc';
    const activeFilter = activeOnly === 'true';

    // Base query with complex joins - using table aliases
    const baseQuery = db
      .select({
        // Personnel basic info
        personnelId: personnel.id,
        tcNo: personnel.tcNo,
        name: personnel.name,
        surname: personnel.surname,
        phoneNo: personnel.phoneNo,
        birthdate: personnel.birthdate,
        status: personnel.status,
        isActive: personnel.isActive,
        companyId: personnel.companyId,
        
        // Assignment count subquery
        assignmentCount: sql<number>`(
          SELECT COUNT(*)::integer 
          FROM personnel_work_areas pwa 
          WHERE pwa.personnel_id = personnel.id 
          AND pwa.is_active = true
        )`.as('assignmentCount'),
        
        // First assignment date subquery
        firstAssignmentDate: sql<string>`(
          SELECT MIN(pwa.start_date)::text 
          FROM personnel_work_areas pwa 
          WHERE pwa.personnel_id = personnel.id 
          AND pwa.is_active = true
        )`.as('firstAssignmentDate'),
        
        // Last assignment date subquery
        lastAssignmentDate: sql<string>`(
          SELECT MAX(pwa.start_date)::text 
          FROM personnel_work_areas pwa 
          WHERE pwa.personnel_id = personnel.id 
          AND pwa.is_active = true
        )`.as('lastAssignmentDate'),
        
        // Active assignments count subquery
        activeAssignments: sql<number>`(
          SELECT COUNT(*)::integer 
          FROM personnel_work_areas pwa 
          WHERE pwa.personnel_id = personnel.id 
          AND pwa.is_active = true 
          AND (pwa.end_date IS NULL OR pwa.end_date > CURRENT_DATE)
        )`.as('activeAssignments'),
        
        // Current assignment info (most recent active assignment)
        currentWorkAreaId: sql<number>`(
          SELECT pwa.work_area_id
          FROM personnel_work_areas pwa 
          WHERE pwa.personnel_id = personnel.id 
          AND pwa.is_active = true 
          AND (pwa.end_date IS NULL OR pwa.end_date > CURRENT_DATE)
          ORDER BY pwa.start_date DESC
          LIMIT 1
        )`.as('currentWorkAreaId'),
        
        currentWorkAreaName: sql<string>`(
          SELECT wa.name
          FROM personnel_work_areas pwa 
          JOIN work_areas wa ON wa.id = pwa.work_area_id
          WHERE pwa.personnel_id = personnel.id 
          AND pwa.is_active = true 
          AND (pwa.end_date IS NULL OR pwa.end_date > CURRENT_DATE)
          ORDER BY pwa.start_date DESC
          LIMIT 1
        )`.as('currentWorkAreaName'),
        
        currentWorkAreaAddress: sql<string>`(
          SELECT wa.address
          FROM personnel_work_areas pwa 
          JOIN work_areas wa ON wa.id = pwa.work_area_id
          WHERE pwa.personnel_id = personnel.id 
          AND pwa.is_active = true 
          AND (pwa.end_date IS NULL OR pwa.end_date > CURRENT_DATE)
          ORDER BY pwa.start_date DESC
          LIMIT 1
        )`.as('currentWorkAreaAddress'),
        
        currentPositionId: sql<number>`(
          SELECT pwa.position_id
          FROM personnel_work_areas pwa 
          WHERE pwa.personnel_id = personnel.id 
          AND pwa.is_active = true 
          AND (pwa.end_date IS NULL OR pwa.end_date > CURRENT_DATE)
          ORDER BY pwa.start_date DESC
          LIMIT 1
        )`.as('currentPositionId'),
        
        currentPositionName: sql<string>`(
          SELECT pp.name
          FROM personnel_work_areas pwa 
          JOIN personnel_positions pp ON pp.id = pwa.position_id
          WHERE pwa.personnel_id = personnel.id 
          AND pwa.is_active = true 
          AND (pwa.end_date IS NULL OR pwa.end_date > CURRENT_DATE)
          ORDER BY pwa.start_date DESC
          LIMIT 1
        )`.as('currentPositionName'),
        
        currentProjectId: sql<number>`(
          SELECT pwa.project_id
          FROM personnel_work_areas pwa 
          WHERE pwa.personnel_id = personnel.id 
          AND pwa.is_active = true 
          AND (pwa.end_date IS NULL OR pwa.end_date > CURRENT_DATE)
          ORDER BY pwa.start_date DESC
          LIMIT 1
        )`.as('currentProjectId'),
        
        currentProjectName: sql<string>`(
          SELECT pr.code
          FROM personnel_work_areas pwa 
          JOIN projects pr ON pr.id = pwa.project_id
          WHERE pwa.personnel_id = personnel.id 
          AND pwa.is_active = true 
          AND (pwa.end_date IS NULL OR pwa.end_date > CURRENT_DATE)
          ORDER BY pwa.start_date DESC
          LIMIT 1
        )`.as('currentProjectName'),
        
        currentProjectCode: sql<string>`(
          SELECT pr.code
          FROM personnel_work_areas pwa 
          JOIN projects pr ON pr.id = pwa.project_id
          WHERE pwa.personnel_id = personnel.id 
          AND pwa.is_active = true 
          AND (pwa.end_date IS NULL OR pwa.end_date > CURRENT_DATE)
          ORDER BY pwa.start_date DESC
          LIMIT 1
        )`.as('currentProjectCode'),
        
        // Company info - direct from personnel table
        companyName: sql<string>`(
          SELECT c.name
          FROM companies c
          WHERE c.id = personnel.company_id
        )`.as('companyName')
      })
      .from(personnel);

    // Build WHERE conditions
    const whereConditions = [];
    
    // Active filter
    if (activeFilter) {
      whereConditions.push(eq(personnel.isActive, true));
    }

    // Search filter
    if (search) {
      whereConditions.push(
        or(
          ilike(personnel.name, `%${search}%`),
          ilike(personnel.surname, `%${search}%`),
          ilike(sql`${personnel.tcNo}::text`, `%${search}%`)
        )
      );
    }

    // Company filter
    if (companyId) {
      whereConditions.push(eq(personnel.companyId, parseInt(companyId)));
    }

    // Position filter (via subquery)
    if (positionId) {
      whereConditions.push(
        sql`EXISTS (
          SELECT 1 FROM personnel_work_areas pwa 
          WHERE pwa.personnel_id = personnel.id 
          AND pwa.position_id = ${parseInt(positionId)}
          AND pwa.is_active = true
        )`
      );
    }

    // Work area filter (via subquery)
    if (workAreaId) {
      whereConditions.push(
        sql`EXISTS (
          SELECT 1 FROM personnel_work_areas pwa 
          WHERE pwa.personnel_id = personnel.id 
          AND pwa.work_area_id = ${parseInt(workAreaId)}
          AND pwa.is_active = true
        )`
      );
    }

    // Project filter (via subquery)
    if (projectId) {
      whereConditions.push(
        sql`EXISTS (
          SELECT 1 FROM personnel_work_areas pwa 
          WHERE pwa.personnel_id = personnel.id 
          AND pwa.project_id = ${parseInt(projectId)}
          AND pwa.is_active = true
        )`
      );
    }

    // Hierarchical authorization - work area filtering
    if (req.workAreaFilter && req.workAreaFilter.length > 0) {
      whereConditions.push(
        sql`EXISTS (
          SELECT 1 FROM personnel_work_areas pwa 
          JOIN work_areas wa ON wa.id = pwa.work_area_id
          WHERE pwa.personnel_id = personnel.id 
          AND wa.id = ANY(${sql.raw(`ARRAY[${req.workAreaFilter!.join(',')}]`)})
          AND pwa.is_active = true
        )`
      );
    }

    // Apply WHERE conditions
    let query = baseQuery;
    if (whereConditions.length > 0) {
      query = query.where(and(...whereConditions));
    }

    // Apply sorting
    let orderBy;
    switch (sortBy) {
      case 'surname':
        orderBy = isDesc ? desc(personnel.surname) : asc(personnel.surname);
        break;
      case 'startDate':
        orderBy = isDesc 
          ? desc(sql`(SELECT MIN(pwa.start_date) FROM personnel_work_areas pwa WHERE pwa.personnel_id = personnel.id AND pwa.is_active = true)`)
          : asc(sql`(SELECT MIN(pwa.start_date) FROM personnel_work_areas pwa WHERE pwa.personnel_id = personnel.id AND pwa.is_active = true)`);
        break;
      case 'assignmentCount':
        orderBy = isDesc 
          ? desc(sql`(SELECT COUNT(*) FROM personnel_work_areas pwa WHERE pwa.personnel_id = personnel.id AND pwa.is_active = true)`)
          : asc(sql`(SELECT COUNT(*) FROM personnel_work_areas pwa WHERE pwa.personnel_id = personnel.id AND pwa.is_active = true)`);
        break;
      case 'company':
        orderBy = isDesc 
          ? desc(sql`(SELECT c.name FROM companies c WHERE c.id = personnel.company_id)`)
          : asc(sql`(SELECT c.name FROM companies c WHERE c.id = personnel.company_id)`);
        break;
      case 'position':
        orderBy = isDesc 
          ? desc(sql`(SELECT pp.name FROM personnel_work_areas pwa JOIN personnel_positions pp ON pp.id = pwa.position_id WHERE pwa.personnel_id = personnel.id AND pwa.is_active = true AND (pwa.end_date IS NULL OR pwa.end_date > CURRENT_DATE) ORDER BY pwa.start_date DESC LIMIT 1)`)
          : asc(sql`(SELECT pp.name FROM personnel_work_areas pwa JOIN personnel_positions pp ON pp.id = pwa.position_id WHERE pwa.personnel_id = personnel.id AND pwa.is_active = true AND (pwa.end_date IS NULL OR pwa.end_date > CURRENT_DATE) ORDER BY pwa.start_date DESC LIMIT 1)`);
        break;
      case 'workArea':
        orderBy = isDesc 
          ? desc(sql`(SELECT wa.name FROM personnel_work_areas pwa JOIN work_areas wa ON wa.id = pwa.work_area_id WHERE pwa.personnel_id = personnel.id AND pwa.is_active = true AND (pwa.end_date IS NULL OR pwa.end_date > CURRENT_DATE) ORDER BY pwa.start_date DESC LIMIT 1)`)
          : asc(sql`(SELECT wa.name FROM personnel_work_areas pwa JOIN work_areas wa ON wa.id = pwa.work_area_id WHERE pwa.personnel_id = personnel.id AND pwa.is_active = true AND (pwa.end_date IS NULL OR pwa.end_date > CURRENT_DATE) ORDER BY pwa.start_date DESC LIMIT 1)`);
        break;
      case 'name':
      default:
        orderBy = isDesc ? desc(personnel.name) : asc(personnel.name);
        break;
    }

    // Execute main query with pagination
    const personnelData = await query
      .orderBy(orderBy)
      .limit(limitNum)
      .offset(offsetNum);

    // Count total for pagination
    let countQuery = db
      .select({ count: sql<number>`count(*)::int` })
      .from(personnel);
    
    if (whereConditions.length > 0) {
      countQuery = countQuery.where(and(...whereConditions));
    }
    
    const [{ count: total }] = await countQuery;

    // Summary statistics query
    const summaryQuery = db
      .select({
        totalPersonnel: sql<number>`COUNT(*)::int`.as('totalPersonnel'),
        activePersonnel: sql<number>`COUNT(CASE WHEN ${personnel.isActive} = true THEN 1 END)::int`.as('activePersonnel'),
        totalAssignments: sql<number>`(
          SELECT COUNT(*)::int 
          FROM personnel_work_areas pwa 
          WHERE pwa.is_active = true
        )`.as('totalAssignments'),
        totalActiveAssignments: sql<number>`(
          SELECT COUNT(*)::int 
          FROM personnel_work_areas pwa 
          WHERE pwa.is_active = true 
          AND (pwa.end_date IS NULL OR pwa.end_date > CURRENT_DATE)
        )`.as('totalActiveAssignments')
      })
      .from(personnel);

    // Apply same authorization filtering to summary
    const summaryWhereConditions = [];
    if (req.workAreaFilter && req.workAreaFilter.length > 0) {
      summaryWhereConditions.push(
        sql`EXISTS (
          SELECT 1 FROM personnel_work_areas pwa 
          JOIN work_areas wa ON wa.id = pwa.work_area_id
          WHERE pwa.personnel_id = personnel.id 
          AND wa.id = ANY(${sql.raw(`ARRAY[${req.workAreaFilter!.join(',')}]`)})
          AND pwa.is_active = true
        )`
      );
    }

    let finalSummaryQuery = summaryQuery;
    if (summaryWhereConditions.length > 0) {
      finalSummaryQuery = summaryQuery.where(and(...summaryWhereConditions));
    }

    const [summaryResult] = await finalSummaryQuery;

    // Format response data
    const formattedPersonnel = personnelData.map(person => ({
      personnelId: person.personnelId,
      tcNo: person.tcNo?.toString(),
      name: person.name,
      surname: person.surname,
      phoneNo: person.phoneNo,
      birthdate: person.birthdate,
      status: person.status,
      assignmentCount: person.assignmentCount || 0,
      firstAssignmentDate: person.firstAssignmentDate,
      lastAssignmentDate: person.lastAssignmentDate,
      activeAssignments: person.activeAssignments || 0,
      currentCompany: person.companyId ? {
        id: person.companyId,
        name: person.companyName
      } : null,
      currentWorkArea: person.currentWorkAreaId ? {
        id: person.currentWorkAreaId,
        name: person.currentWorkAreaName,
        address: person.currentWorkAreaAddress
      } : null,
      currentPosition: person.currentPositionId ? {
        id: person.currentPositionId,
        name: person.currentPositionName
      } : null,
      currentProject: person.currentProjectId ? {
        id: person.currentProjectId,
        code: person.currentProjectName, // projects.code is used as name
        name: person.currentProjectCode // projects.code is also code
      } : null
    }));

    const avgAssignmentsPerPersonnel = summaryResult.totalPersonnel > 0 
      ? Number((summaryResult.totalAssignments / summaryResult.totalPersonnel).toFixed(2))
      : 0;

    res.json({
      success: true,
      message: 'Dashboard personel listesi başarıyla getirildi',
      data: {
        personnel: formattedPersonnel,
        summary: {
          totalPersonnel: summaryResult.totalPersonnel || 0,
          activePersonnel: summaryResult.activePersonnel || 0,
          totalAssignments: summaryResult.totalAssignments || 0,
          totalActiveAssignments: summaryResult.totalActiveAssignments || 0,
          avgAssignmentsPerPersonnel
        },
        pagination: {
          total,
          offset: offsetNum,
          limit: limitNum,
          hasMore: offsetNum + limitNum < total
        }
      }
    });

  } catch (error) {
    console.error('Dashboard personel listesi hatası:', error);
    res.status(500).json({
      success: false,
      error: 'DASHBOARD_PERSONNEL_FETCH_ERROR',
      message: 'Dashboard personel listesi getirilirken hata oluştu.',
      details: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
});

export default router;