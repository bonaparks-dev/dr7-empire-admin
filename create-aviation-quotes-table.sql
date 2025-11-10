-- Create aviation_quotes table for helicopter and private jet quotes
CREATE TABLE IF NOT EXISTS aviation_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Customer Info
  customer_name character varying NOT NULL,
  customer_email character varying NOT NULL,
  customer_phone character varying NOT NULL,
  customer_type character varying NOT NULL CHECK (customer_type IN ('individual', 'company')),
  company_vat character varying,

  -- 1. Flight Details
  departure_location character varying NOT NULL,
  arrival_location character varying NOT NULL,
  flight_type character varying NOT NULL CHECK (flight_type IN ('one_way', 'round_trip')),
  return_date date,
  return_time time,
  direct_flight boolean DEFAULT true,
  intermediate_stops text,
  flight_flexibility character varying CHECK (flight_flexibility IN ('fixed', 'flexible')),
  flight_time character varying CHECK (flight_time IN ('day', 'night', 'both')),

  -- 2. Passengers
  passenger_count integer NOT NULL DEFAULT 1,
  has_children boolean DEFAULT false,
  children_count integer DEFAULT 0,
  has_pets boolean DEFAULT false,
  pet_details text,
  needs_hostess boolean DEFAULT false,
  is_vip boolean DEFAULT false,
  vip_details text,

  -- 3. Luggage
  luggage_count integer DEFAULT 0,
  luggage_weight character varying,
  special_equipment text,
  bulky_luggage boolean DEFAULT false,

  -- 4. Flight Type & Preferences
  purpose character varying CHECK (purpose IN ('business', 'tourist', 'event', 'transfer')),
  priority character varying CHECK (priority IN ('speed', 'luxury', 'cost')),
  preferred_aircraft character varying,
  needs_branding boolean DEFAULT false,
  needs_wifi boolean DEFAULT false,
  needs_catering boolean DEFAULT false,
  catering_details text,
  needs_ground_transfer boolean DEFAULT false,

  -- 5. Technical & Logistics
  known_airport boolean DEFAULT true,
  airport_details text,
  landing_restrictions text,
  helicopter_landing_type character varying,
  international_flight boolean DEFAULT false,
  needs_luggage_assistance boolean DEFAULT false,

  -- 6. Economic & Administrative
  payment_method character varying CHECK (payment_method IN ('card', 'bank_transfer', 'cash')),
  vat_included boolean DEFAULT true,
  needs_contract boolean DEFAULT false,

  -- 7. Optional Services
  needs_insurance boolean DEFAULT false,
  needs_security boolean DEFAULT false,
  needs_crew_accommodation boolean DEFAULT false,
  needs_nda boolean DEFAULT false,

  -- General
  notes text,
  status character varying DEFAULT 'pending' CHECK (status IN ('pending', 'quoted', 'accepted', 'rejected')),
  quote_amount numeric(10, 2),

  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE aviation_quotes ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users (admins) to do everything
CREATE POLICY "Allow authenticated users full access to aviation quotes"
ON aviation_quotes
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_aviation_quotes_customer_email ON aviation_quotes(customer_email);
CREATE INDEX IF NOT EXISTS idx_aviation_quotes_status ON aviation_quotes(status);
CREATE INDEX IF NOT EXISTS idx_aviation_quotes_created_at ON aviation_quotes(created_at DESC);

-- Add helpful comments
COMMENT ON TABLE aviation_quotes IS 'Preventivi per elicotteri e jet privati - checklist completa';
COMMENT ON COLUMN aviation_quotes.status IS 'pending = in attesa, quoted = preventivato, accepted = accettato, rejected = rifiutato';
