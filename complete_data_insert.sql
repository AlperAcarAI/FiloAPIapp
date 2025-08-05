-- ========================================
-- FiloApi Complete Database Data Insert
-- Turkish Fleet Management System
-- Generated: 2025-01-05
-- ========================================

-- Clear existing data (in dependency order)
TRUNCATE TABLE 
  api_usage_logs, api_request_logs, audit_logs, security_events, login_attempts,
  user_access_rights, user_roles, user_devices, sessions, refresh_tokens,
  personnel_documents, asset_documents, rental_assets, rental_agreements,
  trip_rentals, fuel_records, assets_maintenance, assets_policies, assets_damage_data,
  fin_accounts_details, fin_current_accounts, penalties,
  personnel_company_matches, personnel_work_areas, personnel,
  company_type_matches, assets, documents,
  car_models, car_brands, car_types,
  companies, cities, countries,
  api_keys, api_clients, users,
  personnel_positions, work_areas, doc_main_types, doc_sub_types,
  policy_types, payment_methods, damage_types, ownership_types,
  maintenance_types, penalty_types, payment_types, company_types,
  roles, permissions, access_levels
RESTART IDENTITY CASCADE;

-- ========================
-- Reference Data / Lookup Tables
-- ========================

-- Countries
INSERT INTO countries (name, phone_code) VALUES
('Türkiye', '+90'),
('Almanya', '+49'),
('Fransa', '+33'),
('İtalya', '+39'),
('İngiltere', '+44'),
('Amerika Birleşik Devletleri', '+1'),
('Kanada', '+1'),
('Japonya', '+81'),
('Güney Kore', '+82'),
('Çin', '+86');

-- Turkish Cities (81 provinces)
INSERT INTO cities (name, country_id) VALUES
('Adana', 1), ('Adıyaman', 1), ('Afyonkarahisar', 1), ('Ağrı', 1), ('Amasya', 1),
('Ankara', 1), ('Antalya', 1), ('Artvin', 1), ('Aydın', 1), ('Balıkesir', 1),
('Bilecik', 1), ('Bingöl', 1), ('Bitlis', 1), ('Bolu', 1), ('Burdur', 1),
('Bursa', 1), ('Çanakkale', 1), ('Çankırı', 1), ('Çorum', 1), ('Denizli', 1),
('Diyarbakır', 1), ('Edirne', 1), ('Elazığ', 1), ('Erzincan', 1), ('Erzurum', 1),
('Eskişehir', 1), ('Gaziantep', 1), ('Giresun', 1), ('Gümüşhane', 1), ('Hakkâri', 1),
('Hatay', 1), ('Isparta', 1), ('Mersin', 1), ('İstanbul', 1), ('İzmir', 1),
('Kars', 1), ('Kastamonu', 1), ('Kayseri', 1), ('Kırklareli', 1), ('Kırşehir', 1),
('Kocaeli', 1), ('Konya', 1), ('Kütahya', 1), ('Malatya', 1), ('Manisa', 1),
('Kahramanmaraş', 1), ('Mardin', 1), ('Muğla', 1), ('Muş', 1), ('Nevşehir', 1),
('Niğde', 1), ('Ordu', 1), ('Rize', 1), ('Sakarya', 1), ('Samsun', 1),
('Siirt', 1), ('Sinop', 1), ('Sivas', 1), ('Tekirdağ', 1), ('Tokat', 1),
('Trabzon', 1), ('Tunceli', 1), ('Şanlıurfa', 1), ('Uşak', 1), ('Van', 1),
('Yozgat', 1), ('Zonguldak', 1), ('Aksaray', 1), ('Bayburt', 1), ('Karaman', 1),
('Kırıkkale', 1), ('Batman', 1), ('Şırnak', 1), ('Bartın', 1), ('Ardahan', 1),
('Iğdır', 1), ('Yalova', 1), ('Karabük', 1), ('Kilis', 1), ('Osmaniye', 1),
('Düzce', 1);

-- Access Levels
INSERT INTO access_levels (name, description) VALUES
('WORKSITE', 'Şantiye seviyesi erişim'),
('REGIONAL', 'Bölgesel seviye erişim'),
('CORPORATE', 'Kurumsal seviye erişim'),
('DEPARTMENT', 'Departman seviyesi erişim');

-- Roles
INSERT INTO roles (name, description) VALUES
('admin', 'Sistem yöneticisi'),
('manager', 'Yönetici'),
('supervisor', 'Süpervizör'),
('operator', 'Operatör'),
('viewer', 'Görüntüleyici');

-- Permissions
INSERT INTO permissions (name, description) VALUES
('data:read', 'Veri okuma yetkisi'),
('data:write', 'Veri yazma yetkisi'),
('data:delete', 'Veri silme yetkisi'),
('assets:read', 'Varlık okuma'),
('assets:write', 'Varlık yazma'),
('personnel:read', 'Personel okuma'),
('personnel:write', 'Personel yazma'),
('reports:view', 'Rapor görüntüleme'),
('admin:all', 'Tüm admin yetkileri');

-- Company Types
INSERT INTO company_types (name) VALUES
('Müşteri'),
('Taşeron'),
('Tedarikçi'),
('İş Ortağı'),
('Hizmet Sağlayıcı');

-- Policy Types
INSERT INTO policy_types (name) VALUES
('Kasko'),
('Trafik'),
('İMM'),
('Ferdi Kaza'),
('Yük'),
('Sorumluluk');

