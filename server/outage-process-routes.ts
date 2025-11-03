import { Router } from 'express';
import { db } from './db.js';
import { eq, and, ilike, desc, or, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';
import { 
  foOutageProcess,
  foOutageProcessPersonnels,
  foOutageProcessAssets,
  companies,
  personnel,
  projects,
  assets,
  users,
  insertFoOutageProcessSchema,
  updateFoOutageProcessSchema,
  type InsertFoOutageProcess,
  type UpdateFoOutageProcess
} from '../shared/schema.js';
import { 
  authenticateJWT, 
  type AuthRequest 
} from './hierarchical-auth.js';

const router = Router();

// Apply authentication to all routes
router.use(authenticateJWT);

/**
 * @swagger
 * /api/secure/outage-processes:
 *   get:
 *     summary: Kesinti İşlemlerini Listele
 *     description: Tüm kesinti işlemlerini listeler (firma, proje, personel bilgileri ile birlikte)
 *     tags: [Kesinti İşlemleri]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Kesinti nedeni, bina adı veya kodu ile arama
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [planned, ongoing, completed, cancelled]
 *         description: Durum filtresi
 *       - in: query
 *         name: firmId
 *         schema:
 *           type: integer
 *         description: Firma ID'ye göre filtre
 *       - in: query
 *         name: processorFirmId
 *         schema:
 *           type: integer
 *         description: İşlemci firma ID'ye göre filtre
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: integer
 *         description: Proje ID'ye göre filtre
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Sadece aktif kayıtlar
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Sayfa başına kayıt sayısı
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Sayfalama offset
 *     responses:
 *       200:
 *         description: Kesinti işlemleri başarıyla getirildi
 *       401:
 *         description: Yetkisiz erişim
 */
router.get('/outage-processes', async (req: AuthRequest, res) => {
  try {
    const { search, status, firmId, processorFirmId, projectId, active, limit = '50', offset = '0' } = req.query;
    
    // Base query with joins
    let query = db
      .select({
        id: foOutageProcess.id,
        firmId: foOutageProcess.firmId,
        processorFirmId: foOutageProcess.processorFirmId,
        causeOfOutage: foOutageProcess.causeOfOutage,
        rootBuildName: foOutageProcess.rootBuildName,
        rootBuildCode: foOutageProcess.rootBuildCode,
        outputStartPoint: foOutageProcess.outputStartPoint,
        startDate: foOutageProcess.startDate,
        endDate: foOutageProcess.endDate,
        startClock: foOutageProcess.startClock,
        endClock: foOutageProcess.endClock,
        areaOfOutage: foOutageProcess.areaOfOutage,
        supervisorId: foOutageProcess.supervisorId,
        processorSupervisor: foOutageProcess.processorSupervisor,
        workerChefId: foOutageProcess.workerChefId,
        projectId: foOutageProcess.projectId,
        pyp: foOutageProcess.pyp,
        status: foOutageProcess.status,
        isActive: foOutageProcess.isActive,
        createdAt: foOutageProcess.createdAt,
        updatedAt: foOutageProcess.updatedAt,
        // Join data
        firmName: sql`firm.name`.as('firmName'),
        processorFirmName: sql`processor_firm.name`.as('processorFirmName'),
        supervisorName: sql`CONCAT(supervisor.name, ' ', supervisor.surname)`.as('supervisorName'),
        workerChefName: sql`CONCAT(worker_chef.name, ' ', worker_chef.surname)`.as('workerChefName'),
        projectCode: projects.code,
        createdByEmail: sql`creator.email`.as('createdByEmail'),
        updatedByEmail: sql`updater.email`.as('updatedByEmail')
      })
      .from(foOutageProcess)
      .leftJoin(sql`companies firm`, eq(foOutageProcess.firmId, sql`firm.id`))
      .leftJoin(sql`companies processor_firm`, eq(foOutageProcess.processorFirmId, sql`processor_firm.id`))
      .leftJoin(sql`personnel supervisor`, eq(foOutageProcess.supervisorId, sql`supervisor.id`))
      .leftJoin(sql`personnel worker_chef`, eq(foOutageProcess.workerChefId, sql`worker_chef.id`))
      .leftJoin(projects, eq(foOutageProcess.projectId, projects.id))
      .leftJoin(sql`users creator`, eq(foOutageProcess.createdBy, sql`creator.id`))
      .leftJoin(sql`users updater`, eq(foOutageProcess.updatedBy, sql`updater.id`));

    // Filters
    const whereConditions = [];
    
    if (search) {
      whereConditions.push(
        or(
          ilike(foOutageProcess.causeOfOutage, `%${search}%`),
          ilike(foOutageProcess.rootBuildName, `%${search}%`),
          ilike(foOutageProcess.rootBuildCode, `%${search}%`)
        )
      );
    }
    
    if (status) {
      whereConditions.push(eq(foOutageProcess.status, status as string));
    }
    
    if (firmId) {
      whereConditions.push(eq(foOutageProcess.firmId, parseInt(firmId as string)));
    }
    
    if (processorFirmId) {
      whereConditions.push(eq(foOutageProcess.processorFirmId, parseInt(processorFirmId as string)));
    }
    
    if (projectId) {
      whereConditions.push(eq(foOutageProcess.projectId, parseInt(projectId as string)));
    }
    
    if (active === 'true') {
      whereConditions.push(eq(foOutageProcess.isActive, true));
    } else if (active === 'false') {
      whereConditions.push(eq(foOutageProcess.isActive, false));
    }

    if (whereConditions.length > 0) {
      query = query.where(and(...whereConditions)) as any;
    }

    // Execute query with ordering, limit and offset
    const outageProcessList = await query
      .orderBy(desc(foOutageProcess.createdAt))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));
    
    res.json({
      success: true,
      message: 'Kesinti işlemleri başarıyla getirildi.',
      data: {
        outageProcesses: outageProcessList,
        totalCount: outageProcessList.length,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    });
  } catch (error) {
    console.error('Kesinti işlemleri listesi getirme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'OUTAGE_PROCESSES_FETCH_ERROR',
      message: 'Kesinti işlemleri getirilirken hata oluştu.'
    });
  }
});

