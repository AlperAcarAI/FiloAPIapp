import { Router } from 'express';
import { db } from './db.js';
import { sql, eq, ilike, desc, asc, and } from 'drizzle-orm';
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
 * /api/secure/personnel_detailed:
 *   get:
 *     summary: Detaylı Personel Listesi
 *     description: Tüm personelleri şantiye, pozisyon ve şirket bilgileri ile birlikte listeler
 *     tags: [Personel İşlemleri]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Personel adı, soyadı veya TC no ile arama
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: integer
 *         description: Şirket ID ile filtreleme
 *       - in: query
 *         name: workAreaId
 *         schema:
 *           type: integer
 *         description: Çalışma alanı ID ile filtreleme
 *       - in: query
 *         name: positionId
 *         schema:
 *           type: integer
 *         description: Pozisyon ID ile filtreleme
 *       - in: query
 *         name: activeOnly
 *         schema:
 *           type: boolean
 *         description: Sadece aktif personeller (default: true)
 *       - in: query
 *         name: hasActiveAssignment
 *         schema:
 *           type: boolean
 *         description: Aktif ataması olan personeller
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Sayfalama - maksimum kayıt sayısı
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Sayfalama - kaç kayıt atlanacak
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [personnel_name, personnel_surname, company_name, current_work_area_name, current_position_name, personnel_created_at]
 *         description: Sıralama alanı (default: personnel_name)
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sıralama yönü (default: asc)
 *     responses:
 *       200:
 *         description: Detaylı personel listesi başarıyla getirildi
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
 *                   example: "Detaylı personel listesi başarıyla getirildi."
 *                 data:
 *                   type: object
 *                   properties:
 *                     personnel:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           personnel_id:
 *                             type: integer
 *                             description: Personel ID
 *                           tc_no:
 *                             type: string
 *                             description: TC Kimlik Numarası
 *                           personnel_name:
 *                             type: string
 *                             description: Personel adı
 *                           personnel_surname:
 *                             type: string
 *                             description: Personel soyadı
 *                           birthdate:
 *                             type: string
 *                             format: date
 *                             description: Doğum tarihi
 *                           phone_no:
 *                             type: string
 *                             description: Telefon numarası
 *                           personnel_status:
 *                             type: string
 *                             description: Personel durumu
 *                           is_active:
 *                             type: boolean
 *                             description: Personel aktif mi?
 *                           nation_name:
 *                             type: string
 *                             description: Uyruk
 *                           birthplace_name:
 *                             type: string
 *                             description: Doğum yeri
 *                           company_id:
 *                             type: integer
 *                             description: Şirket ID
 *                           company_name:
 *                             type: string
 *                             description: Şirket adı
 *                           current_work_area_id:
 *                             type: integer
 *                             description: Mevcut çalışma alanı ID
 *                           current_work_area_name:
 *                             type: string
 *                             description: Mevcut çalışma alanı adı
 *                           current_work_area_type:
 *                             type: string
 *                             description: Çalışma alanı türü
 *                           current_position_id:
 *                             type: integer
 *                             description: Mevcut pozisyon ID
 *                           current_position_name:
 *                             type: string
 *                             description: Mevcut pozisyon adı
 *                           current_position_level:
 *                             type: integer
 *                             description: Pozisyon seviyesi
 *                           current_assignment_start_date:
 *                             type: string
 *                             format: date
 *                             description: Mevcut atama başlangıç tarihi
 *                           total_work_areas:
 *                             type: integer
 *                             description: Toplam çalıştığı şantiye sayısı
 *                           active_assignments:
 *                             type: integer
 *                             description: Aktif atama sayısı
 *                           first_assignment_date:
 *                             type: string
 *                             format: date
 *                             description: İlk atama tarihi
 *                     totalCount:
 *                       type: integer
 *                       description: Toplam kayıt sayısı
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         limit:
 *                           type: integer
 *                         offset:
 *                           type: integer
 *                         hasMore:
 *                           type: boolean
 *                     filters:
 *                       type: object
 *                       description: Uygulanan filtreler
 *       500:
 *         description: Sunucu hatası
 */
