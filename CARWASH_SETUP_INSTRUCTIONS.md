# 🚿 Car Wash Services Management - Setup Instructions

## What Was Created

I've added a complete Car Wash services management system to your admin panel. You can now:
- ✅ View all car wash services
- ✅ Edit service prices in real-time
- ✅ Update service descriptions and features
- ✅ Activate/deactivate services
- ✅ Create new services
- ✅ Changes sync automatically to the main website

## Setup Steps

### 1. Create the Database Table

Run this SQL in your Supabase SQL Editor:

```bash
# Option 1: Using Supabase Dashboard
# Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new
# Copy and paste the contents of: create-carwash-table.sql
# Click "Run"

# Option 2: Using psql (if you have direct database access)
psql -h YOUR_DB_HOST -U postgres -d postgres -f create-carwash-table.sql
```

The SQL file is located at: `/home/alex-bona/dr7-empire-admin/create-carwash-table.sql`

### 2. Verify the Table Was Created

In Supabase Dashboard:
1. Go to "Table Editor"
2. You should see a new table called `car_wash_services`
3. It should have 4 services already inserted:
   - LAVAGGIO COMPLETO (€25)
   - LAVAGGIO TOP (€49)
   - LAVAGGIO VIP (€75)
   - LAVAGGIO DR7 LUXURY (€99)

### 3. Enable Row Level Security (RLS) Policies

Run this in Supabase SQL Editor to allow public read access:

```sql
-- Enable RLS
ALTER TABLE car_wash_services ENABLE ROW LEVEL SECURITY;

-- Allow public to read active services (for main website)
CREATE POLICY "Anyone can view active car wash services"
ON car_wash_services FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Allow authenticated users to manage services (for admin)
CREATE POLICY "Authenticated users can manage car wash services"
ON car_wash_services FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
```

### 4. Access the Admin Panel

1. Log in to your admin panel: https://your-admin-url.com
2. Click on the new "🚿 Autolavaggio" tab
3. You should see all 4 car wash services

## How to Use

### Edit a Service Price

1. Go to admin panel → 🚿 Autolavaggio tab
2. Click "Modifica" on any service
3. Change the "Prezzo (€)" field
4. Click "Salva"
5. **The price updates immediately on your main website!**

### Edit Service Details

You can edit:
- **Nome**: Italian name (e.g., "LAVAGGIO COMPLETO")
- **Nome (Inglese)**: English name (e.g., "FULL CLEAN")
- **Prezzo**: Price in euros (e.g., 25)
- **Durata**: Duration (e.g., "30-45 min")
- **Descrizione**: Italian description
- **Descrizione (Inglese)**: English description
- **Caratteristiche**: Features (one per line)
- **Caratteristiche (Inglese)**: Features in English (one per line)

### Deactivate a Service Temporarily

1. Click "Disattiva" on any service
2. The service will be hidden from the main website
3. Click "Attiva" to show it again

### Create a New Service

1. Click "+ Nuovo Servizio"
2. Fill in all fields:
   - **ID Servizio**: Unique identifier (e.g., "premium-wash")
   - **Prezzo**: Price in euros
   - **Nome** and **Nome (Inglese)**
   - **Durata**: e.g., "2-3 ore"
   - **Ordine di visualizzazione**: Order on website (1, 2, 3, 4...)
   - **Descrizione** and **Descrizione (Inglese)**
   - **Caratteristiche**: One feature per line
3. Click "Salva"

### Delete a Service

1. Click "Elimina" on any service
2. Confirm deletion
3. **Warning**: This permanently deletes the service!

## How It Works

### Main Website Integration

The main website (`DR7-empire/pages/CarWashServicesPage.tsx`) now:
1. Loads services from the database on page load
2. Falls back to hardcoded services if database is unavailable
3. Shows only **active** services (where `is_active = true`)
4. Orders services by `display_order` field

### Admin Panel

The admin panel (`dr7-empire-admin/src/pages/admin/components/CarWashTab.tsx`):
1. Shows all services (active and inactive)
2. Allows real-time editing
3. Changes are immediately saved to database
4. Main website reflects changes on next page load/refresh

## Files Modified/Created

### Admin Panel (dr7-empire-admin)
- ✅ `create-carwash-table.sql` - Database schema
- ✅ `src/pages/admin/components/CarWashTab.tsx` - New tab component
- ✅ `src/pages/admin/AdminDashboard.tsx` - Added tab navigation

### Main Website (DR7-empire)
- ✅ `pages/CarWashServicesPage.tsx` - Updated to read from database

## Troubleshooting

### Services not showing in admin?
- Check that you ran the SQL file in Supabase
- Check browser console for errors
- Verify Supabase connection in admin panel

### Services not updating on main website?
- Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
- Check that service is marked as "active" in admin
- Check browser console for database errors

### Database connection error?
- Verify Supabase credentials in both projects
- Check RLS policies are set correctly
- Ensure `car_wash_services` table exists

## Testing

1. **Test Price Update**:
   - Change price from €25 to €30 in admin
   - Refresh main website
   - Verify new price appears

2. **Test Service Deactivation**:
   - Deactivate "LAVAGGIO COMPLETO" in admin
   - Refresh main website
   - Verify it's hidden (only 3 services show)

3. **Test New Service Creation**:
   - Create new service with price €150
   - Refresh main website
   - Verify it appears in correct order

## Support

If you encounter issues:
1. Check Supabase logs for errors
2. Check browser console for JavaScript errors
3. Verify RLS policies are correct
4. Ensure database table was created successfully

---

**Created**: 2025-11-16
**Status**: ✅ Ready to use
