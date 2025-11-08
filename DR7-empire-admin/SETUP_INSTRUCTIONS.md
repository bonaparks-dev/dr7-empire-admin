# DR7 Empire Admin Panel - Setup Instructions

## Problem
The admin panel shows customers but not reservations because the required database tables (`customers`, `vehicles`, `reservations`) don't exist in Supabase yet.

## Solution
Run the SQL setup script to create all necessary tables.

## Steps

### 1. Access Supabase SQL Editor
1. Go to https://supabase.com/dashboard
2. Select your DR7 Empire project
3. Click on "SQL Editor" in the left sidebar

### 2. Run the Setup SQL
1. Open the file `SUPABASE_ADMIN_SETUP.sql` in this directory
2. Copy all the SQL content
3. Paste it into the Supabase SQL Editor
4. Click "Run" to execute the script

### 3. Verify Tables Were Created
After running the script, you should see these new tables in the "Table Editor":
- `customers` - Customer information
- `vehicles` - Vehicle inventory
- `reservations` - Booking/reservation records
- `fatture` - Invoice management
- `audit_log` - Change tracking for admin actions

### 4. Test the Admin Panel
1. Go to https://admin.dr7empire.com
2. Log in with your admin credentials
3. Navigate to the "Prenotazioni" (Reservations) tab
4. You should now be able to:
   - View reservations (will be empty initially)
   - Create new reservations manually
   - Link existing bookings from the main site

## Environment Variables Required

Make sure these environment variables are set in your Netlify deployment:

```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ADMIN_API_TOKEN=your_admin_api_token
```

You can find the `SUPABASE_SERVICE_ROLE_KEY` in:
Supabase Dashboard → Project Settings → API → service_role key (keep this secret!)

## Optional: Migrate Existing Bookings

If you want to import existing bookings from the `bookings` table into the new `reservations` table, run this additional SQL:

```sql
-- First, create customers from existing bookings
INSERT INTO public.customers (full_name, email, phone)
SELECT DISTINCT
    (customer->>'fullName')::text as full_name,
    (customer->>'email')::text as email,
    (customer->>'phone')::text as phone
FROM public.bookings
WHERE customer IS NOT NULL
ON CONFLICT DO NOTHING;

-- Then, create vehicles from existing bookings
INSERT INTO public.vehicles (display_name, daily_rate, status)
SELECT DISTINCT
    "itemName" as display_name,
    ("totalPrice"::numeric / NULLIF(EXTRACT(DAY FROM ("returnDate" - "pickupDate"))::numeric, 0)) as daily_rate,
    'available' as status
FROM public.bookings
WHERE "itemName" IS NOT NULL AND "itemCategory" = 'cars'
ON CONFLICT DO NOTHING;

-- Finally, create reservations from existing bookings
INSERT INTO public.reservations (customer_id, vehicle_id, start_at, end_at, status, total_amount, currency, source)
SELECT
    c.id as customer_id,
    v.id as vehicle_id,
    (b."pickupDate" + b."pickupTime")::timestamp with time zone as start_at,
    (b."returnDate" + b."returnTime")::timestamp with time zone as end_at,
    'completed' as status,
    b."totalPrice" as total_amount,
    b."currency" as currency,
    'website' as source
FROM public.bookings b
LEFT JOIN public.customers c ON (b.customer->>'email')::text = c.email
LEFT JOIN public.vehicles v ON b."itemName" = v.display_name
WHERE b."itemCategory" = 'cars'
AND c.id IS NOT NULL
AND v.id IS NOT NULL;
```

## Troubleshooting

### "Permission denied" error
- Make sure you're using the Service Role Key, not the anon key
- Verify RLS policies are correctly set (the setup script handles this)

### Reservations still not showing
1. Check browser console for errors (F12)
2. Verify the API token is correct in Netlify environment variables
3. Check Netlify function logs for errors

### CORS errors
- Verify the ALLOWED_ORIGIN in `netlify/functions/admin.ts` matches your admin panel URL
- The setup script handles CORS for `https://admin.dr7empire.com`

## Need Help?
Contact the development team or check the Supabase project logs for detailed error messages.
