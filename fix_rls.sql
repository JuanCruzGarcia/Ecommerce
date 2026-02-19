-- 1. Create a secure function to check admin status
-- This function runs as the database owner (SECURITY DEFINER), avoiding RLS loops.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$;

-- 2. Drop the problematic recursive policies
-- Note: You might need to adjust the policy names if they are different in your DB.
-- I am guessing standard names based on your description, but strictly speaking
-- you might want to just drop ALL policies on profiles and recreate them cleanly.

DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
-- Also check for generic names like "Enable read access for all users" if you used a template.

-- 3. Recreate the policies safely

-- Policy: Admin can see ALL profiles
CREATE POLICY "Admins can view all profiles"
ON profiles
FOR SELECT
TO authenticated
USING (
  is_admin() -- Uses the secure function, no recursion!
);

-- Policy: Users can see THEIR OWN profile
CREATE POLICY "Users can view own profile"
ON profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
);
