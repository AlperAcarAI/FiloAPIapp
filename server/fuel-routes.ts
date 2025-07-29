import { Router } from 'express';
import { z } from "zod";
import { db } from "./db";
import { fuelRecords, assets, personnel, insertFuelRecordSchema, updateFuelRecordSchema, type InsertFuelRecord, type UpdateFuelRecord, type FuelRecord } from "@shared/schema";
import { eq, desc, asc, sql, like, ilike, and, gte, lte } from "drizzle-orm";
import { authenticateApiKey, authorizeEndpoint } from "./api-security.js";

const router = Router();

// GET /api/secure/fuel-records - Yakıt kayıtları listesi (filtreleme ile)
router.get('/fuel-records', authenticateApiKey, authorizeEndpoint(['data:read']), async (req, res) => {
    try {
      const {
        search,
        assetId,
        driverId,
        startDate,
        endDate,
        minKilometers,
        maxKilometers,
        gasStation,
        limit = "50",
        offset = "0",
        sortBy = "record_date",
        sortOrder = "desc",
        activeOnly = "true"
      } = req.query;

      const limitNum = Math.min(parseInt(limit as string) || 50, 100);
      const offsetNum = parseInt(offset as string) || 0;

      // Dinamik WHERE koşulları
      const conditions = [];
      
      if (activeOnly === "true") {
        conditions.push(eq(fuelRecords.isActive, true));
      }
      
      if (assetId) {
        conditions.push(eq(fuelRecords.assetId, parseInt(assetId as string)));
      }
      
      if (driverId) {
        conditions.push(eq(fuelRecords.driverId, parseInt(driverId as string)));
      }
      
      if (startDate) {
        conditions.push(gte(fuelRecords.recordDate, startDate as string));
      }
      
      if (endDate) {
        conditions.push(lte(fuelRecords.recordDate, endDate as string));
      }
      
      if (minKilometers) {
        conditions.push(gte(fuelRecords.currentKilometers, parseInt(minKilometers as string)));
      }
      
      if (maxKilometers) {
        conditions.push(lte(fuelRecords.currentKilometers, parseInt(maxKilometers as string)));
      }
      
      if (gasStation) {
        conditions.push(ilike(fuelRecords.gasStationName, `%${gasStation}%`));
      }
      
      if (search) {
        conditions.push(
          sql`(${fuelRecords.notes} ILIKE ${'%' + search + '%'} OR 
               ${fuelRecords.receiptNumber} ILIKE ${'%' + search + '%'} OR
               ${fuelRecords.gasStationName} ILIKE ${'%' + search + '%'})`
        );
      }

      // Sıralama
      const orderBy = sortOrder === "asc" ? asc : desc;
      const sortColumn = sortBy === "record_date" ? fuelRecords.recordDate :
                        sortBy === "current_kilometers" ? fuelRecords.currentKilometers :
                        sortBy === "fuel_amount" ? fuelRecords.fuelAmount :
                        sortBy === "fuel_cost_cents" ? fuelRecords.fuelCostCents :
                        fuelRecords.recordDate;

      // Veri sorgulama (JOIN ile)
      const records = await db
        .select({
          id: fuelRecords.id,
          assetId: fuelRecords.assetId,
          plateNumber: assets.plateNumber,
          recordDate: fuelRecords.recordDate,
          currentKilometers: fuelRecords.currentKilometers,
          fuelAmount: fuelRecords.fuelAmount,
          fuelCostCents: fuelRecords.fuelCostCents,
          gasStationName: fuelRecords.gasStationName,
          driverId: fuelRecords.driverId,
          driverName: sql<string>`COALESCE(${personnel.firstName} || ' ' || ${personnel.lastName}, 'Bilinmiyor')`.as('driver_name'),
          notes: fuelRecords.notes,
          receiptNumber: fuelRecords.receiptNumber,
          isActive: fuelRecords.isActive,
          createdAt: fuelRecords.createdAt
        })
        .from(fuelRecords)
        .leftJoin(assets, eq(fuelRecords.assetId, assets.id))
        .leftJoin(personnel, eq(fuelRecords.driverId, personnel.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(orderBy(sortColumn))
        .limit(limitNum)
        .offset(offsetNum);

      // Toplam sayı
      const totalCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(fuelRecords)
        .leftJoin(assets, eq(fuelRecords.assetId, assets.id))
        .leftJoin(personnel, eq(fuelRecords.driverId, personnel.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      const totalCount = totalCountResult[0]?.count || 0;

      res.json({
        success: true,
        message: "Yakıt kayıtları başarıyla getirildi",
        data: records,
        count: records.length,
        totalCount,
        pagination: {
          limit: limitNum,
          offset: offsetNum,
          hasMore: offsetNum + records.length < totalCount
        },
        filters: {
          search,
          assetId,
          driverId,
          startDate,
          endDate,
          minKilometers,
          maxKilometers,
          gasStation,
          sortBy,
          sortOrder,
          activeOnly
        }
      });

    } catch (error) {
      console.error("Yakıt kayıtları getirme hatası:", error);
      res.status(500).json({
        success: false,
        error: "FETCH_ERROR",
        message: "Yakıt kayıtları getirilemedi"
      });
    }
  });

// GET /api/secure/fuel-records/:id - Yakıt kaydı detayı
router.get('/fuel-records/:id', authenticateApiKey, authorizeEndpoint(['data:read']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: "INVALID_ID",
          message: "Geçersiz yakıt kaydı ID'si"
        });
      }

      const record = await db
        .select({
          id: fuelRecords.id,
          assetId: fuelRecords.assetId,
          plateNumber: assets.plateNumber,
          modelYear: assets.modelYear,
          recordDate: fuelRecords.recordDate,
          currentKilometers: fuelRecords.currentKilometers,
          fuelAmount: fuelRecords.fuelAmount,
          fuelCostCents: fuelRecords.fuelCostCents,
          gasStationName: fuelRecords.gasStationName,
          driverId: fuelRecords.driverId,
          driverName: sql<string>`COALESCE(${personnel.firstName} || ' ' || ${personnel.lastName}, 'Bilinmiyor')`.as('driver_name'),
          notes: fuelRecords.notes,
          receiptNumber: fuelRecords.receiptNumber,
          isActive: fuelRecords.isActive,
          createdAt: fuelRecords.createdAt,
          updatedAt: fuelRecords.updatedAt
        })
        .from(fuelRecords)
        .leftJoin(assets, eq(fuelRecords.assetId, assets.id))
        .leftJoin(personnel, eq(fuelRecords.driverId, personnel.id))
        .where(eq(fuelRecords.id, id));

      if (record.length === 0) {
        return res.status(404).json({
          success: false,
          error: "RECORD_NOT_FOUND",
          message: "Yakıt kaydı bulunamadı"
        });
      }

      res.json({
        success: true,
        message: "Yakıt kaydı detayı başarıyla getirildi",
        data: record[0]
      });

    } catch (error) {
      console.error("Yakıt kaydı detay hatası:", error);
      res.status(500).json({
        success: false,
        error: "FETCH_ERROR",
        message: "Yakıt kaydı detayı getirilemedi"
      });
    }
  });

