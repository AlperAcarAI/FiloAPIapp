import { Router, type Request, Response } from "express";
import { db } from "./db";
import { personnelAccess, accessTypes, workAreas, personnel } from "@shared/schema";
import { eq, and, or, inArray, desc, asc, sql, isNull } from "drizzle-orm";
import { authenticateToken, type AuthRequest } from "./auth";

const router = Router();

// ========================
// ACCESS TYPES ENDPOINTS
// ========================

// Tüm erişim tiplerini listele
router.get("/access-types", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { activeOnly = 'true', sortBy = 'id', sortOrder = 'asc' } = req.query;
    
    let query = db
      .select({
        id: accessTypes.id,
        name: accessTypes.name,
        description: accessTypes.description,
        isActive: accessTypes.isActive,
        createdAt: accessTypes.createdAt,
      })
      .from(accessTypes);
    
    // Sadece aktif olanları getir
    if (activeOnly === 'true') {
      query.where(eq(accessTypes.isActive, true));
    }
    
    // Sıralama
    const orderColumn = sortBy === 'name' ? accessTypes.name : accessTypes.id;
    query.orderBy(sortOrder === 'desc' ? desc(orderColumn) : asc(orderColumn));
    
    const types = await query;
    
    res.json({
      success: true,
      message: "Erişim tipleri başarıyla getirildi",
      data: {
        accessTypes: types,
        totalCount: types.length
      }
    });
  } catch (error) {
    console.error("Access types getirme hatası:", error);
    res.status(500).json({
      success: false,
      error: "ACCESS_TYPES_FETCH_ERROR",
      message: "Erişim tipleri alınırken hata oluştu"
    });
  }
});

// Yeni erişim tipi oluştur
router.post("/access-types", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: "MISSING_NAME",
        message: "Erişim tipi adı gereklidir"
      });
    }
    
    const [newType] = await db
      .insert(accessTypes)
      .values({
        name,
        description: description || null,
        isActive: true,
      })
      .returning();
    
    res.status(201).json({
      success: true,
      message: "Erişim tipi başarıyla oluşturuldu",
      data: newType
    });
  } catch (error) {
    console.error("Access type oluşturma hatası:", error);
    res.status(500).json({
      success: false,
      error: "ACCESS_TYPE_CREATE_ERROR",
      message: "Erişim tipi oluşturulamadı"
    });
  }
});

// Erişim tipi güncelle
router.put("/access-types/:id", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const typeId = parseInt(req.params.id);
    const { name, description, isActive } = req.body;
    
    if (!typeId) {
      return res.status(400).json({
        success: false,
        error: "INVALID_ID",
        message: "Geçersiz ID"
      });
    }
    
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    const [updated] = await db
      .update(accessTypes)
      .set(updateData)
      .where(eq(accessTypes.id, typeId))
      .returning();
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: "TYPE_NOT_FOUND",
        message: "Erişim tipi bulunamadı"
      });
    }
    
    res.json({
      success: true,
      message: "Erişim tipi başarıyla güncellendi",
      data: updated
    });
  } catch (error) {
    console.error("Access type güncelleme hatası:", error);
    res.status(500).json({
      success: false,
      error: "ACCESS_TYPE_UPDATE_ERROR",
      message: "Erişim tipi güncellenemedi"
    });
  }
});

// ========================
// PERSONNEL ACCESS ENDPOINTS
// ========================

