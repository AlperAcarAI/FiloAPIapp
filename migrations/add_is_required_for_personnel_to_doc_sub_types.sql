-- Migration: Add is_required_for_personnel column to doc_sub_types table
-- Date: 2026-01-26
-- Description: Adds a boolean flag to mark which document types are required for personnel

-- Add the new column
ALTER TABLE doc_sub_types
ADD COLUMN IF NOT EXISTS is_required_for_personnel BOOLEAN NOT NULL DEFAULT false;

-- Optional: Set some common required document types (you can customize this based on your needs)
-- These are examples based on the personnel_work_areas_routes.ts termination check
UPDATE doc_sub_types
SET is_required_for_personnel = true
WHERE LOWER(name) IN ('kimlik', 'sgk', 'imza beyannamesi', 'iş sözleşmesi', 'adli sicil kaydı');

-- Add a comment to the column for documentation
COMMENT ON COLUMN doc_sub_types.is_required_for_personnel IS 'Indicates if this document type is required for personnel. Used for missing document reports and personnel termination checks.';
