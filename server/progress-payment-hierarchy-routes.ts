import { Router, type Response } from "express";
import { authenticateJWT, type AuthRequest } from "./hierarchical-auth.js";
import { db } from "./db";
import {
  progressPayments,
  progressPaymentDetails,
  progressPaymentTypes,
  progressPaymentMergeHistory,
  projects,
  projectPyps,
  teams,
  users,
} from "../shared/schema";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { createAuditLog } from "./audit-middleware";

const router = Router();
router.use(authenticateJWT);

// ========================
// YARDIMCI FONKSİYONLAR
// ========================

function sendSuccess(res: Response, data: unknown, message?: string, statusCode = 200) {
  res.status(statusCode).json({ success: true, message, data });
}

function sendError(res: Response, errorCode: string, message: string, statusCode = 500) {
  res.status(statusCode).json({ success: false, error: errorCode, message });
}

// ========================
// HAKEDİŞ BİRLEŞTİRME
// ========================

/**
 * POST /progress-payment-hierarchy/merge — Hakedişleri birleştir
 * Günlük → Ara veya Ara → Kesin birleştirme
 */
router.post("/progress-payment-hierarchy/merge", async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const { sourcePaymentIds, targetPaymentTypeId, projectId, pypId, teamId, notes } = req.body;

    if (!sourcePaymentIds || !Array.isArray(sourcePaymentIds) || sourcePaymentIds.length === 0) {
      return sendError(res, "MISSING_SOURCE_IDS", "Birleştirilecek hakediş ID'leri belirtilmelidir.", 400);
    }

    if (!targetPaymentTypeId) {
      return sendError(res, "MISSING_TARGET_TYPE", "Hedef hakediş türü belirtilmelidir.", 400);
    }

    // Kaynak hakedişleri getir
    const sourcePayments = await db
      .select()
      .from(progressPayments)
      .where(inArray(progressPayments.id, sourcePaymentIds));

    if (sourcePayments.length !== sourcePaymentIds.length) {
      return sendError(res, "PAYMENTS_NOT_FOUND", "Bazı hakedişler bulunamadı.", 404);
    }

    // Tüm kaynak hakedişler "approved" durumunda olmalı
    const notApproved = sourcePayments.filter((p) => p.status !== "approved");
    if (notApproved.length > 0) {
      return sendError(
        res,
        "PAYMENTS_NOT_APPROVED",
        `${notApproved.length} adet hakediş henüz onaylanmamış. Birleştirme için tüm hakedişler onaylanmış olmalıdır.`,
        400
      );
    }

    // Zaten birleştirilmiş olanları kontrol et
    const alreadyMerged = sourcePayments.filter((p) => p.isMerged);
    if (alreadyMerged.length > 0) {
      return sendError(
        res,
        "PAYMENTS_ALREADY_MERGED",
        `${alreadyMerged.length} adet hakediş zaten başka bir hakediş ile birleştirilmiş.`,
        400
      );
    }

    // Toplam tutarı hesapla
    const totalAmountCents = sourcePayments.reduce((sum, p) => sum + p.totalAmountCents, 0);

    // Hedef hakediş türünü kontrol et
    const [targetType] = await db
      .select()
      .from(progressPaymentTypes)
      .where(eq(progressPaymentTypes.id, targetPaymentTypeId));

    if (!targetType) {
      return sendError(res, "PAYMENT_TYPE_NOT_FOUND", "Hedef hakediş türü bulunamadı.", 404);
    }

    // Hakediş numarası oluştur
    const paymentNumber = `MERGE-${Date.now()}`;

    // Yeni birleştirilmiş hakediş oluştur
    const [mergedPayment] = await db
      .insert(progressPayments)
      .values({
        paymentNumber,
        paymentDate: new Date().toISOString().split("T")[0],
        teamId: teamId || sourcePayments[0].teamId,
        projectId: projectId || sourcePayments[0].projectId,
        pypId: pypId || sourcePayments[0].pypId || null,
        paymentTypeId: targetPaymentTypeId,
        totalAmountCents,
        status: "draft",
        notes: notes || `${sourcePayments.length} adet hakediş birleştirildi.`,
        createdBy: userId,
        updatedBy: userId,
        revisionNumber: 0,
      })
      .returning();

    // Kaynak hakedişleri "merged" olarak işaretle ve parent'ı set et
    for (const source of sourcePayments) {
      await db
        .update(progressPayments)
        .set({
          isMerged: true,
          mergedIntoId: mergedPayment.id,
          mergedAt: new Date(),
          parentPaymentId: mergedPayment.id,
          updatedBy: userId,
          updatedAt: new Date(),
        })
        .where(eq(progressPayments.id, source.id));

      // Birleştirme geçmişi kaydet
      await db.insert(progressPaymentMergeHistory).values({
        targetPaymentId: mergedPayment.id,
        sourcePaymentId: source.id,
        mergedBy: userId,
        notes,
      });
    }

    // Kaynak hakedişlerin detaylarını hedef hakediş'e kopyala
    for (const source of sourcePayments) {
      const sourceDetails = await db
        .select()
        .from(progressPaymentDetails)
        .where(and(eq(progressPaymentDetails.progressPaymentId, source.id), eq(progressPaymentDetails.isActive, true)));

      for (const detail of sourceDetails) {
        try {
          await db.insert(progressPaymentDetails).values({
            progressPaymentId: mergedPayment.id,
            materialId: detail.materialId,
            unitId: detail.unitId,
            quantity: detail.quantity,
            unitPriceCents: detail.unitPriceCents,
            lineTotalCents: detail.lineTotalCents,
            notes: `Kaynak: ${source.paymentNumber}`,
            createdBy: userId,
            updatedBy: userId,
          });
        } catch {
          // Duplicate material varsa atla (unique constraint)
        }
      }
    }

    try {
      await createAuditLog("progress_payments", mergedPayment.id, "INSERT", null, mergedPayment, userId || null);
    } catch (auditError) {
      console.error("Audit log hatası:", auditError);
    }

    sendSuccess(
      res,
      {
        mergedPayment,
        sourceCount: sourcePayments.length,
        totalAmountCents,
      },
      `${sourcePayments.length} adet hakediş başarıyla birleştirildi.`,
      201
    );
  } catch (error) {
    console.error("Hakediş birleştirme hatası:", error);
    sendError(res, "MERGE_ERROR", "Hakediş birleştirme işlemi sırasında hata oluştu.");
  }
});

