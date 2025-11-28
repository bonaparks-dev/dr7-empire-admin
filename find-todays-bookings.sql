-- Find ALL bookings from today to see what we have
SELECT
  id,
  customer_name,
  service_type,
  service_name,
  vehicle_name,
  appointment_date,
  appointment_time,
  pickup_date,
  (price_total / 100.0) as price_euro,
  status,
  created_at
FROM bookings
WHERE (
  appointment_date = CURRENT_DATE
  OR DATE(pickup_date) = CURRENT_DATE
)
ORDER BY created_at DESC
LIMIT 50;
