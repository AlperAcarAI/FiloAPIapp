import { Router } from 'express';
import { db } from './db.js';
import { eq, and, desc, or, ilike } from 'drizzle-orm';
import {
  projectPyps,
  projects,
  users,
  insertProjectPypSchema,
  updateProjectPypSchema,
  type InsertProjectPyp,
  type UpdateProjectPyp
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
 * /api/secure/project-pyps:
 *   get:
 *     summary: PYP Kayıtlarını Listele
 *     description: Tüm PYP kayıtlarını listeler
 *     tags: [PYP Yönetimi]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: PYP kodu veya adı ile arama
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: integer
 *         description: Proje ID'ye göre filtre
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [planned, ongoing, completed, cancelled]
 *         description: Durum filtresi
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Sadece aktif kayıtlar (varsayılan: true)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Sayfa başına kayıt sayısı
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Sayfalama offset
 *     responses:
 *       200:
 *         description: PYP kayıtları başarıyla getirildi
 *       401:
 *         description: Yetkisiz erişim
 */
router.get('/project-pyps', async (req: AuthRequest, res) => {
  try {
    const { search, projectId, status, active = 'true', limit = '50', offset = '0' } = req.query;

    let query = db
      .select({
        id: projectPyps.id,
        projectId: projectPyps.projectId,
        code: projectPyps.code,
        name: projectPyps.name,
        address: projectPyps.address,
        status: projectPyps.status,
        isActive: projectPyps.isActive,
        createdAt: projectPyps.createdAt,
        updatedAt: projectPyps.updatedAt,
        projectCode: projects.code,
      })
      .from(projectPyps)
      .leftJoin(projects, eq(projectPyps.projectId, projects.id));

    const whereConditions = [];

    if (search) {
      whereConditions.push(
        or(
          ilike(projectPyps.code, `%${search}%`),
          ilike(projectPyps.name, `%${search}%`)
        )
      );
    }

    if (projectId) {
      whereConditions.push(eq(projectPyps.projectId, parseInt(projectId as string)));
    }

    if (status) {
      whereConditions.push(eq(projectPyps.status, status as string));
    }

    if (active === 'true') {
      whereConditions.push(eq(projectPyps.isActive, true));
    } else if (active === 'false') {
      whereConditions.push(eq(projectPyps.isActive, false));
    }

    if (whereConditions.length > 0) {
      query = query.where(and(...whereConditions)) as any;
    }

    const pypList = await query
      .orderBy(desc(projectPyps.createdAt))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    res.json({
      success: true,
      message: 'PYP kayıtları başarıyla getirildi.',
      data: {
        pyps: pypList,
        totalCount: pypList.length,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    });
  } catch (error) {
    console.error('PYP kayıtları getirme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'PYP_FETCH_ERROR',
      message: 'PYP kayıtları getirilirken hata oluştu.'
    });
  }
});

/**
 * @swagger
 * /api/secure/project-pyps/{id}:
 *   get:
 *     summary: PYP Detayı
 *     description: Belirli bir PYP kaydının detaylı bilgilerini getirir
 *     tags: [PYP Yönetimi]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: PYP ID
 *     responses:
 *       200:
 *         description: PYP detayı başarıyla getirildi
 *       404:
 *         description: PYP kaydı bulunamadı
 */
router.get('/project-pyps/:id', async (req: AuthRequest, res) => {
  try {
    const pypId = parseInt(req.params.id);

    const [pypDetail] = await db
      .select({
        id: projectPyps.id,
        projectId: projectPyps.projectId,
        code: projectPyps.code,
        name: projectPyps.name,
        address: projectPyps.address,
        status: projectPyps.status,
        isActive: projectPyps.isActive,
        createdAt: projectPyps.createdAt,
        updatedAt: projectPyps.updatedAt,
        createdBy: projectPyps.createdBy,
        updatedBy: projectPyps.updatedBy,
        projectCode: projects.code,
      })
      .from(projectPyps)
      .leftJoin(projects, eq(projectPyps.projectId, projects.id))
      .where(eq(projectPyps.id, pypId));

    if (!pypDetail) {
      return res.status(404).json({
        success: false,
        error: 'PYP_NOT_FOUND',
        message: 'PYP kaydı bulunamadı.'
      });
    }

    res.json({
      success: true,
      message: 'PYP detayı başarıyla getirildi.',
      data: {
        pyp: pypDetail
      }
    });
  } catch (error) {
    console.error('PYP detayı getirme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'PYP_DETAIL_ERROR',
      message: 'PYP detayı getirilirken hata oluştu.'
    });
  }
});

