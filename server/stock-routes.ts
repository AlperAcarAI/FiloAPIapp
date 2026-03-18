import { Router, type Response } from "express";
import { authenticateToken, type AuthRequest } from "./auth";
import { db } from "./db";
import {
  warehouses,
  stockLevels,
  stockReservations,
  stockMovements,
  stockMovementItems,
  subcontractorMaterials,
  materials,
  units,
  companies,
  projects,
  personnel,
  workAreas,
  insertWarehouseSchema,
  updateWarehouseSchema,
  insertStockMovementSchema,
  updateStockMovementSchema,
  insertStockMovementItemSchema,
  updateStockMovementItemSchema,
  insertStockReservationSchema,
  updateStockReservationSchema,
  updateSubcontractorMaterialSchema,
} from "../shared/schema";
import { eq, and, desc, sql, gte, lte, or, ilike } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { captureAuditInfo, createAuditLog } from "./audit-middleware";

const router = Router();

// TÜM ROUTE'LAR İÇİN AUTHENTİCATİON ZORUNLU
router.use(authenticateToken);

// ========================
// YARDIMCI FONKSİYONLAR
// ========================

type DbContext = typeof db;

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
function sendError(res: Response, statusCode: number, errorCode: string, message: string) {
  res.status(statusCode).json({ success: false, error: errorCode, message });
}

/** parseInt ile NaN koruması */
function safeParseInt(value: string): number | null {
  const parsed = parseInt(value);
  return isNaN(parsed) ? null : parsed;
}

/** Warehouse select query builder (4 yerde tekrarlanan sorgu) */
function buildWarehouseSelect(dbCtx: DbContext) {
  return dbCtx
    .select({
      id: warehouses.id,
      code: warehouses.code,
      name: warehouses.name,
      workAreaId: warehouses.workAreaId,
      workAreaName: workAreas.name,
      managerId: warehouses.managerId,
      managerName: sql<string>`CONCAT(${personnel.name}, ' ', ${personnel.surname})`.as("managerName"),
      warehouseType: warehouses.warehouseType,
      address: warehouses.address,
      isActive: warehouses.isActive,
      createdAt: warehouses.createdAt,
      updatedAt: warehouses.updatedAt,
    })
    .from(warehouses)
    .leftJoin(workAreas, eq(warehouses.workAreaId, workAreas.id))
    .leftJoin(personnel, eq(warehouses.managerId, personnel.id));
}

/** Stok seviyesi artır veya oluştur (transaction destekli) */
async function upsertStockLevel(
  warehouseId: number,
  materialId: number,
  unitId: number,
  quantity: number,
  userId?: number,
  tx: DbContext = db
) {
  const [existing] = await tx
    .select()
    .from(stockLevels)
    .where(
      and(
        eq(stockLevels.warehouseId, warehouseId),
        eq(stockLevels.materialId, materialId),
        eq(stockLevels.unitId, unitId)
      )
    );

  if (existing) {
    await tx
      .update(stockLevels)
      .set({
        currentQuantity: sql`${stockLevels.currentQuantity} + ${quantity}`,
        lastMovementDate: new Date(),
        updatedAt: new Date(),
        updatedBy: userId,
      })
      .where(eq(stockLevels.id, existing.id));
  } else {
    await tx.insert(stockLevels).values({
      warehouseId,
      materialId,
      unitId,
      currentQuantity: String(quantity),
      reservedQuantity: "0",
      lastMovementDate: new Date(),
      updatedBy: userId,
    });
  }
}

/** Stok seviyesi azalt (transaction destekli) */
async function decreaseStockLevel(
  warehouseId: number,
  materialId: number,
  unitId: number,
  quantity: number,
  userId?: number,
  tx: DbContext = db
) {
  const [existing] = await tx
    .select()
    .from(stockLevels)
    .where(
      and(
        eq(stockLevels.warehouseId, warehouseId),
        eq(stockLevels.materialId, materialId),
        eq(stockLevels.unitId, unitId)
      )
    );

  if (!existing) {
    throw new Error(`Stok kaydı bulunamadı: depo=${warehouseId}, malzeme=${materialId}, birim=${unitId}`);
  }

  const current = parseFloat(existing.currentQuantity);
  if (current < quantity) {
    throw new Error(`Yetersiz stok. Mevcut: ${current}, Talep: ${quantity}`);
  }

  await tx
    .update(stockLevels)
    .set({
      currentQuantity: sql`${stockLevels.currentQuantity} - ${quantity}`,
      lastMovementDate: new Date(),
      updatedAt: new Date(),
      updatedBy: userId,
    })
    .where(eq(stockLevels.id, existing.id));
}

/** Taşeron malzeme kaydı oluştur veya güncelle (transaction destekli) */
async function upsertSubcontractorMaterial(
  companyId: number,
  projectId: number,
  warehouseId: number,
  materialId: number,
  unitId: number,
  quantity: number,
  isFree: boolean,
  userId?: number,
  tx: DbContext = db
) {
  const [existing] = await tx
    .select()
    .from(subcontractorMaterials)
    .where(
      and(
        eq(subcontractorMaterials.companyId, companyId),
        eq(subcontractorMaterials.projectId, projectId),
        eq(subcontractorMaterials.materialId, materialId),
        eq(subcontractorMaterials.unitId, unitId)
      )
    );

  if (existing) {
    await tx
      .update(subcontractorMaterials)
      .set({
        givenQuantity: sql`${subcontractorMaterials.givenQuantity} + ${quantity}`,
        lastUpdateDate: new Date(),
        updatedAt: new Date(),
        updatedBy: userId,
      })
      .where(eq(subcontractorMaterials.id, existing.id));
  } else {
    await tx.insert(subcontractorMaterials).values({
      companyId,
      projectId,
      warehouseId,
      materialId,
      unitId,
      givenQuantity: String(quantity),
      usedQuantity: "0",
      returnedQuantity: "0",
      wasteQuantity: "0",
      isFree,
      createdBy: userId,
      updatedBy: userId,
    });
  }
}

/** Hareket kodu üret */
async function generateMovementCode(): Promise<string> {
  const year = new Date().getFullYear();
  const [last] = await db
    .select({ movementCode: stockMovements.movementCode })
    .from(stockMovements)
    .where(ilike(stockMovements.movementCode, `STK-${year}-%`))
    .orderBy(desc(stockMovements.id))
    .limit(1);

  let nextNum = 1;
  if (last) {
    const parts = last.movementCode.split("-");
    nextNum = parseInt(parts[2]) + 1;
  }
  return `STK-${year}-${String(nextNum).padStart(5, "0")}`;
}

// ========================
// DEPOLAR (WAREHOUSES)
// ========================

