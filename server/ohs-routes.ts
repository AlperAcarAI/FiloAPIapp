import { Router, type Response } from "express";
import { authenticateJWT, type AuthRequest } from "./hierarchical-auth.js";
import { db } from "./db";
import {
  ohsInspectionTemplates,
  ohsTemplateItems,
  ohsInspections,
  ohsInspectionItems,
  ohsInspectionPhotos,
  ohsPersonnelCertifications,
  ohsIncidents,
  ohsCorrectiveActions,
  projectPyps,
  projects,
  workAreas,
  personnel,
  companies,
  users,
  insertOhsTemplateSchema,
  updateOhsTemplateSchema,
  insertOhsTemplateItemSchema,
  updateOhsTemplateItemSchema,
  insertOhsInspectionSchema,
  updateOhsInspectionSchema,
  insertOhsInspectionItemSchema,
  insertOhsCertificationSchema,
  updateOhsCertificationSchema,
  insertOhsIncidentSchema,
  updateOhsIncidentSchema,
  insertOhsCorrectiveActionSchema,
  updateOhsCorrectiveActionSchema,
} from "../shared/schema";
import { eq, and, desc, sql, or, ilike, lte, gte } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { createAuditLog } from "./audit-middleware";

const router = Router();
router.use(authenticateJWT);

// ========================
// YARDIMCI FONKSİYONLAR
// ========================

function parsePagination(query: Record<string, unknown>) {
  const limit = Math.min(Math.max(parseInt(String(query.limit)) || 50, 1), 200);
  const offset = Math.max(parseInt(String(query.offset)) || 0, 0);
  return { limit, offset };
}

function sendSuccess(res: Response, data: unknown, message?: string, statusCode = 200) {
  res.status(statusCode).json({ success: true, message, data });
}

function sendListSuccess(res: Response, items: unknown[], totalCount: number, limit: number, offset: number) {
  res.json({
    success: true,
    data: {
      items,
      totalCount,
      pagination: { limit, offset, hasMore: items.length === limit },
    },
  });
}

function sendError(res: Response, errorCode: string, message: string, statusCode = 500) {
  res.status(statusCode).json({ success: false, error: errorCode, message });
}

// Alias'lar
const inspector = alias(personnel, "inspector");
const assignedPerson = alias(personnel, "assigned_person");
const affectedPerson = alias(personnel, "affected_person");
const reportedBy = alias(personnel, "reported_by");

// ========================
// DENETİM ŞABLONLARI
// ========================

/** GET /ohs/templates — Şablonları listele */
router.get("/ohs/templates", async (req: AuthRequest, res) => {
  try {
    const { search, category, active } = req.query;
    const { limit, offset } = parsePagination(req.query as Record<string, unknown>);

    const conditions = [];
    if (search) conditions.push(or(ilike(ohsInspectionTemplates.name, `%${search}%`), ilike(ohsInspectionTemplates.code, `%${search}%`)));
    if (category) conditions.push(eq(ohsInspectionTemplates.category, category as string));
    if (active === "true") conditions.push(eq(ohsInspectionTemplates.isActive, true));

    const items = await db.select().from(ohsInspectionTemplates)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(ohsInspectionTemplates.createdAt))
      .limit(limit).offset(offset);

    const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(ohsInspectionTemplates)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    sendListSuccess(res, items, Number(countResult.count), limit, offset);
  } catch (error) {
    console.error("İSG şablon listesi hatası:", error);
    sendError(res, "OHS_TEMPLATES_FETCH_ERROR", "Denetim şablonları getirilirken hata oluştu.");
  }
});

/** GET /ohs/templates/:id — Şablon detayı (maddeler dahil) */
router.get("/ohs/templates/:id", async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const [template] = await db.select().from(ohsInspectionTemplates).where(eq(ohsInspectionTemplates.id, id));
    if (!template) return sendError(res, "TEMPLATE_NOT_FOUND", "Şablon bulunamadı.", 404);

    const items = await db.select().from(ohsTemplateItems)
      .where(and(eq(ohsTemplateItems.templateId, id), eq(ohsTemplateItems.isActive, true)))
      .orderBy(ohsTemplateItems.itemOrder);

    sendSuccess(res, { ...template, items });
  } catch (error) {
    console.error("İSG şablon detay hatası:", error);
    sendError(res, "OHS_TEMPLATE_DETAIL_ERROR", "Şablon detayı getirilirken hata oluştu.");
  }
});

/** POST /ohs/templates — Yeni şablon oluştur */
router.post("/ohs/templates", async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const parsed = insertOhsTemplateSchema.parse(req.body);
    const [created] = await db.insert(ohsInspectionTemplates).values({ ...parsed, createdBy: userId, updatedBy: userId }).returning();
    sendSuccess(res, created, "Denetim şablonu başarıyla oluşturuldu.", 201);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "ZodError") return sendError(res, "VALIDATION_ERROR", "Geçersiz veri formatı.", 400);
    console.error("İSG şablon oluşturma hatası:", error);
    sendError(res, "OHS_TEMPLATE_CREATE_ERROR", "Şablon oluşturulurken hata oluştu.");
  }
});

/** PUT /ohs/templates/:id — Şablon güncelle */
router.put("/ohs/templates/:id", async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user?.id;
    const parsed = updateOhsTemplateSchema.parse(req.body);
    const [updated] = await db.update(ohsInspectionTemplates).set({ ...parsed, updatedBy: userId, updatedAt: new Date() })
      .where(eq(ohsInspectionTemplates.id, id)).returning();
    if (!updated) return sendError(res, "TEMPLATE_NOT_FOUND", "Şablon bulunamadı.", 404);
    sendSuccess(res, updated, "Şablon başarıyla güncellendi.");
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "ZodError") return sendError(res, "VALIDATION_ERROR", "Geçersiz veri formatı.", 400);
    console.error("İSG şablon güncelleme hatası:", error);
    sendError(res, "OHS_TEMPLATE_UPDATE_ERROR", "Şablon güncellenirken hata oluştu.");
  }
});

