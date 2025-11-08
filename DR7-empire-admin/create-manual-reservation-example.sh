#!/bin/bash

# DR7 Empire - Example: Create Manual Reservation via Admin API
# This script shows how to create a reservation programmatically

ADMIN_API_BASE="https://admin.dr7empire.com/.netlify/functions/admin"
ADMIN_TOKEN="23acd76588da54081bddddae1594a8d748dd092dd0971b2a2b043612a9e7ed6e"

echo "=========================================="
echo "DR7 EMPIRE - MANUAL RESERVATION EXAMPLE"
echo "=========================================="
echo ""

echo "Step 1: Fetching customers..."
CUSTOMERS=$(curl -s "${ADMIN_API_BASE}/customers" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}")

echo "First customer:"
echo "$CUSTOMERS" | jq '.data[0]'
CUSTOMER_ID=$(echo "$CUSTOMERS" | jq -r '.data[0].id')
echo ""

echo "Step 2: Fetching vehicles..."
VEHICLES=$(curl -s "${ADMIN_API_BASE}/vehicles" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}")

echo "First vehicle:"
echo "$VEHICLES" | jq '.data[0]'
VEHICLE_ID=$(echo "$VEHICLES" | jq -r '.data[0].id')
echo ""

if [ "$CUSTOMER_ID" == "null" ] || [ "$VEHICLE_ID" == "null" ]; then
  echo "⚠ Warning: No customers or vehicles found. Please add them first."
  exit 1
fi

echo "Step 3: Creating a test reservation..."
echo ""

# Calculate dates (start: tomorrow, end: day after tomorrow)
START_DATE=$(date -d "tomorrow" -Iseconds)
END_DATE=$(date -d "+2 days" -Iseconds)

echo "Creating reservation:"
echo "  Customer ID: $CUSTOMER_ID"
echo "  Vehicle ID: $VEHICLE_ID"
echo "  Start: $START_DATE"
echo "  End: $END_DATE"
echo ""

curl -X POST "${ADMIN_API_BASE}/reservations" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"customer_id\": \"$CUSTOMER_ID\",
    \"vehicle_id\": \"$VEHICLE_ID\",
    \"start_at\": \"$START_DATE\",
    \"end_at\": \"$END_DATE\",
    \"status\": \"confirmed\",
    \"source\": \"admin\",
    \"total_amount\": 393.80,
    \"currency\": \"EUR\"
  }" | jq '.'

echo ""
echo "=========================================="
echo "Step 4: Fetching all reservations..."
echo "=========================================="
echo ""

curl -s "${ADMIN_API_BASE}/reservations" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" | jq '.data[] | {
    id: .id,
    customer: .customers.full_name,
    vehicle: .vehicles.display_name,
    start: .start_at,
    end: .end_at,
    status: .status,
    total: (.total_amount|tostring) + " " + .currency
  }'

echo ""
echo "=========================================="
echo "✓ Example complete!"
echo "=========================================="
echo ""
echo "To create reservations manually:"
echo "1. Log into the admin panel at https://admin.dr7empire.com"
echo "2. Go to the 'Prenotazioni' (Reservations) tab"
echo "3. Click '+ New Reservation'"
echo "4. Fill in the form and click 'Save'"
echo ""
