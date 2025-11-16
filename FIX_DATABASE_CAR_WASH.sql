-- STEP 1: Check if there are any problematic triggers or functions on bookings table
SELECT
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'bookings';

-- STEP 2: Check default values and constraints on ID column
SELECT
    column_name,
    column_default,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'bookings' AND column_name IN ('id', 'user_id', 'vehicle_type');

-- STEP 3: Try to insert a car wash booking directly in SQL
-- Replace values with actual data from your form
INSERT INTO bookings (
    user_id,
    guest_name,
    guest_email,
    guest_phone,
    vehicle_type,
    vehicle_name,
    vehicle_image_url,
    service_type,
    service_name,
    appointment_date,
    appointment_time,
    pickup_date,
    dropoff_date,
    pickup_location,
    dropoff_location,
    price_total,
    currency,
    status,
    payment_status,
    payment_method,
    customer_name,
    customer_email,
    customer_phone,
    booked_at,
    booking_source,
    booking_details
) VALUES (
    NULL::uuid,  -- user_id - explicitly cast to uuid
    'Test Customer',  -- guest_name
    'test@example.com',  -- guest_email
    '+1234567890',  -- guest_phone
    'service',  -- vehicle_type
    'LAVAGGIO COMPLETO',  -- vehicle_name
    NULL,  -- vehicle_image_url
    'car_wash',  -- service_type
    'LAVAGGIO COMPLETO',  -- service_name
    '2025-11-20',  -- appointment_date
    '10:00',  -- appointment_time
    '2025-11-20T10:00:00Z',  -- pickup_date
    '2025-11-20T11:00:00Z',  -- dropoff_date
    'Office',  -- pickup_location
    'Office',  -- dropoff_location
    2500,  -- price_total (25.00 EUR in cents)
    'EUR',  -- currency
    'confirmed',  -- status
    'completed',  -- payment_status
    'agency',  -- payment_method
    'Test Customer',  -- customer_name
    'test@example.com',  -- customer_email
    '+1234567890',  -- customer_phone
    NOW(),  -- booked_at
    'admin',  -- booking_source
    jsonb_build_object(
        'customer', jsonb_build_object(
            'fullName', 'Test Customer',
            'email', 'test@example.com',
            'phone', '+1234567890'
        ),
        'source', 'admin_manual'
    )  -- booking_details
) RETURNING id;

-- STEP 4: If the above fails, check what functions exist related to uuid/max
SELECT
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines
WHERE routine_name LIKE '%max%' OR routine_name LIKE '%uuid%'
AND routine_schema = 'public';
