-- ========================================
-- CREATE CONTRACTS TABLE
-- For managing rental contracts in the admin panel
-- ========================================

CREATE TABLE IF NOT EXISTS public.contracts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_number character varying NOT NULL,
  contract_date date NOT NULL,
  customer_name character varying NOT NULL,
  customer_email character varying,
  customer_phone character varying,
  customer_address text,
  customer_tax_code character varying,
  customer_license_number character varying,
  vehicle_name character varying NOT NULL,
  rental_start_date date NOT NULL,
  rental_end_date date NOT NULL,
  daily_rate numeric(10,2) NOT NULL,
  total_days integer NOT NULL,
  total_amount numeric(10,2) NOT NULL,
  deposit_amount numeric(10,2),
  status character varying DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add comments
COMMENT ON TABLE public.contracts IS 'Rental contracts for car rental agreements';
COMMENT ON COLUMN public.contracts.contract_number IS 'Unique contract number (e.g., CONT-2024-001)';
COMMENT ON COLUMN public.contracts.status IS 'Contract status: active, completed, or cancelled';
COMMENT ON COLUMN public.contracts.total_days IS 'Total number of rental days';
COMMENT ON COLUMN public.contracts.total_amount IS 'Total amount for the rental period';
COMMENT ON COLUMN public.contracts.deposit_amount IS 'Security deposit amount';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_contracts_contract_number ON public.contracts(contract_number);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON public.contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_rental_dates ON public.contracts(rental_start_date, rental_end_date);
CREATE INDEX IF NOT EXISTS idx_contracts_customer_name ON public.contracts(customer_name);

-- Enable RLS (Row Level Security)
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users (admin panel)
CREATE POLICY "Enable all access for authenticated users" ON public.contracts
  FOR ALL
  USING (auth.role() = 'authenticated');

-- ========================================
-- DONE!
-- Run this in your Supabase SQL Editor
-- After running this, the Contratti tab will work
-- ========================================
