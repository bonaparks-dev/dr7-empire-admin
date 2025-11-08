-- Create invoices table for admin panel
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  invoice_date DATE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  customer_tax_code TEXT NOT NULL,
  customer_vat TEXT,
  items JSONB NOT NULL,
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
  vat_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  exempt_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total NUMERIC(10, 2) NOT NULL,
  payment_method TEXT NOT NULL,
  payment_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('paid', 'pending', 'overdue')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on invoice_number for fast lookups
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);

-- Create index on invoice_date for sorting
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date DESC);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

-- Add RLS policies (adjust based on your auth setup)
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Allow admins to do everything (adjust the condition based on your auth)
CREATE POLICY "Admins can manage invoices"
  ON invoices
  FOR ALL
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE invoices IS 'Stores invoice data for DR7 Empire admin panel';