/**
 * @swagger
 * /api/secure/projects/{projectId}/pyps:
 *   get:
 *     summary: Projeye Ait PYP Kayıtlarını Listele
 *     description: Belirli bir projeye ait tüm PYP kayıtlarını listeler
 *     tags: [PYP Yönetimi]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Proje ID
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Sadece aktif kayıtlar
 *     responses:
 *       200:
 *         description: Projeye ait PYP kayıtları başarıyla getirildi
 *       404:
 *         description: Proje bulunamadı
 */
router.get('/projects/:projectId/pyps', async (req: AuthRequest, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const { active = 'true' } = req.query;

    // Check if project exists
    const projectExists = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.id, projectId));

    if (projectExists.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'PROJECT_NOT_FOUND',
        message: 'Proje bulunamadı.'
      });
    }

    const whereConditions = [eq(projectPyps.projectId, projectId)];

    if (active === 'true') {
      whereConditions.push(eq(projectPyps.isActive, true));
    } else if (active === 'false') {
      whereConditions.push(eq(projectPyps.isActive, false));
    }

    const pypList = await db
      .select({
        id: projectPyps.id,
        code: projectPyps.code,
        name: projectPyps.name,
        address: projectPyps.address,
        status: projectPyps.status,
        isActive: projectPyps.isActive,
        createdAt: projectPyps.createdAt,
        updatedAt: projectPyps.updatedAt,
      })
      .from(projectPyps)
      .where(and(...whereConditions))
      .orderBy(desc(projectPyps.createdAt));

    res.json({
      success: true,
      message: 'Projeye ait PYP kayıtları başarıyla getirildi.',
      data: {
        projectId: projectId,
        pyps: pypList,
        totalCount: pypList.length
      }
    });
  } catch (error) {
    console.error('Projeye ait PYP kayıtları getirme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'PROJECT_PYPS_FETCH_ERROR',
      message: 'Projeye ait PYP kayıtları getirilirken hata oluştu.'
    });
  }
});

/**
 * @swagger
 * /api/secure/project-pyps:
 *   post:
 *     summary: Yeni PYP Kaydı Oluştur
 *     description: Bir projeye yeni PYP kaydı ekler
 *     tags: [PYP Yönetimi]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - projectId
 *               - code
 *               - name
 *             properties:
 *               projectId:
 *                 type: integer
 *                 description: Proje ID
 *               code:
 *                 type: string
 *                 description: PYP kodu (proje içinde benzersiz)
 *               name:
 *                 type: string
 *                 description: PYP adı
 *               address:
 *                 type: string
 *                 description: PYP adresi
 *               status:
 *                 type: string
 *                 enum: [planned, ongoing, completed, cancelled]
 *                 default: planned
 *                 description: PYP durumu
 *     responses:
 *       201:
 *         description: PYP kaydı başarıyla oluşturuldu
 *       400:
 *         description: Geçersiz veri veya kod zaten mevcut
 */
