-- Add customer_phone column to commercial_operation_tickets table
-- This allows storing phone numbers for both manual and online ticket purchases

ALTER TABLE commercial_operation_tickets
ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50);

-- Add comment to document the column
COMMENT ON COLUMN commercial_operation_tickets.customer_phone IS 'Customer phone number for ticket purchase contact';

-- Create index for faster searches by phone number
CREATE INDEX IF NOT EXISTS idx_commercial_operation_tickets_phone
ON commercial_operation_tickets(customer_phone);
