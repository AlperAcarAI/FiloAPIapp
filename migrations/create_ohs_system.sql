-- İSG (İş Sağlığı Güvenliği / OHS) Sistemi
-- Bu migration yeni tablolar oluşturur, mevcut tablolara dokunmaz.

-- 1. Denetim Şablonları
CREATE TABLE IF NOT EXISTS ohs_inspection_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  category VARCHAR(100),
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by INTEGER REFERENCES users(id),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_by INTEGER REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_ohs_templates_code ON ohs_inspection_templates(code);
CREATE INDEX IF NOT EXISTS idx_ohs_templates_category ON ohs_inspection_templates(category);
CREATE INDEX IF NOT EXISTS idx_ohs_templates_active ON ohs_inspection_templates(is_active);

-- 2. Şablon Maddeleri
CREATE TABLE IF NOT EXISTS ohs_template_items (
  id SERIAL PRIMARY KEY,
  template_id INTEGER NOT NULL REFERENCES ohs_inspection_templates(id) ON DELETE CASCADE,
  item_order INTEGER NOT NULL DEFAULT 0,
  category VARCHAR(100),
  question TEXT NOT NULL,
  response_type VARCHAR(20) NOT NULL DEFAULT 'yes_no',
  is_critical BOOLEAN NOT NULL DEFAULT false,
  reference_regulation VARCHAR(255),
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_ohs_template_items_template ON ohs_template_items(template_id);
CREATE INDEX IF NOT EXISTS idx_ohs_template_items_order ON ohs_template_items(template_id, item_order);

-- 3. Denetim Kayıtları
CREATE TABLE IF NOT EXISTS ohs_inspections (
  id SERIAL PRIMARY KEY,
  inspection_code VARCHAR(50) NOT NULL UNIQUE,
  template_id INTEGER NOT NULL REFERENCES ohs_inspection_templates(id),
  pyp_id INTEGER REFERENCES project_pyps(id),
  project_id INTEGER REFERENCES projects(id),
  work_area_id INTEGER REFERENCES work_areas(id),
  inspection_date DATE NOT NULL,
  inspector_id INTEGER NOT NULL REFERENCES personnel(id),
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  overall_result VARCHAR(25),
  compliance_score DECIMAL(5, 2),
  summary TEXT,
  recommendations TEXT,
  reviewed_by INTEGER REFERENCES users(id),
  reviewed_at TIMESTAMP,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by INTEGER REFERENCES users(id),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_by INTEGER REFERENCES users(id),
  CONSTRAINT check_ohs_insp_status CHECK (status IN ('draft', 'in_progress', 'completed', 'reviewed'))
);

CREATE INDEX IF NOT EXISTS idx_ohs_inspections_code ON ohs_inspections(inspection_code);
CREATE INDEX IF NOT EXISTS idx_ohs_inspections_template ON ohs_inspections(template_id);
CREATE INDEX IF NOT EXISTS idx_ohs_inspections_pyp ON ohs_inspections(pyp_id);
CREATE INDEX IF NOT EXISTS idx_ohs_inspections_project ON ohs_inspections(project_id);
CREATE INDEX IF NOT EXISTS idx_ohs_inspections_inspector ON ohs_inspections(inspector_id);
CREATE INDEX IF NOT EXISTS idx_ohs_inspections_date ON ohs_inspections(inspection_date);
CREATE INDEX IF NOT EXISTS idx_ohs_inspections_status ON ohs_inspections(status);
CREATE INDEX IF NOT EXISTS idx_ohs_inspections_active ON ohs_inspections(is_active);

-- 4. Denetim Madde Sonuçları
CREATE TABLE IF NOT EXISTS ohs_inspection_items (
  id SERIAL PRIMARY KEY,
  inspection_id INTEGER NOT NULL REFERENCES ohs_inspections(id) ON DELETE CASCADE,
  template_item_id INTEGER NOT NULL REFERENCES ohs_template_items(id),
  response VARCHAR(50),
  is_compliant BOOLEAN,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_ohs_inspection_item UNIQUE (inspection_id, template_item_id)
);

CREATE INDEX IF NOT EXISTS idx_ohs_insp_items_inspection ON ohs_inspection_items(inspection_id);
CREATE INDEX IF NOT EXISTS idx_ohs_insp_items_template_item ON ohs_inspection_items(template_item_id);

-- 5. Denetim Fotoğrafları
CREATE TABLE IF NOT EXISTS ohs_inspection_photos (
  id SERIAL PRIMARY KEY,
  inspection_id INTEGER NOT NULL REFERENCES ohs_inspections(id) ON DELETE CASCADE,
  inspection_item_id INTEGER REFERENCES ohs_inspection_items(id) ON DELETE SET NULL,
  photo_url TEXT NOT NULL,
  caption VARCHAR(500),
  taken_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by INTEGER REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_ohs_insp_photos_inspection ON ohs_inspection_photos(inspection_id);
CREATE INDEX IF NOT EXISTS idx_ohs_insp_photos_item ON ohs_inspection_photos(inspection_item_id);

-- 6. Personel İSG Sertifikaları
CREATE TABLE IF NOT EXISTS ohs_personnel_certifications (
  id SERIAL PRIMARY KEY,
  personnel_id INTEGER NOT NULL REFERENCES personnel(id),
  certification_type VARCHAR(100) NOT NULL,
  certificate_number VARCHAR(100),
  issued_by VARCHAR(255),
  issue_date DATE NOT NULL,
  expiry_date DATE,
  document_url TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by INTEGER REFERENCES users(id),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_by INTEGER REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_ohs_certs_personnel ON ohs_personnel_certifications(personnel_id);
CREATE INDEX IF NOT EXISTS idx_ohs_certs_type ON ohs_personnel_certifications(certification_type);
CREATE INDEX IF NOT EXISTS idx_ohs_certs_expiry ON ohs_personnel_certifications(expiry_date);
CREATE INDEX IF NOT EXISTS idx_ohs_certs_status ON ohs_personnel_certifications(status);
CREATE INDEX IF NOT EXISTS idx_ohs_certs_active ON ohs_personnel_certifications(is_active);

-- 7. İş Kazası / Olay Kayıtları
CREATE TABLE IF NOT EXISTS ohs_incidents (
  id SERIAL PRIMARY KEY,
  incident_code VARCHAR(50) NOT NULL UNIQUE,
  pyp_id INTEGER REFERENCES project_pyps(id),
  project_id INTEGER REFERENCES projects(id),
  work_area_id INTEGER REFERENCES work_areas(id),
  incident_date DATE NOT NULL,
  incident_time VARCHAR(8),
  incident_type VARCHAR(30) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  description TEXT NOT NULL,
  location TEXT,
  coordinate_x VARCHAR(50),
  coordinate_y VARCHAR(50),
  affected_personnel_id INTEGER REFERENCES personnel(id),
  injury_description TEXT,
  treatment_given TEXT,
  hospital_referral BOOLEAN NOT NULL DEFAULT false,
  lost_work_days INTEGER DEFAULT 0,
  reported_by_id INTEGER NOT NULL REFERENCES personnel(id),
  reported_to_sgk BOOLEAN NOT NULL DEFAULT false,
  sgk_report_date DATE,
  root_cause TEXT,
  preventive_measures TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'reported',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by INTEGER REFERENCES users(id),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_by INTEGER REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_ohs_incidents_code ON ohs_incidents(incident_code);
CREATE INDEX IF NOT EXISTS idx_ohs_incidents_pyp ON ohs_incidents(pyp_id);
CREATE INDEX IF NOT EXISTS idx_ohs_incidents_project ON ohs_incidents(project_id);
CREATE INDEX IF NOT EXISTS idx_ohs_incidents_date ON ohs_incidents(incident_date);
CREATE INDEX IF NOT EXISTS idx_ohs_incidents_type ON ohs_incidents(incident_type);
CREATE INDEX IF NOT EXISTS idx_ohs_incidents_severity ON ohs_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_ohs_incidents_status ON ohs_incidents(status);
CREATE INDEX IF NOT EXISTS idx_ohs_incidents_affected ON ohs_incidents(affected_personnel_id);
CREATE INDEX IF NOT EXISTS idx_ohs_incidents_active ON ohs_incidents(is_active);

-- 8. Düzeltici Faaliyetler
CREATE TABLE IF NOT EXISTS ohs_corrective_actions (
  id SERIAL PRIMARY KEY,
  inspection_id INTEGER REFERENCES ohs_inspections(id),
  incident_id INTEGER REFERENCES ohs_incidents(id),
  inspection_item_id INTEGER REFERENCES ohs_inspection_items(id),
  action_code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  priority VARCHAR(20) NOT NULL DEFAULT 'medium',
  assigned_to_id INTEGER REFERENCES personnel(id),
  assigned_company_id INTEGER REFERENCES companies(id),
  due_date DATE NOT NULL,
  completed_date DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  verified_by_id INTEGER REFERENCES personnel(id),
  verified_at TIMESTAMP,
  verification_notes TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by INTEGER REFERENCES users(id),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_by INTEGER REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_ohs_ca_inspection ON ohs_corrective_actions(inspection_id);
CREATE INDEX IF NOT EXISTS idx_ohs_ca_incident ON ohs_corrective_actions(incident_id);
CREATE INDEX IF NOT EXISTS idx_ohs_ca_assigned ON ohs_corrective_actions(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_ohs_ca_status ON ohs_corrective_actions(status);
CREATE INDEX IF NOT EXISTS idx_ohs_ca_due_date ON ohs_corrective_actions(due_date);
CREATE INDEX IF NOT EXISTS idx_ohs_ca_priority ON ohs_corrective_actions(priority);
CREATE INDEX IF NOT EXISTS idx_ohs_ca_active ON ohs_corrective_actions(is_active);