// ========================
// KURUMSAL ONAY
// ========================

/**
 * POST /progress-payment-hierarchy/:id/submit-institutional — Kurumsal onaya gönder
 */
router.post("/progress-payment-hierarchy/:id/submit-institutional", async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user?.id;

    const [existing] = await db.select().from(progressPayments).where(eq(progressPayments.id, id));
    if (!existing) return sendError(res, "PAYMENT_NOT_FOUND", "Hakediş bulunamadı.", 404);

    if (existing.status !== "approved") {
      return sendError(res, "NOT_APPROVED", "Sadece onaylanmış hakedişler kurumsal onaya gönderilebilir.", 400);
    }

    const [updated] = await db
      .update(progressPayments)
      .set({
        institutionalStatus: "submitted",
        institutionalSubmittedAt: new Date(),
        institutionalSubmittedBy: userId,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(progressPayments.id, id))
      .returning();

    try {
      await createAuditLog("progress_payments", id, "UPDATE", existing, updated, userId || null);
    } catch (auditError) {
      console.error("Audit log hatası:", auditError);
    }

    sendSuccess(res, updated, "Hakediş kurumsal onaya gönderildi.");
  } catch (error) {
    console.error("Kurumsal onay gönderme hatası:", error);
    sendError(res, "INSTITUTIONAL_SUBMIT_ERROR", "Kurumsal onaya gönderme işlemi sırasında hata oluştu.");
  }
});

/**
 * PUT /progress-payment-hierarchy/:id/institutional-review — Kurumsal onay/red
 */
router.put("/progress-payment-hierarchy/:id/institutional-review", async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user?.id;
    const { decision, rejectionReason } = req.body;

    if (!decision || !["approved", "rejected", "revision_requested"].includes(decision)) {
      return sendError(res, "INVALID_DECISION", "Geçersiz karar. 'approved', 'rejected' veya 'revision_requested' olmalıdır.", 400);
    }

    const [existing] = await db.select().from(progressPayments).where(eq(progressPayments.id, id));
    if (!existing) return sendError(res, "PAYMENT_NOT_FOUND", "Hakediş bulunamadı.", 404);

    if (existing.institutionalStatus !== "submitted") {
      return sendError(res, "NOT_SUBMITTED", "Sadece kurumsal onaya gönderilmiş hakedişler değerlendirilebilir.", 400);
    }

    const updateData: Record<string, unknown> = {
      institutionalStatus: decision,
      updatedBy: userId,
      updatedAt: new Date(),
    };

    if (decision === "approved") {
      updateData.institutionalApprovedAt = new Date();
      updateData.institutionalApprovedBy = userId;
      updateData.status = "paid"; // Kurumsal onay sonrası "ödendi" durumuna geçer
    } else if (decision === "rejected") {
      updateData.institutionalRejectionReason = rejectionReason || "Belirtilmedi";
    }

    const [updated] = await db.update(progressPayments).set(updateData).where(eq(progressPayments.id, id)).returning();

    try {
      await createAuditLog("progress_payments", id, "UPDATE", existing, updated, userId || null);
    } catch (auditError) {
      console.error("Audit log hatası:", auditError);
    }

    const messages: Record<string, string> = {
      approved: "Hakediş kurumsal olarak onaylandı.",
      rejected: "Hakediş kurumsal olarak reddedildi.",
      revision_requested: "Hakediş için revizyon talep edildi.",
    };

    sendSuccess(res, updated, messages[decision]);
  } catch (error) {
    console.error("Kurumsal değerlendirme hatası:", error);
    sendError(res, "INSTITUTIONAL_REVIEW_ERROR", "Kurumsal değerlendirme sırasında hata oluştu.");
  }
});