// Tüm depoları listele
router.get("/warehouses", async (req, res) => {
  try {
    const { workAreaId, warehouseType, active, search } = req.query;
    const { limit, offset } = parsePagination(req.query as Record<string, unknown>);

    const conditions: SQL[] = [];

    if (active !== "false") {
      conditions.push(eq(warehouses.isActive, true));
    }
    if (workAreaId) {
      const wId = safeParseInt(workAreaId as string);
      if (wId) conditions.push(eq(warehouses.workAreaId, wId));
    }
    if (warehouseType) {
      conditions.push(eq(warehouses.warehouseType, warehouseType as string));
    }
    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(
        or(
          ilike(warehouses.name, searchTerm),
          ilike(warehouses.code, searchTerm)
        )!
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, [{ total }]] = await Promise.all([
      buildWarehouseSelect(db)
        .where(whereClause)
        .orderBy(warehouses.name)
        .limit(limit)
        .offset(offset),
      db.select({ total: sql<number>`count(*)::int` }).from(warehouses)
        .leftJoin(workAreas, eq(warehouses.workAreaId, workAreas.id))
        .leftJoin(personnel, eq(warehouses.managerId, personnel.id))
        .where(whereClause),
    ]);

    sendListSuccess(res, items, total, limit, offset);
  } catch (error: unknown) {
    sendError(res, 500, "WAREHOUSE_LIST_ERROR", "Depo listesi alınırken bir hata oluştu");
  }
});

// Depo detayı
router.get("/warehouses/:id", async (req, res) => {
  try {
    const id = safeParseInt(req.params.id);
    if (!id) return sendError(res, 400, "INVALID_ID", "Geçersiz depo ID");

    const [result] = await buildWarehouseSelect(db).where(eq(warehouses.id, id));

    if (!result) {
      return sendError(res, 404, "WAREHOUSE_NOT_FOUND", "Depo bulunamadı");
    }
    sendSuccess(res, result);
  } catch (error: unknown) {
    sendError(res, 500, "WAREHOUSE_FETCH_ERROR", "Depo bilgileri alınırken bir hata oluştu");
  }
});

// Yeni depo oluştur
router.post("/warehouses", async (req: AuthRequest, res) => {
  try {
    const parsed = insertWarehouseSchema.parse(req.body);
    const auditInfo = captureAuditInfo(req);
    const [inserted] = await db
      .insert(warehouses)
      .values({ ...parsed, createdBy: req.user?.userId, updatedBy: req.user?.userId })
      .returning();

    await createAuditLog("warehouses", inserted.id, "INSERT", null, parsed, auditInfo);

    const [result] = await buildWarehouseSelect(db).where(eq(warehouses.id, inserted.id));

    sendSuccess(res, result, "Depo başarıyla oluşturuldu", 201);
  } catch (error: unknown) {
    sendError(res, 400, "WAREHOUSE_CREATE_ERROR", "Depo oluşturulurken bir hata oluştu");
  }
});

// Depo güncelle
router.put("/warehouses/:id", async (req: AuthRequest, res) => {
  try {
    const id = safeParseInt(req.params.id);
    if (!id) return sendError(res, 400, "INVALID_ID", "Geçersiz depo ID");

    const parsed = updateWarehouseSchema.parse(req.body);
    const auditInfo = captureAuditInfo(req);

    const [oldRecord] = await db
      .select()
      .from(warehouses)
      .where(eq(warehouses.id, id));

    const [updated] = await db
      .update(warehouses)
      .set({ ...parsed, updatedBy: req.user?.userId, updatedAt: new Date() })
      .where(eq(warehouses.id, id))
      .returning();

    if (!updated) {
      return sendError(res, 404, "WAREHOUSE_NOT_FOUND", "Depo bulunamadı");
    }

    await createAuditLog("warehouses", updated.id, "UPDATE", oldRecord || null, parsed, auditInfo);

    const [result] = await buildWarehouseSelect(db).where(eq(warehouses.id, updated.id));

    sendSuccess(res, result, "Depo başarıyla güncellendi");
  } catch (error: unknown) {
    sendError(res, 400, "WAREHOUSE_UPDATE_ERROR", "Depo güncellenirken bir hata oluştu");
  }
});

// Depo sil (soft delete) — içinde stok varsa engelle
router.delete("/warehouses/:id", async (req: AuthRequest, res) => {
  try {
    const id = safeParseInt(req.params.id);
    if (!id) return sendError(res, 400, "INVALID_ID", "Geçersiz depo ID");

    const auditInfo = captureAuditInfo(req);

    // İçinde stok var mı kontrol et
    const [stockCheck] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(stockLevels)
      .where(and(
        eq(stockLevels.warehouseId, id),
        sql`${stockLevels.currentQuantity} > 0`
      ));

    if (stockCheck && stockCheck.total > 0) {
      return sendError(res, 400, "WAREHOUSE_HAS_STOCK", "İçinde stok bulunan depo silinemez. Önce stokları transfer edin.");
    }

    const [oldRecord] = await db
      .select()
      .from(warehouses)
      .where(eq(warehouses.id, id));

    const [result] = await db
      .update(warehouses)
      .set({ isActive: false, updatedBy: req.user?.userId, updatedAt: new Date() })
      .where(eq(warehouses.id, id))
      .returning();

    if (!result) {
      return sendError(res, 404, "WAREHOUSE_NOT_FOUND", "Depo bulunamadı");
    }

    await createAuditLog("warehouses", result.id, "DELETE", oldRecord || null, { isActive: false }, auditInfo);

    sendSuccess(res, { id: result.id }, "Depo başarıyla silindi");
  } catch (error: unknown) {
    sendError(res, 500, "WAREHOUSE_DELETE_ERROR", "Depo silinirken bir hata oluştu");
  }
});

// Depo stok özeti
router.get("/warehouses/:id/stock", async (req, res) => {
  try {
    const id = safeParseInt(req.params.id);
    if (!id) return sendError(res, 400, "INVALID_ID", "Geçersiz depo ID");

    const { limit, offset } = parsePagination(req.query as Record<string, unknown>);

    const whereClause = eq(stockLevels.warehouseId, id);

    const [items, [{ total }]] = await Promise.all([
      db
        .select({
          id: stockLevels.id,
          materialId: stockLevels.materialId,
          materialCode: materials.code,
          materialName: materials.name,
          unitId: stockLevels.unitId,
          unitName: units.name,
          unitSymbol: units.symbol,
          currentQuantity: stockLevels.currentQuantity,
          reservedQuantity: stockLevels.reservedQuantity,
          availableQuantity: sql<string>`(${stockLevels.currentQuantity} - ${stockLevels.reservedQuantity})`.as("available_quantity"),
          minQuantity: stockLevels.minQuantity,
          lastMovementDate: stockLevels.lastMovementDate,
        })
        .from(stockLevels)
        .innerJoin(materials, eq(stockLevels.materialId, materials.id))
        .innerJoin(units, eq(stockLevels.unitId, units.id))
        .where(whereClause)
        .orderBy(materials.name)
        .limit(limit)
        .offset(offset),
      db.select({ total: sql<number>`count(*)::int` }).from(stockLevels).where(whereClause),
    ]);

    sendListSuccess(res, items, total, limit, offset);
  } catch (error: unknown) {
    sendError(res, 500, "WAREHOUSE_STOCK_ERROR", "Depo stok bilgileri alınırken bir hata oluştu");
  }
});

