import { Router } from 'express';
import { db } from './db';
import {
  documents,
  docMainTypes,
  docSubTypes,
  personnel,
  companies,
  workAreas,
  assets,
  foOutageProcess,
} from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { authenticateJWT } from './hierarchical-auth';
import { captureAuditInfo, auditableInsert } from './audit-middleware';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import AdmZip from 'adm-zip';
import {
  classifyDocuments,
  buildCategoryTree,
  type ClassificationResult,
  type FileInfo,
} from './ai-document-classifier';

// ── Sabitler ──────────────────────────────────────────────
const MAX_FILES = 50;
const MAX_SINGLE_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const MAX_TOTAL_EXTRACTED_SIZE = 500 * 1024 * 1024; // 500 MB
const MAX_COMPRESSION_RATIO = 100;
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 dakika
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 dakika

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png', '.gif', '.txt'];
const SKIP_FILES = ['__MACOSX', '.DS_Store', 'Thumbs.db', 'desktop.ini'];

const uploadsDir = path.join(process.cwd(), 'uploads');
const tempBaseDir = path.join(uploadsDir, '_temp');

// ── ZIP Multer (memoryStorage) ──────────────────────────────
const zipUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 }, // 200 MB ZIP limiti
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.zip' || file.mimetype === 'application/zip' || file.mimetype === 'application/x-zip-compressed') {
      cb(null, true);
    } else {
      cb(new Error('Sadece ZIP dosyası yüklenebilir'));
    }
  },
});

// ── Session Yönetimi ────────────────────────────────────────
interface TempFileInfo {
  tempFileName: string;
  originalFileName: string;
  fileSize: number;
  mimeType: string;
}

interface ZipSession {
  id: string;
  userId: number;
  entityType: string;
  entityId: number;
  tempDir: string;
  files: TempFileInfo[];
  classifications: ClassificationResult[];
  createdAt: Date;
  expiresAt: Date;
}

const zipSessions = new Map<string, ZipSession>();

/** Süresi dolmuş oturumları temizle */
function cleanupExpiredSessions(): void {
  const now = Date.now();
  for (const [id, session] of zipSessions.entries()) {
    if (now > session.expiresAt.getTime()) {
      // Temp dizini sil
      if (fs.existsSync(session.tempDir)) {
        fs.rmSync(session.tempDir, { recursive: true, force: true });
      }
      zipSessions.delete(id);
    }
  }
}

// Periyodik temizlik başlat
const cleanupTimer = setInterval(cleanupExpiredSessions, CLEANUP_INTERVAL_MS);
cleanupTimer.unref(); // Process kapanışını engellemesin

// ── Yardımcı Fonksiyonlar ───────────────────────────────────

/** ZIP güvenlik doğrulaması */
function validateZipSafety(zip: AdmZip): { safe: boolean; error?: string } {
  const entries = zip.getEntries();
  const validEntries = entries.filter(e => !e.isDirectory && !shouldSkipEntry(e.entryName));

  if (validEntries.length === 0) {
    return { safe: false, error: 'ZIP dosyası boş veya geçerli dosya içermiyor' };
  }

  if (validEntries.length > MAX_FILES) {
    return { safe: false, error: `ZIP dosyasında en fazla ${MAX_FILES} dosya olabilir (${validEntries.length} dosya bulundu)` };
  }

  let totalSize = 0;
  for (const entry of validEntries) {
    // Path traversal kontrolü
    if (entry.entryName.includes('..') || path.isAbsolute(entry.entryName)) {
      return { safe: false, error: `Güvenlik ihlali: geçersiz dosya yolu "${entry.entryName}"` };
    }

    // Tekil dosya boyutu
    if (entry.header.size > MAX_SINGLE_FILE_SIZE) {
      return { safe: false, error: `Dosya çok büyük: "${entry.name}" (max ${MAX_SINGLE_FILE_SIZE / 1024 / 1024} MB)` };
    }

    // Sıkıştırma oranı (zip bomb kontrolü)
    if (entry.header.compressedSize > 0) {
      const ratio = entry.header.size / entry.header.compressedSize;
      if (ratio > MAX_COMPRESSION_RATIO) {
        return { safe: false, error: 'ZIP dosyası güvenlik limitlerini aşıyor (olası zip bomb)' };
      }
    }

    // Uzantı kontrolü
    const ext = path.extname(entry.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return { safe: false, error: `Desteklenmeyen dosya formatı: "${entry.name}". İzin verilen: ${ALLOWED_EXTENSIONS.join(', ')}` };
    }

    totalSize += entry.header.size;
    if (totalSize > MAX_TOTAL_EXTRACTED_SIZE) {
      return { safe: false, error: `Toplam dosya boyutu çok büyük (max ${MAX_TOTAL_EXTRACTED_SIZE / 1024 / 1024} MB)` };
    }
  }

  return { safe: true };
}

