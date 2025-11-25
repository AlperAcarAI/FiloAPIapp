-- ========================
-- PROGRESS PAYMENT (HAKEDİŞ) SYSTEM MIGRATION
-- ========================

-- 1. Units (Birimler)
CREATE TABLE IF NOT EXISTS units (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    symbol VARCHAR(10),
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by INTEGER REFERENCES users(id),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by INTEGER REFERENCES users(id)
);

CREATE INDEX idx_units_name ON units(name);
CREATE INDEX idx_units_is_active ON units(is_active);

-- 2. Unit Conversions (Birim Çevirim)
CREATE TABLE IF NOT EXISTS unit_conversions (
    id SERIAL PRIMARY KEY,
    from_unit_id INTEGER NOT NULL REFERENCES units(id),
    to_unit_id INTEGER NOT NULL REFERENCES units(id),
    conversion_factor DECIMAL(10, 4) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by INTEGER REFERENCES users(id),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by INTEGER REFERENCES users(id),
    CONSTRAINT unique_unit_conversion UNIQUE (from_unit_id, to_unit_id),
    CONSTRAINT check_different_units CHECK (from_unit_id != to_unit_id),
    CONSTRAINT check_positive_factor CHECK (conversion_factor > 0)
);

CREATE INDEX idx_unit_conversions_from ON unit_conversions(from_unit_id);
CREATE INDEX idx_unit_conversions_to ON unit_conversions(to_unit_id);

-- 3. Material Types (Malzeme Türleri - Hiyerarşik)
CREATE TABLE IF NOT EXISTS material_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    parent_type_id INTEGER REFERENCES material_types(id),
    hierarchy_level INTEGER NOT NULL DEFAULT 0,
    full_path VARCHAR(500),
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by INTEGER REFERENCES users(id),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by INTEGER REFERENCES users(id)
);

CREATE INDEX idx_material_types_parent ON material_types(parent_type_id);
CREATE INDEX idx_material_types_level ON material_types(hierarchy_level);
CREATE INDEX idx_material_types_name ON material_types(name);
CREATE INDEX idx_material_types_active ON material_types(is_active);

-- 4. Materials (Malzemeler)
CREATE TABLE IF NOT EXISTS materials (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    type_id INTEGER REFERENCES material_types(id),
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by INTEGER REFERENCES users(id),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by INTEGER REFERENCES users(id)
);

CREATE INDEX idx_materials_code ON materials(code);
CREATE INDEX idx_materials_type ON materials(type_id);
CREATE INDEX idx_materials_name ON materials(name);
CREATE INDEX idx_materials_active ON materials(is_active);

-- 5. Material Code Mappings (Malzeme Kod Eşleştirme)
CREATE TABLE IF NOT EXISTS material_code_mappings (
    id SERIAL PRIMARY KEY,
    material_id INTEGER NOT NULL REFERENCES materials(id),
    company_id INTEGER NOT NULL REFERENCES companies(id),
    company_material_code VARCHAR(100) NOT NULL,
    company_material_name VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by INTEGER REFERENCES users(id),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by INTEGER REFERENCES users(id),
    CONSTRAINT unique_material_company_mapping UNIQUE (material_id, company_id)
);

CREATE INDEX idx_material_mappings_material ON material_code_mappings(material_id);
CREATE INDEX idx_material_mappings_company ON material_code_mappings(company_id);
CREATE INDEX idx_material_mappings_code ON material_code_mappings(company_material_code);

-- 6. Teams (Ekipler)
CREATE TABLE IF NOT EXISTS teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    supervisor_id INTEGER REFERENCES personnel(id),
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by INTEGER REFERENCES users(id),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by INTEGER REFERENCES users(id)
);

CREATE INDEX idx_teams_company ON teams(company_id);
CREATE INDEX idx_teams_supervisor ON teams(supervisor_id);
CREATE INDEX idx_teams_name ON teams(name);
CREATE INDEX idx_teams_active ON teams(is_active);

