-- Update fatture table to support detailed invoices

-- Add new columns to existing fatture table
ALTER TABLE public.fatture
ADD COLUMN IF NOT EXISTS customer_name TEXT,
ADD COLUMN IF NOT EXISTS customer_address TEXT,
ADD COLUMN IF NOT EXISTS customer_tax_code TEXT,
ADD COLUMN IF NOT EXISTS customer_vat TEXT,
ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS vat_amount NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS exempt_amount NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS invoice_date DATE,
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'Carta di credito / bancomat',
ADD COLUMN IF NOT EXISTS payment_date DATE;

-- Make cliente_id optional (in case customer is not registered)
ALTER TABLE public.fatture ALTER COLUMN cliente_id DROP NOT NULL;

-- Update check constraint for stato to include more statuses
ALTER TABLE public.fatture DROP CONSTRAINT IF EXISTS fatture_stato_check;
ALTER TABLE public.fatture ADD CONSTRAINT fatture_stato_check
CHECK (stato IN ('bozza', 'emessa', 'pagata', 'annullata', 'paid', 'pending', 'overdue'));

COMMENT ON COLUMN fatture.items IS 'Array of line items: [{description, unit_price, quantity, vat_rate, total}]';
COMMENT ON COLUMN fatture.customer_name IS 'Customer full name or company name';
COMMENT ON COLUMN fatture.customer_address IS 'Customer full address';
COMMENT ON COLUMN fatture.customer_tax_code IS 'Codice Fiscale';
COMMENT ON COLUMN fatture.customer_vat IS 'Partita IVA (optional)';