-- Payment Methods
INSERT INTO payment_methods (name) VALUES
('Nakit'),
('Kredi Kartı'),
('Banka Havalesi'),
('EFT'),
('Çek'),
('Senet');

-- Payment Types
INSERT INTO payment_types (name) VALUES
('Yakıt'),
('Bakım'),
('Sigorta'),
('Hasar'),
('Ceza'),
('Genel Gider');

-- Damage Types
INSERT INTO damage_types (name) VALUES
('Kaporta Hasarı'),
('Motor Arızası'),
('Fren Arızası'),
('Lastik Hasarı'),
('Cam Kırığı'),
('İç Aksam Hasarı'),
('Elektrik Arızası'),
('Kaza Hasarı');

-- Ownership Types
INSERT INTO ownership_types (name) VALUES
('Şirket Malı'),
('Kiralık'),
('Leasing'),
('Operasyonel Kiralama'),
('Finansal Kiralama');

-- Maintenance Types
INSERT INTO maintenance_types (name) VALUES
('Periyodik Bakım'),
('Yağ Değişimi'),
('Fren Bakımı'),
('Lastik Değişimi'),
('Muayene'),
('Arıza Giderme'),
('Kaportaj'),
('Boya'),
('Cam Değişimi');

-- Penalty Types
INSERT INTO penalty_types (name) VALUES
('Hız Cezası'),
('Park Cezası'),
('Trafik Işığı İhlali'),
('Şerit İhlali'),
('Telefon Kullanımı'),
('Emniyet Kemeri'),
('Kask Takmama'),
('Alkol'),
('Sigara');

-- Car Types
INSERT INTO car_types (name) VALUES
('Minibüs'),
('Kamyonet'),
('Kamyon'),
('Çekici'),
('Otobüs'),
('Binek Araç'),
('Motosiklet'),
('İş Makinesi'),
('Forklift'),
('Traktör');

-- Car Brands
INSERT INTO car_brands (name) VALUES
('Mercedes-Benz'),
('Ford'),
('Volkswagen'),
('Toyota'),
('Hyundai'),
('Renault'),
('Fiat'),
('Iveco'),
('MAN'),
('Scania'),
('Volvo'),
('DAF'),
('Isuzu'),
('Mitsubishi'),
('Peugeot'),
('Opel'),
('Audi'),
('BMW'),
('Nissan'),
('Kia');

-- Car Models (Major models for each brand)
INSERT INTO car_models (brand_id, name, type_id) VALUES
-- Mercedes-Benz
(1, 'Sprinter', 1), (1, 'Vito', 1), (1, 'Actros', 3), (1, 'Atego', 3),
-- Ford
(2, 'Transit', 1), (2, 'Transit Custom', 2), (2, 'Cargo', 3), (2, 'Focus', 6),
-- Volkswagen
(3, 'Crafter', 1), (3, 'Caddy', 2), (3, 'Golf', 6), (3, 'Passat', 6),
-- Toyota
(4, 'HiAce', 1), (4, 'Dyna', 3), (4, 'Corolla', 6), (4, 'Camry', 6),
-- Hyundai
(5, 'H350', 1), (5, 'Porter', 2), (5, 'i20', 6), (5, 'Elantra', 6),
-- Renault
(6, 'Master', 1), (6, 'Kangoo', 2), (6, 'Clio', 6), (6, 'Megane', 6),
-- Fiat
(7, 'Ducato', 1), (7, 'Doblo', 2), (7, 'Egea', 6), (7, 'Linea', 6),
-- Iveco
(8, 'Daily', 1), (8, 'Stralis', 3), (8, 'Trakker', 3),
-- MAN
(9, 'TGE', 1), (9, 'TGL', 3), (9, 'TGX', 3),
-- Scania
(10, 'P Series', 3), (10, 'R Series', 3), (10, 'S Series', 3);

-- Document Main Types
INSERT INTO doc_main_types (name) VALUES
('Personel Belgeleri'),
('Araç Belgeleri'),
('Şirket Belgeleri'),
('Sigorta Belgeleri'),
('Mali Belgeler'),
('Yasal Belgeler');

-- Document Sub Types
INSERT INTO doc_sub_types (main_type_id, name) VALUES
(1, 'Kimlik Fotokopisi'), (1, 'Özgeçmiş'), (1, 'Diploma'), (1, 'Sertifika'), (1, 'İş Sözleşmesi'),
(2, 'Ruhsat'), (2, 'Muayene'), (2, 'Trafik Sigortası'), (2, 'Kasko'), (2, 'Fatura'),
(3, 'Ticaret Sicil'), (3, 'Vergi Levhası'), (3, 'İmza Sirküleri'), (3, 'Yetki Belgesi'),
(4, 'Poliçe'), (4, 'Hasar Tutanağı'), (4, 'Ekspertiz Raporu'),
(5, 'Fatura'), (5, 'Makbuz'), (5, 'Çek'), (5, 'Senet'),
(6, 'İzin'), (6, 'Ruhsat'), (6, 'Sözleşme'), (6, 'Protokol');

-- Personnel Positions
INSERT INTO personnel_positions (name) VALUES
('Şoför'),
('Operatör'),
('Tekniker'),
('Mühendis'),
('Foremen'),
('Süpervizör'),
('Proje Yöneticisi'),
('Sahada Çalışan'),
('Ofis Personeli'),
('Güvenlik'),
('Temizlik'),
('Yardımcı İşçi');

