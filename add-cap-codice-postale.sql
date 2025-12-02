-- Add CAP (Codice Postale) field to customers_extended table
-- Run this in Supabase SQL Editor

-- Add codice_postale column
ALTER TABLE customers_extended
ADD COLUMN IF NOT EXISTS codice_postale VARCHAR(5);

-- Add comment to document the column
COMMENT ON COLUMN customers_extended.codice_postale IS 'CAP - Codice di Avviamento Postale (5 cifre, es: 20100, 00100)';

-- Verify the new column exists
SELECT
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'customers_extended'
AND column_name = 'codice_postale';

-- Display success message
DO $$
BEGIN
    RAISE NOTICE '✅ Migration completed successfully!';
    RAISE NOTICE 'Added codice_postale (CAP) column to customers_extended';
    RAISE NOTICE 'Type: VARCHAR(5)';
    RAISE NOTICE 'Example: 20100 (Milano), 00100 (Roma)';
    RAISE NOTICE '';
    RAISE NOTICE 'Field is now available in New Client Modal (Persona Fisica)';
    RAISE NOTICE 'Layout: Città | CAP | Provincia (3 columns)';
END $$;
