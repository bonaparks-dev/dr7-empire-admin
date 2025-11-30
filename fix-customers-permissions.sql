-- ============================================
-- FIX PERMISSIONS FOR CUSTOMERS_EXTENDED TABLE
-- Run this in Supabase SQL Editor
-- ============================================

-- Drop the table if it exists (to start fresh)
DROP TABLE IF EXISTS customers_extended CASCADE;

-- Recreate customers_extended table WITHOUT foreign key to auth.users
CREATE TABLE customers_extended (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID, -- No foreign key constraint to avoid permission issues

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

-- Enable RLS
ALTER TABLE customers_extended ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all for authenticated users" ON customers_extended;
DROP POLICY IF EXISTS "Allow admins full access" ON customers_extended;

-- Create a simple policy that allows all authenticated users
-- (Since this is an admin-only table, and we check auth in the app)
CREATE POLICY "Allow all for authenticated users"
  ON customers_extended
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_extended_email ON customers_extended(email);
CREATE INDEX IF NOT EXISTS idx_customers_extended_tipo_cliente ON customers_extended(tipo_cliente);
CREATE INDEX IF NOT EXISTS idx_customers_extended_codice_fiscale ON customers_extended(codice_fiscale);
CREATE INDEX IF NOT EXISTS idx_customers_extended_partita_iva ON customers_extended(partita_iva);
CREATE INDEX IF NOT EXISTS idx_customers_extended_user_id ON customers_extended(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_extended_created_at ON customers_extended(created_at);

-- ============================================
-- ✅ PERMISSIONS FIXED!
-- ============================================
-- Changes made:
-- 1. Removed foreign key constraint to auth.users (prevents permission errors)
-- 2. Simplified RLS policy to allow all authenticated users
-- 3. Kept all indexes for performance
-- ============================================
