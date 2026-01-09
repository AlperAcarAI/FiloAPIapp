import { Router, Request, Response } from "express";
import { db } from "./db.js";
import { stuff, personnelStuffMatcher, personnel } from "../shared/schema.js";
import { eq, and, or, desc, asc, ilike, sql } from "drizzle-orm";
import { auditableInsert, auditableUpdate, captureAuditInfo } from "./audit-middleware.js";

const router = Router();

// GET /api/stuff - List all stuff with filtering
router.get("/", async (req: Request, res: Response) => {
  try {
    const { 
      search,
      type,
      activeOnly = 'true',
      sortBy = 'name',
      sortOrder = 'asc',
      limit = 20,
      offset = 0
    } = req.query;

    const whereConditions: any[] = [];

    // Active filter
    if (activeOnly === 'true') {
      whereConditions.push(eq(stuff.isActive, true));
    }

    // Type filter
    if (type) {
      whereConditions.push(eq(stuff.type, type as string));
    }

    // Search filter
    if (search) {
      const searchTerm = `%${search}%`;
      whereConditions.push(
        or(
          ilike(stuff.name, searchTerm),
          ilike(stuff.stuffCode, searchTerm),
          ilike(stuff.type, searchTerm)
        )
      );
    }

    // Build order by clause
    let orderByClause;
    switch (sortBy) {
      case "stuffCode":
        orderByClause = sortOrder === "desc" ? desc(stuff.stuffCode) : asc(stuff.stuffCode);
        break;
      case "type":
        orderByClause = sortOrder === "desc" ? desc(stuff.type) : asc(stuff.type);
        break;
      case "value":
        orderByClause = sortOrder === "desc" ? desc(stuff.value) : asc(stuff.value);
        break;
      default: // name
        orderByClause = sortOrder === "desc" ? desc(stuff.name) : asc(stuff.name);
    }

    const stuffList = await db
      .select()
      .from(stuff)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(orderByClause)
      .limit(Number(limit))
      .offset(Number(offset));

    // Get total count
    const [totalCountResult] = await db
      .select({ count: sql`count(*)::int` })
      .from(stuff)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

    res.json({
      success: true,
      message: "Eşyalar başarıyla getirildi.",
      data: {
        stuff: stuffList,
        totalCount: totalCountResult.count as number,
        pagination: {
          limit: Number(limit),
          offset: Number(offset),
          hasMore: (Number(offset) + Number(limit)) < (totalCountResult.count as number)
        }
      }
    });
  } catch (error) {
    console.error("Eşya listesi getirme hatası:", error);
    res.status(500).json({
      success: false,
      error: "STUFF_FETCH_ERROR",
      message: "Eşyalar getirilirken hata oluştu."
    });
  }
});

