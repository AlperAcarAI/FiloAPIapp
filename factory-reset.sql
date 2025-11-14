-- =====================================================
-- FACTORY RESET SCRIPT
-- =====================================================
-- ⚠️⚠️⚠️ UYARI: BU SCRIPT TÜM VERİTABANI VERİLERİNİ SİLER! ⚠️⚠️⚠️
-- 
-- ÇALIŞTIRMADAN ÖNCE MUTLAKA YEDEKLEYİN!
-- 
-- Bu script şunları yapar:
-- 1. Sadece referans tablolarını korur (marka, model, tip vb.)
-- 2. Tüm işletme verilerini temizler
-- 3. Default şirket oluşturur
-- 4. Admin kullanıcısı oluşturur
--    - Email: admin@filoki.com
--    - Şifre: @carAcar54
-- =====================================================

BEGIN;

-- Foreign Key constraint'lerini geçici olarak devre dışı bırak
SET session_replication_role = 'replica';

-- =====================================================
-- TABLO TEMİZLEME (Dependency sırasına göre)
-- =====================================================

-- API Analytics & Usage tablolarını temizle
TRUNCATE TABLE api_usage_logs CASCADE;
TRUNCATE TABLE api_usage_stats CASCADE;

-- API Management tablolarını temizle
TRUNCATE TABLE api_request_logs CASCADE;
TRUNCATE TABLE api_rate_limit CASCADE;
TRUNCATE TABLE api_client_permissions CASCADE;
TRUNCATE TABLE api_tokens CASCADE;
TRUNCATE TABLE api_keys CASCADE;
TRUNCATE TABLE api_clients CASCADE;
TRUNCATE TABLE api_endpoints CASCADE;

-- Security tablolarını temizle
TRUNCATE TABLE password_history CASCADE;
TRUNCATE TABLE rate_limit_buckets CASCADE;
TRUNCATE TABLE security_events CASCADE;
TRUNCATE TABLE user_devices CASCADE;
TRUNCATE TABLE user_security_settings CASCADE;
TRUNCATE TABLE login_attempts CASCADE;

-- Audit tablolarını temizle
TRUNCATE TABLE audit_logs CASCADE;

-- Session tablolarını temizle
TRUNCATE TABLE sessions CASCADE;
TRUNCATE TABLE refresh_tokens CASCADE;

-- Authorization tablolarını temizle
TRUNCATE TABLE user_access_rights CASCADE;
TRUNCATE TABLE access_levels CASCADE;
TRUNCATE TABLE user_roles CASCADE;
TRUNCATE TABLE role_permissions CASCADE;
TRUNCATE TABLE permissions CASCADE;
TRUNCATE TABLE roles CASCADE;

-- Outage Process tablolarını temizle
TRUNCATE TABLE fo_outage_process_assets CASCADE;
TRUNCATE TABLE fo_outage_process_personnels CASCADE;
TRUNCATE TABLE fo_outage_process CASCADE;

-- Document tablolarını temizle
TRUNCATE TABLE documents CASCADE;
TRUNCATE TABLE personnel_documents CASCADE;
TRUNCATE TABLE asset_documents CASCADE;

-- Financial tablolarını temizle
TRUNCATE TABLE fin_accounts_details CASCADE;
TRUNCATE TABLE fin_current_accounts CASCADE;

-- Penalty tablolarını temizle
TRUNCATE TABLE penalties CASCADE;

-- Rental tablolarını temizle
TRUNCATE TABLE trip_rentals CASCADE;
TRUNCATE TABLE rental_assets CASCADE;
TRUNCATE TABLE rental_agreements CASCADE;

-- Fuel & Maintenance tablolarını temizle
TRUNCATE TABLE fuel_records CASCADE;
TRUNCATE TABLE assets_maintenance CASCADE;

-- Damage & Policy tablolarını temizle
TRUNCATE TABLE assets_damage_data CASCADE;
TRUNCATE TABLE assets_policies CASCADE;

-- Asset tablolarını temizle
TRUNCATE TABLE assets_personel_assignment CASCADE;
TRUNCATE TABLE assets CASCADE;

-- Personnel tablolarını temizle
TRUNCATE TABLE personnel_access CASCADE;
TRUNCATE TABLE access_types CASCADE;
TRUNCATE TABLE personnel_stuff_matcher CASCADE;
TRUNCATE TABLE stuff CASCADE;
TRUNCATE TABLE personnel_work_areas CASCADE;
TRUNCATE TABLE personnel_company_matches CASCADE;
TRUNCATE TABLE personnel_documents CASCADE;
TRUNCATE TABLE personnel CASCADE;

