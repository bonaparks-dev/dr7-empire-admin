-- Add payment_method column to commercial_operation_tickets table
-- This column stores how the customer paid for the lottery ticket
-- Run this migration in Supabase SQL Editor

-- Add payment_method column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'commercial_operation_tickets'
    AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE commercial_operation_tickets
    ADD COLUMN payment_method TEXT;

    RAISE NOTICE 'Added payment_method column to commercial_operation_tickets';
  ELSE
    RAISE NOTICE 'payment_method column already exists in commercial_operation_tickets';
  END IF;
END $$;

-- Set default payment method for existing records (optional)
UPDATE commercial_operation_tickets
SET payment_method = 'Online'
WHERE payment_method IS NULL
  AND payment_intent_id LIKE 'pi_%';

UPDATE commercial_operation_tickets
SET payment_method = 'Contanti'
WHERE payment_method IS NULL
  AND payment_intent_id LIKE 'manual_%';

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'commercial_operation_tickets'
ORDER BY ordinal_position;