// POST /api/secure/fuel-records - Yeni yakıt kaydı oluştur
router.post('/fuel-records', authenticateApiKey, authorizeEndpoint(['data:write']), async (req, res) => {
    try {
      // Zod validation
      const validatedData = insertFuelRecordSchema.parse(req.body);

      // Asset varlığını kontrol et
      const asset = await db.select().from(assets).where(eq(assets.id, validatedData.assetId));
      if (asset.length === 0) {
        return res.status(400).json({
          success: false,
          error: "ASSET_NOT_FOUND",
          message: "Belirtilen araç bulunamadı"
        });
      }

      // Driver varlığını kontrol et (eğer belirtilmişse)
      if (validatedData.driverId) {
        const driver = await db.select().from(personnel).where(eq(personnel.id, validatedData.driverId));
        if (driver.length === 0) {
          return res.status(400).json({
            success: false,
            error: "DRIVER_NOT_FOUND",
            message: "Belirtilen sürücü bulunamadı"
          });
        }
      }

      // Yeni kayıt oluştur
      const newRecord = await db
        .insert(fuelRecords)
        .values({
          ...validatedData,
          createdBy: 1, // TODO: gerçek user ID'si
          updatedBy: 1
        })
        .returning();

      res.status(201).json({
        success: true,
        message: "Yakıt kaydı başarıyla oluşturuldu",
        data: newRecord[0]
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: "VALIDATION_ERROR",
          message: "Geçersiz veri formatı",
          details: error.errors
        });
      }

      console.error("Yakıt kaydı oluşturma hatası:", error);
      res.status(500).json({
        success: false,
        error: "CREATE_ERROR",
        message: "Yakıt kaydı oluşturulamadı"
      });
    }
  });

