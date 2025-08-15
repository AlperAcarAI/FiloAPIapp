import { Router } from "express";
import { db } from "./db";
import { rentalAssets, rentalAgreements, assets, companies } from "@shared/schema";
import { insertRentalAssetSchema, updateRentalAssetSchema } from "@shared/schema";
import { eq, and, or, like, desc, asc, sql, between, gte, lte } from "drizzle-orm";
import { authenticateToken, type AuthRequest } from "./auth";
import { captureAuditInfo, auditableInsert, auditableUpdate, auditableDelete } from "./audit-middleware";
import { z } from "zod";

const rentalAssetsRoutes = Router();

export default rentalAssetsRoutes;

// Tüm kiralama araçlarını listele (filtreleme destekli)
rentalAssetsRoutes.get("/", authenticateToken, async (req, res) => {
  try {
    const { 
      agreementId,
      assetId,
      minMountCents,
      maxMountCents,
      minVatPercent,
      maxVatPercent,
      minKmMonthLimit,
      maxKmMonthLimit,
      search,
      sortBy = "id",
      sortOrder = "desc",
      limit = "20",
      offset = "0"
    } = req.query;

    const conditions = [];
    
    if (agreementId) {
      conditions.push(eq(rentalAssets.agreementId, parseInt(agreementId as string)));
    }
    
    if (assetId) {
      conditions.push(eq(rentalAssets.assetId, parseInt(assetId as string)));
    }
    
    if (minMountCents) {
      conditions.push(gte(rentalAssets.mountCents, parseInt(minMountCents as string)));
    }
    
    if (maxMountCents) {
      conditions.push(lte(rentalAssets.mountCents, parseInt(maxMountCents as string)));
    }
    
    if (minVatPercent) {
      conditions.push(gte(rentalAssets.vatPercent, minVatPercent as string));
    }
    
    if (maxVatPercent) {
      conditions.push(lte(rentalAssets.vatPercent, maxVatPercent as string));
    }
    
    if (minKmMonthLimit) {
      conditions.push(gte(rentalAssets.kmMonthLimit, parseInt(minKmMonthLimit as string)));
    }
    
    if (maxKmMonthLimit) {
      conditions.push(lte(rentalAssets.kmMonthLimit, parseInt(maxKmMonthLimit as string)));
    }
    
    if (search) {
      conditions.push(
        or(
          like(assets.plateNumber, `%${search}%`),
          like(rentalAgreements.agreementNumber, `%${search}%`)
        )
      );
    }

    const orderByColumn = sortBy === "mountCents" ? rentalAssets.mountCents :
                         sortBy === "vatPercent" ? rentalAssets.vatPercent :
                         sortBy === "kmMonthLimit" ? rentalAssets.kmMonthLimit :
                         sortBy === "kmTotalLimit" ? rentalAssets.kmTotalLimit :
                         rentalAssets.id;
    
    const orderDirection = sortOrder === "asc" ? asc : desc;

    const [assetsList, totalCount] = await Promise.all([
      db.select({
        id: rentalAssets.id,
        agreementId: rentalAssets.agreementId,
        agreementNumber: rentalAgreements.agreementNumber,
        assetId: rentalAssets.assetId,
        plateNumber: assets.plateNumber,
        mountCents: rentalAssets.mountCents,
        vatPercent: rentalAssets.vatPercent,
        kmMonthLimit: rentalAssets.kmMonthLimit,
        kmTotalLimit: rentalAssets.kmTotalLimit,
        // Sözleşme şirket bilgileri
        rentalCompanyId: rentalAgreements.rentalCompanyId,
        rentalCompanyName: sql`rental_company.name`.as('rentalCompanyName'),
        tenantCompanyId: rentalAgreements.tenantCompanyId,
        tenantCompanyName: sql`tenant_company.name`.as('tenantCompanyName'),
        // Sözleşme durumu
        agreementIsActive: rentalAgreements.isActive,
        agreementStartDate: rentalAgreements.startDate,
        agreementEndDate: rentalAgreements.endDate
      })
      .from(rentalAssets)
      .leftJoin(rentalAgreements, eq(rentalAssets.agreementId, rentalAgreements.id))
      .leftJoin(assets, eq(rentalAssets.assetId, assets.id))
      .leftJoin(sql`companies AS rental_company`, eq(rentalAgreements.rentalCompanyId, sql`rental_company.id`))
      .leftJoin(sql`companies AS tenant_company`, eq(rentalAgreements.tenantCompanyId, sql`tenant_company.id`))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(orderDirection(orderByColumn))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string)),
      
      db.select({ count: sql`count(*)::int` })
        .from(rentalAssets)
        .leftJoin(rentalAgreements, eq(rentalAssets.agreementId, rentalAgreements.id))
        .leftJoin(assets, eq(rentalAssets.assetId, assets.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
    ]);

    res.json({
      success: true,
      message: "Kiralama araçları başarıyla getirildi.",
      data: {
        rentalAssets: assetsList,
        totalCount: totalCount[0]?.count || 0,
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          hasMore: assetsList.length === parseInt(limit as string)
        }
      }
    });
  } catch (error) {
    console.error("Kiralama araçları listesi hatası:", error);
    res.status(500).json({ 
      success: false, 
      error: "Kiralama araçları listelenirken hata oluştu" 
    });
  }
});

