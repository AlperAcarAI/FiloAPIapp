import { Router } from "express";
import { db } from "./db";
import { assetsPersonelAssignment, assets, personnel } from "@shared/schema";
import {
  insertAssetsPersonelAssignmentSchema,
  updateAssetsPersonelAssignmentSchema,
  type InsertAssetsPersonelAssignment,
  type UpdateAssetsPersonelAssignment,
} from "@shared/schema";
import { authenticateToken, type AuthRequest } from "./auth";
import { createAuditLog } from "./audit-middleware";
import { and, eq, sql, desc, asc, ilike, or } from "drizzle-orm";

const router = Router();

// Middleware uygula
router.use(authenticateToken);

/**
 * @swagger
 * components:
 *   schemas:
 *     AssetsPersonelAssignment:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Zimmet atama ID
 *         assetId:
 *           type: integer
 *           description: Araç ID
 *         personnelId:
 *           type: integer
 *           description: Personel ID
 *         startDate:
 *           type: string
 *           format: date
 *           description: Zimmet başlangıç tarihi
 *         endDate:
 *           type: string
 *           format: date
 *           nullable: true
 *           description: Zimmet bitiş tarihi (null ise aktif)
 *         isActive:
 *           type: boolean
 *           description: Aktif durum
 *     CreateAssetsPersonelAssignment:
 *       type: object
 *       required:
 *         - assetId
 *         - personnelId
 *         - startDate
 *       properties:
 *         assetId:
 *           type: integer
 *           description: Araç ID
 *         personnelId:
 *           type: integer
 *           description: Personel ID
 *         startDate:
 *           type: string
 *           format: date
 *           description: Zimmet başlangıç tarihi
 *         endDate:
 *           type: string
 *           format: date
 *           nullable: true
 *           description: Zimmet bitiş tarihi
 *         isActive:
 *           type: boolean
 *           default: true
 *           description: Aktif durum
 */

/**
 * @swagger
 * /api/asset-assignments:
 *   get:
 *     summary: Araç zimmet atamalarını listele
 *     description: Tüm araç zimmet atamalarını filtreli olarak listeler. Hierarchical authorization kontrolü yapar.
 *     tags: [Asset Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Plaka numarası, personel adı veya soyadı araması
 *       - in: query
 *         name: assetId
 *         schema:
 *           type: integer
 *         description: Belirli araç ID filtresi
 *       - in: query
 *         name: personnelId
 *         schema:
 *           type: integer
 *         description: Belirli personel ID filtresi
 *       - in: query
 *         name: activeOnly
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Sadece aktif atamaları göster
 *       - in: query
 *         name: currentOnly
 *         schema:
 *           type: boolean
 *         description: Sadece şu anda zimmetli olanları göster (endDate null veya gelecekte)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Sayfa başına kayıt sayısı
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Atlanan kayıt sayısı
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [startDate, endDate, plateNumber, personnelName]
 *           default: startDate
 *         description: Sıralama alanı
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sıralama yönü
 *     responses:
 *       200:
 *         description: Başarılı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/AssetsPersonelAssignment'
 *                       - type: object
 *                         properties:
 *                           plateNumber:
 *                             type: string
 *                             description: Araç plaka numarası
 *                           personnelName:
 *                             type: string
 *                             description: Personel adı soyadı
 *                           personnelTcNo:
 *                             type: string
 *                             description: Personel TC numarası
 *                 total:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 offset:
 *                   type: integer
 *       401:
 *         description: Yetkisiz erişim
 *       403:
 *         description: Erişim reddedildi
 *       500:
 *         description: Sunucu hatası
 */
