-- First, let's add some vehicles to the vehicles table
-- Based on the bookings data, these are the vehicles used in your system

INSERT INTO vehicles (display_name, plate, status, daily_rate, metadata, created_at, updated_at)
VALUES
  ('Audi RS3 Verde', NULL, 'available', 196.90, '{"color": "verde"}', NOW(), NOW()),
  ('Audi RS3', NULL, 'available', 196.90, NULL, NOW(), NOW()),
  ('Porsche Cayenne S', NULL, 'available', 253.00, NULL, NOW(), NOW()),
  ('Car Wash Service', NULL, 'available', 100.00, '{"service_type": "car_wash"}', NOW(), NOW()),
  ('BMW M4', NULL, 'available', 180.00, NULL, NOW(), NOW()),
  ('Mercedes AMG GT', NULL, 'available', 220.00, NULL, NOW(), NOW()),
  ('Lamborghini Huracan', NULL, 'available', 500.00, NULL, NOW(), NOW()),
  ('Ferrari 488', NULL, 'available', 600.00, NULL, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Check if reservations table exists, if not we can create it
-- The admin panel expects this table structure