/**
 * @swagger
 * /api/secure/outage-processes/{id}:
 *   get:
 *     summary: Kesinti İşlemi Detayı
 *     description: Belirli bir kesinti işleminin detaylı bilgilerini getirir (personeller ve araçlar dahil)
 *     tags: [Kesinti İşlemleri]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Kesinti işlem ID
 *     responses:
 *       200:
 *         description: Kesinti işlemi detayı başarıyla getirildi
 *       404:
 *         description: Kesinti işlemi bulunamadı
 */
router.get('/outage-processes/:id', async (req: AuthRequest, res) => {
  try {
    const processId = parseInt(req.params.id);
    
    // Get main record
    const [processDetail] = await db
      .select({
        id: foOutageProcess.id,
        firmId: foOutageProcess.firmId,
        processorFirmId: foOutageProcess.processorFirmId,
        causeOfOutage: foOutageProcess.causeOfOutage,
        rootBuildName: foOutageProcess.rootBuildName,
        rootBuildCode: foOutageProcess.rootBuildCode,
        outputStartPoint: foOutageProcess.outputStartPoint,
        startDate: foOutageProcess.startDate,
        endDate: foOutageProcess.endDate,
        startClock: foOutageProcess.startClock,
        endClock: foOutageProcess.endClock,
        areaOfOutage: foOutageProcess.areaOfOutage,
        supervisorId: foOutageProcess.supervisorId,
        processorSupervisor: foOutageProcess.processorSupervisor,
        workerChefId: foOutageProcess.workerChefId,
        projectId: foOutageProcess.projectId,
        pyp: foOutageProcess.pyp,
        status: foOutageProcess.status,
        isActive: foOutageProcess.isActive,
        createdAt: foOutageProcess.createdAt,
        updatedAt: foOutageProcess.updatedAt,
        createdBy: foOutageProcess.createdBy,
        updatedBy: foOutageProcess.updatedBy,
        // Join data
        firmName: sql`firm.name`.as('firmName'),
        processorFirmName: sql`processor_firm.name`.as('processorFirmName'),
        supervisorName: sql`CONCAT(supervisor.name, ' ', supervisor.surname)`.as('supervisorName'),
        workerChefName: sql`CONCAT(worker_chef.name, ' ', worker_chef.surname)`.as('workerChefName'),
        projectCode: projects.code,
        createdByEmail: sql`creator.email`.as('createdByEmail'),
        updatedByEmail: sql`updater.email`.as('updatedByEmail')
      })
      .from(foOutageProcess)
      .leftJoin(sql`companies firm`, eq(foOutageProcess.firmId, sql`firm.id`))
      .leftJoin(sql`companies processor_firm`, eq(foOutageProcess.processorFirmId, sql`processor_firm.id`))
      .leftJoin(sql`personnel supervisor`, eq(foOutageProcess.supervisorId, sql`supervisor.id`))
      .leftJoin(sql`personnel worker_chef`, eq(foOutageProcess.workerChefId, sql`worker_chef.id`))
      .leftJoin(projects, eq(foOutageProcess.projectId, projects.id))
      .leftJoin(sql`users creator`, eq(foOutageProcess.createdBy, sql`creator.id`))
      .leftJoin(sql`users updater`, eq(foOutageProcess.updatedBy, sql`updater.id`))
      .where(eq(foOutageProcess.id, processId));

    if (!processDetail) {
      return res.status(404).json({
        success: false,
        error: 'OUTAGE_PROCESS_NOT_FOUND',
        message: 'Kesinti işlemi bulunamadı.'
      });
    }
    
    // Get assigned personnels
    const assignedPersonnels = await db
      .select({
        id: personnel.id,
        name: personnel.name,
        surname: personnel.surname,
        tcNo: personnel.tcNo,
      })
      .from(foOutageProcessPersonnels)
      .innerJoin(personnel, eq(foOutageProcessPersonnels.personnelId, personnel.id))
      .where(eq(foOutageProcessPersonnels.outageProcessId, processId));
    
    // Get assigned assets
    const assignedAssets = await db
      .select({
        id: assets.id,
        plateNumber: assets.plateNumber,
        modelYear: assets.modelYear,
      })
      .from(foOutageProcessAssets)
      .innerJoin(assets, eq(foOutageProcessAssets.assetId, assets.id))
      .where(eq(foOutageProcessAssets.outageProcessId, processId));
    
    res.json({
      success: true,
      message: 'Kesinti işlemi detayı başarıyla getirildi.',
      data: {
        process: processDetail,
        personnels: assignedPersonnels,
        assets: assignedAssets
      }
    });
  } catch (error) {
    console.error('Kesinti işlemi detayı getirme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'OUTAGE_PROCESS_DETAIL_ERROR',
      message: 'Kesinti işlemi detayı getirilirken hata oluştu.'
    });
  }
});

