-- ========================
-- PG_TRGM EXTENSION - Fuzzy Text Matching için
-- Malzeme kod eşleştirmede bulanık arama desteği sağlar
-- ========================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- materials.name üzerinde trigram index
CREATE INDEX IF NOT EXISTS idx_materials_name_trgm ON materials USING gin (name gin_trgm_ops);

-- material_code_mappings.company_material_name üzerinde trigram index
CREATE INDEX IF NOT EXISTS idx_material_code_mappings_name_trgm ON material_code_mappings USING gin (company_material_name gin_trgm_ops);