-- 7. Team Members (Ekip Üyeleri)
CREATE TABLE IF NOT EXISTS team_members (
    id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    personnel_id INTEGER NOT NULL REFERENCES personnel(id),
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by INTEGER REFERENCES users(id),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by INTEGER REFERENCES users(id),
    CONSTRAINT check_member_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_personnel ON team_members(personnel_id);
CREATE INDEX idx_team_members_dates ON team_members(start_date, end_date);

-- Unique constraint for active team members (enforced in application logic)
-- PostgreSQL doesn't support partial unique indexes in all ORMs easily

-- 8. Unit Prices (Birim Fiyatlar)
CREATE TABLE IF NOT EXISTS unit_prices (
    id SERIAL PRIMARY KEY,
    material_id INTEGER NOT NULL REFERENCES materials(id),
    unit_id INTEGER NOT NULL REFERENCES units(id),
    project_id INTEGER NOT NULL REFERENCES projects(id),
    price_cents INTEGER NOT NULL,
    valid_from DATE NOT NULL,
    valid_until DATE,
    currency VARCHAR(3) NOT NULL DEFAULT 'TRY',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by INTEGER REFERENCES users(id),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by INTEGER REFERENCES users(id),
    CONSTRAINT check_price_positive CHECK (price_cents >= 0),
    CONSTRAINT check_validity_dates CHECK (valid_until IS NULL OR valid_until >= valid_from)
);

CREATE INDEX idx_unit_prices_material ON unit_prices(material_id);
CREATE INDEX idx_unit_prices_unit ON unit_prices(unit_id);
CREATE INDEX idx_unit_prices_project ON unit_prices(project_id);
CREATE INDEX idx_unit_prices_validity ON unit_prices(valid_from, valid_until);
CREATE INDEX idx_unit_prices_active ON unit_prices(project_id, is_active);

-- 9. Progress Payment Types (Hakediş Türleri)
CREATE TABLE IF NOT EXISTS progress_payment_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by INTEGER REFERENCES users(id),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by INTEGER REFERENCES users(id)
);

CREATE INDEX idx_payment_types_name ON progress_payment_types(name);

-- 10. Progress Payments (Hakediş Ana Kayıtları)
CREATE TABLE IF NOT EXISTS progress_payments (
    id SERIAL PRIMARY KEY,
    payment_number VARCHAR(50) NOT NULL UNIQUE,
    payment_date DATE NOT NULL,
    team_id INTEGER NOT NULL REFERENCES teams(id),
    project_id INTEGER NOT NULL REFERENCES projects(id),
    payment_type_id INTEGER NOT NULL REFERENCES progress_payment_types(id),
    total_amount_cents INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    notes TEXT,
    
    -- Onay süreci alanları
    submitted_at TIMESTAMP,
    submitted_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP,
    approved_by INTEGER REFERENCES users(id),
    rejection_reason TEXT,
    payment_date_actual DATE,
    
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by INTEGER REFERENCES users(id),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by INTEGER REFERENCES users(id),
    
    CONSTRAINT check_total_amount CHECK (total_amount_cents >= 0),
    CONSTRAINT check_status_value CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'paid'))
);

CREATE UNIQUE INDEX idx_progress_payments_number ON progress_payments(payment_number);
CREATE INDEX idx_progress_payments_team_date ON progress_payments(team_id, payment_date);
CREATE INDEX idx_progress_payments_project_date ON progress_payments(project_id, payment_date);
CREATE INDEX idx_progress_payments_status ON progress_payments(status);
CREATE INDEX idx_progress_payments_date ON progress_payments(payment_date);
CREATE INDEX idx_progress_payments_active ON progress_payments(is_active);

