import { Router } from "express";
import { db } from "./db";
import { 
  finCurrentAccounts, 
  finAccountsDetails, 
  paymentTypes,
  companies,
  paymentMethods,
  insertFinCurrentAccountSchema,
  updateFinCurrentAccountSchema, 
  insertFinAccountsDetailSchema,
  updateFinAccountsDetailSchema,
  type FinCurrentAccount,
  type FinAccountsDetail,
  type PaymentType
} from "@shared/schema";
import { authenticateApiKey, authorizeEndpoint } from "./api-security";
import { eq, and, desc, asc, like, sql } from "drizzle-orm";
import { auditableInsert, auditableUpdate, auditableDelete, captureAuditInfo } from "./audit-middleware";
import type { Request, Response } from "express";

const router = Router();

// ========================
// PAYMENT TYPES API
// ========================

// GET /api/secure/financial/payment-types - Ödeme türleri listesi
router.get("/payment-types", authenticateApiKey, authorizeEndpoint(['data:read']), async (req: Request, res: Response) => {
  try {
    const types = await db.select().from(paymentTypes)
      .where(eq(paymentTypes.isActive, true))
      .orderBy(asc(paymentTypes.name));

    res.json({
      success: true,
      message: "Ödeme türleri başarıyla getirildi",
      data: types
    });
  } catch (error) {
    console.error("Payment types fetch error:", error);
    res.status(500).json({
      success: false,
      error: "FETCH_ERROR",
      message: "Ödeme türleri getirilemedi"
    });
  }
});

// ========================
// FINANCIAL ACCOUNTS API  
// ========================

// GET /api/secure/financial/accounts - Cari hesap listesi
router.get("/accounts", authenticateApiKey, authorizeEndpoint(['data:read']), async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, status, company_id, search } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = db.select({
      id: finCurrentAccounts.id,
      description: finCurrentAccounts.description,
      amountCents: finCurrentAccounts.amountCents,
      transactionDate: finCurrentAccounts.transactionDate,
      paymentStatus: finCurrentAccounts.paymentStatus,
      paymentReference: finCurrentAccounts.paymentReference,
      isDone: finCurrentAccounts.isDone,
      isActive: finCurrentAccounts.isActive,
      payerCompany: {
        id: companies.id,
        name: companies.name,
      },
      paymentMethod: {
        id: paymentMethods.id,
        name: paymentMethods.name,
      }
    })
    .from(finCurrentAccounts)
    .leftJoin(companies, eq(finCurrentAccounts.payerCompanyId, companies.id))
    .leftJoin(paymentMethods, eq(finCurrentAccounts.paymentMethodId, paymentMethods.id));

    // Filtreleme conditions
    const conditions = [eq(finCurrentAccounts.isActive, true)];
    
    if (status) {
      conditions.push(eq(finCurrentAccounts.paymentStatus, status as string));
    }
    if (company_id) {
      conditions.push(eq(finCurrentAccounts.payerCompanyId, Number(company_id)));
    }
    if (search) {
      conditions.push(like(finCurrentAccounts.description, `%${search}%`));
    }

    query = query.where(and(...conditions));

    const accounts = await query
      .orderBy(desc(finCurrentAccounts.transactionDate))
      .limit(Number(limit))
      .offset(offset);

    // Toplam sayım
    const totalResult = await db.select({ count: sql`count(*)` })
      .from(finCurrentAccounts)
      .where(eq(finCurrentAccounts.isActive, true));
    const total = Number(totalResult[0].count);

    res.json({
      success: true,
      message: "Cari hesaplar başarıyla getirildi",
      data: {
        accounts,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error("Financial accounts fetch error:", error);
    res.status(500).json({
      success: false,
      error: "FETCH_ERROR", 
      message: "Cari hesaplar getirilemedi"
    });
  }
});

// GET /api/secure/financial/accounts/:id - Cari hesap detayı
router.get("/accounts/:id", authenticateApiKey, authorizeEndpoint(['data:read']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Ana kayıt
    const accountResults = await db.select()
      .from(finCurrentAccounts)
      .leftJoin(companies, eq(finCurrentAccounts.payerCompanyId, companies.id))
      .leftJoin(paymentMethods, eq(finCurrentAccounts.paymentMethodId, paymentMethods.id))
      .where(and(
        eq(finCurrentAccounts.id, Number(id)),
        eq(finCurrentAccounts.isActive, true)
      ));

    const account = accountResults[0];

    if (!account) {
      return res.status(404).json({
        success: false,
        error: "NOT_FOUND",
        message: "Cari hesap bulunamadı"
      });
    }

    // Detay kayıtları
    const details = await db.select({
      id: finAccountsDetails.id,
      amount: finAccountsDetails.amount,
      date: finAccountsDetails.date,
      isDone: finAccountsDetails.isDone,
      doneDate: finAccountsDetails.doneDate,
      paymentType: {
        id: paymentTypes.id,
        name: paymentTypes.name,
        code: paymentTypes.code
      }
    })
    .from(finAccountsDetails)
    .leftJoin(paymentTypes, eq(finAccountsDetails.paymentTypeId, paymentTypes.id))
    .where(eq(finAccountsDetails.finCurAcId, Number(id)))
    .orderBy(asc(finAccountsDetails.date));

    res.json({
      success: true,
      message: "Cari hesap detayı başarıyla getirildi",
      data: {
        account: account.fin_current_accounts,
        company: account.companies,
        paymentMethod: account.payment_methods,
        details
      }
    });
  } catch (error) {
    console.error("Financial account detail fetch error:", error);
    res.status(500).json({
      success: false,
      error: "FETCH_ERROR",
      message: "Cari hesap detayı getirilemedi"
    });
  }
});

