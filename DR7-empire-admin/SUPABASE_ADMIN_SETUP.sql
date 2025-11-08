-- Admin Panel Database Setup for DR7 Empire
-- Run this SQL in your Supabase SQL Editor

-- 1. Create customers table
CREATE TABLE IF NOT EXISTS public.customers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name text NOT NULL,
    email text,
    phone text,
    driver_license_number text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 2. Create vehicles table
CREATE TABLE IF NOT EXISTS public.vehicles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    display_name text NOT NULL,
    plate text,
    status text DEFAULT 'available' CHECK (status IN ('available', 'rented', 'maintenance', 'retired')),
    daily_rate numeric NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 3. Create reservations table
CREATE TABLE IF NOT EXISTS public.reservations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE,
    vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE CASCADE,
    start_at timestamp with time zone NOT NULL,
    end_at timestamp with time zone NOT NULL,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled')),
    source text,
    total_amount numeric NOT NULL,
    currency text DEFAULT 'EUR',
    addons jsonb,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 4. Create fatture (invoices) table
CREATE TABLE IF NOT EXISTS public.fatture (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_fattura text NOT NULL UNIQUE,
    cliente_id uuid REFERENCES public.customers(id) ON DELETE CASCADE,
    data_emissione date NOT NULL,
    importo_totale numeric NOT NULL,
    stato text DEFAULT 'bozza' CHECK (stato IN ('bozza', 'emessa', 'pagata', 'annullata')),
    note text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 5. Create audit_log table for tracking changes
CREATE TABLE IF NOT EXISTS public.audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id uuid,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid,
    diff jsonb,
    created_at timestamp with time zone DEFAULT now()
);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fatture ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS Policies (Service Role bypass these, so admin functions will work)
-- Allow service role to do everything
CREATE POLICY "Service role can do everything on customers"
ON public.customers
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can do everything on vehicles"
ON public.vehicles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can do everything on reservations"
ON public.reservations
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can do everything on fatture"
ON public.fatture
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can do everything on audit_log"
ON public.audit_log
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Allow authenticated users to read their own invoices via Supabase client
CREATE POLICY "Authenticated users can read fatture"
ON public.fatture
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert fatture"
ON public.fatture
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update fatture"
ON public.fatture
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete fatture"
ON public.fatture
FOR DELETE
TO authenticated
USING (true);

-- 8. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON public.vehicles(status);
CREATE INDEX IF NOT EXISTS idx_reservations_customer_id ON public.reservations(customer_id);
CREATE INDEX IF NOT EXISTS idx_reservations_vehicle_id ON public.reservations(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_reservations_start_at ON public.reservations(start_at);
CREATE INDEX IF NOT EXISTS idx_reservations_end_at ON public.reservations(end_at);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON public.reservations(status);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity_type ON public.audit_log(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity_id ON public.audit_log(entity_id);
CREATE INDEX IF NOT EXISTS idx_fatture_cliente_id ON public.fatture(cliente_id);
CREATE INDEX IF NOT EXISTS idx_fatture_data_emissione ON public.fatture(data_emissione);
CREATE INDEX IF NOT EXISTS idx_fatture_stato ON public.fatture(stato);

-- 9. Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create triggers to auto-update updated_at
DROP TRIGGER IF EXISTS update_customers_updated_at ON public.customers;
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON public.customers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_vehicles_updated_at ON public.vehicles;
CREATE TRIGGER update_vehicles_updated_at
    BEFORE UPDATE ON public.vehicles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_reservations_updated_at ON public.reservations;
CREATE TRIGGER update_reservations_updated_at
    BEFORE UPDATE ON public.reservations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_fatture_updated_at ON public.fatture;
CREATE TRIGGER update_fatture_updated_at
    BEFORE UPDATE ON public.fatture
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 11. Insert sample data (optional - uncomment if you want test data)
/*
-- Sample customer
INSERT INTO public.customers (full_name, email, phone) VALUES
('Mario Rossi', 'mario.rossi@example.com', '+39 333 1234567');

-- Sample vehicles
INSERT INTO public.vehicles (display_name, plate, status, daily_rate) VALUES
('BMW M3 Competition', 'CA123AB', 'available', 149.00),
('Porsche 911 Carrera', 'CA456CD', 'available', 299.00),
('Lamborghini Urus', 'CA789EF', 'available', 499.00);
*/

-- Done! Your admin panel database is now set up.
