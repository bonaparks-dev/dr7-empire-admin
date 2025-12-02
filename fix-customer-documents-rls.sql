-- ============================================================================
-- FIX: Customer Documents RLS Policy Issue
-- ============================================================================
-- This fixes the "new row violates row-level security policy" error
-- when uploading identity documents
-- ============================================================================

-- STEP 1: Drop existing policies
DROP POLICY IF EXISTS "customer_documents_select" ON customer_documents;
DROP POLICY IF EXISTS "customer_documents_insert" ON customer_documents;
DROP POLICY IF EXISTS "customer_documents_update" ON customer_documents;
DROP POLICY IF EXISTS "customer_documents_delete" ON customer_documents;

-- STEP 2: Verify RLS is enabled
ALTER TABLE customer_documents ENABLE ROW LEVEL SECURITY;

-- STEP 3: Create new permissive policies for authenticated users
CREATE POLICY "customer_documents_select_policy"
ON customer_documents
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "customer_documents_insert_policy"
ON customer_documents
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "customer_documents_update_policy"
ON customer_documents
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "customer_documents_delete_policy"
ON customer_documents
FOR DELETE
TO authenticated
USING (true);

-- STEP 4: Verify policies were created
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
WHERE tablename = 'customer_documents'
ORDER BY cmd;

-- STEP 5: Check that enum type exists
SELECT
    e.enumlabel as value
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname = 'document_type'
ORDER BY e.enumsortorder;

-- Expected: drivers_license, identity_document

-- STEP 6: Verify table structure
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'customer_documents'
ORDER BY ordinal_position;

-- STEP 7: Test insert (optional - comment out if you want to test via UI)
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
--     '00000000-0000-0000-0000-000000000000', -- Replace with real customer_id
--     'identity_document',
--     'test.pdf',
--     'test-customer/identity_document_123.pdf',
--     1024,
--     'application/pdf',
--     'customer-documents',
--     auth.uid()
-- );

-- ============================================================================
-- DIAGNOSTIC: If still getting errors
-- ============================================================================

-- Check if you're authenticated
SELECT
    auth.uid() as user_id,
    auth.role() as role,
    auth.email() as email;

-- If auth.uid() returns NULL, you're not authenticated!
-- Make sure you're logged into the admin panel.

-- ============================================================================
-- DONE
-- ============================================================================
