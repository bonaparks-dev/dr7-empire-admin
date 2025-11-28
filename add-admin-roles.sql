-- Add role column to auth.users metadata
-- This allows different admin permission levels

-- First, create a custom_claims column in auth.users if it doesn't exist
-- Note: This should be done via Supabase Dashboard > Authentication > Policies

-- For now, we'll use a separate admins table to track roles
CREATE TABLE IF NOT EXISTS public.admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  role text DEFAULT 'admin' CHECK (role IN ('superadmin', 'admin')),
  can_view_financials boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all admin records
CREATE POLICY "Admins can view all admin records"
  ON public.admins
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only superadmins can insert/update/delete admin records
CREATE POLICY "Only superadmins can manage admins"
  ON public.admins
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.admins WHERE role = 'superadmin'
    )
  );

-- Insert your main admin as superadmin (replace with your actual email)
-- You'll need to get the user_id from auth.users first
INSERT INTO public.admins (user_id, email, role, can_view_financials)
SELECT id, email, 'superadmin', true
FROM auth.users
WHERE email = 'your-admin-email@example.com' -- REPLACE THIS WITH YOUR EMAIL
ON CONFLICT (email) DO NOTHING;

-- Create a function to get current admin role
CREATE OR REPLACE FUNCTION get_current_admin_role()
RETURNS TABLE (role text, can_view_financials boolean)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT role, can_view_financials
  FROM public.admins
  WHERE user_id = auth.uid();
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_current_admin_role() TO authenticated;
