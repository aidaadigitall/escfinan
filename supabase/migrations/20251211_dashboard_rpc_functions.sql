-- Migration: Funções RPC para Dashboard Preferences
-- Data: 2025-12-11
-- Descrição: Funções RPC que contornam o problema de schema cache do PostgREST

-- ============================================================================
-- 1. FUNÇÃO: Buscar preferências do usuário
-- ============================================================================
CREATE OR REPLACE FUNCTION get_dashboard_prefs()
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  user_uuid UUID;
BEGIN
  user_uuid := auth.uid();
  
  IF user_uuid IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT row_to_json(dp.*)::jsonb INTO result
  FROM public.dashboard_preferences dp
  WHERE dp.user_id = user_uuid;
  
  -- Se não existir, criar com valores padrão
  IF result IS NULL THEN
    INSERT INTO public.dashboard_preferences (
      user_id,
      layout_config,
      enabled_widgets,
      theme_mode,
      compact_mode,
      show_sidebar,
      show_metrics
    ) VALUES (
      user_uuid,
      '[]'::jsonb,
      '["total-leads", "conversion-rate", "total-value", "average-ticket", "funnel-chart", "conversion-chart"]'::jsonb,
      'light',
      false,
      true,
      true
    )
    RETURNING row_to_json(dashboard_preferences.*)::jsonb INTO result;
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 2. FUNÇÃO: Atualizar preferências
-- ============================================================================
CREATE OR REPLACE FUNCTION update_dashboard_prefs(prefs JSONB)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  user_uuid UUID;
BEGIN
  user_uuid := auth.uid();
  
  IF user_uuid IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Garantir que existe um registro
  INSERT INTO public.dashboard_preferences (user_id)
  VALUES (user_uuid)
  ON CONFLICT (user_id) DO NOTHING;

  -- Atualizar campos fornecidos
  UPDATE public.dashboard_preferences
  SET 
    theme_mode = COALESCE(prefs->>'theme_mode', theme_mode),
    custom_theme = COALESCE(prefs->'custom_theme', custom_theme),
    enabled_widgets = COALESCE(prefs->'enabled_widgets', enabled_widgets),
    layout_config = COALESCE(prefs->'layout_config', layout_config),
    compact_mode = COALESCE((prefs->>'compact_mode')::boolean, compact_mode),
    show_sidebar = COALESCE((prefs->>'show_sidebar')::boolean, show_sidebar),
    show_metrics = COALESCE((prefs->>'show_metrics')::boolean, show_metrics),
    widget_settings = COALESCE(prefs->'widget_settings', widget_settings),
    updated_at = now()
  WHERE user_id = user_uuid
  RETURNING row_to_json(dashboard_preferences.*)::jsonb INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. FUNÇÃO: Buscar templates disponíveis
-- ============================================================================
CREATE OR REPLACE FUNCTION get_dashboard_templates()
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  user_uuid UUID;
BEGIN
  user_uuid := auth.uid();

  SELECT jsonb_agg(row_to_json(t.*)::jsonb ORDER BY t.is_system DESC, t.usage_count DESC)
  INTO result
  FROM public.dashboard_layout_templates t
  WHERE t.is_public = true OR t.user_id = user_uuid;
  
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. FUNÇÃO: Aplicar template
-- ============================================================================
CREATE OR REPLACE FUNCTION apply_dashboard_template(template_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  user_uuid UUID;
  template_record RECORD;
BEGIN
  user_uuid := auth.uid();
  
  IF user_uuid IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Buscar template
  SELECT * INTO template_record
  FROM public.dashboard_layout_templates
  WHERE id = template_id
    AND (is_public = true OR user_id = user_uuid);
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template not found';
  END IF;

  -- Garantir que existe preferências
  INSERT INTO public.dashboard_preferences (user_id)
  VALUES (user_uuid)
  ON CONFLICT (user_id) DO NOTHING;

  -- Aplicar template
  UPDATE public.dashboard_preferences
  SET 
    layout_config = template_record.layout_config,
    enabled_widgets = template_record.enabled_widgets,
    custom_theme = template_record.theme_config,
    updated_at = now()
  WHERE user_id = user_uuid
  RETURNING row_to_json(dashboard_preferences.*)::jsonb INTO result;

  -- Incrementar contador
  UPDATE public.dashboard_layout_templates
  SET usage_count = usage_count + 1
  WHERE id = template_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. FUNÇÃO: Salvar template personalizado
-- ============================================================================
CREATE OR REPLACE FUNCTION save_dashboard_template(
  template_name TEXT,
  template_description TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  user_uuid UUID;
  current_prefs RECORD;
BEGIN
  user_uuid := auth.uid();
  
  IF user_uuid IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Buscar preferências atuais
  SELECT * INTO current_prefs
  FROM public.dashboard_preferences
  WHERE user_id = user_uuid;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No preferences found';
  END IF;

  -- Criar template
  INSERT INTO public.dashboard_layout_templates (
    user_id,
    name,
    description,
    layout_config,
    enabled_widgets,
    theme_config,
    is_public,
    is_system,
    category
  ) VALUES (
    user_uuid,
    template_name,
    template_description,
    current_prefs.layout_config,
    current_prefs.enabled_widgets,
    current_prefs.custom_theme,
    false,
    false,
    'custom'
  )
  RETURNING row_to_json(dashboard_layout_templates.*)::jsonb INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. GRANTS para as funções
-- ============================================================================
GRANT EXECUTE ON FUNCTION get_dashboard_prefs() TO authenticated;
GRANT EXECUTE ON FUNCTION update_dashboard_prefs(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_templates() TO authenticated;
GRANT EXECUTE ON FUNCTION apply_dashboard_template(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION save_dashboard_template(text, text) TO authenticated;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
