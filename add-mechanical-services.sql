-- ========================================
-- ADD MECHANICAL SERVICE SUPPORT TO BOOKINGS TABLE
-- This migration adds all necessary columns for mechanical service bookings
-- ========================================

-- 1. Add service_id column (to track which specific service was booked)
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS service_id character varying;

-- 2. Add customer contact columns (for both guest and user bookings)
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS customer_name character varying;

ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS customer_email character varying;

ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS customer_phone character varying;

-- 3. Add currency column (defaults to EUR)
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS currency character varying DEFAULT 'EUR';

-- 4. Ensure service_type and service_name exist
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS service_type character varying;

ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS service_name character varying;

-- 5. Ensure appointment_date and appointment_time exist
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS appointment_date character varying;

ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS appointment_time character varying;

-- 6. Add helpful comments
COMMENT ON COLUMN public.bookings.service_id IS 'Service identifier (e.g., brake-pads-front, service-city)';
COMMENT ON COLUMN public.bookings.service_type IS 'Type of service: car_rental, car_wash, or mechanical_service';
COMMENT ON COLUMN public.bookings.service_name IS 'Display name of the service';
COMMENT ON COLUMN public.bookings.vehicle_name IS 'For rentals: our vehicle name. For car wash/mechanical: customer vehicle info';
COMMENT ON COLUMN public.bookings.customer_name IS 'Customer full name (copied from user or guest)';
COMMENT ON COLUMN public.bookings.customer_email IS 'Customer email (copied from user or guest)';
COMMENT ON COLUMN public.bookings.customer_phone IS 'Customer phone (copied from user or guest)';
COMMENT ON COLUMN public.bookings.appointment_date IS 'Date for appointment-based services (car wash, mechanical)';
COMMENT ON COLUMN public.bookings.appointment_time IS 'Time slot for appointment (e.g., 09:00, 09:30, 15:00)';

-- 7. Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_bookings_service_type ON public.bookings(service_type);
CREATE INDEX IF NOT EXISTS idx_bookings_service_id ON public.bookings(service_id);
CREATE INDEX IF NOT EXISTS idx_bookings_appointment_date ON public.bookings(appointment_date);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_email ON public.bookings(customer_email);

-- 8. Verify all columns exist
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'bookings'
  AND column_name IN (
    'service_id',
    'service_type', 
    'service_name', 
    'appointment_date', 
    'appointment_time', 
    'vehicle_name', 
    'customer_name',
    'customer_email',
    'customer_phone',
    'currency',
    'price_total', 
    'booking_details'
  )
ORDER BY ordinal_position;

-- ========================================
-- DONE!
-- Run this in your Supabase SQL Editor
-- After running this, mechanical service bookings will work correctly
-- ========================================