// ========================
// STOK SEVİYELERİ (STOCK LEVELS)
// ========================

// Stok seviyelerini listele (filtreli)
router.get("/stock-levels", async (req, res) => {
  try {
    const { warehouseId, materialId, search } = req.query;
    const { limit, offset } = parsePagination(req.query as Record<string, unknown>);

    const conditions: SQL[] = [];

    if (warehouseId) {
      const wId = safeParseInt(warehouseId as string);
      if (wId) conditions.push(eq(stockLevels.warehouseId, wId));
    }
    if (materialId) {
      const mId = safeParseInt(materialId as string);
      if (mId) conditions.push(eq(stockLevels.materialId, mId));
    }
    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(
        or(
          ilike(materials.name, searchTerm),
          ilike(materials.code, searchTerm)
        )!
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const baseQuery = db
      .select({
        id: stockLevels.id,
        warehouseId: stockLevels.warehouseId,
        warehouseName: warehouses.name,
        materialId: stockLevels.materialId,
        materialCode: materials.code,
        materialName: materials.name,
        unitId: stockLevels.unitId,
        unitName: units.name,
        unitSymbol: units.symbol,
        currentQuantity: stockLevels.currentQuantity,
        reservedQuantity: stockLevels.reservedQuantity,
        availableQuantity: sql<string>`(${stockLevels.currentQuantity} - ${stockLevels.reservedQuantity})`.as("available_quantity"),
        minQuantity: stockLevels.minQuantity,
        lastMovementDate: stockLevels.lastMovementDate,
      })
      .from(stockLevels)
      .innerJoin(warehouses, eq(stockLevels.warehouseId, warehouses.id))
      .innerJoin(materials, eq(stockLevels.materialId, materials.id))
      .innerJoin(units, eq(stockLevels.unitId, units.id));

    const countQuery = db
      .select({ total: sql<number>`count(*)::int` })
      .from(stockLevels)
      .innerJoin(warehouses, eq(stockLevels.warehouseId, warehouses.id))
      .innerJoin(materials, eq(stockLevels.materialId, materials.id))
      .innerJoin(units, eq(stockLevels.unitId, units.id));

    const [items, [{ total }]] = await Promise.all([
      baseQuery.where(whereClause).orderBy(warehouses.name, materials.name).limit(limit).offset(offset),
      countQuery.where(whereClause),
    ]);

    sendListSuccess(res, items, total, limit, offset);
  } catch (error: unknown) {
    sendError(res, 500, "STOCK_LEVEL_LIST_ERROR", "Stok seviyeleri alınırken bir hata oluştu");
  }
});

// Minimum stok altı alarm listesi
router.get("/stock-levels/low-stock", async (req, res) => {
  try {
    const { warehouseId } = req.query;
    const { limit, offset } = parsePagination(req.query as Record<string, unknown>);

    const conditions: SQL[] = [
      sql`${stockLevels.minQuantity} IS NOT NULL`,
      sql`${stockLevels.currentQuantity} <= ${stockLevels.minQuantity}`,
    ];

    if (warehouseId) {
      const wId = safeParseInt(warehouseId as string);
      if (wId) conditions.push(eq(stockLevels.warehouseId, wId));
    }

    const whereClause = and(...conditions);

    const [items, [{ total }]] = await Promise.all([
      db
        .select({
          id: stockLevels.id,
          warehouseId: stockLevels.warehouseId,
          warehouseName: warehouses.name,
          materialId: stockLevels.materialId,
          materialCode: materials.code,
          materialName: materials.name,
          unitId: stockLevels.unitId,
          unitSymbol: units.symbol,
          currentQuantity: stockLevels.currentQuantity,
          minQuantity: stockLevels.minQuantity,
        })
        .from(stockLevels)
        .innerJoin(warehouses, eq(stockLevels.warehouseId, warehouses.id))
        .innerJoin(materials, eq(stockLevels.materialId, materials.id))
        .innerJoin(units, eq(stockLevels.unitId, units.id))
        .where(whereClause)
        .orderBy(materials.name)
        .limit(limit)
        .offset(offset),
      db
        .select({ total: sql<number>`count(*)::int` })
        .from(stockLevels)
        .innerJoin(warehouses, eq(stockLevels.warehouseId, warehouses.id))
        .innerJoin(materials, eq(stockLevels.materialId, materials.id))
        .innerJoin(units, eq(stockLevels.unitId, units.id))
        .where(whereClause),
    ]);

    sendListSuccess(res, items, total, limit, offset);
  } catch (error: unknown) {
    sendError(res, 500, "LOW_STOCK_ERROR", "Düşük stok alarmları alınırken bir hata oluştu");
  }
});

// ========================
// STOK REZERVASYONLARI (STOCK RESERVATIONS)
// ========================

// Rezervasyonları listele
router.get("/stock-reservations", async (req, res) => {
  try {
    const { warehouseId, projectId, materialId, status } = req.query;
    const { limit, offset } = parsePagination(req.query as Record<string, unknown>);

    const conditions: SQL[] = [eq(stockReservations.isActive, true)];

    if (warehouseId) {
      const wId = safeParseInt(warehouseId as string);
      if (wId) conditions.push(eq(stockReservations.warehouseId, wId));
    }
    if (projectId) {
      const pId = safeParseInt(projectId as string);
      if (pId) conditions.push(eq(stockReservations.projectId, pId));
    }
    if (materialId) {
      const mId = safeParseInt(materialId as string);
      if (mId) conditions.push(eq(stockReservations.materialId, mId));
    }
    if (status) {
      conditions.push(eq(stockReservations.status, status as string));
    }

    const whereClause = and(...conditions);

    const [items, [{ total }]] = await Promise.all([
      db
        .select({
          id: stockReservations.id,
          warehouseId: stockReservations.warehouseId,
          warehouseName: warehouses.name,
          projectId: stockReservations.projectId,
          projectCode: projects.code,
          materialId: stockReservations.materialId,
          materialCode: materials.code,
          materialName: materials.name,
          unitId: stockReservations.unitId,
          unitSymbol: units.symbol,
          reservedQuantity: stockReservations.reservedQuantity,
          usedQuantity: stockReservations.usedQuantity,
          remainingQuantity: sql<string>`(${stockReservations.reservedQuantity} - ${stockReservations.usedQuantity})`.as("remaining_quantity"),
          status: stockReservations.status,
          notes: stockReservations.notes,
          createdAt: stockReservations.createdAt,
        })
        .from(stockReservations)
        .innerJoin(warehouses, eq(stockReservations.warehouseId, warehouses.id))
        .innerJoin(projects, eq(stockReservations.projectId, projects.id))
        .innerJoin(materials, eq(stockReservations.materialId, materials.id))
        .innerJoin(units, eq(stockReservations.unitId, units.id))
        .where(whereClause)
        .orderBy(desc(stockReservations.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ total: sql<number>`count(*)::int` })
        .from(stockReservations)
        .innerJoin(warehouses, eq(stockReservations.warehouseId, warehouses.id))
        .innerJoin(projects, eq(stockReservations.projectId, projects.id))
        .innerJoin(materials, eq(stockReservations.materialId, materials.id))
        .innerJoin(units, eq(stockReservations.unitId, units.id))
        .where(whereClause),
    ]);

    sendListSuccess(res, items, total, limit, offset);
  } catch (error: unknown) {
    sendError(res, 500, "RESERVATION_LIST_ERROR", "Rezervasyonlar alınırken bir hata oluştu");
  }
});

// Proje bazlı rezervasyonlar
router.get("/stock-reservations/by-project/:projectId", async (req, res) => {
  try {
    const projectId = safeParseInt(req.params.projectId);
    if (!projectId) return sendError(res, 400, "INVALID_ID", "Geçersiz proje ID");

    const { limit, offset } = parsePagination(req.query as Record<string, unknown>);

    const whereClause = and(
      eq(stockReservations.projectId, projectId),
      eq(stockReservations.isActive, true),
      eq(stockReservations.status, "active")
    );

    const [items, [{ total }]] = await Promise.all([
      db
        .select({
          id: stockReservations.id,
          warehouseId: stockReservations.warehouseId,
          warehouseName: warehouses.name,
          materialId: stockReservations.materialId,
          materialCode: materials.code,
          materialName: materials.name,
          unitId: stockReservations.unitId,
          unitSymbol: units.symbol,
          reservedQuantity: stockReservations.reservedQuantity,
          usedQuantity: stockReservations.usedQuantity,
          remainingQuantity: sql<string>`(${stockReservations.reservedQuantity} - ${stockReservations.usedQuantity})`.as("remaining_quantity"),
          status: stockReservations.status,
        })
        .from(stockReservations)
        .innerJoin(warehouses, eq(stockReservations.warehouseId, warehouses.id))
        .innerJoin(materials, eq(stockReservations.materialId, materials.id))
        .innerJoin(units, eq(stockReservations.unitId, units.id))
        .where(whereClause)
        .orderBy(materials.name)
        .limit(limit)
        .offset(offset),
      db
        .select({ total: sql<number>`count(*)::int` })
        .from(stockReservations)
        .innerJoin(warehouses, eq(stockReservations.warehouseId, warehouses.id))
        .innerJoin(materials, eq(stockReservations.materialId, materials.id))
        .innerJoin(units, eq(stockReservations.unitId, units.id))
        .where(whereClause),
    ]);

    sendListSuccess(res, items, total, limit, offset);
  } catch (error: unknown) {
    sendError(res, 500, "RESERVATION_PROJECT_ERROR", "Proje rezervasyonları alınırken bir hata oluştu");
  }
});

// Yeni rezervasyon oluştur (TRANSACTION ile)
router.post("/stock-reservations", async (req: AuthRequest, res) => {
  try {
    const parsed = insertStockReservationSchema.parse(req.body);
    const auditInfo = captureAuditInfo(req);

    const reservation = await db.transaction(async (tx) => {
      // Mevcut stok kontrolü
      const [stock] = await tx
        .select()
        .from(stockLevels)
        .where(
          and(
            eq(stockLevels.warehouseId, parsed.warehouseId),
            eq(stockLevels.materialId, parsed.materialId),
            eq(stockLevels.unitId, parsed.unitId)
          )
        );

      if (!stock) {
        throw new Error("STOCK_NOT_FOUND");
      }

      const available = parseFloat(stock.currentQuantity) - parseFloat(stock.reservedQuantity);
      const requestedQty = parseFloat(parsed.reservedQuantity);

      if (requestedQty > available) {
        throw new Error(`STOCK_INSUFFICIENT:${available}:${requestedQty}`);
      }

      // Rezervasyon oluştur
      const [created] = await tx
        .insert(stockReservations)
        .values({ ...parsed, createdBy: req.user?.userId, updatedBy: req.user?.userId })
        .returning();

      // stock_levels.reservedQuantity güncelle
      await tx
        .update(stockLevels)
        .set({
          reservedQuantity: sql`${stockLevels.reservedQuantity} + ${requestedQty}`,
          updatedAt: new Date(),
          updatedBy: req.user?.userId,
        })
        .where(eq(stockLevels.id, stock.id));

      return created;
    });

    await createAuditLog("stock_reservations", reservation.id, "INSERT", null, parsed, auditInfo);

    sendSuccess(res, reservation, "Rezervasyon başarıyla oluşturuldu", 201);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "STOCK_NOT_FOUND") {
      return sendError(res, 400, "STOCK_NOT_FOUND", "Bu depoda bu malzeme için stok kaydı bulunamadı");
    }
    if (msg.startsWith("STOCK_INSUFFICIENT:")) {
      const parts = msg.split(":");
      return sendError(res, 400, "STOCK_INSUFFICIENT", `Yetersiz stok. Mevcut: ${parts[1]}, Talep: ${parts[2]}`);
    }
    sendError(res, 400, "RESERVATION_CREATE_ERROR", "Rezervasyon oluşturulurken bir hata oluştu");
  }
});

