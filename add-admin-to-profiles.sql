-- ============================================
-- Add admin@dr7.app to user_profiles table
-- This is required for admin panel access
-- ============================================

-- Step 1: First, let's see if the user_profiles table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'user_profiles'
);

-- Step 2: Create user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'staff', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Step 5: Insert admin@dr7.app into user_profiles
INSERT INTO user_profiles (user_id, full_name, phone, role, created_at)
SELECT
  id,
  'DR7 Admin',
  NULL,
  'admin',
  NOW()
FROM auth.users
WHERE email = 'admin@dr7.app'
ON CONFLICT (user_id) DO UPDATE
SET
  role = 'admin',
  full_name = 'DR7 Admin';

-- Step 6: Verify the admin user profile
SELECT
  up.user_id,
  u.email,
  up.full_name,
  up.role,
  up.created_at
FROM user_profiles up
JOIN auth.users u ON u.id = up.user_id
WHERE u.email = 'admin@dr7.app';

-- ============================================
-- ✅ DONE! Now you can login with:
-- Email: admin@dr7.app
-- Password: [your password]
-- ============================================
