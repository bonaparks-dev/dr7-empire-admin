-- Setup Codice Fiscale Storage Bucket
-- Run this in Supabase SQL Editor

-- ============================================================================
-- 1. CREATE STORAGE BUCKET
-- ============================================================================

-- Create codice-fiscale bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('codice-fiscale', 'codice-fiscale', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. SET UP STORAGE POLICIES FOR CODICE-FISCALE BUCKET
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to upload codice fiscale" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to read codice fiscale" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update codice fiscale" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete codice fiscale" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to upload to their own folder in codice-fiscale" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to view their own files in codice-fiscale" ON storage.objects;
DROP POLICY IF EXISTS "codice_fiscale_insert" ON storage.objects;
DROP POLICY IF EXISTS "codice_fiscale_select" ON storage.objects;
DROP POLICY IF EXISTS "codice_fiscale_update" ON storage.objects;
DROP POLICY IF EXISTS "codice_fiscale_delete" ON storage.objects;

-- Policy: Allow authenticated users to upload codice fiscale
CREATE POLICY "Allow authenticated users to upload codice fiscale"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'codice-fiscale');

-- Policy: Allow authenticated users to read codice fiscale
CREATE POLICY "Allow authenticated users to read codice fiscale"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'codice-fiscale');

-- Policy: Allow authenticated users to update codice fiscale
CREATE POLICY "codice_fiscale_update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'codice-fiscale')
WITH CHECK (bucket_id = 'codice-fiscale');

-- Policy: Allow authenticated users to delete codice fiscale
CREATE POLICY "codice_fiscale_delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'codice-fiscale');

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
WHERE id = 'codice-fiscale';

-- Check policies for codice-fiscale
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'objects'
AND (policyname LIKE '%codice%fiscale%' OR policyname LIKE '%codice_fiscale%')
ORDER BY cmd, policyname;

-- ============================================================================
-- SUMMARY
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'CODICE FISCALE STORAGE SETUP COMPLETE!';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Bucket created: codice-fiscale';
    RAISE NOTICE 'Access: Authenticated users only';
    RAISE NOTICE 'Permissions: Upload, Read, Update, Delete';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Deploy updated frontend code';
    RAISE NOTICE '2. Test Codice Fiscale upload (front + back)';
    RAISE NOTICE '3. Verify both documents display correctly';
    RAISE NOTICE '============================================';
END $$;