// POST /api/secure/financial/accounts - Yeni cari hesap oluştur
router.post("/accounts", authenticateApiKey, authorizeEndpoint(['data:write']), async (req: Request, res: Response) => {
  try {
    const validatedData = insertFinCurrentAccountSchema.parse(req.body);
    const auditInfo = captureAuditInfo(req);

    const newAccountResults = await auditableInsert(
      finCurrentAccounts,
      validatedData,
      auditInfo
    );
    const newAccount = newAccountResults[0];

    res.status(201).json({
      success: true,
      message: "Cari hesap başarıyla oluşturuldu",
      data: newAccount
    });
  } catch (error) {
    console.error("Financial account creation error:", error);
    res.status(400).json({
      success: false,
      error: "CREATION_ERROR",
      message: "Cari hesap oluşturulamadı"
    });
  }
});

// PUT /api/secure/financial/accounts/:id - Cari hesap güncelle
router.put("/accounts/:id", authenticateApiKey, authorizeEndpoint(['data:write']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateFinCurrentAccountSchema.parse(req.body);
    const auditInfo = captureAuditInfo(req);

    const updatedAccountResults = await auditableUpdate(
      finCurrentAccounts,
      eq(finCurrentAccounts.id, Number(id)),
      { ...validatedData, updatedAt: new Date() },
      auditInfo
    );
    const updatedAccount = updatedAccountResults[0];

    if (!updatedAccount) {
      return res.status(404).json({
        success: false,
        error: "NOT_FOUND",
        message: "Güncellenecek cari hesap bulunamadı"
      });
    }

    res.json({
      success: true,
      message: "Cari hesap başarıyla güncellendi",
      data: updatedAccount
    });
  } catch (error) {
    console.error("Financial account update error:", error);
    res.status(400).json({
      success: false,
      error: "UPDATE_ERROR",
      message: "Cari hesap güncellenemedi"
    });
  }
});

// PUT /api/secure/financial/accounts/:id/approve - Cari hesabı onayla
router.put("/accounts/:id/approve", authenticateApiKey, authorizeEndpoint(['data:write']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const auditInfo = captureAuditInfo(req);

    const approvedAccountResults = await auditableUpdate(
      finCurrentAccounts,
      eq(finCurrentAccounts.id, Number(id)),
      { 
        paymentStatus: 'onaylandı',
        isDone: true,
        notes: notes || null,
        updatedAt: new Date()
      },
      auditInfo
    );
    const approvedAccount = approvedAccountResults[0];

    if (!approvedAccount) {
      return res.status(404).json({
        success: false,
        error: "NOT_FOUND", 
        message: "Onaylanacak cari hesap bulunamadı"
      });
    }

    res.json({
      success: true,
      message: "Cari hesap başarıyla onaylandı",
      data: approvedAccount
    });
  } catch (error) {
    console.error("Financial account approval error:", error);
    res.status(500).json({
      success: false,
      error: "APPROVAL_ERROR",
      message: "Cari hesap onaylanamadı"
    });
  }
});

// ========================
// ACCOUNT DETAILS API
// ========================

// GET /api/secure/financial/accounts/:id/details - Hesap detayları
router.get("/accounts/:id/details", authenticateApiKey, authorizeEndpoint(['data:read']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const details = await db.select({
      id: finAccountsDetails.id,
      amount: finAccountsDetails.amount,
      date: finAccountsDetails.date,
      isDone: finAccountsDetails.isDone,
      doneDate: finAccountsDetails.doneDate,
      createdAt: finAccountsDetails.createdAt,
      paymentType: {
        id: paymentTypes.id,
        name: paymentTypes.name,
        code: paymentTypes.code,
        requiresApproval: paymentTypes.requiresApproval
      }
    })
    .from(finAccountsDetails)
    .leftJoin(paymentTypes, eq(finAccountsDetails.paymentTypeId, paymentTypes.id))
    .where(eq(finAccountsDetails.finCurAcId, Number(id)))
    .orderBy(asc(finAccountsDetails.date));

    res.json({
      success: true,
      message: "Hesap detayları başarıyla getirildi",
      data: details
    });
  } catch (error) {
    console.error("Account details fetch error:", error);
    res.status(500).json({
      success: false,
      error: "FETCH_ERROR",
      message: "Hesap detayları getirilemedi"
    });
  }
});