/** POST /ohs/templates/:id/items — Şablon maddesi ekle */
router.post("/ohs/templates/:id/items", async (req: AuthRequest, res) => {
  try {
    const templateId = parseInt(req.params.id);
    const parsed = insertOhsTemplateItemSchema.parse({ ...req.body, templateId });
    const [created] = await db.insert(ohsTemplateItems).values(parsed).returning();
    sendSuccess(res, created, "Şablon maddesi başarıyla eklendi.", 201);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "ZodError") return sendError(res, "VALIDATION_ERROR", "Geçersiz veri formatı.", 400);
    console.error("Şablon maddesi ekleme hatası:", error);
    sendError(res, "TEMPLATE_ITEM_CREATE_ERROR", "Şablon maddesi eklenirken hata oluştu.");
  }
});

/** PUT /ohs/templates/:templateId/items/:itemId */
router.put("/ohs/templates/:templateId/items/:itemId", async (req: AuthRequest, res) => {
  try {
    const itemId = parseInt(req.params.itemId);
    const parsed = updateOhsTemplateItemSchema.parse(req.body);
    const [updated] = await db.update(ohsTemplateItems).set(parsed).where(eq(ohsTemplateItems.id, itemId)).returning();
    if (!updated) return sendError(res, "TEMPLATE_ITEM_NOT_FOUND", "Şablon maddesi bulunamadı.", 404);
    sendSuccess(res, updated, "Şablon maddesi başarıyla güncellendi.");
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "ZodError") return sendError(res, "VALIDATION_ERROR", "Geçersiz veri formatı.", 400);
    console.error("Şablon maddesi güncelleme hatası:", error);
    sendError(res, "TEMPLATE_ITEM_UPDATE_ERROR", "Şablon maddesi güncellenirken hata oluştu.");
  }
});

/** DELETE /ohs/templates/:templateId/items/:itemId — Soft delete */
router.delete("/ohs/templates/:templateId/items/:itemId", async (req: AuthRequest, res) => {
  try {
    const itemId = parseInt(req.params.itemId);
    const [updated] = await db.update(ohsTemplateItems).set({ isActive: false }).where(eq(ohsTemplateItems.id, itemId)).returning();
    if (!updated) return sendError(res, "TEMPLATE_ITEM_NOT_FOUND", "Şablon maddesi bulunamadı.", 404);
    sendSuccess(res, null, "Şablon maddesi başarıyla silindi.");
  } catch (error) {
    console.error("Şablon maddesi silme hatası:", error);
    sendError(res, "TEMPLATE_ITEM_DELETE_ERROR", "Şablon maddesi silinirken hata oluştu.");
  }
});

// ========================
// DENETİMLER
// ========================

/** GET /ohs/inspections — Denetimleri listele */
router.get("/ohs/inspections", async (req: AuthRequest, res) => {
  try {
    const { search, status, pypId, projectId, inspectorId, dateFrom, dateTo } = req.query;
    const { limit, offset } = parsePagination(req.query as Record<string, unknown>);

    const conditions = [];
    if (search) conditions.push(or(ilike(ohsInspections.inspectionCode, `%${search}%`), ilike(ohsInspections.summary, `%${search}%`)));
    if (status) conditions.push(eq(ohsInspections.status, status as string));
    if (pypId) conditions.push(eq(ohsInspections.pypId, parseInt(pypId as string)));
    if (projectId) conditions.push(eq(ohsInspections.projectId, parseInt(projectId as string)));
    if (inspectorId) conditions.push(eq(ohsInspections.inspectorId, parseInt(inspectorId as string)));
    if (dateFrom) conditions.push(gte(ohsInspections.inspectionDate, dateFrom as string));
    if (dateTo) conditions.push(lte(ohsInspections.inspectionDate, dateTo as string));
    conditions.push(eq(ohsInspections.isActive, true));

    const items = await db
      .select({
        id: ohsInspections.id,
        inspectionCode: ohsInspections.inspectionCode,
        templateId: ohsInspections.templateId,
        templateName: ohsInspectionTemplates.name,
        pypId: ohsInspections.pypId,
        pypCode: projectPyps.code,
        pypName: projectPyps.name,
        projectId: ohsInspections.projectId,
        inspectionDate: ohsInspections.inspectionDate,
        inspectorId: ohsInspections.inspectorId,
        inspectorName: sql<string>`CONCAT(${inspector.name}, ' ', ${inspector.surname})`,
        status: ohsInspections.status,
        overallResult: ohsInspections.overallResult,
        complianceScore: ohsInspections.complianceScore,
        createdAt: ohsInspections.createdAt,
      })
      .from(ohsInspections)
      .leftJoin(ohsInspectionTemplates, eq(ohsInspections.templateId, ohsInspectionTemplates.id))
      .leftJoin(projectPyps, eq(ohsInspections.pypId, projectPyps.id))
      .leftJoin(inspector, eq(ohsInspections.inspectorId, inspector.id))
      .where(and(...conditions))
      .orderBy(desc(ohsInspections.inspectionDate))
      .limit(limit).offset(offset);

    const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(ohsInspections)
      .where(and(...conditions));

    sendListSuccess(res, items, Number(countResult.count), limit, offset);
  } catch (error) {
    console.error("İSG denetim listesi hatası:", error);
    sendError(res, "OHS_INSPECTIONS_FETCH_ERROR", "Denetimler getirilirken hata oluştu.");
  }
});

