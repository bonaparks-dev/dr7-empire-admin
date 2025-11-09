-- STEP 2: Add Utility vehicles
INSERT INTO vehicles (display_name, plate, status, daily_rate, category, metadata) VALUES ('Fiat Panda Benzina (Arancione)', NULL, 'available', 29.90, 'urban', '{"pricing": {"daily": 29.90, "weekly": 149, "monthly": 599}, "color": "Arancione", "image": "/panda.jpeg"}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO vehicles (display_name, plate, status, daily_rate, category, metadata) VALUES ('Fiat Panda Benzina (Bianca)', NULL, 'available', 29.90, 'urban', '{"pricing": {"daily": 29.90, "weekly": 149, "monthly": 599}, "color": "Bianca", "image": "/panda.jpeg"}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO vehicles (display_name, plate, status, daily_rate, category, metadata) VALUES ('Fiat Panda Diesel (Grigia)', NULL, 'available', 34.90, 'urban', '{"pricing": {"daily": 34.90, "weekly": 189, "monthly": 749}, "color": "Grigia", "image": "/panda.jpeg"}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO vehicles (display_name, plate, status, daily_rate, category, metadata) VALUES ('Renault Captur', NULL, 'available', 44.90, 'urban', '{"pricing": {"daily": 44.90, "weekly": 239, "monthly": 899}, "image": "/captur.jpeg"}'::jsonb) ON CONFLICT DO NOTHING;
UPDATE vehicles SET status = 'retired' WHERE display_name = 'Fiat Panda' AND display_name NOT LIKE '%(%';
UPDATE vehicles SET daily_rate = 249, display_name = 'Mercedes V Class VIP DR7' WHERE display_name LIKE 'Mercedes%Classe V%' OR display_name LIKE 'Mercedes-Benz Classe V%';
UPDATE vehicles SET daily_rate = 79, display_name = 'Furgone DR7 (Fiat Ducato Maxi)' WHERE display_name LIKE 'Fiat Ducato%';
