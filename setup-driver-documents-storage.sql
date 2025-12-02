-- Setup Driver Documents Storage Buckets (driver-licenses and driver-ids)
-- Run this in Supabase SQL Editor to fix document upload issues

-- ============================================================================
-- 1. CREATE STORAGE BUCKETS
-- ============================================================================

-- Create driver-licenses bucket (for Patente di Guida)
INSERT INTO storage.buckets (id, name, public)
VALUES ('driver-licenses', 'driver-licenses', false)
ON CONFLICT (id) DO NOTHING;

-- Create driver-ids bucket (for Carta d'Identità / Passaporto)
INSERT INTO storage.buckets (id, name, public)
VALUES ('driver-ids', 'driver-ids', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. SET UP STORAGE POLICIES FOR DRIVER-LICENSES BUCKET
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to upload driver licenses" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to read driver licenses" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update driver licenses" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete driver licenses" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins to upload driver licenses" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins to read driver licenses" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins to update driver licenses" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins to delete driver licenses" ON storage.objects;

-- Policy: Allow authenticated users to upload driver licenses
CREATE POLICY "Allow authenticated users to upload driver licenses"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'driver-licenses');

-- Policy: Allow authenticated users to read driver licenses
CREATE POLICY "Allow authenticated users to read driver licenses"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'driver-licenses');

-- Policy: Allow authenticated users to update driver licenses
CREATE POLICY "Allow authenticated users to update driver licenses"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'driver-licenses');

-- Policy: Allow authenticated users to delete driver licenses
CREATE POLICY "Allow authenticated users to delete driver licenses"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'driver-licenses');

-- ============================================================================
-- 3. SET UP STORAGE POLICIES FOR DRIVER-IDS BUCKET
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to upload driver ids" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to read driver ids" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update driver ids" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete driver ids" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins to upload driver ids" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins to read driver ids" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins to update driver ids" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins to delete driver ids" ON storage.objects;

-- Policy: Allow authenticated users to upload driver IDs
CREATE POLICY "Allow authenticated users to upload driver ids"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'driver-ids');

-- Policy: Allow authenticated users to read driver IDs
CREATE POLICY "Allow authenticated users to read driver ids"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'driver-ids');

-- Policy: Allow authenticated users to update driver IDs
CREATE POLICY "Allow authenticated users to update driver ids"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'driver-ids');

-- Policy: Allow authenticated users to delete driver IDs
CREATE POLICY "Allow authenticated users to delete driver ids"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'driver-ids');

-- ============================================================================
-- 4. VERIFY SETUP
-- ============================================================================

-- Check if buckets exist
SELECT
    id,
    name,
    public,
    created_at
FROM storage.buckets
WHERE id IN ('driver-licenses', 'driver-ids')
ORDER BY name;

-- Check policies for driver-licenses
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'objects'
AND policyname LIKE '%driver%'
ORDER BY policyname;

-- ============================================================================
-- SUMMARY
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'DRIVER DOCUMENTS STORAGE SETUP COMPLETE!';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Buckets created:';
    RAISE NOTICE '  - driver-licenses (Patente di Guida)';
    RAISE NOTICE '  - driver-ids (Carta d''Identità / Passaporto)';
    RAISE NOTICE '';
    RAISE NOTICE 'Access: Authenticated users only';
    RAISE NOTICE 'Permissions: Upload, Read, Update, Delete';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Test Patente di Guida upload (front + back)';
    RAISE NOTICE '2. Test Carta d''Identità/Passaporto upload (front + back)';
    RAISE NOTICE '3. Verify both documents display correctly';
    RAISE NOTICE '============================================';
END $$;
