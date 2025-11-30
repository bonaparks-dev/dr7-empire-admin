-- Migration for Calendario Veicoli with Targa and Lottery Ticket Improvements
-- Run this in Supabase SQL Editor
-- Date: 2025-11-30

-- ============================================================================
-- 1. ADD TARGA (LICENSE PLATE) COLUMNS IF NOT EXISTS
-- ============================================================================

-- Add targa column to vehicles table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'vehicles'
        AND column_name = 'targa'
    ) THEN
        ALTER TABLE vehicles ADD COLUMN targa TEXT;
        COMMENT ON COLUMN vehicles.targa IS 'Vehicle license plate number';
    END IF;
END $$;

-- Add vehicle_plate column to bookings table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'bookings'
        AND column_name = 'vehicle_plate'
    ) THEN
        ALTER TABLE bookings ADD COLUMN vehicle_plate TEXT;
        COMMENT ON COLUMN bookings.vehicle_plate IS 'License plate of the booked vehicle';
    END IF;
END $$;

-- ============================================================================
-- 2. UPDATE BMW LICENSE PLATES
-- ============================================================================

-- Update vehicles table with BMW plates
UPDATE vehicles
SET targa = 'GE112GC'
WHERE display_name ILIKE '%BMW M3 Competition%'
AND (targa IS NULL OR targa = '');

UPDATE vehicles
SET targa = 'KNMC484'
WHERE display_name ILIKE '%BMW M4 Competition%'
AND (targa IS NULL OR targa = '');

-- Update existing bookings with BMW vehicle plates
UPDATE bookings
SET vehicle_plate = 'GE112GC'
WHERE vehicle_name ILIKE '%BMW M3 Competition%'
AND (vehicle_plate IS NULL OR vehicle_plate = '');

UPDATE bookings
SET vehicle_plate = 'KNMC484'
WHERE vehicle_name ILIKE '%BMW M4 Competition%'
AND (vehicle_plate IS NULL OR vehicle_plate = '');

-- ============================================================================
-- 3. SYNC VEHICLE PLATES FROM VEHICLES TO BOOKINGS
-- ============================================================================

-- Update all bookings to have vehicle_plate from vehicles table
UPDATE bookings b
SET vehicle_plate = v.targa
FROM vehicles v
WHERE b.vehicle_name = v.display_name
AND v.targa IS NOT NULL
AND v.targa != ''
AND (b.vehicle_plate IS NULL OR b.vehicle_plate = '');

-- ============================================================================
-- 4. CREATE INDEXES FOR BETTER PERFORMANCE
-- ============================================================================

-- Index on vehicles.targa for faster lookups
CREATE INDEX IF NOT EXISTS idx_vehicles_targa
ON vehicles(targa)
WHERE targa IS NOT NULL;

-- Index on bookings.vehicle_plate for faster filtering
CREATE INDEX IF NOT EXISTS idx_bookings_vehicle_plate
ON bookings(vehicle_plate)
WHERE vehicle_plate IS NOT NULL;

-- Index on bookings.vehicle_name for faster joins
CREATE INDEX IF NOT EXISTS idx_bookings_vehicle_name
ON bookings(vehicle_name);

-- Index on bookings.customer_name for search functionality
CREATE INDEX IF NOT EXISTS idx_bookings_customer_name
ON bookings(customer_name);

-- ============================================================================
-- 5. VERIFICATION QUERIES
-- ============================================================================

-- Verify vehicles with targa
SELECT
    display_name,
    targa,
    status,
    category,
    CASE
        WHEN targa IS NOT NULL AND targa != '' THEN '✅ Has Targa'
        ELSE '⚠️ Missing Targa'
    END as targa_status
FROM vehicles
WHERE status != 'retired'
ORDER BY
    CASE category
        WHEN 'exotic' THEN 1
        WHEN 'urban' THEN 2
        WHEN 'aziendali' THEN 3
        ELSE 4
    END,
    display_name;

