-- ========================================
-- ADD GUEST FIELDS TO BOOKINGS TABLE
-- This allows admin-created bookings for non-registered customers
-- ========================================

-- 1. Add guest fields (nullable to not break existing records)
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS guest_name character varying;

ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS guest_email character varying;

ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS guest_phone character varying;

-- 2. Create the check constraint
-- This ensures either user_id OR guest_name must be present
ALTER TABLE public.bookings
DROP CONSTRAINT IF EXISTS bookings_user_or_guest_check;

ALTER TABLE public.bookings
ADD CONSTRAINT bookings_user_or_guest_check
CHECK (
  -- Must have EITHER a user_id OR a guest_name
  (user_id IS NOT NULL) OR
  (guest_name IS NOT NULL)
);

-- 3. Add helpful comments
COMMENT ON COLUMN public.bookings.guest_name IS 'Guest customer name (for non-registered users)';
COMMENT ON COLUMN public.bookings.guest_email IS 'Guest customer email (for non-registered users)';
COMMENT ON COLUMN public.bookings.guest_phone IS 'Guest customer phone (for non-registered users)';

-- 4. Create index for guest bookings
CREATE INDEX IF NOT EXISTS idx_bookings_guest_email ON public.bookings(guest_email);

-- ========================================
-- DONE!
-- Run this in your Supabase SQL Editor
-- ========================================