/** GET /ohs/inspections/:id — Denetim detayı */
router.get("/ohs/inspections/:id", async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);

    const [inspection] = await db
      .select({
        id: ohsInspections.id,
        inspectionCode: ohsInspections.inspectionCode,
        templateId: ohsInspections.templateId,
        templateName: ohsInspectionTemplates.name,
        pypId: ohsInspections.pypId,
        pypCode: projectPyps.code,
        pypName: projectPyps.name,
        projectId: ohsInspections.projectId,
        workAreaId: ohsInspections.workAreaId,
        inspectionDate: ohsInspections.inspectionDate,
        inspectorId: ohsInspections.inspectorId,
        inspectorName: sql<string>`CONCAT(${inspector.name}, ' ', ${inspector.surname})`,
        status: ohsInspections.status,
        overallResult: ohsInspections.overallResult,
        complianceScore: ohsInspections.complianceScore,
        summary: ohsInspections.summary,
        recommendations: ohsInspections.recommendations,
        reviewedBy: ohsInspections.reviewedBy,
        reviewedAt: ohsInspections.reviewedAt,
        createdAt: ohsInspections.createdAt,
        updatedAt: ohsInspections.updatedAt,
      })
      .from(ohsInspections)
      .leftJoin(ohsInspectionTemplates, eq(ohsInspections.templateId, ohsInspectionTemplates.id))
      .leftJoin(projectPyps, eq(ohsInspections.pypId, projectPyps.id))
      .leftJoin(inspector, eq(ohsInspections.inspectorId, inspector.id))
      .where(eq(ohsInspections.id, id));

    if (!inspection) return sendError(res, "INSPECTION_NOT_FOUND", "Denetim bulunamadı.", 404);

    // İlişkili verileri paralel getir
    const [itemsList, photosList, caList] = await Promise.all([
      db
        .select({
          id: ohsInspectionItems.id,
          templateItemId: ohsInspectionItems.templateItemId,
          question: ohsTemplateItems.question,
          responseType: ohsTemplateItems.responseType,
          isCritical: ohsTemplateItems.isCritical,
          category: ohsTemplateItems.category,
          response: ohsInspectionItems.response,
          isCompliant: ohsInspectionItems.isCompliant,
          notes: ohsInspectionItems.notes,
        })
        .from(ohsInspectionItems)
        .leftJoin(ohsTemplateItems, eq(ohsInspectionItems.templateItemId, ohsTemplateItems.id))
        .where(eq(ohsInspectionItems.inspectionId, id))
        .orderBy(ohsTemplateItems.itemOrder),
      db.select().from(ohsInspectionPhotos).where(eq(ohsInspectionPhotos.inspectionId, id)),
      db.select().from(ohsCorrectiveActions).where(and(eq(ohsCorrectiveActions.inspectionId, id), eq(ohsCorrectiveActions.isActive, true))),
    ]);

    sendSuccess(res, { ...inspection, items: itemsList, photos: photosList, correctiveActions: caList });
  } catch (error) {
    console.error("İSG denetim detay hatası:", error);
    sendError(res, "OHS_INSPECTION_DETAIL_ERROR", "Denetim detayı getirilirken hata oluştu.");
  }
});

/**
 * POST /ohs/inspections — Yeni denetim başlat
 * Şablondaki maddeler otomatik oluşturulur
 */
router.post("/ohs/inspections", async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const parsed = insertOhsInspectionSchema.parse(req.body);

    // Şablon kontrolü
    const [template] = await db.select().from(ohsInspectionTemplates).where(eq(ohsInspectionTemplates.id, parsed.templateId));
    if (!template) return sendError(res, "TEMPLATE_NOT_FOUND", "Denetim şablonu bulunamadı.", 404);

    // Denetim oluştur
    const [created] = await db.insert(ohsInspections).values({ ...parsed, createdBy: userId, updatedBy: userId }).returning();

    // Şablon maddelerini denetim maddelerine kopyala
    const templateItems = await db.select().from(ohsTemplateItems)
      .where(and(eq(ohsTemplateItems.templateId, parsed.templateId), eq(ohsTemplateItems.isActive, true)))
      .orderBy(ohsTemplateItems.itemOrder);

    if (templateItems.length > 0) {
      await db.insert(ohsInspectionItems).values(
        templateItems.map((item) => ({
          inspectionId: created.id,
          templateItemId: item.id,
        }))
      );
    }

    try {
      await createAuditLog("ohs_inspections", created.id, "INSERT", null, created, userId || null);
    } catch (auditError) {
      console.error("Audit log hatası:", auditError);
    }

    sendSuccess(res, { ...created, itemCount: templateItems.length }, "Denetim başarıyla oluşturuldu.", 201);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "ZodError") return sendError(res, "VALIDATION_ERROR", "Geçersiz veri formatı.", 400);
    console.error("İSG denetim oluşturma hatası:", error);
    sendError(res, "OHS_INSPECTION_CREATE_ERROR", "Denetim oluşturulurken hata oluştu.");
  }
});

/** PUT /ohs/inspections/:id — Denetim güncelle */
router.put("/ohs/inspections/:id", async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user?.id;
    const parsed = updateOhsInspectionSchema.parse(req.body);
    const [updated] = await db.update(ohsInspections).set({ ...parsed, updatedBy: userId, updatedAt: new Date() })
      .where(eq(ohsInspections.id, id)).returning();
    if (!updated) return sendError(res, "INSPECTION_NOT_FOUND", "Denetim bulunamadı.", 404);
    sendSuccess(res, updated, "Denetim başarıyla güncellendi.");
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "ZodError") return sendError(res, "VALIDATION_ERROR", "Geçersiz veri formatı.", 400);
    console.error("İSG denetim güncelleme hatası:", error);
    sendError(res, "OHS_INSPECTION_UPDATE_ERROR", "Denetim güncellenirken hata oluştu.");
  }
});

