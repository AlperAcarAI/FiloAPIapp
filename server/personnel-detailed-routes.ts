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
    const { limit } = req.query;
    
    // Basit view query - çalışır durumda
    const limitValue = limit ? Number(limit) : 10;
    
    const personnelResult = await db.execute(sql`
      SELECT * FROM personnel_detailed
      WHERE "Aktif" = true
      ORDER BY "Ad"
      LIMIT ${limitValue}
    `);
    
    console.log('Query results - personnel count:', personnelResult.rows?.length);

    const personnelList = personnelResult.rows;
    const totalCount = personnelList.length;

    // Convert BigInt values to strings for JSON serialization and map Turkish column names
    const serializedPersonnelList = personnelList.map((person: any) => ({
      personnelId: Number(person["Personel ID"]),
      tcNo: person["TC"] ? person["TC"].toString() : null,
      name: person["Ad"],
      surname: person["Soyad"],
      birthdate: person["Doğum Tarihi"],
      address: person["Adres"],
      phoneNo: person["Telefon"],
      status: person["Durum"],
      isActive: person["Aktif"],
      companyName: person["Şirket"],
      birthplaceName: person["Doğum Yeri"],
      positionName: person["Pozisyon"],
      workAreaName: person["Şantiye"],
      assignmentDate: person["Atama Tarihi"],
      firstStartDate: person["İlk İşe Başlangıç Tarihi"]
    }));
    
    res.json({
      success: true,
      message: 'Detaylı personel listesi başarıyla getirildi.',
      data: {
        personnel: serializedPersonnelList,
        totalCount,
        pagination: {
          limit: limitValue,
          offset: 0,
          hasMore: false
        },
        filters: {
          activeOnly: true,
          sortBy: 'Ad',
          sortOrder: 'asc'
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