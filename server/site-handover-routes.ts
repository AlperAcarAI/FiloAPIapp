import { Router, type Response } from "express";
import { authenticateJWT, type AuthRequest } from "./hierarchical-auth.js";
import { db } from "./db";
import {
  siteHandovers,
  siteHandoverParticipants,
  siteHandoverItems,
  siteHandoverMaterials,
  siteHandoverPhotos,
  projectPyps,
  companies,
  personnel,
  materials,
  units,
  users,
  stockMovements,
  stockMovementItems,
  materialUnits,
  projects,
  insertSiteHandoverSchema,
  updateSiteHandoverSchema,
  insertSiteHandoverParticipantSchema,
  insertSiteHandoverItemSchema,
  updateSiteHandoverItemSchema,
  insertSiteHandoverMaterialSchema,
  updateSiteHandoverMaterialSchema,
  insertSiteHandoverPhotoSchema,
} from "../shared/schema";
import { eq, and, desc, sql, or, ilike } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { captureAuditInfo, createAuditLog } from "./audit-middleware";

const router = Router();

// Tüm route'lar JWT auth gerektirir
router.use(authenticateJWT);

// ========================
// YARDIMCI FONKSİYONLAR
// ========================

/** Pagination parametrelerini parse eder */
function parsePagination(query: Record<string, unknown>) {
  const limit = Math.min(Math.max(parseInt(String(query.limit)) || 50, 1), 200);
  const offset = Math.max(parseInt(String(query.offset)) || 0, 0);
  return { limit, offset };
}

/** Standart başarı response (tekil) */
function sendSuccess(res: Response, data: unknown, message?: string, statusCode = 200) {
  res.status(statusCode).json({ success: true, message, data });
}

/** Standart başarı response (liste + pagination) */
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

/** Standart hata response */
function sendError(res: Response, errorCode: string, message: string, statusCode = 500) {
  res.status(statusCode).json({ success: false, error: errorCode, message });
}

/** Geçerli durum geçişlerini kontrol eder */
const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ["pending_approval", "cancelled"],
  pending_approval: ["approved", "draft", "cancelled"],
  approved: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

// Alias'lar
const subcontractor = alias(companies, "subcontractor");
const creator = alias(users, "creator");

// ========================
// YER TESLİMİ ANA CRUD
// ========================

/**
 * GET /site-handovers — Yer teslimlerini listele
 */
router.get("/site-handovers", async (req: AuthRequest, res) => {
  try {
    const { search, status, pypId, projectId, subcontractorId, active } = req.query;
    const { limit, offset } = parsePagination(req.query as Record<string, unknown>);

    const whereConditions = [];

    if (search) {
      whereConditions.push(
        or(
          ilike(siteHandovers.handoverCode, `%${search}%`),
          ilike(siteHandovers.institutionName, `%${search}%`),
          ilike(siteHandovers.locationDescription, `%${search}%`)
        )
      );
    }
    if (status) whereConditions.push(eq(siteHandovers.status, status as string));
    if (pypId) whereConditions.push(eq(siteHandovers.pypId, parseInt(pypId as string)));
    if (subcontractorId) whereConditions.push(eq(siteHandovers.subcontractorId, parseInt(subcontractorId as string)));
    if (active === "true") whereConditions.push(eq(siteHandovers.isActive, true));
    else if (active === "false") whereConditions.push(eq(siteHandovers.isActive, false));

    // Proje bazlı filtreleme: projectId varsa, ilgili PYP'lere göre filtrele
    if (projectId) {
      whereConditions.push(
        sql`${siteHandovers.pypId} IN (SELECT id FROM project_pyps WHERE project_id = ${parseInt(projectId as string)})`
      );
    }

    let query = db
      .select({
        id: siteHandovers.id,
        pypId: siteHandovers.pypId,
        pypCode: projectPyps.code,
        pypName: projectPyps.name,
        handoverCode: siteHandovers.handoverCode,
        handoverDate: siteHandovers.handoverDate,
        handoverType: siteHandovers.handoverType,
        institutionName: siteHandovers.institutionName,
        institutionRepresentative: siteHandovers.institutionRepresentative,
        subcontractorId: siteHandovers.subcontractorId,
        subcontractorName: subcontractor.name,
        locationDescription: siteHandovers.locationDescription,
        status: siteHandovers.status,
        notes: siteHandovers.notes,
        isActive: siteHandovers.isActive,
        createdAt: siteHandovers.createdAt,
        updatedAt: siteHandovers.updatedAt,
      })
      .from(siteHandovers)
      .leftJoin(projectPyps, eq(siteHandovers.pypId, projectPyps.id))
      .leftJoin(subcontractor, eq(siteHandovers.subcontractorId, subcontractor.id));

    if (whereConditions.length > 0) {
      query = query.where(and(...whereConditions)) as typeof query;
    }

    const items = await query.orderBy(desc(siteHandovers.createdAt)).limit(limit).offset(offset);

    // Toplam sayı
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(siteHandovers)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

    sendListSuccess(res, items, Number(countResult.count), limit, offset);
  } catch (error) {
    console.error("Yer teslimi listesi hatası:", error);
    sendError(res, "SITE_HANDOVERS_FETCH_ERROR", "Yer teslimleri getirilirken hata oluştu.");
  }
});

