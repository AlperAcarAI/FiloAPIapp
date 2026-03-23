-- Hakediş Hiyerarşisi Geliştirmesi
-- Mevcut progress_payments tablosuna nullable kolonlar ekler + yeni merge history tablosu
-- Mevcut veri ve sorgular ETKİLENMEZ.

-- 1. Mevcut tabloya yeni nullable kolonlar ekle
ALTER TABLE progress_payments ADD COLUMN IF NOT EXISTS parent_payment_id INTEGER REFERENCES progress_payments(id);
ALTER TABLE progress_payments ADD COLUMN IF NOT EXISTS revision_number INTEGER NOT NULL DEFAULT 0;
ALTER TABLE progress_payments ADD COLUMN IF NOT EXISTS previous_revision_id INTEGER REFERENCES progress_payments(id);
ALTER TABLE progress_payments ADD COLUMN IF NOT EXISTS revision_reason TEXT;
ALTER TABLE progress_payments ADD COLUMN IF NOT EXISTS institutional_status VARCHAR(20);
ALTER TABLE progress_payments ADD COLUMN IF NOT EXISTS institutional_submitted_at TIMESTAMP;
ALTER TABLE progress_payments ADD COLUMN IF NOT EXISTS institutional_submitted_by INTEGER REFERENCES users(id);
ALTER TABLE progress_payments ADD COLUMN IF NOT EXISTS institutional_approved_at TIMESTAMP;
ALTER TABLE progress_payments ADD COLUMN IF NOT EXISTS institutional_approved_by INTEGER REFERENCES users(id);
ALTER TABLE progress_payments ADD COLUMN IF NOT EXISTS institutional_rejection_reason TEXT;
ALTER TABLE progress_payments ADD COLUMN IF NOT EXISTS is_merged BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE progress_payments ADD COLUMN IF NOT EXISTS merged_into_id INTEGER REFERENCES progress_payments(id);
ALTER TABLE progress_payments ADD COLUMN IF NOT EXISTS merged_at TIMESTAMP;

-- 2. Yeni indexler
CREATE INDEX IF NOT EXISTS idx_progress_payments_parent ON progress_payments(parent_payment_id);
CREATE INDEX IF NOT EXISTS idx_progress_payments_merged ON progress_payments(merged_into_id);

-- 3. Birleştirme geçmişi tablosu
CREATE TABLE IF NOT EXISTS progress_payment_merge_history (
  id SERIAL PRIMARY KEY,
  target_payment_id INTEGER NOT NULL REFERENCES progress_payments(id),
  source_payment_id INTEGER NOT NULL REFERENCES progress_payments(id),
  merged_at TIMESTAMP NOT NULL DEFAULT NOW(),
  merged_by INTEGER REFERENCES users(id),
  notes TEXT,
  CONSTRAINT unique_pp_merge UNIQUE (target_payment_id, source_payment_id)
);

CREATE INDEX IF NOT EXISTS idx_pp_merge_target ON progress_payment_merge_history(target_payment_id);
CREATE INDEX IF NOT EXISTS idx_pp_merge_source ON progress_payment_merge_history(source_payment_id);
