import { Router } from "express";
import { db } from "./db";
import { rentalAgreements, rentalAssets, assets, companies } from "@shared/schema";
import { insertRentalAgreementSchema, updateRentalAgreementSchema } from "@shared/schema";
import { eq, and, or, like, desc, asc, sql, between, gte, lte } from "drizzle-orm";
import { authenticateToken, type AuthRequest } from "./auth";
import { captureAuditInfo, auditableInsert, auditableUpdate, auditableDelete } from "./audit-middleware";
import { z } from "zod";

const rentalAgreementsRoutes = Router();

export default rentalAgreementsRoutes;

// Tüm kiralama sözleşmelerini listele (filtreleme destekli)
rentalAgreementsRoutes.get("/", authenticateToken, async (req, res) => {
  try {
    const { 
      rentalCompanyId,
      tenantCompanyId,
      startDate,
      endDate,
      isShortTerm,
      isActive = "true",
      search,
      sortBy = "id",
      sortOrder = "desc",
      limit = "20",
      offset = "0"
    } = req.query;

    const conditions = [];
    
    if (rentalCompanyId) {
      conditions.push(eq(rentalAgreements.rentalCompanyId, parseInt(rentalCompanyId as string)));
    }
    
    if (tenantCompanyId) {
      conditions.push(eq(rentalAgreements.tenantCompanyId, parseInt(tenantCompanyId as string)));
    }
    
    if (isShortTerm !== undefined) {
      conditions.push(eq(rentalAgreements.isShortTerm, isShortTerm === "true"));
    }
    
    if (isActive !== undefined) {
      conditions.push(eq(rentalAgreements.isActive, isActive === "true"));
    }
    
    if (startDate && endDate) {
      conditions.push(between(rentalAgreements.startDate, startDate as string, endDate as string));
    } else if (startDate) {
      conditions.push(gte(rentalAgreements.startDate, startDate as string));
    } else if (endDate) {
      conditions.push(lte(rentalAgreements.endDate, endDate as string));
    }
    
    if (search) {
      conditions.push(
        like(rentalAgreements.agreementNumber, `%${search}%`)
      );
    }

    const orderByColumn = sortBy === "agreementNumber" ? rentalAgreements.agreementNumber :
                         sortBy === "startDate" ? rentalAgreements.startDate :
                         sortBy === "endDate" ? rentalAgreements.endDate :
                         rentalAgreements.id;
    
    const orderDirection = sortOrder === "asc" ? asc : desc;

    const [agreementsList, totalCount] = await Promise.all([
      db.select({
        id: rentalAgreements.id,
        agreementNumber: rentalAgreements.agreementNumber,
        rentalCompanyId: rentalAgreements.rentalCompanyId,
        rentalCompanyName: sql`rental_company.name`.as('rentalCompanyName'),
        tenantCompanyId: rentalAgreements.tenantCompanyId,
        tenantCompanyName: sql`tenant_company.name`.as('tenantCompanyName'),
        startDate: rentalAgreements.startDate,
        endDate: rentalAgreements.endDate,
        isShortTerm: rentalAgreements.isShortTerm,
        isActive: rentalAgreements.isActive,
        // Sözleşmeye bağlı araç sayısı
        assetCount: sql`(SELECT COUNT(*) FROM rental_assets ra WHERE ra.agreement_id = ${rentalAgreements.id})::int`.as('assetCount')
      })
      .from(rentalAgreements)
      .leftJoin(sql`companies AS rental_company`, eq(rentalAgreements.rentalCompanyId, sql`rental_company.id`))
      .leftJoin(sql`companies AS tenant_company`, eq(rentalAgreements.tenantCompanyId, sql`tenant_company.id`))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(orderDirection(orderByColumn))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string)),
      
      db.select({ count: sql`count(*)::int` })
        .from(rentalAgreements)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
    ]);

    res.json({
      success: true,
      message: "Kiralama sözleşmeleri başarıyla getirildi.",
      data: {
        agreements: agreementsList,
        totalCount: totalCount[0]?.count || 0,
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          hasMore: agreementsList.length === parseInt(limit as string)
        }
      }
    });
  } catch (error) {
    console.error("Kiralama sözleşmeleri listesi hatası:", error);
    res.status(500).json({ 
      success: false, 
      error: "Kiralama sözleşmeleri listelenirken hata oluştu" 
    });
  }
});