/**
 * @swagger
 * /api/secure/outage-processes:
 *   post:
 *     summary: Yeni Kesinti İşlemi Oluşturma
 *     description: Yeni bir kesinti işlemi kaydı oluşturur
 *     tags: [Kesinti İşlemleri]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firmId
 *               - processorFirmId
 *               - startDate
 *             properties:
 *               firmId:
 *                 type: integer
 *                 description: Kesinti yapan firma ID
 *               processorFirmId:
 *                 type: integer
 *                 description: İşlemi yapan firma ID
 *               causeOfOutage:
 *                 type: string
 *                 description: Kesinti nedeni
 *               rootBuildName:
 *                 type: string
 *                 description: Kök bina adı
 *               rootBuildCode:
 *                 type: string
 *                 description: Kök bina kodu
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: Başlangıç tarihi (YYYY-MM-DD)
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: Bitiş tarihi
 *               startClock:
 *                 type: string
 *                 description: Başlangıç saati (HH:MM:SS)
 *               endClock:
 *                 type: string
 *                 description: Bitiş saati (HH:MM:SS)
 *               supervisorId:
 *                 type: integer
 *                 description: Denetçi personel ID
 *               workerChefId:
 *                 type: integer
 *                 description: İşçi şefi personel ID
 *               projectId:
 *                 type: integer
 *                 description: Proje ID
 *               status:
 *                 type: string
 *                 enum: [planned, ongoing, completed, cancelled]
 *                 default: planned
 *               personnelIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Atanacak personel ID'leri (opsiyonel)
 *               assetIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Atanacak araç ID'leri (opsiyonel)
 *     responses:
 *       201:
 *         description: Kesinti işlemi başarıyla oluşturuldu
 *       400:
 *         description: Geçersiz veri
 */