// Belirli bir kiralama aracını getir
rentalAssetsRoutes.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [rentalAsset] = await db.select({
      id: rentalAssets.id,
      agreementId: rentalAssets.agreementId,
      agreementNumber: rentalAgreements.agreementNumber,
      assetId: rentalAssets.assetId,
      plateNumber: assets.plateNumber,
      mountCents: rentalAssets.mountCents,
      vatPercent: rentalAssets.vatPercent,
      kmMonthLimit: rentalAssets.kmMonthLimit,
      kmTotalLimit: rentalAssets.kmTotalLimit,
      // Sözleşme detayları
      rentalCompanyId: rentalAgreements.rentalCompanyId,
      rentalCompanyName: sql`rental_company.name`.as('rentalCompanyName'),
      tenantCompanyId: rentalAgreements.tenantCompanyId,
      tenantCompanyName: sql`tenant_company.name`.as('tenantCompanyName'),
      agreementStartDate: rentalAgreements.startDate,
      agreementEndDate: rentalAgreements.endDate,
      agreementIsActive: rentalAgreements.isActive,
      agreementIsShortTerm: rentalAgreements.isShortTerm
    })
    .from(rentalAssets)
    .leftJoin(rentalAgreements, eq(rentalAssets.agreementId, rentalAgreements.id))
    .leftJoin(assets, eq(rentalAssets.assetId, assets.id))
    .leftJoin(sql`companies AS rental_company`, eq(rentalAgreements.rentalCompanyId, sql`rental_company.id`))
    .leftJoin(sql`companies AS tenant_company`, eq(rentalAgreements.tenantCompanyId, sql`tenant_company.id`))
    .where(eq(rentalAssets.id, parseInt(id)));

    if (!rentalAsset) {
      return res.status(404).json({ 
        success: false, 
        error: "RENTAL_ASSET_NOT_FOUND",
        message: "Kiralama aracı bulunamadı." 
      });
    }

    res.json({ 
      success: true,
      message: "Kiralama aracı detayı başarıyla getirildi.",
      data: rentalAsset
    });
  } catch (error) {
    console.error("Kiralama aracı getirme hatası:", error);
    res.status(500).json({ 
      success: false, 
      error: "Kiralama aracı getirilirken hata oluştu" 
    });
  }
});

