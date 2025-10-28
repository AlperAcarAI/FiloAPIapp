import { Router } from "express";
import { db } from "./db";
import { 
  finCurrentAccounts, 
  finAccountsDetails, 
  paymentTypes,
  companies,
  paymentMethods,
  type FinCurrentAccount,
  type FinAccountsDetail,
  type PaymentType
} from "@shared/schema";
import { authenticateToken } from "./auth";
import { eq, and, desc, asc, like, ilike, sql } from "drizzle-orm";
import { auditableInsert, auditableUpdate, auditableDelete, captureAuditInfo } from "./audit-middleware";
import type { Request, Response } from "express";
import type { AuthRequest } from "./auth";

const router = Router();

// ========================
// PAYMENT TYPES API
// ========================

// GET /api/secure/financial/payment-types - Ödeme türleri listesi
router.get("/payment-types", authenticateToken, async (req: AuthRequest, res: Response) => {
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
// CURRENT ACCOUNTS API
// ========================

// GET /api/secure/financial/current-accounts - Ana finansal işlemler listesi
router.get("/current-accounts", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Build conditions
    const conditions = [eq(finCurrentAccounts.isActive, true)];
    
    if (status) {
      conditions.push(eq(finCurrentAccounts.paymentStatus, status as string));
    }
    if (search) {
      conditions.push(ilike(finCurrentAccounts.description, `%${search}%`));
    }

    // Simple query without complex chaining
    const accounts = await db
      .select({
        id: finCurrentAccounts.id,
        description: finCurrentAccounts.description,
        payerCompanyId: finCurrentAccounts.payerCompanyId,
        payeeCompanyId: finCurrentAccounts.payeeCompanyId,
        amountCents: finCurrentAccounts.amountCents,
        transactionDate: finCurrentAccounts.transactionDate,
        paymentStatus: finCurrentAccounts.paymentStatus,
        paymentReference: finCurrentAccounts.paymentReference,
        notes: finCurrentAccounts.notes,
        isDone: finCurrentAccounts.isDone,
        isActive: finCurrentAccounts.isActive,
        createdAt: finCurrentAccounts.createdAt
      })
      .from(finCurrentAccounts)
      .where(and(...conditions))
      .orderBy(desc(finCurrentAccounts.createdAt))
      .limit(Number(limit))
      .offset(offset);

    // Toplam sayım
    const totalResult = await db.select({ count: sql`count(*)` })
      .from(finCurrentAccounts)
      .where(eq(finCurrentAccounts.isActive, true));
    const total = Number(totalResult[0].count);

    res.json({
      success: true,
      message: "Ana finansal işlemler başarıyla getirildi",
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
    console.error("Current accounts fetch error:", error);
    res.status(500).json({
      success: false,
      error: "FETCH_ERROR",
      message: "Ana finansal işlemler getirilemedi"
    });
  }
});

// POST /api/secure/financial/current-accounts - Yeni finansal işlem
router.post("/current-accounts", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { description, payerCompanyId, payeeCompanyId, amountCents, transactionDate, paymentMethodId, paymentStatus, paymentReference, notes } = req.body;

    // Validation
    if (!description || !payerCompanyId || !payeeCompanyId || !amountCents || !transactionDate) {
      return res.status(400).json({
        success: false,
        error: "VALIDATION_ERROR",
        message: "Gerekli alanlar eksik: description, payerCompanyId, payeeCompanyId, amountCents, transactionDate"
      });
    }

    const [newAccount] = await db.insert(finCurrentAccounts)
      .values({
        description,
        payerCompanyId: Number(payerCompanyId),
        payeeCompanyId: Number(payeeCompanyId),
        amountCents: Number(amountCents),
        transactionDate,
        paymentMethodId: paymentMethodId ? Number(paymentMethodId) : undefined,
        paymentStatus: paymentStatus || 'beklemede',
        paymentReference,
        notes,
        isDebit: Number(amountCents) < 0,
        isDone: false,
        isActive: true
      })
      .returning();

    res.status(201).json({
      success: true,
      message: "Finansal işlem başarıyla oluşturuldu",
      data: newAccount
    });
  } catch (error) {
    console.error("Current account creation error:", error);
    res.status(500).json({
      success: false,
      error: "CREATE_ERROR",
      message: "Finansal işlem oluşturulamadı"
    });
  }
});

// ========================
// ACCOUNTS DETAILS API
// ========================

// GET /api/secure/financial/accounts-details - Detay kayıtları listesi
router.get("/accounts-details", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 20, current_account_id } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Build conditions
    const conditions = [];
    
    if (current_account_id) {
      conditions.push(eq(finAccountsDetails.finCurAcId, Number(current_account_id)));
    }

    // Simple query without complex chaining
    const details = await db
      .select({
        id: finAccountsDetails.id,
        finCurAcId: finAccountsDetails.finCurAcId,
        amount: finAccountsDetails.amount,
        date: finAccountsDetails.date,
        paymentTypeId: finAccountsDetails.paymentTypeId,
        isDone: finAccountsDetails.isDone,
        doneDate: finAccountsDetails.doneDate,
        createdAt: finAccountsDetails.createdAt
      })
      .from(finAccountsDetails)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(finAccountsDetails.createdAt))
      .limit(Number(limit))
      .offset(offset);

    res.json({
      success: true,
      message: "Detay kayıtları başarıyla getirildi",
      data: details
    });
  } catch (error) {
    console.error("Accounts details fetch error:", error);
    res.status(500).json({
      success: false,
      error: "FETCH_ERROR",
      message: "Detay kayıtları getirilemedi"
    });
  }
});

