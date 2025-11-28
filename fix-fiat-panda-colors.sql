-- Fix Fiat Panda vehicles - should have 1 grey benzina and 1 white benzina ONLY
-- Run this in Supabase SQL Editor

-- Step 1: Check current Fiat Panda vehicles
SELECT id, display_name, plate, status, metadata->'color' as color
FROM vehicles
WHERE display_name LIKE 'Fiat Panda%'
ORDER BY display_name;

-- Step 2: Set all current Fiat Pandas to 'retired' status
UPDATE vehicles
SET status = 'retired'
WHERE display_name LIKE 'Fiat Panda%';

-- Step 3: Insert the TWO correct Fiat Panda vehicles
-- 1. Fiat Panda Benzina GRIGIO (grey)
INSERT INTO vehicles (display_name, plate, status, daily_rate, category, metadata)
VALUES (
  'Fiat Panda Benzina (Grigia)',
  NULL,
  'available',
  29.90,
  'urban',
  '{"pricing": {"daily": 29.90, "weekly": 149, "monthly": 599}, "color": "Grigia", "image": "/panda1.jpeg", "specs": {"power": "70Cv", "seats": "5 posti", "engine": "1.2L Benzina"}}'::jsonb
) ON CONFLICT (display_name) DO UPDATE
SET status = 'available',
    daily_rate = 29.90,
    metadata = EXCLUDED.metadata;

-- 2. Fiat Panda Benzina BIANCA (white)
INSERT INTO vehicles (display_name, plate, status, daily_rate, category, metadata)
VALUES (
  'Fiat Panda Benzina (Bianca)',
  NULL,
  'available',
  29.90,
  'urban',
  '{"pricing": {"daily": 29.90, "weekly": 149, "monthly": 599}, "color": "Bianca", "image": "/panda2.jpeg", "specs": {"power": "70Cv", "seats": "5 posti", "engine": "1.2L Benzina"}}'::jsonb
) ON CONFLICT (display_name) DO UPDATE
SET status = 'available',
    daily_rate = 29.90,
    metadata = EXCLUDED.metadata;

-- Step 4: Verify - should only see 2 available Fiat Pandas
SELECT id, display_name, plate, status, metadata->'color' as color
FROM vehicles
WHERE display_name LIKE 'Fiat Panda%'
AND status = 'available'
ORDER BY display_name;

-- Expected result:
-- 1. Fiat Panda Benzina (Bianca) - color: "Bianca"
-- 2. Fiat Panda Benzina (Grigia) - color: "Grigia"

