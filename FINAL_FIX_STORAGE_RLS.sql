-- ============================================================================
-- FINAL FIX: Document Upload RLS Policy Violation
-- ============================================================================
-- This script completely resets storage policies for customer-documents
-- to fix the "new row violates row-level security policy" error
-- ============================================================================

-- ============================================================================
-- STEP 1: VERIFY BUCKET EXISTS AND CHECK SETTINGS
-- ============================================================================

SELECT
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types,
    created_at
FROM storage.buckets
WHERE id = 'customer-documents';

-- ============================================================================
-- STEP 2: DROP ALL EXISTING POLICIES (CLEAN SLATE)
-- ============================================================================

-- Drop all possible policy variations
DROP POLICY IF EXISTS "customer_documents_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "customer_documents_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "customer_documents_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "customer_documents_delete_policy" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload customer documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to read customer documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update customer documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete customer documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;

-- Verify all policies are dropped
SELECT policyname
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%customer%';

-- Should return 0 rows

-- ============================================================================
-- STEP 3: ENSURE RLS IS ENABLED ON STORAGE.OBJECTS
-- ============================================================================

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 4: CREATE SIMPLE, PERMISSIVE POLICIES
-- ============================================================================

-- Policy 1: INSERT - Allow all authenticated users to upload files
CREATE POLICY "customer_docs_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'customer-documents'
);

-- Policy 2: SELECT - Allow all authenticated users to view/list files
CREATE POLICY "customer_docs_select"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'customer-documents'
);

-- Policy 3: UPDATE - Allow all authenticated users to update files
CREATE POLICY "customer_docs_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'customer-documents')
WITH CHECK (bucket_id = 'customer-documents');

-- Policy 4: DELETE - Allow all authenticated users to delete files
CREATE POLICY "customer_docs_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'customer-documents'
);

-- ============================================================================
-- STEP 5: VERIFY NEW POLICIES ARE ACTIVE
-- ============================================================================

SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as operation,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE 'customer_docs_%'
ORDER BY cmd;

-- Expected: 4 rows (INSERT, SELECT, UPDATE, DELETE)
-- All should show roles = {authenticated}

-- ============================================================================
-- STEP 6: CHECK BUCKET CONFIGURATION
-- ============================================================================

-- Ensure bucket exists with correct settings
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'customer-documents',
    'customer-documents',
    false,  -- NOT public
    52428800,  -- 50MB limit
    ARRAY[
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/zip',
        'application/x-zip-compressed'
    ]
)
ON CONFLICT (id)
DO UPDATE SET
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================================
-- STEP 7: CHECK EXISTING FILES IN STORAGE
-- ============================================================================

SELECT
    id,
    name,
    bucket_id,
    owner,
    created_at,
    (metadata->>'size')::bigint as size_bytes,
    (metadata->>'mimetype') as mime_type
FROM storage.objects
WHERE bucket_id = 'customer-documents'
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- STEP 8: TEST AUTHENTICATION (Run this query while logged into admin panel)
-- ============================================================================

-- Check current user authentication
SELECT
    auth.uid() as current_user_id,
    auth.role() as current_role,
    auth.email() as current_email;

-- If this returns NULL for current_user_id, you're not authenticated!

-- ============================================================================
-- STEP 9: DIAGNOSTIC CHECK
-- ============================================================================

DO $$
DECLARE
    bucket_exists boolean;
    policy_count int;
    file_count int;
BEGIN
    -- Check bucket
    SELECT EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'customer-documents')
    INTO bucket_exists;

    -- Check policies
    SELECT COUNT(*)
    INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname LIKE 'customer_docs_%';

    -- Check files
    SELECT COUNT(*)
    INTO file_count
    FROM storage.objects
    WHERE bucket_id = 'customer-documents';

    RAISE NOTICE '==========================================';
    RAISE NOTICE 'DIAGNOSTIC RESULTS:';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Bucket exists: %', bucket_exists;
    RAISE NOTICE 'Active policies: %', policy_count;
    RAISE NOTICE 'Files in storage: %', file_count;
    RAISE NOTICE '==========================================';

    IF NOT bucket_exists THEN
        RAISE WARNING 'PROBLEM: Bucket does not exist!';
    END IF;

    IF policy_count <> 4 THEN
        RAISE WARNING 'PROBLEM: Expected 4 policies, found %', policy_count;
    END IF;

    IF bucket_exists AND policy_count = 4 THEN
        RAISE NOTICE 'SUCCESS: Storage is properly configured!';
        RAISE NOTICE 'If uploads still fail, check:';
        RAISE NOTICE '1. User is authenticated (auth.uid() should not be NULL)';
        RAISE NOTICE '2. Browser console for detailed error messages';
        RAISE NOTICE '3. Supabase logs in dashboard';
    END IF;

    RAISE NOTICE '==========================================';
END $$;

-- ============================================================================
-- STEP 10: GRANT ADDITIONAL PERMISSIONS (If needed)
-- ============================================================================

-- Grant usage on storage schema
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

-- ============================================================================
-- FINAL SUMMARY
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '✅ STORAGE RLS FIX COMPLETE';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'What was done:';
    RAISE NOTICE '1. Dropped all old conflicting policies';
    RAISE NOTICE '2. Created 4 new simple policies';
    RAISE NOTICE '3. Verified bucket configuration';
    RAISE NOTICE '4. Granted schema permissions';
    RAISE NOTICE '';
    RAISE NOTICE 'NEXT STEPS TO TEST:';
    RAISE NOTICE '';
    RAISE NOTICE '1. Refresh your admin panel page (CTRL + F5)';
    RAISE NOTICE '2. Go to Clienti tab';
    RAISE NOTICE '3. Click "Documenti" for any customer';
    RAISE NOTICE '4. Open browser console (F12)';
    RAISE NOTICE '5. Try to upload a test document';
    RAISE NOTICE '6. Check console for [UPLOAD] logs';
    RAISE NOTICE '';
    RAISE NOTICE 'If you still get RLS error:';
    RAISE NOTICE '- Run: SELECT auth.uid(), auth.role(), auth.email()';
    RAISE NOTICE '- Check if results are NULL (means not authenticated)';
    RAISE NOTICE '- Verify you are logged in to Supabase';
    RAISE NOTICE '- Check Supabase Auth logs for your user';
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
END $$;
