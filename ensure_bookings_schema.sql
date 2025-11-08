-- ========================================
-- ENSURE BOOKINGS TABLE HAS ALL COLUMNS FOR ADMIN PANEL
-- Safe to run multiple times (uses IF NOT EXISTS)
-- ========================================

-- Add columns needed for vehicle rental bookings from admin panel
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS pickup_date timestamp with time zone;

ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS dropoff_date timestamp with time zone;

ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS vehicle_image_url text;

ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS pickup_location character varying;

ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS dropoff_location character varying;

ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS payment_method character varying;

ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();

ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();

ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Ensure all car rental fields are nullable (for car wash bookings)
ALTER TABLE public.bookings
ALTER COLUMN pickup_date DROP NOT NULL;

ALTER TABLE public.bookings
ALTER COLUMN dropoff_date DROP NOT NULL;

ALTER TABLE public.bookings
ALTER COLUMN vehicle_name DROP NOT NULL;

ALTER TABLE public.bookings
ALTER COLUMN pickup_location DROP NOT NULL;

ALTER TABLE public.bookings
ALTER COLUMN dropoff_location DROP NOT NULL;

-- Create indexes for availability checks
CREATE INDEX IF NOT EXISTS idx_bookings_vehicle_name ON public.bookings(vehicle_name);
CREATE INDEX IF NOT EXISTS idx_bookings_pickup_date ON public.bookings(pickup_date);
CREATE INDEX IF NOT EXISTS idx_bookings_dropoff_date ON public.bookings(dropoff_date);

-- Add comments
COMMENT ON COLUMN public.bookings.pickup_date IS 'Rental start date - required for car rentals, NULL for car wash';
COMMENT ON COLUMN public.bookings.dropoff_date IS 'Rental end date - required for car rentals, NULL for car wash';
COMMENT ON COLUMN public.bookings.vehicle_name IS 'Name of the vehicle being rented';
COMMENT ON COLUMN public.bookings.vehicle_image_url IS 'URL to vehicle image';

-- ========================================
-- UPDATE RLS POLICIES FOR ADMIN ACCESS
-- ========================================

-- Allow service role (admin) to read all bookings
DROP POLICY IF EXISTS "Allow service role to read all bookings" ON public.bookings;
CREATE POLICY "Allow service role to read all bookings"
ON public.bookings
FOR SELECT
TO service_role
USING (true);

-- Allow service role (admin) to insert bookings
DROP POLICY IF EXISTS "Allow service role to insert bookings" ON public.bookings;
CREATE POLICY "Allow service role to insert bookings"
ON public.bookings
FOR INSERT
TO service_role
WITH CHECK (true);

-- Allow service role (admin) to update bookings
DROP POLICY IF EXISTS "Allow service role to update bookings" ON public.bookings;
CREATE POLICY "Allow service role to update bookings"
ON public.bookings
FOR UPDATE
TO service_role
USING (true);

-- Allow anon role to read confirmed/pending bookings (for availability check)
DROP POLICY IF EXISTS "Allow anon to read confirmed bookings" ON public.bookings;
CREATE POLICY "Allow anon to read confirmed bookings"
ON public.bookings
FOR SELECT
TO anon
USING (status IN ('confirmed', 'pending'));

-- ========================================
-- VERIFICATION
-- ========================================
SELECT 
    column_name,
    data_type,
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name = 'bookings'
    AND column_name IN (
        'pickup_date', 
        'dropoff_date', 
        'vehicle_name', 
        'vehicle_image_url',
        'pickup_location',
        'dropoff_location',
        'payment_method',
        'status'
    )
ORDER BY 
    column_name;