// Rezervasyon güncelle
router.put("/stock-reservations/:id", async (req: AuthRequest, res) => {
  try {
    const id = safeParseInt(req.params.id);
    if (!id) return sendError(res, 400, "INVALID_ID", "Geçersiz rezervasyon ID");

    const parsed = updateStockReservationSchema.parse(req.body);
    const [result] = await db
      .update(stockReservations)
      .set({ ...parsed, updatedBy: req.user?.userId, updatedAt: new Date() })
      .where(eq(stockReservations.id, id))
      .returning();

    if (!result) {
      return sendError(res, 404, "RESERVATION_NOT_FOUND", "Rezervasyon bulunamadı");
    }
    sendSuccess(res, result, "Rezervasyon başarıyla güncellendi");
  } catch (error: unknown) {
    sendError(res, 400, "RESERVATION_UPDATE_ERROR", "Rezervasyon güncellenirken bir hata oluştu");
  }
});

// Rezervasyon iptal et (TRANSACTION ile)
router.put("/stock-reservations/:id/cancel", async (req: AuthRequest, res) => {
  try {
    const id = safeParseInt(req.params.id);
    if (!id) return sendError(res, 400, "INVALID_ID", "Geçersiz rezervasyon ID");

    const auditInfo = captureAuditInfo(req);

    const result = await db.transaction(async (tx) => {
      // Mevcut rezervasyonu bul
      const [existing] = await tx
        .select()
        .from(stockReservations)
        .where(eq(stockReservations.id, id));

      if (!existing) {
        throw new Error("RESERVATION_NOT_FOUND");
      }
      if (existing.status !== "active") {
        throw new Error("RESERVATION_NOT_ACTIVE");
      }

      // Kalan rezerve miktarı hesapla
      const remainingReserved = parseFloat(existing.reservedQuantity) - parseFloat(existing.usedQuantity);

      // Rezervasyonu iptal et
      const [cancelled] = await tx
        .update(stockReservations)
        .set({ status: "cancelled", updatedBy: req.user?.userId, updatedAt: new Date() })
        .where(eq(stockReservations.id, id))
        .returning();

      // stock_levels.reservedQuantity geri al
      if (remainingReserved > 0) {
        await tx
          .update(stockLevels)
          .set({
            reservedQuantity: sql`${stockLevels.reservedQuantity} - ${remainingReserved}`,
            updatedAt: new Date(),
            updatedBy: req.user?.userId,
          })
          .where(
            and(
              eq(stockLevels.warehouseId, existing.warehouseId),
              eq(stockLevels.materialId, existing.materialId),
              eq(stockLevels.unitId, existing.unitId)
            )
          );
      }

      return cancelled;
    });

    await createAuditLog("stock_reservations", result.id, "UPDATE", { status: "active" }, { status: "cancelled" }, auditInfo);

    sendSuccess(res, { id: result.id }, "Rezervasyon iptal edildi");
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "RESERVATION_NOT_FOUND") {
      return sendError(res, 404, "RESERVATION_NOT_FOUND", "Rezervasyon bulunamadı");
    }
    if (msg === "RESERVATION_NOT_ACTIVE") {
      return sendError(res, 400, "RESERVATION_NOT_ACTIVE", "Sadece aktif rezervasyonlar iptal edilebilir");
    }
    sendError(res, 500, "RESERVATION_CANCEL_ERROR", "Rezervasyon iptal edilirken bir hata oluştu");
  }
});

