import { Router } from "express";
import { db } from "./db";
import { documents, docSubTypes, docMainTypes, users, personnel, companies, workAreas, assets, foOutageProcess } from "@shared/schema";
import { insertDocumentSchema, updateDocumentSchema, insertDocMainTypeSchema, updateDocMainTypeSchema, insertDocSubTypeSchema, updateDocSubTypeSchema } from "@shared/schema";
import { eq, and, or, like, desc, asc, sql } from "drizzle-orm";
import { authenticateToken } from "./auth";
import { authenticateJWT } from "./hierarchical-auth";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

// Simple mock auth for development
const mockAuth = (req: any, res: any, next: any) => {
  console.log("=== MOCK AUTH MIDDLEWARE REACHED ===");
  req.user = { id: 1, email: 'test@test.com' };
  req.userContext = { userId: 1 };
  next();
};
import { captureAuditInfo, auditableInsert, auditableUpdate, auditableDelete } from "./audit-middleware";
import { z } from "zod";

// Uploads dizinini oluştur
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration for document uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    const dateDir = path.join(uploadsDir, year.toString(), month, day);
    
    // Dizini oluştur
    fs.mkdirSync(dateDir, { recursive: true });
    cb(null, dateDir);
  },
  filename: (req, file, cb) => {
    // Kullanıcı ID'si ve tarih damgası ile unique dosya adı oluştur
    const userId = (req as any).userContext?.userId || (req as any).user?.id || 'unknown';
    const timestamp = Date.now();
    const dateStr = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
    const randomId = Math.random().toString(36).substring(2, 8);
    const extension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, extension);
    
    const fileName = `${baseName}_user${userId}_${dateStr}_${randomId}${extension}`;
    cb(null, fileName);
  }
});

const documentUpload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword', // .doc
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/vnd.ms-excel', // .xls
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'text/plain'
    ];
    
    const fileExt = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png', '.gif', '.txt'];
    
    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('Desteklenmeyen dosya formatı. PDF, DOC, DOCX, XLS, XLSX, JPG, PNG dosyaları kabul edilir.'));
    }
  }
});

// Dosya hash hesaplama fonksiyonu
function calculateFileHash(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    
    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', (error) => reject(error));
  });
}

const documentRoutes = Router();

// Test endpoint - no auth
documentRoutes.get("/test", (req: any, res: any) => {
  console.log("=== DOCUMENT TEST ENDPOINT REACHED ===");
  res.json({ success: true, message: "Document routes working!" });
});

// Dosya indirme endpoint'i
documentRoutes.get("/download/:id", authenticateJWT, async (req: any, res) => {
  try {
    const { id } = req.params;
    
    const [document] = await db.select()
      .from(documents)
      .where(and(
        eq(documents.id, parseInt(id)),
        eq(documents.isActive, true)
      ));
    
    if (!document) {
      return res.status(404).json({ 
        success: false, 
        error: "Döküman bulunamadı" 
      });
    }
    
    // Dosya var mı kontrol et
    if (!fs.existsSync(document.filePath)) {
      return res.status(404).json({ 
        success: false, 
        error: "Dosya sunucuda bulunamadı" 
      });
    }
    
    // Dosya header'larını ayarla
    res.setHeader('Content-Type', document.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);
    res.setHeader('Content-Length', document.fileSize?.toString() || '0');
    
    // Dosyayı stream olarak gönder
    const fileStream = fs.createReadStream(document.filePath);
    fileStream.pipe(res);
    
    fileStream.on('error', (error) => {
      console.error('Dosya okuma hatası:', error);
      if (!res.headersSent) {
        res.status(500).json({ 
          success: false, 
          error: "Dosya okunurken hata oluştu" 
        });
      }
    });
    
  } catch (error) {
    console.error("Dosya indirme hatası:", error);
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false, 
        error: "Dosya indirilirken hata oluştu" 
      });
    }
  }
});

// Ana döküman tiplerini listele - NO AUTH (must be before /:id route)
documentRoutes.get("/main-doc-types", async (req: any, res) => {
  console.log("=== MAIN-DOC-TYPES ENDPOINT CALLED (NO AUTH) ===");
  try {
    const { isActive = "true" } = req.query;
    
    const conditions = [];
    if (isActive === "true") {
      conditions.push(eq(docMainTypes.isActive, true));
    }

    const mainTypes = await db.select({
      id: docMainTypes.id,
      name: docMainTypes.name,
      isActive: docMainTypes.isActive
    })
    .from(docMainTypes)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(asc(docMainTypes.name));

    res.json({
      success: true,
      data: mainTypes,
      message: "Ana döküman tipleri başarıyla getirildi"
    });
  } catch (error) {
    console.error("Ana döküman tipleri listesi hatası:", error);
    res.status(500).json({ 
      success: false, 
      error: "Ana döküman tipleri listelenirken hata oluştu" 
    });
  }
});

