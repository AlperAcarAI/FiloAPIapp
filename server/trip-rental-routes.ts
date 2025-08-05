import { Router } from "express";
import { db } from "./db";
import { tripRentals, assets, companies, personnel } from "@shared/schema";
import { insertTripRentalSchema, updateTripRentalSchema } from "@shared/schema";
import { eq, and, or, like, desc, asc, sql, between, gte, lte } from "drizzle-orm";
import { authenticateToken, type AuthRequest } from "./auth";
import { hasPermission } from "./permission-management-routes";
import { captureAuditInfo, auditableInsert, auditableUpdate, auditableDelete } from "./audit-middleware";
import { z } from "zod";

const tripRentalRoutes = Router();

export default tripRentalRoutes;

// Tüm sefer kiralamalarını listele (filtreleme destekli)
tripRentalRoutes.get("/", authenticateToken, hasPermission(["fleet:read"]), async (req, res) => {
  try {
    const { 
      assetId,
      companyId,
      driverId,
      startDate,
      endDate,
      tripStatus,
      search,
      sortBy = "tripDate",
      sortOrder = "desc",
      limit = "20",
      offset = "0"
    } = req.query;

    const conditions = [];
    
    if (assetId) {
      conditions.push(eq(tripRentals.assetId, parseInt(assetId as string)));
    }
    
    if (companyId) {
      conditions.push(eq(tripRentals.rentalCompanyId, parseInt(companyId as string)));
    }
    
    if (driverId) {
      conditions.push(eq(tripRentals.driverId, parseInt(driverId as string)));
    }
    
    if (tripStatus) {
      conditions.push(eq(tripRentals.tripStatus, tripStatus as string));
    }
    
    if (startDate && endDate) {
      conditions.push(between(tripRentals.tripDate, startDate as string, endDate as string));
    } else if (startDate) {
      conditions.push(gte(tripRentals.tripDate, startDate as string));
    } else if (endDate) {
      conditions.push(lte(tripRentals.tripDate, endDate as string));
    }
    
    if (search) {
      conditions.push(
        or(
          like(tripRentals.fromLocation, `%${search}%`),
          like(tripRentals.toLocation, `%${search}%`),
          like(tripRentals.routeDescription, `%${search}%`),
          like(tripRentals.notes, `%${search}%`)
        )
      );
    }

    const orderByColumn = sortBy === "tripDate" ? tripRentals.tripDate :
                         sortBy === "totalAmount" ? tripRentals.totalAmountCents :
                         sortBy === "distance" ? tripRentals.distanceKm :
                         tripRentals.tripDate;
    
    const orderDirection = sortOrder === "asc" ? asc : desc;

    const [tripList, totalCount] = await Promise.all([
      db.select({
        id: tripRentals.id,
        assetId: tripRentals.assetId,
        plateNumber: assets.plateNumber,
        rentalCompanyId: tripRentals.rentalCompanyId,
        companyName: companies.name,
        driverId: tripRentals.driverId,
        driverName: sql`${personnel.name} || ' ' || ${personnel.surname}`.as('driverName'),
        tripDate: tripRentals.tripDate,
        tripStartTime: tripRentals.tripStartTime,
        tripEndTime: tripRentals.tripEndTime,
        fromLocation: tripRentals.fromLocation,
        toLocation: tripRentals.toLocation,
        routeDescription: tripRentals.routeDescription,
        distanceKm: tripRentals.distanceKm,
        pricePerTripCents: tripRentals.pricePerTripCents,
        additionalCostsCents: tripRentals.additionalCostsCents,
        totalAmountCents: tripRentals.totalAmountCents,
        tripStatus: tripRentals.tripStatus,
        notes: tripRentals.notes,
        createdAt: tripRentals.createdAt
      })
      .from(tripRentals)
      .leftJoin(assets, eq(tripRentals.assetId, assets.id))
      .leftJoin(companies, eq(tripRentals.rentalCompanyId, companies.id))
      .leftJoin(personnel, eq(tripRentals.driverId, personnel.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(orderDirection(orderByColumn))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string)),
      
      db.select({ count: sql`count(*)::int` })
        .from(tripRentals)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
    ]);

    res.json({
      success: true,
      data: tripList,
      totalCount: totalCount[0]?.count || 0,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: tripList.length === parseInt(limit as string)
      }
    });
  } catch (error) {
    console.error("Sefer listesi hatası:", error);
    res.status(500).json({ 
      success: false, 
      error: "Seferler listelenirken hata oluştu" 
    });
  }
});

