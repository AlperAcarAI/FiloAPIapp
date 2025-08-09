import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { db } from './db';
import { authenticateToken } from './auth.js';
import { parse as csvParse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';

const router = Router();

// Multer config for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'text/csv',
      'text/plain', // CSV dosyalar bazen text/plain olarak gelebilir
      'application/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    // Dosya uzantısı kontrolü de ekle
    const isCSV = file.originalname.endsWith('.csv');
    const isExcel = file.originalname.endsWith('.xlsx') || file.originalname.endsWith('.xls');
    
    if (allowedTypes.includes(file.mimetype) || isCSV || isExcel) {
      cb(null, true);
    } else {
      cb(new Error('Desteklenmeyen dosya formatı. CSV veya Excel dosyası gerekli.'));
    }
  }
});

// Bulk Import Status Store (production'da Redis kullanılmalı)
interface ImportStatusData {
  id: string;
  status: 'processing' | 'completed' | 'failed' | 'cancelled';
  totalRows: number;
  processedRows: number;
  skippedRows: number; // Duplicate atlayanlar
  addedRows: number;   // Gerçek eklenenler
  errors: string[];
  startTime: Date;
  endTime?: Date;
}

const importStatus = new Map<string, ImportStatusData>();

// Tüm aktif import işlemlerini durdur
function stopAllImports() {
  console.log('Tüm bulk import işlemleri durduruluyor...');
  const entries = Array.from(importStatus.entries());
  for (const [importId, status] of entries) {
    if (status.status === 'processing') {
      status.status = 'cancelled';
      status.endTime = new Date();
      console.log(`Import işlemi durduruldu: ${importId}`);
    }
  }
  console.log('Tüm import işlemleri durduruldu.');
}

/**
 * @swagger
 * /api/secure/bulk-import/templates:
 *   get:
 *     summary: CSV Template Listesi
 *     description: Bulk import için kullanılabilir CSV şablonlarını döndürür
 *     tags: [Bulk Import]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Template listesi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     templates:
 *                       type: array
 */
router.get('/bulk-import/templates',
  authenticateToken,
  async (req, res) => {
    try {
      const templates = [
        {
          name: 'assets',
          displayName: 'Varlık Listesi',
          description: 'Araç ve ekipman varlıklarının toplu yüklenmesi için şablon',
          requiredFields: ['plateNumber', 'chassisNo', 'assetType', 'brand', 'model'],
          optionalFields: ['year', 'fuelType', 'department', 'location'],
          sampleFile: '/templates/assets_template.csv'
        },
        {
          name: 'personnel', 
          displayName: 'Personel Listesi',
          description: 'Personel bilgilerinin toplu yüklenmesi için şablon',
          requiredFields: ['firstName', 'lastName', 'email', 'department'],
          optionalFields: ['phone', 'position', 'startDate', 'salary'],
          sampleFile: '/templates/personnel_template.csv'
        },
        {
          name: 'companies',
          displayName: 'Şirket Listesi', 
          description: 'Şirket bilgilerinin toplu yüklenmesi için şablon',
          requiredFields: ['name', 'taxNo', 'taxOffice'],
          optionalFields: ['address', 'phone', 'email', 'cityId'],
          sampleFile: '/templates/companies_template.csv'
        },
        {
          name: 'fuel_records',
          displayName: 'Yakıt Kayıtları',
          description: 'Yakıt alım kayıtlarının toplu yüklenmesi için şablon', 
          requiredFields: ['assetId', 'fuelAmount', 'fuelCost', 'fuelDate'],
          optionalFields: ['location', 'odometer', 'notes'],
          sampleFile: '/templates/fuel_template.csv'
        },
        {
          name: 'car_brands_models',
          displayName: 'Araç Marka/Model',
          description: 'Araç marka ve model bilgilerinin toplu yüklenmesi için şablon',
          requiredFields: ['brandName', 'modelName'],
          optionalFields: ['year', 'engineSize', 'fuelType'],
          sampleFile: '/templates/car_brands_models_template.csv'
        }
      ];

      res.json({
        success: true,
        message: 'Bulk import şablonları başarıyla getirildi',
        data: { templates }
      });

    } catch (error) {
      console.error('Template listesi hatası:', error);
      res.status(500).json({
        success: false,
        error: 'TEMPLATE_ERROR',
        message: 'Şablon listesi getirilemedi'
      });
    }
  }
);