/**
 * GET /site-handovers/:id — Yer teslimi detayı
 */
router.get("/site-handovers/:id", async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);

    const [handover] = await db
      .select({
        id: siteHandovers.id,
        pypId: siteHandovers.pypId,
        pypCode: projectPyps.code,
        pypName: projectPyps.name,
        handoverCode: siteHandovers.handoverCode,
        handoverDate: siteHandovers.handoverDate,
        handoverType: siteHandovers.handoverType,
        institutionName: siteHandovers.institutionName,
        institutionRepresentative: siteHandovers.institutionRepresentative,
        subcontractorId: siteHandovers.subcontractorId,
        subcontractorName: subcontractor.name,
        locationDescription: siteHandovers.locationDescription,
        coordinateX: siteHandovers.coordinateX,
        coordinateY: siteHandovers.coordinateY,
        status: siteHandovers.status,
        notes: siteHandovers.notes,
        completedAt: siteHandovers.completedAt,
        completedBy: siteHandovers.completedBy,
        isActive: siteHandovers.isActive,
        createdAt: siteHandovers.createdAt,
        createdBy: siteHandovers.createdBy,
        updatedAt: siteHandovers.updatedAt,
        updatedBy: siteHandovers.updatedBy,
      })
      .from(siteHandovers)
      .leftJoin(projectPyps, eq(siteHandovers.pypId, projectPyps.id))
      .leftJoin(subcontractor, eq(siteHandovers.subcontractorId, subcontractor.id))
      .where(eq(siteHandovers.id, id));

    if (!handover) {
      return sendError(res, "SITE_HANDOVER_NOT_FOUND", "Yer teslimi bulunamadı.", 404);
    }

    // İlişkili verileri paralel getir
    const [participantsList, itemsList, materialsList, photosList] = await Promise.all([
      db
        .select({
          id: siteHandoverParticipants.id,
          personnelId: siteHandoverParticipants.personnelId,
          personnelName: sql<string>`CONCAT(${personnel.name}, ' ', ${personnel.surname})`,
          externalName: siteHandoverParticipants.externalName,
          externalTitle: siteHandoverParticipants.externalTitle,
          externalOrganization: siteHandoverParticipants.externalOrganization,
          role: siteHandoverParticipants.role,
          signedAt: siteHandoverParticipants.signedAt,
        })
        .from(siteHandoverParticipants)
        .leftJoin(personnel, eq(siteHandoverParticipants.personnelId, personnel.id))
        .where(eq(siteHandoverParticipants.handoverId, id)),

      db
        .select()
        .from(siteHandoverItems)
        .where(and(eq(siteHandoverItems.handoverId, id), eq(siteHandoverItems.isActive, true)))
        .orderBy(siteHandoverItems.itemOrder),

      db
        .select({
          id: siteHandoverMaterials.id,
          materialId: siteHandoverMaterials.materialId,
          materialName: materials.name,
          unitId: siteHandoverMaterials.unitId,
          unitName: units.name,
          estimatedQuantity: siteHandoverMaterials.estimatedQuantity,
          actualQuantity: siteHandoverMaterials.actualQuantity,
          notes: siteHandoverMaterials.notes,
          isActive: siteHandoverMaterials.isActive,
        })
        .from(siteHandoverMaterials)
        .leftJoin(materials, eq(siteHandoverMaterials.materialId, materials.id))
        .leftJoin(units, eq(siteHandoverMaterials.unitId, units.id))
        .where(and(eq(siteHandoverMaterials.handoverId, id), eq(siteHandoverMaterials.isActive, true))),

      db
        .select()
        .from(siteHandoverPhotos)
        .where(eq(siteHandoverPhotos.handoverId, id))
        .orderBy(desc(siteHandoverPhotos.createdAt)),
    ]);

    sendSuccess(res, {
      ...handover,
      participants: participantsList,
      items: itemsList,
      materials: materialsList,
      photos: photosList,
    });
  } catch (error) {
    console.error("Yer teslimi detay hatası:", error);
    sendError(res, "SITE_HANDOVER_DETAIL_ERROR", "Yer teslimi detayı getirilirken hata oluştu.");
  }
});