-- Work Areas
INSERT INTO work_areas (name, location, manager_id) VALUES
('Merkez Ofis', 'İstanbul Merkez', NULL),
('Ankara Şantiyesi', 'Ankara Çankaya', NULL),
('İzmir Projesi', 'İzmir Bornova', NULL),
('Bursa Fabrikası', 'Bursa Nilüfer', NULL),
('Antalya Oteli', 'Antalya Muratpaşa', NULL),
('Adana Havaalanı', 'Adana Sakirpaşa', NULL),
('Gaziantep Sanayi', 'Gaziantep Şehitkamil', NULL),
('Konya Lojistik', 'Konya Selçuklu', NULL),
('Kayseri Madeni', 'Kayseri Melikgazi', NULL),
('Trabzon Limanı', 'Trabzon Ortahisar', NULL);

-- ========================
-- Core Business Data
-- ========================

-- Companies
INSERT INTO companies (name, tax_no, tax_office, address, phone, city_id) VALUES
('Mega İnşaat A.Ş.', '1234567890', 'Beşiktaş', 'Levent Mahallesi, İş Kuleleri, 34330 Beşiktaş/İstanbul', '+902122345678', 34),
('Delta Lojistik Ltd.', '2345678901', 'Kadıköy', 'Fenerbahçe Mah. Bağdat Cad. No:145, Kadıköy/İstanbul', '+902163456789', 34),
('Gamma Teknoloji A.Ş.', '3456789012', 'Çankaya', 'Kızılay Mah. Atatürk Bulvarı No:98, Çankaya/Ankara', '+903124567890', 6),
('Beta Madencilik Ltd.', '4567890123', 'Konak', 'Alsancak Mah. Kordon Boyu No:67, Konak/İzmir', '+902325678901', 35),
('Alpha Enerji A.Ş.', '5678901234', 'Nilüfer', 'Görükle Kampüsü, Uludağ Üniversitesi, Nilüfer/Bursa', '+902246789012', 16),
('Omega Tarım Ltd.', '6789012345', 'Muratpaşa', 'Lara Plajı Mevkii, Muratpaşa/Antalya', '+902427890123', 7),
('Epsilon Sağlık A.Ş.', '7890123456', 'Seyhan', 'Toros Mah. Fuzuli Cad. No:34, Seyhan/Adana', '+903228901234', 1),
('Zeta Turizm Ltd.', '8901234567', 'Şehitkamil', 'Şahinbey Mah. Gazikent Bulvarı No:56, Şehitkamil/Gaziantep', '+903429012345', 27),
('Eta Gıda A.Ş.', '9012345678', 'Selçuklu', 'Yazır Mah. Ankara Yolu No:78, Selçuklu/Konya', '+903320123456', 42),
('Theta Tekstil Ltd.', '0123456789', 'Melikgazi', 'Erciyes Mah. Sivas Cad. No:89, Melikgazi/Kayseri', '+903521234567', 38);

-- Company Type Matches
INSERT INTO company_type_matches (company_id, type_id) VALUES
(1, 1), (1, 4), -- Mega İnşaat: Müşteri, İş Ortağı
(2, 3), (2, 5), -- Delta Lojistik: Tedarikçi, Hizmet Sağlayıcı
(3, 1), (3, 4), -- Gamma Teknoloji: Müşteri, İş Ortağı
(4, 2), (4, 3), -- Beta Madencilik: Taşeron, Tedarikçi
(5, 1), (5, 2), -- Alpha Enerji: Müşteri, Taşeron
(6, 3), (6, 5), -- Omega Tarım: Tedarikçi, Hizmet Sağlayıcı
(7, 1), (7, 5), -- Epsilon Sağlık: Müşteri, Hizmet Sağlayıcı
(8, 4), (8, 5), -- Zeta Turizm: İş Ortağı, Hizmet Sağlayıcı
(9, 3), (9, 4), -- Eta Gıda: Tedarikçi, İş Ortağı
(10, 2), (10, 3); -- Theta Tekstil: Taşeron, Tedarikçi

-- Users (System Users)
INSERT INTO users (username, email, password_hash, is_active, access_level, access_scope) VALUES
('admin', 'admin@filoki.com', '$2b$10$N9qo8uLOickgx2ZMRZoMye.pPFyQSrjvdFJqQ4J6k8K7.PXBR9e5G', true, 'CORPORATE', '{"level": "all", "regions": [], "worksites": []}'),
('manager1', 'manager1@filoki.com', '$2b$10$N9qo8uLOickgx2ZMRZoMye.pPFyQSrjvdFJqQ4J6k8K7.PXBR9e5G', true, 'REGIONAL', '{"level": "regional", "regions": [1,2,3], "worksites": []}'),
('supervisor1', 'supervisor1@filoki.com', '$2b$10$N9qo8uLOickgx2ZMRZoMye.pPFyQSrjvdFJqQ4J6k8K7.PXBR9e5G', true, 'WORKSITE', '{"level": "worksite", "regions": [], "worksites": [1,2]}'),
('operator1', 'operator1@filoki.com', '$2b$10$N9qo8uLOickgx2ZMRZoMye.pPFyQSrjvdFJqQ4J6k8K7.PXBR9e5G', true, 'DEPARTMENT', '{"level": "department", "regions": [], "worksites": [1]}'),
('test@example.com', 'test@example.com', '$2b$10$N9qo8uLOickgx2ZMRZoMye.pPFyQSrjvdFJqQ4J6k8K7.PXBR9e5G', true, 'WORKSITE', '{"level": "worksite", "regions": [], "worksites": [1]}');

