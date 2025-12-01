-- ============================================================================
-- FIX: Document Upload Issue - Documents Upload but Don't Appear
-- ============================================================================
-- This script will help diagnose and fix the issue where documents upload
-- successfully but don't appear in the Clienti tab.
--
-- Run each section in your Supabase SQL Editor and check the results.
-- ============================================================================

-- ============================================================================
-- STEP 1: CHECK IF BUCKET EXISTS
-- ============================================================================

SELECT
    id,
    name,
    public,
    created_at,
    owner
FROM storage.buckets
WHERE id = 'customer-documents';

-- Expected result: Should show one row with bucket 'customer-documents'
-- If no results: The bucket doesn't exist. Run STEP 2.
-- If exists: Continue to STEP 3.

-- ============================================================================
-- STEP 2: CREATE BUCKET (IF IT DOESN'T EXIST)
-- ============================================================================

-- Create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'customer-documents',
    'customer-documents',
    false,  -- NOT public (only authenticated users)
    52428800,  -- 50MB file size limit
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/zip']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 3: CHECK EXISTING POLICIES
-- ============================================================================

SELECT
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
AND policyname LIKE '%customer%document%';

-- This shows all policies related to customer documents
-- If no results: Policies don't exist. Run STEP 4.

-- ============================================================================
-- STEP 4: DROP OLD POLICIES (IF THEY EXIST)
-- ============================================================================

DROP POLICY IF EXISTS "Allow authenticated users to upload customer documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to read customer documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update customer documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete customer documents" ON storage.objects;

-- Also drop any variations
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;

-- ============================================================================
-- STEP 5: CREATE NEW POLICIES WITH CORRECT PERMISSIONS
-- ============================================================================

-- Policy 1: Allow authenticated users to INSERT (upload) documents
CREATE POLICY "customer_documents_insert_policy"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'customer-documents'
);

-- Policy 2: Allow authenticated users to SELECT (list/view) documents
CREATE POLICY "customer_documents_select_policy"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'customer-documents'
);

-- Policy 3: Allow authenticated users to UPDATE documents
CREATE POLICY "customer_documents_update_policy"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'customer-documents'
)
WITH CHECK (
    bucket_id = 'customer-documents'
);

-- Policy 4: Allow authenticated users to DELETE documents
CREATE POLICY "customer_documents_delete_policy"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'customer-documents'
);

-- ============================================================================
-- STEP 6: VERIFY POLICIES ARE ACTIVE
-- ============================================================================

SELECT
    policyname,
    permissive,
    roles,
    cmd as operation
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
AND policyname LIKE '%customer_documents%'
ORDER BY cmd;

-- Expected result: Should show 4 policies (INSERT, SELECT, UPDATE, DELETE)
-- All should have roles = {authenticated}

-- ============================================================================
-- STEP 7: CHECK IF FILES EXIST IN STORAGE
-- ============================================================================

SELECT
    id,
    name,
    bucket_id,
    owner,
    created_at,
    updated_at,
    last_accessed_at,
    metadata
FROM storage.objects
WHERE bucket_id = 'customer-documents'
ORDER BY created_at DESC
LIMIT 20;

-- This shows the most recent 20 files uploaded
-- If you see files here but not in the UI, the issue is permissions
-- If no files here, they were never actually uploaded

-- ============================================================================
-- STEP 8: CHECK FILE COUNT PER CUSTOMER
-- ============================================================================

SELECT
    split_part(name, '/', 1) as customer_id,
    COUNT(*) as file_count,
    pg_size_pretty(SUM((metadata->>'size')::bigint)) as total_size
FROM storage.objects
WHERE bucket_id = 'customer-documents'
GROUP BY split_part(name, '/', 1)
ORDER BY file_count DESC;

-- This shows how many files each customer has

-- ============================================================================
-- STEP 9: TEST UPLOAD PERMISSIONS (Optional)
-- ============================================================================

-- You can test if the current authenticated user can access the bucket
-- by running this in the browser console after logging in:

/*
// Run this in your browser console (F12) when logged into the admin panel:

const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
console.log('Available buckets:', buckets)

const { data: files, error: filesError } = await supabase.storage
  .from('customer-documents')
  .list('', { limit: 10 })
console.log('Files in bucket:', files)
console.log('Error:', filesError)
*/

-- ============================================================================
-- SUMMARY & NEXT STEPS
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'DOCUMENT UPLOAD FIX COMPLETE!';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'What was done:';
    RAISE NOTICE '1. ✅ Verified/created customer-documents bucket';
    RAISE NOTICE '2. ✅ Removed old conflicting policies';
    RAISE NOTICE '3. ✅ Created new storage policies for authenticated users';
    RAISE NOTICE '4. ✅ Enabled INSERT, SELECT, UPDATE, DELETE operations';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Go to the admin panel Clienti tab';
    RAISE NOTICE '2. Click "Documenti" for any customer';
    RAISE NOTICE '3. Upload a test document';
    RAISE NOTICE '4. Open browser console (F12) to see detailed logs';
    RAISE NOTICE '5. Click "Ricarica" button to refresh the document list';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'If still not working:';
    RAISE NOTICE '- Check browser console for errors';
    RAISE NOTICE '- Verify you are logged in as authenticated user';
    RAISE NOTICE '- Check Supabase dashboard Storage settings';
    RAISE NOTICE '- Ensure RLS is enabled on storage.objects';
    RAISE NOTICE '============================================';
END $$;
