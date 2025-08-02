-- ======================================
-- FILOKI API PRODUCTION DATABASE SETUP
-- Domain: filokiapi.architectaiagency.com
-- ======================================

-- 1. Önce mevcut verileri kontrol et
SELECT 'Mevcut Şirket Sayısı:' as info, COUNT(*) as count FROM companies;
SELECT 'Mevcut User Sayısı:' as info, COUNT(*) as count FROM users;
SELECT 'Mevcut API Client Sayısı:' as info, COUNT(*) as count FROM api_clients;
SELECT 'Mevcut API Key Sayısı:' as info, COUNT(*) as count FROM api_keys;

-- 2. Demo şirket oluştur (yoksa)
INSERT INTO companies (id, name, tax_no, address, phone, city_id, is_active, created_at)
VALUES (1, 'Demo Şirket A.Ş.', '1234567890', 'Demo Adres', '+90 212 555 0101', 1, true, NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. Admin kullanıcısı oluştur veya güncelle
-- Password: Architect
INSERT INTO users (email, password_hash, company_id, position_level, is_active, created_at)
VALUES (
    'admin@example.com',
    '$2b$10$Em9d/.mW/ruoBLXiul6Tq.mACIqmDMIY7p/C9dA4/xtAKW4FD5jGK',
    1,
    1,
    true,
    NOW()
)
ON CONFLICT (email) DO UPDATE
SET password_hash = '$2b$10$Em9d/.mW/ruoBLXiul6Tq.mACIqmDMIY7p/C9dA4/xtAKW4FD5jGK',
    is_active = true;

-- 4. Production API Client oluştur
INSERT INTO api_clients (name, company_id, is_active, created_at)
VALUES ('Production Main API', 1, true, NOW())
ON CONFLICT (name) DO UPDATE
SET is_active = true;

-- 5. Production API Key oluştur
-- API Key: ak_prod2025_rwba6dj1sw
WITH client AS (
    SELECT id FROM api_clients WHERE name = 'Production Main API'
)
INSERT INTO api_keys (
    client_id,
    key_hash,
    permissions,
    allowed_domains,
    is_active,
    created_at,
    last_used_at
) 
SELECT 
    client.id,
    '$2b$10$EbPHkGCd/.4KM.OVdd1Hp.51vqCBEu67A/lpLzS6yFdFQA3Hep9AW',
    ARRAY[
        'data:read', 'data:write', 'data:delete',
        'asset:read', 'asset:write', 'asset:delete',
        'fleet:read', 'fleet:write', 'fleet:delete',
        'document:read', 'document:write', 'document:delete',
        'company:read', 'company:write', 'company:delete',
        'admin:read', 'admin:write', 'admin:delete',
        'analytics:read', 'financial:read', 'financial:write'
    ]::text[],
    ARRAY[
        'filokiapi.architectaiagency.com',
        'https://filokiapi.architectaiagency.com',
        '*.architectaiagency.com',
        'localhost',
        'localhost:5000',
        'localhost:3000'
    ]::text[],
    true,
    NOW(),
    NULL
FROM client
ON CONFLICT (client_id) DO UPDATE
SET 
    key_hash = EXCLUDED.key_hash,
    permissions = EXCLUDED.permissions,
    allowed_domains = EXCLUDED.allowed_domains,
    is_active = true;

-- 6. Test verileri ekle (opsiyonel)
-- Araç sahiplik tipleri
INSERT INTO ownership_types (id, name, is_active) VALUES
(1, 'Şirket Mülkiyeti', true),
(2, 'Kiralık', true),
(3, 'Operasyonel Kiralama', true)
ON CONFLICT (id) DO NOTHING;

-- Araç tipleri
INSERT INTO car_types (id, name, is_active) VALUES
(1, 'Otomobil', true),
(2, 'Kamyonet', true),
(3, 'Kamyon', true),
(4, 'Otobüs', true),
(5, 'Motosiklet', true)
ON CONFLICT (id) DO NOTHING;

-- 7. Kontrol sorguları
SELECT 
    'Admin User' as type,
    email,
    CASE WHEN password_hash IS NOT NULL THEN 'Password Set' ELSE 'NO PASSWORD' END as status
FROM users 
WHERE email = 'admin@example.com';

SELECT 
    'API Client' as type,
    name,
    CASE WHEN is_active THEN 'Active' ELSE 'Inactive' END as status
FROM api_clients 
WHERE name = 'Production Main API';

SELECT 
    'API Key' as type,
    ak.client_id,
    CASE WHEN ak.key_hash IS NOT NULL THEN 'Hash Set' ELSE 'NO HASH' END as hash_status,
    CASE WHEN ak.is_active THEN 'Active' ELSE 'Inactive' END as status,
    array_length(ak.permissions, 1) as permission_count,
    array_length(ak.allowed_domains, 1) as domain_count
FROM api_keys ak
JOIN api_clients ac ON ak.client_id = ac.id
WHERE ac.name = 'Production Main API';

-- 8. Environment değişkenleri için notlar
/*
Production'da şu environment değişkenleri ayarlanmalı:

NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]

JWT_SECRET=f27294d1df02e868c14292ac48050d5d61f02e6e28708247434f2bac35a397d2
JWT_REFRESH_SECRET=f07cda845b33a9598c114bd1c41de50b82e9b29f549e230e5491b12a1371c8f4
SESSION_SECRET=sk_fleet_2025_session_9f8e7d6c5b4a3c2d1e0f

# CORS ayarı - ÖNEMLİ!
CORS_ORIGIN=https://filokiapi.architectaiagency.com

# API Security
DEFAULT_API_KEY=ak_prod2025_rwba6dj1sw
API_RATE_LIMIT=1000

# SMTP ayarları (opsiyonel)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
*/