// ========================
// STOK HAREKETLERİ (STOCK MOVEMENTS)
// ========================

// Stok hareketlerini listele
router.get("/stock-movements", async (req, res) => {
  try {
    const { warehouseId, movementType, status, projectId, companyId, startDate, endDate, isFree } = req.query;
    const { limit, offset } = parsePagination(req.query as Record<string, unknown>);

    const conditions: SQL[] = [];

    if (warehouseId) {
      const wId = safeParseInt(warehouseId as string);
      if (wId) {
        conditions.push(
          or(
            eq(stockMovements.sourceWarehouseId, wId),
            eq(stockMovements.targetWarehouseId, wId)
          )!
        );
      }
    }
    if (movementType) {
      conditions.push(eq(stockMovements.movementType, movementType as string));
    }
    if (status) {
      conditions.push(eq(stockMovements.status, status as string));
    }
    if (projectId) {
      const pId = safeParseInt(projectId as string);
      if (pId) conditions.push(eq(stockMovements.projectId, pId));
    }
    if (companyId) {
      const cId = safeParseInt(companyId as string);
      if (cId) conditions.push(eq(stockMovements.companyId, cId));
    }
    if (isFree === "true") {
      conditions.push(eq(stockMovements.isFree, true));
    } else if (isFree === "false") {
      conditions.push(eq(stockMovements.isFree, false));
    }
    if (startDate) {
      conditions.push(gte(stockMovements.movementDate, new Date(startDate as string)));
    }
    if (endDate) {
      conditions.push(lte(stockMovements.movementDate, new Date(endDate as string)));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, [{ total }]] = await Promise.all([
      db
        .select({
          id: stockMovements.id,
          movementCode: stockMovements.movementCode,
          movementType: stockMovements.movementType,
          movementDate: stockMovements.movementDate,
          sourceWarehouseId: stockMovements.sourceWarehouseId,
          targetWarehouseId: stockMovements.targetWarehouseId,
          projectId: stockMovements.projectId,
          companyId: stockMovements.companyId,
          isFree: stockMovements.isFree,
          referenceType: stockMovements.referenceType,
          referenceNo: stockMovements.referenceNo,
          description: stockMovements.description,
          status: stockMovements.status,
          createdAt: stockMovements.createdAt,
        })
        .from(stockMovements)
        .where(whereClause)
        .orderBy(desc(stockMovements.movementDate))
        .limit(limit)
        .offset(offset),
      db.select({ total: sql<number>`count(*)::int` }).from(stockMovements).where(whereClause),
    ]);

    sendListSuccess(res, items, total, limit, offset);
  } catch (error: unknown) {
    sendError(res, 500, "MOVEMENT_LIST_ERROR", "Stok hareketleri alınırken bir hata oluştu");
  }
});

// Hareket detayı (item'larıyla birlikte)
router.get("/stock-movements/:id", async (req, res) => {
  try {
    const id = safeParseInt(req.params.id);
    if (!id) return sendError(res, 400, "INVALID_ID", "Geçersiz hareket ID");

    const [movement] = await db
      .select()
      .from(stockMovements)
      .where(eq(stockMovements.id, id));

    if (!movement) {
      return sendError(res, 404, "MOVEMENT_NOT_FOUND", "Stok hareketi bulunamadı");
    }

    const items = await db
      .select({
        id: stockMovementItems.id,
        materialId: stockMovementItems.materialId,
        materialCode: materials.code,
        materialName: materials.name,
        unitId: stockMovementItems.unitId,
        unitName: units.name,
        unitSymbol: units.symbol,
        quantity: stockMovementItems.quantity,
        unitPriceCents: stockMovementItems.unitPriceCents,
        lineTotalCents: stockMovementItems.lineTotalCents,
        isFree: stockMovementItems.isFree,
        notes: stockMovementItems.notes,
      })
      .from(stockMovementItems)
      .innerJoin(materials, eq(stockMovementItems.materialId, materials.id))
      .innerJoin(units, eq(stockMovementItems.unitId, units.id))
      .where(eq(stockMovementItems.movementId, id));

    sendSuccess(res, { ...movement, items });
  } catch (error: unknown) {
    sendError(res, 500, "MOVEMENT_FETCH_ERROR", "Stok hareketi bilgileri alınırken bir hata oluştu");
  }
});