// PUT /api/secure/fuel-records/:id - Yakıt kaydını güncelle
router.put('/fuel-records/:id', authenticateApiKey, authorizeEndpoint(['data:write']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: "INVALID_ID",
          message: "Geçersiz yakıt kaydı ID'si"
        });
      }

      // Zod validation
      const validatedData = updateFuelRecordSchema.parse(req.body);

      // Kayıt varlığını kontrol et
      const existingRecord = await db.select().from(fuelRecords).where(eq(fuelRecords.id, id));
      if (existingRecord.length === 0) {
        return res.status(404).json({
          success: false,
          error: "RECORD_NOT_FOUND",
          message: "Yakıt kaydı bulunamadı"
        });
      }

      // Asset varlığını kontrol et (eğer değiştiriliyorsa)
      if (validatedData.assetId && validatedData.assetId !== existingRecord[0].assetId) {
        const asset = await db.select().from(assets).where(eq(assets.id, validatedData.assetId));
        if (asset.length === 0) {
          return res.status(400).json({
            success: false,
            error: "ASSET_NOT_FOUND",
            message: "Belirtilen araç bulunamadı"
          });
        }
      }

      // Driver varlığını kontrol et (eğer değiştiriliyorsa)
      if (validatedData.driverId && validatedData.driverId !== existingRecord[0].driverId) {
        const driver = await db.select().from(personnel).where(eq(personnel.id, validatedData.driverId));
        if (driver.length === 0) {
          return res.status(400).json({
            success: false,
            error: "DRIVER_NOT_FOUND",
            message: "Belirtilen sürücü bulunamadı"
          });
        }
      }

      // Kaydı güncelle
      const updatedRecord = await db
        .update(fuelRecords)
        .set({
          ...validatedData,
          updatedBy: 1, // TODO: gerçek user ID'si
          updatedAt: new Date()
        })
        .where(eq(fuelRecords.id, id))
        .returning();

      res.json({
        success: true,
        message: "Yakıt kaydı başarıyla güncellendi",
        data: updatedRecord[0]
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: "VALIDATION_ERROR",
          message: "Geçersiz veri formatı",
          details: error.errors
        });
      }

      console.error("Yakıt kaydı güncelleme hatası:", error);
      res.status(500).json({
        success: false,
        error: "UPDATE_ERROR",
        message: "Yakıt kaydı güncellenemedi"
      });
    }
  });

// DELETE /api/secure/fuel-records/:id - Yakıt kaydını sil (soft delete)
router.delete('/fuel-records/:id', authenticateApiKey, authorizeEndpoint(['data:delete']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: "INVALID_ID",
          message: "Geçersiz yakıt kaydı ID'si"
        });
      }

      // Kayıt varlığını kontrol et
      const existingRecord = await db.select().from(fuelRecords).where(eq(fuelRecords.id, id));
      if (existingRecord.length === 0) {
        return res.status(404).json({
          success: false,
          error: "RECORD_NOT_FOUND",
          message: "Yakıt kaydı bulunamadı"
        });
      }

      // Soft delete
      const deletedRecord = await db
        .update(fuelRecords)
        .set({
          isActive: false,
          updatedBy: 1, // TODO: gerçek user ID'si
          updatedAt: new Date()
        })
        .where(eq(fuelRecords.id, id))
        .returning();

      res.json({
        success: true,
        message: "Yakıt kaydı başarıyla silindi",
        data: deletedRecord[0]
      });

    } catch (error) {
      console.error("Yakıt kaydı silme hatası:", error);
      res.status(500).json({
        success: false,
        error: "DELETE_ERROR",
        message: "Yakıt kaydı silinemedi"
      });
    }
  });

export default router;