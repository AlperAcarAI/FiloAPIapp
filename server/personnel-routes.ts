import { Router } from 'express';
import { db } from './db.js';
import { eq, and, ilike, desc, asc, like, or, ne } from 'drizzle-orm';
import { 
  personnel, countries, cities, personnelPositions, workAreas, personnelWorkAreas,
  insertPersonnelSchema, type InsertPersonnel, type Personnel
} from '../shared/schema.js';

// Custom validation schema that accepts tcNo as string and converts to bigint
const personnelCreateSchema = z.object({
  tcNo: z.union([
    z.string().transform((val) => BigInt(val)),
    z.bigint(),
    z.undefined()
  ]).optional(),
  name: z.string().min(1).max(50),
  surname: z.string().min(1).max(50),
  birthdate: z.string().optional().nullable(),
  nationId: z.number().int().positive().optional().nullable(),
  birthplaceId: z.number().int().positive().optional().nullable(),
  address: z.string().max(255).optional().nullable(),
  phoneNo: z.string().max(50).optional().nullable(),
  status: z.string().max(20).optional().nullable(),
  isActive: z.boolean().optional().default(true)
});
import { z } from 'zod';
import { authenticateToken } from './auth.js';

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
router.get('/personnel', authenticateJWT, async (req, res) => {
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
    
    // Convert BigInt to string for JSON serialization
    const serializedPersonnelList = personnelList.map(person => ({
      ...person,
      tcNo: person.tcNo ? person.tcNo.toString() : null
    }));
    
    res.json({
      success: true,
      message: 'Personeller başarıyla getirildi.',
      data: {
        personnel: serializedPersonnelList,
        totalCount: serializedPersonnelList.length
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
router.get('/personnel/:id', authenticateJWT, async (req, res) => {
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
    
    // Convert BigInt to string for JSON serialization
    const responseData = {
      ...personnelDetail,
      tcNo: personnelDetail.tcNo ? personnelDetail.tcNo.toString() : null
    };
    
    res.json({
      success: true,
      message: 'Personel detayı başarıyla getirildi.',
      data: {
        personnel: responseData
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
router.post('/personnel', authenticateJWT, async (req, res) => {
  try {
    // Preprocess request body to handle tcNo conversion
    const requestBody = { ...req.body };
    if (requestBody.tcNo && typeof requestBody.tcNo === 'string') {
      try {
        requestBody.tcNo = BigInt(requestBody.tcNo);
      } catch (e) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Geçersiz TC Kimlik Numarası formatı.'
        });
      }
    }
    
    // Request body validasyonu - use original insertPersonnelSchema but omit ID
    const validationSchema = insertPersonnelSchema.omit({ id: true });
    const validationResult = validationSchema.safeParse(requestBody);
    
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
    
    // Foreign key validation - check if country exists
    if (personnelData.nationId) {
      const countryExists = await db
        .select({ id: countries.id })
        .from(countries)
        .where(eq(countries.id, personnelData.nationId));
        
      if (countryExists.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_NATION_ID',
          message: `Belirtilen ülke ID'si (${personnelData.nationId}) bulunamadı.`
        });
      }
    }
    
    // Foreign key validation - check if city exists  
    if (personnelData.birthplaceId) {
      const cityExists = await db
        .select({ id: cities.id })
        .from(cities)
        .where(eq(cities.id, personnelData.birthplaceId));
        
      if (cityExists.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_CITY_ID',
          message: `Belirtilen şehir ID'si (${personnelData.birthplaceId}) bulunamadı.`
        });
      }
    }
    
    // Yeni personel oluştur
    const [newPersonnel] = await db
      .insert(personnel)
      .values(personnelData)
      .returning();
    
    // Yeni oluşturulan personelin detaylı bilgilerini getir (BigInt serialize for JSON)
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
      
    // Convert BigInt to string for JSON serialization
    const responseData = {
      ...personnelDetail,
      tcNo: personnelDetail.tcNo ? personnelDetail.tcNo.toString() : null
    };
    
    res.status(201).json({
      success: true,
      message: 'Personel başarıyla oluşturuldu.',
      data: {
        personnel: responseData
      }
    });
    
  } catch (error) {
    console.error('Personel oluşturma hatası:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    res.status(500).json({
      success: false,
      error: 'PERSONNEL_CREATE_ERROR',
      message: 'Personel oluşturulurken hata oluştu.',
      debug: error instanceof Error ? error.message : String(error)
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
router.put('/personnel/:id', authenticateJWT, async (req, res) => {
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
    
    // Preprocess request body for update
    const requestBody = { ...req.body };
    if (requestBody.tcNo && typeof requestBody.tcNo === 'string') {
      try {
        requestBody.tcNo = BigInt(requestBody.tcNo);
      } catch (e) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Geçersiz TC Kimlik Numarası formatı.'
        });
      }
    }
    
    // Request body validasyonu (update schema)
    const updateSchema = insertPersonnelSchema.omit({ id: true }).partial();
    const validationResult = updateSchema.safeParse(requestBody);
    
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

/**
 * @swagger
 * /api/secure/addPersonnelWorkArea:
 *   post:
 *     summary: Personel Çalışma Alanı Atama
 *     description: Mevcut bir personeli bir çalışma alanına atar
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
 *               - personnelId
 *               - workAreaId
 *               - positionId
 *               - startDate
 *             properties:
 *               personnelId:
 *                 type: integer
 *                 description: Personel ID
 *               workAreaId:
 *                 type: integer
 *                 description: Çalışma alanı ID
 *               positionId:
 *                 type: integer
 *                 description: Pozisyon ID
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
 *                 description: Aktif durumu
 *                 default: true
 *     responses:
 *       201:
 *         description: Personel çalışma alanı ataması başarıyla oluşturuldu
 *       400:
 *         description: Geçersiz veri
 *       404:
 *         description: Personel, çalışma alanı veya pozisyon bulunamadı
 *       409:
 *         description: Personel zaten bu çalışma alanında aktif
 */
router.post('/addPersonnelWorkArea', authenticateJWT, async (req, res) => {
  try {
    const { personnelId, workAreaId, positionId, startDate, endDate, isActive = true } = req.body;
    
    // Required field validation
    if (!personnelId || !workAreaId || !positionId || !startDate) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_REQUIRED_FIELDS',
        message: 'personnelId, workAreaId, positionId ve startDate alanları zorunludur.'
      });
    }

    // Check if personnel exists
    const existingPersonnel = await db
      .select({ id: personnel.id })
      .from(personnel)
      .where(eq(personnel.id, personnelId));
      
    if (existingPersonnel.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'PERSONNEL_NOT_FOUND',
        message: 'Belirtilen personel bulunamadı.'
      });
    }

    // Check if work area exists
    const existingWorkArea = await db
      .select({ id: workAreas.id })
      .from(workAreas)
      .where(eq(workAreas.id, workAreaId));
      
    if (existingWorkArea.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'WORK_AREA_NOT_FOUND',
        message: 'Belirtilen çalışma alanı bulunamadı.'
      });
    }

    // Check if position exists
    const existingPosition = await db
      .select({ id: personnelPositions.id })
      .from(personnelPositions)
      .where(eq(personnelPositions.id, positionId));
      
    if (existingPosition.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'POSITION_NOT_FOUND',
        message: 'Belirtilen pozisyon bulunamadı.'
      });
    }

    // Check for existing active assignment
    const existingAssignment = await db
      .select({ id: personnelWorkAreas.id })
      .from(personnelWorkAreas)
      .where(and(
        eq(personnelWorkAreas.personnelId, personnelId),
        eq(personnelWorkAreas.workAreaId, workAreaId),
        eq(personnelWorkAreas.isActive, true)
      ));
      
    if (existingAssignment.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'DUPLICATE_ASSIGNMENT',
        message: 'Bu personel bu çalışma alanında zaten aktif bir atamaya sahip.'
      });
    }

    // Create the assignment
    const [newAssignment] = await db
      .insert(personnelWorkAreas)
      .values({
        personnelId,
        workAreaId,
        positionId,
        startDate,
        endDate: endDate || null,
        isActive
      })
      .returning();

    res.status(201).json({
      success: true,
      message: 'Personel çalışma alanı ataması başarıyla oluşturuldu.',
      data: {
        personnelWorkArea: newAssignment
      }
    });

  } catch (error) {
    console.error('Personnel work area assignment error:', error);
    res.status(500).json({
      success: false,
      error: 'ASSIGNMENT_CREATE_ERROR',
      message: 'Personel çalışma alanı ataması oluşturulurken hata oluştu.'
    });
  }
});

export default router;