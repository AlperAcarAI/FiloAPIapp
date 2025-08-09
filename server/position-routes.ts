import { Router } from 'express';
import { db } from './db.js';
import { eq, and, ilike, desc, asc, like, or, ne } from 'drizzle-orm';
import { 
  personnelPositions,
  insertPersonnelPositionSchema, updatePersonnelPositionSchema,
  type InsertPersonnelPosition, type UpdatePersonnelPosition, type PersonnelPosition
} from '../shared/schema.js';
import { z } from 'zod';

// JWT Token Authentication middleware
const authenticateJWT = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Erişim token bulunamadı. Lütfen giriş yapın.'
    });
  }
  
  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  // For now, accept any valid looking token format
  // In production, you would verify the JWT token here
  if (token && token.length > 10) {
    req.user = { id: 1 }; // Mock user for now
    next();
  } else {
    return res.status(401).json({
      success: false,
      message: 'Geçersiz token formatı.'
    });
  }
};

const router = Router();

/**
 * @swagger
 * /api/secure/getPersonnelPositions:
 *   get:
 *     summary: Personel Pozisyonları Listesi
 *     description: Tüm personel pozisyonlarının listesini getirir
 *     tags: [Personel Pozisyon İşlemleri]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Pozisyon adında arama yapmak için
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Sadece aktif pozisyonları getirmek için
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Sayfa başı kayıt sayısı
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Başlangıç indeksi
 *     responses:
 *       200:
 *         description: Personel pozisyonları başarıyla getirildi
 *       401:
 *         description: Geçersiz API anahtarı
 */
router.get('/getPersonnelPositions', authenticateJWT, async (req, res) => {
  try {
    const { search, isActive, limit = '20', offset = '0' } = req.query;
    
    // Base query
    let query = db
      .select({
        id: personnelPositions.id,
        name: personnelPositions.name,
        description: personnelPositions.description,
        isActive: personnelPositions.isActive
      })
      .from(personnelPositions);

    // Filters
    const whereConditions = [];
    
    if (search) {
      whereConditions.push(
        or(
          ilike(personnelPositions.name, `%${search}%`),
          ilike(personnelPositions.description, `%${search}%`)
        )
      );
    }
    
    if (isActive === 'true') {
      whereConditions.push(eq(personnelPositions.isActive, true));
    } else if (isActive === 'false') {
      whereConditions.push(eq(personnelPositions.isActive, false));
    }

    if (whereConditions.length > 0) {
      query = query.where(and(...whereConditions));
    }

    // Execute query with ordering and pagination
    const positionsList = await query
      .orderBy(desc(personnelPositions.id))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));
    
    res.json({
      success: true,
      message: 'Personel pozisyonları başarıyla getirildi.',
      data: {
        positions: positionsList,
        totalCount: positionsList.length,
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string)
        }
      }
    });
  } catch (error) {
    console.error('Personel pozisyonları listesi getirme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'POSITIONS_FETCH_ERROR',
      message: 'Personel pozisyonları getirilirken hata oluştu.'
    });
  }
});

/**
 * @swagger
 * /api/secure/addPersonnelPosition:
 *   post:
 *     summary: Yeni Personel Pozisyonu Oluşturma
 *     description: Yeni bir personel pozisyonu kaydı oluşturur
 *     tags: [Personel Pozisyon İşlemleri]
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
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 50
 *                 description: Pozisyon adı (benzersiz)
 *               description:
 *                 type: string
 *                 maxLength: 255
 *                 description: Pozisyon açıklaması
 *               isActive:
 *                 type: boolean
 *                 default: true
 *                 description: Aktif mi?
 */
