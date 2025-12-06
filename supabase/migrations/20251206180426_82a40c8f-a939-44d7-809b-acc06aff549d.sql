-- Add favicon and document numbering sequence columns to company_settings
ALTER TABLE public.company_settings 
ADD COLUMN IF NOT EXISTS favicon_url text,
ADD COLUMN IF NOT EXISTS next_quote_number integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS next_service_order_number integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS next_sale_number integer DEFAULT 1;

-- Update the audit trigger to log changes to new fields
CREATE OR REPLACE FUNCTION public.log_company_settings_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id UUID;
  current_user_name TEXT;
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

  -- New fields
  IF OLD.favicon_url IS DISTINCT FROM NEW.favicon_url THEN
    INSERT INTO public.company_settings_audit (company_settings_id, user_id, user_name, changed_field, old_value, new_value)
    VALUES (NEW.id, current_user_id, current_user_name, 'favicon_url', 'Favicon anterior', 'Novo favicon');
  END IF;

  IF OLD.next_quote_number IS DISTINCT FROM NEW.next_quote_number THEN
    INSERT INTO public.company_settings_audit (company_settings_id, user_id, user_name, changed_field, old_value, new_value)
    VALUES (NEW.id, current_user_id, current_user_name, 'next_quote_number', OLD.next_quote_number::text, NEW.next_quote_number::text);
  END IF;

  IF OLD.next_service_order_number IS DISTINCT FROM NEW.next_service_order_number THEN
    INSERT INTO public.company_settings_audit (company_settings_id, user_id, user_name, changed_field, old_value, new_value)
    VALUES (NEW.id, current_user_id, current_user_name, 'next_service_order_number', OLD.next_service_order_number::text, NEW.next_service_order_number::text);
  END IF;

  IF OLD.next_sale_number IS DISTINCT FROM NEW.next_sale_number THEN
    INSERT INTO public.company_settings_audit (company_settings_id, user_id, user_name, changed_field, old_value, new_value)
    VALUES (NEW.id, current_user_id, current_user_name, 'next_sale_number', OLD.next_sale_number::text, NEW.next_sale_number::text);
  END IF;

  RETURN NEW;
END;
$function$;