// Ana döküman tipi ekle - WITH AUTH
documentRoutes.post("/main-doc-types", authenticateJWT, async (req: any, res) => {
  try {
    const validatedData = insertDocMainTypeSchema.parse(req.body);
    const auditInfo = captureAuditInfo(req);
    
    // Duplicate check
    const [existing] = await db.select()
      .from(docMainTypes)
      .where(eq(docMainTypes.name, validatedData.name));
    
    if (existing) {
      return res.status(400).json({ 
        success: false, 
        error: "Bu isimde bir ana döküman tipi zaten mevcut" 
      });
    }
    
    const [newMainType] = await auditableInsert(
      db,
      docMainTypes,
      validatedData,
      auditInfo
    );

    res.status(201).json({ 
      success: true, 
      data: newMainType,
      message: "Ana döküman tipi başarıyla eklendi"
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        error: "Geçersiz veri", 
        details: error.errors 
      });
    }
    console.error("Ana döküman tipi ekleme hatası:", error);
    res.status(500).json({ 
      success: false, 
      error: "Ana döküman tipi eklenirken hata oluştu" 
    });
  }
});

// Ana döküman tipi güncelle - WITH AUTH
documentRoutes.put("/main-doc-types/:id", authenticateJWT, async (req: any, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateDocMainTypeSchema.parse(req.body);
    const auditInfo = captureAuditInfo(req);
    
    const [existingMainType] = await db.select()
      .from(docMainTypes)
      .where(eq(docMainTypes.id, parseInt(id)));
    
    if (!existingMainType) {
      return res.status(404).json({ 
        success: false, 
        error: "Ana döküman tipi bulunamadı" 
      });
    }
    
    // Eğer isim değiştiriliyorsa duplicate check
    if (validatedData.name && validatedData.name !== existingMainType.name) {
      const [duplicate] = await db.select()
        .from(docMainTypes)
        .where(eq(docMainTypes.name, validatedData.name));
      
      if (duplicate) {
        return res.status(400).json({ 
          success: false, 
          error: "Bu isimde bir ana döküman tipi zaten mevcut" 
        });
      }
    }
    
    const [updatedMainType] = await auditableUpdate(
      db,
      docMainTypes,
      validatedData,
      eq(docMainTypes.id, parseInt(id)),
      existingMainType,
      auditInfo
    );

    res.json({ 
      success: true, 
      data: updatedMainType,
      message: "Ana döküman tipi başarıyla güncellendi"
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        error: "Geçersiz veri", 
        details: error.errors 
      });
    }
    console.error("Ana döküman tipi güncelleme hatası:", error);
    res.status(500).json({ 
      success: false, 
      error: "Ana döküman tipi güncellenirken hata oluştu" 
    });
  }
});

// Alt döküman tipi ekle - WITH AUTH
documentRoutes.post("/doc-sub-types", authenticateJWT, async (req: any, res) => {
  try {
    const validatedData = insertDocSubTypeSchema.parse(req.body);
    const auditInfo = captureAuditInfo(req);
    
    // Ana tip var mı kontrol et
    const [mainTypeExists] = await db.select()
      .from(docMainTypes)
      .where(eq(docMainTypes.id, validatedData.mainTypeId));
    
    if (!mainTypeExists) {
      return res.status(400).json({ 
        success: false, 
        error: "Ana döküman tipi bulunamadı" 
      });
    }
    
    const [newSubType] = await auditableInsert(
      db,
      docSubTypes,
      validatedData,
      auditInfo
    );

    res.status(201).json({ 
      success: true, 
      data: newSubType,
      message: "Alt döküman tipi başarıyla eklendi"
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        error: "Geçersiz veri", 
        details: error.errors 
      });
    }
    console.error("Alt döküman tipi ekleme hatası:", error);
    res.status(500).json({ 
      success: false, 
      error: "Alt döküman tipi eklenirken hata oluştu" 
    });
  }
});

