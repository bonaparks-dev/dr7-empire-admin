-- Add license plates (targa) to all vehicles in Supabase
-- Based on actual vehicle registrations

-- EXOTIC SUPERCARS / HIGH PERFORMANCE
UPDATE vehicles SET plate = 'PAB3550' WHERE display_name = 'Audi RS3 Rossa';
UPDATE vehicles SET plate = 'PAMT299' WHERE display_name = 'Audi RS3 Verde';
UPDATE vehicles SET plate = 'GE112GC' WHERE display_name = 'BMW M3 Competition';
UPDATE vehicles SET plate = 'KNMC484' WHERE display_name = 'BMW M4 Competition';
UPDATE vehicles SET plate = 'GV937BT' WHERE display_name = 'Mercedes A45 S AMG';
UPDATE vehicles SET plate = 'GS684XV' WHERE display_name = 'Mercedes C63 S AMG';
UPDATE vehicles SET plate = 'KNGL630' WHERE display_name = 'Mercedes GLE 63 AMG';
UPDATE vehicles SET plate = 'FW048TM' WHERE display_name = 'Porsche 992 Carrera 4S';

-- URBAN VEHICLES (Handle multiple Panda Bianca by setting all at once, then updating one)
UPDATE vehicles SET plate = 'FS286CZ' WHERE display_name = 'Fiat Panda Benzina (Bianca)' AND plate IS NULL;
UPDATE vehicles SET plate = 'GL318PV' WHERE display_name = 'Fiat Panda Benzina (Grigia)';
UPDATE vehicles SET plate = 'FK571DR' WHERE display_name = 'Fiat Panda Diesel (Arancione)';
UPDATE vehicles SET plate = 'GR392YJ' WHERE display_name = 'Renault Captur';

-- AZIENDALI (BUSINESS VEHICLES)
UPDATE vehicles SET plate = 'KNBK881' WHERE display_name = 'Fiat Ducato Maxi';
UPDATE vehicles SET plate = 'GV059GV' WHERE display_name = 'Mercedes Vito VIP DR7';

-- Alternative vehicle names (in case they have different display names)
UPDATE vehicles SET plate = 'GL318PV' WHERE display_name ILIKE '%Panda%Grigia%' AND plate IS NULL;
UPDATE vehicles SET plate = 'FK571DR' WHERE display_name ILIKE '%Panda%Arancione%' AND plate IS NULL;
UPDATE vehicles SET plate = 'GR392YJ' WHERE display_name ILIKE '%Captur%' AND plate IS NULL;
UPDATE vehicles SET plate = 'KNBK881' WHERE display_name ILIKE '%Ducato%' AND plate IS NULL;
UPDATE vehicles SET plate = 'GV059GV' WHERE display_name ILIKE '%Vito%' AND plate IS NULL;
UPDATE vehicles SET plate = 'PAB3550' WHERE display_name ILIKE '%RS3%Rossa%' AND plate IS NULL;
UPDATE vehicles SET plate = 'PAMT299' WHERE display_name ILIKE '%RS3%Verde%' AND plate IS NULL;
UPDATE vehicles SET plate = 'GE112GC' WHERE display_name ILIKE '%M3%Competition%' AND plate IS NULL;
UPDATE vehicles SET plate = 'KNMC484' WHERE display_name ILIKE '%M4%Competition%' AND plate IS NULL;
UPDATE vehicles SET plate = 'GV937BT' WHERE display_name ILIKE '%A45%AMG%' AND plate IS NULL;
UPDATE vehicles SET plate = 'GS684XV' WHERE display_name ILIKE '%C63%AMG%' AND plate IS NULL;
UPDATE vehicles SET plate = 'KNGL630' WHERE display_name ILIKE '%GLE%63%' AND plate IS NULL;
UPDATE vehicles SET plate = 'FW048TM' WHERE display_name ILIKE '%Porsche%992%' AND plate IS NULL;

-- Handle the second Fiat Panda Bianca with different plate
-- First, let's update one that doesn't have FS286CZ to GK837BP
UPDATE vehicles
SET plate = 'GK837BP'
WHERE display_name ILIKE '%Panda%Bianca%'
  AND plate = 'FS286CZ'
  AND id IN (
    SELECT id FROM vehicles
    WHERE display_name ILIKE '%Panda%Bianca%'
    ORDER BY id DESC
    LIMIT 1
  );

-- Verify the updates
SELECT display_name, plate, category, status
FROM vehicles
WHERE plate IS NOT NULL
ORDER BY category, display_name;

-- Show any vehicles without plates
SELECT display_name, category, status
FROM vehicles
WHERE plate IS NULL
ORDER BY category, display_name;
