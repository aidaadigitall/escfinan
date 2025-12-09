-- Create task_labels table for managing labels/tags
CREATE TABLE public.task_labels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.task_labels ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own labels" 
ON public.task_labels 
FOR SELECT 
USING (public.can_access_user_data(user_id));

CREATE POLICY "Users can create labels" 
ON public.task_labels 
FOR INSERT 
WITH CHECK (public.can_access_user_data(user_id));

CREATE POLICY "Users can update their own labels" 
ON public.task_labels 
FOR UPDATE 
USING (public.can_access_user_data(user_id));

CREATE POLICY "Users can delete their own labels" 
ON public.task_labels 
FOR DELETE 
USING (public.can_access_user_data(user_id));

-- Add updated_at trigger
CREATE TRIGGER update_task_labels_updated_at
BEFORE UPDATE ON public.task_labels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();