// ========================
// REVİZYON
// ========================

/**
 * POST /progress-payment-hierarchy/:id/create-revision — Yeni revizyon oluştur
 */
router.post("/progress-payment-hierarchy/:id/create-revision", async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user?.id;
    const { revisionReason } = req.body;

    const [existing] = await db.select().from(progressPayments).where(eq(progressPayments.id, id));
    if (!existing) return sendError(res, "PAYMENT_NOT_FOUND", "Hakediş bulunamadı.", 404);

    const newRevisionNumber = (existing.revisionNumber || 0) + 1;
    const paymentNumber = `${existing.paymentNumber}-R${newRevisionNumber}`;

    // Yeni revizyon oluştur (mevcut verinin kopyası)
    const [revision] = await db
      .insert(progressPayments)
      .values({
        paymentNumber,
        paymentDate: existing.paymentDate,
        teamId: existing.teamId,
        projectId: existing.projectId,
        pypId: existing.pypId,
        paymentTypeId: existing.paymentTypeId,
        totalAmountCents: existing.totalAmountCents,
        status: "draft",
        notes: `Revizyon ${newRevisionNumber}: ${revisionReason || ""}`,
        previousRevisionId: id,
        revisionNumber: newRevisionNumber,
        revisionReason,
        parentPaymentId: existing.parentPaymentId,
        createdBy: userId,
        updatedBy: userId,
      })
      .returning();

    // Mevcut detayları kopyala
    const existingDetails = await db
      .select()
      .from(progressPaymentDetails)
      .where(and(eq(progressPaymentDetails.progressPaymentId, id), eq(progressPaymentDetails.isActive, true)));

    for (const detail of existingDetails) {
      await db.insert(progressPaymentDetails).values({
        progressPaymentId: revision.id,
        materialId: detail.materialId,
        unitId: detail.unitId,
        quantity: detail.quantity,
        unitPriceCents: detail.unitPriceCents,
        lineTotalCents: detail.lineTotalCents,
        notes: detail.notes,
        createdBy: userId,
        updatedBy: userId,
      });
    }

    try {
      await createAuditLog("progress_payments", revision.id, "INSERT", null, revision, userId || null);
    } catch (auditError) {
      console.error("Audit log hatası:", auditError);
    }

    sendSuccess(
      res,
      revision,
      `Revizyon ${newRevisionNumber} başarıyla oluşturuldu. Detaylar kopyalandı.`,
      201
    );
  } catch (error) {
    console.error("Revizyon oluşturma hatası:", error);
    sendError(res, "REVISION_CREATE_ERROR", "Revizyon oluşturulurken hata oluştu.");
  }
});

// ========================
// HİYERARŞİ SORGULARI
// ========================

/**
 * GET /progress-payment-hierarchy/:id/hierarchy — Parent/children ağaç yapısı
 */