router.post('/outage-processes', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const { personnelIds, assetIds, ...processData } = req.body;
    
    // Validation
    const validationResult = insertFoOutageProcessSchema.safeParse(processData);
    
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Geçersiz veri formatı.',
        details: validationResult.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    
    const validatedData = validationResult.data;
    
    // Foreign key validations
    const firmExists = await db
      .select({ id: companies.id })
      .from(companies)
      .where(eq(companies.id, validatedData.firmId));
      
    if (firmExists.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_FIRM_ID',
        message: `Belirtilen firma ID'si (${validatedData.firmId}) bulunamadı.`
      });
    }
    
    const processorFirmExists = await db
      .select({ id: companies.id })
      .from(companies)
      .where(eq(companies.id, validatedData.processorFirmId));
      
    if (processorFirmExists.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_PROCESSOR_FIRM_ID',
        message: `Belirtilen işlemci firma ID'si (${validatedData.processorFirmId}) bulunamadı.`
      });
    }
    
    // Create new outage process
    const [newProcess] = await db
      .insert(foOutageProcess)
      .values({
        ...validatedData,
        createdBy: req.userContext?.userId,
        updatedBy: req.userContext?.userId,
      })
      .returning();
    
    // Add personnels if provided
    if (personnelIds && Array.isArray(personnelIds) && personnelIds.length > 0) {
      const personnelValues = personnelIds.map((personnelId: number) => ({
        outageProcessId: newProcess.id,
        personnelId: personnelId
      }));
      
      await db.insert(foOutageProcessPersonnels).values(personnelValues);
    }
    
    // Add assets if provided
    if (assetIds && Array.isArray(assetIds) && assetIds.length > 0) {
      const assetValues = assetIds.map((assetId: number) => ({
        outageProcessId: newProcess.id,
        assetId: assetId
      }));
      
      await db.insert(foOutageProcessAssets).values(assetValues);
    }
    
    // Get the created process with details
    const [processDetail] = await db
      .select({
        id: foOutageProcess.id,
        firmId: foOutageProcess.firmId,
        processorFirmId: foOutageProcess.processorFirmId,
        causeOfOutage: foOutageProcess.causeOfOutage,
        rootBuildName: foOutageProcess.rootBuildName,
        startDate: foOutageProcess.startDate,
        endDate: foOutageProcess.endDate,
        status: foOutageProcess.status,
        createdAt: foOutageProcess.createdAt,
        firmName: sql`firm.name`.as('firmName'),
        processorFirmName: sql`processor_firm.name`.as('processorFirmName'),
      })
      .from(foOutageProcess)
      .leftJoin(sql`companies firm`, eq(foOutageProcess.firmId, sql`firm.id`))
      .leftJoin(sql`companies processor_firm`, eq(foOutageProcess.processorFirmId, sql`processor_firm.id`))
      .where(eq(foOutageProcess.id, newProcess.id));
      
    res.status(201).json({
      success: true,
      message: 'Kesinti işlemi başarıyla oluşturuldu.',
      data: {
        process: processDetail
      }
    });
    
  } catch (error) {
    console.error('Kesinti işlemi oluşturma hatası:', error);
    res.status(500).json({
      success: false,
      error: 'OUTAGE_PROCESS_CREATE_ERROR',
      message: 'Kesinti işlemi oluşturulurken hata oluştu.',
      debug: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * @swagger
 * /api/secure/outage-processes/{id}:
 *   put:
 *     summary: Kesinti İşlemi Güncelleme
 *     description: Mevcut bir kesinti işlemini günceller
 *     tags: [Kesinti İşlemleri]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Kesinti işlem ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [planned, ongoing, completed, cancelled]
 *               endDate:
 *                 type: string
 *                 format: date
 *               endClock:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Kesinti işlemi başarıyla güncellendi
 *       404:
 *         description: Kesinti işlemi bulunamadı
 */
router.put('/outage-processes/:id', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const processId = parseInt(req.params.id);
    
    // Check if exists
    const existingProcess = await db
      .select({ id: foOutageProcess.id })
      .from(foOutageProcess)
      .where(eq(foOutageProcess.id, processId));
      
    if (existingProcess.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'OUTAGE_PROCESS_NOT_FOUND',
        message: 'Güncellenecek kesinti işlemi bulunamadı.'
      });
    }
    
    // Update process
    const [updatedProcess] = await db
      .update(foOutageProcess)
      .set({
        ...req.body,
        updatedBy: req.userContext?.userId,
        updatedAt: new Date(),
      })
      .where(eq(foOutageProcess.id, processId))
      .returning();
    
    res.json({
      success: true,
      message: 'Kesinti işlemi başarıyla güncellendi.',
      data: {
        process: updatedProcess
      }
    });
    
  } catch (error) {
    console.error('Kesinti işlemi güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'OUTAGE_PROCESS_UPDATE_ERROR',
      message: 'Kesinti işlemi güncellenirken hata oluştu.'
    });
  }
});