/**
 * POST /site-handovers — Yeni yer teslimi oluştur
 */
router.post("/site-handovers", async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const parsed = insertSiteHandoverSchema.parse(req.body);

    // PYP kontrolü
    const [pyp] = await db
      .select({ id: projectPyps.id, status: projectPyps.status })
      .from(projectPyps)
      .where(eq(projectPyps.id, parsed.pypId));

    if (!pyp) {
      return sendError(res, "PYP_NOT_FOUND", "Belirtilen PYP bulunamadı.", 404);
    }

    const [created] = await db
      .insert(siteHandovers)
      .values({
        ...parsed,
        createdBy: userId,
        updatedBy: userId,
      })
      .returning();

    // Audit log
    try {
      await createAuditLog("site_handovers", created.id, "INSERT", null, created, userId || null);
    } catch (auditError) {
      console.error("Audit log hatası:", auditError);
    }

    sendSuccess(res, created, "Yer teslimi başarıyla oluşturuldu.", 201);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "ZodError") {
      return sendError(res, "VALIDATION_ERROR", "Geçersiz veri formatı.", 400);
    }
    console.error("Yer teslimi oluşturma hatası:", error);
    sendError(res, "SITE_HANDOVER_CREATE_ERROR", "Yer teslimi oluşturulurken hata oluştu.");
  }
});

/**
 * PUT /site-handovers/:id — Yer teslimi güncelle
 */
router.put("/site-handovers/:id", async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user?.id;
    const parsed = updateSiteHandoverSchema.parse(req.body);

    // Mevcut kaydı kontrol et
    const [existing] = await db
      .select()
      .from(siteHandovers)
      .where(eq(siteHandovers.id, id));

    if (!existing) {
      return sendError(res, "SITE_HANDOVER_NOT_FOUND", "Yer teslimi bulunamadı.", 404);
    }

    if (existing.status === "completed" || existing.status === "cancelled") {
      return sendError(res, "SITE_HANDOVER_LOCKED", "Tamamlanmış veya iptal edilmiş yer teslimi güncellenemez.", 400);
    }

    const [updated] = await db
      .update(siteHandovers)
      .set({
        ...parsed,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(siteHandovers.id, id))
      .returning();

    try {
      await createAuditLog("site_handovers", id, "UPDATE", existing, updated, userId || null);
    } catch (auditError) {
      console.error("Audit log hatası:", auditError);
    }

    sendSuccess(res, updated, "Yer teslimi başarıyla güncellendi.");
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "ZodError") {
      return sendError(res, "VALIDATION_ERROR", "Geçersiz veri formatı.", 400);
    }
    console.error("Yer teslimi güncelleme hatası:", error);
    sendError(res, "SITE_HANDOVER_UPDATE_ERROR", "Yer teslimi güncellenirken hata oluştu.");
  }
});

/**
 * DELETE /site-handovers/:id — Soft delete
 */
router.delete("/site-handovers/:id", async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user?.id;

    const [existing] = await db.select().from(siteHandovers).where(eq(siteHandovers.id, id));
    if (!existing) {
      return sendError(res, "SITE_HANDOVER_NOT_FOUND", "Yer teslimi bulunamadı.", 404);
    }

    const [updated] = await db
      .update(siteHandovers)
      .set({ isActive: false, updatedBy: userId, updatedAt: new Date() })
      .where(eq(siteHandovers.id, id))
      .returning();

    try {
      await createAuditLog("site_handovers", id, "UPDATE", existing, updated, userId || null);
    } catch (auditError) {
      console.error("Audit log hatası:", auditError);
    }

    sendSuccess(res, null, "Yer teslimi başarıyla silindi.");
  } catch (error) {
    console.error("Yer teslimi silme hatası:", error);
    sendError(res, "SITE_HANDOVER_DELETE_ERROR", "Yer teslimi silinirken hata oluştu.");
  }
});

// ========================
// DURUM YÖNETİMİ
// ========================

/**
 * PUT /site-handovers/:id/status — Durum değiştir
 */
