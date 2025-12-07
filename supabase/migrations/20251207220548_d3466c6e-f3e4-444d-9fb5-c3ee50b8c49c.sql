
-- Create time_entries table for clock in/out records
CREATE TABLE public.time_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  clock_in TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  clock_out TIMESTAMP WITH TIME ZONE,
  break_start TIMESTAMP WITH TIME ZONE,
  break_end TIMESTAMP WITH TIME ZONE,
  total_hours NUMERIC,
  total_break_minutes NUMERIC DEFAULT 0,
  notes TEXT,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

-- RLS policies using can_access_user_data for hierarchy
CREATE POLICY "Users can view time entries"
  ON public.time_entries FOR SELECT
  USING (can_access_user_data(user_id));

CREATE POLICY "Users can create time entries"
  ON public.time_entries FOR INSERT
  WITH CHECK (can_access_user_data(user_id));

CREATE POLICY "Users can update time entries"
  ON public.time_entries FOR UPDATE
  USING (can_access_user_data(user_id));

CREATE POLICY "Users can delete time entries"
  ON public.time_entries FOR DELETE
  USING (can_access_user_data(user_id));

-- Trigger for updated_at
CREATE TRIGGER update_time_entries_updated_at
  BEFORE UPDATE ON public.time_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
