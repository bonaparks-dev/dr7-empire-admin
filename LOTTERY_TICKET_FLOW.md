# Lottery Ticket Booking Flow

## Overview
The lottery ticket booking system has been redesigned to support a streamlined two-step process:
1. **Select Client** (existing or create new)
2. **Select Payment Method**
3. **Generate ticket, send email, and send WhatsApp notification**

## Flow Diagram

```
┌─────────────────────────┐
│  Admin Clicks Ticket    │
│  (Single or Multiple)   │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│   ManualSaleModal       │
│   Step 1: Cliente       │
├─────────────────────────┤
│ • Search existing       │
│   clients (by name,     │
│   email, company)       │
│                         │
│ • Select from list      │
│                         │
│ • OR create new client  │
│   (opens NewClientModal)│
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│   ManualSaleModal       │
│   Step 2: Pagamento     │
├─────────────────────────┤
│ • Shows selected client │
│ • Select payment method:│
│   - Contanti            │
│   - Carta               │
│   - Bonifico            │
│   - Paypal              │
│                         │
│ • Shows price/discount  │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│   Generate & Send       │
├─────────────────────────┤
│ 1. Insert into database │
│ 2. Generate PDF ticket  │
│ 3. Send email to client │
│ 4. Send WhatsApp to     │
│    admin                │
└─────────────────────────┘
```

## Features

### 1. Client Selection
- **Search Functionality**: Admin can search for existing clients by:
  - Email
  - Nome/Cognome (persona fisica)
  - Ragione Sociale (azienda)
  - Ente/Ufficio (pubblica amministrazione)

- **Client List**: Scrollable list showing:
  - Display name (based on client type)
  - Email
  - Phone number

- **Create New Client**: Button to open NewClientModal for complete client creation with all required fields

### 2. Payment Method Selection
- Shows selected client information
- Dropdown to select payment method
- Displays price calculation with bulk discounts:
  - < 10 tickets: €25 each
  - 10-99 tickets: €22 each
  - 100 tickets: €1999 total (€19.99 each)
  - > 100 tickets: €20 each

### 3. Multi-Select Mode
- Enabled via "Selezione Multipla" button
- Click multiple tickets to select them
- Click "Vendi X Biglietti" to proceed
- All selected tickets sold to same client with same payment method

## Database Schema

### commercial_operation_tickets
The table requires the following columns:
- `uuid` (TEXT, PRIMARY KEY)
- `ticket_number` (INTEGER, UNIQUE)
- `email` (TEXT)
- `full_name` (TEXT)
- `customer_phone` (TEXT)
- `payment_intent_id` (TEXT)
- `payment_method` (TEXT) - **NEW COLUMN**
- `amount_paid` (INTEGER) - in cents
- `currency` (TEXT)
- `purchase_date` (TIMESTAMP)
- `quantity` (INTEGER)

### Migration
Run the migration file: `add-payment-method-to-lottery-tickets.sql`

## Code Changes

### LotteriaBoard.tsx
1. **ManualSaleModal Enhanced**:
   - Added customer search functionality
   - Two-step UI: Client Selection → Payment Method
   - Loads all customers from `customers_extended` on mount
   - Filters customers based on search term
   - Extracts correct display name based on client type

2. **Flow Simplified**:
   - Removed PaymentMethodModal (merged into ManualSaleModal Step 2)
   - Clicking ticket now directly opens ManualSaleModal
   - NewClientModal only opens when "Crea Nuovo Cliente" clicked
   - Removed complex state management between modals

3. **Bulk Sales**:
   - Multi-select mode continues to work
   - "Vendi X Biglietti" button opens same ManualSaleModal
   - Shows all selected ticket numbers at top

## Notifications

### Email
- Sent to customer via Netlify function: `send-manual-ticket-pdf`
- Contains PDF ticket as attachment
- Includes all customer data from `customers_extended` table

### WhatsApp
- Sent to admin via Netlify function: `send-whatsapp-notification`
- Notification type: `lottery_ticket`
- Contains: ticket numbers, customer name, email, phone

## Error Handling
- Checks if ticket already sold before attempting sale
- Validates customer data exists
- Shows detailed error messages
- Refreshes ticket board after sale
- Handles database constraint violations (duplicate tickets)

## UI/UX Improvements
- Clean two-step process
- Real-time search filtering
- Client information displayed before confirmation
- Clear price display with discount breakdown
- "Cambia cliente" link to go back to selection
- Large, scrollable customer list
- Responsive modal (600px width, max 80vh height)

## Testing Checklist
- [ ] Single ticket sale with existing client
- [ ] Single ticket sale with new client
- [ ] Bulk sale (multiple tickets)
- [ ] Search functionality
- [ ] Payment method selection
- [ ] PDF generation
- [ ] Email sending
- [ ] WhatsApp notification
- [ ] Price calculation and discounts
- [ ] Duplicate ticket prevention
