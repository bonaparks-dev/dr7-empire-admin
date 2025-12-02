-- Add new fields to customers_extended table for Persona Fisica
-- Run this in Supabase SQL Editor

-- Add new columns for Persona Fisica
ALTER TABLE customers_extended
ADD COLUMN IF NOT EXISTS data_nascita DATE,
ADD COLUMN IF NOT EXISTS luogo_nascita TEXT,
ADD COLUMN IF NOT EXISTS numero_civico TEXT,
ADD COLUMN IF NOT EXISTS citta_residenza TEXT,
ADD COLUMN IF NOT EXISTS provincia_residenza TEXT;

-- Add comments to document the new columns
COMMENT ON COLUMN customers_extended.data_nascita IS 'Data di nascita del cliente (Persona Fisica)';
COMMENT ON COLUMN customers_extended.luogo_nascita IS 'Luogo di nascita del cliente (Persona Fisica)';
COMMENT ON COLUMN customers_extended.numero_civico IS 'Numero civico dell''indirizzo';
COMMENT ON COLUMN customers_extended.citta_residenza IS 'Città di residenza del cliente';
COMMENT ON COLUMN customers_extended.provincia_residenza IS 'Provincia di residenza (sigla a 2 lettere, es: MI, RM, TO)';

-- Verify the new columns exist
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'customers_extended'
AND column_name IN ('data_nascita', 'luogo_nascita', 'numero_civico', 'citta_residenza', 'provincia_residenza')
ORDER BY column_name;

-- Display success message
DO $$
BEGIN
    RAISE NOTICE '✅ Migration completed successfully!';
    RAISE NOTICE 'Added the following columns to customers_extended:';
    RAISE NOTICE '  - data_nascita (DATE)';
    RAISE NOTICE '  - luogo_nascita (TEXT)';
    RAISE NOTICE '  - numero_civico (TEXT)';
    RAISE NOTICE '  - citta_residenza (TEXT)';
    RAISE NOTICE '  - provincia_residenza (TEXT)';
    RAISE NOTICE '';
    RAISE NOTICE 'These fields are now available in the New Client Modal for Persona Fisica.';
END $$;
