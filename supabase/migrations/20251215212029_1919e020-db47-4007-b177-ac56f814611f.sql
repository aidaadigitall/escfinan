-- Add project-related columns to tasks table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS estimated_hours numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS actual_hours numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS start_date date,
ADD COLUMN IF NOT EXISTS progress_percentage integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS task_number integer;

-- Create index for project_id
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);

-- Drop existing function to recreate with different return type
DROP FUNCTION IF EXISTS public.calculate_project_progress(uuid);

-- Update calculate_project_progress function to use tasks table
CREATE OR REPLACE FUNCTION public.calculate_project_progress(p_project_id uuid)
RETURNS integer AS $$
DECLARE
  total_tasks integer;
  completed_tasks integer;
  new_progress integer;
BEGIN
  -- Count tasks from unified tasks table
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'completed')
  INTO total_tasks, completed_tasks
  FROM public.tasks
  WHERE project_id = p_project_id;

  -- Calculate progress percentage
  IF total_tasks > 0 THEN
    new_progress := ROUND((completed_tasks::numeric / total_tasks::numeric) * 100);
  ELSE
    new_progress := 0;
  END IF;

  -- Update project progress
  UPDATE public.projects
  SET progress_percentage = new_progress,
      updated_at = now()
  WHERE id = p_project_id;
  
  RETURN new_progress;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update get_project_metrics to use tasks table
DROP FUNCTION IF EXISTS public.get_project_metrics(uuid);

CREATE OR REPLACE FUNCTION public.get_project_metrics(p_project_id uuid)
RETURNS json AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'total_tasks', (SELECT COUNT(*) FROM tasks WHERE project_id = p_project_id),
    'completed_tasks', (SELECT COUNT(*) FROM tasks WHERE project_id = p_project_id AND status = 'completed'),
    'pending_tasks', (SELECT COUNT(*) FROM tasks WHERE project_id = p_project_id AND status = 'pending'),
    'total_hours', (SELECT COALESCE(SUM(hours), 0) FROM project_time_entries WHERE project_id = p_project_id),
    'billable_hours', (SELECT COALESCE(SUM(hours), 0) FROM project_time_entries WHERE project_id = p_project_id AND is_billable = true),
    'total_expenses', (SELECT COALESCE(SUM(amount), 0) FROM project_expenses WHERE project_id = p_project_id),
    'billable_expenses', (SELECT COALESCE(SUM(billable_amount), 0) FROM project_expenses WHERE project_id = p_project_id AND is_billable = true)
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Migrate existing project_tasks data to tasks table
INSERT INTO public.tasks (
  user_id,
  title,
  description,
  due_date,
  priority,
  status,
  parent_task_id,
  project_id,
  estimated_hours,
  actual_hours,
  start_date,
  progress_percentage,
  task_number,
  responsible_id,
  created_at,
  updated_at
)
SELECT 
  pt.user_id,
  pt.title,
  pt.description,
  pt.due_date,
  COALESCE(pt.priority, 'medium'),
  CASE 
    WHEN pt.status = 'todo' THEN 'pending'
    WHEN pt.status = 'in_progress' THEN 'pending'
    WHEN pt.status = 'review' THEN 'pending'
    WHEN pt.status = 'completed' THEN 'completed'
    WHEN pt.status = 'blocked' THEN 'pending'
    ELSE 'pending'
  END,
  NULL,
  pt.project_id,
  COALESCE(pt.estimated_hours, 0),
  COALESCE(pt.actual_hours, 0),
  pt.start_date,
  COALESCE(pt.progress_percentage, 0),
  pt.task_number,
  pt.assigned_to,
  pt.created_at,
  pt.updated_at
FROM public.project_tasks pt
WHERE NOT EXISTS (
  SELECT 1 FROM public.tasks t 
  WHERE t.project_id = pt.project_id 
  AND t.title = pt.title
);