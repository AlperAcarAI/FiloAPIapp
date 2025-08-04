import express from 'express';
import bcrypt from 'bcryptjs';
import { db } from './db';
import { 
  users, personnel, assets, fuelRecords, workAreas, personnelWorkAreas, 
  assetsPersonelAssignment, carModels, carBrands, companies, personnelPositions,
  accessLevels, userAccessRights
} from '@shared/schema';
import { eq, and, inArray, or, like, desc, sql } from 'drizzle-orm';
// Authentication imports removed - no longer needed
import { Request, Response } from 'express';

const router = express.Router();

// ========================
// TÜM AUTHENTICATION KALDIRILDI
// ========================

// ========================
// PERSONNEL ENDPOINTS
// ========================

// Get personnel list (authentication removed)
router.get('/personnel', 
  async (req: Request, res) => {
    try {
      const { 
        page = 1, 
        limit = 20, 
        search, 
        workAreaId, 
        positionId, 
        isActive = 'true' 
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);
      const allowedWorkAreaIds = null; // No filtering

      // Build base query
      const baseQuery = db.select({
        id: personnel.id,
        name: personnel.name,
        surname: personnel.surname,
        tcNo: sql<string>`CAST(${personnel.tcNo} AS TEXT)`,
        phone: personnel.phoneNo,
        workArea: {
          id: workAreas.id,
          name: workAreas.name
        },
        position: {
          id: personnelPositions.id,
          name: personnelPositions.name
        },
        isActive: personnel.isActive
      })
      .from(personnel)
      .leftJoin(personnelWorkAreas, and(
        eq(personnel.id, personnelWorkAreas.personnelId),
        eq(personnelWorkAreas.isActive, true)
      ))
      .leftJoin(workAreas, eq(personnelWorkAreas.workAreaId, workAreas.id))
      .leftJoin(personnelPositions, eq(personnelWorkAreas.positionId, personnelPositions.id));

      // Filters
      const conditions = [];

      if (isActive === 'true') {
        conditions.push(eq(personnel.isActive, true));
      }

      if (search) {
        conditions.push(
          or(
            like(personnel.name, `%${search}%`),
            like(personnel.surname, `%${search}%`),
            like(personnel.tcNo, `%${search}%`)
          )
        );
      }

      if (workAreaId) {
        conditions.push(eq(workAreas.id, Number(workAreaId)));
      }

      if (positionId) {
        conditions.push(eq(personnelPositions.id, Number(positionId)));
      }

      // Hierarchical filtering
      if (allowedWorkAreaIds !== null) {
        conditions.push(inArray(workAreas.id, allowedWorkAreaIds));
      }

      // Build final query
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      const query = whereClause 
        ? baseQuery.where(whereClause).limit(Number(limit)).offset(offset)
        : baseQuery.limit(Number(limit)).offset(offset);

      // Execute query with pagination
      const personnelList = await query;

      // Get total count
      const baseCountQuery = db.select({ count: sql<number>`count(*)` })
        .from(personnel)
        .leftJoin(personnelWorkAreas, and(
          eq(personnel.id, personnelWorkAreas.personnelId),
          eq(personnelWorkAreas.isActive, true)
        ))
        .leftJoin(workAreas, eq(personnelWorkAreas.workAreaId, workAreas.id))
        .leftJoin(personnelPositions, eq(personnelWorkAreas.positionId, personnelPositions.id));

      const countQuery = whereClause 
        ? baseCountQuery.where(whereClause)
        : baseCountQuery;

      const [{ count: totalRecords }] = await countQuery;

      res.json({
        success: true,
        data: personnelList,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(totalRecords / Number(limit)),
          totalRecords,
          hasNext: offset + Number(limit) < totalRecords,
          hasPrev: Number(page) > 1
        }
      });

    } catch (error) {
      console.error('Get personnel error:', error);
      res.status(500).json({
        success: false,
        error: 'FETCH_ERROR',
        message: 'Personel listesi alınamadı'
      });
    }
  }
);

