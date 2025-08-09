import { Router } from 'express';
import { db } from './db.js';
import { eq, and, ilike, desc, asc, like, or, ne } from 'drizzle-orm';
import { 
  personnel, countries, cities, personnelPositions, workAreas, personnelWorkAreas,
  insertPersonnelSchema, type InsertPersonnel, type Personnel
} from '../shared/schema.js';
import { z } from 'zod';
import { authenticateToken } from './auth.js';
import { 
  auditableInsert,
  auditableUpdate,
  auditableDelete
} from './audit-middleware.js';

const router = Router();

/**
 * @swagger
 * /api/secure/personnel:
 *   get:
 *     summary: Personel Listesi
 *     description: Tüm personelleri listeler (ülke, şehir, pozisyon bilgileri ile birlikte)
 *     tags: [Personel İşlemleri]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Ad, soyad veya TC no'da arama yapmak için
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Sadece aktif personelleri getirmek için
 *       - in: query
 *         name: workAreaId
 *         schema:
 *           type: integer
 *         description: Belirli çalışma alanındaki personelleri filtrelemek için
 *     responses:
 *       200:
 *         description: Personeller başarıyla getirildi
 *       401:
 *         description: Geçersiz API anahtarı
 */
router.get('/personnel', authenticateToken, async (req, res) => {
  try {
    const { search, active, workAreaId } = req.query;
    
    // Base query with joins
    let query = db
      .select({
        id: personnel.id,
        tcNo: personnel.tcNo,
        name: personnel.name,
        surname: personnel.surname,
        birthdate: personnel.birthdate,
        address: personnel.address,
        phoneNo: personnel.phoneNo,
        status: personnel.status,
        isActive: personnel.isActive,
        // Join data
        nationName: countries.name,
        birthplaceName: cities.name
      })
      .from(personnel)
      .leftJoin(countries, eq(personnel.nationId, countries.id))
      .leftJoin(cities, eq(personnel.birthplaceId, cities.id));

    // Filters
    const whereConditions = [];
    
    if (search) {
      whereConditions.push(
        or(
          ilike(personnel.name, `%${search}%`),
          ilike(personnel.surname, `%${search}%`),
          ilike(personnel.tcNo, `%${search}%`)
        )
      );
    }
    
    if (active === 'true') {
      whereConditions.push(eq(personnel.isActive, true));
    } else if (active === 'false') {
      whereConditions.push(eq(personnel.isActive, false));
    }

    if (whereConditions.length > 0) {
      query.where(and(...whereConditions));
    }

    // Execute query with ordering
    const personnelList = await query.orderBy(desc(personnel.id));
    
    res.json({
      success: true,
      message: 'Personeller başarıyla getirildi.',
      data: {
        personnel: personnelList,
        totalCount: personnelList.length
      }
    });
  } catch (error) {
    console.error('Personel listesi getirme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'PERSONNEL_FETCH_ERROR',
      message: 'Personeller getirilirken hata oluştu.'
    });
  }
});

/**
 * @swagger
 * /api/secure/personnel/{id}:
 *   get:
 *     summary: Personel Detayı
 *     description: Belirli bir personelin detaylı bilgilerini getirir
 *     tags: [Personel İşlemleri]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Personel ID
 *     responses:
 *       200:
 *         description: Personel detayı başarıyla getirildi
 *       404:
 *         description: Personel bulunamadı
 */
router.get('/personnel/:id', authenticateToken, async (req, res) => {
  try {
    const personnelId = parseInt(req.params.id);
    
    const [personnelDetail] = await db
      .select({
        id: personnel.id,
        tcNo: personnel.tcNo,
        name: personnel.name,
        surname: personnel.surname,
        birthdate: personnel.birthdate,
        nationId: personnel.nationId,
        birthplaceId: personnel.birthplaceId,
        address: personnel.address,
        phoneNo: personnel.phoneNo,
        status: personnel.status,
        isActive: personnel.isActive,
        // Join data
        nationName: countries.name,
        birthplaceName: cities.name
      })
      .from(personnel)
      .leftJoin(countries, eq(personnel.nationId, countries.id))
      .leftJoin(cities, eq(personnel.birthplaceId, cities.id))
      .where(eq(personnel.id, personnelId));

    if (!personnelDetail) {
      return res.status(404).json({
        success: false,
        error: 'PERSONNEL_NOT_FOUND',
        message: 'Personel bulunamadı.'
      });
    }
    
    res.json({
      success: true,
      message: 'Personel detayı başarıyla getirildi.',
      data: {
        personnel: personnelDetail
      }
    });
  } catch (error) {
    console.error('Personel detayı getirme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'PERSONNEL_DETAIL_ERROR',
      message: 'Personel detayı getirilirken hata oluştu.'
    });
  }
});