/** Atlanması gereken ZIP entry kontrolü */
function shouldSkipEntry(entryName: string): boolean {
  const baseName = path.basename(entryName);
  return SKIP_FILES.some(skip => entryName.includes(skip) || baseName === skip) || baseName.startsWith('.');
}

/** Dosya uzantısından MIME type tahmin et */
function getMimeType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  const mimeMap: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.txt': 'text/plain',
  };
  return mimeMap[ext] || 'application/octet-stream';
}

/** Dosya hash'i hesapla (buffer'dan) */
function calculateBufferHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/** Entity varlığını kontrol et */
async function validateEntity(entityType: string, entityId: number): Promise<{ exists: boolean; error?: string }> {
  switch (entityType) {
    case 'personnel': {
      const [row] = await db.select({ id: personnel.id }).from(personnel).where(eq(personnel.id, entityId));
      return { exists: !!row };
    }
    case 'company': {
      const [row] = await db.select({ id: companies.id }).from(companies).where(eq(companies.id, entityId));
      return { exists: !!row };
    }
    case 'work_area': {
      const [row] = await db.select({ id: workAreas.id }).from(workAreas).where(eq(workAreas.id, entityId));
      return { exists: !!row };
    }
    case 'asset': {
      const [row] = await db.select({ id: assets.id }).from(assets).where(eq(assets.id, entityId));
      return { exists: !!row };
    }
    case 'operation': {
      const [row] = await db.select({ id: foOutageProcess.id }).from(foOutageProcess).where(eq(foOutageProcess.id, entityId));
      return { exists: !!row };
    }
    default:
      return { exists: false, error: 'Geçersiz entityType. personnel, asset, company, work_area veya operation olmalı' };
  }
}

/** Kalıcı dosya depolama dizinini oluştur */
function getPermanentDir(req: any): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  const tenantConfig = req.tenantConfig;
  const tenantSlug = tenantConfig
    ? tenantConfig.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')
    : 'default';

  const dir = path.join(uploadsDir, tenantSlug, year.toString(), month, day);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/** Unique dosya adı oluştur */
function generateFileName(originalName: string, userId: number): string {
  const dateStr = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
  const randomId = Math.random().toString(36).substring(2, 8);
  const ext = path.extname(originalName);
  const base = path.basename(originalName, ext);
  return `${base}_user${userId}_${dateStr}_${randomId}${ext}`;
}

// ── Router ──────────────────────────────────────────────────
const zipUploadRoutes = Router();

/**
 * POST /analyze — ZIP yükle, çıkar, AI ile sınıflandır
 */