// Get personnel by ID (authentication removed)
router.get('/personnel/:id', 
  async (req: Request, res) => {
    try {
      const { id } = req.params;
      const allowedWorkAreaIds = null; // No filtering

      let query = db.select({
        id: personnel.id,
        name: personnel.name,
        surname: personnel.surname,
        tcNo: sql<string>`CAST(${personnel.tcNo} AS TEXT)`,
        phone: personnel.phoneNo,
        birthDate: personnel.birthdate,
        address: personnel.address,
        workArea: {
          id: workAreas.id,
          name: workAreas.name
        },
        position: {
          id: personnelPositions.id,
          name: personnelPositions.name
        },
        isActive: personnel.isActive
      })
      .from(personnel)
      .leftJoin(personnelWorkAreas, and(
        eq(personnel.id, personnelWorkAreas.personnelId),
        eq(personnelWorkAreas.isActive, true)
      ))
      .leftJoin(workAreas, eq(personnelWorkAreas.workAreaId, workAreas.id))
      .leftJoin(personnelPositions, eq(personnelWorkAreas.positionId, personnelPositions.id));

      // Hierarchical filtering
      const conditions = [eq(personnel.id, Number(id))];
      if (allowedWorkAreaIds !== null) {
        conditions.push(inArray(workAreas.id, allowedWorkAreaIds));
      }

      const [person] = await query.where(and(...conditions));

      if (!person) {
        return res.status(404).json({
          success: false,
          error: 'PERSONNEL_NOT_FOUND',
          message: 'Personel bulunamadı veya erişim yetkiniz yok'
        });
      }

      res.json({
        success: true,
        data: person
      });

    } catch (error) {
      console.error('Get personnel by ID error:', error);
      res.status(500).json({
        success: false,
        error: 'FETCH_ERROR',
        message: 'Personel bilgileri alınamadı'
      });
    }
  }
);

// ========================
// ASSETS ENDPOINTS  
// ========================

// Get assets list (authentication removed)
router.get('/assets',
  async (req: Request, res) => {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        assignedToMe = 'false',
        plateNumber,
        brandId,
        modelId
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);
      const allowedWorkAreaIds = null; // No filtering
      const personnelId = null; // No user context

      let query = db.select({
        id: assets.id,
        plateNumber: assets.plateNumber,
        brand: carBrands.name,
        model: carModels.name,
        modelYear: assets.modelYear,
        assignedPersonnel: sql`NULL::json`,
        workArea: sql`NULL::json`,
        isAssignedToMe: sql<boolean>`false`,
        isActive: assets.isActive
      })
      .from(assets)
      .leftJoin(carModels, eq(assets.modelId, carModels.id))
      .leftJoin(carBrands, eq(carModels.brandId, carBrands.id))
      // Araçlara şimdilik assignedPersonnel null olarak göster (table mevcut değil)
      // .leftJoin(assetsPersonelAssignment, and(
      //   eq(assets.id, assetsPersonelAssignment.assetId),
      //   eq(assetsPersonelAssignment.isActive, true)
      // ))
      // .leftJoin(personnel, eq(assetsPersonelAssignment.personnelId, personnel.id))
      // Personnel work areas join kaldırıldı (araç atama tablosu yok)
      // .leftJoin(personnelWorkAreas, and(
      //   eq(personnel.id, personnelWorkAreas.personnelId),
      //   eq(personnelWorkAreas.isActive, true)
      // ))
      // .leftJoin(workAreas, eq(personnelWorkAreas.workAreaId, workAreas.id));

      // Filters
      const conditions = [eq(assets.isActive, true)];

      if (search) {
        const searchCondition = or(
          like(assets.plateNumber, `%${search}%`),
          like(carBrands.name, `%${search}%`),
          like(carModels.name, `%${search}%`)
        );
        if (searchCondition) {
          conditions.push(searchCondition);
        }
      }

      // assignedToMe filtresini kaldır (table mevcut değil)
      // if (assignedToMe === 'true' && personnelId) {
      //   conditions.push(eq(assetsPersonelAssignment.personnelId, personnelId));
      // }

      if (plateNumber) {
        conditions.push(like(assets.plateNumber, `%${plateNumber}%`));
      }

      if (brandId) {
        conditions.push(eq(carBrands.id, Number(brandId)));
      }

      if (modelId) {
        conditions.push(eq(carModels.id, Number(modelId)));
      }

      // Hierarchical filtering - basitleştirildi (work area join kaldırıldı)
      // if (allowedWorkAreaIds !== null) {
      //   conditions.push(
      //     or(
      //       inArray(workAreas.id, allowedWorkAreaIds),
      //       eq(assetsPersonelAssignment.personnelId, personnelId || 0)
      //     )
      //   );
      // }

      const assetsList = await query.where(and(...conditions))
        .limit(Number(limit))
        .offset(offset);

      // Get total count - basitleştirildi
      let countQuery = db.select({ count: sql<number>`count(*)` })
        .from(assets)
        .leftJoin(carModels, eq(assets.modelId, carModels.id))
        .leftJoin(carBrands, eq(carModels.brandId, carBrands.id));

      const [{ count: totalRecords }] = await countQuery.where(and(...conditions));

      res.json({
        success: true,
        data: assetsList,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(totalRecords / Number(limit)),
          totalRecords,
          hasNext: offset + Number(limit) < totalRecords,
          hasPrev: Number(page) > 1
        },
        userContext: {
          myAssetsCount: assetsList.filter(a => a.isAssignedToMe).length,
          totalAccessibleAssets: totalRecords,
          filteredByWorkAreas: allowedWorkAreaIds
        }
      });

    } catch (error) {
      console.error('Get assets error:', error);
      res.status(500).json({
        success: false,
        error: 'FETCH_ERROR',
        message: 'Araç listesi alınamadı',
        debug: error instanceof Error ? error.message : 'Bilinmeyen hata'
      });
    }
  }
);