// Alt döküman tipi güncelle - WITH AUTH
documentRoutes.put("/doc-sub-types/:id", authenticateJWT, async (req: any, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateDocSubTypeSchema.parse(req.body);
    const auditInfo = captureAuditInfo(req);
    
    const [existingSubType] = await db.select()
      .from(docSubTypes)
      .where(eq(docSubTypes.id, parseInt(id)));
    
    if (!existingSubType) {
      return res.status(404).json({ 
        success: false, 
        error: "Alt döküman tipi bulunamadı" 
      });
    }
    
    // Eğer mainTypeId değiştiriliyorsa, yeni ana tip var mı kontrol et
    if (validatedData.mainTypeId && validatedData.mainTypeId !== existingSubType.mainTypeId) {
      const [mainTypeExists] = await db.select()
        .from(docMainTypes)
        .where(eq(docMainTypes.id, validatedData.mainTypeId));
      
      if (!mainTypeExists) {
        return res.status(400).json({ 
          success: false, 
          error: "Ana döküman tipi bulunamadı" 
        });
      }
    }
    
    const [updatedSubType] = await auditableUpdate(
      db,
      docSubTypes,
      validatedData,
      eq(docSubTypes.id, parseInt(id)),
      existingSubType,
      auditInfo
    );

    res.json({ 
      success: true, 
      data: updatedSubType,
      message: "Alt döküman tipi başarıyla güncellendi"
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        error: "Geçersiz veri", 
        details: error.errors 
      });
    }
    console.error("Alt döküman tipi güncelleme hatası:", error);
    res.status(500).json({ 
      success: false, 
      error: "Alt döküman tipi güncellenirken hata oluştu" 
    });
  }
});

// Tüm dökümanları listele (filtreleme destekli)
documentRoutes.get("/", authenticateJWT, async (req: any, res) => {
  try {
    const { 
      entityType, 
      entityId, 
      search, 
      isActive = "true",
      sortBy = "uploadDate",
      sortOrder = "desc",
      limit = "20",
      offset = "0"
    } = req.query;

    const conditions = [];
    
    if (entityType) {
      conditions.push(eq(documents.entityType, entityType as string));
    }
    
    if (entityId) {
      conditions.push(eq(documents.entityId, parseInt(entityId as string)));
    }
    
    if (search) {
      conditions.push(
        or(
          like(documents.title, `%${search}%`),
          like(documents.description, `%${search}%`),
          like(documents.fileName, `%${search}%`)
        )
      );
    }
    
    if (isActive === "true") {
      conditions.push(eq(documents.isActive, true));
    }

    const orderByColumn = sortBy === "title" ? documents.title : 
                         sortBy === "fileName" ? documents.fileName :
                         sortBy === "entityType" ? documents.entityType :
                         documents.uploadDate;
    
    const orderDirection = sortOrder === "asc" ? asc : desc;

    const [documentList, totalCount] = await Promise.all([
      db.select({
        id: documents.id,
        entityType: documents.entityType,
        entityId: documents.entityId,
        title: documents.title,
        description: documents.description,
        fileName: documents.fileName,
        fileSize: documents.fileSize,
        mimeType: documents.mimeType,
        uploadDate: documents.uploadDate,
        validityStartDate: documents.validityStartDate,
        validityEndDate: documents.validityEndDate,
        isActive: documents.isActive,
        docTypeName: docSubTypes.name,
        uploadedByEmail: users.email,
        // Entity bilgileri için conditional select
        entityName: sql`
          CASE 
            WHEN ${documents.entityType} = 'personnel' THEN (SELECT name || ' ' || surname FROM personnel WHERE id = ${documents.entityId})
            WHEN ${documents.entityType} = 'company' THEN (SELECT name FROM companies WHERE id = ${documents.entityId})
            WHEN ${documents.entityType} = 'work_area' THEN (SELECT name FROM work_areas WHERE id = ${documents.entityId})
            WHEN ${documents.entityType} = 'asset' THEN (SELECT plate_number FROM assets WHERE id = ${documents.entityId})
          END
        `.as('entityName')
      })
      .from(documents)
      .leftJoin(docSubTypes, eq(documents.docTypeId, docSubTypes.id))
      .leftJoin(users, eq(documents.uploadedBy, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(orderDirection(orderByColumn))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string)),
      
      db.select({ count: sql`count(*)::int` })
        .from(documents)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
    ]);

    res.json({
      success: true,
      data: documentList,
      totalCount: totalCount[0]?.count || 0,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: documentList.length === parseInt(limit as string)
      }
    });
  } catch (error) {
    console.error("Döküman listesi hatası:", error);
    res.status(500).json({ 
      success: false, 
      error: "Dökümanlar listelenirken hata oluştu" 
    });
  }
});

