-- ============================================
-- Create Admin User: admin@dr7.app
-- DIRECT METHOD - Run in Supabase SQL Editor
-- ============================================

-- IMPORTANT: You need to create the user via Supabase Dashboard first!
-- This is because password hashing requires special functions.

-- METHOD 1: Via Supabase Dashboard (RECOMMENDED)
-- ===============================================
-- 1. Go to: https://supabase.com/dashboard → Your Project
-- 2. Authentication → Users → "Invite user" or "Add user"
-- 3. Fill in:
--    Email: admin@dr7.app
--    Password: [Choose a strong password - write it down!]
--    ✅ Check "Auto Confirm User" (IMPORTANT!)
-- 4. Click "Create user"
-- 5. Copy the user ID that appears

-- Then come back here and run this query:

-- Replace 'PASTE_USER_ID_HERE' with the actual UUID from the dashboard
DO $$
DECLARE
    admin_user_id UUID := 'PASTE_USER_ID_HERE'; -- ⚠️ REPLACE THIS!
BEGIN
    -- Update user metadata to set role as admin
    UPDATE auth.users
    SET
        raw_user_meta_data = jsonb_build_object(
            'role', 'admin',
            'full_name', 'DR7 Admin',
            'admin_access', true,
            'bypass_payment', true
        ),
        email_confirmed_at = NOW(),
        confirmed_at = NOW()
    WHERE id = admin_user_id;

    -- Create customer record (if table exists)
    INSERT INTO customers_extended (
        id,
        tipo_cliente,
        nazione,
        nome,
        cognome,
        email,
        source,
        user_id,
        created_at
    )
    VALUES (
        gen_random_uuid(),
        'persona_fisica',
        'Italia',
        'DR7',
        'Admin',
        'admin@dr7.app',
        'admin',
        admin_user_id,
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE
    SET email = EXCLUDED.email;

    RAISE NOTICE 'Admin user created successfully!';
END $$;

-- Verify the admin user was created:
SELECT
    id,
    email,
    email_confirmed_at,
    confirmed_at,
    created_at,
    raw_user_meta_data->>'role' as role,
    raw_user_meta_data->>'admin_access' as admin_access
FROM auth.users
WHERE email = 'admin@dr7.app';

-- ============================================
-- METHOD 2: If you already created the user but can't login
-- ============================================

-- Run this to fix an existing user:
UPDATE auth.users
SET
    email_confirmed_at = NOW(),
    confirmed_at = NOW(),
    raw_user_meta_data = jsonb_build_object(
        'role', 'admin',
        'full_name', 'DR7 Admin',
        'admin_access', true,
        'bypass_payment', true
    )
WHERE email = 'admin@dr7.app';

-- Check RLS policies aren't blocking you:
-- Temporarily disable RLS on important tables (run one by one):

-- For customers_extended table:
ALTER TABLE customers_extended DISABLE ROW LEVEL SECURITY;

-- For bookings table:
-- ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;

-- ⚠️ Remember to re-enable RLS after testing!
-- ALTER TABLE customers_extended ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Troubleshooting: Can't login?
-- ============================================

-- 1. Check if user exists:
SELECT id, email, email_confirmed_at, confirmed_at
FROM auth.users
WHERE email = 'admin@dr7.app';

-- 2. Reset password via Supabase Dashboard:
--    Authentication → Users → Find admin@dr7.app → ... menu → Reset password

-- 3. Check for any banned users:
SELECT id, email, banned_until
FROM auth.users
WHERE email = 'admin@dr7.app' AND banned_until IS NOT NULL;

-- 4. If banned, unban:
UPDATE auth.users
SET banned_until = NULL
WHERE email = 'admin@dr7.app';