// Belirli bir kiralama sözleşmesini getir
rentalAgreementsRoutes.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [agreement] = await db.select({
      id: rentalAgreements.id,
      agreementNumber: rentalAgreements.agreementNumber,
      rentalCompanyId: rentalAgreements.rentalCompanyId,
      rentalCompanyName: sql`rental_company.name`.as('rentalCompanyName'),
      tenantCompanyId: rentalAgreements.tenantCompanyId,
      tenantCompanyName: sql`tenant_company.name`.as('tenantCompanyName'),
      startDate: rentalAgreements.startDate,
      endDate: rentalAgreements.endDate,
      isShortTerm: rentalAgreements.isShortTerm,
      isActive: rentalAgreements.isActive
    })
    .from(rentalAgreements)
    .leftJoin(sql`companies AS rental_company`, eq(rentalAgreements.rentalCompanyId, sql`rental_company.id`))
    .leftJoin(sql`companies AS tenant_company`, eq(rentalAgreements.tenantCompanyId, sql`tenant_company.id`))
    .where(eq(rentalAgreements.id, parseInt(id)));

    if (!agreement) {
      return res.status(404).json({ 
        success: false, 
        error: "AGREEMENT_NOT_FOUND",
        message: "Kiralama sözleşmesi bulunamadı." 
      });
    }

    // Sözleşmeye bağlı araçları getir
    const agreementAssets = await db.select({
      id: rentalAssets.id,
      assetId: rentalAssets.assetId,
      plateNumber: assets.plateNumber,
      mountCents: rentalAssets.mountCents,
      vatPercent: rentalAssets.vatPercent,
      kmHourLimit: rentalAssets.kmHourLimit,
      kmTotalLimit: rentalAssets.kmTotalLimit
    })
    .from(rentalAssets)
    .leftJoin(assets, eq(rentalAssets.assetId, assets.id))
    .where(eq(rentalAssets.agreementId, parseInt(id)));

    res.json({ 
      success: true,
      message: "Kiralama sözleşmesi detayı başarıyla getirildi.",
      data: {
        agreement,
        assets: agreementAssets
      }
    });
  } catch (error) {
    console.error("Kiralama sözleşmesi getirme hatası:", error);
    res.status(500).json({ 
      success: false, 
      error: "Kiralama sözleşmesi getirilirken hata oluştu" 
    });
  }
});