-- Verify bookings with vehicle_plate
SELECT
    vehicle_name,
    vehicle_plate,
    customer_name,
    pickup_date,
    status,
    CASE
        WHEN vehicle_plate IS NOT NULL AND vehicle_plate != '' THEN '✅ Has Plate'
        ELSE '⚠️ Missing Plate'
    END as plate_status
FROM bookings
WHERE status != 'cancelled'
ORDER BY pickup_date DESC
LIMIT 20;

-- Count bookings missing vehicle_plate
SELECT
    COUNT(*) as total_bookings,
    COUNT(vehicle_plate) as bookings_with_plate,
    COUNT(*) - COUNT(vehicle_plate) as bookings_missing_plate,
    ROUND(COUNT(vehicle_plate)::numeric / COUNT(*)::numeric * 100, 2) as percentage_complete
FROM bookings
WHERE status != 'cancelled';

-- ============================================================================
-- 6. OPTIONAL: ADD MORE VEHICLE PLATES
-- ============================================================================

-- Add plates for other vehicles (uncomment and customize as needed)
/*
UPDATE vehicles SET targa = 'XX123YY' WHERE display_name ILIKE '%Ferrari F8%';
UPDATE vehicles SET targa = 'ZZ456WW' WHERE display_name ILIKE '%Lamborghini%';
UPDATE vehicles SET targa = 'AA789BB' WHERE display_name ILIKE '%Porsche 911%';
*/

-- ============================================================================
-- 7. TRIGGER TO AUTO-SYNC VEHICLE_PLATE IN BOOKINGS
-- ============================================================================

-- Create or replace function to auto-populate vehicle_plate
CREATE OR REPLACE FUNCTION sync_booking_vehicle_plate()
RETURNS TRIGGER AS $$
BEGIN
    -- When a new booking is created or vehicle_name is updated
    IF (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.vehicle_name IS DISTINCT FROM NEW.vehicle_name)) THEN
        -- Try to get the plate from vehicles table
        SELECT targa INTO NEW.vehicle_plate
        FROM vehicles
        WHERE display_name = NEW.vehicle_name
        AND targa IS NOT NULL
        AND targa != ''
        LIMIT 1;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trg_sync_booking_vehicle_plate ON bookings;

CREATE TRIGGER trg_sync_booking_vehicle_plate
    BEFORE INSERT OR UPDATE OF vehicle_name ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION sync_booking_vehicle_plate();

-- ============================================================================
-- 8. FINAL SUMMARY
-- ============================================================================

DO $$
DECLARE
    v_vehicles_with_targa INTEGER;
    v_total_vehicles INTEGER;
    v_bookings_with_plate INTEGER;
    v_total_bookings INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total_vehicles FROM vehicles WHERE status != 'retired';
    SELECT COUNT(*) INTO v_vehicles_with_targa FROM vehicles WHERE status != 'retired' AND targa IS NOT NULL AND targa != '';

    SELECT COUNT(*) INTO v_total_bookings FROM bookings WHERE status != 'cancelled';
    SELECT COUNT(*) INTO v_bookings_with_plate FROM bookings WHERE status != 'cancelled' AND vehicle_plate IS NOT NULL AND vehicle_plate != '';

    RAISE NOTICE '============================================';
    RAISE NOTICE 'MIGRATION COMPLETE!';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Vehicles with Targa: % / % (%.2f%%)',
        v_vehicles_with_targa, v_total_vehicles,
        (v_vehicles_with_targa::numeric / NULLIF(v_total_vehicles, 0)::numeric * 100);
    RAISE NOTICE 'Bookings with Plate: % / % (%.2f%%)',
        v_bookings_with_plate, v_total_bookings,
        (v_bookings_with_plate::numeric / NULLIF(v_total_bookings, 0)::numeric * 100);
    RAISE NOTICE '============================================';
END $$;