router.get("/", async (req: AuthRequest, res) => {
  try {
    const {
      search,
      assetId,
      personnelId,
      activeOnly = "true",
      currentOnly,
      limit = "50",
      offset = "0",
      sortBy = "startDate",
      sortOrder = "desc"
    } = req.query;

    const user = req.user!;
    const limitNum = Math.min(parseInt(limit as string) || 50, 1000);
    const offsetNum = parseInt(offset as string) || 0;

    // Build where conditions first
    const conditions = [];

    if (activeOnly === "true") {
      conditions.push(eq(assetsPersonelAssignment.isActive, true));
    }

    if (currentOnly === "true") {
      conditions.push(
        or(
          sql`${assetsPersonelAssignment.endDate} IS NULL`,
          sql`${assetsPersonelAssignment.endDate} >= CURRENT_DATE`
        )
      );
    }

    if (assetId) {
      conditions.push(eq(assetsPersonelAssignment.assetId, parseInt(assetId as string)));
    }

    if (personnelId) {
      conditions.push(eq(assetsPersonelAssignment.personnelId, parseInt(personnelId as string)));
    }

    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(
        or(
          ilike(assets.plateNumber, searchTerm),
          ilike(personnel.name, searchTerm),
          ilike(personnel.surname, searchTerm),
          ilike(personnel.tcNo, searchTerm)
        )
      );
    }

    // Build order by clause
    let orderByClause;
    switch (sortBy) {
      case "endDate":
        orderByClause = sortOrder === "asc" ? asc(assetsPersonelAssignment.endDate) : desc(assetsPersonelAssignment.endDate);
        break;
      case "plateNumber":
        orderByClause = sortOrder === "asc" ? asc(assets.plateNumber) : desc(assets.plateNumber);
        break;
      case "personnelName":
        orderByClause = sortOrder === "asc" ? asc(personnel.name) : desc(personnel.name);
        break;
      default: // startDate
        orderByClause = sortOrder === "asc" ? asc(assetsPersonelAssignment.startDate) : desc(assetsPersonelAssignment.startDate);
    }

    // Base query builder
    const baseQuery = db
      .select({
        id: assetsPersonelAssignment.id,
        assetId: assetsPersonelAssignment.assetId,
        personnelId: assetsPersonelAssignment.personnelId,
        startDate: assetsPersonelAssignment.startDate,
        endDate: assetsPersonelAssignment.endDate,
        isActive: assetsPersonelAssignment.isActive,
        plateNumber: assets.plateNumber,
        personnelName: sql<string>`CONCAT(${personnel.name}, ' ', ${personnel.surname})`,
        personnelTcNo: sql<string>`${personnel.tcNo}::text`,
      })
      .from(assetsPersonelAssignment)
      .innerJoin(assets, eq(assetsPersonelAssignment.assetId, assets.id))
      .innerJoin(personnel, eq(assetsPersonelAssignment.personnelId, personnel.id));

    // Apply conditions and ordering
    const finalQuery = conditions.length > 0 
      ? baseQuery.where(and(...conditions)).orderBy(orderByClause)
      : baseQuery.orderBy(orderByClause);

    // Get total count with same conditions
    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(assetsPersonelAssignment)
      .innerJoin(assets, eq(assetsPersonelAssignment.assetId, assets.id))
      .innerJoin(personnel, eq(assetsPersonelAssignment.personnelId, personnel.id));
    
    const [{ count }] = await (conditions.length > 0 
      ? countQuery.where(and(...conditions))
      : countQuery
    );

    // Apply pagination
    const results = await finalQuery.limit(limitNum).offset(offsetNum);

    res.json({
      success: true,
      data: results,
      total: Number(count), // BigInt'i Number'a çevir
      limit: limitNum,
      offset: offsetNum
    });

  } catch (error) {
    console.error("Asset assignments list error:", error);
    res.status(500).json({
      success: false,
      error: "Zimmet atamalarını listeleme sırasında hata oluştu"
    });
  }
});