/**
 * @swagger
 * /api/secure/bulk-import/csv:
 *   post:
 *     summary: CSV Bulk Import
 *     description: 28.000+ satırlık CSV dosyalarını veritabanına toplu olarak aktarır
 *     tags: [Bulk Import]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: CSV dosyası
 *               targetTable:
 *                 type: string
 *                 enum: [assets, personnel, companies, fuel_records, car_brands_models]
 *                 description: Hedef tablo adı
 *               batchSize:
 *                 type: integer
 *                 default: 1000
 *                 description: Batch başına işlenecek satır sayısı
 *     responses:
 *       200:
 *         description: Import işlemi başlatıldı
 *       400:
 *         description: Geçersiz dosya veya parametreler
 */
router.post('/bulk-import/csv', 
  authenticateToken, 
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'FILE_REQUIRED',
          message: 'CSV dosyası gerekli'
        });
      }

      const { targetTable = 'assets', batchSize = 1000 } = req.body;
      const importId = `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // CSV Parse
      const csvData = csvParse(req.file.buffer.toString(), {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });

      // Import status initialize
      importStatus.set(importId, {
        id: importId,
        status: 'processing',
        totalRows: csvData.length,
        processedRows: 0,
        skippedRows: 0,
        addedRows: 0,
        errors: [],
        startTime: new Date()
      });

      // Async processing başlat
      processCSVImport(importId, csvData, targetTable, parseInt(batchSize));

      res.json({
        success: true,
        message: 'Bulk import işlemi başlatıldı',
        data: {
          importId,
          totalRows: csvData.length,
          estimatedTime: Math.ceil(csvData.length / batchSize) * 2, // saniye
          statusEndpoint: `/api/secure/bulk-import/status/${importId}`
        }
      });

    } catch (error) {
      console.error('CSV Import hatası:', error);
      res.status(500).json({
        success: false,
        error: 'IMPORT_ERROR',
        message: 'CSV import işlemi başlatılamadı'
      });
    }
  }
);

/**
 * @swagger
 * /api/secure/bulk-import/status/{importId}:
 *   get:
 *     summary: Import Status Check
 *     description: Bulk import işleminin durumunu kontrol eder
 */
router.get('/bulk-import/status/:importId',
  authenticateToken,
  async (req, res) => {
    try {
      const { importId } = req.params;
      const status = importStatus.get(importId);

      if (!status) {
        return res.status(404).json({
          success: false,
          error: 'IMPORT_NOT_FOUND',
          message: 'Import işlemi bulunamadı'
        });
      }

      const progress = Math.round((status.processedRows / status.totalRows) * 100);
      const elapsed = Date.now() - status.startTime.getTime();
      const estimatedTotal = status.processedRows > 0 ? 
        (elapsed / status.processedRows) * status.totalRows : 0;
      const eta = estimatedTotal - elapsed;

      res.json({
        success: true,
        data: {
          ...status,
          progress,
          elapsedTime: Math.round(elapsed / 1000),
          estimatedTimeRemaining: Math.max(0, Math.round(eta / 1000)),
          speed: status.processedRows > 0 ? 
            Math.round(status.processedRows / (elapsed / 1000)) : 0
        }
      });

    } catch (error) {
      console.error('Status check hatası:', error);
      res.status(500).json({
        success: false,
        error: 'STATUS_ERROR',
        message: 'Import durumu kontrol edilemedi'
      });
    }
  }
);

// Async CSV Processing Function
async function processCSVImport(
  importId: string, 
  csvData: any[], 
  targetTable: string, 
  batchSize: number
) {
  const status = importStatus.get(importId)!;
  
  try {
    for (let i = 0; i < csvData.length; i += batchSize) {
      const batch = csvData.slice(i, i + batchSize);
      
      // Batch işleme (tablo tipine göre)
      await processBatch(batch, targetTable, importId);
      
      // Status güncelle
      status.processedRows = Math.min(i + batchSize, csvData.length);
      
      // Kısa pause (database overload önlemek için)
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    status.status = 'completed';
    status.endTime = new Date();

  } catch (error) {
    console.error(`Import ${importId} failed:`, error);
    status.status = 'failed';
    status.endTime = new Date();
    status.errors.push(error instanceof Error ? error.message : 'Unknown error');
  }
}

// Batch Processing Function
async function processBatch(batch: any[], targetTable: string, importId?: string) {
  console.log(`Processing batch for table: ${targetTable}, importId: ${importId}`);
  switch (targetTable) {
    case 'car_brands_models':
      // Performans optimizasyonu için batch size küçült
      const smallerBatches = [];
      for (let i = 0; i < batch.length; i += 10) {
        smallerBatches.push(batch.slice(i, i + 10));
      }
      
      for (const smallBatch of smallerBatches) {
        await processCarBrandsModels(smallBatch, importId || '');
        // Her küçük batch'ten sonra kısa bekle
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      break;
      
    case 'assets':
      // Assets tablosuna bulk insert
      // TODO: Schema validation ve mapping
      break;
      
    case 'personnel':
      // Personnel tablosuna bulk insert
      // TODO: Schema validation ve mapping
      break;
      
    case 'fuel_records':
      // Fuel records tablosuna bulk insert
      // TODO: Schema validation ve mapping
      break;
      
    default:
      throw new Error(`Desteklenmeyen tablo: ${targetTable}`);
  }
}

// Car Brands & Models Processing Function  
async function processCarBrandsModels(batch: any[], importId?: string) {
  const { carBrands, carModels, carTypes } = await import('../shared/schema.js');
  const { eq, and } = await import('drizzle-orm');
  
  const status = importId ? importStatus.get(importId) : null;
  
  for (const row of batch) {
    try {
      // CSV kolonları: Marka Kodu, Tip Kodu, Marka Adı, Tip Adı, Tip, Kapasite, Tip ID
      const {
        'Marka Kodu': markaKodu,
        'Marka Adı': markaAdi,
        'Tip Adı': tipAdi,
        'Kapasite': kapasite,
        'Tip ID': tipId
      } = row;

      if (!markaKodu || !markaAdi || !tipAdi || !kapasite || !tipId) {
        console.warn('Eksik veri (marka, model, kapasite veya tip ID eksik), satır atlandı:', row);
        continue;
      }

      // Integer kontrolü
      const markaKoduInt = parseInt(markaKodu);
      const kapasiteInt = parseInt(kapasite);
      const tipIdInt = parseInt(tipId);

      if (isNaN(markaKoduInt) || isNaN(kapasiteInt) || isNaN(tipIdInt)) {
        console.warn('Geçersiz sayısal değer, satır atlandı:', row);
        continue;
      }

      // 1. Marka kontrolü ve ekleme (gelişmiş duplicate check)
      let existingBrand = await db.select()
        .from(carBrands)
        .where(eq(carBrands.id, markaKoduInt))
        .limit(1);

      if (existingBrand.length === 0) {
        // Yeni marka ekle
        await db.insert(carBrands).values({
          id: markaKoduInt,
          name: markaAdi,
          isActive: true
        }).onConflictDoUpdate({
          target: carBrands.id,
          set: {
            name: markaAdi,
            isActive: true
          }
        });
        console.log(`Yeni marka eklendi: ${markaAdi} (${markaKoduInt})`);
      } else {
        console.log(`Marka mevcut: ${markaAdi} (${markaKoduInt})`);
      }

      // 2. Model duplicate kontrolü (aynı marka + model varsa atla)
      let existingModel = await db.select()
        .from(carModels)
        .where(and(
          eq(carModels.name, tipAdi),
          eq(carModels.brandId, markaKoduInt)
        ))
        .limit(1);

      if (existingModel.length === 0) {
        // Sadece yeni model ise ekle
        await db.insert(carModels).values({
          name: tipAdi,
          brandId: markaKoduInt,
          typeId: tipIdInt,
          capacity: kapasiteInt,
          isActive: true
        });
        console.log(`Yeni model eklendi: ${markaAdi} - ${tipAdi}`);
        if (status) status.addedRows++;
      } else {
        // Aynı marka ve model mevcut, işleme (konsol log)
        console.log(`Duplicate atlandı: ${markaAdi} - ${tipAdi} (mevcut)`);
        if (status) status.skippedRows++;
        continue; // Satırı atla, işleme
      }

    } catch (error) {
      console.error('Satır işleme hatası:', error, 'Row:', row);
      // Hata durumunda devam et, batch'i kesme
    }
  }
}

/**
 * @swagger
 * /api/secure/bulk-import/template/{tableName}:
 *   get:
 *     summary: CSV Template Download
 *     description: Belirtilen tablo için CSV template indirir
 */
router.get('/bulk-import/template/:tableName',
  authenticateToken,
  async (req, res) => {
    try {
      const { tableName } = req.params;
      
      let headers: string[] = [];
      
      switch (tableName) {
        case 'assets':
          headers = ['plateNumber', 'modelYear', 'carModelId', 'companyId', 'currentKm'];
          break;
        case 'personnel':
          headers = ['firstName', 'lastName', 'email', 'phoneNumber', 'positionId'];
          break;
        case 'fuel_records':
          headers = ['assetId', 'recordDate', 'currentKilometers', 'fuelAmount', 'fuelCostCents', 'gasStationName'];
          break;
        case 'car_brands_models':
          headers = ['Marka Kodu', 'Tip Kodu', 'Marka Adı', 'Tip Adı', 'Tip', 'Kapasite', 'Tip ID'];
          break;
        default:
          return res.status(400).json({
            success: false,
            error: 'INVALID_TABLE',
            message: 'Geçersiz tablo adı'
          });
      }

      const csvTemplate = headers.join(',') + '\n';
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${tableName}_template.csv"`);
      res.send(csvTemplate);

    } catch (error) {
      console.error('Template download hatası:', error);
      res.status(500).json({
        success: false,
        error: 'TEMPLATE_ERROR',
        message: 'Template indirilemedi'
      });
    }
  }
);

// Emergency stop endpoint - tüm import işlemlerini durdur (izin gevşetildi)
router.post('/bulk-import/stop-all',
  authenticateToken,
  async (req, res) => {
    try {
      stopAllImports();
      
      res.json({
        success: true,
        message: 'Tüm bulk import işlemleri durduruldu',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Import durdurma hatası:', error);
      res.status(500).json({
        success: false,
        error: 'STOP_ERROR',
        message: 'Import işlemleri durdurulamadı'
      });
    }
  }
);

// Manuel import status temizleme endpoint (izin gevşetildi)
router.delete('/bulk-import/clear-status',
  authenticateToken,
  async (req, res) => {
    try {
      const clearedCount = importStatus.size;
      importStatus.clear();
      
      res.json({
        success: true,
        message: `${clearedCount} import status kaydı temizlendi`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Status temizleme hatası:', error);
      res.status(500).json({
        success: false,
        error: 'CLEAR_ERROR',
        message: 'Status kayıtları temizlenemedi'
      });
    }
  }
);

export default router;