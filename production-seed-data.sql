-- FiloAPI Production Database Seed Data
-- Bu dosya temel verileri ekler

-- Ülkeler
INSERT INTO countries (name, phone_code) VALUES 
('Türkiye', '+90'),
('Almanya', '+49'),
('Fransa', '+33'),
('İtalya', '+39'),
('İngiltere', '+44'),
('ABD', '+1'),
('Japonya', '+81'),
('Güney Kore', '+82'),
('Çin', '+86')
ON CONFLICT (name) DO NOTHING;

-- Türkiye şehirleri
INSERT INTO cities (name, country_id) 
SELECT city_name, (SELECT id FROM countries WHERE name = 'Türkiye')
FROM (VALUES 
    ('İstanbul'),
    ('Ankara'),
    ('İzmir'),
    ('Bursa'),
    ('Antalya'),
    ('Adana'),
    ('Konya'),
    ('Gaziantep'),
    ('Mersin'),
    ('Diyarbakır'),
    ('Kayseri'),
    ('Eskişehir'),
    ('Urfa'),
    ('Malatya'),
    ('Erzurum'),
    ('Van'),
    ('Batman'),
    ('Elazığ'),
    ('Trabzon'),
    ('Kocaeli'),
    ('Manisa'),
    ('Kahramanmaraş'),
    ('Samsun'),
    ('Mardin'),
    ('Aydın'),
    ('Tekirdağ'),
    ('Sakarya'),
    ('Denizli'),
    ('Muğla'),
    ('Balıkesir'),
    ('Uşak'),
    ('Kütahya'),
    ('Çorum'),
    ('Afyon'),
    ('Isparta'),
    ('Zonguldak'),
    ('Karaman'),
    ('Kırıkkale'),
    ('Düzce'),
    ('Osmaniye'),
    ('Kırklareli')
) AS city_list(city_name);

-- Temel roller
INSERT INTO roles (name, description, permissions) VALUES 
('admin', 'Sistem yöneticisi - Tüm yetkilere sahip', ARRAY['*']),
('fleet_manager', 'Filo yöneticisi - Filo yönetimi yetkilerine sahip', ARRAY['vehicle:*', 'personnel:read', 'reports:read']),
('user', 'Normal kullanıcı - Temel okuma yetkileri', ARRAY['vehicle:read', 'personnel:read']),
('viewer', 'Sadece görüntüleme yetkisi', ARRAY['*:read'])
ON CONFLICT (name) DO NOTHING;

-- Temel izinler
INSERT INTO permissions (name, resource, action, description) VALUES 
('vehicle_read', 'vehicle', 'read', 'Araç bilgilerini görüntüleme'),
('vehicle_write', 'vehicle', 'write', 'Araç bilgilerini düzenleme'),
('vehicle_delete', 'vehicle', 'delete', 'Araç silme'),
('personnel_read', 'personnel', 'read', 'Personel bilgilerini görüntüleme'),
('personnel_write', 'personnel', 'write', 'Personel bilgilerini düzenleme'),
('personnel_delete', 'personnel', 'delete', 'Personel silme'),
('reports_read', 'reports', 'read', 'Raporları görüntüleme'),
('reports_write', 'reports', 'write', 'Rapor oluşturma'),
('admin_panel', 'admin', 'access', 'Admin paneline erişim'),
('api_access', 'api', 'access', 'API erişimi'),
('user_management', 'user', 'manage', 'Kullanıcı yönetimi')
ON CONFLICT (name) DO NOTHING;

-- Erişim seviyeleri
INSERT INTO access_levels (name, code, hierarchy_level, description) VALUES 
('Genel Müdürlük', 'HQ', 1, 'En üst seviye - Tüm sisteme erişim'),
('Bölge Müdürlüğü', 'REGION', 2, 'Bölgesel erişim'),
('Şantiye', 'SITE', 3, 'Şantiye seviyesi erişim'),
('Departman', 'DEPT', 4, 'Departman seviyesi erişim')
ON CONFLICT (name) DO NOTHING;

