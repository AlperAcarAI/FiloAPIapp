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
// Authentication removed - no longer needed
import { eq, and, desc, asc, like, ilike, sql } from "drizzle-orm";
import { auditableInsert, auditableUpdate, auditableDelete, captureAuditInfo } from "./audit-middleware";
import type { Request, Response } from "express";

const router = Router();

// ========================
// PAYMENT TYPES API
// ========================

// GET /api/secure/financial/payment-types - Ödeme türleri listesi
router.get("/payment-types", async (req: Request, res: Response) => {
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
router.get("/current-accounts", async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = db.select({
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
    .from(finCurrentAccounts);

    // Filtreleme conditions
    const conditions = [eq(finCurrentAccounts.isActive, true)];
    
    if (status) {
      conditions.push(eq(finCurrentAccounts.paymentStatus, status as string));
    }
    if (search) {
      conditions.push(ilike(finCurrentAccounts.description, `%${search}%`));
    }

    query = query.where(and(...conditions));

    const accounts = await query
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
router.post("/current-accounts", async (req: Request, res: Response) => {
  try {
    const auditInfo = captureAuditInfo(req);
    const { description, payerCompanyId, payeeCompanyId, amountCents, transactionDate, paymentMethodId, paymentStatus, paymentReference, notes } = req.body;

    const newAccount = await auditableInsert(
      finCurrentAccounts,
      {
        description,
        payerCompanyId,
        payeeCompanyId,
        amountCents,
        transactionDate: new Date(transactionDate),
        paymentMethodId,
        paymentStatus: paymentStatus || 'beklemede',
        paymentReference,
        notes,
        isDebit: amountCents < 0,
        isDone: false,
        isActive: true
      },
      auditInfo
    );

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
router.get("/accounts-details", async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, current_account_id } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = db.select({
      id: finAccountsDetails.id,
      finCurAcId: finAccountsDetails.finCurAcId,
      amount: finAccountsDetails.amount,
      date: finAccountsDetails.date,
      paymentTypeId: finAccountsDetails.paymentTypeId,
      isDone: finAccountsDetails.isDone,
      doneDate: finAccountsDetails.doneDate,
      createdAt: finAccountsDetails.createdAt
    })
    .from(finAccountsDetails);

    // Filtreleme conditions
    const conditions = [];
    
    if (current_account_id) {
      conditions.push(eq(finAccountsDetails.finCurAcId, Number(current_account_id)));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const details = await query
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
router.post("/accounts-details", async (req: Request, res: Response) => {
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

export default router;