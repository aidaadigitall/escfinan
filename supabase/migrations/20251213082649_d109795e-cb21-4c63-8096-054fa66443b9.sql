-- Create lead_capture_forms table
CREATE TABLE public.lead_capture_forms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  owner_user_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT NOT NULL,
  fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  default_source TEXT,
  default_pipeline_stage_id UUID REFERENCES public.pipeline_stages(id) ON DELETE SET NULL,
  assign_to_user_id UUID,
  automation_rule_id UUID,
  title TEXT,
  subtitle TEXT,
  success_message TEXT,
  redirect_url TEXT,
  button_text TEXT NOT NULL DEFAULT 'Enviar',
  theme_color TEXT NOT NULL DEFAULT '#2563eb',
  logo_url TEXT,
  background_image_url TEXT,
  custom_css TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  require_double_optin BOOLEAN NOT NULL DEFAULT false,
  view_count INTEGER NOT NULL DEFAULT 0,
  submission_count INTEGER NOT NULL DEFAULT 0,
  conversion_rate NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique index on slug per owner
CREATE UNIQUE INDEX lead_capture_forms_slug_owner_idx ON public.lead_capture_forms(slug, COALESCE(owner_user_id, user_id));

-- Create lead_capture_submissions table
CREATE TABLE public.lead_capture_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID NOT NULL REFERENCES public.lead_capture_forms(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  form_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.lead_capture_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_capture_submissions ENABLE ROW LEVEL SECURITY;

-- RLS policies for lead_capture_forms (using hierarchical access)
CREATE POLICY "Users can view their own lead capture forms"
ON public.lead_capture_forms FOR SELECT
USING (public.can_access_user_data(user_id));

CREATE POLICY "Users can create lead capture forms"
ON public.lead_capture_forms FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own lead capture forms"
ON public.lead_capture_forms FOR UPDATE
USING (public.can_access_user_data(user_id));

CREATE POLICY "Users can delete their own lead capture forms"
ON public.lead_capture_forms FOR DELETE
USING (public.can_access_user_data(user_id));

-- Public access policy for active forms (for public capture page)
CREATE POLICY "Anyone can view active lead capture forms"
ON public.lead_capture_forms FOR SELECT
USING (is_active = true);

-- RLS policies for lead_capture_submissions
CREATE POLICY "Users can view submissions for their forms"
ON public.lead_capture_submissions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.lead_capture_forms f
    WHERE f.id = form_id AND public.can_access_user_data(f.user_id)
  )
);

CREATE POLICY "Anyone can create submissions for active forms"
ON public.lead_capture_submissions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.lead_capture_forms f
    WHERE f.id = form_id AND f.is_active = true
  )
);

CREATE POLICY "Users can update submissions for their forms"
ON public.lead_capture_submissions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.lead_capture_forms f
    WHERE f.id = form_id AND public.can_access_user_data(f.user_id)
  )
);

CREATE POLICY "Users can delete submissions for their forms"
ON public.lead_capture_submissions FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.lead_capture_forms f
    WHERE f.id = form_id AND public.can_access_user_data(f.user_id)
  )
);

-- Create updated_at trigger for lead_capture_forms
CREATE TRIGGER update_lead_capture_forms_updated_at
BEFORE UPDATE ON public.lead_capture_forms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to increment form view count
CREATE OR REPLACE FUNCTION public.increment_form_view(form_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.lead_capture_forms
  SET view_count = view_count + 1
  WHERE id = form_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to process lead capture submission
CREATE OR REPLACE FUNCTION public.process_lead_capture_submission(submission_id_param UUID)
RETURNS UUID AS $$
DECLARE
  v_submission RECORD;
  v_form RECORD;
  v_lead_id UUID;
  v_name TEXT;
  v_email TEXT;
  v_phone TEXT;
  v_company TEXT;
BEGIN
  -- Get the submission
  SELECT * INTO v_submission FROM public.lead_capture_submissions WHERE id = submission_id_param;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Submission not found';
  END IF;
  
  -- Get the form
  SELECT * INTO v_form FROM public.lead_capture_forms WHERE id = v_submission.form_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Form not found';
  END IF;
  
  -- Extract data from form_data (try common field names)
  v_name := COALESCE(
    v_submission.form_data->>'Nome',
    v_submission.form_data->>'name',
    v_submission.form_data->>'nome',
    v_submission.form_data->>'Nome completo',
    'Lead sem nome'
  );
  
  v_email := COALESCE(
    v_submission.form_data->>'Email',
    v_submission.form_data->>'email',
    v_submission.form_data->>'E-mail'
  );
  
  v_phone := COALESCE(
    v_submission.form_data->>'Telefone',
    v_submission.form_data->>'phone',
    v_submission.form_data->>'telefone',
    v_submission.form_data->>'Celular',
    v_submission.form_data->>'WhatsApp'
  );
  
  v_company := COALESCE(
    v_submission.form_data->>'Empresa',
    v_submission.form_data->>'company',
    v_submission.form_data->>'empresa'
  );
  
  -- Create the lead
  INSERT INTO public.leads (
    user_id,
    owner_user_id,
    name,
    email,
    phone,
    company,
    source,
    source_details,
    pipeline_stage_id,
    status,
    notes
  ) VALUES (
    v_form.user_id,
    v_form.owner_user_id,
    v_name,
    v_email,
    v_phone,
    v_company,
    COALESCE(v_form.default_source, 'Formulário de Captura'),
    'Formulário: ' || v_form.name,
    v_form.default_pipeline_stage_id,
    'novo',
    'Dados do formulário: ' || v_submission.form_data::text
  )
  RETURNING id INTO v_lead_id;
  
  -- Update submission with lead_id and mark as processed
  UPDATE public.lead_capture_submissions
  SET 
    lead_id = v_lead_id,
    status = 'processed',
    processed_at = now()
  WHERE id = submission_id_param;
  
  -- Increment submission count on form
  UPDATE public.lead_capture_forms
  SET 
    submission_count = submission_count + 1,
    conversion_rate = CASE 
      WHEN view_count > 0 THEN (submission_count + 1)::numeric / view_count * 100
      ELSE 0
    END
  WHERE id = v_submission.form_id;
  
  RETURN v_lead_id;
EXCEPTION
  WHEN OTHERS THEN
    -- Mark submission as failed
    UPDATE public.lead_capture_submissions
    SET 
      status = 'failed',
      error_message = SQLERRM,
      processed_at = now()
    WHERE id = submission_id_param;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;