-- Temel API istemcisi
INSERT INTO api_clients (name, client_id, description, allowed_origins, is_active) VALUES 
('FiloAPI Master Client', 'filoki-master-client', 'Ana sistem API istemcisi', ARRAY['*'], true),
('Web Dashboard', 'web-dashboard', 'Web dashboard için API istemcisi', ARRAY['filokiapi.architectaiagency.com', 'localhost'], true),
('Mobile App', 'mobile-app', 'Mobil uygulama için API istemcisi', ARRAY['*'], true)
ON CONFLICT (client_id) DO NOTHING;

-- Ana API anahtarı
INSERT INTO api_keys (client_id, name, key_hash, key, permissions, allowed_domains, description, is_active) VALUES 
((SELECT id FROM api_clients WHERE client_id = 'filoki-master-client'), 
 'Master API Key', 
 '$2b$10$8K3H2KqG5Ub7RjN4Lp9fNeQVWx1YzA6Bc2Md3Ef8Gh4Ij5Kl0Mn7', 
 'filoki-api-master-key-2025',
 ARRAY['*'],
 ARRAY['*', '*.architectaiagency.com', 'localhost'],
 'Ana sistem API anahtarı',
 true)
ON CONFLICT DO NOTHING;

-- Temel API endpoints
INSERT INTO api_endpoints (path, method, description, is_public, rate_limit_per_minute, required_permissions) VALUES 
('/api/auth/login', 'POST', 'Kullanıcı girişi', true, 10, NULL),
('/api/auth/logout', 'POST', 'Kullanıcı çıkışı', true, 60, NULL),
('/api/auth/refresh', 'POST', 'Token yenileme', true, 20, NULL),
('/api/vehicles', 'GET', 'Araç listesi', false, 100, ARRAY['vehicle:read']),
('/api/vehicles', 'POST', 'Yeni araç ekleme', false, 30, ARRAY['vehicle:write']),
('/api/vehicles/:id', 'GET', 'Araç detayı', false, 100, ARRAY['vehicle:read']),
('/api/vehicles/:id', 'PUT', 'Araç güncelleme', false, 30, ARRAY['vehicle:write']),
('/api/vehicles/:id', 'DELETE', 'Araç silme', false, 10, ARRAY['vehicle:delete']),
('/api/personnel', 'GET', 'Personel listesi', false, 100, ARRAY['personnel:read']),
('/api/personnel', 'POST', 'Yeni personel ekleme', false, 30, ARRAY['personnel:write']),
('/api/personnel/:id', 'GET', 'Personel detayı', false, 100, ARRAY['personnel:read']),
('/api/personnel/:id', 'PUT', 'Personel güncelleme', false, 30, ARRAY['personnel:write']),
('/api/personnel/:id', 'DELETE', 'Personel silme', false, 10, ARRAY['personnel:delete']),
('/api/companies', 'GET', 'Firma listesi', false, 100, ARRAY['company:read']),
('/api/companies', 'POST', 'Yeni firma ekleme', false, 30, ARRAY['company:write']),
('/api/work-areas', 'GET', 'Çalışma alanları listesi', false, 100, ARRAY['workarea:read']),
('/api/work-areas', 'POST', 'Yeni çalışma alanı ekleme', false, 30, ARRAY['workarea:write']),
('/api/reports/dashboard', 'GET', 'Dashboard raporu', false, 60, ARRAY['reports:read']),
('/api/reports/vehicles', 'GET', 'Araç raporu', false, 30, ARRAY['reports:read']),
('/api/upload/document', 'POST', 'Dosya yükleme', false, 20, ARRAY['document:write']),
('/api/documents/:id', 'GET', 'Dosya indirme', false, 60, ARRAY['document:read']),
('/api/admin/users', 'GET', 'Kullanıcı yönetimi', false, 60, ARRAY['user:manage']),
('/api/admin/audit-logs', 'GET', 'Audit log görüntüleme', false, 30, ARRAY['admin:access']),
('/api/admin/api-logs', 'GET', 'API log görüntüleme', false, 30, ARRAY['admin:access'])
ON CONFLICT (path, method) DO NOTHING;

