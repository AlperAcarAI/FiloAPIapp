import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import mimeTypes from 'mime-types';
import { db } from './db.js';
import { eq, and, desc, asc } from 'drizzle-orm';
import { 
  assetDocuments, assets, docSubTypes, docMainTypes, personnel,
  assetDocumentUploadSchema, SelectAssetDocument
} from '../shared/schema.js';
import { z } from 'zod';
import { 
  authenticateApiKey,
  authenticateApiToken,
  authorizeEndpoint
} from './api-security.js';

const router = express.Router();

// DigitalOcean sunucu için dosya depolama yolu
const UPLOAD_DIR = process.env.NODE_ENV === 'production' 
  ? '/var/www/documents' 
  : './uploads';

// Dosya yükleme için izin verilen formatlar
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain'
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// Upload dizinini oluştur
async function ensureUploadDir() {
  try {
    await fs.access(UPLOAD_DIR);
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.mkdir(path.join(UPLOAD_DIR, 'assets'), { recursive: true });
    await fs.mkdir(path.join(UPLOAD_DIR, 'temp'), { recursive: true });
    await fs.mkdir(path.join(UPLOAD_DIR, 'thumbnails'), { recursive: true });
  }
}

// Dosya hash hesaplama
async function calculateFileHash(filePath: string): Promise<string> {
  const fileBuffer = await fs.readFile(filePath);
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
}

// Güvenli dosya adı oluşturma
function generateSafeFileName(originalName: string): string {
  const timestamp = Date.now();
  const randomSuffix = crypto.randomBytes(4).toString('hex');
  const ext = path.extname(originalName);
  const baseName = path.basename(originalName, ext)
    .replace(/[^a-zA-Z0-9]/g, '_')
    .substring(0, 50);
  
  return `${timestamp}_${randomSuffix}_${baseName}${ext}`;
}

