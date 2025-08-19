import { Router } from 'express';
import { db } from './db.js';
import { eq, and, desc, asc, inArray, sql } from 'drizzle-orm';
import { 
  personnelWorkAreas, personnel, workAreas, personnelPositions, projects, companies,
  insertPersonnelWorkAreaSchema, type PersonnelWorkArea
} from '../shared/schema.js';
import { 
  authenticateJWT, 
  filterByWorkArea,
  type AuthRequest 
} from './hierarchical-auth.js';
import { z } from 'zod';

const router = Router();

// Apply hierarchical authentication and work area filtering to all routes
router.use(authenticateJWT);
router.use(filterByWorkArea);

/**
 * @swagger
 * /api/secure/personnel-work-areas:
 *   get:
 *     summary: Personel Çalışma Alanı Atamaları Listesi
 *     description: Tüm personel çalışma alanı atamalarını listeler (join bilgileri ile birlikte)
 *     tags: [Personel Çalışma Alanı İşlemleri]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: personnelId
 *         schema:
 *           type: integer
 *         description: Belirli personelin atamalarını filtrelemek için
 *       - in: query
 *         name: workAreaId
 *         schema:
 *           type: integer
 *         description: Belirli çalışma alanının atamalarını filtrelemek için
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: integer
 *         description: Belirli projenin atamalarını filtrelemek için
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Sadece aktif atamaları getirmek için
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
 *         description: Personel çalışma alanı atamaları başarıyla getirildi
 *       401:
 *         description: Geçersiz API anahtarı
 */
router.get('/personnel-work-areas', async (req: AuthRequest, res) => {
  try {
    const { personnelId, workAreaId, projectId, active, limit = '50', offset = '0' } = req.query;
    
    // Simple query without complex joins for now
    let query = db
      .select({
        id: personnelWorkAreas.id,
        personnelId: personnelWorkAreas.personnelId,
        workAreaId: personnelWorkAreas.workAreaId,
        positionId: personnelWorkAreas.positionId,
        projectId: personnelWorkAreas.projectId,
        startDate: personnelWorkAreas.startDate,
        endDate: personnelWorkAreas.endDate,
        isActive: personnelWorkAreas.isActive,
        createdAt: personnelWorkAreas.createdAt,
        updatedAt: personnelWorkAreas.updatedAt,
        // Basic join data
        personnelName: sql`${personnel.name} || ' ' || ${personnel.surname}`.as('personnelName'),
        personnelTcNo: personnel.tcNo,
        workAreaName: workAreas.name,
        positionName: personnelPositions.name,
        projectCode: projects.code
      })
      .from(personnelWorkAreas)
      .leftJoin(personnel, eq(personnelWorkAreas.personnelId, personnel.id))
      .leftJoin(workAreas, eq(personnelWorkAreas.workAreaId, workAreas.id))
      .leftJoin(personnelPositions, eq(personnelWorkAreas.positionId, personnelPositions.id))
      .leftJoin(projects, eq(personnelWorkAreas.projectId, projects.id));

    // Filters
    const whereConditions = [];
    
    // Work area filtering based on user's permissions
    if (req.workAreaFilter && req.workAreaFilter.length > 0) {
      whereConditions.push(inArray(personnelWorkAreas.workAreaId, req.workAreaFilter));
    }
    
    if (personnelId) {
      whereConditions.push(eq(personnelWorkAreas.personnelId, parseInt(personnelId as string)));
    }
    
    if (workAreaId) {
      whereConditions.push(eq(personnelWorkAreas.workAreaId, parseInt(workAreaId as string)));
    }
    
    if (projectId) {
      whereConditions.push(eq(personnelWorkAreas.projectId, parseInt(projectId as string)));
    }
    
    if (active === 'true') {
      whereConditions.push(eq(personnelWorkAreas.isActive, true));
    } else if (active === 'false') {
      whereConditions.push(eq(personnelWorkAreas.isActive, false));
    }

    if (whereConditions.length > 0) {
      query = query.where(and(...whereConditions)) as any;
    }

    // Execute query with ordering, limit and offset
    const workAreaAssignments = await query
      .orderBy(desc(personnelWorkAreas.createdAt))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));
    
    // Convert BigInt to string for JSON serialization
    const responseData = workAreaAssignments.map(assignment => ({
      ...assignment,
      personnelTcNo: assignment.personnelTcNo ? assignment.personnelTcNo.toString() : null
    }));
    
    res.json({
      success: true,
      message: 'Personel çalışma alanı atamaları başarıyla getirildi.',
      data: {
        assignments: responseData,
        totalCount: responseData.length,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    });
  } catch (error) {
    console.error('Personel çalışma alanı atamaları getirme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'WORK_AREA_ASSIGNMENTS_FETCH_ERROR',
      message: 'Personel çalışma alanı atamaları getirilirken hata oluştu.'
    });
  }
});

