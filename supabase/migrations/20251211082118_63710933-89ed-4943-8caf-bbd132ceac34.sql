-- Create lead_sources table for managing custom lead origins
CREATE TABLE public.lead_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.lead_sources ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view lead sources" 
ON public.lead_sources 
FOR SELECT 
USING (can_access_user_data(user_id));

CREATE POLICY "Users can create lead sources" 
ON public.lead_sources 
FOR INSERT 
WITH CHECK (can_access_user_data(user_id));

CREATE POLICY "Users can update lead sources" 
ON public.lead_sources 
FOR UPDATE 
USING (can_access_user_data(user_id));

CREATE POLICY "Users can delete lead sources" 
ON public.lead_sources 
FOR DELETE 
USING (can_access_user_data(user_id));

-- Create trigger for updated_at
CREATE TRIGGER update_lead_sources_updated_at
BEFORE UPDATE ON public.lead_sources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();