import { Router } from 'express';
import { db } from './db.js';
import { eq, and, ilike, desc, asc, like, or, ne, inArray } from 'drizzle-orm';
import { 
  workAreas, cities, personnel, personnelPositions,
  insertWorkAreaSchema, updateWorkAreaSchema,
  type InsertWorkArea, type UpdateWorkArea, type WorkArea
} from '../shared/schema.js';
import { z } from 'zod';
import { authenticateJWT, filterByWorkArea, requireAdmin, type AuthRequest } from './hierarchical-auth.js';

const router = Router();

/**
 * @swagger
 * /api/secure/getWorkAreas:
 *   get:
 *     summary: Çalışma Alanları Listesi
 *     description: Tüm çalışma alanlarının listesini getirir
 *     tags: [Çalışma Alanı İşlemleri]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Çalışma alanı adında arama yapmak için
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Sadece aktif çalışma alanlarını getirmek için
 *       - in: query
 *         name: cityId
 *         schema:
 *           type: integer
 *         description: Belirli şehirdeki çalışma alanlarını filtrelemek için
 *     responses:
 *       200:
 *         description: Çalışma alanları başarıyla getirildi
 *       401:
 *         description: Geçersiz API anahtarı
 */
router.get('/getWorkAreas', authenticateJWT, filterByWorkArea, async (req: AuthRequest, res) => {
  try {
    const { search, isActive, cityId, managerId, managerName } = req.query;
    
    // Base query with joins
    let query = db
      .select({
        id: workAreas.id,
        name: workAreas.name,
        cityId: workAreas.cityId,
        address: workAreas.address,
        managerId: workAreas.managerId,
        startDate: workAreas.startDate,
        endDate: workAreas.endDate,
        isActive: workAreas.isActive,
        // Join data
        cityName: cities.name,
        managerName: personnel.name,
        managerSurname: personnel.surname
      })
      .from(workAreas)
      .leftJoin(cities, eq(workAreas.cityId, cities.id))
      .leftJoin(personnel, eq(workAreas.managerId, personnel.id));

    // Filters
    const whereConditions = [];
    
    if (search) {
      whereConditions.push(
        or(
          ilike(workAreas.name, `%${search}%`),
          ilike(workAreas.address, `%${search}%`)
        )
      );
    }
    
    if (isActive === 'true') {
      whereConditions.push(eq(workAreas.isActive, true));
    } else if (isActive === 'false') {
      whereConditions.push(eq(workAreas.isActive, false));
    }

    if (cityId) {
      whereConditions.push(eq(workAreas.cityId, parseInt(cityId as string)));
    }

    // Yönetici ID ile filtreleme
    if (managerId) {
      whereConditions.push(eq(workAreas.managerId, parseInt(managerId as string)));
    }

    // Yönetici adı ile filtreleme
    if (managerName) {
      whereConditions.push(
        or(
          ilike(personnel.name, `%${managerName}%`),
          ilike(personnel.surname, `%${managerName}%`)
        )
      );
    }

    // Hierarchical access control - kullanıcının yetkili olduğu work area'ları filtrele
    if (req.workAreaFilter !== null && req.workAreaFilter !== undefined) {
      // Kullanıcı sadece belirli work area'lara erişebilir
      if (req.workAreaFilter.length > 0) {
        whereConditions.push(inArray(workAreas.id, req.workAreaFilter));
      } else {
        // Kullanıcının hiçbir work area'ya erişimi yok
        whereConditions.push(eq(workAreas.id, -1)); // Hiçbir sonuç döndürmez
      }
    }
    // req.workAreaFilter === null ise CORPORATE level - hiçbir filtre ekleme

    if (whereConditions.length > 0) {
      query = query.where(and(...whereConditions)) as any;
    }

    // Execute query with ordering
    const workAreasList = await query.orderBy(desc(workAreas.id));
    
    res.json({
      success: true,
      message: 'Çalışma alanları başarıyla getirildi.',
      data: {
        workAreas: workAreasList,
        totalCount: workAreasList.length
      }
    });
  } catch (error) {
    console.error('Çalışma alanları listesi getirme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'WORK_AREAS_FETCH_ERROR',
      message: 'Çalışma alanları getirilirken hata oluştu.'
    });
  }
});