// Yeni kiralama aracı ekle
rentalAssetsRoutes.post("/", authenticateToken, async (req, res) => {
  try {
    const validatedData = insertRentalAssetSchema.parse(req.body);
    const auditInfo = captureAuditInfo(req);
    
    // Sözleşme varlığını kontrol et
    const [agreement] = await db.select()
      .from(rentalAgreements)
      .where(eq(rentalAgreements.id, validatedData.agreementId));
    
    if (!agreement) {
      return res.status(400).json({ 
        success: false, 
        error: "AGREEMENT_NOT_FOUND",
        message: "Belirtilen sözleşme bulunamadı." 
      });
    }
    
    // Araç varlığını kontrol et
    const [asset] = await db.select()
      .from(assets)
      .where(eq(assets.id, validatedData.assetId));
    
    if (!asset) {
      return res.status(400).json({ 
        success: false, 
        error: "ASSET_NOT_FOUND",
        message: "Belirtilen araç bulunamadı." 
      });
    }
    
    // Aynı sözleşmede aynı araç tekrarını engelle
    const [existingRentalAsset] = await db.select({ id: rentalAssets.id })
      .from(rentalAssets)
      .where(and(
        eq(rentalAssets.agreementId, validatedData.agreementId),
        eq(rentalAssets.assetId, validatedData.assetId)
      ));
    
    if (existingRentalAsset) {
      return res.status(400).json({ 
        success: false, 
        error: "ASSET_ALREADY_IN_AGREEMENT",
        message: "Bu araç zaten bu sözleşmede mevcut." 
      });
    }
    
    const [newRentalAsset] = await auditableInsert(
      db,
      rentalAssets,
      validatedData,
      auditInfo
    );

    res.status(201).json({ 
      success: true, 
      data: newRentalAsset,
      message: "Kiralama aracı başarıyla eklendi."
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        error: "VALIDATION_ERROR",
        message: "Geçersiz veri.", 
        details: error.errors 
      });
    }
    console.error("Kiralama aracı ekleme hatası:", error);
    res.status(500).json({ 
      success: false, 
      error: "Kiralama aracı eklenirken hata oluştu" 
    });
  }
});

// Kiralama aracı güncelle
rentalAssetsRoutes.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateRentalAssetSchema.parse(req.body);
    const auditInfo = captureAuditInfo(req);
    
    const [existingRentalAsset] = await db.select()
      .from(rentalAssets)
      .where(eq(rentalAssets.id, parseInt(id)));
    
    if (!existingRentalAsset) {
      return res.status(404).json({ 
        success: false, 
        error: "RENTAL_ASSET_NOT_FOUND",
        message: "Kiralama aracı bulunamadı." 
      });
    }
    
    // Sözleşme değişiyorsa varlığını kontrol et
    if (validatedData.agreementId && validatedData.agreementId !== existingRentalAsset.agreementId) {
      const [agreement] = await db.select()
        .from(rentalAgreements)
        .where(eq(rentalAgreements.id, validatedData.agreementId));
      
      if (!agreement) {
        return res.status(400).json({ 
          success: false, 
          error: "AGREEMENT_NOT_FOUND",
          message: "Belirtilen sözleşme bulunamadı." 
        });
      }
    }
    
    // Araç değişiyorsa varlığını kontrol et
    if (validatedData.assetId && validatedData.assetId !== existingRentalAsset.assetId) {
      const [asset] = await db.select()
        .from(assets)
        .where(eq(assets.id, validatedData.assetId));
      
      if (!asset) {
        return res.status(400).json({ 
          success: false, 
          error: "ASSET_NOT_FOUND",
          message: "Belirtilen araç bulunamadı." 
        });
      }
      
      // Yeni araç ve sözleşme kombinasyonunun tekrarını engelle
      const agreementIdToCheck = validatedData.agreementId || existingRentalAsset.agreementId;
      const [duplicateRentalAsset] = await db.select({ id: rentalAssets.id })
        .from(rentalAssets)
        .where(and(
          eq(rentalAssets.agreementId, agreementIdToCheck),
          eq(rentalAssets.assetId, validatedData.assetId),
          sql`id != ${parseInt(id)}`
        ));
      
      if (duplicateRentalAsset) {
        return res.status(400).json({ 
          success: false, 
          error: "ASSET_ALREADY_IN_AGREEMENT",
          message: "Bu araç zaten bu sözleşmede mevcut." 
        });
      }
    }
    
    const [updatedRentalAsset] = await auditableUpdate(
      db,
      rentalAssets,
      validatedData,
      eq(rentalAssets.id, parseInt(id)),
      existingRentalAsset,
      auditInfo
    );

    res.json({ 
      success: true, 
      data: updatedRentalAsset,
      message: "Kiralama aracı başarıyla güncellendi."
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        error: "VALIDATION_ERROR",
        message: "Geçersiz veri.", 
        details: error.errors 
      });
    }
    console.error("Kiralama aracı güncelleme hatası:", error);
    res.status(500).json({ 
      success: false, 
      error: "Kiralama aracı güncellenirken hata oluştu" 
    });
  }
});

