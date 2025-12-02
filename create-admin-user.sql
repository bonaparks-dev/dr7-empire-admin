-- Create Admin User: admin@dr7.app
-- This user has full admin access without any payment/numeric restrictions

-- Step 1: Create the auth user (you'll need to do this in Supabase Dashboard or via API)
-- Go to: Authentication → Users → Add user
-- Email: admin@dr7.app
-- Password: [Set a strong password]
-- Email Confirm: Yes (auto-confirm)

-- Step 2: Once the user is created, get their user_id from auth.users table
-- You can find it by running:
SELECT id, email, created_at
FROM auth.users
WHERE email = 'admin@dr7.app';

-- Step 3: Update user metadata to mark them as admin
-- Replace 'USER_ID_HERE' with the actual UUID from Step 2

/*
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'admin@dr7.app';
*/

-- Step 4: If you have a profiles or users table, update it:
/*
INSERT INTO profiles (id, email, role, full_name)
VALUES (
  'USER_ID_HERE',
  'admin@dr7.app',
  'admin',
  'DR7 Admin'
)
ON CONFLICT (id) DO UPDATE
SET role = 'admin';
*/

-- Step 5: Grant admin permissions (if you have a permissions table)
/*
INSERT INTO user_permissions (user_id, permission)
VALUES
  ('USER_ID_HERE', 'admin:full_access'),
  ('USER_ID_HERE', 'admin:no_payment_required'),
  ('USER_ID_HERE', 'admin:unlimited_access')
ON CONFLICT DO NOTHING;
*/

-- Step 6: Create a customer record for this admin (optional)
/*
INSERT INTO customers_extended (
  tipo_cliente,
  nazione,
  nome,
  cognome,
  email,
  source,
  user_id
)
VALUES (
  'persona_fisica',
  'Italia',
  'DR7',
  'Admin',
  'admin@dr7.app',
  'admin',
  'USER_ID_HERE'
)
ON CONFLICT DO NOTHING;
*/

-- ALTERNATIVE: Create user directly via SQL (Supabase Admin API)
-- Note: This requires admin privileges and proper password hashing

-- Quick verification query:
SELECT
  u.id,
  u.email,
  u.created_at,
  u.raw_user_meta_data->>'role' as role
FROM auth.users u
WHERE u.email = 'admin@dr7.app';

-- ============================================
-- EASIEST METHOD: Use Supabase Dashboard
-- ============================================
-- 1. Go to Supabase Dashboard
-- 2. Authentication → Users
-- 3. Click "Add user"
-- 4. Email: admin@dr7.app
-- 5. Password: [Your secure password]
-- 6. Check "Auto Confirm User"
-- 7. Click "Create user"
-- 8. Then run the UPDATE query above to set role to 'admin'
