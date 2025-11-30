-- Setup Customer Documents Storage Bucket
-- Run this in Supabase SQL Editor

-- ============================================================================
-- 1. CREATE STORAGE BUCKET
-- ============================================================================

-- Create the bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('customer-documents', 'customer-documents', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. SET UP STORAGE POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to upload customer documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to read customer documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete customer documents" ON storage.objects;

-- Policy: Allow authenticated users to upload documents
CREATE POLICY "Allow authenticated users to upload customer documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'customer-documents');

-- Policy: Allow authenticated users to read/download documents
CREATE POLICY "Allow authenticated users to read customer documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'customer-documents');

-- Policy: Allow authenticated users to update documents
CREATE POLICY "Allow authenticated users to update customer documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'customer-documents');

-- Policy: Allow authenticated users to delete documents
CREATE POLICY "Allow authenticated users to delete customer documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'customer-documents');

-- ============================================================================
-- 3. VERIFY SETUP
-- ============================================================================

-- Check if bucket exists
SELECT
    id,
    name,
    public,
    created_at
FROM storage.buckets
WHERE id = 'customer-documents';

-- Check policies
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'objects'
AND policyname LIKE '%customer documents%';

-- ============================================================================
-- SUMMARY
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'CUSTOMER DOCUMENTS STORAGE SETUP COMPLETE!';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Bucket: customer-documents';
    RAISE NOTICE 'Access: Authenticated users only';
    RAISE NOTICE 'Permissions: Upload, Read, Update, Delete';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Test upload in Clienti tab';
    RAISE NOTICE '2. Verify documents appear in list';
    RAISE NOTICE '3. Test download and delete functions';
    RAISE NOTICE '============================================';
END $$;