/**
 * @swagger
 * /api/secure/outage-processes/{id}/personnels:
 *   post:
 *     summary: Kesinti İşlemine Personel Ekle
 *     description: Bir kesinti işlemine personel atar
 *     tags: [Kesinti İşlemleri]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Kesinti işlem ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - personnelId
 *             properties:
 *               personnelId:
 *                 type: integer
 *                 description: Eklenecek personel ID
 *     responses:
 *       201:
 *         description: Personel başarıyla eklendi
 *       400:
 *         description: Personel zaten ekli
 *       404:
 *         description: Kesinti işlemi veya personel bulunamadı
 */
router.post('/outage-processes/:id/personnels', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const processId = parseInt(req.params.id);
    const { personnelId } = req.body;
    
    if (!personnelId) {
      return res.status(400).json({
        success: false,
        error: 'PERSONNEL_ID_REQUIRED',
        message: 'Personel ID gereklidir.'
      });
    }
    
    // Check if process exists
    const processExists = await db
      .select({ id: foOutageProcess.id })
      .from(foOutageProcess)
      .where(eq(foOutageProcess.id, processId));
      
    if (processExists.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'OUTAGE_PROCESS_NOT_FOUND',
        message: 'Kesinti işlemi bulunamadı.'
      });
    }
    
    // Check if personnel exists
    const personnelExists = await db
      .select({ id: personnel.id })
      .from(personnel)
      .where(eq(personnel.id, personnelId));
      
    if (personnelExists.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'PERSONNEL_NOT_FOUND',
        message: 'Personel bulunamadı.'
      });
    }
    
    // Add personnel
    await db
      .insert(foOutageProcessPersonnels)
      .values({
        outageProcessId: processId,
        personnelId: personnelId
      });
    
    res.status(201).json({
      success: true,
      message: 'Personel başarıyla eklendi.'
    });
    
  } catch (error: any) {
    if (error?.code === '23505') { // Unique violation
      return res.status(400).json({
        success: false,
        error: 'PERSONNEL_ALREADY_ASSIGNED',
        message: 'Bu personel zaten bu kesinti işlemine atanmış.'
      });
    }
    
    console.error('Personel ekleme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'PERSONNEL_ADD_ERROR',
      message: 'Personel eklenirken hata oluştu.'
    });
  }
});

/**
 * @swagger
 * /api/secure/outage-processes/{id}/personnels/{personnelId}:
 *   delete:
 *     summary: Kesinti İşleminden Personel Çıkar
 *     description: Bir kesinti işleminden personel atamasını kaldırır
 *     tags: [Kesinti İşlemleri]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Kesinti işlem ID
 *       - in: path
 *         name: personnelId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Çıkarılacak personel ID
 *     responses:
 *       200:
 *         description: Personel başarıyla çıkarıldı
 *       404:
 *         description: Atama bulunamadı
 */
