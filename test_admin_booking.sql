-- ========================================
-- TEST ADMIN MANUAL BOOKING
-- This simulates what the admin panel does
-- ========================================

-- Test 1: Insert a manual car rental booking
INSERT INTO public.bookings (
    vehicle_name,
    vehicle_image_url,
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
    booking_details
) VALUES (
    'Lamborghini Huracán Evo',
    NULL,
    '2025-12-01T10:00:00Z',
    '2025-12-03T18:00:00Z',
    'Sede DR7',
    'Sede DR7',
    120000, -- 1200€ in cents
    'eur',
    'confirmed',
    'completed',
    'agency',
    'Test Customer',
    'test@example.com',
    '+39 123 456 7890',
    '{"customer": {"fullName": "Test Customer", "email": "test@example.com", "phone": "+39 123 456 7890"}, "source": "admin_manual"}'::jsonb
) RETURNING *;

-- Test 2: Check if this blocks availability
-- This should return the booking we just created
SELECT 
    vehicle_name,
    pickup_date,
    dropoff_date,
    status,
    customer_name
FROM public.bookings
WHERE vehicle_name = 'Lamborghini Huracán Evo'
  AND status IN ('confirmed', 'pending')
  AND pickup_date <= '2025-12-02T12:00:00Z'
  AND dropoff_date >= '2025-12-02T12:00:00Z';

-- Test 3: Clean up test data
-- DELETE FROM public.bookings WHERE customer_email = 'test@example.com';