/** PUT /ohs/inspections/:id/status — Denetim durumu değiştir */
router.put("/ohs/inspections/:id/status", async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user?.id;
    const { status: newStatus } = req.body;

    const validTransitions: Record<string, string[]> = {
      draft: ["in_progress"],
      in_progress: ["completed"],
      completed: ["reviewed", "in_progress"],
      reviewed: [],
    };

    const [existing] = await db.select().from(ohsInspections).where(eq(ohsInspections.id, id));
    if (!existing) return sendError(res, "INSPECTION_NOT_FOUND", "Denetim bulunamadı.", 404);

    const allowed = validTransitions[existing.status] || [];
    if (!allowed.includes(newStatus)) {
      return sendError(res, "INVALID_STATUS_TRANSITION", `"${existing.status}" → "${newStatus}" geçişi yapılamaz.`, 400);
    }

    const updateData: Record<string, unknown> = { status: newStatus, updatedBy: userId, updatedAt: new Date() };

    if (newStatus === "reviewed") {
      updateData.reviewedBy = userId;
      updateData.reviewedAt = new Date();
    }

    const [updated] = await db.update(ohsInspections).set(updateData).where(eq(ohsInspections.id, id)).returning();
    sendSuccess(res, updated, `Denetim durumu "${newStatus}" olarak güncellendi.`);
  } catch (error) {
    console.error("İSG denetim durum hatası:", error);
    sendError(res, "OHS_STATUS_ERROR", "Denetim durumu güncellenirken hata oluştu.");
  }
});

/** POST /ohs/inspections/:id/items/:itemId/respond — Madde yanıtı kaydet */
router.post("/ohs/inspections/:id/items/:itemId/respond", async (req: AuthRequest, res) => {
  try {
    const itemId = parseInt(req.params.itemId);
    const { response, isCompliant, notes } = req.body;

    const [updated] = await db.update(ohsInspectionItems)
      .set({ response, isCompliant, notes })
      .where(eq(ohsInspectionItems.id, itemId))
      .returning();

    if (!updated) return sendError(res, "ITEM_NOT_FOUND", "Denetim maddesi bulunamadı.", 404);
    sendSuccess(res, updated, "Yanıt başarıyla kaydedildi.");
  } catch (error) {
    console.error("Denetim madde yanıt hatası:", error);
    sendError(res, "ITEM_RESPOND_ERROR", "Yanıt kaydedilirken hata oluştu.");
  }
});

/**
 * POST /ohs/inspections/:id/complete — Denetimi tamamla
 * Uygunluk skoru hesaplar, kritik uygunsuzluklardan otomatik CA oluşturur
 */
router.post("/ohs/inspections/:id/complete", async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user?.id;

    const [existing] = await db.select().from(ohsInspections).where(eq(ohsInspections.id, id));
    if (!existing) return sendError(res, "INSPECTION_NOT_FOUND", "Denetim bulunamadı.", 404);
    if (existing.status !== "in_progress") return sendError(res, "NOT_IN_PROGRESS", "Sadece devam eden denetimler tamamlanabilir.", 400);

    // Tüm maddelere yanıt verilmiş mi kontrol et
    const allItems = await db.select().from(ohsInspectionItems).where(eq(ohsInspectionItems.inspectionId, id));
    const unanswered = allItems.filter((item) => item.response === null);
    if (unanswered.length > 0) {
      return sendError(res, "UNANSWERED_ITEMS", `${unanswered.length} adet yanıtlanmamış madde var.`, 400);
    }

    // Skor hesapla
    const totalItems = allItems.length;
    const compliantItems = allItems.filter((item) => item.isCompliant === true).length;
    const complianceScore = totalItems > 0 ? ((compliantItems / totalItems) * 100).toFixed(2) : "0";

    let overallResult: string;
    const score = parseFloat(complianceScore);
    if (score >= 90) overallResult = "compliant";
    else if (score >= 60) overallResult = "partially_compliant";
    else overallResult = "non_compliant";

    const [updated] = await db.update(ohsInspections).set({
      status: "completed",
      complianceScore,
      overallResult,
      updatedBy: userId,
      updatedAt: new Date(),
    }).where(eq(ohsInspections.id, id)).returning();

    // Kritik uygunsuzluklardan otomatik düzeltici faaliyet oluştur
    const criticalNonCompliant = await db
      .select({
        inspectionItemId: ohsInspectionItems.id,
        question: ohsTemplateItems.question,
      })
      .from(ohsInspectionItems)
      .innerJoin(ohsTemplateItems, eq(ohsInspectionItems.templateItemId, ohsTemplateItems.id))
      .where(
        and(
          eq(ohsInspectionItems.inspectionId, id),
          eq(ohsInspectionItems.isCompliant, false),
          eq(ohsTemplateItems.isCritical, true)
        )
      );

    let createdCaCount = 0;
    for (const item of criticalNonCompliant) {
      const actionCode = `CA-${existing.inspectionCode}-${item.inspectionItemId}`;
      try {
        await db.insert(ohsCorrectiveActions).values({
          inspectionId: id,
          inspectionItemId: item.inspectionItemId,
          actionCode,
          description: `Kritik uygunsuzluk: ${item.question}`,
          priority: "critical",
          status: "open",
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 7 gün sonra
          createdBy: userId,
          updatedBy: userId,
        });
        createdCaCount++;
      } catch {
        // Duplicate CA (zaten varsa) atla
      }
    }

    sendSuccess(res, {
      ...updated,
      complianceScore: score,
      overallResult,
      autoCreatedCorrectiveActions: createdCaCount,
    }, `Denetim tamamlandı. Uygunluk puanı: %${complianceScore}`);
  } catch (error) {
    console.error("İSG denetim tamamlama hatası:", error);
    sendError(res, "OHS_COMPLETE_ERROR", "Denetim tamamlanırken hata oluştu.");
  }
});

