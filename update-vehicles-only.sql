-- Update vehicle prices according to DR7 official price list
-- Run this script to update all vehicle prices

-- SPORT & LUXURY vehicles

UPDATE vehicles SET daily_rate = 40, metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{pricing}', '{"daily": 40, "weekly": 200, "monthly": 500}'::jsonb) WHERE display_name = 'Audi RS3 Verde';

UPDATE vehicles SET daily_rate = 60, metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{pricing}', '{"daily": 60, "weekly": 350, "monthly": 500}'::jsonb) WHERE display_name = 'Audi RS3 Rossa';

UPDATE vehicles SET daily_rate = 70, metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{pricing}', '{"daily": 70, "weekly": 400, "monthly": 500}'::jsonb) WHERE display_name = 'Mercedes A45 S AMG';

UPDATE vehicles SET daily_rate = 70, metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{pricing}', '{"daily": 70, "weekly": 400, "monthly": 500}'::jsonb) WHERE display_name = 'BMW M3 Competition';

UPDATE vehicles SET daily_rate = 80, metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{pricing}', '{"daily": 80, "weekly": 450, "monthly": 1000}'::jsonb) WHERE display_name = 'Porsche Macan GTS';

UPDATE vehicles SET daily_rate = 80, metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{pricing}', '{"daily": 80, "weekly": 450, "monthly": 750}'::jsonb) WHERE display_name = 'BMW M4 Competition';

UPDATE vehicles SET daily_rate = 80, metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{pricing}', '{"daily": 80, "weekly": 450, "monthly": 1500}'::jsonb) WHERE display_name = 'Mercedes GLE 63 AMG';

UPDATE vehicles SET daily_rate = 100, metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{pricing}', '{"daily": 100, "weekly": 600, "monthly": 1500}'::jsonb) WHERE display_name = 'Mercedes C63 S AMG';

UPDATE vehicles SET daily_rate = 150, metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{pricing}', '{"daily": 150, "weekly": 900, "monthly": 2000}'::jsonb) WHERE display_name = 'Porsche 992 Carrera 4S';

-- CITY & UTILITY vehicles

INSERT INTO vehicles (display_name, plate, status, daily_rate, category, metadata) VALUES ('Fiat Panda Benzina (Arancione)', NULL, 'available', 29.90, 'urban', '{"pricing": {"daily": 29.90, "weekly": 149, "monthly": 599}, "color": "Arancione", "image": "/panda-orange.jpeg", "specs": {"power": "70Cv", "seats": "5 posti", "engine": "1.2L Benzina"}}'::jsonb) ON CONFLICT DO NOTHING;

INSERT INTO vehicles (display_name, plate, status, daily_rate, category, metadata) VALUES ('Fiat Panda Benzina (Bianca)', NULL, 'available', 29.90, 'urban', '{"pricing": {"daily": 29.90, "weekly": 149, "monthly": 599}, "color": "Bianca", "image": "/panda-white.jpeg", "specs": {"power": "70Cv", "seats": "5 posti", "engine": "1.2L Benzina"}}'::jsonb) ON CONFLICT DO NOTHING;

INSERT INTO vehicles (display_name, plate, status, daily_rate, category, metadata) VALUES ('Fiat Panda Diesel (Grigia)', NULL, 'available', 34.90, 'urban', '{"pricing": {"daily": 34.90, "weekly": 189, "monthly": 749}, "color": "Grigia", "image": "/panda-grey.jpeg", "specs": {"power": "95Cv", "seats": "5 posti", "engine": "1.3L MultiJet Diesel"}}'::jsonb) ON CONFLICT DO NOTHING;

UPDATE vehicles SET status = 'retired' WHERE display_name = 'Fiat Panda' AND display_name NOT LIKE '%(%';

INSERT INTO vehicles (display_name, plate, status, daily_rate, category, metadata) VALUES ('Renault Captur', NULL, 'available', 44.90, 'urban', '{"pricing": {"daily": 44.90, "weekly": 239, "monthly": 899}, "image": "/captur.jpeg", "specs": {"power": "130Cv", "seats": "5 posti", "engine": "1.3L TCe"}}'::jsonb) ON CONFLICT DO NOTHING;

UPDATE vehicles SET daily_rate = 249, display_name = 'Mercedes V Class VIP DR7', metadata = jsonb_set(jsonb_set(COALESCE(metadata, '{}'::jsonb), '{pricing}', '{"daily": 249, "ncc": "Su preventivo personalizzato"}'::jsonb), '{notes}', '"Corse con conducente (Taxi/NCC) disponibili"'::jsonb) WHERE display_name LIKE 'Mercedes%Classe V%' OR display_name LIKE 'Mercedes-Benz Classe V%';

UPDATE vehicles SET daily_rate = 79, display_name = 'Furgone DR7 (Fiat Ducato Maxi)', metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{pricing}', '{"daily": 79, "weekly": 549, "monthly": 1950}'::jsonb) WHERE display_name LIKE 'Fiat Ducato%';

SELECT display_name, daily_rate, category, status, metadata->'pricing' as pricing_info FROM vehicles ORDER BY category, daily_rate;
