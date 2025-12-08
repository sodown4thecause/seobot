-- Migration: Create check_is_admin RPC function
-- Purpose: Allow authenticated users to check if a user has admin privileges
-- The function queries auth.users.is_super_admin which is not directly accessible to clients

-- Create the check_is_admin function with SECURITY DEFINER
-- This allows the function to run with elevated privileges to access auth.users
CREATE OR REPLACE FUNCTION public.check_is_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  is_admin boolean := false;
BEGIN
  -- Security check: Only allow users to check their own admin status
  -- or allow service role to check any user
  IF auth.uid() IS NOT NULL AND auth.uid() != user_id THEN
    -- Non-service-role users can only check themselves
    RETURN false;
  END IF;

  -- Check is_super_admin flag in auth.users
  SELECT COALESCE(
    (raw_app_meta_data->>'is_super_admin')::boolean,
    (raw_user_meta_data->>'is_admin')::boolean,
    false
  )
  INTO is_admin
  FROM auth.users
  WHERE id = user_id;

  RETURN COALESCE(is_admin, false);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.check_is_admin(uuid) TO authenticated;

-- Add a comment explaining the function
COMMENT ON FUNCTION public.check_is_admin(uuid) IS 
  'Checks if a user has admin privileges by querying auth.users metadata. 
   Users can only check their own admin status for security.';