/** POST /ohs/inspections/:id/photos — Fotoğraf ekle */
router.post("/ohs/inspections/:id/photos", async (req: AuthRequest, res) => {
  try {
    const inspectionId = parseInt(req.params.id);
    const userId = req.user?.id;
    const { inspectionItemId, photoUrl, caption, takenAt } = req.body;

    if (!photoUrl) return sendError(res, "MISSING_PHOTO_URL", "Fotoğraf URL'i gereklidir.", 400);

    const [created] = await db.insert(ohsInspectionPhotos).values({
      inspectionId,
      inspectionItemId: inspectionItemId || null,
      photoUrl,
      caption,
      takenAt: takenAt ? new Date(takenAt) : null,
      createdBy: userId,
    }).returning();

    sendSuccess(res, created, "Fotoğraf başarıyla eklendi.", 201);
  } catch (error) {
    console.error("Denetim fotoğraf ekleme hatası:", error);
    sendError(res, "PHOTO_CREATE_ERROR", "Fotoğraf eklenirken hata oluştu.");
  }
});

// ========================
// SERTİFİKALAR
// ========================

/** GET /ohs/certifications — Sertifika listesi */
router.get("/ohs/certifications", async (req: AuthRequest, res) => {
  try {
    const { personnelId, certificationType, status } = req.query;
    const { limit, offset } = parsePagination(req.query as Record<string, unknown>);

    const conditions = [eq(ohsPersonnelCertifications.isActive, true)];
    if (personnelId) conditions.push(eq(ohsPersonnelCertifications.personnelId, parseInt(personnelId as string)));
    if (certificationType) conditions.push(eq(ohsPersonnelCertifications.certificationType, certificationType as string));
    if (status) conditions.push(eq(ohsPersonnelCertifications.status, status as string));

    const items = await db
      .select({
        id: ohsPersonnelCertifications.id,
        personnelId: ohsPersonnelCertifications.personnelId,
        personnelName: sql<string>`CONCAT(${personnel.name}, ' ', ${personnel.surname})`,
        certificationType: ohsPersonnelCertifications.certificationType,
        certificateNumber: ohsPersonnelCertifications.certificateNumber,
        issuedBy: ohsPersonnelCertifications.issuedBy,
        issueDate: ohsPersonnelCertifications.issueDate,
        expiryDate: ohsPersonnelCertifications.expiryDate,
        status: ohsPersonnelCertifications.status,
        documentUrl: ohsPersonnelCertifications.documentUrl,
      })
      .from(ohsPersonnelCertifications)
      .leftJoin(personnel, eq(ohsPersonnelCertifications.personnelId, personnel.id))
      .where(and(...conditions))
      .orderBy(desc(ohsPersonnelCertifications.createdAt))
      .limit(limit).offset(offset);

    const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(ohsPersonnelCertifications).where(and(...conditions));
    sendListSuccess(res, items, Number(countResult.count), limit, offset);
  } catch (error) {
    console.error("İSG sertifika listesi hatası:", error);
    sendError(res, "OHS_CERTS_FETCH_ERROR", "Sertifikalar getirilirken hata oluştu.");
  }
});

/** GET /ohs/certifications/expiring — Süresi dolmak üzere olan sertifikalar (30 gün içinde) */
router.get("/ohs/certifications/expiring", async (req: AuthRequest, res) => {
  try {
    const daysAhead = parseInt(req.query.days as string) || 30;
    const futureDate = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const today = new Date().toISOString().split("T")[0];

    const items = await db
      .select({
        id: ohsPersonnelCertifications.id,
        personnelId: ohsPersonnelCertifications.personnelId,
        personnelName: sql<string>`CONCAT(${personnel.name}, ' ', ${personnel.surname})`,
        certificationType: ohsPersonnelCertifications.certificationType,
        expiryDate: ohsPersonnelCertifications.expiryDate,
        status: ohsPersonnelCertifications.status,
      })
      .from(ohsPersonnelCertifications)
      .leftJoin(personnel, eq(ohsPersonnelCertifications.personnelId, personnel.id))
      .where(
        and(
          eq(ohsPersonnelCertifications.isActive, true),
          eq(ohsPersonnelCertifications.status, "active"),
          lte(ohsPersonnelCertifications.expiryDate, futureDate),
          gte(ohsPersonnelCertifications.expiryDate, today)
        )
      )
      .orderBy(ohsPersonnelCertifications.expiryDate);

    sendSuccess(res, items, `${daysAhead} gün içinde süresi dolacak sertifikalar.`);
  } catch (error) {
    console.error("İSG sertifika vade hatası:", error);
    sendError(res, "OHS_CERTS_EXPIRING_ERROR", "Süresi dolmak üzere olan sertifikalar getirilirken hata oluştu.");
  }
});

/** POST /ohs/certifications — Sertifika ekle */
router.post("/ohs/certifications", async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const parsed = insertOhsCertificationSchema.parse(req.body);
    const [created] = await db.insert(ohsPersonnelCertifications).values({ ...parsed, createdBy: userId, updatedBy: userId }).returning();
    sendSuccess(res, created, "Sertifika başarıyla eklendi.", 201);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "ZodError") return sendError(res, "VALIDATION_ERROR", "Geçersiz veri formatı.", 400);
    console.error("İSG sertifika ekleme hatası:", error);
    sendError(res, "OHS_CERT_CREATE_ERROR", "Sertifika eklenirken hata oluştu.");
  }
});

/** PUT /ohs/certifications/:id — Sertifika güncelle */
router.put("/ohs/certifications/:id", async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user?.id;
    const parsed = updateOhsCertificationSchema.parse(req.body);
    const [updated] = await db.update(ohsPersonnelCertifications).set({ ...parsed, updatedBy: userId, updatedAt: new Date() })
      .where(eq(ohsPersonnelCertifications.id, id)).returning();
    if (!updated) return sendError(res, "CERT_NOT_FOUND", "Sertifika bulunamadı.", 404);
    sendSuccess(res, updated, "Sertifika başarıyla güncellendi.");
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "ZodError") return sendError(res, "VALIDATION_ERROR", "Geçersiz veri formatı.", 400);
    console.error("İSG sertifika güncelleme hatası:", error);
    sendError(res, "OHS_CERT_UPDATE_ERROR", "Sertifika güncellenirken hata oluştu.");
  }
});

