import { Router } from 'express';
import { db } from './db.js';
import { eq, and, desc, asc, inArray, sql, isNull, isNotNull } from 'drizzle-orm';
import { 
  personnelWorkAreas, personnel, workAreas, personnelPositions, projects, companies, cities
} from '../shared/schema.js';
import { 
  authenticateJWT, 
  filterByWorkArea,
  type AuthRequest 
} from './hierarchical-auth.js';

const router = Router();

// Apply hierarchical authentication and work area filtering to all routes
router.use(authenticateJWT);
router.use(filterByWorkArea);

/**
 * @swagger
 * /api/secure/personnel-work-history/{personnelId}:
 *   get:
 *     summary: Personel Çalışma Geçmişi
 *     description: Belirli bir personelin tüm çalışma geçmişini kronolojik olarak listeler
 *     tags: [Personel Çalışma Geçmişi]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: personnelId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Personel ID
 *       - in: query
 *         name: includeActive
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Aktif atamaları da dahil et
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Maksimum kayıt sayısı
 *     responses:
 *       200:
 *         description: Personel çalışma geçmişi başarıyla getirildi
 *       404:
 *         description: Personel bulunamadı
 */
router.get('/personnel-work-history/:personnelId', async (req: AuthRequest, res) => {
  try {
    const personnelId = parseInt(req.params.personnelId);
    const { includeActive = 'true', limit = '100' } = req.query;
    
    // First, check if personnel exists
    const [personnelExists] = await db
      .select({
        id: personnel.id,
        name: personnel.name,
        surname: personnel.surname,
        tcNo: personnel.tcNo
      })
      .from(personnel)
      .where(eq(personnel.id, personnelId));

    if (!personnelExists) {
      return res.status(404).json({
        success: false,
        error: 'PERSONNEL_NOT_FOUND',
        message: 'Belirtilen personel bulunamadı.'
      });
    }

    // Apply filters
    const whereConditions = [eq(personnelWorkAreas.personnelId, personnelId)];
    
    // Work area filtering based on user's permissions
    if (req.workAreaFilter && req.workAreaFilter.length > 0) {
      whereConditions.push(inArray(personnelWorkAreas.workAreaId, req.workAreaFilter));
    }
    
    // Include/exclude active assignments
    if (includeActive === 'false') {
      whereConditions.push(eq(personnelWorkAreas.isActive, false));
    }

    // Build and execute work history query
    const workHistory = await db
      .select({
        // Assignment details
        assignmentId: personnelWorkAreas.id,
        startDate: personnelWorkAreas.startDate,
        endDate: personnelWorkAreas.endDate,
        isActive: personnelWorkAreas.isActive,
        createdAt: personnelWorkAreas.createdAt,
        
        // Work area details
        workAreaId: personnelWorkAreas.workAreaId,
        workAreaName: workAreas.name,
        workAreaAddress: workAreas.address,
        workAreaStartDate: workAreas.startDate,
        workAreaEndDate: workAreas.endDate,
        
        // City info
        cityName: cities.name,
        
        // Position details
        positionId: personnelWorkAreas.positionId,
        positionName: personnelPositions.name,
        
        // Project details
        projectId: personnelWorkAreas.projectId,
        projectCode: projects.code,
        projectStatus: projects.status,
        projectStartDate: projects.startDate,
        projectEndDate: projects.endDate,
        projectTotalPrice: projects.projectTotalPrice,
        projectCompleteRate: projects.completionRate,
        
        // Company details
        poCompanyId: projects.poCompanyId,
        ppCompanyId: projects.ppCompanyId,
        
        // Calculate work duration in days
        workDurationDays: sql`
          CASE 
            WHEN ${personnelWorkAreas.endDate} IS NOT NULL THEN
              ${personnelWorkAreas.endDate}::date - ${personnelWorkAreas.startDate}::date + 1
            ELSE
              CURRENT_DATE - ${personnelWorkAreas.startDate}::date + 1
          END
        `.as('workDurationDays')
      })
      .from(personnelWorkAreas)
      .leftJoin(workAreas, eq(personnelWorkAreas.workAreaId, workAreas.id))
      .leftJoin(cities, eq(workAreas.cityId, cities.id))
      .leftJoin(personnelPositions, eq(personnelWorkAreas.positionId, personnelPositions.id))
      .leftJoin(projects, eq(personnelWorkAreas.projectId, projects.id))
      .where(and(...whereConditions))
      .orderBy(desc(personnelWorkAreas.startDate), desc(personnelWorkAreas.createdAt))
      .limit(parseInt(limit as string));

    // Calculate summary statistics
    const summaryStats = {
      totalAssignments: workHistory.length,
      activeAssignments: workHistory.filter(w => w.isActive).length,
      completedAssignments: workHistory.filter(w => !w.isActive).length,
      uniqueWorkAreas: Array.from(new Set(workHistory.map(w => w.workAreaId))).length,
      uniqueProjects: Array.from(new Set(workHistory.map(w => w.projectId).filter(id => id !== null))).length,
      totalWorkDays: workHistory.reduce((sum, w) => sum + (parseInt(w.workDurationDays?.toString() || '0')), 0),
      earliestStartDate: workHistory.length > 0 ? 
        workHistory.reduce((earliest, w) => w.startDate < earliest ? w.startDate : earliest, workHistory[0].startDate) : null,
      latestEndDate: workHistory.length > 0 ? 
        workHistory.reduce((latest, w) => {
          if (!w.endDate) return latest; // Skip active assignments
          return !latest || w.endDate > latest ? w.endDate : latest;
        }, null as string | null) : null
    };

    // Group work history by work areas and projects for better organization
    const workAreaGroups = workHistory.reduce((groups, assignment) => {
      const workAreaKey = `${assignment.workAreaId}_${assignment.workAreaName}`;
      if (!groups[workAreaKey]) {
        groups[workAreaKey] = {
          workAreaId: assignment.workAreaId,
          workAreaName: assignment.workAreaName,
          workAreaAddress: assignment.workAreaAddress,
          cityName: assignment.cityName,
          assignments: []
        };
      }
      groups[workAreaKey].assignments.push(assignment);
      return groups;
    }, {} as any);

    res.json({
      success: true,
      message: 'Personel çalışma geçmişi başarıyla getirildi.',
      data: {
        personnel: {
          id: personnelExists.id,
          name: personnelExists.name,
          surname: personnelExists.surname,
          fullName: `${personnelExists.name} ${personnelExists.surname}`,
          tcNo: personnelExists.tcNo ? personnelExists.tcNo.toString() : null
        },
        summary: summaryStats,
        workHistory: workHistory.map(w => ({
          ...w,
          workDurationDays: parseInt(w.workDurationDays?.toString() || '0')
        })),
        workAreaGroups: Object.values(workAreaGroups),
        totalRecords: workHistory.length,
        filters: {
          includeActive: includeActive === 'true',
          limit: parseInt(limit as string)
        }
      }
    });
  } catch (error) {
    console.error('Personel çalışma geçmişi getirme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'WORK_HISTORY_FETCH_ERROR',
      message: 'Personel çalışma geçmişi getirilirken hata oluştu.'
    });
  }
});