// Yeni stok hareketi oluştur
router.post("/stock-movements", async (req: AuthRequest, res) => {
  try {
    const parsed = insertStockMovementSchema.parse(req.body);
    const auditInfo = captureAuditInfo(req);

    // Transfer'de kaynak ve hedef depo aynı olamaz
    if (parsed.movementType === "transfer" && parsed.sourceWarehouseId && parsed.targetWarehouseId) {
      if (parsed.sourceWarehouseId === parsed.targetWarehouseId) {
        return sendError(res, 400, "SAME_WAREHOUSE", "Transfer işleminde kaynak ve hedef depo aynı olamaz");
      }
    }

    const movementCode = await generateMovementCode();

    const [result] = await db
      .insert(stockMovements)
      .values({
        ...parsed,
        movementCode,
        movementDate: parsed.movementDate ? new Date(parsed.movementDate) : new Date(),
        createdBy: req.user?.userId,
        updatedBy: req.user?.userId,
      })
      .returning();

    await createAuditLog("stock_movements", result.id, "INSERT", null, { ...parsed, movementCode }, auditInfo);

    sendSuccess(res, result, "Stok hareketi oluşturuldu", 201);
  } catch (error: unknown) {
    sendError(res, 400, "MOVEMENT_CREATE_ERROR", "Stok hareketi oluşturulurken bir hata oluştu");
  }
});

// Stok hareketi güncelle
router.put("/stock-movements/:id", async (req: AuthRequest, res) => {
  try {
    const id = safeParseInt(req.params.id);
    if (!id) return sendError(res, 400, "INVALID_ID", "Geçersiz hareket ID");

    // Sadece taslak durumundaki hareketler güncellenebilir
    const [existing] = await db
      .select({ status: stockMovements.status })
      .from(stockMovements)
      .where(eq(stockMovements.id, id));

    if (!existing) {
      return sendError(res, 404, "MOVEMENT_NOT_FOUND", "Stok hareketi bulunamadı");
    }
    if (existing.status !== "taslak") {
      return sendError(res, 400, "MOVEMENT_NOT_DRAFT", "Sadece taslak durumundaki hareketler güncellenebilir");
    }

    const parsed = updateStockMovementSchema.parse(req.body);
    const auditInfo = captureAuditInfo(req);

    const updateData: Record<string, unknown> = {
      ...parsed,
      updatedBy: req.user?.userId,
      updatedAt: new Date(),
    };
    if (parsed.movementDate) {
      updateData.movementDate = new Date(parsed.movementDate);
    }

    const [result] = await db
      .update(stockMovements)
      .set(updateData as typeof stockMovements.$inferInsert)
      .where(eq(stockMovements.id, id))
      .returning();

    await createAuditLog("stock_movements", result.id, "UPDATE", existing, parsed, auditInfo);

    sendSuccess(res, result, "Stok hareketi güncellendi");
  } catch (error: unknown) {
    sendError(res, 400, "MOVEMENT_UPDATE_ERROR", "Stok hareketi güncellenirken bir hata oluştu");
  }
});

// Harekete detay satırı ekle
router.post("/stock-movements/:id/items", async (req: AuthRequest, res) => {
  try {
    const id = safeParseInt(req.params.id);
    if (!id) return sendError(res, 400, "INVALID_ID", "Geçersiz hareket ID");

    // Hareket var mı ve taslak mı kontrol et
    const [movement] = await db
      .select({ status: stockMovements.status, isFree: stockMovements.isFree })
      .from(stockMovements)
      .where(eq(stockMovements.id, id));

    if (!movement) {
      return sendError(res, 404, "MOVEMENT_NOT_FOUND", "Stok hareketi bulunamadı");
    }
    if (movement.status !== "taslak") {
      return sendError(res, 400, "MOVEMENT_NOT_DRAFT", "Sadece taslak durumundaki hareketlere satır eklenebilir");
    }

    const parsed = insertStockMovementItemSchema.parse(req.body);
    const auditInfo = captureAuditInfo(req);

    // Bedelsiz harekette fiyat sıfırla
    const isFree = parsed.isFree ?? movement.isFree;
    const unitPriceCents = isFree ? 0 : (parsed.unitPriceCents || 0);
    const lineTotalCents = isFree ? 0 : (parsed.lineTotalCents || 0);

    const [result] = await db
      .insert(stockMovementItems)
      .values({
        ...parsed,
        movementId: id,
        isFree,
        unitPriceCents,
        lineTotalCents,
      })
      .returning();

    await createAuditLog("stock_movement_items", result.id, "INSERT", null, { ...parsed, movementId: id }, auditInfo);

    sendSuccess(res, result, "Hareket kalemi eklendi", 201);
  } catch (error: unknown) {
    sendError(res, 400, "MOVEMENT_ITEM_ADD_ERROR", "Hareket kalemi eklenirken bir hata oluştu");
  }
});

// Hareket detay satırı güncelle
router.put("/stock-movement-items/:id", async (req: AuthRequest, res) => {
  try {
    const id = safeParseInt(req.params.id);
    if (!id) return sendError(res, 400, "INVALID_ID", "Geçersiz kalem ID");

    const parsed = updateStockMovementItemSchema.parse(req.body);

    const [result] = await db
      .update(stockMovementItems)
      .set(parsed)
      .where(eq(stockMovementItems.id, id))
      .returning();

    if (!result) {
      return sendError(res, 404, "MOVEMENT_ITEM_NOT_FOUND", "Hareket satırı bulunamadı");
    }
    sendSuccess(res, result, "Hareket kalemi güncellendi");
  } catch (error: unknown) {
    sendError(res, 400, "MOVEMENT_ITEM_UPDATE_ERROR", "Hareket kalemi güncellenirken bir hata oluştu");
  }
});

// Hareket detay satırı sil
router.delete("/stock-movement-items/:id", async (req: AuthRequest, res) => {
  try {
    const id = safeParseInt(req.params.id);
    if (!id) return sendError(res, 400, "INVALID_ID", "Geçersiz kalem ID");

    const auditInfo = captureAuditInfo(req);

    const [result] = await db
      .delete(stockMovementItems)
      .where(eq(stockMovementItems.id, id))
      .returning();

    if (!result) {
      return sendError(res, 404, "MOVEMENT_ITEM_NOT_FOUND", "Hareket satırı bulunamadı");
    }

    await createAuditLog("stock_movement_items", result.id, "DELETE", result, null, auditInfo);

    sendSuccess(res, { id: result.id }, "Satır silindi");
  } catch (error: unknown) {
    sendError(res, 500, "MOVEMENT_ITEM_DELETE_ERROR", "Hareket satırı silinirken bir hata oluştu");
  }
});