// Belirli bir dökümanı getir - MUST be after specific routes
documentRoutes.get("/:id", authenticateJWT, async (req: any, res) => {
  try {
    const { id } = req.params;
    
    const [document] = await db.select({
      id: documents.id,
      entityType: documents.entityType,
      entityId: documents.entityId,
      title: documents.title,
      description: documents.description,
      filePath: documents.filePath,
      fileName: documents.fileName,
      fileSize: documents.fileSize,
      mimeType: documents.mimeType,
      fileHash: documents.fileHash,
      uploadDate: documents.uploadDate,
      validityStartDate: documents.validityStartDate,
      validityEndDate: documents.validityEndDate,
      isActive: documents.isActive,
      docTypeName: docSubTypes.name,
      uploadedByEmail: users.email
    })
    .from(documents)
    .leftJoin(docSubTypes, eq(documents.docTypeId, docSubTypes.id))
    .leftJoin(users, eq(documents.uploadedBy, users.id))
    .where(eq(documents.id, parseInt(id)));

    if (!document) {
      return res.status(404).json({ 
        success: false, 
        error: "Döküman bulunamadı" 
      });
    }

    res.json({ success: true, data: document });
  } catch (error) {
    console.error("Döküman getirme hatası:", error);
    res.status(500).json({ 
      success: false, 
      error: "Döküman getirilirken hata oluştu" 
    });
  }
});

// Yeni döküman ekle
documentRoutes.post("/", authenticateJWT, async (req: any, res) => {
  try {
    const validatedData = insertDocumentSchema.parse(req.body);
    const auditInfo = captureAuditInfo(req);
    
    // Entity varlığını kontrol et
    let entityExists = false;
    switch (validatedData.entityType) {
      case 'personnel':
        const [person] = await db.select({ id: personnel.id })
          .from(personnel).where(eq(personnel.id, validatedData.entityId));
        entityExists = !!person;
        break;
      case 'company':
        const [company] = await db.select({ id: companies.id })
          .from(companies).where(eq(companies.id, validatedData.entityId));
        entityExists = !!company;
        break;
      case 'work_area':
        const [workArea] = await db.select({ id: workAreas.id })
          .from(workAreas).where(eq(workAreas.id, validatedData.entityId));
        entityExists = !!workArea;
        break;
      case 'asset':
        const [asset] = await db.select({ id: assets.id })
          .from(assets).where(eq(assets.id, validatedData.entityId));
        entityExists = !!asset;
        break;
      case 'operation':
        const [operation] = await db.select({ id: foOutageProcess.id })
          .from(foOutageProcess).where(eq(foOutageProcess.id, validatedData.entityId));
        entityExists = !!operation;
        break;
    }
    
    if (!entityExists) {
      return res.status(400).json({ 
        success: false, 
        error: `${validatedData.entityType} entity bulunamadı` 
      });
    }
    
    // Duplicate hash kontrolü
    if (validatedData.fileHash) {
      const [existing] = await db.select({ id: documents.id })
        .from(documents)
        .where(eq(documents.fileHash, validatedData.fileHash));
      
      if (existing) {
        return res.status(400).json({ 
          success: false, 
          error: "Bu dosya zaten yüklenmiş" 
        });
      }
    }
    
    const [newDocument] = await auditableInsert(
      db,
      documents,
      {
        ...validatedData,
        uploadedBy: req.userContext?.userId || 1
      },
      auditInfo
    );

    res.status(201).json({ 
      success: true, 
      data: newDocument,
      message: "Döküman başarıyla eklendi"
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        error: "Geçersiz veri", 
        details: error.errors 
      });
    }
    console.error("Döküman ekleme hatası:", error);
    res.status(500).json({ 
      success: false, 
      error: "Döküman eklenirken hata oluştu" 
    });
  }
});

