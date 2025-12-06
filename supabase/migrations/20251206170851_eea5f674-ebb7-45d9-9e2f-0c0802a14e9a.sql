-- Add task reports permission column to user_permissions table
ALTER TABLE public.user_permissions 
ADD COLUMN IF NOT EXISTS can_view_task_reports boolean DEFAULT true;