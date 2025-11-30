-- Add license plates for BMW M3 and M4 Competition
-- Run this in Supabase SQL Editor

-- Update vehicles table with targa
UPDATE vehicles
SET targa = 'GE112GC'
WHERE display_name ILIKE '%BMW M3 Competition%';

UPDATE vehicles
SET targa = 'KNMC484'
WHERE display_name ILIKE '%BMW M4 Competition%';

-- Update existing bookings with vehicle_plate
UPDATE bookings
SET vehicle_plate = 'GE112GC'
WHERE vehicle_name ILIKE '%BMW M3 Competition%';

UPDATE bookings
SET vehicle_plate = 'KNMC484'
WHERE vehicle_name ILIKE '%BMW M4 Competition%';

-- Verify the updates
SELECT display_name, targa, status, category
FROM vehicles
WHERE display_name ILIKE '%BMW M%Competition%'
ORDER BY display_name;

-- Check bookings
SELECT vehicle_name, vehicle_plate, customer_name, pickup_date, status
FROM bookings
WHERE vehicle_name ILIKE '%BMW M%Competition%'
ORDER BY pickup_date DESC
LIMIT 5;