router.post('/project-pyps', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const validationResult = insertProjectPypSchema.safeParse(req.body);

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

    // Check if project exists
    const projectExists = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.id, validatedData.projectId));

    if (projectExists.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_PROJECT_ID',
        message: `Belirtilen proje ID'si (${validatedData.projectId}) bulunamadı.`
      });
    }

    // Check if code already exists for this project
    const codeExists = await db
      .select({ id: projectPyps.id })
      .from(projectPyps)
      .where(
        and(
          eq(projectPyps.projectId, validatedData.projectId),
          eq(projectPyps.code, validatedData.code)
        )
      );

    if (codeExists.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'DUPLICATE_PYP_CODE',
        message: `Bu PYP kodu (${validatedData.code}) bu proje için zaten mevcut.`
      });
    }

    // Create new PYP record
    const [newPyp] = await db
      .insert(projectPyps)
      .values({
        ...validatedData,
        createdBy: req.userContext?.userId,
        updatedBy: req.userContext?.userId,
      })
      .returning();

    res.status(201).json({
      success: true,
      message: 'PYP kaydı başarıyla oluşturuldu.',
      data: {
        pyp: newPyp
      }
    });
  } catch (error: any) {
    console.error('PYP oluşturma hatası:', error);
    
    if (error?.code === '23505') {
      return res.status(400).json({
        success: false,
        error: 'DUPLICATE_PYP_CODE',
        message: 'Bu PYP kodu bu proje için zaten mevcut.'
      });
    }

    res.status(500).json({
      success: false,
      error: 'PYP_CREATE_ERROR',
      message: 'PYP kaydı oluşturulurken hata oluştu.',
      debug: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * @swagger
 * /api/secure/project-pyps/{id}:
 *   put:
 *     summary: PYP Kaydını Güncelle
 *     description: Mevcut bir PYP kaydını günceller (soft delete için isActive kullanılabilir)
 *     tags: [PYP Yönetimi]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: PYP ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 description: PYP kodu
 *               name:
 *                 type: string
 *                 description: PYP adı
 *               address:
 *                 type: string
 *                 description: PYP adresi
 *               status:
 *                 type: string
 *                 enum: [planned, ongoing, completed, cancelled]
 *                 description: PYP durumu
 *               isActive:
 *                 type: boolean
 *                 description: Aktif durumu (soft delete için false yapılabilir)
 *     responses:
 *       200:
 *         description: PYP kaydı başarıyla güncellendi
 *       404:
 *         description: PYP kaydı bulunamadı
 *       400:
 *         description: Geçersiz veri veya kod çakışması
 */
router.put('/project-pyps/:id', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const pypId = parseInt(req.params.id);

    // Check if exists
    const existingPyp = await db
      .select({ id: projectPyps.id, projectId: projectPyps.projectId, code: projectPyps.code })
      .from(projectPyps)
      .where(eq(projectPyps.id, pypId));

    if (existingPyp.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'PYP_NOT_FOUND',
        message: 'Güncellenecek PYP kaydı bulunamadı.'
      });
    }

    const validationResult = updateProjectPypSchema.safeParse(req.body);

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

    const updateData = validationResult.data;

    // If code is being updated, check for duplicates
    if (updateData.code && updateData.code !== existingPyp[0].code) {
      const codeExists = await db
        .select({ id: projectPyps.id })
        .from(projectPyps)
        .where(
          and(
            eq(projectPyps.projectId, existingPyp[0].projectId),
            eq(projectPyps.code, updateData.code),
            eq(projectPyps.isActive, true)
          )
        );

      if (codeExists.length > 0 && codeExists[0].id !== pypId) {
        return res.status(400).json({
          success: false,
          error: 'DUPLICATE_PYP_CODE',
          message: `Bu PYP kodu (${updateData.code}) bu proje için zaten mevcut.`
        });
      }
    }

    // Update PYP record
    const [updatedPyp] = await db
      .update(projectPyps)
      .set({
        ...updateData,
        updatedBy: req.userContext?.userId,
        updatedAt: new Date(),
      })
      .where(eq(projectPyps.id, pypId))
      .returning();

    res.json({
      success: true,
      message: 'PYP kaydı başarıyla güncellendi.',
      data: {
        pyp: updatedPyp
      }
    });
  } catch (error: any) {
    console.error('PYP güncelleme hatası:', error);

    if (error?.code === '23505') {
      return res.status(400).json({
        success: false,
        error: 'DUPLICATE_PYP_CODE',
        message: 'Bu PYP kodu bu proje için zaten mevcut.'
      });
    }

    res.status(500).json({
      success: false,
      error: 'PYP_UPDATE_ERROR',
      message: 'PYP kaydı güncellenirken hata oluştu.'
    });
  }
});

export default router;