/**
 * @swagger
 * /api/secure/personnel-work-areas/{id}:
 *   get:
 *     summary: Personel Çalışma Alanı Ataması Detayı
 *     description: Belirli bir personel çalışma alanı atamasının detaylı bilgilerini getirir
 *     tags: [Personel Çalışma Alanı İşlemleri]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Personel çalışma alanı ataması ID
 *     responses:
 *       200:
 *         description: Personel çalışma alanı ataması detayı başarıyla getirildi
 *       404:
 *         description: Atama bulunamadı
 */
router.get('/personnel-work-areas/:id', async (req: AuthRequest, res) => {
  try {
    const assignmentId = parseInt(req.params.id);
    
    const [assignmentDetail] = await db
      .select({
        id: personnelWorkAreas.id,
        personnelId: personnelWorkAreas.personnelId,
        workAreaId: personnelWorkAreas.workAreaId,
        positionId: personnelWorkAreas.positionId,
        projectId: personnelWorkAreas.projectId,
        startDate: personnelWorkAreas.startDate,
        endDate: personnelWorkAreas.endDate,
        isActive: personnelWorkAreas.isActive,
        createdAt: personnelWorkAreas.createdAt,
        updatedAt: personnelWorkAreas.updatedAt,
        // Join data
        personnelName: sql`${personnel.name} || ' ' || ${personnel.surname}`.as('personnelName'),
        personnelTcNo: personnel.tcNo,
        personnelPhone: personnel.phoneNo,
        personnelIban: personnel.iban,
        workAreaName: workAreas.name,
        workAreaAddress: workAreas.address,
        positionName: personnelPositions.name,
        projectCode: projects.code,
        projectStatus: projects.status
      })
      .from(personnelWorkAreas)
      .leftJoin(personnel, eq(personnelWorkAreas.personnelId, personnel.id))
      .leftJoin(workAreas, eq(personnelWorkAreas.workAreaId, workAreas.id))
      .leftJoin(personnelPositions, eq(personnelWorkAreas.positionId, personnelPositions.id))
      .leftJoin(projects, eq(personnelWorkAreas.projectId, projects.id))
      .where(eq(personnelWorkAreas.id, assignmentId));

    if (!assignmentDetail) {
      return res.status(404).json({
        success: false,
        error: 'ASSIGNMENT_NOT_FOUND',
        message: 'Personel çalışma alanı ataması bulunamadı.'
      });
    }
    
    // Convert BigInt to string for JSON serialization
    const responseData = {
      ...assignmentDetail,
      personnelTcNo: assignmentDetail.personnelTcNo ? assignmentDetail.personnelTcNo.toString() : null
    };
    
    res.json({
      success: true,
      message: 'Personel çalışma alanı ataması detayı başarıyla getirildi.',
      data: {
        assignment: responseData
      }
    });
  } catch (error) {
    console.error('Personel çalışma alanı ataması detayı getirme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'ASSIGNMENT_DETAIL_ERROR',
      message: 'Personel çalışma alanı ataması detayı getirilirken hata oluştu.'
    });
  }
});

/**
 * @swagger
 * /api/secure/personnel-work-areas/{id}/terminate:
 *   put:
 *     summary: Personel İş Ataması Sonlandırma
 *     description: Mevcut bir personel çalışma alanı atamasını sonlandırır (endDate ve isActive günceller)
 *     tags: [Personel Çalışma Alanı İşlemleri]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Personel çalışma alanı ataması ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: İş sonlandırma tarihi (YYYY-MM-DD formatında)
 *               reason:
 *                 type: string
 *                 description: Sonlandırma sebebi (opsiyonel)
 *             required:
 *               - endDate
 *     responses:
 *       200:
 *         description: İş ataması başarıyla sonlandırıldı
 *       400:
 *         description: Geçersiz veri
 *       404:
 *         description: Atama bulunamadı
 *       409:
 *         description: Atama zaten sonlandırılmış
 */