// ========================
// OLAYLAR / İŞ KAZALARI
// ========================

/** GET /ohs/incidents — Olay listesi */
router.get("/ohs/incidents", async (req: AuthRequest, res) => {
  try {
    const { search, incidentType, severity, status, pypId, dateFrom, dateTo } = req.query;
    const { limit, offset } = parsePagination(req.query as Record<string, unknown>);

    const conditions = [eq(ohsIncidents.isActive, true)];
    if (search) conditions.push(or(ilike(ohsIncidents.description, `%${search}%`), ilike(ohsIncidents.incidentCode, `%${search}%`)));
    if (incidentType) conditions.push(eq(ohsIncidents.incidentType, incidentType as string));
    if (severity) conditions.push(eq(ohsIncidents.severity, severity as string));
    if (status) conditions.push(eq(ohsIncidents.status, status as string));
    if (pypId) conditions.push(eq(ohsIncidents.pypId, parseInt(pypId as string)));
    if (dateFrom) conditions.push(gte(ohsIncidents.incidentDate, dateFrom as string));
    if (dateTo) conditions.push(lte(ohsIncidents.incidentDate, dateTo as string));

    const items = await db
      .select({
        id: ohsIncidents.id,
        incidentCode: ohsIncidents.incidentCode,
        pypId: ohsIncidents.pypId,
        pypCode: projectPyps.code,
        incidentDate: ohsIncidents.incidentDate,
        incidentTime: ohsIncidents.incidentTime,
        incidentType: ohsIncidents.incidentType,
        severity: ohsIncidents.severity,
        description: ohsIncidents.description,
        affectedPersonnelId: ohsIncidents.affectedPersonnelId,
        affectedPersonnelName: sql<string>`CONCAT(${affectedPerson.name}, ' ', ${affectedPerson.surname})`,
        status: ohsIncidents.status,
        lostWorkDays: ohsIncidents.lostWorkDays,
        reportedToSgk: ohsIncidents.reportedToSgk,
        createdAt: ohsIncidents.createdAt,
      })
      .from(ohsIncidents)
      .leftJoin(projectPyps, eq(ohsIncidents.pypId, projectPyps.id))
      .leftJoin(affectedPerson, eq(ohsIncidents.affectedPersonnelId, affectedPerson.id))
      .where(and(...conditions))
      .orderBy(desc(ohsIncidents.incidentDate))
      .limit(limit).offset(offset);

    const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(ohsIncidents).where(and(...conditions));
    sendListSuccess(res, items, Number(countResult.count), limit, offset);
  } catch (error) {
    console.error("İSG olay listesi hatası:", error);
    sendError(res, "OHS_INCIDENTS_FETCH_ERROR", "Olaylar getirilirken hata oluştu.");
  }
});

/** GET /ohs/incidents/:id — Olay detayı */
router.get("/ohs/incidents/:id", async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const [incident] = await db.select().from(ohsIncidents).where(eq(ohsIncidents.id, id));
    if (!incident) return sendError(res, "INCIDENT_NOT_FOUND", "Olay bulunamadı.", 404);

    const cas = await db.select().from(ohsCorrectiveActions)
      .where(and(eq(ohsCorrectiveActions.incidentId, id), eq(ohsCorrectiveActions.isActive, true)));

    sendSuccess(res, { ...incident, correctiveActions: cas });
  } catch (error) {
    console.error("İSG olay detay hatası:", error);
    sendError(res, "OHS_INCIDENT_DETAIL_ERROR", "Olay detayı getirilirken hata oluştu.");
  }
});

/** POST /ohs/incidents — Yeni olay kaydet */
router.post("/ohs/incidents", async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const parsed = insertOhsIncidentSchema.parse(req.body);
    const [created] = await db.insert(ohsIncidents).values({ ...parsed, createdBy: userId, updatedBy: userId }).returning();

    try {
      await createAuditLog("ohs_incidents", created.id, "INSERT", null, created, userId || null);
    } catch (auditError) {
      console.error("Audit log hatası:", auditError);
    }

    sendSuccess(res, created, "Olay başarıyla kaydedildi.", 201);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "ZodError") return sendError(res, "VALIDATION_ERROR", "Geçersiz veri formatı.", 400);
    console.error("İSG olay oluşturma hatası:", error);
    sendError(res, "OHS_INCIDENT_CREATE_ERROR", "Olay kaydedilirken hata oluştu.");
  }
});

/** PUT /ohs/incidents/:id — Olay güncelle */
router.put("/ohs/incidents/:id", async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user?.id;
    const parsed = updateOhsIncidentSchema.parse(req.body);
    const [updated] = await db.update(ohsIncidents).set({ ...parsed, updatedBy: userId, updatedAt: new Date() })
      .where(eq(ohsIncidents.id, id)).returning();
    if (!updated) return sendError(res, "INCIDENT_NOT_FOUND", "Olay bulunamadı.", 404);
    sendSuccess(res, updated, "Olay başarıyla güncellendi.");
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "ZodError") return sendError(res, "VALIDATION_ERROR", "Geçersiz veri formatı.", 400);
    console.error("İSG olay güncelleme hatası:", error);
    sendError(res, "OHS_INCIDENT_UPDATE_ERROR", "Olay güncellenirken hata oluştu.");
  }
});

