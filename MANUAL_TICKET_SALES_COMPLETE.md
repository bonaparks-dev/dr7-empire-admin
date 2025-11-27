# Manual Lottery Ticket Sales - Complete System

## ✅ What's Been Implemented

The admin panel can now manually sell lottery tickets with **full PDF generation and email delivery**, just like website purchases.

### Complete Flow

1. **Admin clicks available (GREEN) ticket** in admin panel
2. **Modal opens** asking for: Name, Email, Phone
3. **Admin submits** → System:
   - ✅ Double-checks ticket is still available
   - ✅ Inserts ticket into database
   - ✅ Generates PDF with ticket details
   - ✅ Sends PDF via email to customer
   - ✅ Sends notification to admin email
   - ✅ Refreshes board to show ticket as sold (RED)

### Database Synchronization

**Both systems use the same database and prevent double-booking:**

| Feature | Main Website | Admin Panel |
|---------|--------------|-------------|
| Database | `ahpmzjgkfxrrgxyirasa.supabase.co` | `ahpmzjgkfxrrgxyirasa.supabase.co` |
| Checks before sale | ✅ Yes | ✅ Yes |
| UNIQUE constraint protection | ✅ Yes | ✅ Yes |
| Real-time refresh | ✅ Yes | ✅ Yes |
| PDF generation | ✅ Yes | ✅ Yes |
| Email delivery | ✅ Yes | ✅ Yes |

### Technical Implementation

#### 1. Main Website Function
**File**: `DR7-empire/netlify/functions/send-manual-ticket-pdf.js`

- Receives: `ticketNumber`, `email`, `fullName`, `phone`
- Fetches ticket details from database
- Generates PDF with 4-digit ticket number (e.g., 0001, 0123, 2000)
- Sends email to customer with PDF attachment
- Sends notification to admin

#### 2. Admin Panel Integration
**File**: `DR7-empire-admin/src/pages/admin/components/LotteriaBoard.tsx`

After successful ticket insert:
```typescript
// Call function to generate and send PDF
const pdfResponse = await fetch('https://dr7empire.com/.netlify/functions/send-manual-ticket-pdf', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ticketNumber,
    email,
    fullName,
    phone
  })
});
```

### Email Template

Customers receive:
- **Subject**: "Il Tuo Biglietto - LOTTERIA"
- **Content**: Personalized email with ticket number displayed prominently
- **Attachment**: PDF with QR code, ticket details, purchase date
- **Same format** as website purchases

### Protection Against Errors

1. **Ticket already sold**:
   - Error message: "Biglietto è già stato venduto!"
   - Board refreshes automatically
   - No PDF sent

2. **Race condition** (two people try to sell same ticket):
   - Database UNIQUE constraint prevents duplicate
   - Second person sees error
   - Only one PDF sent to first person

3. **PDF generation fails**:
   - Ticket is still saved in database
   - Error message shows: "Biglietto salvato ma PDF non inviato"
   - Admin can manually resend PDF later

4. **Email sending fails**:
   - Ticket is saved
   - PDF was generated
   - Error message shows email address to retry

### Testing

**To test manual ticket sales:**

1. Go to admin panel → "Biglietti Lotteria" tab
2. Click any GREEN (available) ticket
3. Fill in:
   - Nome: Test Customer
   - Email: your-email@example.com
   - Telefono: +39 123 456 7890
4. Click "Conferma"
5. Wait for success messages
6. Check email for PDF

**Expected result:**
- ✅ Ticket turns RED in admin panel
- ✅ Email received with PDF attachment
- ✅ PDF shows 4-digit ticket number (e.g., 0001)
- ✅ Admin email receives notification
- ✅ Ticket cannot be purchased on website anymore

### Deployment

**Main Website** (dr7empire.com):
- New function: `send-manual-ticket-pdf`
- Auto-deploys via Netlify

**Admin Panel** (admin.dr7empire.com):
- Updated: `LotteriaBoard.tsx` with PDF sending
- Auto-deploys via Netlify

**Wait 2-3 minutes for both to deploy**

### Database Permissions

Make sure you ran this SQL in Supabase:
```sql
CREATE POLICY "Authenticated users can insert tickets"
  ON commercial_operation_tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view all tickets"
  ON commercial_operation_tickets
  FOR SELECT
  TO authenticated
  USING (true);
```

## Summary

✅ **Admin can now sell tickets manually with full PDF generation and email delivery**
✅ **System prevents double-booking between website and admin panel**
✅ **All tickets display with 4-digit format (0001-2000)**
✅ **Customers receive same professional PDF as website purchases**
✅ **Admin receives notifications for all manual sales**

## Support

If you encounter any issues:
1. Check Netlify deployment logs
2. Verify database permissions (SQL above)
3. Check email environment variables are set:
   - `GMAIL_USER`
   - `GMAIL_APP_PASSWORD`
4. Test with your own email first
