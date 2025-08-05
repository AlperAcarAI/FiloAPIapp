-- ========================================
-- FiloApi Quick Test Data
-- Essential data for testing the system
-- Generated: 2025-01-05
-- ========================================

-- Essential Reference Data Only
INSERT INTO countries (name, phone_code) VALUES
('Türkiye', '+90') ON CONFLICT (name) DO NOTHING;

INSERT INTO cities (name, country_id) VALUES
('İstanbul', 1), ('Ankara', 1), ('İzmir', 1), ('Bursa', 1), ('Antalya', 1)
ON CONFLICT DO NOTHING;

INSERT INTO company_types (name) VALUES
('Müşteri'), ('Taşeron'), ('Tedarikçi')
ON CONFLICT (name) DO NOTHING;

INSERT INTO car_brands (name) VALUES
('Mercedes-Benz'), ('Ford'), ('Volkswagen'), ('Toyota'), ('Renault')
ON CONFLICT (name) DO NOTHING;

INSERT INTO car_types (name) VALUES
('Minibüs'), ('Kamyonet'), ('Kamyon'), ('Binek Araç')
ON CONFLICT (name) DO NOTHING;

INSERT INTO car_models (brand_id, name, type_id) VALUES
(1, 'Sprinter', 1), (2, 'Transit', 1), (3, 'Crafter', 1),
(4, 'HiAce', 1), (5, 'Master', 1)
ON CONFLICT DO NOTHING;

INSERT INTO ownership_types (name) VALUES
('Şirket Malı'), ('Kiralık'), ('Leasing')
ON CONFLICT (name) DO NOTHING;

INSERT INTO personnel_positions (name) VALUES
('Şoför'), ('Operatör'), ('Tekniker'), ('Mühendis'), ('Yönetici')
ON CONFLICT (name) DO NOTHING;

INSERT INTO work_areas (name, location) VALUES
('Merkez Ofis', 'İstanbul Merkez'),
('Ankara Şantiyesi', 'Ankara Çankaya'),
('İzmir Projesi', 'İzmir Bornova')
ON CONFLICT DO NOTHING;

-- Test Companies
INSERT INTO companies (name, tax_no, address, phone, city_id) VALUES
('Test İnşaat A.Ş.', '1234567890', 'Test Mahallesi No:1 İstanbul', '+902121234567', 1),
('Demo Lojistik Ltd.', '2345678901', 'Demo Caddesi No:2 Ankara', '+903121234567', 2)
ON CONFLICT (name) DO NOTHING;

-- Test Users
INSERT INTO users (username, email, password_hash, is_active, access_level, access_scope) VALUES
('admin', 'admin@filoki.com', '$2b$10$N9qo8uLOickgx2ZMRZoMye.pPFyQSrjvdFJqQ4J6k8K7.PXBR9e5G', true, 'CORPORATE', '{"level": "all"}'),
('test@example.com', 'test@example.com', '$2b$10$N9qo8uLOickgx2ZMRZoMye.pPFyQSrjvdFJqQ4J6k8K7.PXBR9e5G', true, 'WORKSITE', '{"level": "worksite", "worksites": [1]}')
ON CONFLICT (email) DO NOTHING;

-- Test Personnel
INSERT INTO personnel (first_name, last_name, email, phone, national_id, birth_date, hire_date, position_id, work_area_id, company_id, is_active) VALUES
('Ahmet', 'Test', 'ahmet@test.com', '+905551234567', '12345678901', '1985-01-01', '2023-01-01', 1, 1, 1, true),
('Fatma', 'Demo', 'fatma@demo.com', '+905552345678', '23456789012', '1990-01-01', '2023-01-01', 2, 2, 2, true)
ON CONFLICT DO NOTHING;

-- Test Assets
INSERT INTO assets (license_plate, car_brand_id, car_model_id, year, company_id, work_area_id, ownership_type_id, is_active) VALUES
('34TEST01', 1, 1, 2022, 1, 1, 1, true),
('06DEMO02', 2, 2, 2021, 2, 2, 2, true)
ON CONFLICT (license_plate) DO NOTHING;

-- Test API Clients
INSERT INTO api_clients (name, company_id) VALUES
('Test Client', 1),
('Demo Client', 2)
ON CONFLICT DO NOTHING;

-- Master API Key for testing
INSERT INTO api_keys (client_id, key_hash, description) VALUES
(1, '$2b$10$abcdefghijklmnopqrstuvwxyz123456789', 'Master Test Key - filoki-api-master-key-2025')
ON CONFLICT DO NOTHING;

COMMIT;