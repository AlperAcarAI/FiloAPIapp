import { Router } from 'express';
import { db } from './db.js';
import { eq, and, ilike, desc, asc } from 'drizzle-orm';
import { 
  companies, cities, countries, companyTypes, companyTypeMatches,
  insertCompanySchema, updateCompanySchema,
  type InsertCompany, type UpdateCompany, type Company
} from '../shared/schema.js';
import { z } from 'zod';
import { authenticateToken } from './auth.js';
import { 
  auditableInsert,
  auditableUpdate,
  auditableDelete,
  createAuditLog
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
 *       - in: query
 *         name: companyTypeId
 *         schema:
 *           type: integer
 *         description: Belirli şirket tipindeki şirketleri filtrelemek için
 *     responses:
 *       200:
 *         description: Şirketler başarıyla getirildi
 *       401:
 *         description: Geçersiz API anahtarı
 */
router.get('/companies', authenticateToken, async (req, res) => {
  try {
    const { search, active, cityId, companyTypeId } = req.query;
    
    // Get companies with their types
    const companiesWithTypesQuery = db
      .select({
        companyId: companies.id,
        companyName: companies.name,
        taxNo: companies.taxNo,
        taxOffice: companies.taxOffice,
        address: companies.address,
        phone: companies.phone,
        isActive: companies.isActive,
        cityId: companies.cityId,
        cityName: cities.name,
        countryName: countries.name,
        companyTypeId: companyTypes.id,
        companyTypeName: companyTypes.name
      })
      .from(companies)
      .leftJoin(cities, eq(companies.cityId, cities.id))
      .leftJoin(countries, eq(cities.countryId, countries.id))
      .leftJoin(companyTypeMatches, eq(companies.id, companyTypeMatches.companyId))
      .leftJoin(companyTypes, eq(companyTypeMatches.typeId, companyTypes.id));

    // Apply filters
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
    
    if (companyTypeId) {
      whereConditions.push(eq(companyTypes.id, parseInt(companyTypeId as string)));
    }

    // Apply where conditions if any
    let finalQuery;
    if (whereConditions.length > 0) {
      finalQuery = companiesWithTypesQuery.where(and(...whereConditions));
    } else {
      finalQuery = companiesWithTypesQuery;
    }

    const rawResult = await finalQuery.orderBy(asc(companies.name));

    // Group companies with their types
    const companiesMap = new Map();
    
    rawResult.forEach(row => {
      const companyId = row.companyId;
      
      if (!companiesMap.has(companyId)) {
        companiesMap.set(companyId, {
          id: row.companyId,
          name: row.companyName,
          taxNo: row.taxNo,
          taxOffice: row.taxOffice,
          address: row.address,
          phone: row.phone,
          isActive: row.isActive,
          cityId: row.cityId,
          cityName: row.cityName,
          countryName: row.countryName,
          companyTypes: []
        });
      }
      
      // Add company type if exists
      if (row.companyTypeId && row.companyTypeName) {
        const company = companiesMap.get(companyId);
        const existingType = company.companyTypes.find((ct: any) => ct.id === row.companyTypeId);
        if (!existingType) {
          company.companyTypes.push({
            id: row.companyTypeId,
            name: row.companyTypeName
          });
        }
      }
    });

    const result = Array.from(companiesMap.values());

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

    // Get company with types
    const companyWithTypesQuery = await db
      .select({
        companyId: companies.id,
        companyName: companies.name,
        taxNo: companies.taxNo,
        taxOffice: companies.taxOffice,
        address: companies.address,
        phone: companies.phone,
        isActive: companies.isActive,
        cityId: companies.cityId,
        cityName: cities.name,
        countryName: countries.name,
        companyTypeId: companyTypes.id,
        companyTypeName: companyTypes.name
      })
      .from(companies)
      .leftJoin(cities, eq(companies.cityId, cities.id))
      .leftJoin(countries, eq(cities.countryId, countries.id))
      .leftJoin(companyTypeMatches, eq(companies.id, companyTypeMatches.companyId))
      .leftJoin(companyTypes, eq(companyTypeMatches.typeId, companyTypes.id))
      .where(eq(companies.id, companyId));

    if (companyWithTypesQuery.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Şirket bulunamadı.'
      });
    }

    // Build company object with types
    const firstRow = companyWithTypesQuery[0];
    const company = {
      id: firstRow.companyId,
      name: firstRow.companyName,
      taxNo: firstRow.taxNo,
      taxOffice: firstRow.taxOffice,
      address: firstRow.address,
      phone: firstRow.phone,
      isActive: firstRow.isActive,
      cityId: firstRow.cityId,
      cityName: firstRow.cityName,
      countryName: firstRow.countryName,
      companyTypes: companyWithTypesQuery
        .filter(row => row.companyTypeId && row.companyTypeName)
        .map(row => ({
          id: row.companyTypeId,
          name: row.companyTypeName
        }))
        .filter((type, index, self) => 
          index === self.findIndex(t => t.id === type.id)
        ) // Remove duplicates
    };

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
    const { companyTypeId, ...companyData } = insertCompanySchema.parse(req.body);
    const validatedData = companyData;

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

    // Company type kontrolü (eğer companyTypeId verilmişse)
    if (companyTypeId) {
      const typeExists = await db.select({ id: companyTypes.id })
        .from(companyTypes)
        .where(eq(companyTypes.id, companyTypeId))
        .limit(1);

      if (typeExists.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Belirtilen şirket tipi bulunamadı.'
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
      db,
      companies,
      {
        ...validatedData,
        createdBy: auditInfo.userId,
        updatedBy: auditInfo.userId
      },
      auditInfo
    );

    // Company type ataması (eğer belirtilmişse)
    if (companyTypeId && newCompany) {
      await auditableInsert(
        db,
        companyTypeMatches,
        {
          companyId: newCompany.id,
          typeId: companyTypeId
        },
        auditInfo
      );
    }

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
      db,
      companies,
      {
        ...validatedData,
        updatedBy: auditInfo.userId,
        updatedAt: new Date()
      },
      eq(companies.id, companyId),
      existingCompany[0],
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

    // Soft delete (isActive = false) - direct database update
    const [deletedCompany] = await db
      .update(companies)
      .set({ isActive: false })
      .where(eq(companies.id, companyId))
      .returning();

    // Manuel audit log oluştur
    if (deletedCompany) {
      await createAuditLog(
        'companies',
        deletedCompany.id,
        'UPDATE',
        existingCompany[0],
        { isActive: false },
        auditInfo
      );
    }

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

/**
 * @swagger
 * /api/secure/company-types:
 *   get:
 *     summary: Şirket Tiplerini Listele
 *     description: Tüm şirket tiplerini listeler
 *     tags: [Şirket İşlemleri]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Şirket tipleri başarıyla getirildi
 */
router.get('/company-types', authenticateToken, async (req, res) => {
  try {
    const types = await db
      .select({
        id: companyTypes.id,
        name: companyTypes.name
      })
      .from(companyTypes)
      .orderBy(asc(companyTypes.name));

    res.json({
      success: true,
      message: 'Şirket tipleri başarıyla getirildi.',
      data: { companyTypes: types }
    });

  } catch (error) {
    console.error('Company types fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Şirket tipleri getirilirken hata oluştu.',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

/**
 * @swagger
 * /api/secure/companies/{id}/types:
 *   post:
 *     summary: Şirkete Tip Ata
 *     description: Bir şirkete şirket tipi atar
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
 *             required: [typeId]
 *             properties:
 *               typeId:
 *                 type: integer
 *                 description: Şirket tip ID
 *                 example: 1
 *     responses:
 *       201:
 *         description: Şirket tipi başarıyla atandı
 *       400:
 *         description: Geçersiz veri veya tip zaten atanmış
 *       404:
 *         description: Şirket veya tip bulunamadı
 */
router.post('/companies/:id/types', authenticateToken, async (req, res) => {
  try {
    const companyId = parseInt(req.params.id);
    const { typeId } = req.body;

    if (isNaN(companyId) || !typeId) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz şirket ID veya tip ID.'
      });
    }

    // Check if company exists
    const company = await db.select({ id: companies.id })
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    if (company.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Şirket bulunamadı.'
      });
    }

    // Check if type exists
    const type = await db.select({ id: companyTypes.id })
      .from(companyTypes)
      .where(eq(companyTypes.id, typeId))
      .limit(1);

    if (type.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Şirket tipi bulunamadı.'
      });
    }

    // Check if already assigned
    const existing = await db.select({ id: companyTypeMatches.id })
      .from(companyTypeMatches)
      .where(and(
        eq(companyTypeMatches.companyId, companyId),
        eq(companyTypeMatches.typeId, typeId)
      ))
      .limit(1);

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Bu tip zaten şirkete atanmış.'
      });
    }

    // Assign type to company
    const [assignment] = await db.insert(companyTypeMatches)
      .values({
        companyId,
        typeId
      })
      .returning();

    res.status(201).json({
      success: true,
      message: 'Şirket tipi başarıyla atandı.',
      data: { assignment }
    });

  } catch (error) {
    console.error('Company type assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Şirket tipi atanırken hata oluştu.',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

/**
 * @swagger
 * /api/secure/companies/{id}/types/{typeId}:
 *   delete:
 *     summary: Şirketten Tip Kaldır
 *     description: Bir şirketten şirket tipini kaldırır
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
 *       - in: path
 *         name: typeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Şirket Tip ID
 *     responses:
 *       200:
 *         description: Şirket tipi başarıyla kaldırıldı
 *       404:
 *         description: Şirket, tip veya atama bulunamadı
 */
router.delete('/companies/:id/types/:typeId', authenticateToken, async (req, res) => {
  try {
    const companyId = parseInt(req.params.id);
    const typeId = parseInt(req.params.typeId);

    if (isNaN(companyId) || isNaN(typeId)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz şirket ID veya tip ID.'
      });
    }

    // Check if assignment exists
    const assignment = await db.select({ id: companyTypeMatches.id })
      .from(companyTypeMatches)
      .where(and(
        eq(companyTypeMatches.companyId, companyId),
        eq(companyTypeMatches.typeId, typeId)
      ))
      .limit(1);

    if (assignment.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Şirket tip ataması bulunamadı.'
      });
    }

    // Remove assignment
    await db.delete(companyTypeMatches)
      .where(and(
        eq(companyTypeMatches.companyId, companyId),
        eq(companyTypeMatches.typeId, typeId)
      ));

    res.json({
      success: true,
      message: 'Şirket tipi başarıyla kaldırıldı.'
    });

  } catch (error) {
    console.error('Company type removal error:', error);
    res.status(500).json({
      success: false,
      message: 'Şirket tipi kaldırılırken hata oluştu.',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

export default router;