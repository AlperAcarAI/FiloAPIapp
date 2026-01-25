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
      {
        ...validatedData,
        createdBy: auditInfo.userId,
        updatedBy: auditInfo.userId
      },
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
      {
        ...validatedData,
        updatedBy: auditInfo.userId,
        updatedAt: new Date()
      },
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
      {
        ...validatedData,
        createdBy: auditInfo.userId,
        updatedBy: auditInfo.userId
      },
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
      {
        ...validatedData,
        updatedBy: auditInfo.userId,
        updatedAt: new Date()
      },
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
        uploadedBy: req.userContext?.userId || 1,
        createdBy: auditInfo.userId,
        updatedBy: auditInfo.userId
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
      {
        ...documentData,
        createdBy: auditInfo.userId,
        updatedBy: auditInfo.userId
      },
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
      {
        ...validatedData,
        updatedBy: auditInfo.userId,
        updatedAt: new Date()
      },
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

// ============================================
// PERSONEL EVRAK RAPORU ENDPOINTLERİ
// ============================================

// Eksik evrak raporu - Belirli evrak tipine sahip olmayan personelleri listele
// GET /api/documents/missing-report?docTypeId=5&docTypeName=Adli Sicil Kaydı
documentRoutes.get("/missing-report", authenticateJWT, async (req: any, res) => {
  try {
    const {
      docTypeId,
      docTypeName,
      workAreaId,
      companyId,
      limit = "100",
      offset = "0"
    } = req.query;

    // En az bir filtreleme kriteri olmalı
    if (!docTypeId && !docTypeName) {
      return res.status(400).json({
        success: false,
        error: "docTypeId veya docTypeName parametrelerinden en az biri gerekli"
      });
    }

    // Evrak tipi ID'sini bul
    let targetDocTypeId: number | null = null;
    let targetDocTypeName: string | null = null;

    if (docTypeId) {
      targetDocTypeId = parseInt(docTypeId as string);
      const [docType] = await db.select()
        .from(docSubTypes)
        .where(eq(docSubTypes.id, targetDocTypeId));

      if (!docType) {
        return res.status(404).json({
          success: false,
          error: "Belirtilen evrak tipi bulunamadı"
        });
      }
      targetDocTypeName = docType.name;
    } else if (docTypeName) {
      // İsme göre evrak tipini bul (case-insensitive)
      const [docType] = await db.select()
        .from(docSubTypes)
        .where(sql`LOWER(${docSubTypes.name}) LIKE LOWER(${'%' + docTypeName + '%'})`);

      if (docType) {
        targetDocTypeId = docType.id;
        targetDocTypeName = docType.name;
      } else {
        targetDocTypeName = docTypeName as string;
      }
    }

    // Aktif personelleri getir (evrak durumu ile birlikte)
    const personnelWithDocStatus = await db.execute(sql`
      WITH active_personnel AS (
        SELECT DISTINCT
          p.id,
          p.name,
          p.surname,
          p.tc_no,
          p.phone_no,
          pwa.work_area_id,
          wa.name as work_area_name,
          pcm.company_id,
          c.name as company_name
        FROM personnel p
        LEFT JOIN personnel_work_areas pwa ON p.id = pwa.personnel_id AND pwa.is_active = true AND pwa.exit_date IS NULL
        LEFT JOIN work_areas wa ON pwa.work_area_id = wa.id
        LEFT JOIN personnel_company_matches pcm ON p.id = pcm.personnel_id AND pcm.is_active = true
        LEFT JOIN companies c ON pcm.company_id = c.id
        WHERE p.is_active = true
        ${workAreaId ? sql`AND pwa.work_area_id = ${parseInt(workAreaId as string)}` : sql``}
        ${companyId ? sql`AND pcm.company_id = ${parseInt(companyId as string)}` : sql``}
      ),
      personnel_docs AS (
        SELECT
          d.entity_id as personnel_id,
          d.doc_type_id,
          dst.name as doc_type_name,
          d.validity_end_date,
          d.upload_date
        FROM documents d
        JOIN doc_sub_types dst ON d.doc_type_id = dst.id
        WHERE d.entity_type = 'personnel'
          AND d.is_active = true
          ${targetDocTypeId ? sql`AND d.doc_type_id = ${targetDocTypeId}` : sql`AND LOWER(dst.name) LIKE LOWER(${'%' + (targetDocTypeName || '') + '%'})`}
      )
      SELECT
        ap.id,
        ap.name,
        ap.surname,
        ap.tc_no,
        ap.phone_no,
        ap.work_area_id,
        ap.work_area_name,
        ap.company_id,
        ap.company_name,
        CASE WHEN pd.personnel_id IS NULL THEN false ELSE true END as has_document,
        pd.validity_end_date,
        pd.upload_date,
        CASE
          WHEN pd.personnel_id IS NULL THEN 'missing'
          WHEN pd.validity_end_date IS NOT NULL AND pd.validity_end_date < CURRENT_DATE THEN 'expired'
          ELSE 'valid'
        END as document_status
      FROM active_personnel ap
      LEFT JOIN personnel_docs pd ON ap.id = pd.personnel_id
      ORDER BY
        CASE
          WHEN pd.personnel_id IS NULL THEN 0
          WHEN pd.validity_end_date IS NOT NULL AND pd.validity_end_date < CURRENT_DATE THEN 1
          ELSE 2
        END,
        ap.surname, ap.name
      LIMIT ${parseInt(limit as string)}
      OFFSET ${parseInt(offset as string)}
    `);

    // Toplam sayıları hesapla
    const countResult = await db.execute(sql`
      WITH active_personnel AS (
        SELECT DISTINCT p.id
        FROM personnel p
        LEFT JOIN personnel_work_areas pwa ON p.id = pwa.personnel_id AND pwa.is_active = true AND pwa.exit_date IS NULL
        LEFT JOIN personnel_company_matches pcm ON p.id = pcm.personnel_id AND pcm.is_active = true
        WHERE p.is_active = true
        ${workAreaId ? sql`AND pwa.work_area_id = ${parseInt(workAreaId as string)}` : sql``}
        ${companyId ? sql`AND pcm.company_id = ${parseInt(companyId as string)}` : sql``}
      ),
      personnel_docs AS (
        SELECT DISTINCT d.entity_id as personnel_id
        FROM documents d
        JOIN doc_sub_types dst ON d.doc_type_id = dst.id
        WHERE d.entity_type = 'personnel'
          AND d.is_active = true
          ${targetDocTypeId ? sql`AND d.doc_type_id = ${targetDocTypeId}` : sql`AND LOWER(dst.name) LIKE LOWER(${'%' + (targetDocTypeName || '') + '%'})`}
      )
      SELECT
        COUNT(DISTINCT ap.id) as total_personnel,
        COUNT(DISTINCT CASE WHEN pd.personnel_id IS NULL THEN ap.id END) as missing_count,
        COUNT(DISTINCT pd.personnel_id) as has_document_count
      FROM active_personnel ap
      LEFT JOIN personnel_docs pd ON ap.id = pd.personnel_id
    `);

    const stats = countResult.rows[0] as any;

    res.json({
      success: true,
      data: {
        docType: {
          id: targetDocTypeId,
          name: targetDocTypeName
        },
        statistics: {
          totalPersonnel: parseInt(stats?.total_personnel || '0'),
          missingCount: parseInt(stats?.missing_count || '0'),
          hasDocumentCount: parseInt(stats?.has_document_count || '0'),
          missingPercentage: stats?.total_personnel > 0
            ? ((parseInt(stats?.missing_count || '0') / parseInt(stats?.total_personnel || '1')) * 100).toFixed(1)
            : '0'
        },
        personnel: personnelWithDocStatus.rows,
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string)
        }
      },
      message: `${targetDocTypeName} evrak durumu raporu`
    });
  } catch (error) {
    console.error("Eksik evrak raporu hatası:", error);
    res.status(500).json({
      success: false,
      error: "Eksik evrak raporu oluşturulurken hata oluştu"
    });
  }
});