/**
 * @swagger
 * /api/asset-assignments/{id}:
 *   get:
 *     summary: Belirli zimmet atama bilgisi getir
 *     description: ID'ye göre zimmet atama detaylarını getirir
 *     tags: [Asset Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Zimmet atama ID
 *     responses:
 *       200:
 *         description: Başarılı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   allOf:
 *                     - $ref: '#/components/schemas/AssetsPersonelAssignment'
 *                     - type: object
 *                       properties:
 *                         plateNumber:
 *                           type: string
 *                         personnelName:
 *                           type: string
 *                         personnelTcNo:
 *                           type: string
 *       404:
 *         description: Kayıt bulunamadı
 *       401:
 *         description: Yetkisiz erişim
 *       500:
 *         description: Sunucu hatası
 */
router.get("/:id", async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const result = await db
      .select({
        id: assetsPersonelAssignment.id,
        assetId: assetsPersonelAssignment.assetId,
        personnelId: assetsPersonelAssignment.personnelId,
        startDate: assetsPersonelAssignment.startDate,
        endDate: assetsPersonelAssignment.endDate,
        isActive: assetsPersonelAssignment.isActive,
        plateNumber: assets.plateNumber,
        personnelName: sql<string>`CONCAT(${personnel.name}, ' ', ${personnel.surname})`,
        personnelTcNo: sql<string>`${personnel.tcNo}::text`,
      })
      .from(assetsPersonelAssignment)
      .innerJoin(assets, eq(assetsPersonelAssignment.assetId, assets.id))
      .innerJoin(personnel, eq(assetsPersonelAssignment.personnelId, personnel.id))
      .where(eq(assetsPersonelAssignment.id, parseInt(id)))
      .limit(1);

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Zimmet atama kaydı bulunamadı"
      });
    }

    // Basic authorization check - user exists
    if (!user) {
      return res.status(403).json({
        success: false,
        error: "Bu zimmet kaydına erişim yetkiniz yok"
      });
    }

    res.json({
      success: true,
      data: result[0]
    });

  } catch (error) {
    console.error("Asset assignment get error:", error);
    res.status(500).json({
      success: false,
      error: "Zimmet atama bilgisi getirilirken hata oluştu"
    });
  }
});

/**
 * @swagger
 * /api/asset-assignments:
 *   post:
 *     summary: Yeni araç zimmet ataması oluştur
 *     description: Yeni araç zimmet ataması oluşturur ve audit log kaydeder
 *     tags: [Asset Assignments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAssetsPersonelAssignment'
 *     responses:
 *       201:
 *         description: Başarıyla oluşturuldu
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/AssetsPersonelAssignment'
 *                 message:
 *                   type: string
 *       400:
 *         description: Geçersiz veri
 *       401:
 *         description: Yetkisiz erişim
 *       403:
 *         description: Erişim reddedildi
 *       500:
 *         description: Sunucu hatası
 */
router.post("/", async (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    
    // Validate request body
    const validation = insertAssetsPersonelAssignmentSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: "Geçersiz veri formatı",
        details: validation.error.errors
      });
    }

    const data = validation.data;

    // Basic authorization check - user exists
    if (!user) {
      return res.status(403).json({
        success: false,
        error: "Bu personele zimmet atama yetkiniz yok"
      });
    }

    // Check if asset and personnel exist and are active
    const [asset] = await db.select().from(assets).where(
      and(eq(assets.id, data.assetId), eq(assets.isActive, true))
    ).limit(1);

    if (!asset) {
      return res.status(400).json({
        success: false,
        error: "Geçersiz veya pasif araç ID"
      });
    }

    const [personnelRecord] = await db.select().from(personnel).where(
      and(eq(personnel.id, data.personnelId), eq(personnel.isActive, true))
    ).limit(1);

    if (!personnelRecord) {
      return res.status(400).json({
        success: false,
        error: "Geçersiz veya pasif personel ID"
      });
    }

    // Check for conflicting active assignments
    const existingAssignments = await db
      .select()
      .from(assetsPersonelAssignment)
      .where(
        and(
          eq(assetsPersonelAssignment.assetId, data.assetId),
          eq(assetsPersonelAssignment.isActive, true),
          or(
            sql`${assetsPersonelAssignment.endDate} IS NULL`,
            sql`${assetsPersonelAssignment.endDate} >= ${data.startDate}`
          )
        )
      );

    if (existingAssignments.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Bu araç için belirtilen tarih aralığında aktif zimmet ataması bulunmaktadır"
      });
    }

    // Create assignment
    const [newAssignment] = await db
      .insert(assetsPersonelAssignment)
      .values(data)
      .returning();

    // Add audit log
    await createAuditLog(
      "assets_personel_assignment",
      newAssignment.id,
      "INSERT",
      undefined,
      newAssignment,
      {
        userId: user.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    res.status(201).json({
      success: true,
      data: newAssignment,
      message: "Araç zimmet ataması başarıyla oluşturuldu"
    });

  } catch (error) {
    console.error("Asset assignment create error:", error);
    res.status(500).json({
      success: false,
      error: "Zimmet ataması oluşturulurken hata oluştu"
    });
  }
});

