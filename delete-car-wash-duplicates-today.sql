-- Step 1: Find duplicate car wash bookings for today
-- Run this first to see what will be deleted

SELECT
  id,
  customer_name,
  customer_phone,
  service_name,
  appointment_date,
  appointment_time,
  (price_total / 100.0) as price_euro,
  created_at,
  ROW_NUMBER() OVER (
    PARTITION BY customer_name, appointment_date, appointment_time
    ORDER BY created_at ASC
  ) as booking_number
FROM bookings
WHERE service_type = 'car_wash'
  AND appointment_date = CURRENT_DATE
  AND status != 'cancelled'
ORDER BY customer_name, appointment_time, created_at;

-- Step 2: Delete ONLY the duplicate bookings (keep the first one)
-- Run this after reviewing the results above

DELETE FROM bookings
WHERE id IN (
  SELECT id
  FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY customer_name, appointment_date, appointment_time
        ORDER BY created_at ASC
      ) as rn
    FROM bookings
    WHERE service_type = 'car_wash'
      AND appointment_date = CURRENT_DATE
      AND status != 'cancelled'
  ) duplicates
  WHERE rn > 1
)
RETURNING id, customer_name, appointment_time, (price_total / 100.0) as price_euro;