// Personel evrak özet raporu - Tüm zorunlu evraklar için eksik evrak özeti
// GET /api/documents/personnel-summary?personnelId=5
// GET /api/documents/personnel-summary?workAreaId=3
documentRoutes.get("/personnel-summary", authenticateJWT, async (req: any, res) => {
  try {
    const {
      personnelId,
      workAreaId,
      companyId,
      requiredDocTypes, // comma-separated doc type IDs (örn: "1,2,3,4")
      limit = "100",
      offset = "0"
    } = req.query;

    // Zorunlu evrak tiplerini belirle
    let requiredDocTypeIds: number[] = [];
    if (requiredDocTypes) {
      requiredDocTypeIds = (requiredDocTypes as string).split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    }

    // Eğer zorunlu evrak tipleri belirtilmemişse, tüm aktif personel evrak tiplerini getir
    if (requiredDocTypeIds.length === 0) {
      const allDocTypes = await db.select({ id: docSubTypes.id })
        .from(docSubTypes)
        .innerJoin(docMainTypes, eq(docSubTypes.mainTypeId, docMainTypes.id))
        .where(and(
          eq(docSubTypes.isActive, true),
          sql`LOWER(${docMainTypes.name}) LIKE '%personel%'`
        ));
      requiredDocTypeIds = allDocTypes.map(dt => dt.id);
    }

    // Personel evrak özetini getir
    const summaryResult = await db.execute(sql`
      WITH target_personnel AS (
        SELECT DISTINCT
          p.id,
          p.name,
          p.surname,
          p.tc_no,
          pwa.work_area_id,
          wa.name as work_area_name
        FROM personnel p
        LEFT JOIN personnel_work_areas pwa ON p.id = pwa.personnel_id AND pwa.is_active = true AND pwa.exit_date IS NULL
        LEFT JOIN work_areas wa ON pwa.work_area_id = wa.id
        WHERE p.is_active = true
        ${personnelId ? sql`AND p.id = ${parseInt(personnelId as string)}` : sql``}
        ${workAreaId ? sql`AND pwa.work_area_id = ${parseInt(workAreaId as string)}` : sql``}
        ${companyId ? sql`AND EXISTS (SELECT 1 FROM personnel_company_matches pcm WHERE pcm.personnel_id = p.id AND pcm.company_id = ${parseInt(companyId as string)} AND pcm.is_active = true)` : sql``}
      ),
      required_docs AS (
        SELECT id, name FROM doc_sub_types
        WHERE id = ANY(ARRAY[${sql.raw(requiredDocTypeIds.length > 0 ? requiredDocTypeIds.join(',') : '0')}]::int[])
          AND is_active = true
      ),
      personnel_doc_status AS (
        SELECT
          tp.id as personnel_id,
          tp.name,
          tp.surname,
          tp.tc_no,
          tp.work_area_id,
          tp.work_area_name,
          rd.id as doc_type_id,
          rd.name as doc_type_name,
          d.id as document_id,
          d.validity_end_date,
          CASE
            WHEN d.id IS NULL THEN 'missing'
            WHEN d.validity_end_date IS NOT NULL AND d.validity_end_date < CURRENT_DATE THEN 'expired'
            ELSE 'valid'
          END as status
        FROM target_personnel tp
        CROSS JOIN required_docs rd
        LEFT JOIN documents d ON d.entity_type = 'personnel'
          AND d.entity_id = tp.id
          AND d.doc_type_id = rd.id
          AND d.is_active = true
      )
      SELECT
        personnel_id,
        name,
        surname,
        tc_no,
        work_area_id,
        work_area_name,
        COUNT(*) as total_required,
        COUNT(CASE WHEN status = 'valid' THEN 1 END) as valid_count,
        COUNT(CASE WHEN status = 'missing' THEN 1 END) as missing_count,
        COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_count,
        json_agg(json_build_object(
          'docTypeId', doc_type_id,
          'docTypeName', doc_type_name,
          'status', status,
          'validityEndDate', validity_end_date
        )) as document_details
      FROM personnel_doc_status
      GROUP BY personnel_id, name, surname, tc_no, work_area_id, work_area_name
      ORDER BY missing_count DESC, expired_count DESC, surname, name
      LIMIT ${parseInt(limit as string)}
      OFFSET ${parseInt(offset as string)}
    `);

    // Toplam istatistikler
    const totalStatsResult = await db.execute(sql`
      WITH target_personnel AS (
        SELECT DISTINCT p.id
        FROM personnel p
        LEFT JOIN personnel_work_areas pwa ON p.id = pwa.personnel_id AND pwa.is_active = true AND pwa.exit_date IS NULL
        WHERE p.is_active = true
        ${personnelId ? sql`AND p.id = ${parseInt(personnelId as string)}` : sql``}
        ${workAreaId ? sql`AND pwa.work_area_id = ${parseInt(workAreaId as string)}` : sql``}
        ${companyId ? sql`AND EXISTS (SELECT 1 FROM personnel_company_matches pcm WHERE pcm.personnel_id = p.id AND pcm.company_id = ${parseInt(companyId as string)} AND pcm.is_active = true)` : sql``}
      )
      SELECT COUNT(*) as total_personnel FROM target_personnel
    `);

    const totalPersonnel = parseInt((totalStatsResult.rows[0] as any)?.total_personnel || '0');

    res.json({
      success: true,
      data: {
        requiredDocTypes: requiredDocTypeIds,
        totalPersonnel,
        personnel: summaryResult.rows,
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string)
        }
      },
      message: "Personel evrak özet raporu"
    });
  } catch (error) {
    console.error("Personel evrak özet raporu hatası:", error);
    res.status(500).json({
      success: false,
      error: "Personel evrak özet raporu oluşturulurken hata oluştu"
    });
  }
});

