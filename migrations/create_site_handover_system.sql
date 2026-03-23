-- Site Handover (Yer Teslimi) Sistemi
-- Bu migration yeni tablolar oluşturur, mevcut tablolara dokunmaz.

-- 1. Ana Tablo: site_handovers
CREATE TABLE IF NOT EXISTS site_handovers (
  id SERIAL PRIMARY KEY,
  pyp_id INTEGER NOT NULL REFERENCES project_pyps(id),
  handover_code VARCHAR(50) NOT NULL UNIQUE,
  handover_date DATE NOT NULL,
  handover_type VARCHAR(30) NOT NULL DEFAULT 'initial',
  institution_name VARCHAR(255),
  institution_representative VARCHAR(255),
  subcontractor_id INTEGER REFERENCES companies(id),
  location_description TEXT,
  coordinate_x VARCHAR(50),
  coordinate_y VARCHAR(50),
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  notes TEXT,
  completed_at TIMESTAMP,
  completed_by INTEGER REFERENCES users(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by INTEGER REFERENCES users(id),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_by INTEGER REFERENCES users(id),
  CONSTRAINT check_sh_status_value CHECK (status IN ('draft', 'pending_approval', 'approved', 'completed', 'cancelled')),
  CONSTRAINT check_sh_handover_type CHECK (handover_type IN ('initial', 'revision', 'partial'))
);

CREATE INDEX IF NOT EXISTS idx_site_handovers_pyp ON site_handovers(pyp_id);
CREATE INDEX IF NOT EXISTS idx_site_handovers_code ON site_handovers(handover_code);
CREATE INDEX IF NOT EXISTS idx_site_handovers_status ON site_handovers(status);
CREATE INDEX IF NOT EXISTS idx_site_handovers_date ON site_handovers(handover_date);
CREATE INDEX IF NOT EXISTS idx_site_handovers_subcontractor ON site_handovers(subcontractor_id);
CREATE INDEX IF NOT EXISTS idx_site_handovers_active ON site_handovers(is_active);

-- 2. Katılımcılar: site_handover_participants
CREATE TABLE IF NOT EXISTS site_handover_participants (
  id SERIAL PRIMARY KEY,
  handover_id INTEGER NOT NULL REFERENCES site_handovers(id) ON DELETE CASCADE,
  personnel_id INTEGER REFERENCES personnel(id),
  external_name VARCHAR(255),
  external_title VARCHAR(100),
  external_organization VARCHAR(255),
  role VARCHAR(50) NOT NULL,
  signed_at TIMESTAMP,
  signature_data TEXT
);

CREATE INDEX IF NOT EXISTS idx_sh_participants_handover ON site_handover_participants(handover_id);
CREATE INDEX IF NOT EXISTS idx_sh_participants_personnel ON site_handover_participants(personnel_id);

-- 3. Checklist / Punch List: site_handover_items
CREATE TABLE IF NOT EXISTS site_handover_items (
  id SERIAL PRIMARY KEY,
  handover_id INTEGER NOT NULL REFERENCES site_handovers(id) ON DELETE CASCADE,
  item_order INTEGER NOT NULL DEFAULT 0,
  category VARCHAR(100),
  description TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  severity VARCHAR(10),
  defect_description TEXT,
  resolved_at TIMESTAMP,
  resolved_by INTEGER REFERENCES users(id),
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by INTEGER REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_sh_items_handover ON site_handover_items(handover_id);
CREATE INDEX IF NOT EXISTS idx_sh_items_status ON site_handover_items(status);
CREATE INDEX IF NOT EXISTS idx_sh_items_category ON site_handover_items(category);

-- 4. Malzeme İhtiyaç Listesi: site_handover_materials
CREATE TABLE IF NOT EXISTS site_handover_materials (
  id SERIAL PRIMARY KEY,
  handover_id INTEGER NOT NULL REFERENCES site_handovers(id) ON DELETE CASCADE,
  material_id INTEGER NOT NULL REFERENCES materials(id),
  unit_id INTEGER NOT NULL REFERENCES units(id),
  estimated_quantity DECIMAL(15, 4) NOT NULL,
  actual_quantity DECIMAL(15, 4),
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by INTEGER REFERENCES users(id),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_by INTEGER REFERENCES users(id),
  CONSTRAINT unique_sh_material UNIQUE (handover_id, material_id, unit_id)
);

CREATE INDEX IF NOT EXISTS idx_sh_materials_handover ON site_handover_materials(handover_id);
CREATE INDEX IF NOT EXISTS idx_sh_materials_material ON site_handover_materials(material_id);

-- 5. Fotoğraf Dokümantasyonu: site_handover_photos
CREATE TABLE IF NOT EXISTS site_handover_photos (
  id SERIAL PRIMARY KEY,
  handover_id INTEGER NOT NULL REFERENCES site_handovers(id) ON DELETE CASCADE,
  handover_item_id INTEGER REFERENCES site_handover_items(id) ON DELETE SET NULL,
  photo_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption VARCHAR(500),
  photo_type VARCHAR(30) NOT NULL DEFAULT 'general',
  taken_at TIMESTAMP,
  coordinate_x VARCHAR(50),
  coordinate_y VARCHAR(50),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by INTEGER REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_sh_photos_handover ON site_handover_photos(handover_id);
CREATE INDEX IF NOT EXISTS idx_sh_photos_item ON site_handover_photos(handover_item_id);
CREATE INDEX IF NOT EXISTS idx_sh_photos_type ON site_handover_photos(photo_type);