zipUploadRoutes.post('/analyze', authenticateJWT, zipUpload.single('zipFile'), async (req: any, res) => {
  let tempDir: string | null = null;

  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'ZIP_MISSING', message: 'ZIP dosyası yüklenemedi' });
    }

    const { entityType, entityId } = req.body;
    if (!entityType || !entityId) {
      return res.status(400).json({ success: false, error: 'MISSING_FIELDS', message: 'entityType ve entityId zorunlu' });
    }

    const parsedEntityId = parseInt(entityId);
    if (isNaN(parsedEntityId)) {
      return res.status(400).json({ success: false, error: 'INVALID_ENTITY_ID', message: 'entityId sayı olmalı' });
    }

    // Entity varlığını kontrol et
    const entityCheck = await validateEntity(entityType, parsedEntityId);
    if (entityCheck.error) {
      return res.status(400).json({ success: false, error: 'INVALID_ENTITY_TYPE', message: entityCheck.error });
    }
    if (!entityCheck.exists) {
      return res.status(404).json({ success: false, error: 'ENTITY_NOT_FOUND', message: `${entityType} bulunamadı` });
    }

    // ZIP dosyasını aç
    let zip: AdmZip;
    try {
      zip = new AdmZip(req.file.buffer);
    } catch {
      return res.status(400).json({ success: false, error: 'INVALID_ZIP', message: 'Geçersiz ZIP dosyası' });
    }

    // Güvenlik doğrulaması
    const safety = validateZipSafety(zip);
    if (!safety.safe) {
      return res.status(400).json({ success: false, error: 'ZIP_VALIDATION_FAILED', message: safety.error });
    }

    // Session ID oluştur ve temp dizin hazırla
    const sessionId = crypto.randomUUID();
    tempDir = path.join(tempBaseDir, sessionId);
    fs.mkdirSync(tempDir, { recursive: true });

    // Dosyaları çıkar
    const entries = zip.getEntries().filter(e => !e.isDirectory && !shouldSkipEntry(e.entryName));
    const tempFiles: TempFileInfo[] = [];
    const fileInfos: FileInfo[] = [];

    for (const entry of entries) {
      const ext = path.extname(entry.name).toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) continue;

      const buffer = entry.getData();
      const originalName = path.basename(entry.entryName);
      const tempFileName = `${crypto.randomUUID()}${ext}`;
      const tempFilePath = path.join(tempDir, tempFileName);

      fs.writeFileSync(tempFilePath, buffer);

      const mimeType = getMimeType(originalName);
      tempFiles.push({
        tempFileName,
        originalFileName: originalName,
        fileSize: buffer.length,
        mimeType,
      });
      fileInfos.push({
        fileName: originalName,
        mimeType,
        fileSize: buffer.length,
        buffer, // Vision API için (resimler)
      });
    }

    // AI sınıflandırma: Kategorileri DB'den çek
    const mainTypes = await db.select().from(docMainTypes).where(eq(docMainTypes.isActive, true));
    const subTypes = await db.select().from(docSubTypes).where(eq(docSubTypes.isActive, true));
    const categories = buildCategoryTree(mainTypes, subTypes);

    let classifications: ClassificationResult[];
    try {
      classifications = await classifyDocuments(fileInfos, categories, entityType);
    } catch (aiError) {
      console.error('AI sınıflandırma hatası:', aiError);
      // AI başarısız olursa, dosya adından basit eşleştirme yap
      classifications = fileInfos.map(f => ({
        fileName: f.fileName,
        mainTypeId: mainTypes[0]?.id ?? 0,
        mainTypeName: mainTypes[0]?.name ?? 'Bilinmeyen',
        subTypeId: subTypes[0]?.id ?? 0,
        subTypeName: subTypes[0]?.name ?? 'Bilinmeyen',
        suggestedTitle: f.fileName.replace(/\.[^.]+$/, ''),
        confidence: 0,
        reasoning: 'AI sınıflandırma başarısız oldu, lütfen manuel olarak seçin',
      }));
    }

    // Session kaydet
    const now = new Date();
    const session: ZipSession = {
      id: sessionId,
      userId: req.userContext?.userId ?? 1,
      entityType,
      entityId: parsedEntityId,
      tempDir,
      files: tempFiles,
      classifications,
      createdAt: now,
      expiresAt: new Date(now.getTime() + SESSION_TTL_MS),
    };
    zipSessions.set(sessionId, session);

    // tempDir artık session'a ait, cleanup yapma
    tempDir = null;

    res.json({
      success: true,
      data: {
        sessionId,
        entityType,
        entityId: parsedEntityId,
        files: tempFiles.map((tf, i) => ({
          ...tf,
          aiClassification: classifications[i],
        })),
        expiresAt: session.expiresAt.toISOString(),
      },
    });

  } catch (error) {
    // Hata durumunda temp dizini temizle
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    console.error('ZIP analyze hatası:', error);
    res.status(500).json({
      success: false,
      error: 'ZIP_ANALYZE_ERROR',
      message: 'ZIP dosyası analiz edilirken hata oluştu',
    });
  }
});

/**
 * POST /confirm — Onaylanan dosyaları kalıcı olarak kaydet
 */