-- Project tablolarını temizle
TRUNCATE TABLE projects CASCADE;

-- Work Area tablolarını temizle
TRUNCATE TABLE work_areas CASCADE;

-- Position tablolarını temizle
TRUNCATE TABLE personnel_positions CASCADE;

-- User tablolarını temizle
TRUNCATE TABLE users CASCADE;

-- Company tablolarını temizle
TRUNCATE TABLE company_type_matches CASCADE;
TRUNCATE TABLE companies CASCADE;

-- Payment Methods tablosunu temizle
TRUNCATE TABLE payment_methods CASCADE;

-- =====================================================
-- KORUNAN TABLOLAR (Temizlenmeyecek - Sadece bilgi)
-- =====================================================
-- Bu tablolar referans verileri içerir ve korunur:
-- - car_brands
-- - car_models
-- - car_types
-- - cities
-- - company_types
-- - countries
-- - damage_types
-- - doc_main_types
-- - doc_sub_types
-- - maintenance_types
-- - ownership_types
-- - payment_types
-- - penalty_types
-- - policy_types
-- =====================================================

-- =====================================================
-- DEFAULT ŞİRKET OLUŞTUR
-- =====================================================

INSERT INTO companies (id, name, tax_no, address, is_active)
VALUES (1, 'Default', '0000000000', 'Default Address', true)
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name,
    tax_no = EXCLUDED.tax_no,
    address = EXCLUDED.address,
    is_active = EXCLUDED.is_active;

-- =====================================================
-- ADMIN KULLANICISI OLUŞTUR
-- =====================================================

INSERT INTO users (
    id, 
    email, 
    password_hash, 
    company_id, 
    is_active, 
    department, 
    position_level,
    created_at
)
VALUES (
    1,
    'admin@filoki.com',
    '$2b$10$uivjmMBN9vJ1ROR./dTwWeMsb7pfeMtupYSfXmsjpdlXcON.RsHKy',
    1,
    true,
    'Admin',
    10,
    NOW()
)
ON CONFLICT (id) DO UPDATE 
SET email = EXCLUDED.email,
    password_hash = EXCLUDED.password_hash,
    company_id = EXCLUDED.company_id,
    is_active = EXCLUDED.is_active,
    department = EXCLUDED.department,
    position_level = EXCLUDED.position_level;

-- =====================================================
-- SEQUENCE'LERİ RESET ET
-- =====================================================

