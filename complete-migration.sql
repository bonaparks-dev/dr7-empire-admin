-- ============================================
-- COMPLETE MIGRATION FOR DR7 EMPIRE ADMIN
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Add targa column to vehicles table
-- ============================================
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS targa TEXT;
CREATE INDEX IF NOT EXISTS idx_vehicles_targa ON vehicles(targa);

-- 2. Create customers_extended table
-- ============================================
CREATE TABLE IF NOT EXISTS customers_extended (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Customer type
  tipo_cliente TEXT NOT NULL CHECK (tipo_cliente IN ('persona_fisica', 'azienda', 'pubblica_amministrazione')),

  -- Persona Fisica fields
  nome TEXT,
  cognome TEXT,
  codice_fiscale TEXT,
  patente TEXT,

  -- Azienda fields
  ragione_sociale TEXT,
  partita_iva TEXT,
  codice_destinatario TEXT,
  pec TEXT,

  -- Pubblica Amministrazione fields
  denominazione TEXT,
  codice_ipa TEXT,
  codice_univoco TEXT,

  -- Common fields
  nazione TEXT DEFAULT 'Italia',
  email TEXT,
  telefono TEXT,
  indirizzo TEXT,
  source TEXT DEFAULT 'admin',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on customers_extended
ALTER TABLE customers_extended ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow admins to view all customers" ON customers_extended;
DROP POLICY IF EXISTS "Allow admins to insert customers" ON customers_extended;
DROP POLICY IF EXISTS "Allow admins to update customers" ON customers_extended;
DROP POLICY IF EXISTS "Allow admins to delete customers" ON customers_extended;

-- Create RLS policies for customers_extended
CREATE POLICY "Allow admins to view all customers"
  ON customers_extended FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Allow admins to insert customers"
  ON customers_extended FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Allow admins to update customers"
  ON customers_extended FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Allow admins to delete customers"
  ON customers_extended FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_extended_email ON customers_extended(email);
CREATE INDEX IF NOT EXISTS idx_customers_extended_tipo_cliente ON customers_extended(tipo_cliente);
CREATE INDEX IF NOT EXISTS idx_customers_extended_codice_fiscale ON customers_extended(codice_fiscale);
CREATE INDEX IF NOT EXISTS idx_customers_extended_partita_iva ON customers_extended(partita_iva);
CREATE INDEX IF NOT EXISTS idx_customers_extended_user_id ON customers_extended(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_extended_created_at ON customers_extended(created_at);

-- ============================================
-- ✅ MIGRATION COMPLETE!
-- ============================================
-- Now you have:
-- 1. targa column in vehicles table (for license plates)
-- 2. customers_extended table (for Persona Fisica, Azienda, PA)
-- 3. Proper RLS policies for admin access
-- 4. Optimized indexes for better performance
-- ============================================