router.put('/personnel-work-areas/:id/terminate', async (req: AuthRequest, res) => {
  try {
    const assignmentId = parseInt(req.params.id);
    const { endDate, reason } = req.body;

    // Validation
    if (!endDate) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_END_DATE',
        message: 'Sonlandırma tarihi (endDate) zorunludur.'
      });
    }

    // Date validation
    const terminationDate = new Date(endDate);
    if (isNaN(terminationDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_DATE_FORMAT',
        message: 'Geçersiz tarih formatı. YYYY-MM-DD formatında olmalıdır.'
      });
    }

    // Check if assignment exists and is active
    const [existingAssignment] = await db
      .select({
        id: personnelWorkAreas.id,
        personnelId: personnelWorkAreas.personnelId,
        workAreaId: personnelWorkAreas.workAreaId,
        startDate: personnelWorkAreas.startDate,
        endDate: personnelWorkAreas.endDate,
        isActive: personnelWorkAreas.isActive,
        // Join data for response
        personnelName: sql`${personnel.name} || ' ' || ${personnel.surname}`.as('personnelName'),
        workAreaName: workAreas.name,
        positionName: personnelPositions.name
      })
      .from(personnelWorkAreas)
      .leftJoin(personnel, eq(personnelWorkAreas.personnelId, personnel.id))
      .leftJoin(workAreas, eq(personnelWorkAreas.workAreaId, workAreas.id))
      .leftJoin(personnelPositions, eq(personnelWorkAreas.positionId, personnelPositions.id))
      .where(eq(personnelWorkAreas.id, assignmentId));

    if (!existingAssignment) {
      return res.status(404).json({
        success: false,
        error: 'ASSIGNMENT_NOT_FOUND',
        message: 'Personel çalışma alanı ataması bulunamadı.'
      });
    }

    // Check if assignment is already terminated
    if (!existingAssignment.isActive) {
      return res.status(409).json({
        success: false,
        error: 'ASSIGNMENT_ALREADY_TERMINATED',
        message: 'Bu atama zaten sonlandırılmış.',
        data: {
          currentEndDate: existingAssignment.endDate
        }
      });
    }

    // Validate termination date is not before start date
    const startDate = new Date(existingAssignment.startDate);
    if (terminationDate < startDate) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_TERMINATION_DATE',
        message: 'Sonlandırma tarihi başlangıç tarihinden önce olamaz.',
        data: {
          startDate: existingAssignment.startDate,
          providedEndDate: endDate
        }
      });
    }

    // Update assignment to terminate it
    const [terminatedAssignment] = await db
      .update(personnelWorkAreas)
      .set({
        endDate: endDate,
        isActive: false,
        updatedAt: new Date()
      })
      .where(eq(personnelWorkAreas.id, assignmentId))
      .returning();

    res.json({
      success: true,
      message: 'Personel iş ataması başarıyla sonlandırıldı.',
      data: {
        assignment: {
          id: terminatedAssignment.id,
          personnelId: terminatedAssignment.personnelId,
          workAreaId: terminatedAssignment.workAreaId,
          startDate: terminatedAssignment.startDate,
          endDate: terminatedAssignment.endDate,
          isActive: terminatedAssignment.isActive,
          updatedAt: terminatedAssignment.updatedAt,
          // Include joined data from the select query
          personnelName: existingAssignment.personnelName,
          workAreaName: existingAssignment.workAreaName,
          positionName: existingAssignment.positionName
        },
        terminationInfo: {
          terminationDate: endDate,
          reason: reason || null,
          terminatedAt: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Personel iş ataması sonlandırma hatası:', error);
    res.status(500).json({
      success: false,
      error: 'TERMINATION_ERROR',
      message: 'Personel iş ataması sonlandırılırken hata oluştu.'
    });
  }
});

/**
 * @swagger
 * /api/secure/personnel-work-areas/{id}/transfer:
 *   post:
 *     summary: Personel Çalışma Alanı Transferi
 *     description: Mevcut atamanın sonlandırılması ve yeni çalışma alanına transfer işlemi (tek transaction içinde)
 *     tags: [Personel Çalışma Alanı İşlemleri]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Mevcut personel çalışma alanı ataması ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               transferDate:
 *                 type: string
 *                 format: date
 *                 description: Transfer tarihi (mevcut atamanın bitiş ve yeni atamanın başlangıç tarihi)
 *               newWorkAreaId:
 *                 type: integer
 *                 description: Yeni çalışma alanı ID
 *               newPositionId:
 *                 type: integer
 *                 description: Yeni pozisyon ID
 *               newProjectId:
 *                 type: integer
 *                 description: Yeni proje ID (opsiyonel)
 *               reason:
 *                 type: string
 *                 description: Transfer sebebi (opsiyonel)
 *             required:
 *               - transferDate
 *               - newWorkAreaId
 *               - newPositionId
 *     responses:
 *       201:
 *         description: Transfer işlemi başarıyla tamamlandı
 *       400:
 *         description: Geçersiz veri
 *       404:
 *         description: Atama, çalışma alanı veya pozisyon bulunamadı
 *       409:
 *         description: Atama zaten sonlandırılmış veya çakışma var
 */
router.post('/personnel-work-areas/:id/transfer', async (req: AuthRequest, res) => {
  try {
    const currentAssignmentId = parseInt(req.params.id);
    const { transferDate, newWorkAreaId, newPositionId, newProjectId, reason } = req.body;

    // Required field validation
    if (!transferDate || !newWorkAreaId || !newPositionId) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_REQUIRED_FIELDS',
        message: 'transferDate, newWorkAreaId ve newPositionId alanları zorunludur.'
      });
    }

    // Date validation
    const transferDateTime = new Date(transferDate);
    if (isNaN(transferDateTime.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_DATE_FORMAT',
        message: 'Geçersiz tarih formatı. YYYY-MM-DD formatında olmalıdır.'
      });
    }

    // Start transaction
    const result = await db.transaction(async (tx) => {
      // 1. Check if current assignment exists and is active
      const [currentAssignment] = await tx
        .select({
          id: personnelWorkAreas.id,
          personnelId: personnelWorkAreas.personnelId,
          workAreaId: personnelWorkAreas.workAreaId,
          positionId: personnelWorkAreas.positionId,
          projectId: personnelWorkAreas.projectId,
          startDate: personnelWorkAreas.startDate,
          endDate: personnelWorkAreas.endDate,
          isActive: personnelWorkAreas.isActive,
          // Join data for response
          personnelName: sql`${personnel.name} || ' ' || ${personnel.surname}`.as('personnelName'),
          currentWorkAreaName: workAreas.name,
          currentPositionName: personnelPositions.name
        })
        .from(personnelWorkAreas)
        .leftJoin(personnel, eq(personnelWorkAreas.personnelId, personnel.id))
        .leftJoin(workAreas, eq(personnelWorkAreas.workAreaId, workAreas.id))
        .leftJoin(personnelPositions, eq(personnelWorkAreas.positionId, personnelPositions.id))
        .where(eq(personnelWorkAreas.id, currentAssignmentId));

      if (!currentAssignment) {
        throw new Error('ASSIGNMENT_NOT_FOUND');
      }

      if (!currentAssignment.isActive) {
        throw new Error('ASSIGNMENT_ALREADY_TERMINATED');
      }

      // 2. Validate transfer date is not before start date
      const startDate = new Date(currentAssignment.startDate);
      if (transferDateTime < startDate) {
        throw new Error('INVALID_TRANSFER_DATE');
      }

      // 3. Validate new work area exists
      const [newWorkArea] = await tx
        .select({ id: workAreas.id, name: workAreas.name })
        .from(workAreas)
        .where(eq(workAreas.id, newWorkAreaId));

      if (!newWorkArea) {
        throw new Error('NEW_WORK_AREA_NOT_FOUND');
      }

      // 4. Validate new position exists
      const [newPosition] = await tx
        .select({ id: personnelPositions.id, name: personnelPositions.name })
        .from(personnelPositions)
        .where(eq(personnelPositions.id, newPositionId));

      if (!newPosition) {
        throw new Error('NEW_POSITION_NOT_FOUND');
      }

      // 5. Validate new project exists (if provided)
      let newProject = null;
      if (newProjectId) {
        const [project] = await tx
          .select({ id: projects.id, code: projects.code })
          .from(projects)
          .where(eq(projects.id, newProjectId));

        if (!project) {
          throw new Error('NEW_PROJECT_NOT_FOUND');
        }
        newProject = project;
      }

      // 6. Check for existing active assignment in new work area
      const existingNewAssignment = await tx
        .select({ id: personnelWorkAreas.id })
        .from(personnelWorkAreas)
        .where(and(
          eq(personnelWorkAreas.personnelId, currentAssignment.personnelId),
          eq(personnelWorkAreas.workAreaId, newWorkAreaId),
          eq(personnelWorkAreas.isActive, true)
        ));

      if (existingNewAssignment.length > 0) {
        throw new Error('DUPLICATE_ASSIGNMENT_IN_NEW_AREA');
      }

      // 7. Terminate current assignment
      const [terminatedAssignment] = await tx
        .update(personnelWorkAreas)
        .set({
          endDate: transferDate,
          isActive: false,
          updatedAt: new Date()
        })
        .where(eq(personnelWorkAreas.id, currentAssignmentId))
        .returning();

      // 8. Create new assignment
      const [newAssignment] = await tx
        .insert(personnelWorkAreas)
        .values({
          personnelId: currentAssignment.personnelId,
          workAreaId: newWorkAreaId,
          positionId: newPositionId,
          projectId: newProjectId || null,
          startDate: transferDate,
          endDate: null,
          isActive: true
        })
        .returning();

      return {
        terminatedAssignment,
        newAssignment,
        currentAssignment,
        newWorkArea,
        newPosition,
        newProject
      };
    });

    res.status(201).json({
      success: true,
      message: 'Personel transfer işlemi başarıyla tamamlandı.',
      data: {
        transfer: {
          transferDate: transferDate,
          reason: reason || null,
          transferredAt: new Date().toISOString()
        },
        terminatedAssignment: {
          id: result.terminatedAssignment.id,
          workAreaId: result.currentAssignment.workAreaId,
          workAreaName: result.currentAssignment.currentWorkAreaName,
          positionName: result.currentAssignment.currentPositionName,
          startDate: result.currentAssignment.startDate,
          endDate: result.terminatedAssignment.endDate,
          isActive: result.terminatedAssignment.isActive
        },
        newAssignment: {
          id: result.newAssignment.id,
          personnelId: result.newAssignment.personnelId,
          personnelName: result.currentAssignment.personnelName,
          workAreaId: result.newAssignment.workAreaId,
          workAreaName: result.newWorkArea.name,
          positionId: result.newAssignment.positionId,
          positionName: result.newPosition.name,
          projectId: result.newAssignment.projectId,
          projectCode: result.newProject?.code || null,
          startDate: result.newAssignment.startDate,
          endDate: result.newAssignment.endDate,
          isActive: result.newAssignment.isActive,
          createdAt: result.newAssignment.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Personel transfer hatası:', error);

    // Handle specific business logic errors
    if (error.message === 'ASSIGNMENT_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        error: 'ASSIGNMENT_NOT_FOUND',
        message: 'Personel çalışma alanı ataması bulunamadı.'
      });
    }

    if (error.message === 'ASSIGNMENT_ALREADY_TERMINATED') {
      return res.status(409).json({
        success: false,
        error: 'ASSIGNMENT_ALREADY_TERMINATED',
        message: 'Bu atama zaten sonlandırılmış.'
      });
    }

    if (error.message === 'INVALID_TRANSFER_DATE') {
      return res.status(400).json({
        success: false,
        error: 'INVALID_TRANSFER_DATE',
        message: 'Transfer tarihi mevcut atamanın başlangıç tarihinden önce olamaz.'
      });
    }

    if (error.message === 'NEW_WORK_AREA_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        error: 'NEW_WORK_AREA_NOT_FOUND',
        message: 'Belirtilen yeni çalışma alanı bulunamadı.'
      });
    }

    if (error.message === 'NEW_POSITION_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        error: 'NEW_POSITION_NOT_FOUND',
        message: 'Belirtilen yeni pozisyon bulunamadı.'
      });
    }

    if (error.message === 'NEW_PROJECT_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        error: 'NEW_PROJECT_NOT_FOUND',
        message: 'Belirtilen yeni proje bulunamadı.'
      });
    }

    if (error.message === 'DUPLICATE_ASSIGNMENT_IN_NEW_AREA') {
      return res.status(409).json({
        success: false,
        error: 'DUPLICATE_ASSIGNMENT_IN_NEW_AREA',
        message: 'Bu personel yeni çalışma alanında zaten aktif bir atamaya sahip.'
      });
    }

    // Generic error
    res.status(500).json({
      success: false,
      error: 'TRANSFER_ERROR',
      message: 'Personel transfer işlemi sırasında hata oluştu.'
    });
  }
});

export default router;