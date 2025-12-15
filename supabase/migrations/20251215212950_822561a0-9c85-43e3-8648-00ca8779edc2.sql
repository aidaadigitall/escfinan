-- Create employee_vacations table for vacation requests
CREATE TABLE public.employee_vacations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  owner_user_id UUID,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  vacation_type TEXT NOT NULL DEFAULT 'vacation',
  total_days INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create vacation_balance table for tracking vacation days
CREATE TABLE public.vacation_balance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  owner_user_id UUID,
  year INTEGER NOT NULL,
  total_days INTEGER NOT NULL DEFAULT 30,
  used_days INTEGER NOT NULL DEFAULT 0,
  pending_days INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(employee_id, year)
);

-- Enable RLS on both tables
ALTER TABLE public.employee_vacations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vacation_balance ENABLE ROW LEVEL SECURITY;

-- RLS policies for employee_vacations
CREATE POLICY "Users can view employee vacations"
ON public.employee_vacations FOR SELECT
USING (can_access_user_data(user_id));

CREATE POLICY "Users can create employee vacations"
ON public.employee_vacations FOR INSERT
WITH CHECK (can_access_user_data(user_id));

CREATE POLICY "Users can update employee vacations"
ON public.employee_vacations FOR UPDATE
USING (can_access_user_data(user_id));

CREATE POLICY "Users can delete employee vacations"
ON public.employee_vacations FOR DELETE
USING (can_access_user_data(user_id));

-- RLS policies for vacation_balance
CREATE POLICY "Users can view vacation balance"
ON public.vacation_balance FOR SELECT
USING (can_access_user_data(user_id));

CREATE POLICY "Users can create vacation balance"
ON public.vacation_balance FOR INSERT
WITH CHECK (can_access_user_data(user_id));

CREATE POLICY "Users can update vacation balance"
ON public.vacation_balance FOR UPDATE
USING (can_access_user_data(user_id));

CREATE POLICY "Users can delete vacation balance"
ON public.vacation_balance FOR DELETE
USING (can_access_user_data(user_id));

-- Create indexes for performance
CREATE INDEX idx_employee_vacations_employee_id ON public.employee_vacations(employee_id);
CREATE INDEX idx_employee_vacations_status ON public.employee_vacations(status);
CREATE INDEX idx_vacation_balance_employee_year ON public.vacation_balance(employee_id, year);

-- Trigger for updated_at
CREATE TRIGGER update_employee_vacations_updated_at
  BEFORE UPDATE ON public.employee_vacations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vacation_balance_updated_at
  BEFORE UPDATE ON public.vacation_balance
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();