router.get('/personnel-detail', async (req: AuthRequest, res) => {
  try {
    console.log('Personnel detailed API called with params:', req.query);
    console.log('User work area filter:', req.workAreaFilter);
    
    const { 
      search, 
      companyId, 
      workAreaId, 
      positionId, 
      activeOnly = 'true',
      hasActiveAssignment,
      limit = '20', 
      offset = '0',
      sortBy = 'Ad',
      sortOrder = 'asc'
    } = req.query;
    
    const limitValue = limit ? Number(limit) : 20;
    const offsetValue = offset ? Number(offset) : 0;
    
    // Start with basic query and build filters
    let baseQuery = 'SELECT * FROM personnel_detailed';
    let countQuery = 'SELECT COUNT(*) as total FROM personnel_detailed';
    let whereConditions = [];
    
    // Active filter (default true)
    if (activeOnly === 'true') {
      whereConditions.push(`"Aktif" = true`);
    } else if (activeOnly === 'false') {
      whereConditions.push(`"Aktif" = false`);
    }
    
    // Work area filtering based on hierarchical permissions
    if (req.workAreaFilter && req.workAreaFilter.length > 0) {
      const workAreaIds = req.workAreaFilter.map(id => Number(id)).join(',');
      whereConditions.push(`"Personel ID" IN (
        SELECT DISTINCT pwa.personnel_id 
        FROM personnel_work_areas pwa 
        WHERE pwa.work_area_id IN (${workAreaIds}) 
        AND pwa.is_active = true
      )`);
    }
    
    // Search filter
    if (search) {
      const searchTerm = search.replace(/'/g, "''");
      whereConditions.push(`(
        "Ad" ILIKE '%${searchTerm}%' OR 
        "Soyad" ILIKE '%${searchTerm}%' OR 
        "TC"::text ILIKE '%${searchTerm}%'
      )`);
    }
    
    // Company filter
    if (companyId) {
      whereConditions.push(`"Personel ID" IN (
        SELECT id FROM personnel WHERE company_id = ${Number(companyId)}
      )`);
    }
    
    // Work area filter (specific work area)
    if (workAreaId) {
      whereConditions.push(`"Personel ID" IN (
        SELECT personnel_id FROM personnel_work_areas 
        WHERE work_area_id = ${Number(workAreaId)} AND is_active = true
      )`);
    }
    
    // Has active assignment filter
    if (hasActiveAssignment === 'true') {
      whereConditions.push(`"Şantiye" IS NOT NULL`);
    } else if (hasActiveAssignment === 'false') {
      whereConditions.push(`"Şantiye" IS NULL`);
    }
    
    // Build WHERE clause
    const whereClause = whereConditions.length > 0 ? 
      ` WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Build ORDER BY clause
    const validSortColumns = ['Ad', 'Soyad', 'Şirket', 'Şantiye', 'Pozisyon', 'Atama Tarihi'];
    const sortColumn = validSortColumns.includes(sortBy as string) ? sortBy : 'Ad';
    const sortDirection = sortOrder === 'desc' ? 'DESC' : 'ASC';
    
    // Final queries
    const queryText = `${baseQuery}${whereClause} ORDER BY "${sortColumn}" ${sortDirection} LIMIT ${limitValue} OFFSET ${offsetValue}`;
    const countQueryText = `${countQuery}${whereClause}`;
    
    console.log('Executing query:', queryText);
    
    // Execute queries using basic SQL
    const personnelResult = await db.execute(sql`${sql.raw(queryText)}`);
    const countResult = await db.execute(sql`${sql.raw(countQueryText)}`);
    
    console.log('Query results - personnel count:', personnelResult.rows?.length);

    const personnelList = personnelResult.rows;
    const totalCount = Number(countResult.rows[0]?.total || 0);

    // Convert BigInt values and include ALL columns from view exactly as they are
    const serializedPersonnelList = personnelList.map((person: any) => {
      // Create a new object with all original columns
      const result: any = {};
      
      // Copy all columns from the view result
      Object.keys(person).forEach(key => {
        if (key === "TC" && person[key]) {
          result[key] = person[key].toString(); // Convert BigInt TC to string
        } else if (key === "Personel ID") {
          result[key] = Number(person[key]); // Convert ID to number
        } else {
          result[key] = person[key]; // Keep original value
        }
      });
      
      // Add English mapped names for convenience (additional fields)
      result.personnelId = Number(person["Personel ID"]);
      result.tcNo = person["TC"] ? person["TC"].toString() : null;
      result.name = person["Ad"];
      result.surname = person["Soyad"];
      result.birthdate = person["Doğum Tarihi"];
      result.address = person["Adres"];
      result.phoneNo = person["Telefon"];
      result.status = person["Durum"];
      result.isActive = person["Aktif"];
      result.companyName = person["Şirket"];
      result.birthplaceName = person["Doğum Yeri"];
      result.positionName = person["Pozisyon"];
      result.workAreaName = person["Şantiye"];
      result.assignmentDate = person["Atama Tarihi"];
      result.firstStartDate = person["İlk İşe Başlangıç Tarihi"];
      
      return result;
    });
    
    res.json({
      success: true,
      message: 'Detaylı personel listesi başarıyla getirildi.',
      data: {
        personnel: serializedPersonnelList,
        totalCount,
        pagination: {
          limit: limitValue,
          offset: offsetValue,
          hasMore: offsetValue + limitValue < totalCount,
          totalCount
        },
        filters: {
          search: search || null,
          companyId: companyId ? Number(companyId) : null,
          workAreaId: workAreaId ? Number(workAreaId) : null,
          positionId: positionId ? Number(positionId) : null,
          activeOnly: activeOnly === 'true',
          hasActiveAssignment: hasActiveAssignment || null,
          sortBy: sortColumn,
          sortOrder: sortDirection.toLowerCase(),
          workAreaFilter: req.workAreaFilter || []
        }
      }
    });
  } catch (error) {
    console.error('Detaylı personel listesi getirme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'PERSONNEL_DETAILED_FETCH_ERROR',
      message: 'Detaylı personel listesi getirilirken hata oluştu.'
    });
  }
});

export default router;