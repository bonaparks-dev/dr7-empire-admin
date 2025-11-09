-- STEP 1: Update Sport & Luxury vehicles
UPDATE vehicles SET daily_rate = 40, metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{pricing}', '{"daily": 40, "weekly": 200, "monthly": 500}'::jsonb) WHERE display_name = 'Audi RS3 Verde';
UPDATE vehicles SET daily_rate = 60, metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{pricing}', '{"daily": 60, "weekly": 350, "monthly": 500}'::jsonb) WHERE display_name = 'Audi RS3 Rossa';
UPDATE vehicles SET daily_rate = 70, metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{pricing}', '{"daily": 70, "weekly": 400, "monthly": 500}'::jsonb) WHERE display_name = 'Mercedes A45 S AMG';
UPDATE vehicles SET daily_rate = 70, metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{pricing}', '{"daily": 70, "weekly": 400, "monthly": 500}'::jsonb) WHERE display_name = 'BMW M3 Competition';
UPDATE vehicles SET daily_rate = 80, metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{pricing}', '{"daily": 80, "weekly": 450, "monthly": 1000}'::jsonb) WHERE display_name = 'Porsche Macan GTS';
UPDATE vehicles SET daily_rate = 80, metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{pricing}', '{"daily": 80, "weekly": 450, "monthly": 750}'::jsonb) WHERE display_name = 'BMW M4 Competition';
UPDATE vehicles SET daily_rate = 80, metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{pricing}', '{"daily": 80, "weekly": 450, "monthly": 1500}'::jsonb) WHERE display_name = 'Mercedes GLE 63 AMG';
UPDATE vehicles SET daily_rate = 100, metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{pricing}', '{"daily": 100, "weekly": 600, "monthly": 1500}'::jsonb) WHERE display_name = 'Mercedes C63 S AMG';
UPDATE vehicles SET daily_rate = 150, metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{pricing}', '{"daily": 150, "weekly": 900, "monthly": 2000}'::jsonb) WHERE display_name = 'Porsche 992 Carrera 4S';
