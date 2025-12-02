-- ============================================
-- Verify and Fix Admin Permissions
-- admin@dr7.app must see EVERYTHING
-- dubai.rent7.0srl@gmail.com must NOT see financials
-- ============================================

-- Step 1: Check current state
SELECT
  u.email,
  a.role,
  a.can_view_financials
FROM auth.users u
LEFT JOIN admins a ON a.user_id = u.id
WHERE u.email IN ('admin@dr7.app', 'dubai.rent7.0srl@gmail.com')
ORDER BY u.email;

-- Step 2: Delete existing entries to start fresh
DELETE FROM admins
WHERE user_id IN (
  SELECT id FROM auth.users
  WHERE email IN ('admin@dr7.app', 'dubai.rent7.0srl@gmail.com')
);

-- Step 3: Insert admin@dr7.app as SUPERADMIN (sees EVERYTHING)
INSERT INTO admins (user_id, role, can_view_financials)
SELECT
  id,
  'superadmin',
  true
FROM auth.users
WHERE email = 'admin@dr7.app';

-- Step 4: Insert dubai.rent7.0srl@gmail.com as ADMIN (NO financials)
INSERT INTO admins (user_id, role, can_view_financials)
SELECT
  id,
  'admin',
  false
FROM auth.users
WHERE email = 'dubai.rent7.0srl@gmail.com';

-- Step 5: Verify the fix
SELECT
  u.email,
  a.role,
  a.can_view_financials,
  CASE
    WHEN a.can_view_financials = true THEN '✅ SEES EVERYTHING'
    ELSE '❌ NO FINANCIALS'
  END as permission_status
FROM auth.users u
LEFT JOIN admins a ON a.user_id = u.id
WHERE u.email IN ('admin@dr7.app', 'dubai.rent7.0srl@gmail.com')
ORDER BY u.email;

-- ============================================
-- ✅ EXPECTED RESULT:
-- admin@dr7.app → superadmin, can_view_financials = true → SEES EVERYTHING
-- dubai.rent7.0srl@gmail.com → admin, can_view_financials = false → NO FINANCIALS
-- ============================================
