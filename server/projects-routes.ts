import { Router } from 'express';
import { db } from './db.js';
import { eq, and, ilike, desc, asc, or, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';
import { 
  projects, companies, workAreas, cities, users,
  createInsertSchema, type InsertProject
} from '../shared/schema.js';
import { 
  authenticateJWT, 
  filterByWorkArea,
  type AuthRequest 
} from './hierarchical-auth.js';
import { 
  auditableInsert,
  auditableUpdate,
  auditableDelete
} from './audit-middleware.js';

const router = Router();

// Apply hierarchical authentication and work area filtering to all routes
router.use(authenticateJWT);
router.use(filterByWorkArea);

// Project validation schemas
const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true,
});

const projectCreateSchema = insertProjectSchema.extend({
  code: z.string().min(1).max(50),
  poCompanyId: z.number().int().positive(),
  ppCompanyId: z.number().int().positive(),
  startDate: z.string(),
  status: z.enum(['planned', 'active', 'completed', 'cancelled']).default('planned'),
  isActive: z.boolean().default(true),
});

/**
 * @swagger
 * /api/secure/projects:
 *   get:
 *     summary: Proje Listesi
 *     description: Tüm projeleri listeler (şirket, çalışma alanı bilgileri ile birlikte)
 *     tags: [Proje İşlemleri]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Proje kodu veya açıklamada arama yapmak için
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [planned, active, completed, cancelled]
 *         description: Proje durumuna göre filtreleme
 *       - in: query
 *         name: poCompanyId
 *         schema:
 *           type: integer
 *         description: PO şirketine göre filtreleme
 *       - in: query
 *         name: ppCompanyId
 *         schema:
 *           type: integer
 *         description: PP şirketine göre filtreleme
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Sadece aktif projeleri getirmek için
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Sayfa başına kayıt sayısı
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Sayfalama için offset değeri
 *     responses:
 *       200:
 *         description: Projeler başarıyla getirildi
 *       401:
 *         description: Geçersiz API anahtarı
 */
router.get('/projects', async (req: AuthRequest, res) => {
  try {
    const { search, status, poCompanyId, ppCompanyId, active, limit = '50', offset = '0' } = req.query;
    
    // Base query with joins
    let query = db
      .select({
        id: projects.id,
        code: projects.code,
        poCompanyId: projects.poCompanyId,
        ppCompanyId: projects.ppCompanyId,
        workAreaId: projects.workAreaId,
        startDate: projects.startDate,
        endDate: projects.endDate,
        status: projects.status,
        cityId: projects.cityId,
        projectTotalPrice: projects.projectTotalPrice,
        completeRate: projects.completetRate,
        isActive: projects.isActive,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        // Join data
        poCompanyName: sql`po_company.name`.as('poCompanyName'),
        ppCompanyName: sql`pp_company.name`.as('ppCompanyName'),
        workAreaName: workAreas.name,
        cityName: cities.name,
        createdByEmail: sql`creator.email`.as('createdByEmail'),
        updatedByEmail: sql`updater.email`.as('updatedByEmail')
      })
      .from(projects)
      .leftJoin(sql`companies po_company`, eq(projects.poCompanyId, sql`po_company.id`))
      .leftJoin(sql`companies pp_company`, eq(projects.ppCompanyId, sql`pp_company.id`))
      .leftJoin(workAreas, eq(projects.workAreaId, workAreas.id))
      .leftJoin(cities, eq(projects.cityId, cities.id))
      .leftJoin(sql`users creator`, eq(projects.createdBy, sql`creator.id`))
      .leftJoin(sql`users updater`, eq(projects.updatedBy, sql`updater.id`));

    // Filters
    const whereConditions = [];
    
    // Work area filtering based on user's permissions
    if (req.workAreaFilter && req.workAreaFilter.length > 0) {
      whereConditions.push(inArray(projects.workAreaId, req.workAreaFilter));
    }
    
    if (search) {
      whereConditions.push(
        or(
          ilike(projects.code, `%${search}%`)
        )
      );
    }
    
    if (status) {
      whereConditions.push(eq(projects.status, status));
    }
    
    if (poCompanyId) {
      whereConditions.push(eq(projects.poCompanyId, parseInt(poCompanyId as string)));
    }
    
    if (ppCompanyId) {
      whereConditions.push(eq(projects.ppCompanyId, parseInt(ppCompanyId as string)));
    }
    
    if (active === 'true') {
      whereConditions.push(eq(projects.isActive, true));
    } else if (active === 'false') {
      whereConditions.push(eq(projects.isActive, false));
    }

    if (whereConditions.length > 0) {
      query = query.where(and(...whereConditions));
    }

    // Execute query with ordering, limit and offset
    const projectsList = await query
      .orderBy(desc(projects.createdAt))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));
    
    res.json({
      success: true,
      message: 'Projeler başarıyla getirildi.',
      data: {
        projects: projectsList,
        totalCount: projectsList.length,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    });
  } catch (error) {
    console.error('Proje listesi getirme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'PROJECTS_FETCH_ERROR',
      message: 'Projeler getirilirken hata oluştu.'
    });
  }
});