-- Personnel
INSERT INTO personnel (first_name, last_name, email, phone, national_id, birth_date, hire_date, position_id, work_area_id, company_id, is_active) VALUES
('Ahmet', 'Yılmaz', 'ahmet.yilmaz@mega.com', '+905551234567', '12345678901', '1985-03-15', '2023-01-15', 1, 1, 1, true),
('Fatma', 'Demir', 'fatma.demir@delta.com', '+905552345678', '23456789012', '1990-07-22', '2023-02-01', 2, 2, 2, true),
('Mehmet', 'Çelik', 'mehmet.celik@gamma.com', '+905553456789', '34567890123', '1982-11-08', '2022-12-10', 3, 3, 3, true),
('Ayşe', 'Kaya', 'ayse.kaya@beta.com', '+905554567890', '45678901234', '1988-04-30', '2023-03-20', 4, 4, 4, true),
('Ali', 'Özkan', 'ali.ozkan@alpha.com', '+905555678901', '56789012345', '1987-09-14', '2023-01-08', 5, 5, 5, true),
('Zeynep', 'Arslan', 'zeynep.arslan@omega.com', '+905556789012', '67890123456', '1992-12-03', '2023-04-12', 6, 6, 6, true),
('Hasan', 'Doğan', 'hasan.dogan@epsilon.com', '+905557890123', '78901234567', '1986-06-25', '2022-11-18', 7, 7, 7, true),
('Elif', 'Şahin', 'elif.sahin@zeta.com', '+905558901234', '89012345678', '1991-08-17', '2023-02-28', 8, 8, 8, true),
('Murat', 'Koç', 'murat.koc@eta.com', '+905559012345', '90123456789', '1984-01-12', '2022-10-05', 9, 9, 9, true),
('Seda', 'Yıldız', 'seda.yildiz@theta.com', '+905550123456', '01234567890', '1989-05-29', '2023-03-15', 10, 10, 10, true),
('Emre', 'Aydın', 'emre.aydin@mega.com', '+905551234568', '12345678902', '1983-10-20', '2023-01-22', 1, 1, 1, true),
('Derya', 'Keskin', 'derya.keskin@delta.com', '+905552345679', '23456789013', '1993-02-14', '2023-04-01', 2, 2, 2, true),
('Kemal', 'Polat', 'kemal.polat@gamma.com', '+905553456780', '34567890124', '1981-07-06', '2022-09-12', 3, 3, 3, true),
('Gül', 'Erdoğan', 'gul.erdogan@beta.com', '+905554567891', '45678901235', '1990-03-28', '2023-02-14', 4, 4, 4, true),
('Burak', 'Çakır', 'burak.cakir@alpha.com', '+905555678902', '56789012346', '1986-12-11', '2022-12-20', 5, 5, 5, true);

-- Personnel Company Matches
INSERT INTO personnel_company_matches (personnel_id, company_id, position_id, start_date, is_active) VALUES
(1, 1, 1, '2023-01-15', true),
(2, 2, 2, '2023-02-01', true),
(3, 3, 3, '2022-12-10', true),
(4, 4, 4, '2023-03-20', true),
(5, 5, 5, '2023-01-08', true),
(6, 6, 6, '2023-04-12', true),
(7, 7, 7, '2022-11-18', true),
(8, 8, 8, '2023-02-28', true),
(9, 9, 9, '2022-10-05', true),
(10, 10, 10, '2023-03-15', true),
(11, 1, 1, '2023-01-22', true),
(12, 2, 2, '2023-04-01', true),
(13, 3, 3, '2022-09-12', true),
(14, 4, 4, '2023-02-14', true),
(15, 5, 5, '2022-12-20', true);

-- Personnel Work Areas
INSERT INTO personnel_work_areas (personnel_id, work_area_id, start_date, is_active) VALUES
(1, 1, '2023-01-15', true), (2, 2, '2023-02-01', true), (3, 3, '2022-12-10', true),
(4, 4, '2023-03-20', true), (5, 5, '2023-01-08', true), (6, 6, '2023-04-12', true),
(7, 7, '2022-11-18', true), (8, 8, '2023-02-28', true), (9, 9, '2022-10-05', true),
(10, 10, '2023-03-15', true), (11, 1, '2023-01-22', true), (12, 2, '2023-04-01', true),
(13, 3, '2022-09-12', true), (14, 4, '2023-02-14', true), (15, 5, '2022-12-20', true);

-- Assets (Vehicles/Equipment)
INSERT INTO assets (license_plate, car_brand_id, car_model_id, year, company_id, work_area_id, ownership_type_id, is_active) VALUES
('34ABC123', 1, 1, 2022, 1, 1, 1, true), -- Mercedes Sprinter
('06DEF456', 2, 5, 2021, 3, 3, 2, true), -- Ford Transit
('35GHI789', 3, 9, 2023, 4, 4, 1, true), -- VW Crafter
('16JKL012', 4, 13, 2020, 5, 5, 3, true), -- Toyota HiAce
('07MNO345', 5, 17, 2022, 6, 6, 1, true), -- Hyundai H350
('01PQR678', 6, 21, 2021, 7, 7, 2, true), -- Renault Master
('27STU901', 7, 25, 2023, 8, 8, 1, true), -- Fiat Ducato
('42VWX234', 8, 29, 2020, 9, 9, 3, true), -- Iveco Daily
('38YZA567', 9, 32, 2022, 10, 10, 1, true), -- MAN TGE
('61BCD890', 10, 35, 2021, 1, 1, 2, true), -- Scania P Series
('34EFG123', 1, 2, 2023, 1, 1, 1, true), -- Mercedes Vito
('06HIJ456', 2, 6, 2022, 3, 3, 1, true), -- Ford Transit Custom
('35KLM789', 3, 10, 2021, 4, 4, 2, true), -- VW Caddy
('16NOP012', 4, 14, 2023, 5, 5, 1, true), -- Toyota Dyna
('07QRS345', 5, 18, 2020, 6, 6, 3, true), -- Hyundai Porter
('01TUV678', 6, 22, 2022, 7, 7, 1, true), -- Renault Kangoo
('27WXY901', 7, 26, 2021, 8, 8, 2, true), -- Fiat Doblo
('42ZAB234', 8, 30, 2023, 9, 9, 1, true), -- Iveco Stralis
('38CDE567', 9, 33, 2020, 10, 10, 3, true), -- MAN TGL
('61FGH890', 10, 36, 2022, 1, 1, 1, true); -- Scania R Series

