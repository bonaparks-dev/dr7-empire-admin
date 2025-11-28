-- Add 'unavailable' to vehicle status CHECK constraint
-- This allows vehicles to be marked as temporarily unavailable

-- Drop the old constraint
ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS vehicles_status_check;

-- Add new constraint with 'unavailable' included
ALTER TABLE vehicles ADD CONSTRAINT vehicles_status_check
CHECK (status IN ('available', 'unavailable', 'rented', 'maintenance', 'retired'));