// Tüm personel yetkilerini listele (Filtreleme ile)
router.get("/personnel-access", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { personnelId, workareaId, typeId, includeInactive = 'false', limit, offset } = req.query;
    
    let query = db
      .select({
        id: personnelAccess.id,
        personnelId: personnelAccess.personnelId,
        personnelName: sql<string>`${personnel.name} || ' ' || ${personnel.surname}`,
        workareaId: personnelAccess.workareaId,
        workareaName: workAreas.name,
        typeId: personnelAccess.typeId,
        typeName: accessTypes.name,
        createdAt: personnelAccess.createdAt,
        createdBy: personnelAccess.createdBy,
      })
      .from(personnelAccess)
      .innerJoin(personnel, eq(personnelAccess.personnelId, personnel.id))
      .leftJoin(workAreas, eq(personnelAccess.workareaId, workAreas.id))
      .innerJoin(accessTypes, eq(personnelAccess.typeId, accessTypes.id));
    
    // Filtreleme
    const conditions = [];
    
    if (personnelId) {
      conditions.push(eq(personnelAccess.personnelId, Number(personnelId)));
    }
    
    if (workareaId) {
      if (workareaId === 'null') {
        conditions.push(isNull(personnelAccess.workareaId));
      } else {
        conditions.push(eq(personnelAccess.workareaId, Number(workareaId)));
      }
    }
    
    if (typeId) {
      conditions.push(eq(personnelAccess.typeId, Number(typeId)));
    }
    
    // Sadece aktif personelleri göster (istenmedikçe)
    if (includeInactive !== 'true') {
      conditions.push(eq(personnel.isActive, true));
    }
    
    if (conditions.length > 0) {
      query.where(and(...conditions));
    }
    
    // Sıralama
    query.orderBy(desc(personnelAccess.createdAt));
    
    // Sayfalama
    if (limit) {
      query.limit(Number(limit));
      if (offset) {
        query.offset(Number(offset));
      }
    }
    
    const permissions = await query;
    
    // Toplam sayı
    let countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(personnelAccess)
      .innerJoin(personnel, eq(personnelAccess.personnelId, personnel.id));
    
    if (conditions.length > 0) {
      countQuery.where(and(...conditions));
    }
    
    const [{ count: totalCount }] = await countQuery;
    
    res.json({
      success: true,
      message: "Personel yetkileri başarıyla getirildi",
      data: {
        permissions,
        totalCount,
        pagination: {
          limit: limit ? Number(limit) : null,
          offset: offset ? Number(offset) : null,
          hasMore: limit ? permissions.length === Number(limit) : false
        }
      }
    });
  } catch (error) {
    console.error("Personnel access listesi hatası:", error);
    res.status(500).json({
      success: false,
      error: "PERSONNEL_ACCESS_FETCH_ERROR",
      message: "Personel yetkileri alınırken hata oluştu"
    });
  }
});

// Belirli bir personelin tüm yetkilerini getir
router.get("/personnel-access/:personnelId", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const personnelId = parseInt(req.params.personnelId);
    
    if (!personnelId) {
      return res.status(400).json({
        success: false,
        error: "INVALID_PERSONNEL_ID",
        message: "Geçersiz personel ID"
      });
    }
    
    // Personel bilgisi
    const [personInfo] = await db
      .select({
        id: personnel.id,
        name: personnel.name,
        surname: personnel.surname,
        isActive: personnel.isActive,
      })
      .from(personnel)
      .where(eq(personnel.id, personnelId));
    
    if (!personInfo) {
      return res.status(404).json({
        success: false,
        error: "PERSONNEL_NOT_FOUND",
        message: "Personel bulunamadı"
      });
    }
    
    // Personelin yetkileri
    const permissions = await db
      .select({
        id: personnelAccess.id,
        workareaId: personnelAccess.workareaId,
        workareaName: workAreas.name,
        typeId: personnelAccess.typeId,
        typeName: accessTypes.name,
        typeDescription: accessTypes.description,
        createdAt: personnelAccess.createdAt,
        createdBy: personnelAccess.createdBy,
      })
      .from(personnelAccess)
      .leftJoin(workAreas, eq(personnelAccess.workareaId, workAreas.id))
      .innerJoin(accessTypes, eq(personnelAccess.typeId, accessTypes.id))
      .where(eq(personnelAccess.personnelId, personnelId))
      .orderBy(
        sql`CASE WHEN ${personnelAccess.workareaId} IS NULL THEN 0 ELSE 1 END`,
        asc(workAreas.name)
      );
    
    // Şantiye bazlı gruplama
    const globalPermissions = permissions.filter(p => p.workareaId === null);
    const workareaPermissions = permissions.filter(p => p.workareaId !== null);
    
    // Şantiye bazında grupla
    const workareaGroups = workareaPermissions.reduce((acc, perm) => {
      const key = perm.workareaId!;
      if (!acc[key]) {
        acc[key] = {
          workareaId: perm.workareaId,
          workareaName: perm.workareaName,
          permissions: []
        };
      }
      acc[key].permissions.push({
        id: perm.id,
        typeId: perm.typeId,
        typeName: perm.typeName,
        typeDescription: perm.typeDescription,
        createdAt: perm.createdAt,
        createdBy: perm.createdBy,
      });
      return acc;
    }, {} as Record<number, any>);
    
    res.json({
      success: true,
      message: "Personel yetkileri başarıyla getirildi",
      data: {
        personnel: {
          id: personInfo.id,
          name: personInfo.name,
          surname: personInfo.surname,
          fullName: `${personInfo.name} ${personInfo.surname}`,
          isActive: personInfo.isActive,
        },
        globalPermissions: globalPermissions.map(p => ({
          id: p.id,
          typeId: p.typeId,
          typeName: p.typeName,
          typeDescription: p.typeDescription,
          createdAt: p.createdAt,
          createdBy: p.createdBy,
        })),
        workareaPermissions: Object.values(workareaGroups),
        totalPermissions: permissions.length,
      }
    });
  } catch (error) {
    console.error("Personel yetkileri getirme hatası:", error);
    res.status(500).json({
      success: false,
      error: "PERSONNEL_PERMISSIONS_FETCH_ERROR",
      message: "Personel yetkileri alınırken hata oluştu"
    });
  }
});

