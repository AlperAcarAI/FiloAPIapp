import { Router } from 'express';
import { db } from './db.js';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { projects } from '../shared/schema.js';
import { 
  authenticateJWT, 
  filterByWorkArea,
  type AuthRequest 
} from './hierarchical-auth.js';

const router = Router();

// Apply hierarchical authentication and work area filtering to all routes
router.use(authenticateJWT);
router.use(filterByWorkArea);

// Completion rate update schema
const completionUpdateSchema = z.object({
  completionRate: z.union([z.string(), z.number()]).transform(val => 
    val !== undefined && val !== null ? String(val) : '0'
  ),
  notes: z.string().optional()
});

/**
 * @swagger
 * /api/secure/projects/{id}/completion:
 *   put:
 *     summary: Proje Tamamlanma Oranı Güncelle
 *     description: Bir projenin tamamlanma oranını günceller (0-100 arasında)
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
 *               completionRate:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 description: Tamamlanma oranı (0-100)
 *                 example: 75.5
 *               notes:
 *                 type: string
 *                 description: İlerleme notları (opsiyonel)
 *                 example: "Yapısal işler tamamlandı"
 *             required:
 *               - completionRate
 *     responses:
 *       200:
 *         description: Tamamlanma oranı başarıyla güncellendi
 *       400:
 *         description: Geçersiz tamamlanma oranı
 *       404:
 *         description: Proje bulunamadı
 */
router.put('/projects/:id/completion', async (req: AuthRequest, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const validationResult = completionUpdateSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Geçersiz tamamlanma oranı formatı.',
        details: validationResult.error.errors
      });
    }
    
    const { completionRate, notes } = validationResult.data;
    
    // Validate completion rate range
    const rate = parseFloat(completionRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_COMPLETION_RATE',
        message: 'Tamamlanma oranı 0-100 arasında olmalıdır.'
      });
    }
    
    // Check if project exists
    const existingProject = await db
      .select({ 
        id: projects.id, 
        code: projects.code,
        status: projects.status 
      })
      .from(projects)
      .where(eq(projects.id, projectId));
      
    if (existingProject.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'PROJECT_NOT_FOUND',
        message: 'Güncellenecek proje bulunamadı.'
      });
    }
    
    // Update completion rate
    const [updatedProject] = await db
      .update(projects)
      .set({
        completionRate: completionRate,
        updatedBy: req.userContext?.userId,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId))
      .returning({
        id: projects.id,
        code: projects.code,
        completionRate: projects.completionRate,
        status: projects.status,
        updatedAt: projects.updatedAt
      });
    
    // Automatically update status based on completion rate
    let newStatus = existingProject[0].status;
    if (rate === 100 && newStatus !== 'completed') {
      newStatus = 'completed';
      await db
        .update(projects)
        .set({ status: 'completed' })
        .where(eq(projects.id, projectId));
    } else if (rate > 0 && rate < 100 && newStatus === 'planned') {
      newStatus = 'active';
      await db
        .update(projects)
        .set({ status: 'active' })
        .where(eq(projects.id, projectId));
    }
    
    res.json({
      success: true,
      message: 'Proje tamamlanma oranı başarıyla güncellendi.',
      data: {
        project: {
          ...updatedProject,
          status: newStatus,
          notes: notes || null
        }
      }
    });
    
  } catch (error) {
    console.error('Tamamlanma oranı güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'COMPLETION_UPDATE_ERROR',
      message: 'Tamamlanma oranı güncellenirken hata oluştu.',
      debug: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * @swagger
 * /api/secure/projects/completion-stats:
 *   get:
 *     summary: Tamamlanma Oranı İstatistikleri
 *     description: Tüm projelerin tamamlanma oranı istatistiklerini getirir
 *     tags: [Proje İşlemleri]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: İstatistikler başarıyla getirildi
 */
router.get('/projects/completion-stats', async (req: AuthRequest, res) => {
  try {
    const stats = await db
      .select({
        id: projects.id,
        code: projects.code,
        status: projects.status,
        completionRate: projects.completionRate
      })
      .from(projects)
      .where(eq(projects.isActive, true));
    
    const analytics = {
      totalProjects: stats.length,
      byStatus: {
        planned: stats.filter(p => p.status === 'planned').length,
        active: stats.filter(p => p.status === 'active').length,
        completed: stats.filter(p => p.status === 'completed').length,
        cancelled: stats.filter(p => p.status === 'cancelled').length
      },
      completionRanges: {
        notStarted: stats.filter(p => parseFloat(p.completionRate || '0') === 0).length,
        inProgress: stats.filter(p => {
          const rate = parseFloat(p.completionRate || '0');
          return rate > 0 && rate < 100;
        }).length,
        completed: stats.filter(p => parseFloat(p.completionRate || '0') === 100).length
      },
      averageCompletion: stats.length > 0 ? 
        stats.reduce((sum, p) => sum + parseFloat(p.completionRate || '0'), 0) / stats.length : 0
    };
    
    res.json({
      success: true,
      message: 'Tamamlanma istatistikleri başarıyla getirildi.',
      data: analytics
    });
    
  } catch (error) {
    console.error('Tamamlanma istatistikleri hatası:', error);
    res.status(500).json({
      success: false,
      error: 'STATS_ERROR',
      message: 'İstatistikler getirilirken hata oluştu.'
    });
  }
});

export default router;