-- ==========================================
-- FIX ALL URBAN VEHICLES (5 TOTAL)
-- ==========================================

-- Delete all existing urban vehicles to start fresh
DELETE FROM vehicles WHERE display_name LIKE 'Fiat Panda%';
DELETE FROM vehicles WHERE display_name LIKE 'Renault Captur%';
DELETE FROM vehicles WHERE display_name LIKE 'Mercedes V%' OR display_name LIKE 'Mercedes-Benz%V%';

-- Insert the 5 URBAN vehicles correctly
INSERT INTO vehicles (display_name, plate, status, daily_rate, category, metadata)
VALUES
-- 1. Panda Benzina Grigia (29.90€)
('Fiat Panda Benzina (Grigia)', NULL, 'available', 29.90, 'urban', '{"pricing": {"daily": 29.90, "weekly": 149, "monthly": 599}, "color": "Grigia", "image": "/panda1.jpeg"}'::jsonb),

-- 2. Panda Benzina Bianca (29.90€)
('Fiat Panda Benzina (Bianca)', NULL, 'available', 29.90, 'urban', '{"pricing": {"daily": 29.90, "weekly": 149, "monthly": 599}, "color": "Bianca", "image": "/panda2.jpeg"}'::jsonb),

-- 3. Panda Diesel Arancione (34.90€)
('Fiat Panda Diesel (Arancione)', NULL, 'available', 34.90, 'urban', '{"pricing": {"daily": 34.90, "weekly": 189, "monthly": 749}, "color": "Arancione", "image": "/panda3.jpeg"}'::jsonb),

-- 4. Renault Captur (44.90€)
('Renault Captur', NULL, 'available', 44.90, 'urban', '{"pricing": {"daily": 44.90, "weekly": 239, "monthly": 899}, "image": "/captur.jpeg"}'::jsonb),

-- 5. Mercedes Vito VIP DR7 (249€)
('Mercedes Vito VIP DR7', NULL, 'available', 249, 'urban', '{"pricing": {"daily": 249, "ncc": "Su preventivo personalizzato"}, "notes": "Corse con conducente (Taxi/NCC) disponibili", "image": "/vito.jpeg"}'::jsonb)

ON CONFLICT (display_name) DO UPDATE
SET
  status = EXCLUDED.status,
  daily_rate = EXCLUDED.daily_rate,
  category = EXCLUDED.category,
  metadata = EXCLUDED.metadata;

-- Verify all 5 urban vehicles
SELECT
  display_name,
  daily_rate,
  category,
  status,
  metadata->'color' as color,
  metadata->'image' as image
FROM vehicles
WHERE category = 'urban' AND status = 'available'
ORDER BY daily_rate;
