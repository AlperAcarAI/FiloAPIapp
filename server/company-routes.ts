import { Router } from 'express';
import { db } from './db.js';
import { eq, and, ilike, desc, asc } from 'drizzle-orm';
import { 
  companies, cities, countries,
  insertCompanySchema, updateCompanySchema,
  type InsertCompany, type UpdateCompany, type Company
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
 * /api/secure/companies:
 *   get:
 *     summary: Şirket Listesi
 *     description: Tüm şirketleri listeler (şehir ve ülke bilgileri ile birlikte)
 *     tags: [Şirket İşlemleri]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Şirket adında arama yapmak için
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Sadece aktif şirketleri getirmek için
 *       - in: query
 *         name: cityId
 *         schema:
 *           type: integer
 *         description: Belirli şehirdeki şirketleri filtrelemek için
 *     responses:
 *       200:
 *         description: Şirketler başarıyla getirildi
 *       401:
 *         description: Geçersiz API anahtarı
 */
router.get('/companies', authenticateToken, async (req, res) => {
  try {
    const { search, active, cityId } = req.query;
    
    // Base query with joins
    let query = db
      .select({
        id: companies.id,
        name: companies.name,
        taxNo: companies.taxNo,
        taxOffice: companies.taxOffice,
        address: companies.address,
        phone: companies.phone,
        isActive: companies.isActive,
        cityId: companies.cityId,
        cityName: cities.name,
        countryName: countries.name
      })
      .from(companies)
      .leftJoin(cities, eq(companies.cityId, cities.id))
      .leftJoin(countries, eq(cities.countryId, countries.id));

    // Filters
    const whereConditions = [];
    
    if (search) {
      whereConditions.push(ilike(companies.name, `%${search}%`));
    }
    
    if (active !== undefined) {
      whereConditions.push(eq(companies.isActive, active === 'true'));
    }
    
    if (cityId) {
      whereConditions.push(eq(companies.cityId, parseInt(cityId as string)));
    }

    // Apply where conditions manually since we need to modify the query
    let finalQuery = query;
    if (whereConditions.length > 0) {
      // Rebuild query with where conditions
      finalQuery = db
        .select({
          id: companies.id,
          name: companies.name,
          taxNo: companies.taxNo,
          taxOffice: companies.taxOffice,
          address: companies.address,
          phone: companies.phone,
          isActive: companies.isActive,
          cityId: companies.cityId,
          cityName: cities.name,
          countryName: countries.name
        })
        .from(companies)
        .leftJoin(cities, eq(companies.cityId, cities.id))
        .leftJoin(countries, eq(cities.countryId, countries.id))
        .where(and(...whereConditions));
    }

    const result = await finalQuery.orderBy(asc(companies.name));

    res.json({
      success: true,
      message: 'Şirketler başarıyla getirildi.',
      data: {
        companies: result,
        totalCount: result.length
      }
    });

  } catch (error) {
    console.error('Companies fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Şirketler getirilirken hata oluştu.',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

/**
 * @swagger
 * /api/secure/companies/{id}:
 *   get:
 *     summary: Şirket Detayı
 *     description: Belirli bir şirketin detay bilgilerini getirir
 *     tags: [Şirket İşlemleri]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Şirket ID
 *     responses:
 *       200:
 *         description: Şirket detayı başarıyla getirildi
 *       404:
 *         description: Şirket bulunamadı
 */
router.get('/companies/:id', authenticateToken, async (req, res) => {
  try {
    const companyId = parseInt(req.params.id);
    
    if (isNaN(companyId)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz şirket ID.'
      });
    }

    const [company] = await db
      .select({
        id: companies.id,
        name: companies.name,
        taxNo: companies.taxNo,
        taxOffice: companies.taxOffice,
        address: companies.address,
        phone: companies.phone,
        isActive: companies.isActive,
        cityId: companies.cityId,
        cityName: cities.name,
        countryName: countries.name
      })
      .from(companies)
      .leftJoin(cities, eq(companies.cityId, cities.id))
      .leftJoin(countries, eq(cities.countryId, countries.id))
      .where(eq(companies.id, companyId))
      .limit(1);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Şirket bulunamadı.'
      });
    }

    res.json({
      success: true,
      message: 'Şirket detayı başarıyla getirildi.',
      data: { company }
    });

  } catch (error) {
    console.error('Company fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Şirket detayı getirilirken hata oluştu.',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

/**
 * @swagger
 * /api/secure/companies:
 *   post:
 *     summary: Yeni Şirket Ekleme
 *     description: Sisteme yeni şirket ekler. Şirket adı unique kontrolü yapar
 *     tags: [Şirket İşlemleri]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 description: Şirket adı
 *                 example: "ABC Lojistik A.Ş."
 *               taxNo:
 *                 type: string
 *                 description: Vergi numarası
 *                 example: "1234567890"
 *               taxOffice:
 *                 type: string
 *                 description: Vergi dairesi
 *                 example: "Kadıköy Vergi Dairesi"
 *               address:
 *                 type: string
 *                 description: Şirket adresi
 *                 example: "Atatürk Cad. No:123 Kadıköy/İstanbul"
 *               phone:
 *                 type: string
 *                 description: Telefon numarası
 *                 example: "+90 212 555 0123"
 *               cityId:
 *                 type: integer
 *                 description: Şehir ID
 *                 example: 1
 *               isActive:
 *                 type: boolean
 *                 description: Aktif durumu
 *                 example: true
 *     responses:
 *       201:
 *         description: Şirket başarıyla eklendi
 *       400:
 *         description: Geçersiz veri veya şirket zaten mevcut
 *       401:
 *         description: Geçersiz API anahtarı
 */
router.post('/companies', authenticateToken, async (req, res) => {
  try {
    // Body validation
    const validatedData = insertCompanySchema.parse(req.body);

    // Duplicate kontrolü
    const existingCompany = await db.select({ id: companies.id })
      .from(companies)
      .where(eq(companies.name, validatedData.name))
      .limit(1);

    if (existingCompany.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Bu isimde bir şirket zaten mevcut.',
        duplicateField: 'name'
      });
    }

    // Şehir kontrolü (eğer cityId verilmişse)
    if (validatedData.cityId) {
      const cityExists = await db.select({ id: cities.id })
        .from(cities)
        .where(eq(cities.id, validatedData.cityId))
        .limit(1);

      if (cityExists.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Belirtilen şehir bulunamadı.'
        });
      }
    }

    // Audit bilgilerini yakala
    const auditInfo = {
      userId: (req as any).user?.id,
      apiClientId: undefined,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    };

    // Auditable insert
    const [newCompany] = await auditableInsert(
      companies,
      validatedData,
      'companies',
      auditInfo
    );

    res.status(201).json({
      success: true,
      message: 'Şirket başarıyla eklendi.',
      data: { company: newCompany }
    });

  } catch (error) {
    console.error('Company create error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz veri formatı.',
        errors: error.errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Şirket eklenirken hata oluştu.',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

/**
 * @swagger
 * /api/secure/companies/{id}:
 *   put:
 *     summary: Şirket Güncelleme
 *     description: Mevcut şirket bilgilerini günceller
 *     tags: [Şirket İşlemleri]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Şirket ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Şirket adı
 *                 example: "ABC Lojistik A.Ş."
 *               taxNo:
 *                 type: string
 *                 description: Vergi numarası
 *                 example: "1234567890"
 *               taxOffice:
 *                 type: string
 *                 description: Vergi dairesi
 *                 example: "Kadıköy Vergi Dairesi"
 *               address:
 *                 type: string
 *                 description: Şirket adresi
 *                 example: "Atatürk Cad. No:123 Kadıköy/İstanbul"
 *               phone:
 *                 type: string
 *                 description: Telefon numarası
 *                 example: "+90 212 555 0123"
 *               cityId:
 *                 type: integer
 *                 description: Şehir ID
 *                 example: 1
 *               isActive:
 *                 type: boolean
 *                 description: Aktif durumu
 *                 example: true
 *     responses:
 *       200:
 *         description: Şirket başarıyla güncellendi
 *       400:
 *         description: Geçersiz veri
 *       404:
 *         description: Şirket bulunamadı
 */
router.put('/companies/:id', authenticateToken, async (req, res) => {
  try {
    const companyId = parseInt(req.params.id);
    
    if (isNaN(companyId)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz şirket ID.'
      });
    }

    // Body validation
    const validatedData = updateCompanySchema.parse(req.body);

    // Şirket var mı kontrol et
    const existingCompany = await db.select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    if (existingCompany.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Şirket bulunamadı.'
      });
    }

    // İsim duplicate kontrolü (eğer isim güncelleniyorsa)
    if (validatedData.name) {
      const duplicateCompany = await db.select({ id: companies.id })
        .from(companies)
        .where(and(
          eq(companies.name, validatedData.name),
          // Kendisi hariç
          // ne(companies.id, companyId) // ne = not equal
        ))
        .limit(1);

      if (duplicateCompany.length > 0 && duplicateCompany[0].id !== companyId) {
        return res.status(400).json({
          success: false,
          message: 'Bu isimde başka bir şirket zaten mevcut.',
          duplicateField: 'name'
        });
      }
    }

    // Şehir kontrolü (eğer cityId güncelleniyorsa)
    if (validatedData.cityId) {
      const cityExists = await db.select({ id: cities.id })
        .from(cities)
        .where(eq(cities.id, validatedData.cityId))
        .limit(1);

      if (cityExists.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Belirtilen şehir bulunamadı.'
        });
      }
    }

    // Audit bilgilerini yakala  
    const auditInfo = {
      userId: (req as any).user?.id,
      apiClientId: undefined,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    };

    // Auditable update
    const [updatedCompany] = await auditableUpdate(
      companies,
      eq(companies.id, companyId),
      validatedData,
      'companies',
      auditInfo
    );

    res.json({
      success: true,
      message: 'Şirket başarıyla güncellendi.',
      data: { company: updatedCompany }
    });

  } catch (error) {
    console.error('Company update error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz veri formatı.',
        errors: error.errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Şirket güncellenirken hata oluştu.',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

/**
 * @swagger
 * /api/secure/companies/{id}:
 *   delete:
 *     summary: Şirket Silme
 *     description: Belirtilen şirketi siler (soft delete - isActive=false)
 *     tags: [Şirket İşlemleri]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Şirket ID
 *     responses:
 *       200:
 *         description: Şirket başarıyla silindi
 *       404:
 *         description: Şirket bulunamadı
 */
router.delete('/companies/:id', authenticateToken, async (req, res) => {
  try {
    const companyId = parseInt(req.params.id);
    
    if (isNaN(companyId)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz şirket ID.'
      });
    }

    // Şirket var mı kontrol et
    const existingCompany = await db.select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    if (existingCompany.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Şirket bulunamadı.'
      });
    }

    // Audit bilgilerini yakala
    const auditInfo = {
      userId: (req as any).user?.id,
      apiClientId: undefined,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    };

    // Soft delete (isActive = false)
    const [deletedCompany] = await auditableUpdate(
      companies,
      eq(companies.id, companyId),
      { isActive: false },
      'companies',
      auditInfo
    );

    res.json({
      success: true,
      message: 'Şirket başarıyla silindi.',
      data: { company: deletedCompany }
    });

  } catch (error) {
    console.error('Company delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Şirket silinirken hata oluştu.',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

export default router;