# Remove Duplicate Bookings

## Quick Steps

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to: https://supabase.com/dashboard/project/ahpmzjgkfxrrgxyirasa/editor
2. Click on the `bookings` table
3. Look for duplicates (same customer, vehicle, dates)
4. For "Michela frau" specifically:
   - Filter by customer_name = "Michela frau" or customer_email = "miriana.sanna@live.it"
   - You should see 2 entries (one "completed", one "cancelled")
   - Delete one of them by clicking the row and pressing the trash icon

### Option 2: Using SQL Editor

1. Go to: https://supabase.com/dashboard/project/ahpmzjgkfxrrgxyirasa/sql/new
2. Run this query to find ALL duplicates:

```sql
SELECT
  customer_name,
  customer_email,
  vehicle_name,
  pickup_date,
  COUNT(*) as count,
  STRING_AGG(id::text, ', ') as ids,
  STRING_AGG(status, ', ') as statuses
FROM bookings
GROUP BY customer_name, customer_email, vehicle_name, pickup_date
HAVING COUNT(*) > 1;
```

3. Find duplicates for Michela frau specifically:

```sql
SELECT *
FROM bookings
WHERE customer_email = 'miriana.sanna@live.it'
ORDER BY created_at DESC;
```

4. Delete the older/unwanted booking (keep the one you want):

```sql
-- Replace 'BOOKING_ID_TO_DELETE' with the actual ID
DELETE FROM bookings
WHERE id = 'BOOKING_ID_TO_DELETE';
```

### Recommended: Keep which booking?

For duplicate bookings, generally keep:
- **Keep**: The most recent status (e.g., "cancelled" if it was cancelled after being completed)
- **Delete**: The older entry

For Michela frau:
- If she cancelled, KEEP the "cancelled" booking
- DELETE the "completed" booking

This way your records show the most accurate current status.

## Prevention

The duplicate likely happened because:
1. A booking was created from the website
2. The same booking was created/imported again from admin panel

To prevent future duplicates:
- Check if a booking already exists before creating a new one
- Use the "Modifica" (Edit) button to update existing bookings instead of creating new ones
