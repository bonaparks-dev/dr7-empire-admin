-- ========================================
-- FIX: Remove license plate numbers from display_name
-- The plate should ONLY be in the "plate" column, NOT in display_name
-- ========================================

-- 1. Preview what will be fixed (vehicles with plate in display_name)
SELECT
  id,
  display_name as old_name,
  plate,
  CASE
    WHEN plate IS NOT NULL AND display_name LIKE '%' || plate || '%' THEN
      TRIM(REPLACE(display_name, plate, ''))
    ELSE
      display_name
  END as new_name
FROM vehicles
WHERE plate IS NOT NULL
  AND display_name LIKE '%' || plate || '%'
ORDER BY display_name;

-- 2. Fix the names - Remove plate from display_name
-- (Uncomment and run after reviewing above)
-- UPDATE vehicles
-- SET display_name = TRIM(REPLACE(display_name, plate, ''))
-- WHERE plate IS NOT NULL
--   AND display_name LIKE '%' || plate || '%';

-- 3. Verify all vehicles after fix
-- SELECT id, display_name, plate FROM vehicles ORDER BY display_name;

-- ========================================
-- EXPLANATION:
-- Problem: Someone is copying the plate number into the display_name field
-- Example:
--   display_name: "Audi RS3 Verde PAMT299"
--   plate: "PAMT299"
--
-- This should be:
--   display_name: "Audi RS3 Verde"
--   plate: "PAMT299"
--
-- The calendar can't match bookings because:
--   Booking has: "Audi RS3 Verde"
--   Vehicle has: "Audi RS3 Verde PAMT299"
--   NO MATCH → Calendar shows green (available) incorrectly!
-- ========================================