// Multipart form file upload endpoint - MUST be before PUT /:id route
documentRoutes.post("/upload", authenticateJWT, documentUpload.single('file'), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: "Dosya yüklenemedi" 
      });
    }

    // Form verilerini al
    const {
      entityType,
      entityId,
      docTypeId,
      title,
      description,
      validityStartDate,
      validityEndDate
    } = req.body;

    // Zorunlu alanları kontrol et
    if (!entityType || !entityId || !docTypeId || !title) {
      // Yüklenmiş dosyayı sil (cleanup)
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ 
        success: false, 
        error: "entityType, entityId, docTypeId ve title zorunlu alanlar" 
      });
    }

    // Entity ID ve docTypeId'yi integer'a çevir
    const parsedEntityId = parseInt(entityId);
    const parsedDocTypeId = parseInt(docTypeId);

    if (isNaN(parsedEntityId) || isNaN(parsedDocTypeId)) {
      // Cleanup
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ 
        success: false, 
        error: "entityId ve docTypeId sayı olmalı" 
      });
    }

    // Entity varlığını kontrol et
    let entityExists = false;
    switch (entityType) {
      case 'personnel':
        const [person] = await db.select({ id: personnel.id })
          .from(personnel).where(eq(personnel.id, parsedEntityId));
        entityExists = !!person;
        break;
      case 'company':
        const [company] = await db.select({ id: companies.id })
          .from(companies).where(eq(companies.id, parsedEntityId));
        entityExists = !!company;
        break;
      case 'work_area':
        const [workArea] = await db.select({ id: workAreas.id })
          .from(workAreas).where(eq(workAreas.id, parsedEntityId));
        entityExists = !!workArea;
        break;
      case 'asset':
        const [asset] = await db.select({ id: assets.id })
          .from(assets).where(eq(assets.id, parsedEntityId));
        entityExists = !!asset;
        break;
      case 'operation':
        const [operation] = await db.select({ id: foOutageProcess.id })
          .from(foOutageProcess).where(eq(foOutageProcess.id, parsedEntityId));
        entityExists = !!operation;
        break;
      default:
        // Cleanup
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({ 
          success: false, 
          error: "Geçersiz entityType. personnel, asset, company, work_area veya operation olmalı" 
        });
    }

    if (!entityExists) {
      // Cleanup
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ 
        success: false, 
        error: `${entityType} entity bulunamadı` 
      });
    }

    // Dosya hash'ini hesapla (izleme amaçlı, duplicate kontrolü yok)
    const fileHash = await calculateFileHash(req.file.path);

    // Audit bilgilerini topla
    const auditInfo = captureAuditInfo(req);
    
    // Document verisini hazırla
    const documentData = {
      entityType,
      entityId: parsedEntityId,
      docTypeId: parsedDocTypeId,
      title,
      description: description || null,
      filePath: req.file.path,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      fileHash,
      uploadedBy: req.userContext?.userId || 1,
      validityStartDate: validityStartDate || null,
      validityEndDate: validityEndDate || null
    };

    // Veritabanına kaydet
    const [newDocument] = await auditableInsert(
      db,
      documents,
      documentData,
      auditInfo
    );

    res.status(201).json({ 
      success: true, 
      data: newDocument,
      message: "Dosya başarıyla yüklendi ve döküman kaydı oluşturuldu"
    });

  } catch (error) {
    // Hata durumunda dosyayı temizle
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    console.error("Dosya yükleme hatası:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
    console.error("Error message:", error instanceof Error ? error.message : error);
    
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Dosya yüklenirken hata oluştu",
      message: "Dosya yüklenirken hata oluştu"
    });
  }
});

// Döküman güncelle
documentRoutes.put("/:id", authenticateJWT, async (req: any, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateDocumentSchema.parse(req.body);
    const auditInfo = captureAuditInfo(req);
    
    const [existingDocument] = await db.select()
      .from(documents)
      .where(eq(documents.id, parseInt(id)));
    
    if (!existingDocument) {
      return res.status(404).json({ 
        success: false, 
        error: "Döküman bulunamadı" 
      });
    }
    
    const [updatedDocument] = await auditableUpdate(
      db,
      documents,
      validatedData,
      eq(documents.id, parseInt(id)),
      existingDocument,
      auditInfo
    );

    res.json({ 
      success: true, 
      data: updatedDocument,
      message: "Döküman başarıyla güncellendi"
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        error: "Geçersiz veri", 
        details: error.errors 
      });
    }
    console.error("Döküman güncelleme hatası:", error);
    res.status(500).json({ 
      success: false, 
      error: "Döküman güncellenirken hata oluştu" 
    });
  }
});