// Kiralama aracını sil
rentalAssetsRoutes.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const auditInfo = captureAuditInfo(req);
    
    const [existingRentalAsset] = await db.select()
      .from(rentalAssets)
      .where(eq(rentalAssets.id, parseInt(id)));
    
    if (!existingRentalAsset) {
      return res.status(404).json({ 
        success: false, 
        error: "RENTAL_ASSET_NOT_FOUND",
        message: "Kiralama aracı bulunamadı." 
      });
    }
    
    // Hard delete - rental_assets cascade ile silinir
    await db.delete(rentalAssets)
      .where(eq(rentalAssets.id, parseInt(id)));

    res.json({ 
      success: true, 
      message: "Kiralama aracı başarıyla silindi."
    });
  } catch (error) {
    console.error("Kiralama aracı silme hatası:", error);
    res.status(500).json({ 
      success: false, 
      error: "Kiralama aracı silinirken hata oluştu" 
    });
  }
});

// Sözleşmeye göre kiralama araçlarını listele
rentalAssetsRoutes.get("/by-agreement/:agreementId", authenticateToken, async (req, res) => {
  try {
    const { agreementId } = req.params;
    
    const agreementAssets = await db.select({
      id: rentalAssets.id,
      assetId: rentalAssets.assetId,
      plateNumber: assets.plateNumber,
      mountCents: rentalAssets.mountCents,
      vatPercent: rentalAssets.vatPercent,
      kmMonthLimit: rentalAssets.kmMonthLimit,
      kmTotalLimit: rentalAssets.kmTotalLimit,
      // Toplam maliyet hesaplama
      totalCostWithVat: sql`ROUND(${rentalAssets.mountCents} * (1 + ${rentalAssets.vatPercent}/100))::int`.as('totalCostWithVat')
    })
    .from(rentalAssets)
    .leftJoin(assets, eq(rentalAssets.assetId, assets.id))
    .where(eq(rentalAssets.agreementId, parseInt(agreementId)))
    .orderBy(asc(assets.plateNumber));

    // Sözleşme toplam özeti
    const [summary] = await db.select({
      totalAssets: sql`count(*)::int`.as('totalAssets'),
      totalMountCents: sql`sum(mount_cents)::int`.as('totalMountCents'),
      avgVatPercent: sql`avg(vat_percent)::numeric`.as('avgVatPercent'),
      totalKmMonthLimit: sql`sum(km_month_limit)::int`.as('totalKmMonthLimit'),
      totalKmTotalLimit: sql`sum(km_total_limit)::int`.as('totalKmTotalLimit')
    })
    .from(rentalAssets)
    .where(eq(rentalAssets.agreementId, parseInt(agreementId)));

    res.json({ 
      success: true,
      message: "Sözleşme araçları başarıyla getirildi.",
      data: {
        assets: agreementAssets,
        summary: summary || {
          totalAssets: 0,
          totalMountCents: 0,
          avgVatPercent: 0,
          totalKmMonthLimit: 0,
          totalKmTotalLimit: 0
        }
      }
    });
  } catch (error) {
    console.error("Sözleşme araçları getirme hatası:", error);
    res.status(500).json({ 
      success: false, 
      error: "Sözleşme araçları getirilirken hata oluştu" 
    });
  }
});