/**
 * @swagger
 * /api/secure/addWorkArea:
 *   post:
 *     summary: Yeni Çalışma Alanı Oluşturma
 *     description: Yeni bir çalışma alanı kaydı oluşturur
 *     tags: [Çalışma Alanı İşlemleri]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - cityId
 *               - startDate
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *                 description: Çalışma alanı adı
 *               cityId:
 *                 type: integer
 *                 description: Şehir ID'si
 *               address:
 *                 type: string
 *                 maxLength: 255
 *                 description: Adres bilgisi
 *               managerId:
 *                 type: integer
 *                 description: Yönetici personel ID'si
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: Başlangıç tarihi (YYYY-MM-DD)
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: Bitiş tarihi (YYYY-MM-DD)
 *               isActive:
 *                 type: boolean
 *                 default: true
 *                 description: Aktif mi?
 */
router.post('/addWorkArea', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    // Request body validasyonu
    const validationResult = insertWorkAreaSchema.safeParse(req.body);
    
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
    
    const workAreaData = validationResult.data;
    
    // Foreign key validation - check if city exists
    if (workAreaData.cityId) {
      const cityExists = await db
        .select({ id: cities.id })
        .from(cities)
        .where(eq(cities.id, workAreaData.cityId));
        
      if (cityExists.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_CITY_ID',
          message: `Belirtilen şehir ID'si (${workAreaData.cityId}) bulunamadı.`
        });
      }
    }
    
    // Foreign key validation - check if manager exists  
    if (workAreaData.managerId) {
      const managerExists = await db
        .select({ id: personnel.id })
        .from(personnel)
        .where(eq(personnel.id, workAreaData.managerId));
        
      if (managerExists.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_MANAGER_ID',
          message: `Belirtilen yönetici ID'si (${workAreaData.managerId}) bulunamadı.`
        });
      }
    }
    
    // Yeni çalışma alanı oluştur
    const userId = (req as any).userContext?.userId || (req as any).user?.id;
    const [newWorkArea] = await db
      .insert(workAreas)
      .values({
        ...workAreaData,
        createdBy: userId,
        updatedBy: userId
      })
      .returning();
    
    // Yeni oluşturulan çalışma alanının detaylı bilgilerini getir
    const [workAreaDetail] = await db
      .select({
        id: workAreas.id,
        name: workAreas.name,
        cityId: workAreas.cityId,
        address: workAreas.address,
        managerId: workAreas.managerId,
        startDate: workAreas.startDate,
        endDate: workAreas.endDate,
        isActive: workAreas.isActive,
        // Join data
        cityName: cities.name,
        managerName: personnel.name,
        managerSurname: personnel.surname
      })
      .from(workAreas)
      .leftJoin(cities, eq(workAreas.cityId, cities.id))
      .leftJoin(personnel, eq(workAreas.managerId, personnel.id))
      .where(eq(workAreas.id, newWorkArea.id));
    
    res.status(201).json({
      success: true,
      message: 'Çalışma alanı başarıyla oluşturuldu.',
      data: {
        workArea: workAreaDetail
      }
    });
    
  } catch (error) {
    console.error('Çalışma alanı oluşturma hatası:', error);
    res.status(500).json({
      success: false,
      error: 'WORK_AREA_CREATE_ERROR',
      message: 'Çalışma alanı oluşturulurken hata oluştu.'
    });
  }
});

/**
 * @swagger
 * /api/secure/updateWorkArea/{id}:
 *   put:
 *     summary: Çalışma Alanı Güncelleme
 *     description: Mevcut bir çalışma alanının bilgilerini günceller
 *     tags: [Çalışma Alanı İşlemleri]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Çalışma alanı ID
 */