// Döküman sil (soft delete)
documentRoutes.delete("/:id", authenticateJWT, async (req: any, res) => {
  try {
    const { id } = req.params;
    const auditInfo = captureAuditInfo(req);
    
    const [existingDocument] = await db.select()
      .from(documents)
      .where(eq(documents.id, parseInt(id)));
    
    if (!existingDocument) {
      return res.status(404).json({ 
        success: false, 
        error: "Döküman bulunamadı" 
      });
    }
    
    await auditableUpdate(
      db,
      documents,
      { isActive: false },
      eq(documents.id, parseInt(id)),
      existingDocument,
      auditInfo
    );

    res.json({ 
      success: true, 
      message: "Döküman başarıyla silindi" 
    });
  } catch (error) {
    console.error("Döküman silme hatası:", error);
    res.status(500).json({ 
      success: false, 
      error: "Döküman silinirken hata oluştu" 
    });
  }
});

// Entity'ye göre dökümanları listele
documentRoutes.get("/entity/:entityType/:entityId", authenticateJWT, async (req: any, res) => {
  try {
    const { entityType, entityId } = req.params;
    
    const documentList = await db.select({
      id: documents.id,
      title: documents.title,
      description: documents.description,
      fileName: documents.fileName,
      fileSize: documents.fileSize,
      mimeType: documents.mimeType,
      uploadDate: documents.uploadDate,
      validityStartDate: documents.validityStartDate,
      validityEndDate: documents.validityEndDate,
      isActive: documents.isActive,
      docTypeName: docSubTypes.name
    })
    .from(documents)
    .leftJoin(docSubTypes, eq(documents.docTypeId, docSubTypes.id))
    .where(
      and(
        eq(documents.entityType, entityType as any),
        eq(documents.entityId, parseInt(entityId)),
        eq(documents.isActive, true)
      )
    )
    .orderBy(desc(documents.uploadDate));

    res.json({ 
      success: true, 
      data: documentList 
    });
  } catch (error) {
    console.error("Entity dökümanları listesi hatası:", error);
    res.status(500).json({ 
      success: false, 
      error: "Dökümanlar listelenirken hata oluştu" 
    });
  }
});

// Döküman tiplerini listele
documentRoutes.get("/types", authenticateJWT, async (req: any, res) => {
  try {
    const { isActive = "true" } = req.query;
    
    const conditions = [];
    if (isActive === "true") {
      conditions.push(eq(docSubTypes.isActive, true));
      conditions.push(eq(docMainTypes.isActive, true));
    }

    const documentTypes = await db.select({
      id: docSubTypes.id,
      name: docSubTypes.name,
      mainTypeId: docSubTypes.mainTypeId,
      mainTypeName: docMainTypes.name,
      isActive: docSubTypes.isActive
    })
    .from(docSubTypes)
    .leftJoin(docMainTypes, eq(docSubTypes.mainTypeId, docMainTypes.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(asc(docMainTypes.name), asc(docSubTypes.name));

    res.json({
      success: true,
      data: documentTypes,
      message: "Döküman tipleri başarıyla getirildi"
    });
  } catch (error) {
    console.error("Döküman tipleri listesi hatası:", error);
    res.status(500).json({ 
      success: false, 
      error: "Döküman tipleri listelenirken hata oluştu" 
    });
  }
});

// Belirli ana tipe göre alt tipleri listele - NO AUTH
documentRoutes.get("/types/:mainTypeId", async (req: any, res) => {
  try {
    const { mainTypeId } = req.params;
    const { isActive = "true" } = req.query;
    
    const conditions = [eq(docSubTypes.mainTypeId, parseInt(mainTypeId))];
    if (isActive === "true") {
      conditions.push(eq(docSubTypes.isActive, true));
    }

    const subTypes = await db.select({
      id: docSubTypes.id,
      name: docSubTypes.name,
      mainTypeId: docSubTypes.mainTypeId,
      isActive: docSubTypes.isActive
    })
    .from(docSubTypes)
    .where(and(...conditions))
    .orderBy(asc(docSubTypes.name));

    res.json({
      success: true,
      data: subTypes,
      message: "Alt döküman tipleri başarıyla getirildi"
    });
  } catch (error) {
    console.error("Alt döküman tipleri listesi hatası:", error);
    res.status(500).json({ 
      success: false, 
      error: "Alt döküman tipleri listelenirken hata oluştu" 
    });
  }
});

export default documentRoutes;