router.put("/site-handovers/:id/status", async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user?.id;
    const { status: newStatus } = req.body;

    if (!newStatus) {
      return sendError(res, "MISSING_STATUS", "Yeni durum belirtilmelidir.", 400);
    }

    const [existing] = await db.select().from(siteHandovers).where(eq(siteHandovers.id, id));
    if (!existing) {
      return sendError(res, "SITE_HANDOVER_NOT_FOUND", "Yer teslimi bulunamadı.", 404);
    }

    const currentStatus = existing.status;
    const validTransitions = VALID_STATUS_TRANSITIONS[currentStatus] || [];
    if (!validTransitions.includes(newStatus)) {
      return sendError(
        res,
        "INVALID_STATUS_TRANSITION",
        `"${currentStatus}" durumundan "${newStatus}" durumuna geçiş yapılamaz.`,
        400
      );
    }

    // pending_approval geçişi için ön koşul kontrolü
    if (newStatus === "pending_approval") {
      const [participantCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(siteHandoverParticipants)
        .where(eq(siteHandoverParticipants.handoverId, id));

      if (Number(participantCount.count) === 0) {
        return sendError(res, "NO_PARTICIPANTS", "Onaya göndermek için en az 1 katılımcı gereklidir.", 400);
      }

      const [itemCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(siteHandoverItems)
        .where(and(eq(siteHandoverItems.handoverId, id), eq(siteHandoverItems.isActive, true)));

      if (Number(itemCount.count) === 0) {
        return sendError(res, "NO_ITEMS", "Onaya göndermek için en az 1 checklist maddesi gereklidir.", 400);
      }
    }

    const updateData: Record<string, unknown> = {
      status: newStatus,
      updatedBy: userId,
      updatedAt: new Date(),
    };

    const [updated] = await db.update(siteHandovers).set(updateData).where(eq(siteHandovers.id, id)).returning();

    try {
      await createAuditLog("site_handovers", id, "UPDATE", existing, updated, userId || null);
    } catch (auditError) {
      console.error("Audit log hatası:", auditError);
    }

    sendSuccess(res, updated, `Durum "${newStatus}" olarak güncellendi.`);
  } catch (error) {
    console.error("Yer teslimi durum güncelleme hatası:", error);
    sendError(res, "STATUS_UPDATE_ERROR", "Durum güncellenirken hata oluştu.");
  }
});

/**
 * POST /site-handovers/:id/complete — Yer teslimini tamamla
 * Side effect: PYP status → "ongoing", taşeron atanmış olmalı
 */
router.post("/site-handovers/:id/complete", async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user?.id;

    const [existing] = await db.select().from(siteHandovers).where(eq(siteHandovers.id, id));
    if (!existing) {
      return sendError(res, "SITE_HANDOVER_NOT_FOUND", "Yer teslimi bulunamadı.", 404);
    }

    if (existing.status !== "approved") {
      return sendError(res, "NOT_APPROVED", "Sadece onaylanmış yer teslimleri tamamlanabilir.", 400);
    }

    // Taşeron atanmış olmalı
    if (!existing.subcontractorId) {
      return sendError(res, "NO_SUBCONTRACTOR", "Tamamlamak için taşeron atanmış olmalıdır.", 400);
    }

    // Çözülmemiş kusur (defect) kontrolü
    const [unresolvedDefects] = await db
      .select({ count: sql<number>`count(*)` })
      .from(siteHandoverItems)
      .where(
        and(
          eq(siteHandoverItems.handoverId, id),
          eq(siteHandoverItems.isActive, true),
          eq(siteHandoverItems.status, "defect"),
          sql`${siteHandoverItems.resolvedAt} IS NULL`
        )
      );

    if (Number(unresolvedDefects.count) > 0) {
      return sendError(
        res,
        "UNRESOLVED_DEFECTS",
        `${unresolvedDefects.count} adet çözülmemiş kusur var. Tamamlamak için tüm kusurlar çözülmelidir.`,
        400
      );
    }

    // Yer teslimini tamamla
    const [updated] = await db
      .update(siteHandovers)
      .set({
        status: "completed",
        completedAt: new Date(),
        completedBy: userId,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(siteHandovers.id, id))
      .returning();

    // PYP durumunu "ongoing" yap
    await db
      .update(projectPyps)
      .set({
        status: "ongoing",
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(projectPyps.id, existing.pypId));

    try {
      await createAuditLog("site_handovers", id, "UPDATE", existing, updated, userId || null);
      await createAuditLog("project_pyps", existing.pypId, "UPDATE", { status: "planned" }, { status: "ongoing" }, userId || null);
    } catch (auditError) {
      console.error("Audit log hatası:", auditError);
    }

    sendSuccess(res, updated, "Yer teslimi tamamlandı. PYP durumu 'devam ediyor' olarak güncellendi.");
  } catch (error) {
    console.error("Yer teslimi tamamlama hatası:", error);
    sendError(res, "COMPLETE_ERROR", "Yer teslimi tamamlanırken hata oluştu.");
  }
});

// ========================
// KATILIMCILAR
// ========================

/**
 * GET /site-handovers/:id/participants
 */
