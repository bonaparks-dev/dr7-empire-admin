-- Diagnose why admin@dr7.app cannot see customer details
-- Run this in Supabase SQL Editor

-- 1. Check if admin@dr7.app exists in auth.users
SELECT id, email, role, created_at
FROM auth.users
WHERE email = 'admin@dr7.app';

-- 2. Check if admin@dr7.app exists in admins table
SELECT *
FROM admins
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'admin@dr7.app');

-- 3. Check RLS policies on customers_extended
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'customers_extended';

-- 4. Check if customers_extended has data
SELECT COUNT(*) as total_customers,
       COUNT(CASE WHEN tipo_cliente = 'persona_fisica' THEN 1 END) as persona_fisica_count,
       COUNT(CASE WHEN tipo_cliente = 'azienda' THEN 1 END) as azienda_count,
       COUNT(CASE WHEN tipo_cliente = 'pubblica_amministrazione' THEN 1 END) as pa_count
FROM customers_extended;

-- 5. Sample some customers to verify data
SELECT id, email, tipo_cliente,
       CASE
         WHEN tipo_cliente = 'persona_fisica' THEN nome || ' ' || cognome
         WHEN tipo_cliente = 'azienda' THEN ragione_sociale
         WHEN tipo_cliente = 'pubblica_amministrazione' THEN ente_ufficio
       END as display_name,
       telefono,
       created_at
FROM customers_extended
ORDER BY created_at DESC
LIMIT 10;

-- 6. Test if current user can access customers_extended
-- (Run this while logged in as admin@dr7.app)
SELECT COUNT(*) as can_access
FROM customers_extended;

-- 7. Check if there's any issue with the authenticated role
SELECT current_user, current_setting('role');