/** PUT /ohs/incidents/:id/status — Olay durumu değiştir */
router.put("/ohs/incidents/:id/status", async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user?.id;
    const { status: newStatus } = req.body;

    const validTransitions: Record<string, string[]> = {
      reported: ["investigating"],
      investigating: ["resolved"],
      resolved: ["closed"],
      closed: [],
    };

    const [existing] = await db.select().from(ohsIncidents).where(eq(ohsIncidents.id, id));
    if (!existing) return sendError(res, "INCIDENT_NOT_FOUND", "Olay bulunamadı.", 404);

    const allowed = validTransitions[existing.status] || [];
    if (!allowed.includes(newStatus)) {
      return sendError(res, "INVALID_STATUS_TRANSITION", `"${existing.status}" → "${newStatus}" geçişi yapılamaz.`, 400);
    }

    const [updated] = await db.update(ohsIncidents).set({ status: newStatus, updatedBy: userId, updatedAt: new Date() })
      .where(eq(ohsIncidents.id, id)).returning();
    sendSuccess(res, updated, `Olay durumu "${newStatus}" olarak güncellendi.`);
  } catch (error) {
    console.error("İSG olay durum hatası:", error);
    sendError(res, "OHS_INCIDENT_STATUS_ERROR", "Olay durumu güncellenirken hata oluştu.");
  }
});

// ========================
// DÜZELTİCİ FAALİYETLER
// ========================

/** GET /ohs/corrective-actions — DF listesi */
router.get("/ohs/corrective-actions", async (req: AuthRequest, res) => {
  try {
    const { status, priority, inspectionId, incidentId, assignedToId } = req.query;
    const { limit, offset } = parsePagination(req.query as Record<string, unknown>);

    const conditions = [eq(ohsCorrectiveActions.isActive, true)];
    if (status) conditions.push(eq(ohsCorrectiveActions.status, status as string));
    if (priority) conditions.push(eq(ohsCorrectiveActions.priority, priority as string));
    if (inspectionId) conditions.push(eq(ohsCorrectiveActions.inspectionId, parseInt(inspectionId as string)));
    if (incidentId) conditions.push(eq(ohsCorrectiveActions.incidentId, parseInt(incidentId as string)));
    if (assignedToId) conditions.push(eq(ohsCorrectiveActions.assignedToId, parseInt(assignedToId as string)));

    const items = await db
      .select({
        id: ohsCorrectiveActions.id,
        actionCode: ohsCorrectiveActions.actionCode,
        description: ohsCorrectiveActions.description,
        priority: ohsCorrectiveActions.priority,
        assignedToId: ohsCorrectiveActions.assignedToId,
        assignedToName: sql<string>`CONCAT(${assignedPerson.name}, ' ', ${assignedPerson.surname})`,
        dueDate: ohsCorrectiveActions.dueDate,
        completedDate: ohsCorrectiveActions.completedDate,
        status: ohsCorrectiveActions.status,
        inspectionId: ohsCorrectiveActions.inspectionId,
        incidentId: ohsCorrectiveActions.incidentId,
        createdAt: ohsCorrectiveActions.createdAt,
      })
      .from(ohsCorrectiveActions)
      .leftJoin(assignedPerson, eq(ohsCorrectiveActions.assignedToId, assignedPerson.id))
      .where(and(...conditions))
      .orderBy(desc(ohsCorrectiveActions.createdAt))
      .limit(limit).offset(offset);

    const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(ohsCorrectiveActions).where(and(...conditions));
    sendListSuccess(res, items, Number(countResult.count), limit, offset);
  } catch (error) {
    console.error("DF listesi hatası:", error);
    sendError(res, "OHS_CA_FETCH_ERROR", "Düzeltici faaliyetler getirilirken hata oluştu.");
  }
});

/** GET /ohs/corrective-actions/overdue — Vadesi geçmiş DF'ler */
router.get("/ohs/corrective-actions/overdue", async (req: AuthRequest, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const items = await db
      .select({
        id: ohsCorrectiveActions.id,
        actionCode: ohsCorrectiveActions.actionCode,
        description: ohsCorrectiveActions.description,
        priority: ohsCorrectiveActions.priority,
        dueDate: ohsCorrectiveActions.dueDate,
        status: ohsCorrectiveActions.status,
        assignedToName: sql<string>`CONCAT(${assignedPerson.name}, ' ', ${assignedPerson.surname})`,
      })
      .from(ohsCorrectiveActions)
      .leftJoin(assignedPerson, eq(ohsCorrectiveActions.assignedToId, assignedPerson.id))
      .where(
        and(
          eq(ohsCorrectiveActions.isActive, true),
          lte(ohsCorrectiveActions.dueDate, today),
          sql`${ohsCorrectiveActions.status} NOT IN ('completed', 'verified', 'closed')`
        )
      )
      .orderBy(ohsCorrectiveActions.dueDate);

    sendSuccess(res, items, `${items.length} adet vadesi geçmiş düzeltici faaliyet.`);
  } catch (error) {
    console.error("Vadesi geçmiş DF hatası:", error);
    sendError(res, "OHS_CA_OVERDUE_ERROR", "Vadesi geçmiş düzeltici faaliyetler getirilirken hata oluştu.");
  }
});

/** POST /ohs/corrective-actions — Yeni DF oluştur */
router.post("/ohs/corrective-actions", async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const parsed = insertOhsCorrectiveActionSchema.parse(req.body);
    const [created] = await db.insert(ohsCorrectiveActions).values({ ...parsed, createdBy: userId, updatedBy: userId }).returning();
    sendSuccess(res, created, "Düzeltici faaliyet başarıyla oluşturuldu.", 201);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "ZodError") return sendError(res, "VALIDATION_ERROR", "Geçersiz veri formatı.", 400);
    console.error("DF oluşturma hatası:", error);
    sendError(res, "OHS_CA_CREATE_ERROR", "Düzeltici faaliyet oluşturulurken hata oluştu.");
  }
});

