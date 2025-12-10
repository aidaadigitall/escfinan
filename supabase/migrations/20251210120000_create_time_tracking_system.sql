-- Create time_tracking table for daily clock in/out records
-- Utility function: ensure updated_at is set on updates
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE public.time_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  clock_in TIMESTAMP WITH TIME ZONE,
  clock_out TIMESTAMP WITH TIME ZONE,
  break_start TIMESTAMP WITH TIME ZONE,
  break_end TIMESTAMP WITH TIME ZONE,
  hours_worked DECIMAL(5, 2),
  break_duration DECIMAL(5, 2) DEFAULT 0,
  net_hours DECIMAL(5, 2),
  notes TEXT,
  status VARCHAR(20) DEFAULT 'completed', -- completed, pending, edited, approved
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable RLS
ALTER TABLE public.time_tracking ENABLE ROW LEVEL SECURITY;

-- Policies for time_tracking
CREATE POLICY "Users can view their own time tracking"
ON public.time_tracking
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own time tracking"
ON public.time_tracking
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own time tracking"
ON public.time_tracking
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Managers can delete time tracking"
ON public.time_tracking
FOR DELETE
USING (true);

-- Add updated_at trigger
CREATE TRIGGER update_time_tracking_updated_at
BEFORE UPDATE ON public.time_tracking
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create time_clock_requests table for edit approval workflow
CREATE TABLE public.time_clock_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  time_tracking_id UUID NOT NULL REFERENCES public.time_tracking(id) ON DELETE CASCADE,
  request_type VARCHAR(50) NOT NULL, -- 'edit_clock_in', 'edit_clock_out', 'add_break', 'remove_break', 'adjust_hours'
  reason TEXT NOT NULL,
  requested_value TIMESTAMP WITH TIME ZONE,
  requested_hours DECIMAL(5, 2),
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, cancelled
  approved_by UUID REFERENCES auth.users(id),
  approval_comment TEXT,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.time_clock_requests ENABLE ROW LEVEL SECURITY;

-- Policies for time_clock_requests
CREATE POLICY "Users can view their own requests"
ON public.time_clock_requests
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own requests"
ON public.time_clock_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Managers can update requests"
ON public.time_clock_requests
FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Managers can delete requests"
ON public.time_clock_requests
FOR DELETE
USING (true);

-- Add updated_at trigger
CREATE TRIGGER update_time_clock_requests_updated_at
BEFORE UPDATE ON public.time_clock_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create time_clock_summary table for monthly/annual bank of hours
CREATE TABLE public.time_clock_summary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year_month VARCHAR(7) NOT NULL, -- YYYY-MM format
  total_hours_worked DECIMAL(8, 2) DEFAULT 0,
  total_break_duration DECIMAL(8, 2) DEFAULT 0,
  total_net_hours DECIMAL(8, 2) DEFAULT 0,
  expected_hours DECIMAL(8, 2) DEFAULT 160, -- 8h/day * 20 workdays
  balance_hours DECIMAL(8, 2) DEFAULT 0, -- positive = extra hours, negative = debt
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, year_month)
);

-- Enable RLS
ALTER TABLE public.time_clock_summary ENABLE ROW LEVEL SECURITY;

-- Policies for time_clock_summary
CREATE POLICY "Users can view their own summary"
ON public.time_clock_summary
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert/update summaries"
ON public.time_clock_summary
FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update summaries"
ON public.time_clock_summary
FOR UPDATE
USING (true);

-- Add updated_at trigger
CREATE TRIGGER update_time_clock_summary_updated_at
BEFORE UPDATE ON public.time_clock_summary
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_time_tracking_user_date ON public.time_tracking(user_id, date DESC);
CREATE INDEX idx_time_clock_requests_status ON public.time_clock_requests(status, requested_at DESC);
CREATE INDEX idx_time_clock_requests_user ON public.time_clock_requests(user_id, requested_at DESC);
CREATE INDEX idx_time_clock_summary_user_year_month ON public.time_clock_summary(user_id, year_month DESC);