router.post('/addPersonnelPosition', authenticateJWT, async (req, res) => {
  try {
    // Request body validasyonu
    const validationResult = insertPersonnelPositionSchema.safeParse(req.body);
    
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
    
    const positionData = validationResult.data;
    
    // Pozisyon adı benzersizlik kontrolü
    const existingPosition = await db
      .select({ id: personnelPositions.id })
      .from(personnelPositions)
      .where(eq(personnelPositions.name, positionData.name));
        
    if (existingPosition.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'DUPLICATE_POSITION_NAME',
        message: 'Bu pozisyon adı zaten kayıtlı.'
      });
    }
    
    // Yeni pozisyon oluştur
    const [newPosition] = await db
      .insert(personnelPositions)
      .values(positionData)
      .returning();
    
    res.status(201).json({
      success: true,
      message: 'Personel pozisyonu başarıyla oluşturuldu.',
      data: {
        position: newPosition
      }
    });
    
  } catch (error) {
    console.error('Personel pozisyonu oluşturma hatası:', error);
    res.status(500).json({
      success: false,
      error: 'POSITION_CREATE_ERROR',
      message: 'Personel pozisyonu oluşturulurken hata oluştu.'
    });
  }
});

/**
 * @swagger
 * /api/secure/updatePersonnelPosition/{id}:
 *   put:
 *     summary: Personel Pozisyonu Güncelleme
 *     description: Mevcut bir personel pozisyonunun bilgilerini günceller
 *     tags: [Personel Pozisyon İşlemleri]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Pozisyon ID
 */
router.put('/updatePersonnelPosition/:id', authenticateJWT, async (req, res) => {
  try {
    const positionId = parseInt(req.params.id);
    
    // Pozisyonun var olduğunu kontrol et
    const existingPosition = await db
      .select({ id: personnelPositions.id, name: personnelPositions.name })
      .from(personnelPositions)
      .where(eq(personnelPositions.id, positionId));
      
    if (existingPosition.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'POSITION_NOT_FOUND',
        message: 'Personel pozisyonu bulunamadı.'
      });
    }
    
    // Request body validasyonu
    const validationResult = updatePersonnelPositionSchema.safeParse(req.body);
    
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
    
    // Eğer ad güncelleniyorsa benzersizlik kontrolü yap
    if (updateData.name && updateData.name !== existingPosition[0].name) {
      const nameExists = await db
        .select({ id: personnelPositions.id })
        .from(personnelPositions)
        .where(and(
          eq(personnelPositions.name, updateData.name),
          ne(personnelPositions.id, positionId)
        ));
        
      if (nameExists.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'DUPLICATE_POSITION_NAME',
          message: 'Bu pozisyon adı zaten kayıtlı.'
        });
      }
    }
    
    // Pozisyonu güncelle
    const [updatedPosition] = await db
      .update(personnelPositions)
      .set(updateData)
      .where(eq(personnelPositions.id, positionId))
      .returning();
    
    res.json({
      success: true,
      message: 'Personel pozisyonu başarıyla güncellendi.',
      data: {
        position: updatedPosition
      }
    });
    
  } catch (error) {
    console.error('Personel pozisyonu güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'POSITION_UPDATE_ERROR',
      message: 'Personel pozisyonu güncellenirken hata oluştu.'
    });
  }
});

/**
 * @swagger
 * /api/secure/deletePersonnelPosition/{id}:
 *   delete:
 *     summary: Personel Pozisyonu Silme
 *     description: Personel pozisyonunu soft delete yapar (isActive = false)
 *     tags: [Personel Pozisyon İşlemleri]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Pozisyon ID
 */
router.delete('/deletePersonnelPosition/:id', authenticateJWT, async (req, res) => {
  try {
    const positionId = parseInt(req.params.id);
    
    // Pozisyonun var olduğunu kontrol et
    const existingPosition = await db
      .select({ id: personnelPositions.id })
      .from(personnelPositions)
      .where(eq(personnelPositions.id, positionId));
      
    if (existingPosition.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'POSITION_NOT_FOUND',
        message: 'Personel pozisyonu bulunamadı.'
      });
    }
    
    // Soft delete - isActive durumunu false yap
    await db
      .update(personnelPositions)
      .set({ isActive: false })
      .where(eq(personnelPositions.id, positionId));
    
    res.json({
      success: true,
      message: 'Personel pozisyonu başarıyla silindi.'
    });
    
  } catch (error) {
    console.error('Personel pozisyonu silme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'POSITION_DELETE_ERROR',
      message: 'Personel pozisyonu silinirken hata oluştu.'
    });
  }
});

export default router;