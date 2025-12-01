-- ============================================================================
-- SIMPLE FIX: Storage Policies for customer-documents bucket
-- ============================================================================
-- This is a simplified version that focuses on the core issue:
-- Files upload successfully but don't appear in the list.
--
-- PROBLEM: The SELECT policy on storage.objects is not configured correctly.
-- SOLUTION: Drop all existing policies and create clean new ones.
-- ============================================================================

-- STEP 1: Drop ALL existing policies for customer-documents bucket
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
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;

-- STEP 2: Create NEW policies with clear names
CREATE POLICY "customer_docs_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'customer-documents');

CREATE POLICY "customer_docs_select"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'customer-documents');

CREATE POLICY "customer_docs_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'customer-documents')
WITH CHECK (bucket_id = 'customer-documents');

CREATE POLICY "customer_docs_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'customer-documents');

-- STEP 3: Verify the policies are active
SELECT
    policyname,
    cmd as operation,
    permissive,
    roles
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
AND policyname LIKE 'customer_docs_%'
ORDER BY cmd;

-- Expected result: 4 policies (DELETE, INSERT, SELECT, UPDATE)
-- All should show: permissive = PERMISSIVE, roles = {authenticated}

-- STEP 4: Test that you can read files
SELECT
    id,
    name,
    bucket_id,
    created_at,
    metadata
FROM storage.objects
WHERE bucket_id = 'customer-documents'
ORDER BY created_at DESC
LIMIT 10;

-- If you see files here, the issue is fixed!
-- If you see files here but they still don't appear in the UI,
-- the problem is in the frontend code, not the database.