router.get("/progress-payment-hierarchy/:id/hierarchy", async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);

    const [payment] = await db
      .select({
        id: progressPayments.id,
        paymentNumber: progressPayments.paymentNumber,
        paymentDate: progressPayments.paymentDate,
        paymentTypeId: progressPayments.paymentTypeId,
        paymentTypeName: progressPaymentTypes.name,
        totalAmountCents: progressPayments.totalAmountCents,
        status: progressPayments.status,
        parentPaymentId: progressPayments.parentPaymentId,
        isMerged: progressPayments.isMerged,
        revisionNumber: progressPayments.revisionNumber,
        institutionalStatus: progressPayments.institutionalStatus,
      })
      .from(progressPayments)
      .leftJoin(progressPaymentTypes, eq(progressPayments.paymentTypeId, progressPaymentTypes.id))
      .where(eq(progressPayments.id, id));

    if (!payment) return sendError(res, "PAYMENT_NOT_FOUND", "Hakediş bulunamadı.", 404);

    // Alt hakedişleri getir (bu hakediş'e birleştirilenler)
    const children = await db
      .select({
        id: progressPayments.id,
        paymentNumber: progressPayments.paymentNumber,
        paymentDate: progressPayments.paymentDate,
        paymentTypeName: progressPaymentTypes.name,
        totalAmountCents: progressPayments.totalAmountCents,
        status: progressPayments.status,
        isMerged: progressPayments.isMerged,
      })
      .from(progressPayments)
      .leftJoin(progressPaymentTypes, eq(progressPayments.paymentTypeId, progressPaymentTypes.id))
      .where(eq(progressPayments.parentPaymentId, id))
      .orderBy(progressPayments.paymentDate);

    // Üst hakediş (varsa)
    let parent = null;
    if (payment.parentPaymentId) {
      const [parentResult] = await db
        .select({
          id: progressPayments.id,
          paymentNumber: progressPayments.paymentNumber,
          paymentTypeName: progressPaymentTypes.name,
          totalAmountCents: progressPayments.totalAmountCents,
          status: progressPayments.status,
        })
        .from(progressPayments)
        .leftJoin(progressPaymentTypes, eq(progressPayments.paymentTypeId, progressPaymentTypes.id))
        .where(eq(progressPayments.id, payment.parentPaymentId));
      parent = parentResult || null;
    }

    sendSuccess(res, { payment, parent, children });
  } catch (error) {
    console.error("Hiyerarşi sorgu hatası:", error);
    sendError(res, "HIERARCHY_ERROR", "Hakediş hiyerarşisi getirilirken hata oluştu.");
  }
});

/**
 * GET /progress-payment-hierarchy/:id/revisions — Revizyon geçmişi
 */
router.get("/progress-payment-hierarchy/:id/revisions", async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);

    // Bu hakediş'in tüm revizyonlarını bul (önceki ve sonraki)
    const revisions = await db
      .select({
        id: progressPayments.id,
        paymentNumber: progressPayments.paymentNumber,
        revisionNumber: progressPayments.revisionNumber,
        revisionReason: progressPayments.revisionReason,
        totalAmountCents: progressPayments.totalAmountCents,
        status: progressPayments.status,
        createdAt: progressPayments.createdAt,
      })
      .from(progressPayments)
      .where(
        or(
          eq(progressPayments.id, id),
          eq(progressPayments.previousRevisionId, id),
          sql`${progressPayments.id} IN (
            WITH RECURSIVE rev_chain AS (
              SELECT id, previous_revision_id FROM progress_payments WHERE id = ${id}
              UNION ALL
              SELECT pp.id, pp.previous_revision_id FROM progress_payments pp
              INNER JOIN rev_chain rc ON pp.id = rc.previous_revision_id
            )
            SELECT id FROM rev_chain
          )`
        )
      )
      .orderBy(progressPayments.revisionNumber);

    sendSuccess(res, revisions);
  } catch (error) {
    console.error("Revizyon geçmişi hatası:", error);
    sendError(res, "REVISIONS_ERROR", "Revizyon geçmişi getirilirken hata oluştu.");
  }
});

/**
 * GET /progress-payment-hierarchy/:id/merge-history — Birleştirme geçmişi
 */
router.get("/progress-payment-hierarchy/:id/merge-history", async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);

    const history = await db
      .select({
        id: progressPaymentMergeHistory.id,
        targetPaymentId: progressPaymentMergeHistory.targetPaymentId,
        sourcePaymentId: progressPaymentMergeHistory.sourcePaymentId,
        sourcePaymentNumber: progressPayments.paymentNumber,
        mergedAt: progressPaymentMergeHistory.mergedAt,
        mergedBy: progressPaymentMergeHistory.mergedBy,
        mergedByEmail: users.email,
        notes: progressPaymentMergeHistory.notes,
      })
      .from(progressPaymentMergeHistory)
      .leftJoin(progressPayments, eq(progressPaymentMergeHistory.sourcePaymentId, progressPayments.id))
      .leftJoin(users, eq(progressPaymentMergeHistory.mergedBy, users.id))
      .where(eq(progressPaymentMergeHistory.targetPaymentId, id))
      .orderBy(progressPaymentMergeHistory.mergedAt);

    sendSuccess(res, history);
  } catch (error) {
    console.error("Birleştirme geçmişi hatası:", error);
    sendError(res, "MERGE_HISTORY_ERROR", "Birleştirme geçmişi getirilirken hata oluştu.");
  }
});

export default router;