// ========================
// FUEL RECORDS ENDPOINTS
// ========================

// Get fuel records
router.get('/fuel-records',
  async (req: Request, res) => {
    try {
      const {
        page = 1,
        limit = 20,
        assetId,
        dateFrom,
        dateTo,
        driverId
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);
      const allowedWorkAreaIds = null; // No filtering
      const personnelId = null; // No user context

      let query = db.select({
        id: fuelRecords.id,
        asset: {
          id: assets.id,
          plateNumber: assets.plateNumber
        },
        recordDate: fuelRecords.recordDate,
        currentKilometers: fuelRecords.currentKilometers,
        fuelAmount: fuelRecords.fuelAmount,
        fuelCostCents: fuelRecords.fuelCostCents,
        gasStationName: fuelRecords.gasStationName,
        driver: {
          id: personnel.id,
          name: sql<string>`${personnel.name} || ' ' || ${personnel.surname}`
        },
        notes: fuelRecords.notes,
        receiptNumber: fuelRecords.receiptNumber,
        isMyRecord: sql<boolean>`CASE WHEN ${fuelRecords.driverId} = ${personnelId} THEN true ELSE false END`
      })
      .from(fuelRecords)
      .innerJoin(assets, eq(fuelRecords.assetId, assets.id))
      .leftJoin(personnel, eq(fuelRecords.driverId, personnel.id))
      // Personnel assignment join kaldırıldı (table mevcut değil)
      // .leftJoin(assetsPersonelAssignment, and(
      //   eq(assets.id, assetsPersonelAssignment.assetId),
      //   eq(assetsPersonelAssignment.isActive, true)
      // ))
      // .leftJoin(personnelWorkAreas, and(
      //   eq(assetsPersonelAssignment.personnelId, personnelWorkAreas.personnelId),
      //   eq(personnelWorkAreas.isActive, true)
      // ))
      // .leftJoin(workAreas, eq(personnelWorkAreas.workAreaId, workAreas.id));

      // Filters
      const conditions = [eq(fuelRecords.isActive, true)];

      if (assetId) {
        conditions.push(eq(fuelRecords.assetId, Number(assetId)));
      }

      if (dateFrom) {
        conditions.push(sql`${fuelRecords.recordDate} >= ${dateFrom}`);
      }

      if (dateTo) {
        conditions.push(sql`${fuelRecords.recordDate} <= ${dateTo}`);
      }

      if (driverId) {
        conditions.push(eq(fuelRecords.driverId, Number(driverId)));
      }

      // Hierarchical filtering - basitleştirildi (work area join kaldırıldı)
      // if (allowedWorkAreaIds !== null) {
      //   conditions.push(
      //     or(
      //       inArray(workAreas.id, allowedWorkAreaIds),
      //       eq(fuelRecords.driverId, personnelId || 0)
      //     )
      //   );
      // }

      const fuelRecordsList = await query.where(and(...conditions))
        .orderBy(desc(fuelRecords.recordDate))
        .limit(Number(limit))
        .offset(offset);

      // Get total count
      let countQuery = db.select({ count: sql<number>`count(*)` })
        .from(fuelRecords)
        .innerJoin(assets, eq(fuelRecords.assetId, assets.id))
        // Count query join'leri kaldırıldı
        // .leftJoin(assetsPersonelAssignment, and(
        //   eq(assets.id, assetsPersonelAssignment.assetId),
        //   eq(assetsPersonelAssignment.isActive, true)
        // ))
        // .leftJoin(personnelWorkAreas, and(
        //   eq(assetsPersonelAssignment.personnelId, personnelWorkAreas.personnelId),
        //   eq(personnelWorkAreas.isActive, true)
        // ))
        // .leftJoin(workAreas, eq(personnelWorkAreas.workAreaId, workAreas.id));

      const [{ count: totalRecords }] = await countQuery.where(and(...conditions));

      res.json({
        success: true,
        data: fuelRecordsList,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(totalRecords / Number(limit)),
          totalRecords,
          hasNext: offset + Number(limit) < totalRecords,
          hasPrev: Number(page) > 1
        },
        userContext: {
          myRecordsCount: fuelRecordsList.filter(r => r.isMyRecord).length,
          totalAccessibleRecords: totalRecords
        }
      });

    } catch (error) {
      console.error('Get fuel records error:', error);
      res.status(500).json({
        success: false,
        error: 'FETCH_ERROR',
        message: 'Yakıt kayıtları alınamadı',
        debug: error instanceof Error ? error.message : 'Bilinmeyen hata'
      });
    }
  }
);