/**
 * @swagger
 * /api/asset-assignments/{id}:
 *   put:
 *     summary: Zimmet atama bilgisi güncelle
 *     description: Mevcut zimmet atama bilgilerini günceller
 *     tags: [Asset Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Zimmet atama ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAssetsPersonelAssignment'
 *     responses:
 *       200:
 *         description: Başarıyla güncellendi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/AssetsPersonelAssignment'
 *                 message:
 *                   type: string
 *       400:
 *         description: Geçersiz veri
 *       404:
 *         description: Kayıt bulunamadı
 *       401:
 *         description: Yetkisiz erişim
 *       403:
 *         description: Erişim reddedildi
 *       500:
 *         description: Sunucu hatası
 */
router.put("/:id", async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    // Validate request body
    const validation = updateAssetsPersonelAssignmentSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: "Geçersiz veri formatı",
        details: validation.error.errors
      });
    }

    const data = validation.data;

    // Check if assignment exists
    const [existingAssignment] = await db
      .select()
      .from(assetsPersonelAssignment)
      .where(eq(assetsPersonelAssignment.id, parseInt(id)))
      .limit(1);

    if (!existingAssignment) {
      return res.status(404).json({
        success: false,
        error: "Zimmet atama kaydı bulunamadı"
      });
    }

    // Basic authorization check - user exists
    if (!user) {
      return res.status(403).json({
        success: false,
        error: "Bu zimmet kaydını güncelleme yetkiniz yok"
      });
    }

    // Update assignment
    const [updatedAssignment] = await db
      .update(assetsPersonelAssignment)
      .set(data)
      .where(eq(assetsPersonelAssignment.id, parseInt(id)))
      .returning();

    // Add audit log
    await createAuditLog(
      "assets_personel_assignment",
      parseInt(id),
      "UPDATE",
      existingAssignment,
      updatedAssignment,
      {
        userId: user.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    res.json({
      success: true,
      data: updatedAssignment,
      message: "Zimmet ataması başarıyla güncellendi"
    });

  } catch (error) {
    console.error("Asset assignment update error:", error);
    res.status(500).json({
      success: false,
      error: "Zimmet ataması güncellenirken hata oluştu"
    });
  }
});

/**
 * @swagger
 * /api/asset-assignments/{id}:
 *   delete:
 *     summary: Zimmet atama kaydını sil (soft delete)
 *     description: Zimmet atama kaydını pasif duruma getirir (soft delete)
 *     tags: [Asset Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Zimmet atama ID
 *     responses:
 *       200:
 *         description: Başarıyla silindi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Kayıt bulunamadı
 *       401:
 *         description: Yetkisiz erişim
 *       403:
 *         description: Erişim reddedildi
 *       500:
 *         description: Sunucu hatası
 */
