-- ========================
-- Add Status Column to fo_outage_process
-- ========================

-- Status alanını ekle
ALTER TABLE fo_outage_process 
ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'planned';

-- Index ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_fo_outage_process_status ON fo_outage_process(status);

-- Comment ekle
COMMENT ON COLUMN fo_outage_process.status IS 'Kesinti işlem durumu: planned, ongoing, completed, cancelled';
