-- Projects table creation and personnel_work_areas update
-- Created: $(date)

-- 1. Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    po_company_id INTEGER NOT NULL REFERENCES companies(id),
    pp_company_id INTEGER NOT NULL REFERENCES companies(id),
    work_area_id INTEGER REFERENCES work_areas(id),
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'planned',
    city_id INTEGER REFERENCES cities(id),
    project_total_price DECIMAL(15,2),
    complete_rate DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    updated_by INTEGER REFERENCES users(id),
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- 2. Create indexes for projects table
CREATE INDEX IF NOT EXISTS idx_projects_code ON projects(code);
CREATE INDEX IF NOT EXISTS idx_projects_po_company ON projects(po_company_id);
CREATE INDEX IF NOT EXISTS idx_projects_pp_company ON projects(pp_company_id);
CREATE INDEX IF NOT EXISTS idx_projects_work_area ON projects(work_area_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_dates ON projects(start_date, end_date);

-- 3. Add project_id column to personnel_work_areas
ALTER TABLE personnel_work_areas 
ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES projects(id);

-- 4. Add missing created_at and updated_at to personnel_work_areas if they don't exist
ALTER TABLE personnel_work_areas 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 5. Create additional indexes for personnel_work_areas
CREATE INDEX IF NOT EXISTS idx_personnel_work_areas_personnel ON personnel_work_areas(personnel_id);
CREATE INDEX IF NOT EXISTS idx_personnel_work_areas_work_area ON personnel_work_areas(work_area_id);
CREATE INDEX IF NOT EXISTS idx_personnel_work_areas_project ON personnel_work_areas(project_id);
CREATE INDEX IF NOT EXISTS idx_personnel_work_areas_active ON personnel_work_areas(is_active);

-- 6. Add comments
COMMENT ON TABLE projects IS 'Proje yönetimi tablosu - PO/PP şirketler, çalışma alanları ve bütçe bilgileri';
COMMENT ON COLUMN projects.po_company_id IS 'PO (Purchase Order) - Satın alma şirketi';
COMMENT ON COLUMN projects.pp_company_id IS 'PP (Project Partner) - Proje ortağı şirketi';
COMMENT ON COLUMN projects.complete_rate IS 'Tamamlanma oranı (0-100)';
COMMENT ON COLUMN personnel_work_areas.project_id IS 'Personelin atandığı proje ID';

-- 7. Check constraints for data integrity
ALTER TABLE projects 
ADD CONSTRAINT IF NOT EXISTS chk_projects_complete_rate 
CHECK (complete_rate >= 0 AND complete_rate <= 100);

ALTER TABLE projects 
ADD CONSTRAINT IF NOT EXISTS chk_projects_status 
CHECK (status IN ('planned', 'active', 'completed', 'cancelled'));