router.get("/site-handovers/:id/participants", async (req: AuthRequest, res) => {
  try {
    const handoverId = parseInt(req.params.id);

    const items = await db
      .select({
        id: siteHandoverParticipants.id,
        personnelId: siteHandoverParticipants.personnelId,
        personnelName: sql<string>`CONCAT(${personnel.name}, ' ', ${personnel.surname})`,
        externalName: siteHandoverParticipants.externalName,
        externalTitle: siteHandoverParticipants.externalTitle,
        externalOrganization: siteHandoverParticipants.externalOrganization,
        role: siteHandoverParticipants.role,
        signedAt: siteHandoverParticipants.signedAt,
        signatureData: siteHandoverParticipants.signatureData,
      })
      .from(siteHandoverParticipants)
      .leftJoin(personnel, eq(siteHandoverParticipants.personnelId, personnel.id))
      .where(eq(siteHandoverParticipants.handoverId, handoverId));

    sendSuccess(res, items);
  } catch (error) {
    console.error("Katılımcı listesi hatası:", error);
    sendError(res, "PARTICIPANTS_FETCH_ERROR", "Katılımcılar getirilirken hata oluştu.");
  }
});

/**
 * POST /site-handovers/:id/participants — Katılımcı ekle
 */
router.post("/site-handovers/:id/participants", async (req: AuthRequest, res) => {
  try {
    const handoverId = parseInt(req.params.id);
    const parsed = insertSiteHandoverParticipantSchema.parse({ ...req.body, handoverId });

    const [created] = await db.insert(siteHandoverParticipants).values(parsed).returning();

    sendSuccess(res, created, "Katılımcı başarıyla eklendi.", 201);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "ZodError") {
      return sendError(res, "VALIDATION_ERROR", "Geçersiz veri formatı.", 400);
    }
    console.error("Katılımcı ekleme hatası:", error);
    sendError(res, "PARTICIPANT_CREATE_ERROR", "Katılımcı eklenirken hata oluştu.");
  }
});

/**
 * DELETE /site-handovers/:handoverId/participants/:participantId
 */
router.delete("/site-handovers/:handoverId/participants/:participantId", async (req: AuthRequest, res) => {
  try {
    const participantId = parseInt(req.params.participantId);

    const [deleted] = await db
      .delete(siteHandoverParticipants)
      .where(eq(siteHandoverParticipants.id, participantId))
      .returning();

    if (!deleted) {
      return sendError(res, "PARTICIPANT_NOT_FOUND", "Katılımcı bulunamadı.", 404);
    }

    sendSuccess(res, null, "Katılımcı başarıyla silindi.");
  } catch (error) {
    console.error("Katılımcı silme hatası:", error);
    sendError(res, "PARTICIPANT_DELETE_ERROR", "Katılımcı silinirken hata oluştu.");
  }
});

// ========================
// CHECKLIST / PUNCH LIST
// ========================

/**
 * GET /site-handovers/:id/items
 */
router.get("/site-handovers/:id/items", async (req: AuthRequest, res) => {
  try {
    const handoverId = parseInt(req.params.id);

    const items = await db
      .select()
      .from(siteHandoverItems)
      .where(and(eq(siteHandoverItems.handoverId, handoverId), eq(siteHandoverItems.isActive, true)))
      .orderBy(siteHandoverItems.itemOrder);

    sendSuccess(res, items);
  } catch (error) {
    console.error("Checklist listesi hatası:", error);
    sendError(res, "ITEMS_FETCH_ERROR", "Checklist maddeleri getirilirken hata oluştu.");
  }
});

/**
 * POST /site-handovers/:id/items — Checklist maddesi ekle
 */
router.post("/site-handovers/:id/items", async (req: AuthRequest, res) => {
  try {
    const handoverId = parseInt(req.params.id);
    const userId = req.user?.id;
    const parsed = insertSiteHandoverItemSchema.parse({ ...req.body, handoverId });

    const [created] = await db
      .insert(siteHandoverItems)
      .values({ ...parsed, createdBy: userId })
      .returning();

    sendSuccess(res, created, "Checklist maddesi başarıyla eklendi.", 201);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "ZodError") {
      return sendError(res, "VALIDATION_ERROR", "Geçersiz veri formatı.", 400);
    }
    console.error("Checklist maddesi ekleme hatası:", error);
    sendError(res, "ITEM_CREATE_ERROR", "Checklist maddesi eklenirken hata oluştu.");
  }
});

/**
 * PUT /site-handovers/:handoverId/items/:itemId — Checklist maddesi güncelle
 */