/**
 * @swagger
 * /api/secure/projects/{id}:
 *   get:
 *     summary: Proje Detayı
 *     description: Belirli bir projenin detaylı bilgilerini getirir
 *     tags: [Proje İşlemleri]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Proje ID
 *     responses:
 *       200:
 *         description: Proje detayı başarıyla getirildi
 *       404:
 *         description: Proje bulunamadı
 */
router.get('/projects/:id', async (req: AuthRequest, res) => {
  try {
    const projectId = parseInt(req.params.id);
    
    const [projectDetail] = await db
      .select({
        id: projects.id,
        code: projects.code,
        poCompanyId: projects.poCompanyId,
        ppCompanyId: projects.ppCompanyId,
        workAreaId: projects.workAreaId,
        startDate: projects.startDate,
        endDate: projects.endDate,
        status: projects.status,
        cityId: projects.cityId,
        projectTotalPrice: projects.projectTotalPrice,
        completeRate: projects.completetRate,
        isActive: projects.isActive,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        createdBy: projects.createdBy,
        updatedBy: projects.updatedBy,
        // Join data
        poCompanyName: sql`po_company.name`.as('poCompanyName'),
        ppCompanyName: sql`pp_company.name`.as('ppCompanyName'),
        workAreaName: workAreas.name,
        cityName: cities.name,
        createdByEmail: sql`creator.email`.as('createdByEmail'),
        updatedByEmail: sql`updater.email`.as('updatedByEmail')
      })
      .from(projects)
      .leftJoin(sql`companies po_company`, eq(projects.poCompanyId, sql`po_company.id`))
      .leftJoin(sql`companies pp_company`, eq(projects.ppCompanyId, sql`pp_company.id`))
      .leftJoin(workAreas, eq(projects.workAreaId, workAreas.id))
      .leftJoin(cities, eq(projects.cityId, cities.id))
      .leftJoin(sql`users creator`, eq(projects.createdBy, sql`creator.id`))
      .leftJoin(sql`users updater`, eq(projects.updatedBy, sql`updater.id`))
      .where(eq(projects.id, projectId));

    if (!projectDetail) {
      return res.status(404).json({
        success: false,
        error: 'PROJECT_NOT_FOUND',
        message: 'Proje bulunamadı.'
      });
    }
    
    res.json({
      success: true,
      message: 'Proje detayı başarıyla getirildi.',
      data: {
        project: projectDetail
      }
    });
  } catch (error) {
    console.error('Proje detayı getirme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'PROJECT_DETAIL_ERROR',
      message: 'Proje detayı getirilirken hata oluştu.'
    });
  }
});

/**
 * @swagger
 * /api/secure/projects:
 *   post:
 *     summary: Yeni Proje Oluşturma
 *     description: Yeni bir proje kaydı oluşturur
 *     tags: [Proje İşlemleri]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - poCompanyId
 *               - ppCompanyId
 *               - startDate
 *             properties:
 *               code:
 *                 type: string
 *                 maxLength: 50
 *                 description: Proje kodu (benzersiz olmalı)
 *               poCompanyId:
 *                 type: integer
 *                 description: PO şirket ID
 *               ppCompanyId:
 *                 type: integer
 *                 description: PP şirket ID
 *               workAreaId:
 *                 type: integer
 *                 description: Çalışma alanı ID
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: Proje başlangıç tarihi
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: Proje bitiş tarihi
 *               status:
 *                 type: string
 *                 enum: [planned, active, completed, cancelled]
 *                 default: planned
 *                 description: Proje durumu
 *               cityId:
 *                 type: integer
 *                 description: Şehir ID
 *               projectTotalPrice:
 *                 type: number
 *                 description: Proje toplam tutarı
 *               completeRate:
 *                 type: number
 *                 description: Tamamlanma oranı (0-100)
 *               isActive:
 *                 type: boolean
 *                 default: true
 *                 description: Proje aktif mi?
 *     responses:
 *       201:
 *         description: Proje başarıyla oluşturuldu
 *       400:
 *         description: Geçersiz veri
 *       409:
 *         description: Proje kodu zaten kayıtlı
 */