router.put('/updateWorkArea/:id', authenticateJWT, filterByWorkArea, async (req: AuthRequest, res) => {
  try {
    const workAreaId = parseInt(req.params.id);
    
    // Hierarchical access control - kullanıcının bu work area'yı güncelleme yetkisi var mı?
    if (req.workAreaFilter !== null && req.workAreaFilter !== undefined) {
      if (!req.workAreaFilter.includes(workAreaId)) {
        return res.status(403).json({
          success: false,
          error: 'WORK_AREA_ACCESS_DENIED',
          message: 'Bu çalışma alanını güncelleme yetkiniz bulunmamaktadır.'
        });
      }
    }
    
    // Çalışma alanının var olduğunu kontrol et
    const existingWorkArea = await db
      .select({ id: workAreas.id })
      .from(workAreas)
      .where(eq(workAreas.id, workAreaId));
      
    if (existingWorkArea.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'WORK_AREA_NOT_FOUND',
        message: 'Çalışma alanı bulunamadı.'
      });
    }
    
    // Request body validasyonu
    const validationResult = updateWorkAreaSchema.safeParse(req.body);
    
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
    
    // Foreign key validations if provided
    if (updateData.cityId) {
      const cityExists = await db
        .select({ id: cities.id })
        .from(cities)
        .where(eq(cities.id, updateData.cityId));
        
      if (cityExists.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_CITY_ID',
          message: `Belirtilen şehir ID'si (${updateData.cityId}) bulunamadı.`
        });
      }
    }
    
    if (updateData.managerId) {
      const managerExists = await db
        .select({ id: personnel.id })
        .from(personnel)
        .where(eq(personnel.id, updateData.managerId));
        
      if (managerExists.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_MANAGER_ID',
          message: `Belirtilen yönetici ID'si (${updateData.managerId}) bulunamadı.`
        });
      }
    }
    
    // Çalışma alanını güncelle
    const userId = (req as any).userContext?.userId || (req as any).user?.id;
    await db
      .update(workAreas)
      .set({
        ...updateData,
        updatedBy: userId,
        updatedAt: new Date()
      })
      .where(eq(workAreas.id, workAreaId));
    
    // Güncellenmiş çalışma alanının detaylı bilgilerini getir
    const [updatedWorkArea] = await db
      .select({
        id: workAreas.id,
        name: workAreas.name,
        cityId: workAreas.cityId,
        address: workAreas.address,
        managerId: workAreas.managerId,
        startDate: workAreas.startDate,
        endDate: workAreas.endDate,
        isActive: workAreas.isActive,
        // Join data
        cityName: cities.name,
        managerName: personnel.name,
        managerSurname: personnel.surname
      })
      .from(workAreas)
      .leftJoin(cities, eq(workAreas.cityId, cities.id))
      .leftJoin(personnel, eq(workAreas.managerId, personnel.id))
      .where(eq(workAreas.id, workAreaId));
    
    res.json({
      success: true,
      message: 'Çalışma alanı başarıyla güncellendi.',
      data: {
        workArea: updatedWorkArea
      }
    });
    
  } catch (error) {
    console.error('Çalışma alanı güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'WORK_AREA_UPDATE_ERROR',
      message: 'Çalışma alanı güncellenirken hata oluştu.'
    });
  }
});

/**
 * @swagger
 * /api/secure/deleteWorkArea/{id}:
 *   delete:
 *     summary: Çalışma Alanı Silme (Sadece Admin)
 *     description: Mevcut bir çalışma alanını siler. Bu işlem sadece CORPORATE seviyesindeki adminler tarafından yapılabilir.
 *     tags: [Çalışma Alanı İşlemleri]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Silinecek çalışma alanının ID'si
 *     responses:
 *       200:
 *         description: Çalışma alanı başarıyla silindi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Çalışma alanı başarıyla silindi."
 *       403:
 *         description: Admin yetkisi gerekli
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "ADMIN_ACCESS_REQUIRED"
 *                 message:
 *                   type: string
 *                   example: "Bu işlem için admin yetkisine sahip olmanız gerekiyor."
 *       404:
 *         description: Çalışma alanı bulunamadı
 *       500:
 *         description: Sunucu hatası
 */
router.delete('/deleteWorkArea/:id', authenticateJWT, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const workAreaId = parseInt(req.params.id);
    
    if (isNaN(workAreaId)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_WORK_AREA_ID',
        message: 'Geçersiz çalışma alanı ID\'si.'
      });
    }
    
    // Çalışma alanının var olduğunu kontrol et
    const existingWorkArea = await db
      .select({ 
        id: workAreas.id,
        name: workAreas.name,
        isActive: workAreas.isActive
      })
      .from(workAreas)
      .where(eq(workAreas.id, workAreaId))
      .limit(1);
      
    if (existingWorkArea.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'WORK_AREA_NOT_FOUND',
        message: 'Çalışma alanı bulunamadı.'
      });
    }

    // Soft delete - isActive false yapıp silinmiş olarak işaretle
    const result = await db
      .update(workAreas)
      .set({ 
        isActive: false
      })
      .where(eq(workAreas.id, workAreaId))
      .returning({ id: workAreas.id });

    if (result.length === 0) {
      return res.status(500).json({
        success: false,
        error: 'DELETE_FAILED',
        message: 'Çalışma alanı silinirken hata oluştu.'
      });
    }

    // Audit log kaydı
    console.log(`[ADMIN DELETE] Work Area ${workAreaId} (${existingWorkArea[0].name}) deleted by admin user ${req.userContext?.userId}`);

    res.json({
      success: true,
      message: `Çalışma alanı "${existingWorkArea[0].name}" başarıyla silindi.`
    });

  } catch (error) {
    console.error('Work area deletion error:', error);
    res.status(500).json({
      success: false,
      error: 'DELETE_ERROR',
      message: 'Çalışma alanı silinirken hata oluştu.'
    });
  }
});

export default router;