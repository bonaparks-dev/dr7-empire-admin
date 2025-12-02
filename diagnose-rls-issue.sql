-- ============================================================================
-- DIAGNOSE RLS ISSUE
-- ============================================================================

-- Check 1: Are you authenticated?
SELECT
    auth.uid() as user_id,
    auth.role() as role,
    auth.email() as email;

-- If user_id is NULL, you're not logged in!

-- Check 2: Do the storage buckets exist?
SELECT id, name, public, created_at
FROM storage.buckets
WHERE id IN ('customer-documents', 'driver-licenses')
ORDER BY id;

-- Expected: 2 rows

-- Check 3: Check storage.objects policies for customer-documents
SELECT policyname, cmd as operation, permissive, roles
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
AND policyname LIKE '%customer%'
ORDER BY cmd;

-- Check 4: Check storage.objects policies for driver-licenses
SELECT policyname, cmd as operation, permissive, roles
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
AND policyname LIKE '%driver%'
ORDER BY cmd;

-- Check 5: Check customer_documents table policies
SELECT policyname, cmd as operation, permissive, roles
FROM pg_policies
WHERE tablename = 'customer_documents'
ORDER BY cmd;

-- Check 6: Try to manually insert a test row
-- Uncomment to test (replace with real customer_id from your customers_extended table)
-- SELECT id FROM customers_extended LIMIT 1;

-- INSERT INTO customer_documents (
--     customer_id,
--     document_type,
--     file_name,
--     file_path,
--     file_size,
--     mime_type,
--     bucket_id,
--     uploaded_by
-- ) VALUES (
--     'PASTE_CUSTOMER_ID_HERE',
--     'identity_document',
--     'test.pdf',
--     'test/identity_document_123.pdf',
--     1024,
--     'application/pdf',
--     'customer-documents',
--     auth.uid()
-- );
