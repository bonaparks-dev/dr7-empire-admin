-- Add appointment_time column for car wash bookings
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS appointment_time character varying;

-- Add comment
COMMENT ON COLUMN public.bookings.appointment_time IS 'Time slot for car wash appointments (e.g., 09:00, 09:30)';

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'bookings'
  AND column_name = 'appointment_time';
