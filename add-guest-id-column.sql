-- Add guest_id column for guest bookings
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS guest_id character varying;

-- Create index for guest_id lookups
CREATE INDEX IF NOT EXISTS idx_bookings_guest_id ON public.bookings(guest_id);

-- Update the check constraint to require either user_id or guest_id
ALTER TABLE public.bookings
DROP CONSTRAINT IF EXISTS bookings_user_or_guest_check;

ALTER TABLE public.bookings
ADD CONSTRAINT bookings_user_or_guest_check
CHECK (user_id IS NOT NULL OR guest_id IS NOT NULL);

-- Add comment
COMMENT ON COLUMN public.bookings.guest_id IS 'Unique identifier for guest bookings (when user_id is null)';

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'bookings'
  AND column_name IN ('user_id', 'guest_id');
