-- Check the actual columns in customers_extended table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'customers_extended'
ORDER BY ordinal_position;

-- Also check if the table has any data
SELECT COUNT(*) as total_customers FROM customers_extended;

-- Sample a few customers to see the actual data
SELECT id, email, tipo_cliente, nome, cognome, ragione_sociale, telefono
FROM customers_extended
LIMIT 5;