-- API Clients
INSERT INTO api_clients (name, company_id) VALUES
('Mega İnşaat API Client', 1),
('Delta Lojistik Client', 2),
('Gamma Tech Integration', 3),
('Beta Mining Systems', 4),
('Alpha Energy Portal', 5),
('Omega Agriculture App', 6),
('Epsilon Health Client', 7),
('Zeta Tourism API', 8),
('Eta Food Systems', 9),
('Theta Textile Client', 10);

-- API Keys (using the hash for 'filoki-api-master-key-2025')
INSERT INTO api_keys (client_id, key_hash, description) VALUES
(1, '$2b$10$abcdefghijklmnopqrstuvwxyz123456789', 'Mega İnşaat Production Key'),
(2, '$2b$10$bcdefghijklmnopqrstuvwxyz1234567890', 'Delta Lojistik Production Key'),
(3, '$2b$10$cdefghijklmnopqrstuvwxyz12345678901', 'Gamma Tech Production Key'),
(4, '$2b$10$defghijklmnopqrstuvwxyz123456789012', 'Beta Mining Production Key'),
(5, '$2b$10$efghijklmnopqrstuvwxyz1234567890123', 'Alpha Energy Production Key'),
(6, '$2b$10$fghijklmnopqrstuvwxyz12345678901234', 'Omega Agriculture Production Key'),
(7, '$2b$10$ghijklmnopqrstuvwxyz123456789012345', 'Epsilon Health Production Key'),
(8, '$2b$10$hijklmnopqrstuvwxyz1234567890123456', 'Zeta Tourism Production Key'),
(9, '$2b$10$ijklmnopqrstuvwxyz12345678901234567', 'Eta Food Production Key'),
(10, '$2b$10$jklmnopqrstuvwxyz123456789012345678', 'Theta Textile Production Key');

-- ========================
-- Operational Data
-- ========================

-- Fuel Records
INSERT INTO fuel_records (asset_id, personnel_id, fuel_type, liters, price_per_liter, total_cost, station_name, fuel_date, odometer) VALUES
(1, 1, 'DIESEL', 65.5, 28.50, 1866.75, 'Petrol Ofisi Levent', '2024-12-01 08:30:00', 125000),
(2, 2, 'GASOLINE', 45.2, 32.80, 1482.56, 'Shell Çankaya', '2024-12-01 14:15:00', 85000),
(3, 3, 'DIESEL', 78.8, 28.45, 2242.26, 'BP İzmir', '2024-12-02 09:45:00', 142000),
(4, 4, 'GASOLINE', 52.3, 32.75, 1712.83, 'Total Bursa', '2024-12-02 16:20:00', 98000),
(5, 5, 'DIESEL', 88.4, 28.60, 2528.24, 'Opet Antalya', '2024-12-03 07:55:00', 167000),
(6, 6, 'DIESEL', 72.1, 28.40, 2047.64, 'Aytemiz Adana', '2024-12-03 11:30:00', 134000),
(7, 7, 'GASOLINE', 38.9, 32.90, 1279.81, 'TP Gaziantep', '2024-12-04 13:45:00', 76000),
(8, 8, 'DIESEL', 95.6, 28.55, 2730.28, 'Petrol Ofisi Konya', '2024-12-04 08:20:00', 189000),
(9, 9, 'DIESEL', 68.3, 28.50, 1946.55, 'Shell Kayseri', '2024-12-05 15:10:00', 156000),
(10, 10, 'DIESEL', 105.7, 28.45, 3007.17, 'BP Trabzon', '2024-12-05 10:25:00', 234000);

-- Financial Current Accounts
INSERT INTO fin_current_accounts (company_id, account_type, balance, currency, metadata) VALUES
(1, 'fuel', 45000.00, 'TRY', '{"description": "Yakıt giderleri hesabı", "budget": 50000}'),
(1, 'maintenance', 15000.50, 'TRY', '{"description": "Bakım onarım hesabı", "budget": 20000}'),
(2, 'fuel', 32000.75, 'TRY', '{"description": "Yakıt giderleri hesabı", "budget": 35000}'),
(2, 'damage', -5000.00, 'TRY', '{"description": "Hasar giderleri hesabı", "incident_count": 3}'),
(3, 'fuel', 28000.25, 'TRY', '{"description": "Yakıt giderleri hesabı", "budget": 30000}'),
(3, 'policy', 12000.00, 'TRY', '{"description": "Sigorta primleri hesabı", "policy_count": 8}'),
(4, 'fuel', 67000.80, 'TRY', '{"description": "Yakıt giderleri hesabı", "budget": 70000}'),
(5, 'maintenance', 22000.45, 'TRY', '{"description": "Bakım onarım hesabı", "budget": 25000}'),
(6, 'fuel', 18000.90, 'TRY', '{"description": "Yakıt giderleri hesabı", "budget": 20000}'),
(7, 'general', 8500.60, 'TRY', '{"description": "Genel giderler hesabı", "misc_expenses": true}'),
(8, 'fuel', 41000.30, 'TRY', '{"description": "Yakıt giderleri hesabı", "budget": 45000}'),
(9, 'policy', 15500.75, 'TRY', '{"description": "Sigorta primleri hesabı", "policy_count": 12}'),
(10, 'maintenance', 9800.40, 'TRY', '{"description": "Bakım onarım hesabı", "budget": 12000}');

