# Admin Roles Setup Guide

This guide explains how to create a second admin account without financial access.

## Step 1: Run SQL Migration

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Copy and paste the contents of `add-admin-roles.sql`
3. **IMPORTANT**: Replace `'your-admin-email@example.com'` with your main admin email
4. Click **Run**

## Step 2: Create the Second Admin Account

1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Click **Add User** → **Create new user**
3. Enter their email and password
4. Click **Create user**

## Step 3: Add the New Admin to the Admins Table

Run this SQL (replace the email):

```sql
-- Add new admin WITHOUT financial access
INSERT INTO public.admins (user_id, email, role, can_view_financials)
SELECT id, email, 'admin', false
FROM auth.users
WHERE email = 'second-admin@example.com'; -- REPLACE WITH THEIR EMAIL
```

## Step 4: Update Code to Use Financial Wrapper

The code has been prepared with a `FinancialData` component. To hide financial data, wrap it like this:

```tsx
import { FinancialData } from '../components/FinancialData'

// Example 1: Hide revenue
<FinancialData>
  €{revenue.toFixed(2)}
</FinancialData>

// Example 2: Hide price column in table
<td className="px-4 py-3 text-sm text-white">
  <FinancialData>
    €{(booking.price_total / 100).toFixed(2)}
  </FinancialData>
</td>
```

## What Gets Hidden

When `can_view_financials = false`, the admin will see:
- Revenue statistics: `***` instead of `€150.00`
- Prices in bookings: `***` instead of `€50.00`
- Total amounts: `***` instead of amounts

## Permission Levels

- **superadmin**: Can view financials, can manage other admins
- **admin** with `can_view_financials = true`: Can view financials, cannot manage admins
- **admin** with `can_view_financials = false`: Cannot view financials, cannot manage admins

## To Change Permissions Later

```sql
-- Grant financial access
UPDATE public.admins
SET can_view_financials = true
WHERE email = 'admin@example.com';

-- Remove financial access
UPDATE public.admins
SET can_view_financials = false
WHERE email = 'admin@example.com';

-- Promote to superadmin
UPDATE public.admins
SET role = 'superadmin', can_view_financials = true
WHERE email = 'admin@example.com';
```

## Next Steps

After setting up the database, you need to wrap all financial displays in the code with `<FinancialData>`.

Files that need updating:
- CalendarTab.tsx (revenue display)
- CarWashCalendarTab.tsx (revenue display)
- MechanicalCalendarTab.tsx (revenue display)
- ReservationsTab.tsx (price columns)
- CarWashBookingsTab.tsx (price columns)
- MechanicalBookingTab.tsx (price columns)
