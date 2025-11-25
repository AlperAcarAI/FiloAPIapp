import { Router } from "express";
import { db } from "./db";
import { 
  units, 
  unitConversions,
  materialTypes,
  materials,
  materialCodeMappings,
  teams,
  teamMembers,
  unitPrices,
  progressPaymentTypes,
  progressPayments,
  progressPaymentDetails,
  personnel,
  insertUnitSchema,
  updateUnitSchema,
  insertUnitConversionSchema,
  updateUnitConversionSchema,
  insertMaterialTypeSchema,
  updateMaterialTypeSchema,
  insertMaterialSchema,
  updateMaterialSchema,
  insertMaterialCodeMappingSchema,
  updateMaterialCodeMappingSchema,
  insertTeamSchema,
  updateTeamSchema,
  insertTeamMemberSchema,
  updateTeamMemberSchema,
  insertUnitPriceSchema,
  updateUnitPriceSchema,
  insertProgressPaymentTypeSchema,
  updateProgressPaymentTypeSchema,
  insertProgressPaymentSchema,
  updateProgressPaymentSchema,
  insertProgressPaymentDetailSchema,
  updateProgressPaymentDetailSchema
} from "../shared/schema";
import { eq, and, desc, sql, gte, lte, or, isNull } from "drizzle-orm";

const router = Router();

// ========================
// UNITS (BİRİMLER)
// ========================