-- Assets Maintenance Records
INSERT INTO assets_maintenance (asset_id, maintenance_type_id, maintenance_date, description, cost, next_maintenance_date, odometer) VALUES
(1, 1, '2024-11-15', 'Periyodik bakım ve yağ değişimi', 850.00, '2025-02-15', 124500),
(2, 2, '2024-11-20', 'Motor yağı ve filtre değişimi', 450.75, '2025-01-20', 84800),
(3, 3, '2024-11-25', 'Fren balata değişimi', 1200.50, '2025-05-25', 141500),
(4, 4, '2024-12-01', 'Lastik değişimi (4 adet)', 2800.00, '2025-12-01', 97500),
(5, 5, '2024-12-05', 'Araç muayenesi', 250.00, '2025-12-05', 166500),
(6, 6, '2024-11-10', 'Klima arızası giderme', 680.25, NULL, 133500),
(7, 1, '2024-11-28', 'Periyodik bakım', 920.80, '2025-02-28', 75500),
(8, 7, '2024-12-02', 'Kaporta onarımı', 1850.00, NULL, 188500),
(9, 2, '2024-11-18', 'Yağ ve filtre değişimi', 520.40, '2025-01-18', 155500),
(10, 8, '2024-12-08', 'Boyama işlemi', 3200.75, NULL, 233500);

-- Assets Policies (Insurance)
INSERT INTO assets_policies (asset_id, policy_type_id, policy_number, start_date, end_date, premium_amount, company_name) VALUES
(1, 1, 'KAS-2024-001234', '2024-01-01', '2024-12-31', 5500.00, 'Axa Sigorta'),
(1, 2, 'TRA-2024-001234', '2024-01-01', '2024-12-31', 850.00, 'Güneş Sigorta'),
(2, 1, 'KAS-2024-002345', '2024-02-01', '2025-01-31', 4800.50, 'Allianz Sigorta'),
(2, 2, 'TRA-2024-002345', '2024-02-01', '2025-01-31', 750.00, 'HDI Sigorta'),
(3, 1, 'KAS-2024-003456', '2024-03-01', '2025-02-28', 6200.75, 'Zurich Sigorta'),
(4, 2, 'TRA-2024-004567', '2024-04-01', '2025-03-31', 680.25, 'Sompo Sigorta'),
(5, 1, 'KAS-2024-005678', '2024-05-01', '2025-04-30', 5800.90, 'Mapfre Sigorta'),
(6, 3, 'IMM-2024-006789', '2024-06-01', '2025-05-31', 1200.00, 'Türkiye Sigorta'),
(7, 1, 'KAS-2024-007890', '2024-07-01', '2025-06-30', 5100.45, 'Anadolu Sigorta'),
(8, 2, 'TRA-2024-008901', '2024-08-01', '2025-07-31', 920.60, 'Aksigorta');

-- Assets Damage Data
INSERT INTO assets_damage_data (asset_id, damage_type_id, damage_date, description, repair_cost, is_repaired) VALUES
(2, 1, '2024-11-05', 'Sol ön çamurluk hasarı, park ederken çarpma', 1250.00, true),
(4, 4, '2024-10-20', 'Sağ ön lastik patlaması, çivi batması', 350.75, true),
(6, 5, '2024-11-12', 'Ön cam çatlağı, taş çarpması', 680.50, true),
(8, 8, '2024-09-15', 'Arkadan çarpılma, tampon hasarı', 2150.25, true),
(3, 2, '2024-10-30', 'Motor arızası, termostat değişimi', 850.00, true),
(7, 6, '2024-11-28', 'Torpido hasarı, kablo sorunu', 420.80, false),
(9, 3, '2024-12-01', 'Fren sistemi arızası, acil onarım', 1580.40, true),
(1, 7, '2024-11-22', 'Elektrik sistemi arızası, alternatör', 920.60, true),
(5, 1, '2024-10-10', 'Sağ yan kaporta çizik, anahtar ile', 780.25, false),
(10, 8, '2024-09-25', 'Çoklu hasar, trafik kazası', 8500.75, true);

-- Penalties
INSERT INTO penalties (asset_id, personnel_id, penalty_type_id, penalty_date, amount, description, is_paid) VALUES
(1, 1, 1, '2024-11-15', 326.00, 'Hız sınırı aşımı - 90 km/h bölgede 110 km/h', true),
(2, 2, 2, '2024-11-20', 83.00, 'Park yasağı ihlali - İstanbul Beşiktaş', false),
(3, 3, 3, '2024-11-25', 235.00, 'Kırmızı ışık ihlali - Ankara Kızılay', true),
(4, 4, 4, '2024-12-01', 108.00, 'Şerit değiştirme ihlali', false),
(5, 5, 5, '2024-12-05', 327.00, 'Araç kullanırken telefon kullanımı', true),
(6, 6, 6, '2024-11-10', 108.00, 'Emniyet kemeri takmama', false),
(7, 7, 1, '2024-11-28', 690.00, 'Aşırı hız - 50 km/h bölgede 85 km/h', true),
(8, 8, 2, '2024-12-02', 83.00, 'Yasak bölgede park etme', false),
(9, 9, 9, '2024-11-18', 3180.00, 'Sigara içme yasağı ihlali - kapalı alan', true),
(10, 10, 1, '2024-12-08', 235.00, 'Hız sınırı aşımı - şehir içi', false);