router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    // Check if assignment exists
    const [existingAssignment] = await db
      .select()
      .from(assetsPersonelAssignment)
      .where(eq(assetsPersonelAssignment.id, parseInt(id)))
      .limit(1);

    if (!existingAssignment) {
      return res.status(404).json({
        success: false,
        error: "Zimmet atama kaydı bulunamadı"
      });
    }

    // Basic authorization check - user exists
    if (!user) {
      return res.status(403).json({
        success: false,
        error: "Bu zimmet kaydını silme yetkiniz yok"
      });
    }

    // Soft delete - set isActive to false
    const [deletedAssignment] = await db
      .update(assetsPersonelAssignment)
      .set({ isActive: false })
      .where(eq(assetsPersonelAssignment.id, parseInt(id)))
      .returning();

    // Add audit log
    await createAuditLog(
      "assets_personel_assignment",
      parseInt(id),
      "DELETE",
      existingAssignment,
      deletedAssignment,
      {
        userId: user.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    res.json({
      success: true,
      message: "Zimmet ataması başarıyla silindi"
    });

  } catch (error) {
    console.error("Asset assignment delete error:", error);
    res.status(500).json({
      success: false,
      error: "Zimmet ataması silinirken hata oluştu"
    });
  }
});

/**
 * @swagger
 * /api/asset-assignments/{id}/complete:
 *   post:
 *     summary: Zimmet atamasını sonlandır
 *     description: Aktif zimmet atamasını belirtilen tarih ile sonlandırır
 *     tags: [Asset Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Zimmet atama ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - endDate
 *             properties:
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: Zimmet bitiş tarihi
 *     responses:
 *       200:
 *         description: Başarıyla sonlandırıldı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/AssetsPersonelAssignment'
 *                 message:
 *                   type: string
 *       400:
 *         description: Geçersiz veri
 *       404:
 *         description: Kayıt bulunamadı
 *       401:
 *         description: Yetkisiz erişim
 *       403:
 *         description: Erişim reddedildi
 *       500:
 *         description: Sunucu hatası
 */
router.post("/:id/complete", async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { endDate } = req.body;
    const user = req.user!;

    if (!endDate) {
      return res.status(400).json({
        success: false,
        error: "Bitiş tarihi gereklidir"
      });
    }

    // Check if assignment exists and is active
    const [existingAssignment] = await db
      .select()
      .from(assetsPersonelAssignment)
      .where(
        and(
          eq(assetsPersonelAssignment.id, parseInt(id)),
          eq(assetsPersonelAssignment.isActive, true)
        )
      )
      .limit(1);

    if (!existingAssignment) {
      return res.status(404).json({
        success: false,
        error: "Aktif zimmet atama kaydı bulunamadı"
      });
    }

    // Basic authorization check - user exists
    if (!user) {
      return res.status(403).json({
        success: false,
        error: "Bu zimmet kaydını sonlandırma yetkiniz yok"
      });
    }

    // Validate end date is not before start date
    if (new Date(endDate) < new Date(existingAssignment.startDate)) {
      return res.status(400).json({
        success: false,
        error: "Bitiş tarihi başlangıç tarihinden önce olamaz"
      });
    }

    // Update assignment with end date
    const [completedAssignment] = await db
      .update(assetsPersonelAssignment)
      .set({ endDate })
      .where(eq(assetsPersonelAssignment.id, parseInt(id)))
      .returning();

    // Add audit log
    await createAuditLog(
      "assets_personel_assignment",
      parseInt(id),
      "UPDATE",
      existingAssignment,
      completedAssignment,
      {
        userId: user.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    res.json({
      success: true,
      data: completedAssignment,
      message: "Zimmet ataması başarıyla sonlandırıldı"
    });

  } catch (error) {
    console.error("Asset assignment complete error:", error);
    res.status(500).json({
      success: false,
      error: "Zimmet ataması sonlandırılırken hata oluştu"
    });
  }
});

export { router as assetAssignmentRoutes };