// GET /api/stuff/assignments - List personnel stuff assignments (Must come before /:id route)
router.get("/assignments", async (req: Request, res: Response) => {
  try {
    const { 
      personnelId,
      stuffId,
      activeOnly = 'true',
      currentOnly = 'false',
      search,
      sortBy = 'startDate',
      sortOrder = 'desc',
      limit = 20,
      offset = 0
    } = req.query;

    const whereConditions: any[] = [];

    // Personnel filter
    if (personnelId) {
      whereConditions.push(eq(personnelStuffMatcher.personnelId, Number(personnelId)));
    }

    // Stuff filter
    if (stuffId) {
      whereConditions.push(eq(personnelStuffMatcher.stuffId, Number(stuffId)));
    }

    // Active filter
    if (activeOnly === 'true') {
      whereConditions.push(eq(personnelStuffMatcher.isActive, true));
    }

    // Current assignments only (no end date or future end date)
    if (currentOnly === 'true') {
      whereConditions.push(
        or(
          sql`${personnelStuffMatcher.endDate} IS NULL`,
          sql`${personnelStuffMatcher.endDate} >= CURRENT_DATE`
        )
      );
    }

    // Search filter (personnel name, stuff name, stuff code)
    if (search) {
      const searchTerm = `%${search}%`;
      whereConditions.push(
        or(
          ilike(personnel.name, searchTerm),
          ilike(personnel.surname, searchTerm),
          ilike(stuff.name, searchTerm),
          ilike(stuff.stuffCode, searchTerm)
        )
      );
    }

    // Build order by clause
    let orderByClause;
    switch (sortBy) {
      case "endDate":
        orderByClause = sortOrder === "desc" ? desc(personnelStuffMatcher.endDate) : asc(personnelStuffMatcher.endDate);
        break;
      case "personnelName":
        orderByClause = sortOrder === "desc" ? desc(personnel.name) : asc(personnel.name);
        break;
      case "stuffName":
        orderByClause = sortOrder === "desc" ? desc(stuff.name) : asc(stuff.name);
        break;
      default: // startDate
        orderByClause = sortOrder === "desc" ? desc(personnelStuffMatcher.startDate) : asc(personnelStuffMatcher.startDate);
    }

    const assignments = await db
      .select({
        id: personnelStuffMatcher.id,
        personnelId: personnelStuffMatcher.personnelId,
        stuffId: personnelStuffMatcher.stuffId,
        startDate: personnelStuffMatcher.startDate,
        endDate: personnelStuffMatcher.endDate,
        isActive: personnelStuffMatcher.isActive,
        notes: personnelStuffMatcher.notes,
        // Personnel info
        personnelName: sql<string>`CONCAT(${personnel.name}, ' ', ${personnel.surname})`,
        personnelTcNo: sql<string>`${personnel.tcNo}::text`,
        // Stuff info
        stuffName: stuff.name,
        stuffCode: stuff.stuffCode,
        stuffType: stuff.type,
        stuffValue: stuff.value
      })
      .from(personnelStuffMatcher)
      .leftJoin(personnel, eq(personnelStuffMatcher.personnelId, personnel.id))
      .leftJoin(stuff, eq(personnelStuffMatcher.stuffId, stuff.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(orderByClause)
      .limit(Number(limit))
      .offset(Number(offset));

    // Get total count
    const [totalCountResult] = await db
      .select({ count: sql`count(*)::int` })
      .from(personnelStuffMatcher)
      .leftJoin(personnel, eq(personnelStuffMatcher.personnelId, personnel.id))
      .leftJoin(stuff, eq(personnelStuffMatcher.stuffId, stuff.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

    const totalCount = Number(totalCountResult.count);

    res.json({
      success: true,
      message: "Personel eşya atamaları başarıyla getirildi.",
      data: {
        assignments,
        totalCount,
        pagination: {
          limit: Number(limit),
          offset: Number(offset),
          hasMore: (Number(offset) + Number(limit)) < totalCount
        }
      }
    });
  } catch (error) {
    console.error("Personel eşya atamaları getirme hatası:", error);
    res.status(500).json({
      success: false,
      error: "ASSIGNMENTS_FETCH_ERROR",
      message: "Personel eşya atamaları getirilirken hata oluştu."
    });
  }
});

// GET /api/stuff/:id - Get stuff by ID (Must come after specific routes)
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const stuffId = parseInt(req.params.id);

    if (!stuffId || isNaN(stuffId)) {
      return res.status(400).json({
        success: false,
        error: "INVALID_ID",
        message: "Geçersiz eşya ID'si."
      });
    }

    const [stuffItem] = await db
      .select()
      .from(stuff)
      .where(eq(stuff.id, stuffId))
      .limit(1);

    if (!stuffItem) {
      return res.status(404).json({
        success: false,
        error: "STUFF_NOT_FOUND",
        message: "Eşya bulunamadı."
      });
    }

    res.json({
      success: true,
      message: "Eşya detayları başarıyla getirildi.",
      data: stuffItem
    });
  } catch (error) {
    console.error("Eşya detayları getirme hatası:", error);
    res.status(500).json({
      success: false,
      error: "STUFF_DETAIL_FETCH_ERROR",
      message: "Eşya detayları getirilirken hata oluştu."
    });
  }
});

// POST /api/stuff - Create new stuff
router.post("/", async (req: Request, res: Response) => {
  try {
    const { stuffCode, name, value, type } = req.body;

    // Validation
    if (!stuffCode || !name) {
      return res.status(400).json({
        success: false,
        error: "VALIDATION_ERROR",
        message: "Eşya kodu ve adı gereklidir."
      });
    }

    // Check for duplicate stuff code
    const existingStuff = await db
      .select()
      .from(stuff)
      .where(eq(stuff.stuffCode, stuffCode))
      .limit(1);

    if (existingStuff.length > 0) {
      return res.status(400).json({
        success: false,
        error: "DUPLICATE_STUFF_CODE",
        message: "Bu eşya kodu zaten mevcut."
      });
    }

    const auditInfo = captureAuditInfo(req);

    const [newStuff] = await auditableInsert(
      db,
      stuff,
      {
        stuffCode,
        name,
        value: value || null,
        type: type || null,
        isActive: true,
        createdBy: auditInfo.userId,
        updatedBy: auditInfo.userId
      },
      auditInfo
    );

    res.status(201).json({
      success: true,
      message: "Eşya başarıyla oluşturuldu.",
      data: newStuff
    });
  } catch (error) {
    console.error("Eşya oluşturma hatası:", error);
    res.status(500).json({
      success: false,
      error: "STUFF_CREATE_ERROR",
      message: "Eşya oluşturulurken hata oluştu."
    });
  }
});

// POST /api/stuff/assignments - Create personnel stuff assignment
router.post("/assignments", async (req: Request, res: Response) => {
  try {
    const { personnelId, stuffId, startDate, notes } = req.body;

    // Validation
    if (!personnelId || !stuffId || !startDate) {
      return res.status(400).json({
        success: false,
        error: "VALIDATION_ERROR",
        message: "Personel ID, eşya ID ve başlangıç tarihi gereklidir."
      });
    }

    // Check if personnel exists
    const [existingPersonnel] = await db
      .select()
      .from(personnel)
      .where(eq(personnel.id, personnelId))
      .limit(1);

    if (!existingPersonnel) {
      return res.status(404).json({
        success: false,
        error: "PERSONNEL_NOT_FOUND",
        message: "Personel bulunamadı."
      });
    }

    // Check if stuff exists
    const [existingStuff] = await db
      .select()
      .from(stuff)
      .where(eq(stuff.id, stuffId))
      .limit(1);

    if (!existingStuff) {
      return res.status(404).json({
        success: false,
        error: "STUFF_NOT_FOUND",
        message: "Eşya bulunamadı."
      });
    }

    // Check for existing active assignment for the same personnel and same stuff
    // Note: Multiple people can have the same stuff assigned, but prevent duplicate assignments to same person
    const existingAssignment = await db
      .select()
      .from(personnelStuffMatcher)
      .where(
        and(
          eq(personnelStuffMatcher.personnelId, personnelId),
          eq(personnelStuffMatcher.stuffId, stuffId),
          eq(personnelStuffMatcher.isActive, true),
          sql`${personnelStuffMatcher.endDate} IS NULL OR ${personnelStuffMatcher.endDate} >= CURRENT_DATE`
        )
      )
      .limit(1);

    if (existingAssignment.length > 0) {
      return res.status(400).json({
        success: false,
        error: "DUPLICATE_ASSIGNMENT",
        message: "Bu personele bu eşya zaten atanmış."
      });
    }

    const auditInfo = captureAuditInfo(req);

    const [newAssignment] = await auditableInsert(
      db,
      personnelStuffMatcher,
      {
        personnelId,
        stuffId,
        startDate,
        endDate: null,
        isActive: true,
        notes: notes || null,
        createdBy: auditInfo.userId,
        updatedBy: auditInfo.userId
      },
      auditInfo
    );

    res.status(201).json({
      success: true,
      message: "Personel eşya ataması başarıyla oluşturuldu.",
      data: newAssignment
    });
  } catch (error) {
    console.error("Personel eşya ataması oluşturma hatası:", error);
    res.status(500).json({
      success: false,
      error: "ASSIGNMENT_CREATE_ERROR",
      message: "Personel eşya ataması oluşturulurken hata oluştu."
    });
  }
});

// PUT /api/stuff/:id - Update stuff
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const stuffId = parseInt(req.params.id);
    const { stuffCode, name, value, type } = req.body;

    if (!stuffId || isNaN(stuffId)) {
      return res.status(400).json({
        success: false,
        error: "INVALID_ID",
        message: "Geçersiz eşya ID'si."
      });
    }

    // Check if stuff exists
    const [existingStuff] = await db
      .select()
      .from(stuff)
      .where(eq(stuff.id, stuffId))
      .limit(1);

    if (!existingStuff) {
      return res.status(404).json({
        success: false,
        error: "STUFF_NOT_FOUND",
        message: "Eşya bulunamadı."
      });
    }

    // Check for duplicate stuff code (exclude current stuff)
    if (stuffCode && stuffCode !== existingStuff.stuffCode) {
      const duplicateStuff = await db
        .select()
        .from(stuff)
        .where(eq(stuff.stuffCode, stuffCode))
        .limit(1);

      if (duplicateStuff.length > 0) {
        return res.status(400).json({
          success: false,
          error: "DUPLICATE_STUFF_CODE",
          message: "Bu eşya kodu zaten mevcut."
        });
      }
    }

    const auditInfo = captureAuditInfo(req);

    const [updatedStuff] = await auditableUpdate(
      db,
      stuff,
      {
        stuffCode: stuffCode || existingStuff.stuffCode,
        name: name || existingStuff.name,
        value: value !== undefined ? value : existingStuff.value,
        type: type !== undefined ? type : existingStuff.type,
        updatedBy: auditInfo.userId,
        updatedAt: new Date()
      },
      eq(stuff.id, stuffId),
      existingStuff,
      auditInfo
    );

    res.json({
      success: true,
      message: "Eşya başarıyla güncellendi.",
      data: updatedStuff
    });
  } catch (error) {
    console.error("Eşya güncelleme hatası:", error);
    res.status(500).json({
      success: false,
      error: "STUFF_UPDATE_ERROR",
      message: "Eşya güncellenirken hata oluştu."
    });
  }
});

