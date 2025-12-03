-- Update 911 Carrera price to 250
UPDATE vehicles 
SET daily_rate = 250 
WHERE display_name ILIKE '%911%carrera%' OR display_name ILIKE '%carrera%';

-- Show the updated record
SELECT id, display_name, daily_rate, status FROM vehicles WHERE display_name ILIKE '%911%' OR display_name ILIKE '%carrera%';
