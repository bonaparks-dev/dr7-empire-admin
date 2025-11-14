-- Retire Audi RS3 Rossa and Macan GTS from both admin panel and main website
-- Setting status to 'retired' will hide them from all vehicle lists

UPDATE vehicles
SET status = 'retired', updated_at = NOW()
WHERE display_name IN ('Audi RS3 Rossa', 'Macan GTS', 'Porsche Macan GTS');

-- Verify the changes
SELECT id, display_name, status, updated_at
FROM vehicles
WHERE display_name IN ('Audi RS3 Rossa', 'Macan GTS', 'Porsche Macan GTS')
ORDER BY display_name;