// DELETE /api/stuff/:id - Soft delete stuff
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const stuffId = parseInt(req.params.id);

    if (!stuffId || isNaN(stuffId)) {
      return res.status(400).json({
        success: false,
        error: "INVALID_ID",
        message: "Geçersiz eşya ID'si."
      });
    }

    // Check if stuff exists
    const [existingStuff] = await db
      .select()
      .from(stuff)
      .where(eq(stuff.id, stuffId))
      .limit(1);

    if (!existingStuff) {
      return res.status(404).json({
        success: false,
        error: "STUFF_NOT_FOUND",
        message: "Eşya bulunamadı."
      });
    }

    const auditInfo = captureAuditInfo(req);

    await auditableUpdate(
      db,
      stuff,
      {
        isActive: false,
        updatedBy: auditInfo.userId,
        updatedAt: new Date()
      },
      eq(stuff.id, stuffId),
      existingStuff,
      auditInfo
    );

    res.json({
      success: true,
      message: "Eşya başarıyla silindi."
    });
  } catch (error) {
    console.error("Eşya silme hatası:", error);
    res.status(500).json({
      success: false,
      error: "STUFF_DELETE_ERROR",
      message: "Eşya silinirken hata oluştu."
    });
  }
});

// PUT /api/stuff/assignments/:id - Update assignment
router.put("/assignments/:id", async (req: Request, res: Response) => {
  try {
    const assignmentId = parseInt(req.params.id);
    const { personnelId, stuffId, startDate, endDate, notes } = req.body;

    if (!assignmentId || isNaN(assignmentId)) {
      return res.status(400).json({
        success: false,
        error: "INVALID_ID",
        message: "Geçersiz atama ID'si."
      });
    }

    // Check if assignment exists
    const [existingAssignment] = await db
      .select()
      .from(personnelStuffMatcher)
      .where(eq(personnelStuffMatcher.id, assignmentId))
      .limit(1);

    if (!existingAssignment) {
      return res.status(404).json({
        success: false,
        error: "ASSIGNMENT_NOT_FOUND",
        message: "Atama bulunamadı."
      });
    }

    const auditInfo = captureAuditInfo(req);

    const [updatedAssignment] = await auditableUpdate(
      db,
      personnelStuffMatcher,
      {
        personnelId: personnelId || existingAssignment.personnelId,
        stuffId: stuffId || existingAssignment.stuffId,
        startDate: startDate || existingAssignment.startDate,
        endDate: endDate !== undefined ? endDate : existingAssignment.endDate,
        notes: notes !== undefined ? notes : existingAssignment.notes,
        updatedBy: auditInfo.userId,
        updatedAt: new Date()
      },
      eq(personnelStuffMatcher.id, assignmentId),
      existingAssignment,
      auditInfo
    );

    res.json({
      success: true,
      message: "Personel eşya ataması başarıyla güncellendi.",
      data: updatedAssignment
    });
  } catch (error) {
    console.error("Personel eşya ataması güncelleme hatası:", error);
    res.status(500).json({
      success: false,
      error: "ASSIGNMENT_UPDATE_ERROR",
      message: "Personel eşya ataması güncellenirken hata oluştu."
    });
  }
});

