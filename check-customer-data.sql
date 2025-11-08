-- Check if customers have email addresses in the full_name field
SELECT
  id,
  full_name,
  email,
  phone,
  CASE
    WHEN full_name LIKE '%@%' THEN 'EMAIL IN NAME'
    ELSE 'OK'
  END as issue
FROM customers
ORDER BY created_at DESC
LIMIT 20;
