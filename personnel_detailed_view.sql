-- Personnel Detailed View - Personel, Şantiye, Pozisyon ve Şirket Bilgileri
-- Bu view tüm personel bilgilerini ilişkili tablolarla birlikte getirir

CREATE OR REPLACE VIEW personnel_detailed AS
SELECT 
    -- Personel Temel Bilgileri
    p.id AS personnel_id,
    p."tcNo" AS tc_no,
    p.name AS personnel_name,
    p.surname AS personnel_surname,
    p.birthdate,
    p.address,
    p."phoneNo" AS phone_no,
    p.status AS personnel_status,
    p."isActive" AS is_active,
    p."createdAt" AS personnel_created_at,
    
    -- Ülke Bilgileri (Uyruk)
    nc.id AS nation_id,
    nc.name AS nation_name,
    nc.code AS nation_code,
    
    -- Doğum Yeri Bilgileri  
    bc.id AS birthplace_id,
    bc.name AS birthplace_name,
    bc.code AS birthplace_code,
    
    -- Şirket Bilgileri
    comp.id AS company_id,
    comp.name AS company_name,
    comp."isActive" AS company_is_active,
    comp."createdAt" AS company_created_at,
    
    -- Mevcut Çalışma Alanı Bilgileri (En son aktif atama)
    current_wa.work_area_id AS current_work_area_id,
    current_wa.work_area_name AS current_work_area_name,
    current_wa.work_area_code AS current_work_area_code,
    current_wa.work_area_type AS current_work_area_type,
    current_wa.work_area_status AS current_work_area_status,
    current_wa.work_area_address AS current_work_area_address,
    
    -- Mevcut Pozisyon Bilgileri (En son aktif atama)
    current_pos.position_id AS current_position_id,
    current_pos.position_name AS current_position_name,
    current_pos.position_level AS current_position_level,
    current_pos.position_salary AS current_position_salary,
    
    -- Atama Detayları (En son aktif atama)
    current_assignment.assignment_id,
    current_assignment.start_date AS current_assignment_start_date,
    current_assignment.end_date AS current_assignment_end_date,
    current_assignment.assignment_is_active AS current_assignment_is_active,
    current_assignment.assignment_created_at,
    
    -- Toplam Çalışma Alanı Sayısı
    assignment_stats.total_work_areas,
    assignment_stats.active_assignments,
    assignment_stats.completed_assignments,
    
    -- İlk ve Son Atama Tarihleri
    assignment_stats.first_assignment_date,
    assignment_stats.last_assignment_date

FROM personnel p

-- Ülke Bilgileri (Uyruk) LEFT JOIN
LEFT JOIN countries nc ON p."nationId" = nc.id

-- Doğum Yeri Bilgileri LEFT JOIN
LEFT JOIN cities bc ON p."birthplaceId" = bc.id

-- Şirket Bilgileri LEFT JOIN
LEFT JOIN companies comp ON p."companyId" = comp.id

-- Mevcut (En Son Aktif) Çalışma Alanı Bilgileri
LEFT JOIN LATERAL (
    SELECT 
        pwa.id as assignment_id,
        pwa."workAreaId" as work_area_id,
        wa.name as work_area_name,
        wa.code as work_area_code,
        wa.type as work_area_type,
        wa.status as work_area_status,
        wa.address as work_area_address,
        pwa."startDate" as start_date,
        pwa."endDate" as end_date,
        pwa."isActive" as assignment_is_active,
        pwa."createdAt" as assignment_created_at
    FROM personnel_work_areas pwa
    LEFT JOIN work_areas wa ON pwa."workAreaId" = wa.id
    WHERE pwa."personnelId" = p.id 
    AND pwa."isActive" = true
    AND (pwa."endDate" IS NULL OR pwa."endDate" >= CURRENT_DATE)
    ORDER BY pwa."createdAt" DESC, pwa.id DESC
    LIMIT 1
) current_wa ON true

-- Mevcut (En Son Aktif) Pozisyon Bilgileri
LEFT JOIN LATERAL (
    SELECT 
        pp.id as position_id,
        pp.name as position_name,
        pp.level as position_level,
        pp.salary as position_salary
    FROM personnel_work_areas pwa2
    LEFT JOIN personnel_positions pp ON pwa2."positionId" = pp.id
    WHERE pwa2."personnelId" = p.id 
    AND pwa2."isActive" = true
    AND (pwa2."endDate" IS NULL OR pwa2."endDate" >= CURRENT_DATE)
    ORDER BY pwa2."createdAt" DESC, pwa2.id DESC
    LIMIT 1
) current_pos ON true

-- Mevcut Atama Bilgileri (current_wa ile aynı kayıt)
LEFT JOIN LATERAL (
    SELECT 
        pwa.id as assignment_id,
        pwa."startDate" as start_date,
        pwa."endDate" as end_date,
        pwa."isActive" as assignment_is_active,
        pwa."createdAt" as assignment_created_at
    FROM personnel_work_areas pwa
    WHERE pwa."personnelId" = p.id 
    AND pwa."isActive" = true
    AND (pwa."endDate" IS NULL OR pwa."endDate" >= CURRENT_DATE)
    ORDER BY pwa."createdAt" DESC, pwa.id DESC
    LIMIT 1
) current_assignment ON true

-- Atama İstatistikleri
LEFT JOIN LATERAL (
    SELECT 
        COUNT(DISTINCT pwa."workAreaId") as total_work_areas,
        COUNT(CASE WHEN pwa."isActive" = true THEN 1 END) as active_assignments,
        COUNT(CASE WHEN pwa."isActive" = false THEN 1 END) as completed_assignments,
        MIN(pwa."startDate") as first_assignment_date,
        MAX(pwa."startDate") as last_assignment_date
    FROM personnel_work_areas pwa
    WHERE pwa."personnelId" = p.id
) assignment_stats ON true

ORDER BY p.id;

-- View için yorum ekle
COMMENT ON VIEW personnel_detailed IS 'Personel detaylı görünüm - personel, şantiye, pozisyon ve şirket bilgilerini içerir';