import { Router } from 'express';
import { z } from "zod";
import { db } from "./db";
import { fuelRecords, insertFuelRecordSchema, updateFuelRecordSchema, type InsertFuelRecord, type UpdateFuelRecord, type FuelRecord } from "@shared/schema";
import { eq, desc, asc, sql, ilike, and, gte, lte } from "drizzle-orm";
import { authenticateApiKey, authorizeEndpoint } from "./api-security.js";

const router = Router();

// GET /api/secure/fuel-records - Yakıt kayıtları listesi (basit versiyon)
router.get('/fuel-records', authenticateApiKey, authorizeEndpoint(['data:read']), async (req, res) => {
  try {
    const {
      search,
      assetId,
      startDate,
      endDate,
      gasStation,
      limit = "10",
      offset = "0",
      sortBy = "record_date",
      sortOrder = "desc"
    } = req.query;

    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);

    // Filtreleme conditions
    const conditions = [eq(fuelRecords.isActive, true)];
    
    if (assetId) {
      conditions.push(eq(fuelRecords.assetId, parseInt(assetId as string)));
    }
    
    if (startDate) {
      conditions.push(gte(fuelRecords.recordDate, startDate as string));
    }
    
    if (endDate) {
      conditions.push(lte(fuelRecords.recordDate, endDate as string));
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

    // Basit veri sorgulama
    const records = await db
      .select()
      .from(fuelRecords)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(orderBy(sortColumn))
      .limit(limitNum)
      .offset(offsetNum);

    // Toplam sayı
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(fuelRecords)
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
        assetId: assetId ? parseInt(assetId as string) : undefined,
        startDate,
        endDate,
        gasStation,
        sortBy,
        sortOrder
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
      .select()
      .from(fuelRecords)
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

    const newRecord = await db
      .insert(fuelRecords)
      .values({
        ...validatedData,
        createdBy: 1, // TODO: get from user session
        updatedBy: 1,
      })
      .returning();

    res.json({
      success: true,
      message: "Yakıt kaydı başarıyla oluşturuldu",
      data: newRecord[0]
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "VALIDATION_ERROR",
        message: "Veri doğrulama hatası",
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

    // Zod validation for update
    const validatedData = updateFuelRecordSchema.parse(req.body);

    const updatedRecord = await db
      .update(fuelRecords)
      .set({
        ...validatedData,
        updatedBy: 1, // TODO: get from user session
        updatedAt: new Date()
      })
      .where(eq(fuelRecords.id, id))
      .returning();

    if (updatedRecord.length === 0) {
      return res.status(404).json({
        success: false,
        error: "RECORD_NOT_FOUND",
        message: "Güncellenecek yakıt kaydı bulunamadı"
      });
    }

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
        message: "Veri doğrulama hatası",
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

    const deletedRecord = await db
      .update(fuelRecords)
      .set({
        isActive: false,
        updatedBy: 1, // TODO: get from user session
        updatedAt: new Date()
      })
      .where(eq(fuelRecords.id, id))
      .returning();

    if (deletedRecord.length === 0) {
      return res.status(404).json({
        success: false,
        error: "RECORD_NOT_FOUND",
        message: "Silinecek yakıt kaydı bulunamadı"
      });
    }

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