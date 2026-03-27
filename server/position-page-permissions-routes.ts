import { Router, type Response } from "express";
import { authenticateJWT, requireAdmin, type AuthRequest } from "./hierarchical-auth.js";
import { db } from "./db";
import {
  positionPagePermissions,
  personnelPositions,
} from "../shared/schema";
import { eq, and, inArray } from "drizzle-orm";

const router = Router();
router.use(authenticateJWT);

/**
 * Tüm pozisyon-sayfa yetki eşleştirmelerini getirir (matris için)
 * GET /api/secure/position-page-permissions
 */
router.get("/position-page-permissions", async (req: AuthRequest, res: Response) => {
  try {
    const positions = await db
      .select({
        id: personnelPositions.id,
        name: personnelPositions.name,
      })
      .from(personnelPositions)
      .where(eq(personnelPositions.isActive, true))
      .orderBy(personnelPositions.name);

    const permissions = await db
      .select({
        id: positionPagePermissions.id,
        positionId: positionPagePermissions.positionId,
        pageKey: positionPagePermissions.pageKey,
      })
      .from(positionPagePermissions);

    res.json({
      success: true,
      data: { positions, permissions },
    });
  } catch (error) {
    console.error("Position page permissions fetch error:", error);
    res.status(500).json({
      success: false,
      error: "FETCH_ERROR",
      message: "Sayfa yetkileri getirilirken hata oluştu",
    });
  }
});

/**
 * Belirli bir pozisyon için sayfa yetkilerini toplu günceller
 * PUT /api/secure/position-page-permissions/:positionId
 * Body: { pageKeys: string[] }
 */
router.put("/position-page-permissions/:positionId", requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const positionId = parseInt(req.params.positionId);
    const { pageKeys } = req.body as { pageKeys: string[] };

    if (isNaN(positionId)) {
      return res.status(400).json({
        success: false,
        error: "INVALID_POSITION",
        message: "Geçersiz pozisyon ID",
      });
    }

    if (!Array.isArray(pageKeys)) {
      return res.status(400).json({
        success: false,
        error: "INVALID_DATA",
        message: "pageKeys bir dizi olmalıdır",
      });
    }

    // Mevcut yetkileri sil
    await db
      .delete(positionPagePermissions)
      .where(eq(positionPagePermissions.positionId, positionId));

    // Yeni yetkileri ekle
    if (pageKeys.length > 0) {
      await db.insert(positionPagePermissions).values(
        pageKeys.map((pageKey) => ({
          positionId,
          pageKey,
          createdBy: req.userContext?.userId ?? null,
        }))
      );
    }

    res.json({
      success: true,
      message: "Sayfa yetkileri güncellendi",
      data: { positionId, pageKeys },
    });
  } catch (error) {
    console.error("Position page permissions update error:", error);
    res.status(500).json({
      success: false,
      error: "UPDATE_ERROR",
      message: "Sayfa yetkileri güncellenirken hata oluştu",
    });
  }
});

/**
 * Giriş yapan kullanıcının pozisyonuna ait sayfa yetkilerini getirir
 * GET /api/secure/my-page-permissions
 */
router.get("/my-page-permissions", async (req: AuthRequest, res: Response) => {
  try {
    const positionId = req.userContext?.currentPositionId;

    // Pozisyon yoksa veya CORPORATE ise tüm sayfalara erişim
    if (!positionId || req.userContext?.accessLevel === "CORPORATE") {
      return res.json({
        success: true,
        data: { pageKeys: null }, // null = tüm sayfalara erişim
      });
    }

    const permissions = await db
      .select({ pageKey: positionPagePermissions.pageKey })
      .from(positionPagePermissions)
      .where(eq(positionPagePermissions.positionId, positionId));

    res.json({
      success: true,
      data: {
        pageKeys: permissions.map((p) => p.pageKey),
      },
    });
  } catch (error) {
    console.error("My page permissions fetch error:", error);
    res.status(500).json({
      success: false,
      error: "FETCH_ERROR",
      message: "Sayfa yetkileri getirilirken hata oluştu",
    });
  }
});

export default router;