// Stok hareketini onayla — TRANSACTION ile stok seviyelerini günceller
router.put("/stock-movements/:id/approve", async (req: AuthRequest, res) => {
  try {
    const id = safeParseInt(req.params.id);
    if (!id) return sendError(res, 400, "INVALID_ID", "Geçersiz hareket ID");

    const [movement] = await db
      .select()
      .from(stockMovements)
      .where(eq(stockMovements.id, id));

    if (!movement) {
      return sendError(res, 404, "MOVEMENT_NOT_FOUND", "Stok hareketi bulunamadı");
    }
    if (movement.status !== "taslak") {
      return sendError(res, 400, "MOVEMENT_NOT_DRAFT", "Sadece taslak durumundaki hareketler onaylanabilir");
    }

    // Hareket kalemlerini al
    const items = await db
      .select()
      .from(stockMovementItems)
      .where(eq(stockMovementItems.movementId, id));

    if (items.length === 0) {
      return sendError(res, 400, "MOVEMENT_NO_ITEMS", "Hareket onaylanmadan önce en az bir kalem eklenmelidir");
    }

    const auditInfo = captureAuditInfo(req);

    // Tüm stok güncellemelerini tek transaction'da yap
    const result = await db.transaction(async (tx) => {
      for (const item of items) {
        const qty = parseFloat(item.quantity);

        if (movement.movementType === "giris") {
          await upsertStockLevel(movement.targetWarehouseId!, item.materialId, item.unitId, qty, req.user?.userId, tx);
        } else if (movement.movementType === "cikis") {
          await decreaseStockLevel(movement.sourceWarehouseId!, item.materialId, item.unitId, qty, req.user?.userId, tx);

          if (movement.referenceType === "taseron_teslim" && movement.companyId && movement.projectId) {
            await upsertSubcontractorMaterial(
              movement.companyId,
              movement.projectId,
              movement.sourceWarehouseId!,
              item.materialId,
              item.unitId,
              qty,
              item.isFree,
              req.user?.userId,
              tx
            );
          }
        } else if (movement.movementType === "transfer") {
          await decreaseStockLevel(movement.sourceWarehouseId!, item.materialId, item.unitId, qty, req.user?.userId, tx);
          await upsertStockLevel(movement.targetWarehouseId!, item.materialId, item.unitId, qty, req.user?.userId, tx);
        } else if (movement.movementType === "iade") {
          await upsertStockLevel(movement.targetWarehouseId!, item.materialId, item.unitId, qty, req.user?.userId, tx);

          if (movement.companyId && movement.projectId) {
            await tx
              .update(subcontractorMaterials)
              .set({
                returnedQuantity: sql`${subcontractorMaterials.returnedQuantity} + ${qty}`,
                lastUpdateDate: new Date(),
                updatedAt: new Date(),
                updatedBy: req.user?.userId,
              })
              .where(
                and(
                  eq(subcontractorMaterials.companyId, movement.companyId),
                  eq(subcontractorMaterials.projectId, movement.projectId),
                  eq(subcontractorMaterials.materialId, item.materialId),
                  eq(subcontractorMaterials.unitId, item.unitId)
                )
              );
          }
        } else if (movement.movementType === "sayim_duzeltme") {
          if (movement.targetWarehouseId) {
            await upsertStockLevel(movement.targetWarehouseId, item.materialId, item.unitId, qty, req.user?.userId, tx);
          } else if (movement.sourceWarehouseId) {
            await decreaseStockLevel(movement.sourceWarehouseId, item.materialId, item.unitId, qty, req.user?.userId, tx);
          }
        }
      }

      // Hareketi onayla
      const [approved] = await tx
        .update(stockMovements)
        .set({
          status: "onaylandi",
          approvedBy: req.user?.userId,
          approvedAt: new Date(),
          updatedBy: req.user?.userId,
          updatedAt: new Date(),
        })
        .where(eq(stockMovements.id, id))
        .returning();

      return approved;
    });

    await createAuditLog(
      "stock_movements", result.id, "UPDATE",
      { status: "taslak" },
      { status: "onaylandi", approvedBy: req.user?.userId, itemCount: items.length },
      auditInfo
    );

    sendSuccess(res, { movement: result }, "Stok hareketi onaylandı ve stok seviyeleri güncellendi");
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "";
    if (msg.includes("Yetersiz stok")) {
      return sendError(res, 400, "STOCK_INSUFFICIENT", msg);
    }
    if (msg.includes("Stok kaydı bulunamadı")) {
      return sendError(res, 400, "STOCK_NOT_FOUND", msg);
    }
    sendError(res, 500, "MOVEMENT_APPROVE_ERROR", "Stok hareketi onaylanırken bir hata oluştu");
  }
});

// ========================
// TAŞERON MALZEME TAKİBİ
// ========================