// Belirli bir seferi getir
tripRentalRoutes.get("/:id", authenticateToken, hasPermission(["fleet:read"]), async (req, res) => {
  try {
    const { id } = req.params;
    
    const [trip] = await db.select({
      id: tripRentals.id,
      assetId: tripRentals.assetId,
      plateNumber: assets.plateNumber,
      rentalCompanyId: tripRentals.rentalCompanyId,
      companyName: companies.name,
      driverId: tripRentals.driverId,
      driverName: sql`${personnel.name} || ' ' || ${personnel.surname}`.as('driverName'),
      tripDate: tripRentals.tripDate,
      tripStartTime: tripRentals.tripStartTime,
      tripEndTime: tripRentals.tripEndTime,
      fromLocation: tripRentals.fromLocation,
      toLocation: tripRentals.toLocation,
      routeDescription: tripRentals.routeDescription,
      distanceKm: tripRentals.distanceKm,
      pricePerTripCents: tripRentals.pricePerTripCents,
      additionalCostsCents: tripRentals.additionalCostsCents,
      totalAmountCents: tripRentals.totalAmountCents,
      tripStatus: tripRentals.tripStatus,
      notes: tripRentals.notes,
      createdAt: tripRentals.createdAt,
      updatedAt: tripRentals.updatedAt
    })
    .from(tripRentals)
    .leftJoin(assets, eq(tripRentals.assetId, assets.id))
    .leftJoin(companies, eq(tripRentals.rentalCompanyId, companies.id))
    .leftJoin(personnel, eq(tripRentals.driverId, personnel.id))
    .where(eq(tripRentals.id, parseInt(id)));

    if (!trip) {
      return res.status(404).json({ 
        success: false, 
        error: "Sefer bulunamadı" 
      });
    }

    res.json({ success: true, data: trip });
  } catch (error) {
    console.error("Sefer getirme hatası:", error);
    res.status(500).json({ 
      success: false, 
      error: "Sefer getirilirken hata oluştu" 
    });
  }
});

// Yeni sefer ekle
tripRentalRoutes.post("/", authenticateToken, hasPermission(["fleet:write"]), async (req, res) => {
  try {
    const validatedData = insertTripRentalSchema.parse(req.body);
    const auditInfo = captureAuditInfo(req);
    
    // Araç müsaitlik kontrolü (aynı gün, aynı saatte başka sefer var mı?)
    if (validatedData.tripStartTime) {
      const [conflictingTrip] = await db.select({ id: tripRentals.id })
        .from(tripRentals)
        .where(
          and(
            eq(tripRentals.assetId, validatedData.assetId),
            eq(tripRentals.tripDate, validatedData.tripDate),
            eq(tripRentals.tripStatus, 'planned'),
            // Saat çakışması kontrolü basitleştirildi
            or(
              eq(tripRentals.tripStartTime, validatedData.tripStartTime),
              and(
                lte(tripRentals.tripStartTime, validatedData.tripStartTime),
                gte(tripRentals.tripEndTime, validatedData.tripStartTime)
              )
            )
          )
        );
      
      if (conflictingTrip) {
        return res.status(400).json({ 
          success: false, 
          error: "Bu araç belirtilen saatte başka bir sefer için planlanmış" 
        });
      }
    }
    
    const [newTrip] = await auditableInsert(
      db,
      tripRentals,
      {
        ...validatedData,
        createdBy: (req as AuthRequest).user?.id || 1
      },
      auditInfo
    );

    res.status(201).json({ 
      success: true, 
      data: newTrip,
      message: "Sefer başarıyla eklendi"
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        error: "Geçersiz veri", 
        details: error.errors 
      });
    }
    console.error("Sefer ekleme hatası:", error);
    res.status(500).json({ 
      success: false, 
      error: "Sefer eklenirken hata oluştu" 
    });
  }
});