// Create fuel record
router.post('/fuel-records',
  async (req: Request, res) => {
    try {
      const {
        assetId,
        recordDate,
        currentKilometers,
        fuelAmount,
        fuelCostCents,
        gasStationName,
        notes,
        receiptNumber
      } = req.body;

      const personnelId = 1; // Default personnel ID
      const allowedWorkAreaIds = null; // No filtering

      // Validate required fields
      if (!assetId || !recordDate || !currentKilometers || !fuelAmount || !fuelCostCents) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_FIELDS',
          message: 'Araç, tarih, kilometre, yakıt miktarı ve maliyet alanları gerekli'
        });
      }

      // Check if user can access this asset
      const [asset] = await db.select({
        id: assets.id,
        plateNumber: assets.plateNumber
      })
      .from(assets)
      .where(eq(assets.id, assetId));

      if (!asset) {
        return res.status(404).json({
          success: false,
          error: 'ASSET_NOT_FOUND',
          message: 'Araç bulunamadı'
        });
      }

      // Create fuel record
      const [newFuelRecord] = await db.insert(fuelRecords).values({
        assetId,
        recordDate,
        currentKilometers,
        fuelAmount,
        fuelCostCents,
        gasStationName,
        driverId: personnelId,
        notes,
        receiptNumber,
        createdBy: personnelId
      }).returning();

      res.status(201).json({
        success: true,
        data: newFuelRecord,
        message: 'Yakıt kaydı başarıyla oluşturuldu'
      });

    } catch (error) {
      console.error('Create fuel record error:', error);
      res.status(500).json({
        success: false,
        error: 'CREATE_ERROR',
        message: 'Yakıt kaydı oluşturulamadı'
      });
    }
  }
);

// ========================
// WORK AREAS ENDPOINTS
// ========================

// Get work areas (authentication removed)
router.get('/work-areas',
  async (req: Request, res) => {
    try {
      const allowedWorkAreaIds = null; // No filtering
      const currentWorkAreaId = null; // No user context

      // Simplified work areas query
      let baseQuery = db.select({
        id: workAreas.id,
        name: workAreas.name,
        address: workAreas.address,
        startDate: workAreas.startDate,
        endDate: workAreas.endDate,
        isActive: workAreas.isActive,
        managerId: workAreas.managerId,
        personnelCount: sql<number>`0`,
        assetsCount: sql<number>`0`,
        isCurrentWorkArea: sql<boolean>`false`
      })
      .from(workAreas)
      .where(eq(workAreas.isActive, true));

      // No hierarchical filtering needed since authentication is removed

      const workAreasList = await baseQuery;

      res.json({
        success: true,
        data: workAreasList
      });

    } catch (error) {
      console.error('Get work areas error:', error);
      res.status(500).json({
        success: false,
        error: 'FETCH_ERROR',
        message: 'Çalışma alanları alınamadı',
        debug: error instanceof Error ? error.message : 'Bilinmeyen hata'
      });
    }
  }
);

export default router;