// Yeni yetki ekle
router.post("/personnel-access", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { personnelId, workareaId, typeId } = req.body;
    const userId = req.user?.id;
    
    if (!personnelId || !typeId) {
      return res.status(400).json({
        success: false,
        error: "MISSING_FIELDS",
        message: "PersonelId ve typeId gereklidir"
      });
    }
    
    // Personel var mı kontrol et
    const [personExists] = await db
      .select({ id: personnel.id })
      .from(personnel)
      .where(eq(personnel.id, personnelId));
    
    if (!personExists) {
      return res.status(404).json({
        success: false,
        error: "PERSONNEL_NOT_FOUND",
        message: "Personel bulunamadı"
      });
    }
    
    // Access type var mı kontrol et
    const [typeExists] = await db
      .select({ id: accessTypes.id })
      .from(accessTypes)
      .where(eq(accessTypes.id, typeId));
    
    if (!typeExists) {
      return res.status(404).json({
        success: false,
        error: "ACCESS_TYPE_NOT_FOUND",
        message: "Erişim tipi bulunamadı"
      });
    }
    
    // Workarea varsa kontrol et
    if (workareaId) {
      const [workareaExists] = await db
        .select({ id: workAreas.id })
        .from(workAreas)
        .where(eq(workAreas.id, workareaId));
      
      if (!workareaExists) {
        return res.status(404).json({
          success: false,
          error: "WORKAREA_NOT_FOUND",
          message: "Şantiye bulunamadı"
        });
      }
    }
    
    // Aynı kayıt var mı kontrol et
    const existingConditions = [
      eq(personnelAccess.personnelId, personnelId),
      eq(personnelAccess.typeId, typeId),
    ];
    
    if (workareaId) {
      existingConditions.push(eq(personnelAccess.workareaId, workareaId));
    } else {
      existingConditions.push(isNull(personnelAccess.workareaId));
    }
    
    const [existing] = await db
      .select({ id: personnelAccess.id })
      .from(personnelAccess)
      .where(and(...existingConditions));
    
    if (existing) {
      return res.status(409).json({
        success: false,
        error: "PERMISSION_ALREADY_EXISTS",
        message: "Bu yetki zaten mevcut"
      });
    }
    
    // Yeni yetki ekle
    const [newPermission] = await db
      .insert(personnelAccess)
      .values({
        personnelId,
        workareaId: workareaId || null,
        typeId,
        createdBy: userId || null,
      })
      .returning();
    
    // Detaylı bilgi ile birlikte döndür
    const [detailedPermission] = await db
      .select({
        id: personnelAccess.id,
        personnelId: personnelAccess.personnelId,
        personnelName: sql<string>`${personnel.name} || ' ' || ${personnel.surname}`,
        workareaId: personnelAccess.workareaId,
        workareaName: workAreas.name,
        typeId: personnelAccess.typeId,
        typeName: accessTypes.name,
        createdAt: personnelAccess.createdAt,
        createdBy: personnelAccess.createdBy,
      })
      .from(personnelAccess)
      .innerJoin(personnel, eq(personnelAccess.personnelId, personnel.id))
      .leftJoin(workAreas, eq(personnelAccess.workareaId, workAreas.id))
      .innerJoin(accessTypes, eq(personnelAccess.typeId, accessTypes.id))
      .where(eq(personnelAccess.id, newPermission.id));
    
    res.status(201).json({
      success: true,
      message: "Yetki başarıyla eklendi",
      data: detailedPermission
    });
  } catch (error) {
    console.error("Yetki ekleme hatası:", error);
    res.status(500).json({
      success: false,
      error: "PERMISSION_CREATE_ERROR",
      message: "Yetki eklenemedi"
    });
  }
});