// Sefer güncelle
tripRentalRoutes.put("/:id", authenticateToken, hasPermission(["fleet:write"]), async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateTripRentalSchema.parse(req.body);
    const auditInfo = captureAuditInfo(req);
    
    const [existingTrip] = await db.select()
      .from(tripRentals)
      .where(eq(tripRentals.id, parseInt(id)));
    
    if (!existingTrip) {
      return res.status(404).json({ 
        success: false, 
        error: "Sefer bulunamadı" 
      });
    }
    
    const [updatedTrip] = await auditableUpdate(
      db,
      tripRentals,
      {
        ...validatedData,
        updatedBy: (req as AuthRequest).user?.id || 1
      },
      eq(tripRentals.id, parseInt(id)),
      existingTrip,
      auditInfo
    );

    res.json({ 
      success: true, 
      data: updatedTrip,
      message: "Sefer başarıyla güncellendi"
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        error: "Geçersiz veri", 
        details: error.errors 
      });
    }
    console.error("Sefer güncelleme hatası:", error);
    res.status(500).json({ 
      success: false, 
      error: "Sefer güncellenirken hata oluştu" 
    });
  }
});

// Sefer iptal et
tripRentalRoutes.delete("/:id", authenticateToken, hasPermission(["fleet:delete"]), async (req, res) => {
  try {
    const { id } = req.params;
    const auditInfo = captureAuditInfo(req);
    
    const [existingTrip] = await db.select()
      .from(tripRentals)
      .where(eq(tripRentals.id, parseInt(id)));
    
    if (!existingTrip) {
      return res.status(404).json({ 
        success: false, 
        error: "Sefer bulunamadı" 
      });
    }
    
    // Sadece planned veya ongoing statüsündeki seferler iptal edilebilir
    if (existingTrip.tripStatus === 'completed') {
      return res.status(400).json({ 
        success: false, 
        error: "Tamamlanmış seferler iptal edilemez" 
      });
    }
    
    await auditableUpdate(
      db,
      tripRentals,
      { 
        tripStatus: 'cancelled',
        updatedBy: (req as AuthRequest).user?.id || 1
      },
      eq(tripRentals.id, parseInt(id)),
      existingTrip,
      auditInfo
    );

    res.json({ 
      success: true, 
      message: "Sefer başarıyla iptal edildi" 
    });
  } catch (error) {
    console.error("Sefer iptal hatası:", error);
    res.status(500).json({ 
      success: false, 
      error: "Sefer iptal edilirken hata oluştu" 
    });
  }
});

// Günlük sefer özeti
tripRentalRoutes.get("/summary/daily", authenticateToken, hasPermission(["fleet:read"]), async (req, res) => {
  try {
    const { date = new Date().toISOString().split('T')[0] } = req.query;
    
    const summary = await db.select({
      totalTrips: sql`count(*)::int`.as('totalTrips'),
      completedTrips: sql`count(case when trip_status = 'completed' then 1 end)::int`.as('completedTrips'),
      ongoingTrips: sql`count(case when trip_status = 'ongoing' then 1 end)::int`.as('ongoingTrips'),
      plannedTrips: sql`count(case when trip_status = 'planned' then 1 end)::int`.as('plannedTrips'),
      cancelledTrips: sql`count(case when trip_status = 'cancelled' then 1 end)::int`.as('cancelledTrips'),
      totalRevenue: sql`sum(total_amount_cents)::int`.as('totalRevenue'),
      totalDistance: sql`sum(distance_km)::numeric`.as('totalDistance'),
      uniqueAssets: sql`count(distinct asset_id)::int`.as('uniqueAssets'),
      uniqueCompanies: sql`count(distinct rental_company_id)::int`.as('uniqueCompanies')
    })
    .from(tripRentals)
    .where(eq(tripRentals.tripDate, date as string));

    // Araç bazlı özet
    const assetSummary = await db.select({
      assetId: tripRentals.assetId,
      plateNumber: assets.plateNumber,
      tripCount: sql`count(*)::int`.as('tripCount'),
      totalRevenue: sql`sum(total_amount_cents)::int`.as('totalRevenue'),
      totalDistance: sql`sum(distance_km)::numeric`.as('totalDistance')
    })
    .from(tripRentals)
    .leftJoin(assets, eq(tripRentals.assetId, assets.id))
    .where(eq(tripRentals.tripDate, date as string))
    .groupBy(tripRentals.assetId, assets.plateNumber)
    .orderBy(desc(sql`sum(total_amount_cents)`));

    res.json({ 
      success: true, 
      data: {
        date,
        summary: summary[0],
        assetBreakdown: assetSummary
      }
    });
  } catch (error) {
    console.error("Günlük özet hatası:", error);
    res.status(500).json({ 
      success: false, 
      error: "Günlük özet alınırken hata oluştu" 
    });
  }
});