ALTER SEQUENCE companies_id_seq RESTART WITH 2;
ALTER SEQUENCE users_id_seq RESTART WITH 2;
ALTER SEQUENCE personnel_id_seq RESTART WITH 1;
ALTER SEQUENCE assets_id_seq RESTART WITH 1;
ALTER SEQUENCE work_areas_id_seq RESTART WITH 1;
ALTER SEQUENCE projects_id_seq RESTART WITH 1;
ALTER SEQUENCE personnel_positions_id_seq RESTART WITH 1;
ALTER SEQUENCE roles_id_seq RESTART WITH 1;
ALTER SEQUENCE permissions_id_seq RESTART WITH 1;
ALTER SEQUENCE api_clients_id_seq RESTART WITH 1;
ALTER SEQUENCE api_keys_id_seq RESTART WITH 1;
ALTER SEQUENCE api_tokens_id_seq RESTART WITH 1;
ALTER SEQUENCE api_endpoints_id_seq RESTART WITH 1;
ALTER SEQUENCE api_request_logs_id_seq RESTART WITH 1;
ALTER SEQUENCE api_rate_limit_id_seq RESTART WITH 1;
ALTER SEQUENCE api_usage_logs_id_seq RESTART WITH 1;
ALTER SEQUENCE api_usage_stats_id_seq RESTART WITH 1;
ALTER SEQUENCE audit_logs_id_seq RESTART WITH 1;
ALTER SEQUENCE access_levels_id_seq RESTART WITH 1;
ALTER SEQUENCE user_access_rights_id_seq RESTART WITH 1;
ALTER SEQUENCE refresh_tokens_id_seq RESTART WITH 1;
ALTER SEQUENCE login_attempts_id_seq RESTART WITH 1;
ALTER SEQUENCE user_security_settings_id_seq RESTART WITH 1;
ALTER SEQUENCE user_devices_id_seq RESTART WITH 1;
ALTER SEQUENCE security_events_id_seq RESTART WITH 1;
ALTER SEQUENCE rate_limit_buckets_id_seq RESTART WITH 1;
ALTER SEQUENCE password_history_id_seq RESTART WITH 1;
ALTER SEQUENCE payment_methods_id_seq RESTART WITH 1;
ALTER SEQUENCE stuff_id_seq RESTART WITH 1;
ALTER SEQUENCE personnel_stuff_matcher_id_seq RESTART WITH 1;
ALTER SEQUENCE access_types_id_seq RESTART WITH 1;
ALTER SEQUENCE personnel_access_id_seq RESTART WITH 1;
ALTER SEQUENCE personnel_work_areas_id_seq RESTART WITH 1;
ALTER SEQUENCE personnel_company_matches_id_seq RESTART WITH 1;
ALTER SEQUENCE company_type_matches_id_seq RESTART WITH 1;
ALTER SEQUENCE asset_documents_id_seq RESTART WITH 1;
ALTER SEQUENCE personnel_documents_id_seq RESTART WITH 1;
ALTER SEQUENCE documents_id_seq RESTART WITH 1;
ALTER SEQUENCE assets_policies_id_seq RESTART WITH 1;
ALTER SEQUENCE assets_damage_data_id_seq RESTART WITH 1;
ALTER SEQUENCE assets_maintenance_id_seq RESTART WITH 1;
ALTER SEQUENCE fuel_records_id_seq RESTART WITH 1;
ALTER SEQUENCE rental_agreements_id_seq RESTART WITH 1;
ALTER SEQUENCE rental_assets_id_seq RESTART WITH 1;
ALTER SEQUENCE trip_rentals_id_seq RESTART WITH 1;
ALTER SEQUENCE penalties_id_seq RESTART WITH 1;
ALTER SEQUENCE fin_current_accounts_id_seq RESTART WITH 1;
ALTER SEQUENCE fin_accounts_details_id_seq RESTART WITH 1;
ALTER SEQUENCE fo_outage_process_id_seq RESTART WITH 1;
ALTER SEQUENCE fo_outage_process_personnels_id_seq RESTART WITH 1;
ALTER SEQUENCE fo_outage_process_assets_id_seq RESTART WITH 1;
ALTER SEQUENCE assets_personel_assignment_id_seq RESTART WITH 1;

-- Foreign Key constraint'lerini tekrar aktif et
SET session_replication_role = 'origin';

COMMIT;

-- =====================================================
-- DOĞRULAMA
-- =====================================================

SELECT 
    '✅ Factory Reset Tamamlandı!' as status,
    '🏢 Default şirket oluşturuldu' as company_info,
    '👤 Admin kullanıcısı oluşturuldu (admin@filoki.com)' as user_info;

SELECT 
    'USERS' as table_name,
    COUNT(*) as record_count,
    '1 (admin)' as expected
FROM users
UNION ALL
SELECT 
    'COMPANIES',
    COUNT(*),
    '1 (Default)'
FROM companies
UNION ALL
SELECT 
    'PERSONNEL',
    COUNT(*),
    '0'
FROM personnel
UNION ALL
SELECT 
    'ASSETS',
    COUNT(*),
    '0'
FROM assets;

-- Referans tablolarının korunduğunu göster
SELECT 
    'COUNTRIES' as reference_table,
    COUNT(*) as record_count
FROM countries
UNION ALL
SELECT 'CITIES', COUNT(*) FROM cities
UNION ALL
SELECT 'CAR_BRANDS', COUNT(*) FROM car_brands
UNION ALL
SELECT 'CAR_MODELS', COUNT(*) FROM car_models
UNION ALL
SELECT 'CAR_TYPES', COUNT(*) FROM car_types
UNION ALL
SELECT 'COMPANY_TYPES', COUNT(*) FROM company_types
UNION ALL
SELECT 'DAMAGE_TYPES', COUNT(*) FROM damage_types
UNION ALL
SELECT 'DOC_MAIN_TYPES', COUNT(*) FROM doc_main_types
UNION ALL
SELECT 'DOC_SUB_TYPES', COUNT(*) FROM doc_sub_types
UNION ALL
SELECT 'MAINTENANCE_TYPES', COUNT(*) FROM maintenance_types
UNION ALL
SELECT 'OWNERSHIP_TYPES', COUNT(*) FROM ownership_types
UNION ALL
SELECT 'PAYMENT_TYPES', COUNT(*) FROM payment_types
UNION ALL
SELECT 'PENALTY_TYPES', COUNT(*) FROM penalty_types
UNION ALL
SELECT 'POLICY_TYPES', COUNT(*) FROM policy_types
ORDER BY reference_table;