-- 11. Progress Payment Details (Hakediş Detayları)
CREATE TABLE IF NOT EXISTS progress_payment_details (
    id SERIAL PRIMARY KEY,
    progress_payment_id INTEGER NOT NULL REFERENCES progress_payments(id) ON DELETE CASCADE,
    material_id INTEGER NOT NULL REFERENCES materials(id),
    unit_id INTEGER NOT NULL REFERENCES units(id),
    quantity DECIMAL(12, 4) NOT NULL,
    unit_price_cents INTEGER NOT NULL,
    line_total_cents INTEGER NOT NULL,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by INTEGER REFERENCES users(id),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by INTEGER REFERENCES users(id),
    
    CONSTRAINT unique_payment_material UNIQUE (progress_payment_id, material_id),
    CONSTRAINT check_quantity_positive CHECK (quantity > 0),
    CONSTRAINT check_unit_price CHECK (unit_price_cents >= 0),
    CONSTRAINT check_line_total CHECK (line_total_cents >= 0)
);

CREATE INDEX idx_payment_details_payment ON progress_payment_details(progress_payment_id);
CREATE INDEX idx_payment_details_material ON progress_payment_details(material_id);
CREATE INDEX idx_payment_details_unit ON progress_payment_details(unit_id);

-- ========================
-- INITIAL DATA
-- ========================

-- Temel birimler
INSERT INTO units (name, symbol, description, created_by) VALUES
('Kilogram', 'kg', 'Ağırlık birimi', 1),
('Ton', 'ton', 'Ağırlık birimi - 1000 kg', 1),
('Metre', 'm', 'Uzunluk birimi', 1),
('Metrekare', 'm²', 'Alan birimi', 1),
('Metreküp', 'm³', 'Hacim birimi', 1),
('Adet', 'adet', 'Sayısal birim', 1),
('Litre', 'lt', 'Hacim birimi', 1),
('Paket', 'paket', 'Ambalaj birimi', 1),
('Koli', 'koli', 'Ambalaj birimi', 1),
('Takım', 'takım', 'Grup birimi', 1)
ON CONFLICT (name) DO NOTHING;

-- Temel birim çevirimleri
INSERT INTO unit_conversions (from_unit_id, to_unit_id, conversion_factor, created_by)
SELECT 
    u1.id, 
    u2.id, 
    1000.0,
    1
FROM units u1, units u2
WHERE u1.name = 'Kilogram' AND u2.name = 'Ton'
ON CONFLICT (from_unit_id, to_unit_id) DO NOTHING;

INSERT INTO unit_conversions (from_unit_id, to_unit_id, conversion_factor, created_by)
SELECT 
    u1.id, 
    u2.id, 
    0.001,
    1
FROM units u1, units u2
WHERE u1.name = 'Ton' AND u2.name = 'Kilogram'
ON CONFLICT (from_unit_id, to_unit_id) DO NOTHING;

-- Hakediş türleri
INSERT INTO progress_payment_types (name, description, created_by) VALUES
('Günlük Hakediş', 'Günlük çalışma hakediş formu', 1),
('Haftalık Hakediş', 'Haftalık toplam hakediş', 1),
('Aylık Hakediş', 'Aylık toplam hakediş', 1),
('Ara Hakediş', 'Proje ara hakedişi', 1),
('Kesin Hakediş', 'Proje kesin hakedişi', 1)
ON CONFLICT (name) DO NOTHING;

COMMENT ON TABLE units IS 'Ölçü birimleri tablosu (kg, m, m², vb.)';
COMMENT ON TABLE unit_conversions IS 'Birim çevirim tablosu';
COMMENT ON TABLE material_types IS 'Malzeme türleri - hiyerarşik yapı';
COMMENT ON TABLE materials IS 'Malzemeler tablosu';
COMMENT ON TABLE material_code_mappings IS 'Firma bazlı malzeme kod eşleştirme';
COMMENT ON TABLE teams IS 'İş ekipleri';
COMMENT ON TABLE team_members IS 'Ekip üyeleri';
COMMENT ON TABLE unit_prices IS 'Malzeme birim fiyatları - proje ve tarih bazlı';
COMMENT ON TABLE progress_payment_types IS 'Hakediş türleri';
COMMENT ON TABLE progress_payments IS 'Hakediş ana kayıtları';
COMMENT ON TABLE progress_payment_details IS 'Hakediş detay satırları';