// Toplu yetki ekleme (Bir personele birden fazla yetki)
router.post("/personnel-access/bulk", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { personnelId, permissions } = req.body;
    const userId = req.user?.id;
    
    if (!personnelId || !Array.isArray(permissions) || permissions.length === 0) {
      return res.status(400).json({
        success: false,
        error: "INVALID_REQUEST",
        message: "PersonelId ve permissions array gereklidir"
      });
    }
    
    // Personel var mı kontrol et
    const [personExists] = await db
      .select({ id: personnel.id })
      .from(personnel)
      .where(eq(personnel.id, personnelId));
    
    if (!personExists) {
      return res.status(404).json({
        success: false,
        error: "PERSONNEL_NOT_FOUND",
        message: "Personel bulunamadı"
      });
    }
    
    const insertData = permissions.map(perm => ({
      personnelId,
      workareaId: perm.workareaId || null,
      typeId: perm.typeId,
      createdBy: userId || null,
    }));
    
    const inserted = await db
      .insert(personnelAccess)
      .values(insertData)
      .onConflictDoNothing()
      .returning();
    
    res.status(201).json({
      success: true,
      message: `${inserted.length} yetki başarıyla eklendi`,
      data: {
        inserted: inserted.length,
        total: permissions.length,
        skipped: permissions.length - inserted.length,
      }
    });
  } catch (error) {
    console.error("Toplu yetki ekleme hatası:", error);
    res.status(500).json({
      success: false,
      error: "BULK_PERMISSION_CREATE_ERROR",
      message: "Yetkiler eklenemedi"
    });
  }
});

// Yetki sil
router.delete("/personnel-access/:id", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const permissionId = parseInt(req.params.id);
    
    if (!permissionId) {
      return res.status(400).json({
        success: false,
        error: "INVALID_ID",
        message: "Geçersiz ID"
      });
    }
    
    const [deleted] = await db
      .delete(personnelAccess)
      .where(eq(personnelAccess.id, permissionId))
      .returning();
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: "PERMISSION_NOT_FOUND",
        message: "Yetki bulunamadı"
      });
    }
    
    res.json({
      success: true,
      message: "Yetki başarıyla silindi",
      data: deleted
    });
  } catch (error) {
    console.error("Yetki silme hatası:", error);
    res.status(500).json({
      success: false,
      error: "PERMISSION_DELETE_ERROR",
      message: "Yetki silinemedi"
    });
  }
});

// Personelin tüm yetkilerini sil
router.delete("/personnel-access/personnel/:personnelId", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const personnelId = parseInt(req.params.personnelId);
    
    if (!personnelId) {
      return res.status(400).json({
        success: false,
        error: "INVALID_PERSONNEL_ID",
        message: "Geçersiz personel ID"
      });
    }
    
    const deleted = await db
      .delete(personnelAccess)
      .where(eq(personnelAccess.personnelId, personnelId))
      .returning();
    
    res.json({
      success: true,
      message: `${deleted.length} yetki başarıyla silindi`,
      data: {
        deletedCount: deleted.length
      }
    });
  } catch (error) {
    console.error("Personel yetkileri silme hatası:", error);
    res.status(500).json({
      success: false,
      error: "PERSONNEL_PERMISSIONS_DELETE_ERROR",
      message: "Personel yetkileri silinemedi"
    });
  }
});

// Personelin belirli şantiyelerdeki yetkilerini güncelle (Replace)
router.put("/personnel-access/personnel/:personnelId", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const personnelId = parseInt(req.params.personnelId);
    const { permissions } = req.body;
    const userId = req.user?.id;
    
    if (!personnelId || !Array.isArray(permissions)) {
      return res.status(400).json({
        success: false,
        error: "INVALID_REQUEST",
        message: "PersonelId ve permissions array gereklidir"
      });
    }
    
    // Transaction ile önce sil sonra ekle
    await db.transaction(async (tx) => {
      // Mevcut yetkileri sil
      await tx
        .delete(personnelAccess)
        .where(eq(personnelAccess.personnelId, personnelId));
      
      // Yeni yetkileri ekle
      if (permissions.length > 0) {
        const insertData = permissions.map(perm => ({
          personnelId,
          workareaId: perm.workareaId || null,
          typeId: perm.typeId,
          createdBy: userId || null,
        }));
        
        await tx
          .insert(personnelAccess)
          .values(insertData);
      }
    });
    
    res.json({
      success: true,
      message: "Personel yetkileri başarıyla güncellendi",
      data: {
        personnelId,
        updatedCount: permissions.length
      }
    });
  } catch (error) {
    console.error("Personel yetkileri güncelleme hatası:", error);
    res.status(500).json({
      success: false,
      error: "PERSONNEL_PERMISSIONS_UPDATE_ERROR",
      message: "Personel yetkileri güncellenemedi"
    });
  }
});

export default router;
