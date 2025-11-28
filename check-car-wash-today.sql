-- Check all car wash bookings from today
SELECT
  id,
  customer_name,
  customer_phone,
  service_name,
  appointment_date,
  appointment_time,
  (price_total / 100.0) as price_euro,
  status,
  TO_CHAR(created_at, 'HH24:MI:SS') as time_created
FROM bookings
WHERE service_type = 'car_wash'
  AND appointment_date >= CURRENT_DATE
  AND appointment_date < CURRENT_DATE + INTERVAL '1 day'
ORDER BY appointment_time, customer_name, created_at;

-- Count duplicates
SELECT
  customer_name,
  appointment_time,
  COUNT(*) as num_bookings,
  ARRAY_AGG(id) as booking_ids
FROM bookings
WHERE service_type = 'car_wash'
  AND appointment_date >= CURRENT_DATE
  AND appointment_date < CURRENT_DATE + INTERVAL '1 day'
  AND status != 'cancelled'
GROUP BY customer_name, appointment_time
HAVING COUNT(*) > 1
ORDER BY appointment_time;