// Yeni kiralama sözleşmesi oluştur
rentalAgreementsRoutes.post("/", authenticateToken, async (req, res) => {
  try {
    const validatedData = insertRentalAgreementSchema.parse(req.body);
    const auditInfo = captureAuditInfo(req);
    
    // Sözleşme numarası benzersizlik kontrolü
    const [existingAgreement] = await db.select({ id: rentalAgreements.id })
      .from(rentalAgreements)
      .where(eq(rentalAgreements.agreementNumber, validatedData.agreementNumber));
    
    if (existingAgreement) {
      return res.status(400).json({ 
        success: false, 
        error: "AGREEMENT_NUMBER_EXISTS",
        message: "Bu sözleşme numarası zaten kullanılıyor." 
      });
    }
    
    const [newAgreement] = await auditableInsert(
      db,
      rentalAgreements,
      {
        ...validatedData,
        createdBy: auditInfo.userId,
        updatedBy: auditInfo.userId
      },
      auditInfo
    );

    res.status(201).json({ 
      success: true, 
      data: newAgreement,
      message: "Kiralama sözleşmesi başarıyla oluşturuldu."
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
    console.error("Kiralama sözleşmesi oluşturma hatası:", error);
    res.status(500).json({ 
      success: false, 
      error: "Kiralama sözleşmesi oluşturulurken hata oluştu" 
    });
  }
});

// Kiralama sözleşmesi güncelle
rentalAgreementsRoutes.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateRentalAgreementSchema.parse(req.body);
    const auditInfo = captureAuditInfo(req);
    
    const [existingAgreement] = await db.select()
      .from(rentalAgreements)
      .where(eq(rentalAgreements.id, parseInt(id)));
    
    if (!existingAgreement) {
      return res.status(404).json({ 
        success: false, 
        error: "AGREEMENT_NOT_FOUND",
        message: "Kiralama sözleşmesi bulunamadı." 
      });
    }
    
    // Sözleşme numarası değişiyorsa benzersizlik kontrolü
    if (validatedData.agreementNumber && validatedData.agreementNumber !== existingAgreement.agreementNumber) {
      const [duplicateAgreement] = await db.select({ id: rentalAgreements.id })
        .from(rentalAgreements)
        .where(and(
          eq(rentalAgreements.agreementNumber, validatedData.agreementNumber),
          sql`id != ${parseInt(id)}`
        ));
      
      if (duplicateAgreement) {
        return res.status(400).json({ 
          success: false, 
          error: "AGREEMENT_NUMBER_EXISTS",
          message: "Bu sözleşme numarası zaten kullanılıyor." 
        });
      }
    }
    
    const [updatedAgreement] = await auditableUpdate(
      db,
      rentalAgreements,
      {
        ...validatedData,
        updatedBy: auditInfo.userId,
        updatedAt: new Date()
      },
      eq(rentalAgreements.id, parseInt(id)),
      existingAgreement,
      auditInfo
    );

    res.json({ 
      success: true, 
      data: updatedAgreement,
      message: "Kiralama sözleşmesi başarıyla güncellendi."
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
    console.error("Kiralama sözleşmesi güncelleme hatası:", error);
    res.status(500).json({ 
      success: false, 
      error: "Kiralama sözleşmesi güncellenirken hata oluştu" 
    });
  }
});

// Kiralama sözleşmesini deaktif et
rentalAgreementsRoutes.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const auditInfo = captureAuditInfo(req);
    
    const [existingAgreement] = await db.select()
      .from(rentalAgreements)
      .where(eq(rentalAgreements.id, parseInt(id)));
    
    if (!existingAgreement) {
      return res.status(404).json({ 
        success: false, 
        error: "AGREEMENT_NOT_FOUND",
        message: "Kiralama sözleşmesi bulunamadı." 
      });
    }
    
    await auditableUpdate(
      db,
      rentalAgreements,
      {
        isActive: false,
        updatedBy: auditInfo.userId,
        updatedAt: new Date()
      },
      eq(rentalAgreements.id, parseInt(id)),
      existingAgreement,
      auditInfo
    );

    res.json({ 
      success: true, 
      message: "Kiralama sözleşmesi başarıyla deaktif edildi."
    });
  } catch (error) {
    console.error("Kiralama sözleşmesi deaktif etme hatası:", error);
    res.status(500).json({ 
      success: false, 
      error: "Kiralama sözleşmesi deaktif edilirken hata oluştu" 
    });
  }
});

// Sözleşme özeti - aktif sözleşme sayıları
rentalAgreementsRoutes.get("/summary/stats", authenticateToken, async (req, res) => {
  try {
    const summary = await db.select({
      totalAgreements: sql`count(*)::int`.as('totalAgreements'),
      activeAgreements: sql`count(case when is_active = true then 1 end)::int`.as('activeAgreements'),
      shortTermAgreements: sql`count(case when is_short_term = true then 1 end)::int`.as('shortTermAgreements'),
      longTermAgreements: sql`count(case when is_short_term = false then 1 end)::int`.as('longTermAgreements'),
      totalRentalAssets: sql`(SELECT COUNT(*) FROM rental_assets)::int`.as('totalRentalAssets'),
      uniqueRentalCompanies: sql`count(distinct rental_company_id)::int`.as('uniqueRentalCompanies'),
      uniqueTenantCompanies: sql`count(distinct tenant_company_id)::int`.as('uniqueTenantCompanies')
    })
    .from(rentalAgreements);

    res.json({ 
      success: true, 
      message: "Sözleşme özeti başarıyla getirildi.",
      data: summary[0]
    });
  } catch (error) {
    console.error("Sözleşme özeti hatası:", error);
    res.status(500).json({ 
      success: false, 
      error: "Sözleşme özeti alınırken hata oluştu" 
    });
  }
});