// POST /api/secure/financial/accounts/:id/details - Yeni detay ekle
router.post("/accounts/:id/details", authenticateApiKey, authorizeEndpoint(['data:write']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = insertFinAccountsDetailSchema.parse({
      ...req.body,
      finCurAcId: Number(id)
    });
    const auditInfo = captureAuditInfo(req);

    // Ana hesabın varlığını kontrol et
    const mainAccountResults = await db.select()
      .from(finCurrentAccounts)
      .where(eq(finCurrentAccounts.id, Number(id)));
    const mainAccount = mainAccountResults[0];

    if (!mainAccount) {
      return res.status(404).json({
        success: false,
        error: "MAIN_ACCOUNT_NOT_FOUND",
        message: "Ana hesap bulunamadı"
      });
    }

    const newDetailResults = await auditableInsert(
      finAccountsDetails,
      validatedData,
      auditInfo
    );
    const newDetail = newDetailResults[0];

    res.status(201).json({
      success: true,
      message: "Hesap detayı başarıyla eklendi",
      data: newDetail
    });
  } catch (error) {
    console.error("Account detail creation error:", error);
    res.status(400).json({
      success: false,
      error: "CREATION_ERROR",
      message: "Hesap detayı oluşturulamadı"
    });
  }
});

// PUT /api/secure/financial/details/:detailId/complete - Detay işlemini tamamla
router.put("/details/:detailId/complete", authenticateApiKey, authorizeEndpoint(['data:write']), async (req: Request, res: Response) => {
  try {
    const { detailId } = req.params;
    const { notes } = req.body;
    const auditInfo = captureAuditInfo(req);

    const completedDetailResults = await auditableUpdate(
      finAccountsDetails,
      eq(finAccountsDetails.id, Number(detailId)),
      {
        isDone: true,
        doneDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
        updatedAt: new Date()
      },
      auditInfo
    );
    const completedDetail = completedDetailResults[0];

    if (!completedDetail) {
      return res.status(404).json({
        success: false,
        error: "NOT_FOUND",
        message: "Tamamlanacak detay bulunamadı"
      });
    }

    res.json({
      success: true,
      message: "Detay işlemi başarıyla tamamlandı",
      data: completedDetail
    });
  } catch (error) {
    console.error("Detail completion error:", error);
    res.status(500).json({
      success: false,
      error: "COMPLETION_ERROR", 
      message: "Detay işlemi tamamlanamadı"
    });
  }
});

// ========================
// REPORTING API
// ========================

// GET /api/secure/financial/reports/summary - Finansal özet raporu  
router.get("/reports/summary", authenticateApiKey, authorizeEndpoint(['data:read']), async (req: Request, res: Response) => {
  try {
    const { start_date, end_date, payment_type_id } = req.query;

    // Temel sorgu
    let summaryQueryBuilder = db.select({
      paymentTypeId: paymentTypes.id,
      paymentTypeName: paymentTypes.name,
      paymentTypeCode: paymentTypes.code,
      totalAmount: sql`SUM(${finAccountsDetails.amount})`,
      completedAmount: sql`SUM(CASE WHEN ${finAccountsDetails.isDone} = true THEN ${finAccountsDetails.amount} ELSE 0 END)`,
      pendingAmount: sql`SUM(CASE WHEN ${finAccountsDetails.isDone} = false THEN ${finAccountsDetails.amount} ELSE 0 END)`,
      totalCount: sql`COUNT(${finAccountsDetails.id})`,
      completedCount: sql`COUNT(CASE WHEN ${finAccountsDetails.isDone} = true THEN 1 END)`,
      pendingCount: sql`COUNT(CASE WHEN ${finAccountsDetails.isDone} = false THEN 1 END)`
    })
    .from(finAccountsDetails)
    .leftJoin(paymentTypes, eq(finAccountsDetails.paymentTypeId, paymentTypes.id))
    .groupBy(paymentTypes.id, paymentTypes.name, paymentTypes.code);

    // Tarih filtreleme conditions
    const conditions = [];
    if (start_date) {
      conditions.push(sql`${finAccountsDetails.date} >= ${start_date}`);
    }
    if (end_date) {
      conditions.push(sql`${finAccountsDetails.date} <= ${end_date}`);
    }
    if (payment_type_id) {
      conditions.push(eq(finAccountsDetails.paymentTypeId, Number(payment_type_id)));
    }

    if (conditions.length > 0) {
      summaryQueryBuilder = summaryQueryBuilder.where(and(...conditions));
    }

    const summary = await summaryQueryBuilder.orderBy(asc(paymentTypes.name));

    res.json({
      success: true,
      message: "Finansal özet raporu başarıyla oluşturuldu",
      data: {
        summary,
        filters: {
          start_date: start_date || null,
          end_date: end_date || null,
          payment_type_id: payment_type_id || null
        }
      }
    });
  } catch (error) {
    console.error("Financial summary report error:", error);
    res.status(500).json({
      success: false,
      error: "REPORT_ERROR",
      message: "Finansal özet raporu oluşturulamadı"
    });
  }
});

export default router;