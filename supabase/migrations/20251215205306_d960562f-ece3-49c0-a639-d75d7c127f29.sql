-- Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  owner_user_id UUID,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  project_type TEXT DEFAULT 'fixed_price',
  status TEXT DEFAULT 'planning',
  priority TEXT DEFAULT 'medium',
  budget_amount NUMERIC DEFAULT 0,
  budget_hours NUMERIC DEFAULT 0,
  hourly_rate NUMERIC DEFAULT 0,
  start_date DATE,
  expected_end_date DATE,
  actual_end_date DATE,
  progress_percentage INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project_tasks table
CREATE TABLE public.project_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  parent_task_id UUID REFERENCES public.project_tasks(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  owner_user_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  task_number INTEGER,
  estimated_hours NUMERIC DEFAULT 0,
  actual_hours NUMERIC DEFAULT 0,
  start_date DATE,
  due_date DATE,
  completed_date DATE,
  status TEXT DEFAULT 'todo',
  priority TEXT DEFAULT 'medium',
  progress_percentage INTEGER DEFAULT 0,
  assigned_to UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project_time_entries table
CREATE TABLE public.project_time_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.project_tasks(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  owner_user_id UUID,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  hours NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  is_billable BOOLEAN DEFAULT true,
  hourly_rate NUMERIC,
  amount NUMERIC GENERATED ALWAYS AS (hours * COALESCE(hourly_rate, 0)) STORED,
  status TEXT DEFAULT 'pending',
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project_expenses table
CREATE TABLE public.project_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  owner_user_id UUID,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expense_type TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  is_billable BOOLEAN DEFAULT false,
  is_billed BOOLEAN DEFAULT false,
  markup_percentage NUMERIC DEFAULT 0,
  billable_amount NUMERIC GENERATED ALWAYS AS (amount * (1 + COALESCE(markup_percentage, 0) / 100)) STORED,
  receipt_url TEXT,
  notes TEXT,
  status TEXT DEFAULT 'pending',
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_projects_owner_user_id ON public.projects(owner_user_id);
CREATE INDEX idx_projects_client_id ON public.projects(client_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_project_tasks_project_id ON public.project_tasks(project_id);
CREATE INDEX idx_project_tasks_assigned_to ON public.project_tasks(assigned_to);
CREATE INDEX idx_project_time_entries_project_id ON public.project_time_entries(project_id);
CREATE INDEX idx_project_expenses_project_id ON public.project_expenses(project_id);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_expenses ENABLE ROW LEVEL SECURITY;

-- Projects RLS policies
CREATE POLICY "Users can view projects" ON public.projects FOR SELECT USING (can_access_user_data(user_id));
CREATE POLICY "Users can create projects" ON public.projects FOR INSERT WITH CHECK (can_access_user_data(user_id));
CREATE POLICY "Users can update projects" ON public.projects FOR UPDATE USING (can_access_user_data(user_id));
CREATE POLICY "Users can delete projects" ON public.projects FOR DELETE USING (can_access_user_data(user_id));

-- Project tasks RLS policies
CREATE POLICY "Users can view project tasks" ON public.project_tasks FOR SELECT USING (can_access_user_data(user_id));
CREATE POLICY "Users can create project tasks" ON public.project_tasks FOR INSERT WITH CHECK (can_access_user_data(user_id));
CREATE POLICY "Users can update project tasks" ON public.project_tasks FOR UPDATE USING (can_access_user_data(user_id));
CREATE POLICY "Users can delete project tasks" ON public.project_tasks FOR DELETE USING (can_access_user_data(user_id));

-- Project time entries RLS policies
CREATE POLICY "Users can view project time entries" ON public.project_time_entries FOR SELECT USING (can_access_user_data(user_id));
CREATE POLICY "Users can create project time entries" ON public.project_time_entries FOR INSERT WITH CHECK (can_access_user_data(user_id));
CREATE POLICY "Users can update project time entries" ON public.project_time_entries FOR UPDATE USING (can_access_user_data(user_id));
CREATE POLICY "Users can delete project time entries" ON public.project_time_entries FOR DELETE USING (can_access_user_data(user_id));

-- Project expenses RLS policies
CREATE POLICY "Users can view project expenses" ON public.project_expenses FOR SELECT USING (can_access_user_data(user_id));
CREATE POLICY "Users can create project expenses" ON public.project_expenses FOR INSERT WITH CHECK (can_access_user_data(user_id));
CREATE POLICY "Users can update project expenses" ON public.project_expenses FOR UPDATE USING (can_access_user_data(user_id));
CREATE POLICY "Users can delete project expenses" ON public.project_expenses FOR DELETE USING (can_access_user_data(user_id));

-- Triggers for updated_at
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_tasks_updated_at BEFORE UPDATE ON public.project_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_time_entries_updated_at BEFORE UPDATE ON public.project_time_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_expenses_updated_at BEFORE UPDATE ON public.project_expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate project progress based on tasks
CREATE OR REPLACE FUNCTION public.calculate_project_progress(p_project_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_tasks INTEGER;
  v_completed_tasks INTEGER;
  v_progress INTEGER;
BEGIN
  SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'completed')
  INTO v_total_tasks, v_completed_tasks
  FROM public.project_tasks
  WHERE project_id = p_project_id AND parent_task_id IS NULL;
  
  IF v_total_tasks = 0 THEN
    RETURN 0;
  END IF;
  
  v_progress := ROUND((v_completed_tasks::NUMERIC / v_total_tasks::NUMERIC) * 100);
  
  UPDATE public.projects SET progress_percentage = v_progress WHERE id = p_project_id;
  
  RETURN v_progress;
END;
$$;

-- Function to get project metrics
CREATE OR REPLACE FUNCTION public.get_project_metrics(p_project_id UUID)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'total_tasks', (SELECT COUNT(*) FROM project_tasks WHERE project_id = p_project_id),
    'completed_tasks', (SELECT COUNT(*) FROM project_tasks WHERE project_id = p_project_id AND status = 'completed'),
    'pending_tasks', (SELECT COUNT(*) FROM project_tasks WHERE project_id = p_project_id AND status IN ('todo', 'in_progress')),
    'total_hours', (SELECT COALESCE(SUM(hours), 0) FROM project_time_entries WHERE project_id = p_project_id),
    'billable_hours', (SELECT COALESCE(SUM(hours), 0) FROM project_time_entries WHERE project_id = p_project_id AND is_billable = true),
    'total_expenses', (SELECT COALESCE(SUM(amount), 0) FROM project_expenses WHERE project_id = p_project_id),
    'billable_expenses', (SELECT COALESCE(SUM(billable_amount), 0) FROM project_expenses WHERE project_id = p_project_id AND is_billable = true)
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;