router.put("/site-handovers/:handoverId/items/:itemId", async (req: AuthRequest, res) => {
  try {
    const itemId = parseInt(req.params.itemId);
    const userId = req.user?.id;
    const parsed = updateSiteHandoverItemSchema.parse(req.body);

    // Kusur çözümü: resolvedAt/resolvedBy otomatik set
    const updateData: Record<string, unknown> = { ...parsed };
    if (parsed.status && parsed.status !== "defect") {
      const [existing] = await db.select().from(siteHandoverItems).where(eq(siteHandoverItems.id, itemId));
      if (existing?.status === "defect" && !existing.resolvedAt) {
        updateData.resolvedAt = new Date();
        updateData.resolvedBy = userId;
      }
    }

    const [updated] = await db
      .update(siteHandoverItems)
      .set(updateData)
      .where(eq(siteHandoverItems.id, itemId))
      .returning();

    if (!updated) {
      return sendError(res, "ITEM_NOT_FOUND", "Checklist maddesi bulunamadı.", 404);
    }

    sendSuccess(res, updated, "Checklist maddesi başarıyla güncellendi.");
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "ZodError") {
      return sendError(res, "VALIDATION_ERROR", "Geçersiz veri formatı.", 400);
    }
    console.error("Checklist maddesi güncelleme hatası:", error);
    sendError(res, "ITEM_UPDATE_ERROR", "Checklist maddesi güncellenirken hata oluştu.");
  }
});

/**
 * DELETE /site-handovers/:handoverId/items/:itemId — Soft delete
 */
router.delete("/site-handovers/:handoverId/items/:itemId", async (req: AuthRequest, res) => {
  try {
    const itemId = parseInt(req.params.itemId);

    const [updated] = await db
      .update(siteHandoverItems)
      .set({ isActive: false })
      .where(eq(siteHandoverItems.id, itemId))
      .returning();

    if (!updated) {
      return sendError(res, "ITEM_NOT_FOUND", "Checklist maddesi bulunamadı.", 404);
    }

    sendSuccess(res, null, "Checklist maddesi başarıyla silindi.");
  } catch (error) {
    console.error("Checklist maddesi silme hatası:", error);
    sendError(res, "ITEM_DELETE_ERROR", "Checklist maddesi silinirken hata oluştu.");
  }
});

// ========================
// MALZEME İHTİYAÇ LİSTESİ
// ========================

/**
 * GET /site-handovers/:id/materials
 */
router.get("/site-handovers/:id/materials", async (req: AuthRequest, res) => {
  try {
    const handoverId = parseInt(req.params.id);

    const items = await db
      .select({
        id: siteHandoverMaterials.id,
        materialId: siteHandoverMaterials.materialId,
        materialName: materials.name,
        unitId: siteHandoverMaterials.unitId,
        unitName: units.name,
        estimatedQuantity: siteHandoverMaterials.estimatedQuantity,
        actualQuantity: siteHandoverMaterials.actualQuantity,
        notes: siteHandoverMaterials.notes,
        isActive: siteHandoverMaterials.isActive,
      })
      .from(siteHandoverMaterials)
      .leftJoin(materials, eq(siteHandoverMaterials.materialId, materials.id))
      .leftJoin(units, eq(siteHandoverMaterials.unitId, units.id))
      .where(and(eq(siteHandoverMaterials.handoverId, handoverId), eq(siteHandoverMaterials.isActive, true)));

    sendSuccess(res, items);
  } catch (error) {
    console.error("Malzeme listesi hatası:", error);
    sendError(res, "MATERIALS_FETCH_ERROR", "Malzeme listesi getirilirken hata oluştu.");
  }
});

/**
 * POST /site-handovers/:id/materials — Malzeme ekle
 */
router.post("/site-handovers/:id/materials", async (req: AuthRequest, res) => {
  try {
    const handoverId = parseInt(req.params.id);
    const userId = req.user?.id;
    const parsed = insertSiteHandoverMaterialSchema.parse({ ...req.body, handoverId });

    // Malzeme-birim ilişkisi yoksa otomatik oluştur
    const [existingMU] = await db
      .select({ id: materialUnits.id })
      .from(materialUnits)
      .where(and(eq(materialUnits.materialId, parsed.materialId), eq(materialUnits.unitId, parsed.unitId)));

    if (!existingMU) {
      try {
        await db.insert(materialUnits).values({
          materialId: parsed.materialId,
          unitId: parsed.unitId,
          isPrimary: false,
          isActive: true,
          createdBy: userId,
          updatedBy: userId,
        });
      } catch {
        // unique constraint varsa atla (race condition)
      }
    }

    const [created] = await db
      .insert(siteHandoverMaterials)
      .values({ ...parsed, createdBy: userId, updatedBy: userId })
      .returning();

    sendSuccess(res, created, "Malzeme başarıyla eklendi.", 201);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "ZodError") {
      return sendError(res, "VALIDATION_ERROR", "Geçersiz veri formatı.", 400);
    }
    console.error("Malzeme ekleme hatası:", error);
    sendError(res, "MATERIAL_CREATE_ERROR", "Malzeme eklenirken hata oluştu.");
  }
});

