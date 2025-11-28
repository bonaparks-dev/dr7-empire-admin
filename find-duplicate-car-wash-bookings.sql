-- Find duplicate car wash bookings (same customer, same time, same date)
-- Run this in Supabase SQL Editor to see duplicates

SELECT
  id,
  customer_name,
  customer_phone,
  service_name,
  appointment_date,
  appointment_time,
  price_total,
  created_at
FROM bookings
WHERE service_type = 'car_wash'
  AND appointment_date = CURRENT_DATE
  AND status != 'cancelled'
ORDER BY customer_name, appointment_time, created_at;

-- To delete duplicates, keeping only the FIRST one created:
-- CAREFUL: Review the results above first, then uncomment and run below

/*
WITH duplicates AS (
  SELECT
    id,
    customer_name,
    appointment_time,
    ROW_NUMBER() OVER (
      PARTITION BY customer_name, appointment_date, appointment_time
      ORDER BY created_at ASC
    ) as rn
  FROM bookings
  WHERE service_type = 'car_wash'
    AND appointment_date = CURRENT_DATE
    AND status != 'cancelled'
)
DELETE FROM bookings
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
)
RETURNING id, customer_name, appointment_time;
*/
