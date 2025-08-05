import { Router } from "express";
import { db } from "./db";
import { documents, docSubTypes, users, personnel, companies, workAreas, assets } from "@shared/schema";
import { insertDocumentSchema, updateDocumentSchema } from "@shared/schema";
import { eq, and, or, like, desc, asc, sql } from "drizzle-orm";
import { authenticateToken } from "./auth";
import { hasPermission } from "./permission-management-routes";
import { authenticateJWT } from "./hierarchical-auth";
import { captureAuditInfo, auditableInsert, auditableUpdate, auditableDelete } from "./audit-middleware";
import { z } from "zod";

const documentRoutes = Router();

export default documentRoutes;

// Tüm dökümanları listele (filtreleme destekli)
documentRoutes.get("/", authenticateJWT, hasPermission(["document:read"]), async (req: any, res) => {
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

// Belirli bir dökümanı getir
documentRoutes.get("/:id", authenticateJWT, hasPermission(["document:read"]), async (req: any, res) => {
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
documentRoutes.post("/", authenticateJWT, hasPermission(["document:write"]), async (req: any, res) => {
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

// Döküman güncelle
documentRoutes.put("/:id", authenticateJWT, hasPermission(["document:write"]), async (req: any, res) => {
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
documentRoutes.delete("/:id", authenticateJWT, hasPermission(["document:delete"]), async (req: any, res) => {
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
documentRoutes.get("/entity/:entityType/:entityId", authenticateJWT, hasPermission(["document:read"]), async (req: any, res) => {
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