/**
 * @swagger
 * /api/secure/personnel-work-history-summary/{personnelId}:
 *   get:
 *     summary: Personel Çalışma Geçmişi Özeti
 *     description: Personelin çalışma geçmişinin özet istatistiklerini getirir
 *     tags: [Personel Çalışma Geçmişi]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: personnelId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Personel ID
 *     responses:
 *       200:
 *         description: Özet istatistikler başarıyla getirildi
 *       404:
 *         description: Personel bulunamadı
 */
router.get('/personnel-work-history-summary/:personnelId', async (req: AuthRequest, res) => {
  try {
    const personnelId = parseInt(req.params.personnelId);
    
    // Get summary statistics using aggregation
    const [summaryData] = await db
      .select({
        totalAssignments: sql<number>`COUNT(*)`.as('totalAssignments'),
        activeAssignments: sql<number>`COUNT(CASE WHEN ${personnelWorkAreas.isActive} = true THEN 1 END)`.as('activeAssignments'),
        completedAssignments: sql<number>`COUNT(CASE WHEN ${personnelWorkAreas.isActive} = false THEN 1 END)`.as('completedAssignments'),
        uniqueWorkAreas: sql<number>`COUNT(DISTINCT ${personnelWorkAreas.workAreaId})`.as('uniqueWorkAreas'),
        uniqueProjects: sql<number>`COUNT(DISTINCT ${personnelWorkAreas.projectId})`.as('uniqueProjects'),
        earliestStartDate: sql<string>`MIN(${personnelWorkAreas.startDate})`.as('earliestStartDate'),
        latestEndDate: sql<string>`MAX(${personnelWorkAreas.endDate})`.as('latestEndDate'),
        totalWorkDays: sql<number>`
          SUM(
            CASE 
              WHEN ${personnelWorkAreas.endDate} IS NOT NULL THEN
                ${personnelWorkAreas.endDate}::date - ${personnelWorkAreas.startDate}::date + 1
              ELSE
                CURRENT_DATE - ${personnelWorkAreas.startDate}::date + 1
            END
          )
        `.as('totalWorkDays')
      })
      .from(personnelWorkAreas)
      .where(eq(personnelWorkAreas.personnelId, personnelId));

    if (!summaryData || summaryData.totalAssignments === 0) {
      return res.status(404).json({
        success: false,
        error: 'NO_WORK_HISTORY',
        message: 'Bu personel için çalışma geçmişi bulunamadı.'
      });
    }

    res.json({
      success: true,
      message: 'Personel çalışma geçmişi özeti başarıyla getirildi.',
      data: {
        summary: {
          totalAssignments: summaryData.totalAssignments,
          activeAssignments: summaryData.activeAssignments,
          completedAssignments: summaryData.completedAssignments,
          uniqueWorkAreas: summaryData.uniqueWorkAreas,
          uniqueProjects: summaryData.uniqueProjects,
          totalWorkDays: summaryData.totalWorkDays,
          earliestStartDate: summaryData.earliestStartDate,
          latestEndDate: summaryData.latestEndDate
        }
      }
    });
  } catch (error) {
    console.error('Personel çalışma geçmişi özeti getirme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'WORK_HISTORY_SUMMARY_ERROR',
      message: 'Personel çalışma geçmişi özeti getirilirken hata oluştu.'
    });
  }
});

export default router;