// POST /api/secure/financial/accounts-details - Yeni detay kayıt
router.post("/accounts-details", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const auditInfo = captureAuditInfo(req);
    const { finCurAcId, amount, date, paymentTypeId } = req.body;

    const newDetail = await auditableInsert(
      finAccountsDetails,
      {
        finCurAcId,
        amount,
        date: new Date(date),
        paymentTypeId,
        isDone: false
      },
      auditInfo
    );

    res.status(201).json({
      success: true,
      message: "Detay kayıt başarıyla oluşturuldu",
      data: newDetail
    });
  } catch (error) {
    console.error("Account detail creation error:", error);
    res.status(500).json({
      success: false,
      error: "CREATE_ERROR",
      message: "Detay kayıt oluşturulamadı"
    });
  }
});

// PUT /api/secure/financial/current-accounts/:id - Ana finansal işlemi güncelle
router.put("/current-accounts/:id", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const accountId = parseInt(req.params.id);
    const updateData = req.body;

    if (!accountId || isNaN(accountId)) {
      return res.status(400).json({
        success: false,
        error: "INVALID_ID",
        message: "Geçersiz hesap ID'si"
      });
    }

    // Check if account exists
    const existingAccount = await db
      .select()
      .from(finCurrentAccounts)
      .where(eq(finCurrentAccounts.id, accountId))
      .limit(1);

    if (existingAccount.length === 0) {
      return res.status(404).json({
        success: false,
        error: "ACCOUNT_NOT_FOUND",
        message: "Hesap kaydı bulunamadı"
      });
    }

    // Prepare update data with validation
    const allowedFields = [
      'description', 'payerCompanyId', 'payeeCompanyId', 'amountCents',
      'transactionDate', 'paymentMethodId', 'paymentStatus', 'paymentReference', 'notes', 'isDone'
    ];

    const filteredData: any = {};
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        if (field === 'amountCents' && updateData[field] !== null) {
          filteredData[field] = Number(updateData[field]);
          filteredData.isDebit = Number(updateData[field]) < 0;
        } else if (field === 'payerCompanyId' || field === 'paymentMethodId') {
          filteredData[field] = updateData[field] ? Number(updateData[field]) : null;
        } else if (field === 'payeeCompanyId') {
          filteredData[field] = updateData[field] ? Number(updateData[field]) : null;
        } else if (field === 'isDone') {
          filteredData[field] = Boolean(updateData[field]);
        } else {
          filteredData[field] = updateData[field];
        }
      }
    }

    const auditInfo = captureAuditInfo(req);

    await auditableUpdate(
      db,
      finCurrentAccounts,
      filteredData,
      eq(finCurrentAccounts.id, accountId),
      undefined,
      auditInfo
    );

    // Get updated record
    const updatedAccount = await db
      .select()
      .from(finCurrentAccounts)
      .where(eq(finCurrentAccounts.id, accountId))
      .limit(1);

    res.json({
      success: true,
      message: "Finansal işlem başarıyla güncellendi",
      data: updatedAccount[0]
    });
  } catch (error) {
    console.error("Current account update error:", error);
    res.status(500).json({
      success: false,
      error: "UPDATE_ERROR",
      message: "Finansal işlem güncellenemedi"
    });
  }
});

// PUT /api/secure/financial/accounts-details/:id - Detay kaydı güncelle
router.put("/accounts-details/:id", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const detailId = parseInt(req.params.id);
    const updateData = req.body;

    if (!detailId || isNaN(detailId)) {
      return res.status(400).json({
        success: false,
        error: "INVALID_ID",
        message: "Geçersiz detay ID'si"
      });
    }

    // Check if detail exists
    const existingDetail = await db
      .select()
      .from(finAccountsDetails)
      .where(eq(finAccountsDetails.id, detailId))
      .limit(1);

    if (existingDetail.length === 0) {
      return res.status(404).json({
        success: false,
        error: "DETAIL_NOT_FOUND",
        message: "Detay kaydı bulunamadı"
      });
    }

    // Prepare update data with validation
    const allowedFields = ['finCurAcId', 'amount', 'date', 'paymentTypeId', 'isDone', 'doneDate'];

    const filteredData: any = {};
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        if (field === 'finCurAcId' && updateData[field] !== null) {
          filteredData[field] = Number(updateData[field]);
        } else if (field === 'amount' && updateData[field] !== null) {
          filteredData[field] = Number(updateData[field]);
        } else if (field === 'paymentTypeId' && updateData[field] !== null) {
          filteredData[field] = Number(updateData[field]);
        } else if (field === 'isDone') {
          filteredData[field] = Boolean(updateData[field]);
          if (updateData[field] === true && !filteredData.doneDate) {
            filteredData.doneDate = new Date();
          } else if (updateData[field] === false) {
            filteredData.doneDate = null;
          }
        } else if (field === 'date' && updateData[field]) {
          filteredData[field] = new Date(updateData[field]);
        } else {
          filteredData[field] = updateData[field];
        }
      }
    }

    const auditInfo = captureAuditInfo(req);

    await auditableUpdate(
      db,
      finAccountsDetails,
      filteredData,
      eq(finAccountsDetails.id, detailId),
      undefined,
      auditInfo
    );

    // Get updated record
    const updatedDetail = await db
      .select()
      .from(finAccountsDetails)
      .where(eq(finAccountsDetails.id, detailId))
      .limit(1);

    res.json({
      success: true,
      message: "Detay kayıt başarıyla güncellendi",
      data: updatedDetail[0]
    });
  } catch (error) {
    console.error("Account detail update error:", error);
    res.status(500).json({
      success: false,
      error: "UPDATE_ERROR",
      message: "Detay kayıt güncellenemedi"
    });
  }
});

export default router;
