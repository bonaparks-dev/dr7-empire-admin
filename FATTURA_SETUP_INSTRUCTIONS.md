# Fattura (Invoice) System Setup

## Current Status
The admin panel already has a basic **FatturaTab** that stores invoices in the `fatture` table.

## What Needs to be Done

### 1. Run Database Migration
Execute this SQL in your Supabase SQL Editor:
```bash
psql -f update-fatture-table.sql
```

Or copy the contents of `update-fatture-table.sql` into Supabase Dashboard > SQL Editor and run it.

This adds the following fields to support detailed invoices:
- `customer_name`, `customer_address`, `customer_tax_code`, `customer_vat`
- `items` (JSONB array of line items)
- `subtotal`, `vat_amount`, `exempt_amount`
- `invoice_date`, `payment_method`, `payment_date`

### 2. Replace FatturaTab Component
The new `InvoicesTab.tsx` file has been created with full functionality:
- ✅ Add line items with description, price, quantity, VAT%
- ✅ Calculate totals automatically
- ✅ Generate printable PDF invoices with your company details
- ✅ Professional invoice layout matching your example

To use it, replace the contents of:
`src/pages/admin/components/FatturaTab.tsx`

With the contents of:
`src/pages/admin/components/InvoicesTab.tsx`

**Or** keep the current FatturaTab and just add a "Generate PDF" button that uses the PDF generation logic from InvoicesTab.

### 3. Company Details in PDF
The PDF invoice includes:
```
DA
Dr7 S.p.A.
Via del Fangario 25, 09122 Cagliari (CA)
P. IVA IT04104640927 – C.F. 04104640927
Telefono: 345 790 5205
📧 info@dr7.app
PEC: dubai.rent7.0srl@legalmail.it
🌐 www.dr7empire.com
```

### 4. Invoice Features
- Select or enter customer details
- Add multiple line items
- Each item has: description, price, quantity, IVA%
- Automatic calculation of:
  - Imponibile (taxable amount)
  - IVA (VAT)
  - Esente IVA art. 15 (VAT exempt)
  - Total
- Payment method selection
- Status: Pagata / In attesa / Scaduta
- Print/Download as PDF

### 5. Example Invoice Structure
```json
{
  "invoice_number": "1448/FE",
  "invoice_date": "2025-10-15",
  "customer_name": "Nicola Panzali",
  "customer_address": "Via Roma 43, 09070 Baratili San Pietro (OR)",
  "customer_tax_code": "PNZNCL05A02B068D",
  "items": [
    {
      "description": "Penali contrattuali per inadempienze (BENZINA MANCANTE) Rif. Contratto N.1722",
      "unit_price": 45.00,
      "quantity": 1,
      "vat_rate": 0,
      "total": 45.00
    }
  ],
  "subtotal": 0.00,
  "vat_amount": 0.00,
  "exempt_amount": 45.00,
  "total": 45.00,
  "payment_method": "Carta di credito / bancomat",
  "payment_date": "2025-10-15",
  "status": "paid"
}
```

## Quick Setup (Choose One)

### Option A: Replace Entire Component (Recommended)
```bash
cp src/pages/admin/components/InvoicesTab.tsx src/pages/admin/components/FatturaTab.tsx
```

### Option B: Keep Current & Add PDF Feature
Add just the `generatePDF()` function from InvoicesTab.tsx to your current FatturaTab.tsx

## After Setup
1. Run the SQL migration
2. Replace or update FatturaTab.tsx
3. Restart your dev server
4. Go to Admin Panel > Fatture
5. Click "+ Nuova Fattura"
6. Fill in details and click "Salva Fattura"
7. Click "PDF" button to generate/print invoice