router.post('/projects', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    // Request body validation
    const validationResult = projectCreateSchema.safeParse(req.body);
    
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
    
    const projectData = validationResult.data;
    
    // Check if project code already exists
    const existingProject = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.code, projectData.code));
      
    if (existingProject.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'DUPLICATE_PROJECT_CODE',
        message: 'Bu proje kodu zaten kayıtlı.'
      });
    }
    
    // Foreign key validation - check if PO company exists
    const poCompanyExists = await db
      .select({ id: companies.id })
      .from(companies)
      .where(eq(companies.id, projectData.poCompanyId));
      
    if (poCompanyExists.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_PO_COMPANY_ID',
        message: `Belirtilen PO şirket ID'si (${projectData.poCompanyId}) bulunamadı.`
      });
    }
    
    // Foreign key validation - check if PP company exists
    const ppCompanyExists = await db
      .select({ id: companies.id })
      .from(companies)
      .where(eq(companies.id, projectData.ppCompanyId));
      
    if (ppCompanyExists.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_PP_COMPANY_ID',
        message: `Belirtilen PP şirket ID'si (${projectData.ppCompanyId}) bulunamadı.`
      });
    }
    
    // Foreign key validation - check if work area exists (if provided)  
    if (projectData.workAreaId) {
      const workAreaExists = await db
        .select({ id: workAreas.id })
        .from(workAreas)
        .where(eq(workAreas.id, projectData.workAreaId));
        
      if (workAreaExists.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_WORK_AREA_ID',
          message: `Belirtilen çalışma alanı ID'si (${projectData.workAreaId}) bulunamadı.`
        });
      }
    }
    
    // Foreign key validation - check if city exists (if provided)  
    if (projectData.cityId) {
      const cityExists = await db
        .select({ id: cities.id })
        .from(cities)
        .where(eq(cities.id, projectData.cityId));
        
      if (cityExists.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_CITY_ID',
          message: `Belirtilen şehir ID'si (${projectData.cityId}) bulunamadı.`
        });
      }
    }
    
    // Create new project with user tracking
    const [newProject] = await auditableInsert(
      db,
      projects,
      {
        ...projectData,
        createdBy: req.user?.id,
        updatedBy: req.user?.id,
      },
      req.user?.id,
      'projects',
      'CREATE'
    );
    
    // Get the created project with joined details
    const [projectDetail] = await db
      .select({
        id: projects.id,
        code: projects.code,
        poCompanyId: projects.poCompanyId,
        ppCompanyId: projects.ppCompanyId,
        workAreaId: projects.workAreaId,
        startDate: projects.startDate,
        endDate: projects.endDate,
        status: projects.status,
        cityId: projects.cityId,
        projectTotalPrice: projects.projectTotalPrice,
        completeRate: projects.completetRate,
        isActive: projects.isActive,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        // Join data
        poCompanyName: sql`po_company.name`.as('poCompanyName'),
        ppCompanyName: sql`pp_company.name`.as('ppCompanyName'),
        workAreaName: workAreas.name,
        cityName: cities.name
      })
      .from(projects)
      .leftJoin(sql`companies po_company`, eq(projects.poCompanyId, sql`po_company.id`))
      .leftJoin(sql`companies pp_company`, eq(projects.ppCompanyId, sql`pp_company.id`))
      .leftJoin(workAreas, eq(projects.workAreaId, workAreas.id))
      .leftJoin(cities, eq(projects.cityId, cities.id))
      .where(eq(projects.id, newProject.id));
      
    res.status(201).json({
      success: true,
      message: 'Proje başarıyla oluşturuldu.',
      data: {
        project: projectDetail
      }
    });
    
  } catch (error) {
    console.error('Proje oluşturma hatası:', error);
    res.status(500).json({
      success: false,
      error: 'PROJECT_CREATE_ERROR',
      message: 'Proje oluşturulurken hata oluştu.',
      debug: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * @swagger
 * /api/secure/projects/{id}:
 *   put:
 *     summary: Proje Güncelleme
 *     description: Mevcut bir projeyi günceller
 *     tags: [Proje İşlemleri]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Proje ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [planned, active, completed, cancelled]
 *               endDate:
 *                 type: string
 *                 format: date
 *               projectTotalPrice:
 *                 type: number
 *               completeRate:
 *                 type: number
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Proje başarıyla güncellendi
 *       404:
 *         description: Proje bulunamadı
 */
router.put('/projects/:id', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const projectId = parseInt(req.params.id);
    
    // Check if project exists
    const existingProject = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.id, projectId));
      
    if (existingProject.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'PROJECT_NOT_FOUND',
        message: 'Güncellenecek proje bulunamadı.'
      });
    }
    
    // Update project
    const [updatedProject] = await auditableUpdate(
      db,
      projects,
      eq(projects.id, projectId),
      {
        ...req.body,
        updatedBy: req.user?.id,
        updatedAt: new Date(),
      },
      req.user?.id,
      'projects',
      'UPDATE',
      { projectId }
    );
    
    res.json({
      success: true,
      message: 'Proje başarıyla güncellendi.',
      data: {
        project: updatedProject
      }
    });
    
  } catch (error) {
    console.error('Proje güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'PROJECT_UPDATE_ERROR',
      message: 'Proje güncellenirken hata oluştu.'
    });
  }
});

export default router;