zipUploadRoutes.post('/confirm', authenticateJWT, async (req: any, res) => {
  try {
    const { sessionId, entityType, entityId, files } = req.body;

    if (!sessionId || !entityType || !entityId || !Array.isArray(files)) {
      return res.status(400).json({ success: false, error: 'MISSING_FIELDS', message: 'sessionId, entityType, entityId ve files zorunlu' });
    }

    const session = zipSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, error: 'SESSION_NOT_FOUND', message: 'Yükleme oturumu bulunamadı' });
    }

    // Session süresi dolmuş mu?
    if (Date.now() > session.expiresAt.getTime()) {
      // Temizle
      if (fs.existsSync(session.tempDir)) {
        fs.rmSync(session.tempDir, { recursive: true, force: true });
      }
      zipSessions.delete(sessionId);
      return res.status(410).json({ success: false, error: 'SESSION_EXPIRED', message: 'Oturum süresi doldu, lütfen tekrar yükleyin' });
    }

    // Session sahibi kontrolü
    const userId = req.userContext?.userId ?? 1;
    if (session.userId !== userId) {
      return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'Bu oturum size ait değil' });
    }

    const auditInfo = captureAuditInfo(req);
    const permanentDir = getPermanentDir(req);
    const createdDocs: any[] = [];

    for (const fileSpec of files) {
      if (!fileSpec.include) continue;

      // Temp dosyayı bul
      const tempFile = session.files.find(f => f.tempFileName === fileSpec.tempFileName);
      if (!tempFile) continue;

      const tempFilePath = path.join(session.tempDir, tempFile.tempFileName);
      if (!fs.existsSync(tempFilePath)) continue;

      // Kalıcı dosya adı oluştur ve taşı
      const permanentFileName = generateFileName(tempFile.originalFileName, userId);
      const permanentFilePath = path.join(permanentDir, permanentFileName);
      fs.copyFileSync(tempFilePath, permanentFilePath);

      // Hash hesapla
      const fileBuffer = fs.readFileSync(permanentFilePath);
      const fileHash = calculateBufferHash(fileBuffer);

      // DB'ye kaydet
      const docTypeId = parseInt(fileSpec.docTypeId);
      const [newDoc] = await auditableInsert(
        db,
        documents,
        {
          entityType: session.entityType,
          entityId: session.entityId,
          docTypeId: isNaN(docTypeId) ? null : docTypeId,
          title: fileSpec.title || tempFile.originalFileName,
          description: fileSpec.description || null,
          filePath: permanentFilePath,
          fileName: tempFile.originalFileName,
          fileSize: tempFile.fileSize,
          mimeType: tempFile.mimeType,
          fileHash,
          uploadedBy: userId,
          validityStartDate: fileSpec.validityStartDate || null,
          validityEndDate: fileSpec.validityEndDate || null,
          createdBy: auditInfo.userId,
          updatedBy: auditInfo.userId,
        },
        auditInfo
      );

      createdDocs.push(newDoc);
    }

    // Temp dizini temizle
    if (fs.existsSync(session.tempDir)) {
      fs.rmSync(session.tempDir, { recursive: true, force: true });
    }
    zipSessions.delete(sessionId);

    res.json({
      success: true,
      data: { documents: createdDocs, totalCreated: createdDocs.length },
      message: `${createdDocs.length} döküman başarıyla kaydedildi`,
    });

  } catch (error) {
    console.error('ZIP confirm hatası:', error);
    res.status(500).json({
      success: false,
      error: 'ZIP_CONFIRM_ERROR',
      message: 'Dosyalar kaydedilirken hata oluştu',
    });
  }
});

/**
 * DELETE /cancel/:sessionId — Oturumu ve temp dosyaları temizle
 */
zipUploadRoutes.delete('/cancel/:sessionId', authenticateJWT, async (req: any, res) => {
  try {
    const { sessionId } = req.params;

    const session = zipSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, error: 'SESSION_NOT_FOUND', message: 'Yükleme oturumu bulunamadı' });
    }

    // Session sahibi kontrolü
    const userId = req.userContext?.userId ?? 1;
    if (session.userId !== userId) {
      return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'Bu oturum size ait değil' });
    }

    // Temizle
    if (fs.existsSync(session.tempDir)) {
      fs.rmSync(session.tempDir, { recursive: true, force: true });
    }
    zipSessions.delete(sessionId);

    res.json({ success: true, message: 'Yükleme oturumu iptal edildi' });

  } catch (error) {
    console.error('ZIP cancel hatası:', error);
    res.status(500).json({
      success: false,
      error: 'ZIP_CANCEL_ERROR',
      message: 'Oturum iptal edilirken hata oluştu',
    });
  }
});

export default zipUploadRoutes;
