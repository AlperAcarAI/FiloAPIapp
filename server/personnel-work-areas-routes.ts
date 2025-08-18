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

export default router;