/** PUT /ohs/corrective-actions/:id — DF güncelle */
router.put("/ohs/corrective-actions/:id", async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user?.id;
    const parsed = updateOhsCorrectiveActionSchema.parse(req.body);
    const [updated] = await db.update(ohsCorrectiveActions).set({ ...parsed, updatedBy: userId, updatedAt: new Date() })
      .where(eq(ohsCorrectiveActions.id, id)).returning();
    if (!updated) return sendError(res, "CA_NOT_FOUND", "Düzeltici faaliyet bulunamadı.", 404);
    sendSuccess(res, updated, "Düzeltici faaliyet başarıyla güncellendi.");
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "ZodError") return sendError(res, "VALIDATION_ERROR", "Geçersiz veri formatı.", 400);
    console.error("DF güncelleme hatası:", error);
    sendError(res, "OHS_CA_UPDATE_ERROR", "Düzeltici faaliyet güncellenirken hata oluştu.");
  }
});

/** PUT /ohs/corrective-actions/:id/status — DF durumu değiştir */
router.put("/ohs/corrective-actions/:id/status", async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user?.id;
    const { status: newStatus } = req.body;

    const validTransitions: Record<string, string[]> = {
      open: ["in_progress", "closed"],
      in_progress: ["completed"],
      completed: ["verified", "in_progress"],
      verified: ["closed"],
      closed: [],
    };

    const [existing] = await db.select().from(ohsCorrectiveActions).where(eq(ohsCorrectiveActions.id, id));
    if (!existing) return sendError(res, "CA_NOT_FOUND", "Düzeltici faaliyet bulunamadı.", 404);

    const allowed = validTransitions[existing.status] || [];
    if (!allowed.includes(newStatus)) {
      return sendError(res, "INVALID_STATUS_TRANSITION", `"${existing.status}" → "${newStatus}" geçişi yapılamaz.`, 400);
    }

    const updateData: Record<string, unknown> = { status: newStatus, updatedBy: userId, updatedAt: new Date() };
    if (newStatus === "completed") updateData.completedDate = new Date().toISOString().split("T")[0];

    const [updated] = await db.update(ohsCorrectiveActions).set(updateData).where(eq(ohsCorrectiveActions.id, id)).returning();
    sendSuccess(res, updated, `Düzeltici faaliyet durumu "${newStatus}" olarak güncellendi.`);
  } catch (error) {
    console.error("DF durum hatası:", error);
    sendError(res, "OHS_CA_STATUS_ERROR", "Düzeltici faaliyet durumu güncellenirken hata oluştu.");
  }
});

/** POST /ohs/corrective-actions/:id/verify — DF doğrulama */
router.post("/ohs/corrective-actions/:id/verify", async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user?.id;
    const { verificationNotes } = req.body;

    const [existing] = await db.select().from(ohsCorrectiveActions).where(eq(ohsCorrectiveActions.id, id));
    if (!existing) return sendError(res, "CA_NOT_FOUND", "Düzeltici faaliyet bulunamadı.", 404);
    if (existing.status !== "completed") return sendError(res, "NOT_COMPLETED", "Sadece tamamlanmış DF'ler doğrulanabilir.", 400);

    // Get verifier personnel id from user
    const [updated] = await db.update(ohsCorrectiveActions).set({
      status: "verified",
      verifiedAt: new Date(),
      verificationNotes,
      updatedBy: userId,
      updatedAt: new Date(),
    }).where(eq(ohsCorrectiveActions.id, id)).returning();

    sendSuccess(res, updated, "Düzeltici faaliyet doğrulandı.");
  } catch (error) {
    console.error("DF doğrulama hatası:", error);
    sendError(res, "OHS_CA_VERIFY_ERROR", "Düzeltici faaliyet doğrulanırken hata oluştu.");
  }
});

// ========================
// DASHBOARD
// ========================

/** GET /ohs/dashboard — İSG özet istatistikler */
router.get("/ohs/dashboard", async (req: AuthRequest, res) => {
  try {
    const { projectId, pypId } = req.query;

    const baseConditions = [];
    if (projectId) baseConditions.push(sql`project_id = ${parseInt(projectId as string)}`);
    if (pypId) baseConditions.push(sql`pyp_id = ${parseInt(pypId as string)}`);

    const whereClause = baseConditions.length > 0 ? sql`WHERE ${sql.join(baseConditions, sql` AND `)}` : sql``;

    // Paralel sorgular
    const [inspectionStats, incidentStats, caStats, expiringCerts] = await Promise.all([
      db.execute(sql`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'completed' OR status = 'reviewed') as completed,
          COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
          ROUND(AVG(CASE WHEN compliance_score IS NOT NULL THEN compliance_score ELSE NULL END), 1) as avg_score
        FROM ohs_inspections
        ${whereClause}
      `),
      db.execute(sql`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE severity = 'critical' OR severity = 'fatal') as critical,
          COUNT(*) FILTER (WHERE status = 'reported' OR status = 'investigating') as open_incidents,
          COALESCE(SUM(lost_work_days), 0) as total_lost_days
        FROM ohs_incidents
        ${whereClause}
      `),
      db.execute(sql`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'open' OR status = 'in_progress') as open_actions,
          COUNT(*) FILTER (WHERE status IN ('open', 'in_progress') AND due_date < CURRENT_DATE) as overdue
        FROM ohs_corrective_actions WHERE is_active = true
      `),
      db.execute(sql`
        SELECT COUNT(*) as expiring_soon
        FROM ohs_personnel_certifications
        WHERE is_active = true AND status = 'active'
          AND expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
      `),
    ]);

    sendSuccess(res, {
      inspections: inspectionStats.rows[0],
      incidents: incidentStats.rows[0],
      correctiveActions: caStats.rows[0],
      certifications: { expiringSoon: expiringCerts.rows[0] },
    });
  } catch (error) {
    console.error("İSG dashboard hatası:", error);
    sendError(res, "OHS_DASHBOARD_ERROR", "İSG istatistikleri getirilirken hata oluştu.");
  }
});

export default router;
