-- Enable realtime for tasks table
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;

-- Enable realtime for task_comments table
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_comments;

-- Set REPLICA IDENTITY FULL for complete row data on updates
ALTER TABLE public.tasks REPLICA IDENTITY FULL;
ALTER TABLE public.task_comments REPLICA IDENTITY FULL;