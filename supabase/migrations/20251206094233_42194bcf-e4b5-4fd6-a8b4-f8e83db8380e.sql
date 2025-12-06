-- Create audit table for company settings changes
CREATE TABLE public.company_settings_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_settings_id UUID NOT NULL,
  user_id UUID NOT NULL,
  user_name TEXT,
  changed_field TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_settings_audit ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing audit logs
CREATE POLICY "Users can view settings audit" 
ON public.company_settings_audit 
FOR SELECT 
USING (can_access_user_data(user_id));

-- Create function to log company settings changes
CREATE OR REPLACE FUNCTION public.log_company_settings_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  current_user_name TEXT;
  field_name TEXT;
  old_val TEXT;
  new_val TEXT;
BEGIN
  current_user_id := auth.uid();
  
  -- Get user name
  SELECT name INTO current_user_name FROM public.system_users WHERE user_id = current_user_id LIMIT 1;
  IF current_user_name IS NULL THEN
    SELECT full_name INTO current_user_name FROM public.profiles WHERE user_id = current_user_id LIMIT 1;
  END IF;

  -- Check each field for changes and log
  IF OLD.company_name IS DISTINCT FROM NEW.company_name THEN
    INSERT INTO public.company_settings_audit (company_settings_id, user_id, user_name, changed_field, old_value, new_value)
    VALUES (NEW.id, current_user_id, current_user_name, 'company_name', OLD.company_name, NEW.company_name);
  END IF;

  IF OLD.trading_name IS DISTINCT FROM NEW.trading_name THEN
    INSERT INTO public.company_settings_audit (company_settings_id, user_id, user_name, changed_field, old_value, new_value)
    VALUES (NEW.id, current_user_id, current_user_name, 'trading_name', OLD.trading_name, NEW.trading_name);
  END IF;

  IF OLD.cnpj IS DISTINCT FROM NEW.cnpj THEN
    INSERT INTO public.company_settings_audit (company_settings_id, user_id, user_name, changed_field, old_value, new_value)
    VALUES (NEW.id, current_user_id, current_user_name, 'cnpj', OLD.cnpj, NEW.cnpj);
  END IF;

  IF OLD.ie IS DISTINCT FROM NEW.ie THEN
    INSERT INTO public.company_settings_audit (company_settings_id, user_id, user_name, changed_field, old_value, new_value)
    VALUES (NEW.id, current_user_id, current_user_name, 'ie', OLD.ie, NEW.ie);
  END IF;

  IF OLD.im IS DISTINCT FROM NEW.im THEN
    INSERT INTO public.company_settings_audit (company_settings_id, user_id, user_name, changed_field, old_value, new_value)
    VALUES (NEW.id, current_user_id, current_user_name, 'im', OLD.im, NEW.im);
  END IF;

  IF OLD.phone IS DISTINCT FROM NEW.phone THEN
    INSERT INTO public.company_settings_audit (company_settings_id, user_id, user_name, changed_field, old_value, new_value)
    VALUES (NEW.id, current_user_id, current_user_name, 'phone', OLD.phone, NEW.phone);
  END IF;

  IF OLD.phone2 IS DISTINCT FROM NEW.phone2 THEN
    INSERT INTO public.company_settings_audit (company_settings_id, user_id, user_name, changed_field, old_value, new_value)
    VALUES (NEW.id, current_user_id, current_user_name, 'phone2', OLD.phone2, NEW.phone2);
  END IF;

  IF OLD.email IS DISTINCT FROM NEW.email THEN
    INSERT INTO public.company_settings_audit (company_settings_id, user_id, user_name, changed_field, old_value, new_value)
    VALUES (NEW.id, current_user_id, current_user_name, 'email', OLD.email, NEW.email);
  END IF;

  IF OLD.website IS DISTINCT FROM NEW.website THEN
    INSERT INTO public.company_settings_audit (company_settings_id, user_id, user_name, changed_field, old_value, new_value)
    VALUES (NEW.id, current_user_id, current_user_name, 'website', OLD.website, NEW.website);
  END IF;

  IF OLD.address IS DISTINCT FROM NEW.address THEN
    INSERT INTO public.company_settings_audit (company_settings_id, user_id, user_name, changed_field, old_value, new_value)
    VALUES (NEW.id, current_user_id, current_user_name, 'address', OLD.address, NEW.address);
  END IF;

  IF OLD.city IS DISTINCT FROM NEW.city THEN
    INSERT INTO public.company_settings_audit (company_settings_id, user_id, user_name, changed_field, old_value, new_value)
    VALUES (NEW.id, current_user_id, current_user_name, 'city', OLD.city, NEW.city);
  END IF;

  IF OLD.state IS DISTINCT FROM NEW.state THEN
    INSERT INTO public.company_settings_audit (company_settings_id, user_id, user_name, changed_field, old_value, new_value)
    VALUES (NEW.id, current_user_id, current_user_name, 'state', OLD.state, NEW.state);
  END IF;

  IF OLD.zipcode IS DISTINCT FROM NEW.zipcode THEN
    INSERT INTO public.company_settings_audit (company_settings_id, user_id, user_name, changed_field, old_value, new_value)
    VALUES (NEW.id, current_user_id, current_user_name, 'zipcode', OLD.zipcode, NEW.zipcode);
  END IF;

  IF OLD.logo_header_url IS DISTINCT FROM NEW.logo_header_url THEN
    INSERT INTO public.company_settings_audit (company_settings_id, user_id, user_name, changed_field, old_value, new_value)
    VALUES (NEW.id, current_user_id, current_user_name, 'logo_header_url', 'Logo anterior', 'Nova logo');
  END IF;

  IF OLD.logo_sidebar_url IS DISTINCT FROM NEW.logo_sidebar_url THEN
    INSERT INTO public.company_settings_audit (company_settings_id, user_id, user_name, changed_field, old_value, new_value)
    VALUES (NEW.id, current_user_id, current_user_name, 'logo_sidebar_url', 'Logo anterior', 'Nova logo');
  END IF;

  IF OLD.warranty_terms IS DISTINCT FROM NEW.warranty_terms THEN
    INSERT INTO public.company_settings_audit (company_settings_id, user_id, user_name, changed_field, old_value, new_value)
    VALUES (NEW.id, current_user_id, current_user_name, 'warranty_terms', OLD.warranty_terms, NEW.warranty_terms);
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER company_settings_audit_trigger
AFTER UPDATE ON public.company_settings
FOR EACH ROW
EXECUTE FUNCTION public.log_company_settings_change();