/**
 * @swagger
 * /api/secure/personnel:
 *   post:
 *     summary: Yeni Personel Oluşturma
 *     description: Yeni bir personel kaydı oluşturur
 *     tags: [Personel İşlemleri]
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
 *               - surname
 *             properties:
 *               tcNo:
 *                 type: string
 *                 description: TC Kimlik Numarası (11 haneli, benzersiz)
 *               name:
 *                 type: string
 *                 maxLength: 50
 *                 description: Personel adı
 *               surname:
 *                 type: string
 *                 maxLength: 50
 *                 description: Personel soyadı
 *               birthdate:
 *                 type: string
 *                 format: date
 *                 description: Doğum tarihi (YYYY-MM-DD)
 *               nationId:
 *                 type: integer
 *                 description: Ülke ID (countries tablosundan)
 *               birthplaceId:
 *                 type: integer
 *                 description: Doğum yeri ID (cities tablosundan)
 *               address:
 *                 type: string
 *                 maxLength: 255
 *                 description: Adres bilgisi
 *               phoneNo:
 *                 type: string
 *                 maxLength: 50
 *                 description: Telefon numarası
 *               status:
 *                 type: string
 *                 maxLength: 20
 *                 description: Personel durumu (aktif, pasif, izinli, vb.)
 *               isActive:
 *                 type: boolean
 *                 default: true
 *                 description: Personel aktif mi?
 *     responses:
 *       201:
 *         description: Personel başarıyla oluşturuldu
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
 *                   example: "Personel başarıyla oluşturuldu."
 *                 data:
 *                   type: object
 *                   properties:
 *                     personnel:
 *                       type: object
 *       400:
 *         description: Geçersiz veri
 *       409:
 *         description: TC Kimlik Numarası zaten kayıtlı
 *       401:
 *         description: Geçersiz API anahtarı
 */
router.post('/personnel', authenticateToken, async (req, res) => {
  try {
    // Request body validasyonu
    const validationResult = insertPersonnelSchema.safeParse(req.body);
    
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
    
    const personnelData = validationResult.data;
    
    // TC Kimlik Numarası benzersizlik kontrolü (eğer TC No girilmişse)
    if (personnelData.tcNo) {
      const existingPersonnel = await db
        .select({ id: personnel.id })
        .from(personnel)
        .where(eq(personnel.tcNo, personnelData.tcNo));
        
      if (existingPersonnel.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'DUPLICATE_TC_NO',
          message: 'Bu TC Kimlik Numarası zaten kayıtlı.'
        });
      }
    }
    
    // Yeni personel oluştur
    const [newPersonnel] = await db
      .insert(personnel)
      .values(personnelData)
      .returning();
    
    // Yeni oluşturulan personelin detaylı bilgilerini getir
    const [personnelDetail] = await db
      .select({
        id: personnel.id,
        tcNo: personnel.tcNo,
        name: personnel.name,
        surname: personnel.surname,
        birthdate: personnel.birthdate,
        nationId: personnel.nationId,
        birthplaceId: personnel.birthplaceId,
        address: personnel.address,
        phoneNo: personnel.phoneNo,
        status: personnel.status,
        isActive: personnel.isActive,
        // Join data
        nationName: countries.name,
        birthplaceName: cities.name
      })
      .from(personnel)
      .leftJoin(countries, eq(personnel.nationId, countries.id))
      .leftJoin(cities, eq(personnel.birthplaceId, cities.id))
      .where(eq(personnel.id, newPersonnel.id));
    
    res.status(201).json({
      success: true,
      message: 'Personel başarıyla oluşturuldu.',
      data: {
        personnel: personnelDetail
      }
    });
    
  } catch (error) {
    console.error('Personel oluşturma hatası:', error);
    res.status(500).json({
      success: false,
      error: 'PERSONNEL_CREATE_ERROR',
      message: 'Personel oluşturulurken hata oluştu.'
    });
  }
});

