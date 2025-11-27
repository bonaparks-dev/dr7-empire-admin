-- Fix admin permissions for lottery ticket manual sales
-- Run this in your Supabase SQL Editor

-- Grant insert permission to authenticated users (admins)
-- This allows admin panel to create manual ticket sales
CREATE POLICY IF NOT EXISTS "Authenticated users can insert tickets"
  ON commercial_operation_tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Grant select permission to authenticated users
CREATE POLICY IF NOT EXISTS "Authenticated users can view all tickets"
  ON commercial_operation_tickets
  FOR SELECT
  TO authenticated
  USING (true);

-- Verify the policies are created
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'commercial_operation_tickets'
ORDER BY policyname;
