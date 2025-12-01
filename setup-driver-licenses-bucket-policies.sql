-- ============================================================================
-- Setup Storage Policies for driver-licenses bucket
-- ============================================================================
-- This script creates RLS policies for the driver-licenses bucket
-- to allow authenticated users to upload, view, update, and delete files.
-- ============================================================================

-- STEP 1: Drop ALL existing policies for driver-licenses bucket (if any)
DROP POLICY IF EXISTS "driver_licenses_insert" ON storage.objects;
DROP POLICY IF EXISTS "driver_licenses_select" ON storage.objects;
DROP POLICY IF EXISTS "driver_licenses_update" ON storage.objects;
DROP POLICY IF EXISTS "driver_licenses_delete" ON storage.objects;

-- STEP 2: Create NEW policies with clear names
CREATE POLICY "driver_licenses_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'driver-licenses');

CREATE POLICY "driver_licenses_select"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'driver-licenses');

CREATE POLICY "driver_licenses_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'driver-licenses')
WITH CHECK (bucket_id = 'driver-licenses');

CREATE POLICY "driver_licenses_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'driver-licenses');

-- STEP 3: Verify the policies are active
SELECT
    policyname,
    cmd as operation,
    permissive,
    roles
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
AND policyname LIKE 'driver_licenses_%'
ORDER BY cmd;

-- Expected result: 4 policies (DELETE, INSERT, SELECT, UPDATE)
-- All should show: permissive = PERMISSIVE, roles = {authenticated}