/**
 * @swagger
 * /api/secure/personnel/{id}:
 *   put:
 *     summary: Personel Güncelleme
 *     description: Mevcut bir personelin bilgilerini günceller
 *     tags: [Personel İşlemleri]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Personel ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tcNo:
 *                 type: string
 *                 description: TC Kimlik Numarası
 *               name:
 *                 type: string
 *                 maxLength: 50
 *                 description: Personel adı
 *               surname:
 *                 type: string
 *                 maxLength: 50
 *                 description: Personel soyadı
 *               birthdate:
 *                 type: string
 *                 format: date
 *                 description: Doğum tarihi
 *               nationId:
 *                 type: integer
 *                 description: Ülke ID
 *               birthplaceId:
 *                 type: integer
 *                 description: Doğum yeri ID
 *               address:
 *                 type: string
 *                 maxLength: 255
 *                 description: Adres bilgisi
 *               phoneNo:
 *                 type: string
 *                 maxLength: 50
 *                 description: Telefon numarası
 *               status:
 *                 type: string
 *                 maxLength: 20
 *                 description: Personel durumu
 *               isActive:
 *                 type: boolean
 *                 description: Personel aktif mi?
 *     responses:
 *       200:
 *         description: Personel başarıyla güncellendi
 *       404:
 *         description: Personel bulunamadı
 *       400:
 *         description: Geçersiz veri
 *       409:
 *         description: TC Kimlik Numarası zaten başka bir personel tarafından kullanılıyor
 */
router.put('/personnel/:id', authenticateToken, async (req, res) => {
  try {
    const personnelId = parseInt(req.params.id);
    
    // Önce personelin var olup olmadığını kontrol et
    const existingPersonnel = await db
      .select({ id: personnel.id })
      .from(personnel)
      .where(eq(personnel.id, personnelId));
      
    if (existingPersonnel.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'PERSONNEL_NOT_FOUND',
        message: 'Güncellenecek personel bulunamadı.'
      });
    }
    
    // Request body validasyonu (insert schema'yı partial yapıp kullan)
    const updateSchema = insertPersonnelSchema.partial();
    const validationResult = updateSchema.safeParse(req.body);
    
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
    
    // TC Kimlik Numarası benzersizlik kontrolü (eğer TC No güncelleniyorsa)
    if (updateData.tcNo) {
      const duplicateTc = await db
        .select({ id: personnel.id })
        .from(personnel)
        .where(and(
          eq(personnel.tcNo, updateData.tcNo),
          ne(personnel.id, personnelId)
        ));
        
      if (duplicateTc.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'DUPLICATE_TC_NO',
          message: 'Bu TC Kimlik Numarası zaten başka bir personel tarafından kullanılıyor.'
        });
      }
    }
    
    // Personeli güncelle
    const [updatedPersonnel] = await db
      .update(personnel)
      .set(updateData)
      .where(eq(personnel.id, personnelId))
      .returning();
    
    // Güncellenmiş personelin detaylı bilgilerini getir
    const [personnelDetail] = await db
      .select({
        id: personnel.id,
        tcNo: personnel.tcNo,
        name: personnel.name,
        surname: personnel.surname,
        birthdate: personnel.birthdate,
        nationId: personnel.nationId,
        birthplaceId: personnel.birthplaceId,
        address: personnel.address,
        phoneNo: personnel.phoneNo,
        status: personnel.status,
        isActive: personnel.isActive,
        // Join data
        nationName: countries.name,
        birthplaceName: cities.name
      })
      .from(personnel)
      .leftJoin(countries, eq(personnel.nationId, countries.id))
      .leftJoin(cities, eq(personnel.birthplaceId, cities.id))
      .where(eq(personnel.id, personnelId));
    
    res.json({
      success: true,
      message: 'Personel başarıyla güncellendi.',
      data: {
        personnel: personnelDetail
      }
    });
    
  } catch (error) {
    console.error('Personel güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'PERSONNEL_UPDATE_ERROR',
      message: 'Personel güncellenirken hata oluştu.'
    });
  }
});

export default router;