// Geçerliliği dolmuş evraklar raporu
// GET /api/documents/expired-report?entityType=personnel&daysAhead=30
documentRoutes.get("/expired-report", authenticateJWT, async (req: any, res) => {
  try {
    const {
      entityType = "personnel",
      workAreaId,
      companyId,
      daysAhead = "0", // Kaç gün içinde dolacak evrakları da göster
      limit = "100",
      offset = "0"
    } = req.query;

    const daysAheadNum = parseInt(daysAhead as string);
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAheadNum);

    const expiredDocsResult = await db.execute(sql`
      SELECT
        d.id as document_id,
        d.entity_id,
        d.title,
        d.validity_end_date,
        dst.name as doc_type_name,
        CASE
          WHEN d.validity_end_date < CURRENT_DATE THEN 'expired'
          ELSE 'expiring_soon'
        END as status,
        CASE
          WHEN ${entityType} = 'personnel' THEN (SELECT name || ' ' || surname FROM personnel WHERE id = d.entity_id)
          WHEN ${entityType} = 'asset' THEN (SELECT plate_number FROM assets WHERE id = d.entity_id)
          WHEN ${entityType} = 'company' THEN (SELECT name FROM companies WHERE id = d.entity_id)
          WHEN ${entityType} = 'work_area' THEN (SELECT name FROM work_areas WHERE id = d.entity_id)
        END as entity_name,
        ${entityType === 'personnel' ? sql`
          (SELECT wa.name FROM personnel_work_areas pwa
           JOIN work_areas wa ON pwa.work_area_id = wa.id
           WHERE pwa.personnel_id = d.entity_id AND pwa.is_active = true AND pwa.exit_date IS NULL
           LIMIT 1)
        ` : sql`NULL`} as work_area_name
      FROM documents d
      JOIN doc_sub_types dst ON d.doc_type_id = dst.id
      WHERE d.entity_type = ${entityType}
        AND d.is_active = true
        AND d.validity_end_date IS NOT NULL
        AND d.validity_end_date <= ${futureDate.toISOString().split('T')[0]}::date
        ${workAreaId && entityType === 'personnel' ? sql`
          AND EXISTS (
            SELECT 1 FROM personnel_work_areas pwa
            WHERE pwa.personnel_id = d.entity_id
              AND pwa.work_area_id = ${parseInt(workAreaId as string)}
              AND pwa.is_active = true
              AND pwa.exit_date IS NULL
          )
        ` : sql``}
        ${companyId && entityType === 'personnel' ? sql`
          AND EXISTS (
            SELECT 1 FROM personnel_company_matches pcm
            WHERE pcm.personnel_id = d.entity_id
              AND pcm.company_id = ${parseInt(companyId as string)}
              AND pcm.is_active = true
          )
        ` : sql``}
      ORDER BY d.validity_end_date ASC
      LIMIT ${parseInt(limit as string)}
      OFFSET ${parseInt(offset as string)}
    `);

    // İstatistikler
    const statsResult = await db.execute(sql`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN d.validity_end_date < CURRENT_DATE THEN 1 END) as expired_count,
        COUNT(CASE WHEN d.validity_end_date >= CURRENT_DATE THEN 1 END) as expiring_soon_count
      FROM documents d
      WHERE d.entity_type = ${entityType}
        AND d.is_active = true
        AND d.validity_end_date IS NOT NULL
        AND d.validity_end_date <= ${futureDate.toISOString().split('T')[0]}::date
        ${workAreaId && entityType === 'personnel' ? sql`
          AND EXISTS (
            SELECT 1 FROM personnel_work_areas pwa
            WHERE pwa.personnel_id = d.entity_id
              AND pwa.work_area_id = ${parseInt(workAreaId as string)}
              AND pwa.is_active = true
              AND pwa.exit_date IS NULL
          )
        ` : sql``}
        ${companyId && entityType === 'personnel' ? sql`
          AND EXISTS (
            SELECT 1 FROM personnel_company_matches pcm
            WHERE pcm.personnel_id = d.entity_id
              AND pcm.company_id = ${parseInt(companyId as string)}
              AND pcm.is_active = true
          )
        ` : sql``}
    `);

    const stats = statsResult.rows[0] as any;

    res.json({
      success: true,
      data: {
        filters: {
          entityType,
          workAreaId: workAreaId ? parseInt(workAreaId as string) : null,
          companyId: companyId ? parseInt(companyId as string) : null,
          daysAhead: daysAheadNum
        },
        statistics: {
          total: parseInt(stats?.total || '0'),
          expiredCount: parseInt(stats?.expired_count || '0'),
          expiringSoonCount: parseInt(stats?.expiring_soon_count || '0')
        },
        documents: expiredDocsResult.rows,
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string)
        }
      },
      message: daysAheadNum > 0
        ? `Süresi dolmuş ve ${daysAheadNum} gün içinde dolacak evraklar`
        : "Süresi dolmuş evraklar"
    });
  } catch (error) {
    console.error("Süresi dolmuş evrak raporu hatası:", error);
    res.status(500).json({
      success: false,
      error: "Süresi dolmuş evrak raporu oluşturulurken hata oluştu"
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
