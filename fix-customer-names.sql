-- DR7 Empire: Fix Customer Names
-- This script updates customer records that have email addresses in the full_name field
-- It extracts the correct names from the booking_details JSON in the bookings table

-- Step 1: Update customers with correct names from bookings
UPDATE customers
SET
  full_name = COALESCE(
    b.booking_details->'customer'->>'fullName',
    'Unknown Customer'
  ),
  updated_at = NOW()
FROM (
  SELECT DISTINCT ON (user_id)
    user_id,
    booking_details
  FROM bookings
  WHERE
    user_id IS NOT NULL
    AND booking_details->'customer'->>'fullName' IS NOT NULL
    AND booking_details->'customer'->>'fullName' != ''
  ORDER BY user_id, created_at DESC
) AS b
WHERE
  customers.id = b.user_id
  AND (
    -- Only update if full_name looks like an email (contains @)
    customers.full_name LIKE '%@%'
    OR customers.full_name = 'Unknown Customer'
    OR customers.full_name IS NULL
  );

-- Step 2: Display update summary
SELECT
  COUNT(*) as updated_count,
  'Customers with corrected names' as description
FROM customers
WHERE
  full_name NOT LIKE '%@%'
  AND full_name != 'Unknown Customer'
  AND updated_at >= NOW() - INTERVAL '1 minute';

-- Step 3: Show remaining customers that still need attention
SELECT
  id,
  full_name,
  email,
  created_at
FROM customers
WHERE
  (full_name LIKE '%@%' OR full_name = 'Unknown Customer')
ORDER BY created_at DESC
LIMIT 20;