-- Trip Rentals
INSERT INTO trip_rentals (asset_id, personnel_id, start_date, end_date, start_location, end_location, purpose, total_km, fuel_cost, is_completed) VALUES
(1, 1, '2024-12-01 08:00:00', '2024-12-01 18:00:00', 'İstanbul Merkez Ofis', 'Ankara Şantiye', 'Malzeme taşıma', 450, 1250.50, true),
(2, 2, '2024-12-02 09:30:00', '2024-12-02 15:45:00', 'Ankara Ofis', 'İzmir Proje', 'Personel taşıma', 520, 1480.75, true),
(3, 3, '2024-12-03 07:15:00', '2024-12-03 19:30:00', 'İzmir Merkez', 'Bursa Fabrika', 'Ekipman sevkiyatı', 380, 1120.25, true),
(4, 4, '2024-12-04 06:45:00', '2024-12-04 20:15:00', 'Bursa Fabrika', 'Antalya Otel', 'Proje ziyareti', 610, 1890.80, true),
(5, 5, '2024-12-05 08:30:00', '2024-12-05 17:00:00', 'Antalya Otel', 'Adana Havaalanı', 'Müşteri transferi', 290, 850.40, true),
(6, 6, '2024-12-06 10:00:00', NULL, 'Adana Merkez', 'Gaziantep Sanayi', 'Devam eden görev', 0, 0, false),
(7, 7, '2024-12-01 14:20:00', '2024-12-01 22:45:00', 'Gaziantep Ofis', 'Konya Lojistik', 'Yük sevkiyatı', 340, 980.60, true),
(8, 8, '2024-12-02 11:15:00', '2024-12-02 16:30:00', 'Konya Lojistik', 'Kayseri Maden', 'Kontrol ziyareti', 220, 650.25, true),
(9, 9, '2024-12-03 09:45:00', '2024-12-03 18:20:00', 'Kayseri Maden', 'Trabzon Liman', 'Nakliye işlemi', 480, 1420.90, true),
(10, 10, '2024-12-04 07:30:00', NULL, 'Trabzon Liman', 'İstanbul Merkez', 'Dönüş yolculuğu', 0, 0, false);

-- Rental Agreements
INSERT INTO rental_agreements (company_id, start_date, end_date, monthly_rate, total_amount, terms, is_active) VALUES
(1, '2024-01-01', '2024-12-31', 15000.00, 180000.00, 'Yıllık araç kiralama sözleşmesi, bakım dahil', true),
(2, '2024-06-01', '2025-05-31', 12000.00, 144000.00, 'Operasyonel kiralama, sigorta dahil', true),
(3, '2024-03-01', '2025-02-28', 18000.00, 216000.00, 'Filo kiralama, tam servis', true),
(4, '2024-09-01', '2025-08-31', 8500.00, 102000.00, 'Kısa dönem kiralama', true),
(5, '2024-07-01', '2025-06-30', 22000.00, 264000.00, 'Premium araç kiralama', true);

-- Documents
INSERT INTO documents (entity_type, entity_id, main_type_id, sub_type_id, file_name, file_path, file_size, uploaded_by, upload_date) VALUES
('personnel', 1, 1, 1, 'ahmet_yilmaz_kimlik.pdf', '/uploads/personnel/1/kimlik.pdf', 245760, 1, '2023-01-15'),
('personnel', 1, 1, 5, 'ahmet_yilmaz_sozlesme.pdf', '/uploads/personnel/1/sozlesme.pdf', 186420, 1, '2023-01-15'),
('personnel', 2, 1, 2, 'fatma_demir_ozgecmis.pdf', '/uploads/personnel/2/ozgecmis.pdf', 324580, 2, '2023-02-01'),
('asset', 1, 2, 1, '34ABC123_ruhsat.pdf', '/uploads/assets/1/ruhsat.pdf', 156890, 1, '2023-01-20'),
('asset', 1, 2, 3, '34ABC123_sigorta.pdf', '/uploads/assets/1/sigorta.pdf', 298760, 1, '2023-01-20'),
('asset', 2, 2, 2, '06DEF456_muayene.pdf', '/uploads/assets/2/muayene.pdf', 134520, 2, '2023-02-15'),
('company', 1, 3, 1, 'mega_insaat_ticaret_sicil.pdf', '/uploads/companies/1/ticaret_sicil.pdf', 456780, 1, '2023-01-10'),
('company', 1, 3, 2, 'mega_insaat_vergi_levha.pdf', '/uploads/companies/1/vergi_levha.pdf', 123450, 1, '2023-01-10'),
('personnel', 3, 1, 3, 'mehmet_celik_diploma.pdf', '/uploads/personnel/3/diploma.pdf', 567890, 3, '2022-12-10'),
('asset', 3, 2, 4, '35GHI789_kasko.pdf', '/uploads/assets/3/kasko.pdf', 234560, 3, '2023-03-01');

-- ========================
-- System Audit & Logging
-- ========================

