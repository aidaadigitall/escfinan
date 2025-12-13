-- =============================================================================
-- PART 1: Create lead_activities table
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.lead_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL DEFAULT 'note',
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER DEFAULT 15,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view lead activities" ON public.lead_activities FOR SELECT USING (can_access_user_data(user_id));
CREATE POLICY "Users can create lead activities" ON public.lead_activities FOR INSERT WITH CHECK (can_access_user_data(user_id));
CREATE POLICY "Users can update lead activities" ON public.lead_activities FOR UPDATE USING (can_access_user_data(user_id));
CREATE POLICY "Users can delete lead activities" ON public.lead_activities FOR DELETE USING (can_access_user_data(user_id));

CREATE TRIGGER update_lead_activities_updated_at BEFORE UPDATE ON public.lead_activities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- PART 2: Create dashboard_preferences table for CRM
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.dashboard_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  dashboard_type TEXT NOT NULL DEFAULT 'crm',
  preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, dashboard_type)
);

ALTER TABLE public.dashboard_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view dashboard preferences" ON public.dashboard_preferences FOR SELECT USING (can_access_user_data(user_id));
CREATE POLICY "Users can create dashboard preferences" ON public.dashboard_preferences FOR INSERT WITH CHECK (can_access_user_data(user_id));
CREATE POLICY "Users can update dashboard preferences" ON public.dashboard_preferences FOR UPDATE USING (can_access_user_data(user_id));
CREATE POLICY "Users can delete dashboard preferences" ON public.dashboard_preferences FOR DELETE USING (can_access_user_data(user_id));

CREATE TRIGGER update_dashboard_preferences_updated_at BEFORE UPDATE ON public.dashboard_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- PART 3: Create pipeline_stages table
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.pipeline_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  probability_default INTEGER NOT NULL DEFAULT 50,
  color TEXT NOT NULL DEFAULT '#6366f1',
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view pipeline stages" ON public.pipeline_stages FOR SELECT USING (can_access_user_data(user_id));
CREATE POLICY "Users can create pipeline stages" ON public.pipeline_stages FOR INSERT WITH CHECK (can_access_user_data(user_id));
CREATE POLICY "Users can update pipeline stages" ON public.pipeline_stages FOR UPDATE USING (can_access_user_data(user_id));
CREATE POLICY "Users can delete pipeline stages" ON public.pipeline_stages FOR DELETE USING (can_access_user_data(user_id));

CREATE TRIGGER update_pipeline_stages_updated_at BEFORE UPDATE ON public.pipeline_stages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- PART 4: DROP and recreate all pipeline stage functions
-- =============================================================================

-- Drop existing functions (all possible signatures)
DROP FUNCTION IF EXISTS public.get_pipeline_stages();
DROP FUNCTION IF EXISTS public.create_pipeline_stage(text, text, text, integer, integer);
DROP FUNCTION IF EXISTS public.update_pipeline_stage(uuid, text, text, text, integer, integer, boolean);
DROP FUNCTION IF EXISTS public.delete_pipeline_stage(uuid);
DROP FUNCTION IF EXISTS public.reorder_pipeline_stages(uuid[]);

-- Create get_pipeline_stages function
CREATE OR REPLACE FUNCTION public.get_pipeline_stages()
RETURNS SETOF public.pipeline_stages
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.pipeline_stages
  WHERE can_access_user_data(user_id)
  ORDER BY order_index ASC;
$$;

-- Create create_pipeline_stage function
CREATE OR REPLACE FUNCTION public.create_pipeline_stage(
  p_name TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_color TEXT DEFAULT '#6366f1',
  p_order_index INTEGER DEFAULT NULL,
  p_probability INTEGER DEFAULT 50
)
RETURNS public.pipeline_stages
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_order_index INTEGER;
  v_result public.pipeline_stages;
BEGIN
  v_user_id := get_effective_owner_id(auth.uid());
  
  IF p_order_index IS NULL THEN
    SELECT COALESCE(MAX(order_index), -1) + 1 INTO v_order_index
    FROM public.pipeline_stages
    WHERE can_access_user_data(user_id);
  ELSE
    v_order_index := p_order_index;
  END IF;
  
  INSERT INTO public.pipeline_stages (user_id, name, description, color, order_index, probability_default)
  VALUES (v_user_id, p_name, p_description, p_color, v_order_index, p_probability)
  RETURNING * INTO v_result;
  
  RETURN v_result;
END;
$$;

-- Create update_pipeline_stage function
CREATE OR REPLACE FUNCTION public.update_pipeline_stage(
  p_id UUID,
  p_name TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_color TEXT DEFAULT NULL,
  p_order_index INTEGER DEFAULT NULL,
  p_probability INTEGER DEFAULT NULL,
  p_is_active BOOLEAN DEFAULT NULL
)
RETURNS public.pipeline_stages
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result public.pipeline_stages;
BEGIN
  UPDATE public.pipeline_stages
  SET
    name = COALESCE(p_name, name),
    description = COALESCE(p_description, description),
    color = COALESCE(p_color, color),
    order_index = COALESCE(p_order_index, order_index),
    probability_default = COALESCE(p_probability, probability_default),
    is_active = COALESCE(p_is_active, is_active),
    updated_at = now()
  WHERE id = p_id AND can_access_user_data(user_id)
  RETURNING * INTO v_result;
  
  RETURN v_result;
END;
$$;

-- Create delete_pipeline_stage function
CREATE OR REPLACE FUNCTION public.delete_pipeline_stage(p_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.pipeline_stages
  WHERE id = p_id AND can_access_user_data(user_id);
END;
$$;

-- Create reorder_pipeline_stages function
CREATE OR REPLACE FUNCTION public.reorder_pipeline_stages(p_ids UUID[])
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_index INTEGER := 0;
BEGIN
  FOREACH v_id IN ARRAY p_ids LOOP
    UPDATE public.pipeline_stages
    SET order_index = v_index, updated_at = now()
    WHERE id = v_id AND can_access_user_data(user_id);
    v_index := v_index + 1;
  END LOOP;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_pipeline_stages() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_pipeline_stage(TEXT, TEXT, TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_pipeline_stage(UUID, TEXT, TEXT, TEXT, INTEGER, INTEGER, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_pipeline_stage(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reorder_pipeline_stages(UUID[]) TO authenticated;

-- Force PostgREST schema cache reload
SELECT pg_notify('pgrst', 'reload schema');