router.delete('/outage-processes/:id/personnels/:personnelId', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const processId = parseInt(req.params.id);
    const personnelId = parseInt(req.params.personnelId);
    
    const deleted = await db
      .delete(foOutageProcessPersonnels)
      .where(
        and(
          eq(foOutageProcessPersonnels.outageProcessId, processId),
          eq(foOutageProcessPersonnels.personnelId, personnelId)
        )
      )
      .returning();
    
    if (deleted.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'ASSIGNMENT_NOT_FOUND',
        message: 'Personel ataması bulunamadı.'
      });
    }
    
    res.json({
      success: true,
      message: 'Personel başarıyla çıkarıldı.'
    });
    
  } catch (error) {
    console.error('Personel çıkarma hatası:', error);
    res.status(500).json({
      success: false,
      error: 'PERSONNEL_REMOVE_ERROR',
      message: 'Personel çıkarılırken hata oluştu.'
    });
  }
});

/**
 * @swagger
 * /api/secure/outage-processes/{id}/assets:
 *   post:
 *     summary: Kesinti İşlemine Araç Ekle
 *     description: Bir kesinti işlemine araç/makine atar
 *     tags: [Kesinti İşlemleri]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Kesinti işlem ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - assetId
 *             properties:
 *               assetId:
 *                 type: integer
 *                 description: Eklenecek araç ID
 *     responses:
 *       201:
 *         description: Araç başarıyla eklendi
 *       400:
 *         description: Araç zaten ekli
 *       404:
 *         description: Kesinti işlemi veya araç bulunamadı
 */
router.post('/outage-processes/:id/assets', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const processId = parseInt(req.params.id);
    const { assetId } = req.body;
    
    if (!assetId) {
      return res.status(400).json({
        success: false,
        error: 'ASSET_ID_REQUIRED',
        message: 'Araç ID gereklidir.'
      });
    }
    
    // Check if process exists
    const processExists = await db
      .select({ id: foOutageProcess.id })
      .from(foOutageProcess)
      .where(eq(foOutageProcess.id, processId));
      
    if (processExists.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'OUTAGE_PROCESS_NOT_FOUND',
        message: 'Kesinti işlemi bulunamadı.'
      });
    }
    
    // Check if asset exists
    const assetExists = await db
      .select({ id: assets.id })
      .from(assets)
      .where(eq(assets.id, assetId));
      
    if (assetExists.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'ASSET_NOT_FOUND',
        message: 'Araç bulunamadı.'
      });
    }
    
    // Add asset
    await db
      .insert(foOutageProcessAssets)
      .values({
        outageProcessId: processId,
        assetId: assetId
      });
    
    res.status(201).json({
      success: true,
      message: 'Araç başarıyla eklendi.'
    });
    
  } catch (error: any) {
    if (error?.code === '23505') { // Unique violation
      return res.status(400).json({
        success: false,
        error: 'ASSET_ALREADY_ASSIGNED',
        message: 'Bu araç zaten bu kesinti işlemine atanmış.'
      });
    }
    
    console.error('Araç ekleme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'ASSET_ADD_ERROR',
      message: 'Araç eklenirken hata oluştu.'
    });
  }
});

/**
 * @swagger
 * /api/secure/outage-processes/{id}/assets/{assetId}:
 *   delete:
 *     summary: Kesinti İşleminden Araç Çıkar
 *     description: Bir kesinti işleminden araç atamasını kaldırır
 *     tags: [Kesinti İşlemleri]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Kesinti işlem ID
 *       - in: path
 *         name: assetId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Çıkarılacak araç ID
 *     responses:
 *       200:
 *         description: Araç başarıyla çıkarıldı
 *       404:
 *         description: Atama bulunamadı
 */
router.delete('/outage-processes/:id/assets/:assetId', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const processId = parseInt(req.params.id);
    const assetId = parseInt(req.params.assetId);
    
    const deleted = await db
      .delete(foOutageProcessAssets)
      .where(
        and(
          eq(foOutageProcessAssets.outageProcessId, processId),
          eq(foOutageProcessAssets.assetId, assetId)
        )
      )
      .returning();
    
    if (deleted.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'ASSIGNMENT_NOT_FOUND',
        message: 'Araç ataması bulunamadı.'
      });
    }
    
    res.json({
      success: true,
      message: 'Araç başarıyla çıkarıldı.'
    });
    
  } catch (error) {
    console.error('Araç çıkarma hatası:', error);
    res.status(500).json({
      success: false,
      error: 'ASSET_REMOVE_ERROR',
      message: 'Araç çıkarılırken hata oluştu.'
    });
  }
});

export default router;