-- Audit Logs (Sample recent activities)
INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent) VALUES
(1, 'INSERT', 'personnel', 15, NULL, '{"first_name": "Burak", "last_name": "Çakır", "email": "burak.cakir@alpha.com"}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
(2, 'UPDATE', 'assets', 5, '{"odometer": 165000}', '{"odometer": 167000}', '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'),
(1, 'INSERT', 'fuel_records', 10, NULL, '{"asset_id": 10, "liters": 105.7, "total_cost": 3007.17}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
(3, 'UPDATE', 'penalties', 2, '{"is_paid": false}', '{"is_paid": true}', '192.168.1.102', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'),
(1, 'DELETE', 'api_keys', 11, '{"is_active": true}', '{"is_active": false}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

-- Login Attempts (Recent)
INSERT INTO login_attempts (email, is_successful, ip_address, user_agent, failure_reason, attempt_time) VALUES
('admin@filoki.com', true, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NULL, '2024-12-10 08:30:00'),
('manager1@filoki.com', true, '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', NULL, '2024-12-10 09:15:00'),
('test@example.com', false, '192.168.1.103', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36', 'invalid_password', '2024-12-10 10:45:00'),
('supervisor1@filoki.com', true, '192.168.1.102', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NULL, '2024-12-10 11:20:00'),
('operator1@filoki.com', true, '192.168.1.104', 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15', NULL, '2024-12-10 14:30:00');

-- Security Events
INSERT INTO security_events (user_id, event_type, description, severity, ip_address, user_agent, event_time) VALUES
(1, 'login_success', 'Başarılı admin girişi', 'low', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '2024-12-10 08:30:00'),
(NULL, 'failed_login', 'Başarısız giriş denemesi - test@example.com', 'medium', '192.168.1.103', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36', '2024-12-10 10:45:00'),
(2, 'permission_denied', 'Yetkisiz admin panel erişim denemesi', 'high', '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', '2024-12-10 12:15:00'),
(1, 'api_key_created', 'Yeni API anahtarı oluşturuldu', 'medium', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '2024-12-10 15:45:00'),
(3, 'data_export', 'Personel verileri export edildi', 'medium', '192.168.1.102', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '2024-12-10 16:30:00');

-- API Request Logs (Sample recent API calls)
INSERT INTO api_request_logs (api_key_id, endpoint, method, status_code, response_time_ms, request_size, response_size, user_agent, request_time) VALUES
(1, '/api/secure/assets', 'GET', 200, 245, 0, 1024, 'FiloApi-Client/1.0', '2024-12-10 09:15:00'),
(2, '/api/secure/personnel', 'GET', 200, 180, 0, 2048, 'Delta-Integration/2.1', '2024-12-10 09:30:00'),
(1, '/api/secure/fuel-records', 'POST', 201, 320, 512, 256, 'FiloApi-Client/1.0', '2024-12-10 10:45:00'),
(3, '/api/secure/getCities', 'GET', 200, 95, 0, 4096, 'Gamma-Portal/1.5', '2024-12-10 11:20:00'),
(2, '/api/secure/assets/5', 'PUT', 200, 280, 256, 512, 'Delta-Integration/2.1', '2024-12-10 14:15:00'),
(4, '/api/secure/companies', 'GET', 200, 150, 0, 1536, 'Beta-Systems/3.0', '2024-12-10 15:30:00'),
(1, '/api/secure/penalties', 'GET', 200, 195, 0, 768, 'FiloApi-Client/1.0', '2024-12-10 16:45:00'),
(5, '/api/secure/maintenance', 'POST', 201, 410, 1024, 128, 'Alpha-Portal/1.2', '2024-12-10 17:20:00');

-- API Usage Stats (Daily aggregated data)
INSERT INTO api_usage_stats (date, total_requests, successful_requests, failed_requests, avg_response_time, top_endpoint) VALUES
('2024-12-09', 1847, 1792, 55, 198.5, '/api/secure/assets'),
('2024-12-08', 2156, 2089, 67, 205.2, '/api/secure/getCities'),
('2024-12-07', 1923, 1876, 47, 189.8, '/api/secure/personnel'),
('2024-12-06', 2034, 1967, 67, 210.3, '/api/secure/fuel-records'),
('2024-12-05', 1789, 1734, 55, 195.7, '/api/secure/assets'),
('2024-12-04', 2287, 2201, 86, 215.9, '/api/secure/companies'),
('2024-12-03', 1956, 1889, 67, 192.4, '/api/backend/personnel');

-- ========================
-- SEQUENCES UPDATE
-- ========================

-- Update all sequences to continue from current max values
SELECT setval('countries_id_seq', (SELECT MAX(id) FROM countries));
SELECT setval('cities_id_seq', (SELECT MAX(id) FROM cities));
SELECT setval('companies_id_seq', (SELECT MAX(id) FROM companies));
SELECT setval('personnel_id_seq', (SELECT MAX(id) FROM personnel));
SELECT setval('assets_id_seq', (SELECT MAX(id) FROM assets));
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('api_clients_id_seq', (SELECT MAX(id) FROM api_clients));
SELECT setval('api_keys_id_seq', (SELECT MAX(id) FROM api_keys));
SELECT setval('fuel_records_id_seq', (SELECT MAX(id) FROM fuel_records));
SELECT setval('penalties_id_seq', (SELECT MAX(id) FROM penalties));
SELECT setval('documents_id_seq', (SELECT MAX(id) FROM documents));

-- ========================================
-- Data Insert Complete
-- Total Records Inserted: 500+
-- ========================================

COMMIT;