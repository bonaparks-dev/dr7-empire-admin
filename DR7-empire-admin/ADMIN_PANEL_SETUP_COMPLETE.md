# DR7 Empire Admin Panel - Setup Complete! ✓

## Summary

I've successfully set up your admin panel with all vehicles and prepared scripts to migrate your bookings to reservations.

## What's Been Done

### 1. ✅ Added 8 Vehicles to Your Database

All vehicles are now in the `vehicles` table and will appear in your admin panel:

| Vehicle | Plate | Daily Rate | Status |
|---------|-------|------------|--------|
| Ferrari 488 Spider | DR7-F488 | €600.00 | Available |
| Lamborghini Huracan | DR7-LAMB | €500.00 | Available |
| Porsche Cayenne S | DR7-PCAY | €253.00 | Available |
| Mercedes AMG GT | DR7-AMGT | €220.00 | Available |
| Audi RS3 Verde | DR7-RS3V | €196.90 | Available |
| Audi RS3 | DR7-RS3 | €196.90 | Available |
| BMW M4 Competition | DR7-M4C | €180.00 | Available |
| Car Wash Service | - | €100.00 | Available |

### 2. 📊 Current Database Status

- **Customers**: 92 customers already in database
- **Vehicles**: 8 vehicles added ✓
- **Bookings**: 62 bookings in `bookings` table
- **Reservations**: Ready to migrate from bookings

### 3. 🔄 Data Migration

Your actual reservations are in the `bookings` table. I've created a SQL migration script to copy them to the `reservations` table so they appear in the admin panel.

**To migrate your bookings:**

1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/ahpmzjgkfxrrgxyirasa
2. Click "SQL Editor" in the left sidebar
3. Open the file: `migrate-bookings-to-reservations.sql`
4. Copy the contents and paste into the SQL Editor
5. Click "Run" to execute the migration

This will:
- Create customer entries for all booking users
- Match vehicles by name to your new vehicle entries
- Copy all booking data to reservations table
- Preserve original booking IDs in the metadata

## How to Use the Admin Panel

### Access the Admin Panel

URL: **https://admin.dr7empire.com**

Login credentials are managed through Supabase Auth.

### Features Available:

#### 1. **Prenotazioni (Reservations) Tab**
- View all reservations
- Create new reservations manually
- Edit existing reservations
- Export reservations to CSV
- Filter by status: pending, confirmed, active, completed, cancelled

#### 2. **Clienti (Customers) Tab**
- View all customers (92 total)
- Add new customers
- Edit customer information
- Track driver license numbers and contact details

#### 3. **Veicoli (Vehicles) Tab**
- View all 8 vehicles
- Add new vehicles
- Update vehicle status (available, rented, maintenance, retired)
- Set daily rates
- Manage vehicle metadata

#### 4. **Fatture (Invoices) Tab**
- Generate invoices
- Track invoice status
- Link invoices to customers

## Creating a Manual Reservation

### Via Admin Panel UI:

1. Log into https://admin.dr7empire.com
2. Click on "Prenotazioni" tab
3. Click "+ New Reservation" button
4. Fill in the form:
   - **Customer**: Select from dropdown (92 customers available)
   - **Vehicle**: Select from dropdown (8 vehicles available)
   - **Start Date/Time**: Pick start date and time
   - **End Date/Time**: Pick end date and time
   - **Status**: pending, confirmed, active, completed, or cancelled
   - **Total Amount**: Enter price in EUR
   - **Currency**: EUR (default)
5. Click "Save"

### Via API (Programmatic):

Run the example script:
```bash
chmod +x create-manual-reservation-example.sh
./create-manual-reservation-example.sh
```

Or use curl directly:
```bash
curl -X POST "https://admin.dr7empire.com/.netlify/functions/admin/reservations" \
  -H "Authorization: Bearer 23acd76588da54081bddddae1594a8d748dd092dd0971b2a2b043612a9e7ed6e" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "<CUSTOMER_UUID>",
    "vehicle_id": "<VEHICLE_UUID>",
    "start_at": "2025-11-01T10:00:00Z",
    "end_at": "2025-11-03T10:00:00Z",
    "status": "confirmed",
    "source": "admin",
    "total_amount": 393.80,
    "currency": "EUR"
  }'
```

## Files Created

1. `all-bookings.json` - Export of all 62 bookings from your website
2. `setup-vehicles-and-test-reservation.sh` - Script that added all vehicles ✓
3. `create-manual-reservation-example.sh` - Example for creating reservations via API
4. `migrate-bookings-to-reservations.sql` - SQL script to migrate bookings to reservations table
5. `add-vehicles-and-setup.sql` - SQL for adding vehicles (alternative method)

## Next Steps

### Immediate Actions:

1. **Run the migration SQL** to see all 62 bookings in the admin panel
2. **Log into the admin panel** and verify all vehicles are visible
3. **Test creating a manual reservation** through the UI

### Optional Enhancements:

1. Add more vehicles as you acquire them
2. Set up automated booking sync between `bookings` and `reservations` tables
3. Create dashboard reports and analytics
4. Set up automated invoice generation for completed reservations

## API Endpoints

All admin API endpoints are available at:
- Base URL: `https://admin.dr7empire.com/.netlify/functions/admin`
- Auth: Bearer token in `Authorization` header

Endpoints:
- `GET /customers` - List all customers
- `POST /customers` - Create customer
- `PATCH /customers` - Update customer
- `GET /vehicles` - List all vehicles
- `POST /vehicles` - Create vehicle
- `PATCH /vehicles` - Update vehicle
- `GET /reservations` - List all reservations
- `POST /reservations` - Create reservation
- `PATCH /reservations` - Update reservation
- `GET /export/reservations.csv` - Export reservations

## Support

If you need help:
1. Check the setup instructions in `SETUP_INSTRUCTIONS.md`
2. Review the database schema in `SUPABASE_ADMIN_SETUP.sql`
3. Test API calls using the example scripts provided

---

**Status**: ✅ Setup Complete!
**Vehicles Added**: 8
**Ready to Accept Reservations**: Yes
**Next Action**: Run migration SQL to see all bookings in admin panel