// Tüm birimleri listele
router.get("/units", async (req, res) => {
  try {
    const { active } = req.query;
    
    const conditions = [];
    if (active === 'true') {
      conditions.push(eq(units.isActive, true));
    }
    
    const result = await db
      .select()
      .from(units)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(units.name);
      
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Birim detayı
router.get("/units/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.select().from(units).where(eq(units.id, parseInt(id)));
    
    if (!result) {
      return res.status(404).json({ error: "Birim bulunamadı" });
    }
    
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Yeni birim ekle
router.post("/units", async (req, res) => {
  try {
    const validated = insertUnitSchema.parse(req.body);
    const userId = (req as any).user?.id;
    
    const [result] = await db.insert(units).values({
      ...validated,
      createdBy: userId,
      updatedBy: userId
    }).returning();
    
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Birim güncelle
router.put("/units/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const validated = updateUnitSchema.parse(req.body);
    const userId = (req as any).user?.id;
    
    const [result] = await db.update(units)
      .set({ ...validated, updatedBy: userId, updatedAt: new Date() })
      .where(eq(units.id, parseInt(id)))
      .returning();
    
    if (!result) {
      return res.status(404).json({ error: "Birim bulunamadı" });
    }
    
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Birim sil (soft delete)
router.delete("/units/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    
    const [result] = await db.update(units)
      .set({ isActive: false, updatedBy: userId, updatedAt: new Date() })
      .where(eq(units.id, parseInt(id)))
      .returning();
    
    if (!result) {
      return res.status(404).json({ error: "Birim bulunamadı" });
    }
    
    res.json({ message: "Birim pasif hale getirildi" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ========================
// MATERIALS (MALZEMELER)
// ========================

// Malzemeleri listele
router.get("/materials", async (req, res) => {
  try {
    const { active, typeId, search } = req.query;
    
    let conditions = [];
    
    if (active === 'true') {
      conditions.push(eq(materials.isActive, true));
    }
    
    if (typeId) {
      conditions.push(eq(materials.typeId, parseInt(typeId as string)));
    }
    
    if (search) {
      conditions.push(
        or(
          sql`${materials.name} ILIKE ${`%${search}%`}`,
          sql`${materials.code} ILIKE ${`%${search}%`}`
        )
      );
    }
    
    const result = await db.select()
      .from(materials)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(materials.name)
      .limit(100);
    
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Malzeme detayı
router.get("/materials/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.select().from(materials).where(eq(materials.id, parseInt(id)));
    
    if (!result) {
      return res.status(404).json({ error: "Malzeme bulunamadı" });
    }
    
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Yeni malzeme ekle
router.post("/materials", async (req, res) => {
  try {
    const validated = insertMaterialSchema.parse(req.body);
    const userId = (req as any).user?.id;
    
    const [result] = await db.insert(materials).values({
      ...validated,
      createdBy: userId,
      updatedBy: userId
    }).returning();
    
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Malzeme güncelle
router.put("/materials/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const validated = updateMaterialSchema.parse(req.body);
    const userId = (req as any).user?.id;
    
    const [result] = await db.update(materials)
      .set({ ...validated, updatedBy: userId, updatedAt: new Date() })
      .where(eq(materials.id, parseInt(id)))
      .returning();
    
    if (!result) {
      return res.status(404).json({ error: "Malzeme bulunamadı" });
    }
    
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ========================
// TEAMS (EKİPLER)
// ========================

// Ekipleri listele
router.get("/teams", async (req, res) => {
  try {
    const { active, companyId } = req.query;
    
    let conditions = [];
    
    if (active === 'true') {
      conditions.push(eq(teams.isActive, true));
    }
    
    if (companyId) {
      conditions.push(eq(teams.companyId, parseInt(companyId as string)));
    }
    
    const result = await db.select()
      .from(teams)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(teams.name);
    
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Ekip detayı (üyeleriyle birlikte)
router.get("/teams/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const [team] = await db.select().from(teams).where(eq(teams.id, parseInt(id)));
    
    if (!team) {
      return res.status(404).json({ error: "Ekip bulunamadı" });
    }
    
    // Ekip üyelerini getir
    const members = await db.select()
      .from(teamMembers)
      .where(and(
        eq(teamMembers.teamId, parseInt(id)),
        eq(teamMembers.isActive, true)
      ))
      .orderBy(teamMembers.startDate);
    
    res.json({ ...team, members });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Yeni ekip oluştur
router.post("/teams", async (req, res) => {
  try {
    const validated = insertTeamSchema.parse(req.body);
    const userId = (req as any).user?.id;
    
    const [result] = await db.insert(teams).values({
      ...validated,
      createdBy: userId,
      updatedBy: userId
    }).returning();
    
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Ekip güncelle
router.put("/teams/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const validated = updateTeamSchema.parse(req.body);
    const userId = (req as any).user?.id;
    
    const [result] = await db.update(teams)
      .set({ ...validated, updatedBy: userId, updatedAt: new Date() })
      .where(eq(teams.id, parseInt(id)))
      .returning();
    
    if (!result) {
      return res.status(404).json({ error: "Ekip bulunamadı" });
    }
    
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Ekip sil (soft delete)
router.delete("/teams/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    
    const [result] = await db.update(teams)
      .set({ isActive: false, updatedBy: userId, updatedAt: new Date() })
      .where(eq(teams.id, parseInt(id)))
      .returning();
    
    if (!result) {
      return res.status(404).json({ error: "Ekip bulunamadı" });
    }
    
    res.json({ message: "Ekip pasif hale getirildi" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Ekibe üye ekle
router.post("/teams/:id/members", async (req, res) => {
  try {
    const { id } = req.params;
    const validated = insertTeamMemberSchema.parse(req.body);
    const userId = (req as any).user?.id;
    
    // Personelin aktif olup olmadığını kontrol et
    const [person] = await db.select()
      .from(personnel)
      .where(eq(personnel.id, validated.personnelId));
    
    if (!person) {
      return res.status(404).json({ error: "Personel bulunamadı" });
    }
    
    if (!person.isActive) {
      return res.status(400).json({ error: "Pasif personel ekibe eklenemez" });
    }
    
    const [result] = await db.insert(teamMembers).values({
      ...validated,
      teamId: parseInt(id),
      createdBy: userId,
      updatedBy: userId
    }).returning();
    
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Ekip üyesi güncelle (örn: bitiş tarihi ekle)
router.put("/teams/:teamId/members/:memberId", async (req, res) => {
  try {
    const { teamId, memberId } = req.params;
    const validated = updateTeamMemberSchema.parse(req.body);
    const userId = (req as any).user?.id;
    
    const [result] = await db.update(teamMembers)
      .set({ ...validated, updatedBy: userId, updatedAt: new Date() })
      .where(and(
        eq(teamMembers.id, parseInt(memberId)),
        eq(teamMembers.teamId, parseInt(teamId))
      ))
      .returning();
    
    if (!result) {
      return res.status(404).json({ error: "Ekip üyesi bulunamadı" });
    }
    
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Ekipten üye çıkar (soft delete)
router.delete("/teams/:teamId/members/:memberId", async (req, res) => {
  try {
    const { teamId, memberId } = req.params;
    const userId = (req as any).user?.id;
    
    const [result] = await db.update(teamMembers)
      .set({ 
        isActive: false, 
        endDate: new Date().toISOString().split('T')[0], // Bugünün tarihi
        updatedBy: userId, 
        updatedAt: new Date() 
      })
      .where(and(
        eq(teamMembers.id, parseInt(memberId)),
        eq(teamMembers.teamId, parseInt(teamId))
      ))
      .returning();
    
    if (!result) {
      return res.status(404).json({ error: "Ekip üyesi bulunamadı" });
    }
    
    res.json({ message: "Ekip üyesi çıkarıldı", member: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ========================
// UNIT PRICES (BİRİM FİYATLAR)
// ========================

// Birim fiyatları listele (proje bazlı)
router.get("/unit-prices", async (req, res) => {
  try {
    const { projectId, materialId, active, date } = req.query;
    
    let conditions = [];
    
    if (projectId) {
      conditions.push(eq(unitPrices.projectId, parseInt(projectId as string)));
    }
    
    if (materialId) {
      conditions.push(eq(unitPrices.materialId, parseInt(materialId as string)));
    }
    
    if (active === 'true') {
      conditions.push(eq(unitPrices.isActive, true));
    }
    
    // Belirli bir tarihteki geçerli fiyatlar
    if (date) {
      const queryDate = date as string; // YYYY-MM-DD format
      conditions.push(
        and(
          lte(unitPrices.validFrom, queryDate),
          or(
            isNull(unitPrices.validUntil),
            gte(unitPrices.validUntil, queryDate)
          )
        )
      );
    }
    
    const result = await db.select()
      .from(unitPrices)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(unitPrices.validFrom))
      .limit(100);
    
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Birim fiyat ekle
router.post("/unit-prices", async (req, res) => {
  try {
    const validated = insertUnitPriceSchema.parse(req.body);
    const userId = (req as any).user?.id;
    
    const [result] = await db.insert(unitPrices).values({
      ...validated,
      createdBy: userId,
      updatedBy: userId
    }).returning();
    
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ========================
// PROGRESS PAYMENTS (HAKEDİŞLER)
// ========================

// Hakedişleri listele
router.get("/progress-payments", async (req, res) => {
  try {
    const { projectId, teamId, status, startDate, endDate } = req.query;
    
    let conditions = [];
    
    if (projectId) {
      conditions.push(eq(progressPayments.projectId, parseInt(projectId as string)));
    }
    
    if (teamId) {
      conditions.push(eq(progressPayments.teamId, parseInt(teamId as string)));
    }
    
    if (status) {
      conditions.push(eq(progressPayments.status, status as string));
    }
    
    if (startDate) {
      conditions.push(gte(progressPayments.paymentDate, startDate as string));
    }
    
    if (endDate) {
      conditions.push(lte(progressPayments.paymentDate, endDate as string));
    }
    
    const result = await db.select()
      .from(progressPayments)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(progressPayments.paymentDate))
      .limit(100);
    
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Hakediş detayı (detay satırlarıyla birlikte)
router.get("/progress-payments/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const [payment] = await db.select()
      .from(progressPayments)
      .where(eq(progressPayments.id, parseInt(id)));
    
    if (!payment) {
      return res.status(404).json({ error: "Hakediş bulunamadı" });
    }
    
    // Detay satırlarını getir
    const details = await db.select()
      .from(progressPaymentDetails)
      .where(eq(progressPaymentDetails.progressPaymentId, parseInt(id)))
      .orderBy(progressPaymentDetails.id);
    
    res.json({ ...payment, details });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Yeni hakediş oluştur
router.post("/progress-payments", async (req, res) => {
  try {
    const { details, ...paymentData } = req.body;
    const validated = insertProgressPaymentSchema.parse(paymentData);
    const userId = (req as any).user?.id;
    
    // Transaction ile hakediş ve detayları kaydet
    const [payment] = await db.insert(progressPayments).values({
      ...validated,
      createdBy: userId,
      updatedBy: userId
    }).returning();
    
    // Eğer detay satırları varsa onları da kaydet
    if (details && Array.isArray(details) && details.length > 0) {
      const detailsToInsert = details.map((detail: any) => ({
        ...insertProgressPaymentDetailSchema.parse(detail),
        progressPaymentId: payment.id,
        createdBy: userId,
        updatedBy: userId
      }));
      
      await db.insert(progressPaymentDetails).values(detailsToInsert);
      
      // Toplam tutarı hesapla ve güncelle
      const totalAmount = details.reduce((sum: number, d: any) => sum + (d.lineTotalCents || 0), 0);
      await db.update(progressPayments)
        .set({ totalAmountCents: totalAmount, updatedAt: new Date() })
        .where(eq(progressPayments.id, payment.id));
    }
    
    // Güncellenmiş hakediş ve detayları döndür
    const [updatedPayment] = await db.select()
      .from(progressPayments)
      .where(eq(progressPayments.id, payment.id));
    
    const paymentDetails = await db.select()
      .from(progressPaymentDetails)
      .where(eq(progressPaymentDetails.progressPaymentId, payment.id));
    
    res.status(201).json({ ...updatedPayment, details: paymentDetails });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Hakediş güncelle
router.put("/progress-payments/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const validated = updateProgressPaymentSchema.parse(req.body);
    const userId = (req as any).user?.id;
    
    const [result] = await db.update(progressPayments)
      .set({ ...validated, updatedBy: userId, updatedAt: new Date() })
      .where(eq(progressPayments.id, parseInt(id)))
      .returning();
    
    if (!result) {
      return res.status(404).json({ error: "Hakediş bulunamadı" });
    }
    
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Hakediş detay satırı ekle
router.post("/progress-payments/:id/details", async (req, res) => {
  try {
    const { id } = req.params;
    const validated = insertProgressPaymentDetailSchema.parse(req.body);
    const userId = (req as any).user?.id;
    
    const [result] = await db.insert(progressPaymentDetails).values({
      ...validated,
      progressPaymentId: parseInt(id),
      createdBy: userId,
      updatedBy: userId
    }).returning();
    
    // Toplam tutarı güncelle
    const allDetails = await db.select()
      .from(progressPaymentDetails)
      .where(eq(progressPaymentDetails.progressPaymentId, parseInt(id)));
    
    const totalAmount = allDetails.reduce((sum, d) => sum + d.lineTotalCents, 0);
    
    await db.update(progressPayments)
      .set({ totalAmountCents: totalAmount, updatedAt: new Date() })
      .where(eq(progressPayments.id, parseInt(id)));
    
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Hakediş detay satırı güncelle
router.put("/progress-payment-details/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const validated = updateProgressPaymentDetailSchema.parse(req.body);
    const userId = (req as any).user?.id;
    
    const [result] = await db.update(progressPaymentDetails)
      .set({ ...validated, updatedBy: userId, updatedAt: new Date() })
      .where(eq(progressPaymentDetails.id, parseInt(id)))
      .returning();
    
    if (!result) {
      return res.status(404).json({ error: "Detay satırı bulunamadı" });
    }
    
    // Toplam tutarı güncelle
    const allDetails = await db.select()
      .from(progressPaymentDetails)
      .where(eq(progressPaymentDetails.progressPaymentId, result.progressPaymentId));
    
    const totalAmount = allDetails.reduce((sum, d) => sum + d.lineTotalCents, 0);
    
    await db.update(progressPayments)
      .set({ totalAmountCents: totalAmount, updatedAt: new Date() })
      .where(eq(progressPayments.id, result.progressPaymentId));
    
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Hakediş detay satırı sil
router.delete("/progress-payment-details/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const [detail] = await db.select()
      .from(progressPaymentDetails)
      .where(eq(progressPaymentDetails.id, parseInt(id)));
    
    if (!detail) {
      return res.status(404).json({ error: "Detay satırı bulunamadı" });
    }
    
    await db.delete(progressPaymentDetails)
      .where(eq(progressPaymentDetails.id, parseInt(id)));
    
    // Toplam tutarı güncelle
    const allDetails = await db.select()
      .from(progressPaymentDetails)
      .where(eq(progressPaymentDetails.progressPaymentId, detail.progressPaymentId));
    
    const totalAmount = allDetails.reduce((sum, d) => sum + d.lineTotalCents, 0);
    
    await db.update(progressPayments)
      .set({ totalAmountCents: totalAmount, updatedAt: new Date() })
      .where(eq(progressPayments.id, detail.progressPaymentId));
    
    res.json({ message: "Detay satırı silindi" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Hakediş durumu güncelle (onay süreci)
router.put("/progress-payments/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;
    const userId = (req as any).user?.id;
    
    const validStatuses = ['draft', 'submitted', 'approved', 'rejected', 'paid'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Geçersiz durum" });
    }
    
    const updateData: any = {
      status,
      updatedBy: userId,
      updatedAt: new Date()
    };
    
    if (status === 'submitted') {
      updateData.submittedAt = new Date();
      updateData.submittedBy = userId;
    } else if (status === 'approved') {
      updateData.approvedAt = new Date();
      updateData.approvedBy = userId;
    } else if (status === 'rejected') {
      updateData.rejectionReason = rejectionReason;
    }
    
    const [result] = await db.update(progressPayments)
      .set(updateData)
      .where(eq(progressPayments.id, parseInt(id)))
      .returning();
    
    if (!result) {
      return res.status(404).json({ error: "Hakediş bulunamadı" });
    }
    
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ========================
// PROGRESS PAYMENT TYPES (HAKEDİŞ TÜRLERİ)
// ========================

// Hakediş türlerini listele
router.get("/progress-payment-types", async (req, res) => {
  try {
    const { active } = req.query;
    
    const conditions = [];
    if (active === 'true') {
      conditions.push(eq(progressPaymentTypes.isActive, true));
    }
    
    const result = await db
      .select()
      .from(progressPaymentTypes)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(progressPaymentTypes.name);
      
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