/**
 * PUT /site-handovers/:handoverId/materials/:materialId — Malzeme güncelle
 */
router.put("/site-handovers/:handoverId/materials/:materialId", async (req: AuthRequest, res) => {
  try {
    const materialId = parseInt(req.params.materialId);
    const userId = req.user?.id;
    const parsed = updateSiteHandoverMaterialSchema.parse(req.body);

    const [updated] = await db
      .update(siteHandoverMaterials)
      .set({ ...parsed, updatedBy: userId, updatedAt: new Date() })
      .where(eq(siteHandoverMaterials.id, materialId))
      .returning();

    if (!updated) {
      return sendError(res, "MATERIAL_NOT_FOUND", "Malzeme bulunamadı.", 404);
    }

    sendSuccess(res, updated, "Malzeme başarıyla güncellendi.");
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "ZodError") {
      return sendError(res, "VALIDATION_ERROR", "Geçersiz veri formatı.", 400);
    }
    console.error("Malzeme güncelleme hatası:", error);
    sendError(res, "MATERIAL_UPDATE_ERROR", "Malzeme güncellenirken hata oluştu.");
  }
});

/**
 * DELETE /site-handovers/:handoverId/materials/:materialId — Soft delete
 */
router.delete("/site-handovers/:handoverId/materials/:materialId", async (req: AuthRequest, res) => {
  try {
    const materialId = parseInt(req.params.materialId);
    const userId = req.user?.id;

    const [updated] = await db
      .update(siteHandoverMaterials)
      .set({ isActive: false, updatedBy: userId, updatedAt: new Date() })
      .where(eq(siteHandoverMaterials.id, materialId))
      .returning();

    if (!updated) {
      return sendError(res, "MATERIAL_NOT_FOUND", "Malzeme bulunamadı.", 404);
    }

    sendSuccess(res, null, "Malzeme başarıyla silindi.");
  } catch (error) {
    console.error("Malzeme silme hatası:", error);
    sendError(res, "MATERIAL_DELETE_ERROR", "Malzeme silinirken hata oluştu.");
  }
});

// ========================
// FOTOĞRAFLAR
// ========================

/**
 * GET /site-handovers/:id/photos
 */
router.get("/site-handovers/:id/photos", async (req: AuthRequest, res) => {
  try {
    const handoverId = parseInt(req.params.id);

    const items = await db
      .select()
      .from(siteHandoverPhotos)
      .where(eq(siteHandoverPhotos.handoverId, handoverId))
      .orderBy(desc(siteHandoverPhotos.createdAt));

    sendSuccess(res, items);
  } catch (error) {
    console.error("Fotoğraf listesi hatası:", error);
    sendError(res, "PHOTOS_FETCH_ERROR", "Fotoğraflar getirilirken hata oluştu.");
  }
});

/**
 * POST /site-handovers/:id/photos — Fotoğraf ekle
 */
router.post("/site-handovers/:id/photos", async (req: AuthRequest, res) => {
  try {
    const handoverId = parseInt(req.params.id);
    const userId = req.user?.id;
    const parsed = insertSiteHandoverPhotoSchema.parse({ ...req.body, handoverId });

    const [created] = await db
      .insert(siteHandoverPhotos)
      .values({ ...parsed, createdBy: userId })
      .returning();

    sendSuccess(res, created, "Fotoğraf başarıyla eklendi.", 201);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "ZodError") {
      return sendError(res, "VALIDATION_ERROR", "Geçersiz veri formatı.", 400);
    }
    console.error("Fotoğraf ekleme hatası:", error);
    sendError(res, "PHOTO_CREATE_ERROR", "Fotoğraf eklenirken hata oluştu.");
  }
});

/**
 * DELETE /site-handovers/:handoverId/photos/:photoId
 */
router.delete("/site-handovers/:handoverId/photos/:photoId", async (req: AuthRequest, res) => {
  try {
    const photoId = parseInt(req.params.photoId);

    const [deleted] = await db
      .delete(siteHandoverPhotos)
      .where(eq(siteHandoverPhotos.id, photoId))
      .returning();

    if (!deleted) {
      return sendError(res, "PHOTO_NOT_FOUND", "Fotoğraf bulunamadı.", 404);
    }

    sendSuccess(res, null, "Fotoğraf başarıyla silindi.");
  } catch (error) {
    console.error("Fotoğraf silme hatası:", error);
    sendError(res, "PHOTO_DELETE_ERROR", "Fotoğraf silinirken hata oluştu.");
  }
});

// ========================
// STOK SİSTEMİ ENTEGRASYONU
// ========================