// Multer konfigürasyonu - dinamik destination
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const assetId = req.body.assetId || 'temp';
      const docTypeId = req.body.docTypeId || 'unknown';
      const destPath = path.join(UPLOAD_DIR, 'assets', assetId.toString(), docTypeId.toString());
      
      await fs.mkdir(destPath, { recursive: true });
      cb(null, destPath);
    } catch (error) {
      cb(error as Error, '');
    }
  },
  filename: (req, file, cb) => {
    const safeFileName = generateSafeFileName(file.originalname);
    cb(null, safeFileName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 10 // Maximum 10 files per upload
  },
  fileFilter: (req, file, cb) => {
    // MIME type kontrolü
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Desteklenmeyen dosya formatı: ${file.mimetype}`) as any, false);
    }
  }
});

// ===========================
// DOCUMENT UPLOAD ENDPOINTS
// ===========================

/**
 * @swagger
 * /api/secure/documents/upload:
 *   post:
 *     summary: Asset dokuman yükleme
 *     description: Bir varlığa ait dokuman yükler ve veritabanına kaydeder
 *     tags: [Documents]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               assetId:
 *                 type: integer
 *                 description: Varlık ID
 *               docTypeId:
 *                 type: integer
 *                 description: Dokuman kategorisi ID
 *               personnelId:
 *                 type: integer
 *                 description: Sorumlu personel ID (opsiyonel)
 *               description:
 *                 type: string
 *                 description: Dokuman açıklaması
 *     responses:
 *       200:
 *         description: Dosyalar başarıyla yüklendi
 *       400:
 *         description: Geçersiz veri veya dosya formatı
 *       413:
 *         description: Dosya boyutu çok büyük
 */
router.post('/upload', authenticateApiKey, authorizeEndpoint(['document:write', 'asset:write']), upload.array('files', 10), async (req, res) => {
  try {
    // Upload dizinini kontrol et
    await ensureUploadDir();

    // Body validation
    const validatedData = assetDocumentUploadSchema.omit({ 
      fileName: true, 
      fileSize: true, 
      mimeType: true 
    }).parse({
      assetId: parseInt(req.body.assetId),
      docTypeId: parseInt(req.body.docTypeId),
      personnelId: req.body.personnelId ? parseInt(req.body.personnelId) : undefined,
      description: req.body.description || undefined,
    });

    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Dosya yüklenmedi.'
      });
    }

    const uploadedDocuments: SelectAssetDocument[] = [];

    // Her dosya için database kaydı oluştur
    for (const file of files) {
      try {
        // Dosya hash'i hesapla
        const fileHash = await calculateFileHash(file.path);
        
        // Duplicate kontrolü
        const existingDoc = await db.select()
          .from(assetDocuments)
          .where(and(
            eq(assetDocuments.assetId, validatedData.assetId),
            eq(assetDocuments.fileHash, fileHash)
          ))
          .limit(1);

        if (existingDoc.length > 0) {
          // Duplicate dosya, silip devam et
          await fs.unlink(file.path);
          continue;
        }

        // Relatif dosya yolu oluştur (public erişim için)
        const relativePath = path.relative(UPLOAD_DIR, file.path).replace(/\\/g, '/');
        const publicUrl = `/documents/${relativePath}`;

        // Database'e kaydet
        const [newDocument] = await db.insert(assetDocuments).values({
          assetId: validatedData.assetId,
          docTypeId: validatedData.docTypeId,
          personnelId: validatedData.personnelId,
          description: validatedData.description,
          docLink: publicUrl,
          fileName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype,
          fileHash: fileHash,
          createdBy: validatedData.personnelId
        }).returning();

        uploadedDocuments.push(newDocument);

      } catch (fileError) {
        console.error(`File processing error for ${file.originalname}:`, fileError);
        // Başarısız dosyayı sil
        try {
          await fs.unlink(file.path);
        } catch {}
        continue;
      }
    }

    res.json({
      success: true,
      message: `${uploadedDocuments.length} dosya başarıyla yüklendi.`,
      data: {
        uploadedDocuments,
        totalFiles: files.length,
        successCount: uploadedDocuments.length,
        duplicateCount: files.length - uploadedDocuments.length
      }
    });

  } catch (error) {
    console.error('Document upload error:', error);
    
    // Hata durumunda yüklenen dosyaları temizle
    if (req.files) {
      const files = req.files as Express.Multer.File[];
      for (const file of files) {
        try {
          await fs.unlink(file.path);
        } catch {}
      }
    }

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz veri formatı.',
        errors: error.errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Dosya yükleme sırasında hata oluştu.',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

/**
 * @swagger
 * /api/secure/documents/asset/{assetId}:
 *   get:
 *     summary: Varlık dokümanlarını listele
 *     description: Belirtilen varlığa ait tüm dokümanları listeler
 *     tags: [Documents]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: assetId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Varlık ID
 *       - in: query
 *         name: docTypeId
 *         schema:
 *           type: integer
 *         description: Dokuman kategorisi filtresi
 *     responses:
 *       200:
 *         description: Doküman listesi
 */
router.get('/asset/:assetId', authenticateApiKey, authorizeEndpoint(['document:read', 'asset:read']), async (req, res) => {
  try {
    const assetId = parseInt(req.params.assetId);
    const docTypeId = req.query.docTypeId ? parseInt(req.query.docTypeId as string) : undefined;

    if (isNaN(assetId)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz varlık ID.'
      });
    }

    const baseQuery = db.select({
      id: assetDocuments.id,
      assetId: assetDocuments.assetId,
      docTypeId: assetDocuments.docTypeId,
      docTypeName: docSubTypes.name,
      mainTypeName: docMainTypes.name,
      description: assetDocuments.description,
      docLink: assetDocuments.docLink,
      fileName: assetDocuments.fileName,
      fileSize: assetDocuments.fileSize,
      mimeType: assetDocuments.mimeType,
      uploadDate: assetDocuments.uploadDate,
      createdBy: assetDocuments.createdBy,
      uploaderName: personnel.name
    })
    .from(assetDocuments)
    .leftJoin(docSubTypes, eq(assetDocuments.docTypeId, docSubTypes.id))
    .leftJoin(docMainTypes, eq(docSubTypes.mainTypeId, docMainTypes.id))
    .leftJoin(personnel, eq(assetDocuments.createdBy, personnel.id));

    const whereConditions = [eq(assetDocuments.assetId, assetId)];
    if (docTypeId) {
      whereConditions.push(eq(assetDocuments.docTypeId, docTypeId));
    }

    const documents = await baseQuery
      .where(whereConditions.length > 1 ? and(...whereConditions) : whereConditions[0])
      .orderBy(desc(assetDocuments.uploadDate));

    res.json({
      success: true,
      message: 'Dokümanlar başarıyla getirildi.',
      data: {
        assetId,
        documents,
        totalCount: documents.length
      }
    });

  } catch (error) {
    console.error('Documents fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Dokümanlar getirilirken hata oluştu.',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

/**
 * @swagger
 * /api/secure/documents/download/{documentId}:
 *   get:
 *     summary: Dokuman indir
 *     description: Belirtilen dokümanı indirir
 *     tags: [Documents]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Dokuman ID
 *     responses:
 *       200:
 *         description: Dosya içeriği
 *       404:
 *         description: Dosya bulunamadı
 */
router.get('/download/:documentId', authenticateApiKey, authorizeEndpoint(['document:read']), async (req, res) => {
  try {
    const documentId = parseInt(req.params.documentId);

    if (isNaN(documentId)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz dokuman ID.'
      });
    }

    // Dokuman bilgisini getir
    const [document] = await db.select()
      .from(assetDocuments)
      .where(eq(assetDocuments.id, documentId))
      .limit(1);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Dokuman bulunamadı.'
      });
    }

    // Dosya yolu oluştur
    const filePath = path.join(UPLOAD_DIR, document.docLink!.replace('/documents/', ''));

    try {
      // Dosya varlığını kontrol et
      await fs.access(filePath);
      
      // Güvenli dosya adı
      const safeFileName = document.fileName || `document_${documentId}`;
      
      // Response headers
      res.setHeader('Content-Disposition', `attachment; filename="${safeFileName}"`);
      res.setHeader('Content-Type', document.mimeType || 'application/octet-stream');
      
      // Dosyayı stream et
      const fileStream = await fs.readFile(filePath);
      res.send(fileStream);

    } catch {
      return res.status(404).json({
        success: false,
        message: 'Dosya sunucuda bulunamadı.'
      });
    }

  } catch (error) {
    console.error('Document download error:', error);
    res.status(500).json({
      success: false,
      message: 'Dosya indirilirken hata oluştu.',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

/**
 * @swagger
 * /api/secure/documents/{documentId}:
 *   delete:
 *     summary: Dokuman sil
 *     description: Belirtilen dokümanı ve dosyasını siler
 *     tags: [Documents]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Dokuman ID
 *     responses:
 *       200:
 *         description: Dokuman başarıyla silindi
 *       404:
 *         description: Dokuman bulunamadı
 */
router.delete('/:documentId', authenticateApiKey, authorizeEndpoint(['document:delete', 'asset:write']), async (req, res) => {
  try {
    const documentId = parseInt(req.params.documentId);

    if (isNaN(documentId)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz dokuman ID.'
      });
    }

    // Dokuman bilgisini getir
    const [document] = await db.select()
      .from(assetDocuments)
      .where(eq(assetDocuments.id, documentId))
      .limit(1);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Dokuman bulunamadı.'
      });
    }

    // Database'den sil
    await db.delete(assetDocuments)
      .where(eq(assetDocuments.id, documentId));

    // Dosyayı da sil
    if (document.docLink) {
      const filePath = path.join(UPLOAD_DIR, document.docLink.replace('/documents/', ''));
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.warn(`Could not delete file: ${filePath}`, error);
      }
    }

    res.json({
      success: true,
      message: 'Dokuman başarıyla silindi.',
      data: {
        deletedDocument: document
      }
    });

  } catch (error) {
    console.error('Document delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Dokuman silinirken hata oluştu.',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

// Initialize upload directory on startup
ensureUploadDir().catch(console.error);

export default router;