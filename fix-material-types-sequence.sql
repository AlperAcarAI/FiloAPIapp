-- Fix material_types sequence to prevent duplicate key errors
-- This resets the sequence to be one higher than the current max ID

SELECT setval('material_types_id_seq', COALESCE((SELECT MAX(id) FROM material_types), 0) + 1, false);

-- Verify the fix
SELECT 
    'Current max ID in table: ' || COALESCE(MAX(id), 0) as table_status 
FROM material_types
UNION ALL
SELECT 
    'Next sequence value will be: ' || nextval('material_types_id_seq')::text as sequence_status;
