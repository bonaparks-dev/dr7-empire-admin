-- Delete lottery ticket(s) for ophgrd@orange.fr and make numbers available again
-- Run this in Supabase SQL Editor

-- Step 1: Check which tickets will be deleted
SELECT
  ticket_number,
  full_name,
  email,
  customer_phone,
  purchase_date,
  payment_intent_id
FROM commercial_operation_tickets
WHERE email = 'ophgrd@orange.fr';

-- Step 2: Delete the tickets (this will make the numbers available again)
DELETE FROM commercial_operation_tickets
WHERE email = 'ophgrd@orange.fr';

-- Step 3: Verify deletion
SELECT COUNT(*) as remaining_tickets
FROM commercial_operation_tickets
WHERE email = 'ophgrd@orange.fr';
-- Should return 0

-- Step 4: Verify the ticket numbers are now available (not in the table)
-- Replace XXXX with the actual ticket number(s) from Step 1
-- SELECT * FROM commercial_operation_tickets WHERE ticket_number IN (XXXX, YYYY);
-- Should return empty (no rows)
