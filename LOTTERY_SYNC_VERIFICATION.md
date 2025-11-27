# Lottery Ticket Sync Verification

## ✅ System is Fully Synchronized

Both the **main website** and **admin panel** are connected and prevent double-booking.

### Same Database
- **Main Website**: `https://ahpmzjgkfxrrgxyirasa.supabase.co`
- **Admin Panel**: `https://ahpmzjgkfxrrgxyirasa.supabase.co`
- **Table**: `commercial_operation_tickets`

### Protection Against Double-Booking

#### 1. Database Level Protection ✅
```sql
-- UNIQUE constraint prevents duplicates
ALTER TABLE commercial_operation_tickets
  ADD CONSTRAINT unique_ticket_number UNIQUE (ticket_number);

-- CHECK constraint enforces valid range
ALTER TABLE commercial_operation_tickets
  ADD CONSTRAINT valid_ticket_number_range CHECK (ticket_number >= 1 AND ticket_number <= 2000);
```

#### 2. Main Website Protection ✅
**File**: `DR7-empire/netlify/functions/generate-commercial-operation-tickets.js`

Before assigning tickets:
1. Queries database for ALL assigned ticket numbers
2. Creates list of available numbers (1-2000 minus assigned)
3. Only selects from available numbers
4. Returns error if not enough tickets available

```javascript
// Get already assigned ticket numbers from the database
const { data: existingTickets } = await supabase
  .from('commercial_operation_tickets')
  .select('ticket_number');

const assignedNumbers = new Set(existingTickets.map(t => t.ticket_number));

// Get available ticket numbers
const availableNumbers = [];
for (let i = 1; i <= 2000; i++) {
  if (!assignedNumbers.has(i)) {
    availableNumbers.push(i);
  }
}
```

#### 3. Admin Panel Protection ✅
**File**: `DR7-empire-admin/src/pages/admin/components/LotteriaBoard.tsx`

Before manual sale:
1. Fetches all sold tickets from database
2. Shows sold tickets as RED (not clickable for new sale)
3. Shows available tickets as GREEN (clickable)
4. Double-checks ticket is still available before insert
5. Handles duplicate key error if ticket sold between check and insert
6. Refreshes board immediately after each sale

```typescript
// Double-check ticket is still available
const { data: existingTicket } = await supabase
  .from('commercial_operation_tickets')
  .select('ticket_number')
  .eq('ticket_number', ticketNumber)
  .single();

if (existingTicket) {
  alert('❌ Biglietto è già stato venduto!');
  await fetchSoldTickets(); // Refresh board
  return;
}

// Insert with error handling for race conditions
const { error } = await supabase
  .from('commercial_operation_tickets')
  .insert([{ ticket_number, ... }]);

if (error?.code === '23505') {
  // Duplicate key = ticket just sold elsewhere
  alert('❌ Biglietto appena venduto da qualcun altro!');
}

// Always refresh after attempt
await fetchSoldTickets();
```

## How It Works

### Scenario 1: Customer buys online while admin tries to sell same ticket
1. Customer clicks buy on website → checks database → ticket 100 is available
2. Admin clicks ticket 100 → checks database → ticket 100 is available
3. Customer's payment completes first → inserts ticket 100 to database
4. Admin clicks confirm → checks database again → ticket 100 now exists → shows error
5. OR if admin's insert reaches database first → customer's insert fails with unique constraint error

### Scenario 2: Admin sells ticket, then customer tries to buy
1. Admin sells ticket 100 → inserts to database
2. Customer starts checkout for random tickets
3. Website queries database → sees ticket 100 is taken
4. Website selects from available tickets (101, 102, 103, etc.)
5. Customer gets different ticket numbers

### Scenario 3: Two admins try to sell same ticket
1. Admin A clicks ticket 100 → checks available
2. Admin B clicks ticket 100 → checks available
3. Admin A submits first → inserts ticket 100
4. Admin B submits → database rejects with unique constraint error
5. Admin B sees error message
6. Both boards refresh and show ticket 100 as RED (sold)

## Testing Checklist

- [x] Database UNIQUE constraint on ticket_number
- [x] Database CHECK constraint for 1-2000 range
- [x] Main website queries database before assigning tickets
- [x] Admin panel shows real-time sold/available status
- [x] Admin panel double-checks before insert
- [x] Admin panel handles duplicate key errors
- [x] Admin panel refreshes after each operation
- [x] Both systems use same Supabase database
- [x] Both systems use same table name

## Manual Test Steps

1. **Test Admin → Website sync**:
   - Note a GREEN ticket number in admin (e.g., 0500)
   - Manually sell it in admin
   - Refresh admin panel → ticket should be RED
   - Try to buy tickets on website → ticket 0500 should NOT be included

2. **Test Website → Admin sync**:
   - Note a GREEN ticket number in admin (e.g., 0600)
   - Buy tickets on website (if 0600 is randomly assigned)
   - Refresh admin panel → ticket 0600 should be RED
   - Try to click ticket 0600 in admin → should be unclickable (RED)

3. **Test race condition protection**:
   - Have two people try to manually sell the same ticket at the same time
   - Only one should succeed
   - Both should see the ticket as RED after refresh

## Result
✅ **System is fully synchronized and protected against double-booking**
