-- Find duplicate bookings in the database
-- Run this in Supabase SQL Editor

-- Find bookings with the same customer name, vehicle, and dates
SELECT
  customer_name,
  customer_email,
  customer_phone,
  vehicle_name,
  service_type,
  pickup_date,
  dropoff_date,
  appointment_date,
  COUNT(*) as duplicate_count,
  STRING_AGG(id::text, ', ') as booking_ids,
  STRING_AGG(status, ', ') as statuses,
  STRING_AGG(created_at::text, ', ') as created_dates
FROM bookings
GROUP BY
  customer_name,
  customer_email,
  customer_phone,
  vehicle_name,
  service_type,
  pickup_date,
  dropoff_date,
  appointment_date
HAVING COUNT(*) > 1
ORDER BY customer_name;

-- To see full details of duplicates for "Michela frau":
-- SELECT * FROM bookings
-- WHERE LOWER(customer_name) LIKE '%michela%frau%'
-- OR LOWER(customer_email) LIKE '%miriana.sanna%'
-- ORDER BY created_at DESC;

-- To delete specific duplicate by ID (replace with actual ID):
-- DELETE FROM bookings WHERE id = 'YOUR_BOOKING_ID_HERE';
