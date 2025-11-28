-- DEBUG: Check if car rental bookings exist and their service_type values
-- Run this in Supabase SQL Editor to diagnose calendar issue

-- 1. Count all bookings
SELECT COUNT(*) as total_bookings FROM bookings;

-- 2. Count bookings by service_type
SELECT 
  service_type,
  COUNT(*) as count
FROM bookings
GROUP BY service_type
ORDER BY count DESC;

-- 3. Show recent car rental bookings
SELECT 
  id,
  vehicle_name,
  pickup_date,
  dropoff_date,
  status,
  service_type,
  customer_name
FROM bookings
WHERE (service_type IS NULL OR service_type = 'car_rental')
  AND status != 'cancelled'
ORDER BY pickup_date DESC
LIMIT 20;

-- 4. Check if any bookings have different service_type that should be car_rental
SELECT 
  id,
  vehicle_name,
  service_type,
  pickup_date,
  dropoff_date
FROM bookings
WHERE service_type NOT IN ('car_wash', 'mechanical_service')
  AND service_type IS NOT NULL
  AND status != 'cancelled'
LIMIT 10;
