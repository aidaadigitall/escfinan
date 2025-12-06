-- Create storage bucket for task attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-attachments', 'task-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files to task-attachments bucket
CREATE POLICY "Authenticated users can upload task attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'task-attachments');

-- Allow users to view task attachments (public bucket)
CREATE POLICY "Anyone can view task attachments"
ON storage.objects
FOR SELECT
USING (bucket_id = 'task-attachments');

-- Allow users to delete their own task attachments
CREATE POLICY "Users can delete own task attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'task-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to update their own task attachments
CREATE POLICY "Users can update own task attachments"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'task-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);