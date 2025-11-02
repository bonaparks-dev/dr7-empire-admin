-- DR7 Empire: Migrate Bookings to Reservations Table
-- This SQL script migrates data from bookings table to reservations table

-- Step 1: Create or update customers from bookings data
INSERT INTO customers (id, full_name, email, phone, created_at, updated_at)
SELECT DISTINCT
  user_id as id,
  COALESCE(
    booking_details->>'customer'->>'fullName',  -- Extract from JSON booking_details
    booking_details->'customer'->>'fullName',   -- Alternative JSON path
    customer_name,                               -- Fallback to direct column if exists
    customer_email,                              -- Last resort: use email
    'Unknown Customer'
  ) as full_name,
  COALESCE(
    booking_details->'customer'->>'email',      -- Extract email from JSON
    customer_email
  ) as email,
  COALESCE(
    booking_details->'customer'->>'phone',      -- Extract phone from JSON
    customer_phone
  ) as phone,
  MIN(created_at) as created_at,
  MIN(created_at) as updated_at
FROM bookings
WHERE user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM customers WHERE customers.id = bookings.user_id
  )
GROUP BY
  user_id,
  booking_details->'customer'->>'fullName',
  booking_details->'customer'->>'email',
  booking_details->'customer'->>'phone',
  customer_name,
  customer_email,
  customer_phone
ON CONFLICT (id) DO NOTHING;

-- Step 2: Find or create vehicle IDs based on vehicle_name
-- First, let's create a mapping for common vehicles

-- Step 3: Migrate bookings to reservations
-- Only migrate bookings that have valid dates and customer info
INSERT INTO reservations (
  customer_id,
  vehicle_id,
  start_at,
  end_at,
  status,
  source,
  total_amount,
  currency,
  addons,
  created_at,
  updated_at
)
SELECT
  b.user_id as customer_id,
  -- Match vehicle by name, or use first available if no match
  COALESCE(
    (SELECT id FROM vehicles WHERE display_name = b.vehicle_name LIMIT 1),
    (SELECT id FROM vehicles WHERE display_name LIKE '%' || SPLIT_PART(b.vehicle_name, ' ', 1) || '%' LIMIT 1),
    (SELECT id FROM vehicles ORDER BY created_at LIMIT 1)
  ) as vehicle_id,
  COALESCE(b.pickup_date, b.booked_at, b.created_at) as start_at,
  COALESCE(b.dropoff_date, b.pickup_date + INTERVAL '1 day', b.booked_at + INTERVAL '1 day') as end_at,
  CASE
    WHEN b.status = 'confirmed' THEN 'confirmed'
    WHEN b.status = 'pending' THEN 'pending'
    WHEN b.status = 'cancelled' THEN 'cancelled'
    ELSE 'pending'
  END as status,
  COALESCE(b.payment_method, 'website') as source,
  b.price_total / 100.0 as total_amount,  -- Convert cents to euros
  b.currency as currency,
  jsonb_build_object(
    'booking_id', b.id,
    'vehicle_name', b.vehicle_name,
    'customer_name', b.customer_name,
    'payment_status', b.payment_status,
    'booking_details', b.booking_details
  ) as addons,
  b.created_at,
  b.updated_at
FROM bookings b
WHERE b.user_id IS NOT NULL
  AND b.pickup_date IS NOT NULL
  AND b.vehicle_name IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM reservations r
    WHERE r.addons->>'booking_id' = b.id::text
  )
ORDER BY b.created_at DESC
LIMIT 100;  -- Migrate in batches

-- Step 4: Display migration summary
SELECT
  'Customers migrated' as entity,
  COUNT(*) as count
FROM customers
WHERE created_at >= NOW() - INTERVAL '1 hour'

UNION ALL

SELECT
  'Reservations migrated' as entity,
  COUNT(*) as count
FROM reservations
WHERE created_at >= NOW() - INTERVAL '1 hour';
