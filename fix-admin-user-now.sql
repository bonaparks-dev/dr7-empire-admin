-- ============================================
-- Fix admin@dr7.app user - Run this NOW
-- ============================================

-- Step 1: Confirm the user and set admin role
UPDATE auth.users
SET
    email_confirmed_at = NOW(),
    confirmed_at = NOW(),
    raw_user_meta_data = jsonb_build_object(
        'role', 'admin',
        'full_name', 'DR7 Admin',
        'admin_access', true
    )
WHERE email = 'admin@dr7.app';

-- Step 2: Remove any bans
UPDATE auth.users
SET banned_until = NULL
WHERE email = 'admin@dr7.app';

-- Step 3: Verify it worked
SELECT
    id,
    email,
    email_confirmed_at,
    confirmed_at,
    banned_until,
    raw_user_meta_data->>'role' as role
FROM auth.users
WHERE email = 'admin@dr7.app';

-- Step 4: Create customer record for this admin
INSERT INTO customers_extended (
    tipo_cliente,
    nazione,
    nome,
    cognome,
    email,
    codice_fiscale,
    indirizzo,
    source,
    user_id
)
SELECT
    'persona_fisica',
    'Italia',
    'DR7',
    'Admin',
    'admin@dr7.app',
    'ADMIN00000',
    'DR7 Empire HQ',
    'admin',
    id
FROM auth.users
WHERE email = 'admin@dr7.app'
ON CONFLICT (user_id) DO UPDATE
SET email = EXCLUDED.email;

-- ✅ Done! You should now be able to login with:
-- Email: admin@dr7.app
-- Password: [the password you set in Supabase Dashboard]
