import { Router } from "express";
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
  insertSubcontractorMaterialSchema,
  updateSubcontractorMaterialSchema,
} from "../shared/schema";
import { eq, and, desc, asc, sql, gte, lte, or, ilike } from "drizzle-orm";

const router = Router();

// TÜM ROUTE'LAR İÇİN AUTHENTİCATİON ZORUNLU
router.use(authenticateToken);

// ========================
// DEPOLAR (WAREHOUSES)
// ========================

// Tüm depoları listele
router.get("/warehouses", async (req, res) => {
  try {
    const { workAreaId, warehouseType, active, search } = req.query;

    const conditions: any[] = [];

    if (active !== "false") {
      conditions.push(eq(warehouses.isActive, true));
    }
    if (workAreaId) {
      conditions.push(eq(warehouses.workAreaId, parseInt(workAreaId as string)));
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
        )
      );
    }

    const result = await db
      .select({
        id: warehouses.id,
        code: warehouses.code,
        name: warehouses.name,
        workAreaId: warehouses.workAreaId,
        workAreaName: workAreas.name,
        managerId: warehouses.managerId,
        managerName: sql`CONCAT(${personnel.name}, ' ', ${personnel.surname})`.as("managerName"),
        warehouseType: warehouses.warehouseType,
        address: warehouses.address,
        isActive: warehouses.isActive,
        createdAt: warehouses.createdAt,
        updatedAt: warehouses.updatedAt,
      })
      .from(warehouses)
      .leftJoin(workAreas, eq(warehouses.workAreaId, workAreas.id))
      .leftJoin(personnel, eq(warehouses.managerId, personnel.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(warehouses.name);

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Depo detayı
router.get("/warehouses/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db
      .select({
        id: warehouses.id,
        code: warehouses.code,
        name: warehouses.name,
        workAreaId: warehouses.workAreaId,
        workAreaName: workAreas.name,
        managerId: warehouses.managerId,
        managerName: sql`CONCAT(${personnel.name}, ' ', ${personnel.surname})`.as("managerName"),
        warehouseType: warehouses.warehouseType,
        address: warehouses.address,
        isActive: warehouses.isActive,
        createdAt: warehouses.createdAt,
        updatedAt: warehouses.updatedAt,
      })
      .from(warehouses)
      .leftJoin(workAreas, eq(warehouses.workAreaId, workAreas.id))
      .leftJoin(personnel, eq(warehouses.managerId, personnel.id))
      .where(eq(warehouses.id, parseInt(id)));

    if (!result) {
      return res.status(404).json({ error: "Depo bulunamadı" });
    }
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Yeni depo oluştur
router.post("/warehouses", async (req: AuthRequest, res) => {
  try {
    const parsed = insertWarehouseSchema.parse(req.body);
    const [inserted] = await db
      .insert(warehouses)
      .values({ ...parsed, createdBy: req.user?.userId, updatedBy: req.user?.userId })
      .returning();

    // Return with joined managerName and workAreaName
    const [result] = await db
      .select({
        id: warehouses.id,
        code: warehouses.code,
        name: warehouses.name,
        workAreaId: warehouses.workAreaId,
        workAreaName: workAreas.name,
        managerId: warehouses.managerId,
        managerName: sql`CONCAT(${personnel.name}, ' ', ${personnel.surname})`.as("managerName"),
        warehouseType: warehouses.warehouseType,
        address: warehouses.address,
        isActive: warehouses.isActive,
        createdAt: warehouses.createdAt,
        updatedAt: warehouses.updatedAt,
      })
      .from(warehouses)
      .leftJoin(workAreas, eq(warehouses.workAreaId, workAreas.id))
      .leftJoin(personnel, eq(warehouses.managerId, personnel.id))
      .where(eq(warehouses.id, inserted.id));

    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Depo güncelle
router.put("/warehouses/:id", async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const parsed = updateWarehouseSchema.parse(req.body);
    const [updated] = await db
      .update(warehouses)
      .set({ ...parsed, updatedBy: req.user?.userId, updatedAt: new Date() })
      .where(eq(warehouses.id, parseInt(id)))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "Depo bulunamadı" });
    }

    // Return with joined managerName and workAreaName
    const [result] = await db
      .select({
        id: warehouses.id,
        code: warehouses.code,
        name: warehouses.name,
        workAreaId: warehouses.workAreaId,
        workAreaName: workAreas.name,
        managerId: warehouses.managerId,
        managerName: sql`CONCAT(${personnel.name}, ' ', ${personnel.surname})`.as("managerName"),
        warehouseType: warehouses.warehouseType,
        address: warehouses.address,
        isActive: warehouses.isActive,
        createdAt: warehouses.createdAt,
        updatedAt: warehouses.updatedAt,
      })
      .from(warehouses)
      .leftJoin(workAreas, eq(warehouses.workAreaId, workAreas.id))
      .leftJoin(personnel, eq(warehouses.managerId, personnel.id))
      .where(eq(warehouses.id, updated.id));

    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Depo sil (soft delete)
router.delete("/warehouses/:id", async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const [result] = await db
      .update(warehouses)
      .set({ isActive: false, updatedBy: req.user?.userId, updatedAt: new Date() })
      .where(eq(warehouses.id, parseInt(id)))
      .returning();

    if (!result) {
      return res.status(404).json({ error: "Depo bulunamadı" });
    }
    res.json({ message: "Depo başarıyla silindi", id: result.id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Depo stok özeti
router.get("/warehouses/:id/stock", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db
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
      .where(eq(stockLevels.warehouseId, parseInt(id)))
      .orderBy(materials.name);

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ========================
// STOK SEVİYELERİ (STOCK LEVELS)
// ========================

// Stok seviyelerini listele (filtreli)
router.get("/stock-levels", async (req, res) => {
  try {
    const { warehouseId, materialId, search } = req.query;

    const conditions: any[] = [];

    if (warehouseId) {
      conditions.push(eq(stockLevels.warehouseId, parseInt(warehouseId as string)));
    }
    if (materialId) {
      conditions.push(eq(stockLevels.materialId, parseInt(materialId as string)));
    }
    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(
        or(
          ilike(materials.name, searchTerm),
          ilike(materials.code, searchTerm)
        )
      );
    }

    const result = await db
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
      .innerJoin(units, eq(stockLevels.unitId, units.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(warehouses.name, materials.name);

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Minimum stok altı alarm listesi
router.get("/stock-levels/low-stock", async (req, res) => {
  try {
    const { warehouseId } = req.query;

    const conditions: any[] = [
      sql`${stockLevels.minQuantity} IS NOT NULL`,
      sql`${stockLevels.currentQuantity} <= ${stockLevels.minQuantity}`,
    ];

    if (warehouseId) {
      conditions.push(eq(stockLevels.warehouseId, parseInt(warehouseId as string)));
    }

    const result = await db
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
      .where(and(...conditions))
      .orderBy(materials.name);

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ========================
// STOK REZERVASYONLARI (STOCK RESERVATIONS)
// ========================

// Rezervasyonları listele
router.get("/stock-reservations", async (req, res) => {
  try {
    const { warehouseId, projectId, materialId, status } = req.query;

    const conditions: any[] = [eq(stockReservations.isActive, true)];

    if (warehouseId) {
      conditions.push(eq(stockReservations.warehouseId, parseInt(warehouseId as string)));
    }
    if (projectId) {
      conditions.push(eq(stockReservations.projectId, parseInt(projectId as string)));
    }
    if (materialId) {
      conditions.push(eq(stockReservations.materialId, parseInt(materialId as string)));
    }
    if (status) {
      conditions.push(eq(stockReservations.status, status as string));
    }

    const result = await db
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
      .where(and(...conditions))
      .orderBy(desc(stockReservations.createdAt));

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Proje bazlı rezervasyonlar
router.get("/stock-reservations/by-project/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;
    const result = await db
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
      .where(
        and(
          eq(stockReservations.projectId, parseInt(projectId)),
          eq(stockReservations.isActive, true),
          eq(stockReservations.status, "active")
        )
      )
      .orderBy(materials.name);

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Yeni rezervasyon oluştur
router.post("/stock-reservations", async (req: AuthRequest, res) => {
  try {
    const parsed = insertStockReservationSchema.parse(req.body);

    // Mevcut stok kontrolü
    const [stock] = await db
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
      return res.status(400).json({ error: "Bu depoda bu malzeme için stok kaydı bulunamadı" });
    }

    const available = parseFloat(stock.currentQuantity) - parseFloat(stock.reservedQuantity);
    const requestedQty = parseFloat(parsed.reservedQuantity);

    if (requestedQty > available) {
      return res.status(400).json({
        error: `Yetersiz stok. Mevcut: ${available}, Talep: ${requestedQty}`,
      });
    }

    // Rezervasyon oluştur
    const [reservation] = await db
      .insert(stockReservations)
      .values({ ...parsed, createdBy: req.user?.userId, updatedBy: req.user?.userId })
      .returning();

    // stock_levels.reservedQuantity güncelle
    await db
      .update(stockLevels)
      .set({
        reservedQuantity: sql`${stockLevels.reservedQuantity} + ${requestedQty}`,
        updatedAt: new Date(),
        updatedBy: req.user?.userId,
      })
      .where(eq(stockLevels.id, stock.id));

    res.status(201).json(reservation);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Rezervasyon güncelle
router.put("/stock-reservations/:id", async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const parsed = updateStockReservationSchema.parse(req.body);
    const [result] = await db
      .update(stockReservations)
      .set({ ...parsed, updatedBy: req.user?.userId, updatedAt: new Date() })
      .where(eq(stockReservations.id, parseInt(id)))
      .returning();

    if (!result) {
      return res.status(404).json({ error: "Rezervasyon bulunamadı" });
    }
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Rezervasyon iptal et
router.put("/stock-reservations/:id/cancel", async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Mevcut rezervasyonu bul
    const [existing] = await db
      .select()
      .from(stockReservations)
      .where(eq(stockReservations.id, parseInt(id)));

    if (!existing) {
      return res.status(404).json({ error: "Rezervasyon bulunamadı" });
    }
    if (existing.status !== "active") {
      return res.status(400).json({ error: "Sadece aktif rezervasyonlar iptal edilebilir" });
    }

    // Kalan rezerve miktarı hesapla
    const remainingReserved = parseFloat(existing.reservedQuantity) - parseFloat(existing.usedQuantity);

    // Rezervasyonu iptal et
    const [result] = await db
      .update(stockReservations)
      .set({ status: "cancelled", updatedBy: req.user?.userId, updatedAt: new Date() })
      .where(eq(stockReservations.id, parseInt(id)))
      .returning();

    // stock_levels.reservedQuantity geri al
    if (remainingReserved > 0) {
      await db
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

    res.json({ message: "Rezervasyon iptal edildi", id: result.id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ========================
// STOK HAREKETLERİ (STOCK MOVEMENTS)
// ========================

// Hareket kodu üret
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

// Stok hareketlerini listele
router.get("/stock-movements", async (req, res) => {
  try {
    const { warehouseId, movementType, status, projectId, companyId, startDate, endDate, isFree } = req.query;

    const conditions: any[] = [];

    if (warehouseId) {
      const wId = parseInt(warehouseId as string);
      conditions.push(
        or(
          eq(stockMovements.sourceWarehouseId, wId),
          eq(stockMovements.targetWarehouseId, wId)
        )
      );
    }
    if (movementType) {
      conditions.push(eq(stockMovements.movementType, movementType as string));
    }
    if (status) {
      conditions.push(eq(stockMovements.status, status as string));
    }
    if (projectId) {
      conditions.push(eq(stockMovements.projectId, parseInt(projectId as string)));
    }
    if (companyId) {
      conditions.push(eq(stockMovements.companyId, parseInt(companyId as string)));
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

    const result = await db
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
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(stockMovements.movementDate))
      .limit(200);

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Hareket detayı (item'larıyla birlikte)
router.get("/stock-movements/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [movement] = await db
      .select()
      .from(stockMovements)
      .where(eq(stockMovements.id, parseInt(id)));

    if (!movement) {
      return res.status(404).json({ error: "Stok hareketi bulunamadı" });
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
      .where(eq(stockMovementItems.movementId, parseInt(id)));

    res.json({ ...movement, items });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Yeni stok hareketi oluştur
router.post("/stock-movements", async (req: AuthRequest, res) => {
  try {
    const parsed = insertStockMovementSchema.parse(req.body);
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

    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Stok hareketi güncelle
router.put("/stock-movements/:id", async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Sadece taslak durumundaki hareketler güncellenebilir
    const [existing] = await db
      .select({ status: stockMovements.status })
      .from(stockMovements)
      .where(eq(stockMovements.id, parseInt(id)));

    if (!existing) {
      return res.status(404).json({ error: "Stok hareketi bulunamadı" });
    }
    if (existing.status !== "taslak") {
      return res.status(400).json({ error: "Sadece taslak durumundaki hareketler güncellenebilir" });
    }

    const parsed = updateStockMovementSchema.parse(req.body);
    const [result] = await db
      .update(stockMovements)
      .set({ ...parsed, updatedBy: req.user?.userId, updatedAt: new Date() })
      .where(eq(stockMovements.id, parseInt(id)))
      .returning();

    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Harekete detay satırı ekle
router.post("/stock-movements/:id/items", async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Hareket var mı ve taslak mı kontrol et
    const [movement] = await db
      .select({ status: stockMovements.status, isFree: stockMovements.isFree })
      .from(stockMovements)
      .where(eq(stockMovements.id, parseInt(id)));

    if (!movement) {
      return res.status(404).json({ error: "Stok hareketi bulunamadı" });
    }
    if (movement.status !== "taslak") {
      return res.status(400).json({ error: "Sadece taslak durumundaki hareketlere satır eklenebilir" });
    }

    const parsed = insertStockMovementItemSchema.parse(req.body);

    // Bedelsiz harekette fiyat sıfırla
    const isFree = parsed.isFree ?? movement.isFree;
    const unitPriceCents = isFree ? 0 : (parsed.unitPriceCents || 0);
    const lineTotalCents = isFree ? 0 : (parsed.lineTotalCents || 0);

    const [result] = await db
      .insert(stockMovementItems)
      .values({
        ...parsed,
        movementId: parseInt(id),
        isFree,
        unitPriceCents,
        lineTotalCents,
      })
      .returning();

    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Hareket detay satırı güncelle
router.put("/stock-movement-items/:id", async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const parsed = updateStockMovementItemSchema.parse(req.body);

    const [result] = await db
      .update(stockMovementItems)
      .set(parsed)
      .where(eq(stockMovementItems.id, parseInt(id)))
      .returning();

    if (!result) {
      return res.status(404).json({ error: "Hareket satırı bulunamadı" });
    }
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Hareket detay satırı sil
router.delete("/stock-movement-items/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db
      .delete(stockMovementItems)
      .where(eq(stockMovementItems.id, parseInt(id)))
      .returning();

    if (!result) {
      return res.status(404).json({ error: "Hareket satırı bulunamadı" });
    }
    res.json({ message: "Satır silindi", id: result.id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Stok hareketini onayla — stok seviyelerini günceller
router.put("/stock-movements/:id/approve", async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const [movement] = await db
      .select()
      .from(stockMovements)
      .where(eq(stockMovements.id, parseInt(id)));

    if (!movement) {
      return res.status(404).json({ error: "Stok hareketi bulunamadı" });
    }
    if (movement.status !== "taslak") {
      return res.status(400).json({ error: "Sadece taslak durumundaki hareketler onaylanabilir" });
    }

    // Hareket kalemlerini al
    const items = await db
      .select()
      .from(stockMovementItems)
      .where(eq(stockMovementItems.movementId, parseInt(id)));

    if (items.length === 0) {
      return res.status(400).json({ error: "Hareket onaylanmadan önce en az bir kalem eklenmelidir" });
    }

    // Her kalem için stok güncellemesi
    for (const item of items) {
      const qty = parseFloat(item.quantity);

      if (movement.movementType === "giris") {
        // Giriş: hedef depo stok artır
        await upsertStockLevel(movement.targetWarehouseId!, item.materialId, item.unitId, qty, req.user?.userId);
      } else if (movement.movementType === "cikis") {
        // Çıkış: kaynak depo stok azalt
        await decreaseStockLevel(movement.sourceWarehouseId!, item.materialId, item.unitId, qty, req.user?.userId);

        // Taşeron teslimi ise subcontractor_materials güncelle
        if (movement.referenceType === "taseron_teslim" && movement.companyId && movement.projectId) {
          await upsertSubcontractorMaterial(
            movement.companyId,
            movement.projectId,
            movement.sourceWarehouseId!,
            item.materialId,
            item.unitId,
            qty,
            item.isFree,
            req.user?.userId
          );
        }
      } else if (movement.movementType === "transfer") {
        // Transfer: kaynak azalt, hedef artır
        await decreaseStockLevel(movement.sourceWarehouseId!, item.materialId, item.unitId, qty, req.user?.userId);
        await upsertStockLevel(movement.targetWarehouseId!, item.materialId, item.unitId, qty, req.user?.userId);
      } else if (movement.movementType === "iade") {
        // İade: hedef depoya geri ekle
        await upsertStockLevel(movement.targetWarehouseId!, item.materialId, item.unitId, qty, req.user?.userId);

        // Taşerondan iade ise subcontractor_materials güncelle
        if (movement.companyId && movement.projectId) {
          await db
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
        // Sayım düzeltme: pozitif fark ise artır, negatif ise azalt
        // quantity pozitifse ekleme, negatifse çıkarma (ama DB'de pozitif tutuyoruz, yöne göre sourceWarehouse/targetWarehouse ile ayrışır)
        if (movement.targetWarehouseId) {
          await upsertStockLevel(movement.targetWarehouseId, item.materialId, item.unitId, qty, req.user?.userId);
        } else if (movement.sourceWarehouseId) {
          await decreaseStockLevel(movement.sourceWarehouseId, item.materialId, item.unitId, qty, req.user?.userId);
        }
      }
    }

    // Hareketi onayla
    const [result] = await db
      .update(stockMovements)
      .set({
        status: "onaylandi",
        approvedBy: req.user?.userId,
        approvedAt: new Date(),
        updatedBy: req.user?.userId,
        updatedAt: new Date(),
      })
      .where(eq(stockMovements.id, parseInt(id)))
      .returning();

    res.json({ message: "Stok hareketi onaylandı ve stok seviyeleri güncellendi", movement: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ========================
// TAŞERON MALZEME TAKİBİ
// ========================

// Taşeron malzeme listesi
router.get("/subcontractor-materials", async (req, res) => {
  try {
    const { companyId, projectId, warehouseId } = req.query;

    const conditions: any[] = [];

    if (companyId) {
      conditions.push(eq(subcontractorMaterials.companyId, parseInt(companyId as string)));
    }
    if (projectId) {
      conditions.push(eq(subcontractorMaterials.projectId, parseInt(projectId as string)));
    }
    if (warehouseId) {
      conditions.push(eq(subcontractorMaterials.warehouseId, parseInt(warehouseId as string)));
    }

    const result = await db
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
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(companies.name, materials.name);

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Firma bazlı taşeron malzeme
router.get("/subcontractor-materials/by-company/:companyId", async (req, res) => {
  try {
    const { companyId } = req.params;
    const result = await db
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
      .where(eq(subcontractorMaterials.companyId, parseInt(companyId)))
      .orderBy(materials.name);

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
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

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Taşeron malzeme kullanım/fire güncelle
router.put("/subcontractor-materials/:id", async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const parsed = updateSubcontractorMaterialSchema.parse(req.body);
    const [result] = await db
      .update(subcontractorMaterials)
      .set({ ...parsed, lastUpdateDate: new Date(), updatedAt: new Date(), updatedBy: req.user?.userId })
      .where(eq(subcontractorMaterials.id, parseInt(id)))
      .returning();

    if (!result) {
      return res.status(404).json({ error: "Taşeron malzeme kaydı bulunamadı" });
    }
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ========================
// YARDIMCI FONKSİYONLAR
// ========================

// Stok seviyesi artır veya oluştur
async function upsertStockLevel(
  warehouseId: number,
  materialId: number,
  unitId: number,
  quantity: number,
  userId?: number
) {
  const [existing] = await db
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
    await db
      .update(stockLevels)
      .set({
        currentQuantity: sql`${stockLevels.currentQuantity} + ${quantity}`,
        lastMovementDate: new Date(),
        updatedAt: new Date(),
        updatedBy: userId,
      })
      .where(eq(stockLevels.id, existing.id));
  } else {
    await db.insert(stockLevels).values({
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

// Stok seviyesi azalt
async function decreaseStockLevel(
  warehouseId: number,
  materialId: number,
  unitId: number,
  quantity: number,
  userId?: number
) {
  const [existing] = await db
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

  await db
    .update(stockLevels)
    .set({
      currentQuantity: sql`${stockLevels.currentQuantity} - ${quantity}`,
      lastMovementDate: new Date(),
      updatedAt: new Date(),
      updatedBy: userId,
    })
    .where(eq(stockLevels.id, existing.id));
}

// Taşeron malzeme kaydı oluştur veya güncelle
async function upsertSubcontractorMaterial(
  companyId: number,
  projectId: number,
  warehouseId: number,
  materialId: number,
  unitId: number,
  quantity: number,
  isFree: boolean,
  userId?: number
) {
  const [existing] = await db
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
    await db
      .update(subcontractorMaterials)
      .set({
        givenQuantity: sql`${subcontractorMaterials.givenQuantity} + ${quantity}`,
        lastUpdateDate: new Date(),
        updatedAt: new Date(),
        updatedBy: userId,
      })
      .where(eq(subcontractorMaterials.id, existing.id));
  } else {
    await db.insert(subcontractorMaterials).values({
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

export default router;
