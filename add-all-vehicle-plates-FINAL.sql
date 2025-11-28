-- Add license plates (targa) to all ACTIVE vehicles in Supabase
-- Based on actual vehicle registrations
-- Only updates vehicles that are NOT retired

-- EXOTIC SUPERCARS / HIGH PERFORMANCE
UPDATE vehicles SET plate = 'PAB3550' WHERE display_name ILIKE '%RS3%Rossa%' AND status != 'retired';
UPDATE vehicles SET plate = 'PAMT299' WHERE display_name ILIKE '%RS3%Verde%' AND status != 'retired';
UPDATE vehicles SET plate = 'GE112GC' WHERE display_name ILIKE '%M3%Competition%' AND status != 'retired';
UPDATE vehicles SET plate = 'KNMC484' WHERE display_name ILIKE '%M4%Competition%' AND status != 'retired';
UPDATE vehicles SET plate = 'GV937BT' WHERE display_name ILIKE '%A45%S%AMG%' AND status != 'retired';
UPDATE vehicles SET plate = 'GS684XV' WHERE display_name ILIKE '%C63%S%AMG%' AND status != 'retired';
UPDATE vehicles SET plate = 'KNGL630' WHERE display_name ILIKE '%GLE%63%AMG%' AND status != 'retired';
UPDATE vehicles SET plate = 'FW048TM' WHERE display_name ILIKE '%Porsche%992%' AND status != 'retired';
UPDATE vehicles SET plate = 'FW048TM' WHERE display_name ILIKE '%Carrera%4S%' AND status != 'retired';

-- URBAN VEHICLES - Set first occurrence
UPDATE vehicles SET plate = 'FS286CZ'
WHERE display_name ILIKE '%Panda%Benzina%Bianca%'
  AND status != 'retired'
  AND plate IS NULL
  AND id = (
    SELECT id FROM vehicles
    WHERE display_name ILIKE '%Panda%Benzina%Bianca%'
      AND status != 'retired'
    ORDER BY id ASC
    LIMIT 1
  );

-- Second Panda Bianca
UPDATE vehicles SET plate = 'GK837BP'
WHERE display_name ILIKE '%Panda%Benzina%Bianca%'
  AND status != 'retired'
  AND plate IS NULL
  AND id = (
    SELECT id FROM vehicles
    WHERE display_name ILIKE '%Panda%Benzina%Bianca%'
      AND status != 'retired'
      AND plate IS NULL
    ORDER BY id ASC
    LIMIT 1
  );

UPDATE vehicles SET plate = 'GL318PV' WHERE display_name ILIKE '%Panda%Benzina%Grigia%' AND status != 'retired';
UPDATE vehicles SET plate = 'FK571DR' WHERE display_name ILIKE '%Panda%Diesel%Arancione%' AND status != 'retired';
UPDATE vehicles SET plate = 'GR392YJ' WHERE display_name ILIKE '%Captur%' AND status != 'retired';

-- AZIENDALI (BUSINESS VEHICLES)
UPDATE vehicles SET plate = 'KNBK881' WHERE display_name ILIKE '%Ducato%Maxi%' AND status != 'retired';
UPDATE vehicles SET plate = 'KNBK881' WHERE display_name ILIKE '%Fiat%Ducato%' AND status != 'retired' AND plate IS NULL;
UPDATE vehicles SET plate = 'GV059GV' WHERE display_name ILIKE '%Vito%VIP%' AND status != 'retired';
UPDATE vehicles SET plate = 'GV059GV' WHERE display_name ILIKE '%Mercedes%Vito%' AND status != 'retired' AND plate IS NULL;

-- Verify the updates - Show all vehicles with plates
SELECT display_name, plate, category, status
FROM vehicles
WHERE plate IS NOT NULL
ORDER BY category, display_name;

-- Show active vehicles without plates (need attention)
SELECT display_name, category, status
FROM vehicles
WHERE plate IS NULL
  AND status != 'retired'
ORDER BY category, display_name;