/**
 * POST /site-handovers/:id/materials/create-stock-request
 * Yer teslimindeki malzeme ihtiyaç listesinden stok çıkış hareketi oluşturur.
 * Mevcut stok sistemiyle (stock_movements + stock_movement_items) entegre çalışır.
 */
router.post("/site-handovers/:id/materials/create-stock-request", async (req: AuthRequest, res) => {
  try {
    const handoverId = parseInt(req.params.id);
    const userId = req.user?.id;
    const { sourceWarehouseId, companyId } = req.body;

    if (!sourceWarehouseId) {
      return sendError(res, "MISSING_WAREHOUSE", "Kaynak depo belirtilmelidir.", 400);
    }

    // Yer teslimi kontrolü
    const [handover] = await db
      .select({
        id: siteHandovers.id,
        handoverCode: siteHandovers.handoverCode,
        pypId: siteHandovers.pypId,
        subcontractorId: siteHandovers.subcontractorId,
        status: siteHandovers.status,
      })
      .from(siteHandovers)
      .where(eq(siteHandovers.id, handoverId));

    if (!handover) {
      return sendError(res, "SITE_HANDOVER_NOT_FOUND", "Yer teslimi bulunamadı.", 404);
    }

    if (handover.status !== "approved" && handover.status !== "completed") {
      return sendError(res, "HANDOVER_NOT_READY", "Stok çıkışı için yer teslimi onaylanmış veya tamamlanmış olmalıdır.", 400);
    }

    // PYP'den proje bilgisini al
    const [pyp] = await db
      .select({ projectId: projectPyps.projectId })
      .from(projectPyps)
      .where(eq(projectPyps.id, handover.pypId));

    // Aktif malzeme listesini getir
    const materialsList = await db
      .select({
        materialId: siteHandoverMaterials.materialId,
        unitId: siteHandoverMaterials.unitId,
        estimatedQuantity: siteHandoverMaterials.estimatedQuantity,
      })
      .from(siteHandoverMaterials)
      .where(
        and(
          eq(siteHandoverMaterials.handoverId, handoverId),
          eq(siteHandoverMaterials.isActive, true)
        )
      );

    if (materialsList.length === 0) {
      return sendError(res, "NO_MATERIALS", "Malzeme ihtiyaç listesi boş.", 400);
    }

    // Benzersiz hareket kodu oluştur
    const year = new Date().getFullYear();
    const [lastMovement] = await db
      .select({ movementCode: stockMovements.movementCode })
      .from(stockMovements)
      .where(sql`movement_code LIKE ${"STK-" + year + "-%"}`)
      .orderBy(desc(stockMovements.id))
      .limit(1);

    let nextNum = 1;
    if (lastMovement) {
      const parts = lastMovement.movementCode.split("-");
      nextNum = (parseInt(parts[2]) || 0) + 1;
    }
    const movementCode = `STK-${year}-${String(nextNum).padStart(6, "0")}`;

    // Stok çıkış hareketi oluştur
    const [movement] = await db
      .insert(stockMovements)
      .values({
        movementCode,
        movementType: "cikis",
        movementDate: new Date(),
        sourceWarehouseId: parseInt(sourceWarehouseId),
        projectId: pyp?.projectId || null,
        companyId: companyId ? parseInt(companyId) : (handover.subcontractorId || null),
        isFree: false,
        referenceType: "taseron_teslim",
        referenceNo: handover.handoverCode,
        description: `Yer teslimi ${handover.handoverCode} malzeme çıkışı`,
        status: "taslak",
        createdBy: userId,
        updatedBy: userId,
      })
      .returning();

    // Her malzeme için hareket kalemi oluştur
    let itemCount = 0;
    for (const mat of materialsList) {
      await db.insert(stockMovementItems).values({
        movementId: movement.id,
        materialId: mat.materialId,
        unitId: mat.unitId,
        quantity: mat.estimatedQuantity,
        unitPriceCents: 0,
        lineTotalCents: 0,
        isFree: false,
        notes: `Yer teslimi: ${handover.handoverCode}`,
      });
      itemCount++;
    }

    try {
      await createAuditLog("stock_movements", movement.id, "INSERT", null, movement, userId || null);
    } catch (auditError) {
      console.error("Audit log hatası:", auditError);
    }

    sendSuccess(
      res,
      {
        stockMovement: movement,
        itemCount,
        handoverCode: handover.handoverCode,
      },
      `${itemCount} kalem malzeme için stok çıkış talebi oluşturuldu. Hareket kodu: ${movementCode}`,
      201
    );
  } catch (error) {
    console.error("Stok çıkış talebi hatası:", error);
    sendError(res, "STOCK_REQUEST_ERROR", "Stok çıkış talebi oluşturulurken hata oluştu.");
  }
});

export default router;
