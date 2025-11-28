-- ========================================
-- FIX: Remove "targa" from vehicle display names
-- This broke the calendar matching because bookings use the old names
-- ========================================

-- 1. First, see what needs to be fixed
SELECT 
  id, 
  display_name,
  TRIM(REPLACE(REPLACE(display_name, 'targa', ''), '  ', ' ')) as new_name
FROM vehicles 
WHERE display_name LIKE '%targa%';

-- 2. Fix the names (uncomment and run after reviewing above)
-- UPDATE vehicles 
-- SET display_name = TRIM(REPLACE(REPLACE(display_name, 'targa', ''), '  ', ' '))
-- WHERE display_name LIKE '%targa%';

-- 3. Verify the fix
-- SELECT id, display_name FROM vehicles ORDER BY display_name;

-- ========================================
-- EXPLANATION:
-- - REPLACE(display_name, 'targa', '') removes "targa"
-- - REPLACE(..., '  ', ' ') removes double spaces
-- - TRIM(...) removes leading/trailing spaces
-- 
-- Examples:
-- "Audi RS3 Verde targa" → "Audi RS3 Verde"
-- "targa BMW M3" → "BMW M3"
-- "Mercedes AMG targa GLE" → "Mercedes AMG GLE"
-- ========================================
