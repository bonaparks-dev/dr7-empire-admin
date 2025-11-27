-- Cancel lottery ticket(s) for ophgrd@orange.fr
-- Run this in Supabase SQL Editor

-- First, let's see what tickets exist for this email
SELECT
  ticket_number,
  full_name,
  email,
  customer_phone,
  purchase_date,
  payment_intent_id
FROM commercial_operation_tickets
WHERE email = 'ophgrd@orange.fr';

-- If you want to delete them, uncomment and run this:
-- DELETE FROM commercial_operation_tickets
-- WHERE email = 'ophgrd@orange.fr';

-- After running the DELETE, this will confirm they're gone:
-- SELECT COUNT(*) as remaining_tickets
-- FROM commercial_operation_tickets
-- WHERE email = 'ophgrd@orange.fr';
