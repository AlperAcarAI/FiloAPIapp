-- Stok Yönetim Sistemi Migration
-- Tarih: 2026-03-04

-- 1. Depolar (Warehouses) - Şantiyeye bağlı
CREATE TABLE IF NOT EXISTS warehouses (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  work_area_id INTEGER NOT NULL REFERENCES work_areas(id),
  manager_id INTEGER REFERENCES personnel(id),
  warehouse_type VARCHAR(20) NOT NULL DEFAULT 'ana_depo',
  address TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by INTEGER REFERENCES users(id),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_by INTEGER REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_warehouses_code ON warehouses(code);
CREATE INDEX IF NOT EXISTS idx_warehouses_work_area ON warehouses(work_area_id);
CREATE INDEX IF NOT EXISTS idx_warehouses_type ON warehouses(warehouse_type);
CREATE INDEX IF NOT EXISTS idx_warehouses_active ON warehouses(is_active);

-- 2. Stok Seviyeleri (Stock Levels)
CREATE TABLE IF NOT EXISTS stock_levels (
  id SERIAL PRIMARY KEY,
  warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
  material_id INTEGER NOT NULL REFERENCES materials(id),
  unit_id INTEGER NOT NULL REFERENCES units(id),
  current_quantity DECIMAL(15,4) NOT NULL DEFAULT 0,
  reserved_quantity DECIMAL(15,4) NOT NULL DEFAULT 0,
  min_quantity DECIMAL(15,4),
  last_movement_date TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_by INTEGER REFERENCES users(id),
  CONSTRAINT unique_warehouse_material_unit UNIQUE (warehouse_id, material_id, unit_id),
  CONSTRAINT check_current_qty_non_negative CHECK (current_quantity >= 0),
  CONSTRAINT check_reserved_qty_non_negative CHECK (reserved_quantity >= 0),
  CONSTRAINT check_reserved_lte_current CHECK (reserved_quantity <= current_quantity)
);

CREATE INDEX IF NOT EXISTS idx_stock_levels_warehouse ON stock_levels(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_levels_material ON stock_levels(material_id);
CREATE INDEX IF NOT EXISTS idx_stock_levels_unit ON stock_levels(unit_id);

-- 3. Proje Bazlı Stok Rezervasyonu (Stock Reservations)
CREATE TABLE IF NOT EXISTS stock_reservations (
  id SERIAL PRIMARY KEY,
  warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
  project_id INTEGER NOT NULL REFERENCES projects(id),
  material_id INTEGER NOT NULL REFERENCES materials(id),
  unit_id INTEGER NOT NULL REFERENCES units(id),
  reserved_quantity DECIMAL(15,4) NOT NULL,
  used_quantity DECIMAL(15,4) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by INTEGER REFERENCES users(id),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_by INTEGER REFERENCES users(id),
  CONSTRAINT unique_reservation UNIQUE (warehouse_id, project_id, material_id, unit_id),
  CONSTRAINT check_reserved_positive CHECK (reserved_quantity > 0),
  CONSTRAINT check_used_non_negative CHECK (used_quantity >= 0),
  CONSTRAINT check_used_lte_reserved CHECK (used_quantity <= reserved_quantity)
);

CREATE INDEX IF NOT EXISTS idx_stock_reservations_warehouse ON stock_reservations(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_reservations_project ON stock_reservations(project_id);
CREATE INDEX IF NOT EXISTS idx_stock_reservations_material ON stock_reservations(material_id);
CREATE INDEX IF NOT EXISTS idx_stock_reservations_status ON stock_reservations(status);

-- 4. Stok Hareketleri (Stock Movements)
CREATE TABLE IF NOT EXISTS stock_movements (
  id SERIAL PRIMARY KEY,
  movement_code VARCHAR(50) NOT NULL UNIQUE,
  movement_type VARCHAR(20) NOT NULL,
  movement_date TIMESTAMP NOT NULL DEFAULT NOW(),
  source_warehouse_id INTEGER REFERENCES warehouses(id),
  target_warehouse_id INTEGER REFERENCES warehouses(id),
  project_id INTEGER REFERENCES projects(id),
  company_id INTEGER REFERENCES companies(id),
  is_free BOOLEAN NOT NULL DEFAULT false,
  reference_type VARCHAR(30),
  reference_no VARCHAR(100),
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'taslak',
  approved_by INTEGER REFERENCES users(id),
  approved_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by INTEGER REFERENCES users(id),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_by INTEGER REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_code ON stock_movements(movement_code);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(movement_date);
CREATE INDEX IF NOT EXISTS idx_stock_movements_source ON stock_movements(source_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_target ON stock_movements(target_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_project ON stock_movements(project_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_company ON stock_movements(company_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_status ON stock_movements(status);
CREATE INDEX IF NOT EXISTS idx_stock_movements_is_free ON stock_movements(is_free);

-- 5. Stok Hareket Detayları (Stock Movement Items)
CREATE TABLE IF NOT EXISTS stock_movement_items (
  id SERIAL PRIMARY KEY,
  movement_id INTEGER NOT NULL REFERENCES stock_movements(id) ON DELETE CASCADE,
  material_id INTEGER NOT NULL REFERENCES materials(id),
  unit_id INTEGER NOT NULL REFERENCES units(id),
  quantity DECIMAL(15,4) NOT NULL,
  unit_price_cents INTEGER NOT NULL DEFAULT 0,
  line_total_cents INTEGER NOT NULL DEFAULT 0,
  is_free BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  CONSTRAINT check_item_quantity_positive CHECK (quantity > 0),
  CONSTRAINT check_item_price_non_negative CHECK (unit_price_cents >= 0)
);

CREATE INDEX IF NOT EXISTS idx_stock_movement_items_movement ON stock_movement_items(movement_id);
CREATE INDEX IF NOT EXISTS idx_stock_movement_items_material ON stock_movement_items(material_id);
CREATE INDEX IF NOT EXISTS idx_stock_movement_items_unit ON stock_movement_items(unit_id);

-- 6. Taşeron Malzeme Takibi (Subcontractor Materials)
CREATE TABLE IF NOT EXISTS subcontractor_materials (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id),
  project_id INTEGER NOT NULL REFERENCES projects(id),
  warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
  material_id INTEGER NOT NULL REFERENCES materials(id),
  unit_id INTEGER NOT NULL REFERENCES units(id),
  given_quantity DECIMAL(15,4) NOT NULL DEFAULT 0,
  used_quantity DECIMAL(15,4) NOT NULL DEFAULT 0,
  returned_quantity DECIMAL(15,4) NOT NULL DEFAULT 0,
  waste_quantity DECIMAL(15,4) NOT NULL DEFAULT 0,
  is_free BOOLEAN NOT NULL DEFAULT false,
  last_update_date TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by INTEGER REFERENCES users(id),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_by INTEGER REFERENCES users(id),
  CONSTRAINT unique_subcontractor_material UNIQUE (company_id, project_id, material_id, unit_id),
  CONSTRAINT check_given_non_negative CHECK (given_quantity >= 0),
  CONSTRAINT check_sub_used_non_negative CHECK (used_quantity >= 0),
  CONSTRAINT check_returned_non_negative CHECK (returned_quantity >= 0),
  CONSTRAINT check_waste_non_negative CHECK (waste_quantity >= 0)
);

CREATE INDEX IF NOT EXISTS idx_sub_materials_company ON subcontractor_materials(company_id);
CREATE INDEX IF NOT EXISTS idx_sub_materials_project ON subcontractor_materials(project_id);
CREATE INDEX IF NOT EXISTS idx_sub_materials_warehouse ON subcontractor_materials(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_sub_materials_material ON subcontractor_materials(material_id);
