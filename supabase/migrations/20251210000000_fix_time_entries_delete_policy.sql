-- Fix time_entries RLS policies to allow proper delete and update operations
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view time entries" ON public.time_entries;
DROP POLICY IF EXISTS "Users can create time entries" ON public.time_entries;
DROP POLICY IF EXISTS "Users can update time entries" ON public.time_entries;
DROP POLICY IF EXISTS "Users can delete time entries" ON public.time_entries;

-- Create simplified policies that allow all operations for authenticated users
CREATE POLICY "Authenticated users can view all time entries"
  ON public.time_entries FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create own time entries"
  ON public.time_entries FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Authenticated users can update all time entries"
  ON public.time_entries FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete all time entries"
  ON public.time_entries FOR DELETE
  USING (auth.uid() IS NOT NULL);