// PUT /api/stuff/assignments/:id/complete - Complete assignment (zimmet kaldırma)
router.put("/assignments/:id/complete", async (req: Request, res: Response) => {
  try {
    const assignmentId = parseInt(req.params.id);
    const { endDate, notes } = req.body;

    if (!assignmentId || isNaN(assignmentId)) {
      return res.status(400).json({
        success: false,
        error: "INVALID_ID",
        message: "Geçersiz atama ID'si."
      });
    }

    // Validation: endDate is required for zimmet kaldırma
    if (!endDate) {
      return res.status(400).json({
        success: false,
        error: "VALIDATION_ERROR",
        message: "Zimmet kaldırma için bitiş tarihi gereklidir."
      });
    }

    // Check if assignment exists
    const [existingAssignment] = await db
      .select()
      .from(personnelStuffMatcher)
      .where(eq(personnelStuffMatcher.id, assignmentId))
      .limit(1);

    if (!existingAssignment) {
      return res.status(404).json({
        success: false,
        error: "ASSIGNMENT_NOT_FOUND",
        message: "Atama bulunamadı."
      });
    }

    if (existingAssignment.endDate) {
      return res.status(400).json({
        success: false,
        error: "ASSIGNMENT_ALREADY_COMPLETED",
        message: "Bu zimmet zaten kaldırılmış."
      });
    }

    const auditInfo = captureAuditInfo(req);

    const [completedAssignment] = await auditableUpdate(
      db,
      personnelStuffMatcher,
      {
        endDate,
        notes: notes !== undefined ? notes : existingAssignment.notes,
        updatedBy: auditInfo.userId,
        updatedAt: new Date()
      },
      eq(personnelStuffMatcher.id, assignmentId),
      existingAssignment,
      auditInfo
    );

    res.json({
      success: true,
      message: "Zimmet başarıyla kaldırıldı.",
      data: completedAssignment
    });
  } catch (error) {
    console.error("Zimmet kaldırma hatası:", error);
    res.status(500).json({
      success: false,
      error: "COMPLETE_ASSIGNMENT_ERROR",
      message: "Zimmet kaldırılırken hata oluştu."
    });
  }
});

