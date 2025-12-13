-- Fix search_path for the new functions to address security warnings
ALTER FUNCTION public.increment_form_view(uuid) SET search_path = public;
ALTER FUNCTION public.process_lead_capture_submission(uuid) SET search_path = public;