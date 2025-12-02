-- ============================================
-- Setup Financial Permissions for Admin Users
-- ============================================

-- Step 1: Check if admins table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'admins'
);

-- Step 2: Create admins table if it doesn't exist
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('superadmin', 'admin')),
  can_view_financials BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Enable RLS
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policy
DROP POLICY IF EXISTS "Users can view own admin record" ON admins;
CREATE POLICY "Users can view own admin record"
ON admins FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Step 5: Set up admin@dr7.app as SUPERADMIN (can see financials)
INSERT INTO admins (user_id, role, can_view_financials)
SELECT
  id,
  'superadmin',
  true
FROM auth.users
WHERE email = 'admin@dr7.app'
ON CONFLICT (user_id) DO UPDATE
SET
  role = 'superadmin',
  can_view_financials = true,
  updated_at = NOW();

-- Step 6: Set up dubai.rent7.0srl@gmail.com as ADMIN (CANNOT see financials)
INSERT INTO admins (user_id, role, can_view_financials)
SELECT
  id,
  'admin',
  false
FROM auth.users
WHERE email = 'dubai.rent7.0srl@gmail.com'
ON CONFLICT (user_id) DO UPDATE
SET
  role = 'admin',
  can_view_financials = false,
  updated_at = NOW();

-- Step 7: Verify the setup
SELECT
  u.email,
  a.role,
  a.can_view_financials,
  up.role as user_profile_role
FROM auth.users u
LEFT JOIN admins a ON a.user_id = u.id
LEFT JOIN user_profiles up ON up.user_id = u.id
WHERE u.email IN ('admin@dr7.app', 'dubai.rent7.0srl@gmail.com')
ORDER BY u.email;

-- ============================================
-- ✅ RESULT:
-- admin@dr7.app → superadmin, can_view_financials = true
-- dubai.rent7.0srl@gmail.com → admin, can_view_financials = false
-- ============================================