-- Temel araç markaları
INSERT INTO car_brands (name, country, is_active) VALUES 
('Ford', 'ABD', true),
('Renault', 'Fransa', true),
('Volkswagen', 'Almanya', true),
('Mercedes-Benz', 'Almanya', true),
('BMW', 'Almanya', true),
('Audi', 'Almanya', true),
('Opel', 'Almanya', true),
('Peugeot', 'Fransa', true),
('Citroën', 'Fransa', true),
('Fiat', 'İtalya', true),
('Toyota', 'Japonya', true),
('Honda', 'Japonya', true),
('Nissan', 'Japonya', true),
('Hyundai', 'Güney Kore', true),
('Kia', 'Güney Kore', true),
('Chevrolet', 'ABD', true),
('Dacia', 'Romanya', true),
('Skoda', 'Çekya', true),
('SEAT', 'İspanya', true),
('Volvo', 'İsveç', true)
ON CONFLICT (name) DO NOTHING;

-- Ford modelleri
INSERT INTO car_models (brand_id, name, year_start, year_end, fuel_type, engine_size, capacity) 
SELECT 
    (SELECT id FROM car_brands WHERE name = 'Ford'),
    model_name, year_start, year_end, fuel_type, engine_size, capacity
FROM (VALUES 
    ('Transit', 2010, NULL, 'Dizel', 2.0, 3),
    ('Transit Connect', 2015, NULL, 'Dizel', 1.8, 2),
    ('Focus', 2012, NULL, 'Benzin', 1.6, 5),
    ('Fiesta', 2010, NULL, 'Benzin', 1.4, 5),
    ('Mondeo', 2015, 2022, 'Dizel', 2.0, 5),
    ('Kuga', 2018, NULL, 'Benzin', 1.5, 5),
    ('Ranger', 2019, NULL, 'Dizel', 2.2, 4)
) AS models(model_name, year_start, year_end, fuel_type, engine_size, capacity)
ON CONFLICT (brand_id, name, year_start) DO NOTHING;

-- Renault modelleri
INSERT INTO car_models (brand_id, name, year_start, year_end, fuel_type, engine_size, capacity) 
SELECT 
    (SELECT id FROM car_brands WHERE name = 'Renault'),
    model_name, year_start, year_end, fuel_type, engine_size, capacity
FROM (VALUES 
    ('Master', 2010, NULL, 'Dizel', 2.3, 3),
    ('Kangoo', 2015, NULL, 'Dizel', 1.5, 2),
    ('Clio', 2012, NULL, 'Benzin', 1.2, 5),
    ('Megane', 2016, NULL, 'Benzin', 1.6, 5),
    ('Talisman', 2015, NULL, 'Dizel', 1.6, 5),
    ('Captur', 2018, NULL, 'Benzin', 1.3, 5),
    ('Kadjar', 2019, NULL, 'Dizel', 1.7, 5)
) AS models(model_name, year_start, year_end, fuel_type, engine_size, capacity)
ON CONFLICT (brand_id, name, year_start) DO NOTHING;

-- Mercedes-Benz modelleri
INSERT INTO car_models (brand_id, name, year_start, year_end, fuel_type, engine_size, capacity) 
SELECT 
    (SELECT id FROM car_brands WHERE name = 'Mercedes-Benz'),
    model_name, year_start, year_end, fuel_type, engine_size, capacity
FROM (VALUES 
    ('Sprinter', 2010, NULL, 'Dizel', 2.2, 3),
    ('Vito', 2015, NULL, 'Dizel', 2.0, 8),
    ('A-Class', 2018, NULL, 'Benzin', 1.6, 5),
    ('C-Class', 2014, NULL, 'Dizel', 2.0, 5),
    ('E-Class', 2016, NULL, 'Dizel', 2.0, 5),
    ('GLA', 2020, NULL, 'Benzin', 2.0, 5),
    ('GLC', 2019, NULL, 'Dizel', 2.0, 5)
) AS models(model_name, year_start, year_end, fuel_type, engine_size, capacity)
ON CONFLICT (brand_id, name, year_start) DO NOTHING;