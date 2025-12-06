-- Add columns for task enhancements
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS assigned_users uuid[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]';

-- Create task_comments table
CREATE TABLE IF NOT EXISTS public.task_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  mentions uuid[] DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for task_comments
CREATE POLICY "Users can view task comments" ON public.task_comments
  FOR SELECT USING (can_access_user_data(user_id));

CREATE POLICY "Users can create task comments" ON public.task_comments
  FOR INSERT WITH CHECK (can_access_user_data(user_id));

CREATE POLICY "Users can update task comments" ON public.task_comments
  FOR UPDATE USING (can_access_user_data(user_id));

CREATE POLICY "Users can delete task comments" ON public.task_comments
  FOR DELETE USING (can_access_user_data(user_id));

-- Create updated_at trigger for task_comments
CREATE TRIGGER update_task_comments_updated_at
  BEFORE UPDATE ON public.task_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();