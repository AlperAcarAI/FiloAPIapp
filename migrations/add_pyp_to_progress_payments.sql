-- Migration: Add pyp_id column to progress_payments table
-- Description: Adds a reference to project_pyps table in progress_payments
-- Date: 2026-01-25

-- Add pyp_id column to progress_payments table
ALTER TABLE progress_payments
ADD COLUMN pyp_id INTEGER REFERENCES project_pyps(id);

-- Add index for better query performance
CREATE INDEX idx_progress_payments_pyp ON progress_payments(pyp_id);

-- Add comment to column
COMMENT ON COLUMN progress_payments.pyp_id IS 'PYP (Proje Yapı Parçası) referansı - isteğe bağlı';

-- Note: This migration is safe to run on existing data
-- Existing records will have pyp_id as NULL, which is acceptable
-- since the column is optional (not NOT NULL)
