-- Add dashboard permission to user_permissions table
ALTER TABLE public.user_permissions 
ADD COLUMN IF NOT EXISTS can_view_dashboard_values boolean DEFAULT true;