// Taşeron malzeme listesi
router.get("/subcontractor-materials", async (req, res) => {
  try {
    const { companyId, projectId, warehouseId } = req.query;
    const { limit, offset } = parsePagination(req.query as Record<string, unknown>);

    const conditions: SQL[] = [];

    if (companyId) {
      const cId = safeParseInt(companyId as string);
      if (cId) conditions.push(eq(subcontractorMaterials.companyId, cId));
    }
    if (projectId) {
      const pId = safeParseInt(projectId as string);
      if (pId) conditions.push(eq(subcontractorMaterials.projectId, pId));
    }
    if (warehouseId) {
      const wId = safeParseInt(warehouseId as string);
      if (wId) conditions.push(eq(subcontractorMaterials.warehouseId, wId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, [{ total }]] = await Promise.all([
      db
        .select({
          id: subcontractorMaterials.id,
          companyId: subcontractorMaterials.companyId,
          companyName: companies.name,
          projectId: subcontractorMaterials.projectId,
          projectCode: projects.code,
          warehouseId: subcontractorMaterials.warehouseId,
          warehouseName: warehouses.name,
          materialId: subcontractorMaterials.materialId,
          materialCode: materials.code,
          materialName: materials.name,
          unitId: subcontractorMaterials.unitId,
          unitSymbol: units.symbol,
          givenQuantity: subcontractorMaterials.givenQuantity,
          usedQuantity: subcontractorMaterials.usedQuantity,
          returnedQuantity: subcontractorMaterials.returnedQuantity,
          wasteQuantity: subcontractorMaterials.wasteQuantity,
          remainingQuantity: sql<string>`(${subcontractorMaterials.givenQuantity} - ${subcontractorMaterials.usedQuantity} - ${subcontractorMaterials.returnedQuantity} - ${subcontractorMaterials.wasteQuantity})`.as("remaining_quantity"),
          isFree: subcontractorMaterials.isFree,
          lastUpdateDate: subcontractorMaterials.lastUpdateDate,
        })
        .from(subcontractorMaterials)
        .innerJoin(companies, eq(subcontractorMaterials.companyId, companies.id))
        .innerJoin(projects, eq(subcontractorMaterials.projectId, projects.id))
        .innerJoin(warehouses, eq(subcontractorMaterials.warehouseId, warehouses.id))
        .innerJoin(materials, eq(subcontractorMaterials.materialId, materials.id))
        .innerJoin(units, eq(subcontractorMaterials.unitId, units.id))
        .where(whereClause)
        .orderBy(companies.name, materials.name)
        .limit(limit)
        .offset(offset),
      db
        .select({ total: sql<number>`count(*)::int` })
        .from(subcontractorMaterials)
        .innerJoin(companies, eq(subcontractorMaterials.companyId, companies.id))
        .innerJoin(projects, eq(subcontractorMaterials.projectId, projects.id))
        .innerJoin(warehouses, eq(subcontractorMaterials.warehouseId, warehouses.id))
        .innerJoin(materials, eq(subcontractorMaterials.materialId, materials.id))
        .innerJoin(units, eq(subcontractorMaterials.unitId, units.id))
        .where(whereClause),
    ]);

    sendListSuccess(res, items, total, limit, offset);
  } catch (error: unknown) {
    sendError(res, 500, "SUBCONTRACTOR_LIST_ERROR", "Taşeron malzemeleri alınırken bir hata oluştu");
  }
});

// Firma bazlı taşeron malzeme
router.get("/subcontractor-materials/by-company/:companyId", async (req, res) => {
  try {
    const companyId = safeParseInt(req.params.companyId);
    if (!companyId) return sendError(res, 400, "INVALID_ID", "Geçersiz firma ID");

    const { limit, offset } = parsePagination(req.query as Record<string, unknown>);

    const whereClause = eq(subcontractorMaterials.companyId, companyId);

    const [items, [{ total }]] = await Promise.all([
      db
        .select({
          id: subcontractorMaterials.id,
          projectId: subcontractorMaterials.projectId,
          projectCode: projects.code,
          materialId: subcontractorMaterials.materialId,
          materialCode: materials.code,
          materialName: materials.name,
          unitSymbol: units.symbol,
          givenQuantity: subcontractorMaterials.givenQuantity,
          usedQuantity: subcontractorMaterials.usedQuantity,
          returnedQuantity: subcontractorMaterials.returnedQuantity,
          wasteQuantity: subcontractorMaterials.wasteQuantity,
          remainingQuantity: sql<string>`(${subcontractorMaterials.givenQuantity} - ${subcontractorMaterials.usedQuantity} - ${subcontractorMaterials.returnedQuantity} - ${subcontractorMaterials.wasteQuantity})`.as("remaining_quantity"),
          isFree: subcontractorMaterials.isFree,
        })
        .from(subcontractorMaterials)
        .innerJoin(projects, eq(subcontractorMaterials.projectId, projects.id))
        .innerJoin(materials, eq(subcontractorMaterials.materialId, materials.id))
        .innerJoin(units, eq(subcontractorMaterials.unitId, units.id))
        .where(whereClause)
        .orderBy(materials.name)
        .limit(limit)
        .offset(offset),
      db
        .select({ total: sql<number>`count(*)::int` })
        .from(subcontractorMaterials)
        .innerJoin(projects, eq(subcontractorMaterials.projectId, projects.id))
        .innerJoin(materials, eq(subcontractorMaterials.materialId, materials.id))
        .innerJoin(units, eq(subcontractorMaterials.unitId, units.id))
        .where(whereClause),
    ]);

    sendListSuccess(res, items, total, limit, offset);
  } catch (error: unknown) {
    sendError(res, 500, "SUBCONTRACTOR_COMPANY_ERROR", "Firma malzemeleri alınırken bir hata oluştu");
  }
});

// Taşeron malzeme özet raporu
router.get("/subcontractor-materials/summary", async (req, res) => {
  try {
    const result = await db
      .select({
        companyId: subcontractorMaterials.companyId,
        companyName: companies.name,
        totalGiven: sql<string>`SUM(${subcontractorMaterials.givenQuantity})`.as("total_given"),
        totalUsed: sql<string>`SUM(${subcontractorMaterials.usedQuantity})`.as("total_used"),
        totalReturned: sql<string>`SUM(${subcontractorMaterials.returnedQuantity})`.as("total_returned"),
        totalWaste: sql<string>`SUM(${subcontractorMaterials.wasteQuantity})`.as("total_waste"),
        totalRemaining: sql<string>`SUM(${subcontractorMaterials.givenQuantity} - ${subcontractorMaterials.usedQuantity} - ${subcontractorMaterials.returnedQuantity} - ${subcontractorMaterials.wasteQuantity})`.as("total_remaining"),
        materialCount: sql<number>`COUNT(DISTINCT ${subcontractorMaterials.materialId})`.as("material_count"),
      })
      .from(subcontractorMaterials)
      .innerJoin(companies, eq(subcontractorMaterials.companyId, companies.id))
      .groupBy(subcontractorMaterials.companyId, companies.name)
      .orderBy(companies.name);

    sendSuccess(res, { items: result });
  } catch (error: unknown) {
    sendError(res, 500, "SUBCONTRACTOR_SUMMARY_ERROR", "Taşeron özet raporu alınırken bir hata oluştu");
  }
});

// Taşeron malzeme kullanım/fire güncelle
router.put("/subcontractor-materials/:id", async (req: AuthRequest, res) => {
  try {
    const id = safeParseInt(req.params.id);
    if (!id) return sendError(res, 400, "INVALID_ID", "Geçersiz taşeron malzeme ID");

    const parsed = updateSubcontractorMaterialSchema.parse(req.body);
    const auditInfo = captureAuditInfo(req);

    // Mevcut kaydı al (audit için)
    const [oldRecord] = await db
      .select()
      .from(subcontractorMaterials)
      .where(eq(subcontractorMaterials.id, id));

    const [result] = await db
      .update(subcontractorMaterials)
      .set({ ...parsed, lastUpdateDate: new Date(), updatedAt: new Date(), updatedBy: req.user?.userId })
      .where(eq(subcontractorMaterials.id, id))
      .returning();

    if (!result) {
      return sendError(res, 404, "SUBCONTRACTOR_MATERIAL_NOT_FOUND", "Taşeron malzeme kaydı bulunamadı");
    }

    await createAuditLog("subcontractor_materials", result.id, "UPDATE", oldRecord || null, parsed, auditInfo);

    sendSuccess(res, result, "Taşeron malzeme kaydı güncellendi");
  } catch (error: unknown) {
    sendError(res, 400, "SUBCONTRACTOR_UPDATE_ERROR", "Taşeron malzeme güncellenirken bir hata oluştu");
  }
});

export default router;
