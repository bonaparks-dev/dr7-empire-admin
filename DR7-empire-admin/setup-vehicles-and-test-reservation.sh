#!/bin/bash

# DR7 Empire Admin - Add Vehicles and Create Test Reservation
# This script adds vehicles to your database and shows you how to create a manual reservation

SUPABASE_URL="https://ahpmzjgkfxrrgxyirasa.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFocG16amdrZnhycmd4eWlyYXNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4Mjc3OTgsImV4cCI6MjA2OTQwMzc5OH0.XkjoVheKCqmgL0Ce-OqNAbItnW7L3GlXIxb8_R7f_FU"

echo "=========================================="
echo "DR7 EMPIRE ADMIN - SETUP SCRIPT"
echo "=========================================="
echo ""

# Array of vehicles to add
echo "Adding vehicles to the database..."
echo ""

# Vehicle 1: Audi RS3 Verde
curl -X POST "${SUPABASE_URL}/rest/v1/vehicles" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "display_name": "Audi RS3 Verde",
    "plate": "DR7-RS3V",
    "status": "available",
    "daily_rate": 196.90,
    "metadata": {"color": "verde", "year": 2023, "type": "sport"}
  }' | jq '.'

echo ""

# Vehicle 2: Porsche Cayenne S
curl -X POST "${SUPABASE_URL}/rest/v1/vehicles" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "display_name": "Porsche Cayenne S",
    "plate": "DR7-PCAY",
    "status": "available",
    "daily_rate": 253.00,
    "metadata": {"year": 2023, "type": "suv"}
  }' | jq '.'

echo ""

# Vehicle 3: BMW M4
curl -X POST "${SUPABASE_URL}/rest/v1/vehicles" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "display_name": "BMW M4 Competition",
    "plate": "DR7-M4C",
    "status": "available",
    "daily_rate": 180.00,
    "metadata": {"year": 2023, "type": "sport"}
  }' | jq '.'

echo ""

# Vehicle 4: Mercedes AMG GT
curl -X POST "${SUPABASE_URL}/rest/v1/vehicles" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "display_name": "Mercedes AMG GT",
    "plate": "DR7-AMGT",
    "status": "available",
    "daily_rate": 220.00,
    "metadata": {"year": 2023, "type": "sport"}
  }' | jq '.'

echo ""

# Vehicle 5: Lamborghini Huracan
curl -X POST "${SUPABASE_URL}/rest/v1/vehicles" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "display_name": "Lamborghini Huracan",
    "plate": "DR7-LAMB",
    "status": "available",
    "daily_rate": 500.00,
    "metadata": {"year": 2023, "type": "supercar"}
  }' | jq '.'

echo ""

# Vehicle 6: Ferrari 488 Spider
curl -X POST "${SUPABASE_URL}/rest/v1/vehicles" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "display_name": "Ferrari 488 Spider",
    "plate": "DR7-F488",
    "status": "available",
    "daily_rate": 600.00,
    "metadata": {"year": 2023, "type": "supercar"}
  }' | jq '.'

echo ""

# Vehicle 7: Audi RS3
curl -X POST "${SUPABASE_URL}/rest/v1/vehicles" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "display_name": "Audi RS3",
    "plate": "DR7-RS3",
    "status": "available",
    "daily_rate": 196.90,
    "metadata": {"year": 2023, "type": "sport"}
  }' | jq '.'

echo ""

# Vehicle 8: Car Wash Service (special entry)
curl -X POST "${SUPABASE_URL}/rest/v1/vehicles" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "display_name": "Car Wash Service",
    "plate": null,
    "status": "available",
    "daily_rate": 100.00,
    "metadata": {"service_type": "car_wash", "type": "service"}
  }' | jq '.'

echo ""
echo "=========================================="
echo "✓ Vehicles added successfully!"
echo "=========================================="
echo ""

# Now fetch all vehicles to show them
echo "Current vehicles in database:"
echo ""
curl -s "${SUPABASE_URL}/rest/v1/vehicles?select=id,display_name,plate,status,daily_rate&order=created_at.desc" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}" | jq '.'

echo ""
echo "=========================================="
echo "Setup complete!"
echo "=========================================="
echo ""
echo "You can now:"
echo "1. View all vehicles in the admin panel"
echo "2. Create manual reservations through the admin UI"
echo "3. Export reservation data as CSV"
echo ""
