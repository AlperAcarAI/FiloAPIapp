-- ========================
-- Outage Process Management Tables Migration
-- ========================

-- Ana tablo: fo_outage_process
CREATE TABLE IF NOT EXISTS fo_outage_process (
  id SERIAL PRIMARY KEY,
  firm_id INTEGER NOT NULL REFERENCES companies(id),
  processor_firm_id INTEGER NOT NULL REFERENCES companies(id),
  cause_of_outage TEXT,
  root_build_name VARCHAR(255),
  root_build_code VARCHAR(100),
  output_start_point VARCHAR(255),
  start_date DATE NOT NULL,
  end_date DATE,
  start_clock VARCHAR(8), -- TIME as HH:MM:SS
  end_clock VARCHAR(8), -- TIME as HH:MM:SS
  area_of_outage TEXT,
  supervisor_id INTEGER REFERENCES personnel(id),
  processor_supervisor VARCHAR(255),
  worker_chef_id INTEGER REFERENCES personnel(id),
  project_id INTEGER REFERENCES projects(id),
  pyp TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by INTEGER REFERENCES users(id),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_by INTEGER REFERENCES users(id),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Junction table: fo_outage_process_personnels
CREATE TABLE IF NOT EXISTS fo_outage_process_personnels (
  id SERIAL PRIMARY KEY,
  outage_process_id INTEGER NOT NULL REFERENCES fo_outage_process(id) ON DELETE CASCADE,
  personnel_id INTEGER NOT NULL REFERENCES personnel(id),
  CONSTRAINT unique_outage_personnel UNIQUE (outage_process_id, personnel_id)
);

-- Junction table: fo_outage_process_assets
CREATE TABLE IF NOT EXISTS fo_outage_process_assets (
  id SERIAL PRIMARY KEY,
  outage_process_id INTEGER NOT NULL REFERENCES fo_outage_process(id) ON DELETE CASCADE,
  asset_id INTEGER NOT NULL REFERENCES assets(id),
  CONSTRAINT unique_outage_asset UNIQUE (outage_process_id, asset_id)
);

-- ========================
-- Indexes for fo_outage_process
-- ========================

CREATE INDEX IF NOT EXISTS idx_fo_outage_process_firm ON fo_outage_process(firm_id);
CREATE INDEX IF NOT EXISTS idx_fo_outage_process_processor_firm ON fo_outage_process(processor_firm_id);
CREATE INDEX IF NOT EXISTS idx_fo_outage_process_project ON fo_outage_process(project_id);
CREATE INDEX IF NOT EXISTS idx_fo_outage_process_dates ON fo_outage_process(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_fo_outage_process_active ON fo_outage_process(is_active);

-- ========================
-- Indexes for fo_outage_process_personnels
-- ========================

CREATE INDEX IF NOT EXISTS idx_fo_outage_personnels_process ON fo_outage_process_personnels(outage_process_id);
CREATE INDEX IF NOT EXISTS idx_fo_outage_personnels_personnel ON fo_outage_process_personnels(personnel_id);

-- ========================
-- Indexes for fo_outage_process_assets
-- ========================

CREATE INDEX IF NOT EXISTS idx_fo_outage_assets_process ON fo_outage_process_assets(outage_process_id);
CREATE INDEX IF NOT EXISTS idx_fo_outage_assets_asset ON fo_outage_process_assets(asset_id);

-- ========================
-- Comments for documentation
-- ========================

COMMENT ON TABLE fo_outage_process IS 'Kesinti işlem süreçlerini yöneten ana tablo';
COMMENT ON COLUMN fo_outage_process.firm_id IS 'Kesinti yapan firma ID (companies tablosuna referans)';
COMMENT ON COLUMN fo_outage_process.processor_firm_id IS 'İşlemi yapan firma ID (companies tablosuna referans)';
COMMENT ON COLUMN fo_outage_process.supervisor_id IS 'Denetçi personel ID (personnel tablosuna referans)';
COMMENT ON COLUMN fo_outage_process.worker_chef_id IS 'İşçi şefi personel ID (personnel tablosuna referans)';
COMMENT ON COLUMN fo_outage_process.processor_supervisor IS 'İşlemci denetçisi (metin)';
COMMENT ON COLUMN fo_outage_process.project_id IS 'İlişkili proje ID (projects tablosuna referans)';
COMMENT ON COLUMN fo_outage_process.pyp IS 'PYP bilgisi';

COMMENT ON TABLE fo_outage_process_personnels IS 'Kesinti işlemine atanan personeller (many-to-many junction table)';
COMMENT ON TABLE fo_outage_process_assets IS 'Kesinti işleminde kullanılan makineler/araçlar (many-to-many junction table)';
