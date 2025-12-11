-- Create leads table for CRM
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  owner_user_id UUID,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  position TEXT,
  source TEXT DEFAULT 'manual',
  source_details TEXT,
  pipeline_stage_id UUID,
  status TEXT DEFAULT 'new',
  score INTEGER DEFAULT 0,
  expected_value NUMERIC,
  probability INTEGER DEFAULT 50,
  expected_close_date DATE,
  lost_reason TEXT,
  lost_date TIMESTAMP WITH TIME ZONE,
  converted_to_client BOOLEAN DEFAULT false,
  client_id UUID,
  converted_at TIMESTAMP WITH TIME ZONE,
  assigned_to UUID,
  first_contact_date DATE,
  last_contact_date DATE,
  last_activity_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view leads" ON public.leads
  FOR SELECT USING (can_access_user_data(user_id));

CREATE POLICY "Users can create leads" ON public.leads
  FOR INSERT WITH CHECK (can_access_user_data(user_id));

CREATE POLICY "Users can update leads" ON public.leads
  FOR UPDATE USING (can_access_user_data(user_id));

CREATE POLICY "Users can delete leads" ON public.leads
  FOR DELETE USING (can_access_user_data(user_id));

-- Create updated_at trigger
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();