// DELETE /api/stuff/assignments/:id - Soft delete assignment
router.delete("/assignments/:id", async (req: Request, res: Response) => {
  try {
    const assignmentId = parseInt(req.params.id);

    if (!assignmentId || isNaN(assignmentId)) {
      return res.status(400).json({
        success: false,
        error: "INVALID_ID",
        message: "Geçersiz atama ID'si."
      });
    }

    // Check if assignment exists
    const [existingAssignment] = await db
      .select()
      .from(personnelStuffMatcher)
      .where(eq(personnelStuffMatcher.id, assignmentId))
      .limit(1);

    if (!existingAssignment) {
      return res.status(404).json({
        success: false,
        error: "ASSIGNMENT_NOT_FOUND",
        message: "Atama bulunamadı."
      });
    }

    const auditInfo = captureAuditInfo(req);

    await auditableUpdate(
      db,
      personnelStuffMatcher,
      {
        isActive: false,
        updatedBy: auditInfo.userId,
        updatedAt: new Date()
      },
      eq(personnelStuffMatcher.id, assignmentId),
      existingAssignment,
      auditInfo
    );

    res.json({
      success: true,
      message: "Personel eşya ataması başarıyla silindi."
    });
  } catch (error) {
    console.error("Personel eşya ataması silme hatası:", error);
    res.status(500).json({
      success: false,
      error: "ASSIGNMENT_DELETE_ERROR",
      message: "Personel eşya ataması silinirken hata oluştu."
    });
  }
});

export default router;