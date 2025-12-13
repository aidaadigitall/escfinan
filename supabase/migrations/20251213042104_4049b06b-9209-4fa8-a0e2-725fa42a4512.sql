-- Fix system_users RLS policies - replace overly permissive policies with secure ones

-- Drop the dangerous policies that allow anyone access
DROP POLICY IF EXISTS "Users can view system users" ON public.system_users;
DROP POLICY IF EXISTS "Users can create system users" ON public.system_users;
DROP POLICY IF EXISTS "Users can update system users" ON public.system_users;
DROP POLICY IF EXISTS "Users can delete system users" ON public.system_users;

-- Create secure policies using can_access_user_data function
CREATE POLICY "Users can view system users" ON public.system_users 
  FOR SELECT USING (can_access_user_data(user_id));

CREATE POLICY "Users can create system users" ON public.system_users 
  FOR INSERT WITH CHECK (can_access_user_data(user_id));

CREATE POLICY "Users can update system users" ON public.system_users 
  FOR UPDATE USING (can_access_user_data(user_id));

CREATE POLICY "Users can delete system users" ON public.system_users 
  FOR DELETE USING (can_access_user_data(user_id));