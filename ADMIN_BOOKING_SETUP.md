# Admin Panel Manual Booking Setup

## Overview
The admin panel can now create manual reservations that will block vehicle availability on the main website.

## How It Works

### 1. **Booking Creation**
When you create a manual reservation in the admin panel:
- It creates an entry in the `bookings` table
- It also creates an entry in the `reservations` table (for internal tracking)

### 2. **Availability Blocking**
The website checks availability by querying the `bookings` table:
- Looks for `vehicle_name` matching the requested vehicle
- Checks for date overlaps with `pickup_date` and `dropoff_date`
- Only considers bookings with status `confirmed` or `pending`

### 3. **Car Wash Bookings**
Car wash bookings:
- Use `appointment_date` instead of pickup/dropoff dates
- Don't block vehicle availability
- Have `service_type = 'car_wash'`

## Required Setup in Supabase

### Step 1: Run Schema Update
Go to Supabase SQL Editor and run this script:
`ensure_bookings_schema.sql`

This will:
- ✅ Add all required columns
- ✅ Set correct RLS policies for admin access
- ✅ Create indexes for performance
- ✅ Verify the schema

### Step 2: Verify Environment Variables in Netlify
Make sure these are set in Netlify dashboard:
- `SUPABASE_SERVICE_ROLE_KEY` = [your service role key]
- `ADMIN_API_TOKEN` = `23acd76588da54081bddddae1594a8d748dd092dd0971b2a2b043612a9e7ed6e`

## Testing

### Test in Supabase
Run the test script: `test_admin_booking.sql`

This will:
1. Create a test booking
2. Verify it blocks availability
3. Show you how to clean up test data

### Test in Admin Panel
1. Go to https://admin.dr7empire.com
2. Click "Prenotazioni" → "+ Nuova Prenotazione"
3. Fill in:
   - **Tipo**: Noleggio (🚗)
   - **Cliente**: Select or create new
   - **Veicolo**: Select a vehicle
   - **Date**: Pick dates
   - **Stato**: Confermata (to block availability)
   - **Importo**: Enter amount

### Test on Website
1. Go to https://dr7empire.com
2. Try to book the same vehicle for overlapping dates
3. It should show as unavailable

## Key Fields for Availability Blocking

The admin panel creates bookings with:
```javascript
{
  vehicle_name: "Lamborghini Huracán Evo",  // Must match website vehicle names
  pickup_date: "2025-12-01T10:00:00Z",      // ISO timestamp
  dropoff_date: "2025-12-03T18:00:00Z",     // ISO timestamp
  status: "confirmed",                       // "confirmed" or "pending" blocks availability
  payment_status: "completed",               // Shows as paid
  payment_method: "agency"                   // Indicates manual booking
}
```

## Important Notes

1. **Vehicle Names Must Match**: The `vehicle_name` in admin panel must exactly match the vehicle names on the website
2. **Status Matters**: Only `confirmed` and `pending` bookings block availability
3. **Cancelled Bookings**: Setting status to `cancelled` will unblock the dates
4. **Car Wash**: Car wash bookings don't block vehicle availability

## Troubleshooting

### "Failed to fetch" error
- Check that environment variables are set in Netlify
- Wait for deployment to complete (~2-3 minutes after git push)
- Check browser console for CORS errors

### Booking doesn't block availability
- Verify `vehicle_name` matches exactly (case-sensitive)
- Check status is `confirmed` or `pending`
- Verify dates are correct ISO timestamps
- Check RLS policies allow anon reads

### Can't create booking
- Verify service role key is set correctly
- Check Supabase logs for errors
- Run the schema update script

## Files Created
- `ensure_bookings_schema.sql` - Schema update script (RUN THIS FIRST)
- `test_admin_booking.sql` - Test script to verify functionality
- `ADMIN_BOOKING_SETUP.md` - This documentation

## Next Steps
1. ✅ Run `ensure_bookings_schema.sql` in Supabase
2. ✅ Set environment variables in Netlify
3. ✅ Wait for deployment to complete
4. ✅ Test creating a manual booking
5. ✅ Verify it blocks on the website
