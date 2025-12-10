-- Fix time_entries RLS policies to allow proper delete and update operations
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view time entries" ON public.time_entries;
DROP POLICY IF EXISTS "Users can create time entries" ON public.time_entries;
DROP POLICY IF EXISTS "Users can update time entries" ON public.time_entries;
DROP POLICY IF EXISTS "Users can delete time entries" ON public.time_entries;

-- Create new simplified policies that work
CREATE POLICY "Users can view own and managed time entries"
  ON public.time_entries FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.user_permissions
      WHERE user_permissions.user_id = auth.uid()
      AND user_permissions.can_manage_users = true
    )
  );

CREATE POLICY "Users can create own time entries"
  ON public.time_entries FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own and managed time entries"
  ON public.time_entries FOR UPDATE
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.user_permissions
      WHERE user_permissions.user_id = auth.uid()
      AND user_permissions.can_manage_users = true
    )
  )
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.user_permissions
      WHERE user_permissions.user_id = auth.uid()
      AND user_permissions.can_manage_users = true
    )
  );

CREATE POLICY "Users can delete own time entries, admins can delete all"
  ON public.time_entries FOR DELETE
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.user_permissions
      WHERE user_permissions.user_id = auth.uid()
      AND user_permissions.can_manage_users = true
    )
  );
