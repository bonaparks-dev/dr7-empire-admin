-- Check all storage buckets in Supabase
-- Run this in Supabase SQL Editor

-- List all storage buckets
SELECT
  id,
  name,
  public,
  created_at
FROM storage.buckets
ORDER BY created_at DESC;

-- Check bucket sizes and file counts
SELECT
  b.name as bucket_name,
  COUNT(o.id) as file_count,
  pg_size_pretty(SUM(o.metadata->>'size')::bigint) as total_size
FROM storage.buckets b
LEFT JOIN storage.objects o ON b.id = o.bucket_id
GROUP BY b.name
ORDER BY b.name;

-- Create new bucket for admin customer documents (if needed)
-- Uncomment and run if you want to create a new bucket:

/*
INSERT INTO storage.buckets (id, name, public)
VALUES ('customer-documents', 'customer-documents', false);
*/

-- Set up RLS policies for customer-documents bucket (if created)
/*
-- Policy: Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'customer-documents');

-- Policy: Allow authenticated users to read
CREATE POLICY "Allow authenticated reads"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'customer-documents');

-- Policy: Allow authenticated users to delete their own files
CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'customer-documents');
*/
