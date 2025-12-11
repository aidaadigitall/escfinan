-- Migration: Dashboard Preferences and Customization
-- Criado em: 2025-12-11
-- Descrição: Sistema de personalização de dashboard com widgets, temas e layouts

-- ============================================================================
-- 1. TABELA DE PREFERÊNCIAS DE DASHBOARD
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.dashboard_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Layout Configuration
  layout_config JSONB DEFAULT '[]', -- Array de widgets: [{id, type, position, size, config}]
  active_layout VARCHAR(50) DEFAULT 'default', -- 'default', 'compact', 'detailed', 'custom'
  
  -- Theme Configuration
  theme_mode VARCHAR(20) DEFAULT 'light', -- 'light', 'dark', 'auto'
  custom_theme JSONB, -- {primary, secondary, accent, background, etc}
  
  -- Widget Preferences
  enabled_widgets JSONB DEFAULT '[]', -- Array de IDs de widgets habilitados
  widget_settings JSONB DEFAULT '{}', -- Configurações específicas por widget
  
  -- Display Preferences
  compact_mode BOOLEAN DEFAULT false,
  show_sidebar BOOLEAN DEFAULT true,
  show_metrics BOOLEAN DEFAULT true,
  
  -- Dashboard Tabs
  active_tabs JSONB DEFAULT '["pipeline", "analytics", "automations", "capture"]',
  default_tab VARCHAR(50) DEFAULT 'pipeline',
  
  -- Quick Filters
  saved_filters JSONB DEFAULT '[]', -- Filtros salvos: [{name, filters}]
  default_filter VARCHAR(100),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Constraint: um registro por usuário
  UNIQUE(user_id)
);

-- Índices
CREATE INDEX idx_dashboard_preferences_user_id ON public.dashboard_preferences(user_id);

-- ============================================================================
-- 2. TABELA DE TEMPLATES DE LAYOUT
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.dashboard_layout_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Template Configuration
  layout_config JSONB NOT NULL,
  enabled_widgets JSONB NOT NULL,
  theme_config JSONB,
  
  -- Metadata
  is_public BOOLEAN DEFAULT false, -- Se pode ser usado por outros usuários
  is_system BOOLEAN DEFAULT false, -- Template do sistema (não pode ser deletado)
  category VARCHAR(50), -- 'sales', 'management', 'analytics', 'minimal'
  
  -- Usage Stats
  usage_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices
CREATE INDEX idx_dashboard_templates_user_id ON public.dashboard_layout_templates(user_id);
CREATE INDEX idx_dashboard_templates_public ON public.dashboard_layout_templates(is_public) WHERE is_public = true;
CREATE INDEX idx_dashboard_templates_category ON public.dashboard_layout_templates(category);

-- ============================================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Dashboard Preferences
ALTER TABLE public.dashboard_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own preferences"
  ON public.dashboard_preferences FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own preferences"
  ON public.dashboard_preferences FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own preferences"
  ON public.dashboard_preferences FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own preferences"
  ON public.dashboard_preferences FOR DELETE
  USING (user_id = auth.uid());

-- Dashboard Layout Templates
ALTER TABLE public.dashboard_layout_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own templates and public ones"
  ON public.dashboard_layout_templates FOR SELECT
  USING (user_id = auth.uid() OR is_public = true);

CREATE POLICY "Users can create templates"
  ON public.dashboard_layout_templates FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own templates"
  ON public.dashboard_layout_templates FOR UPDATE
  USING (user_id = auth.uid() AND is_system = false);

CREATE POLICY "Users can delete their own non-system templates"
  ON public.dashboard_layout_templates FOR DELETE
  USING (user_id = auth.uid() AND is_system = false);

-- ============================================================================
-- 4. TRIGGERS
-- ============================================================================

CREATE TRIGGER update_dashboard_preferences_updated_at
  BEFORE UPDATE ON public.dashboard_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dashboard_templates_updated_at
  BEFORE UPDATE ON public.dashboard_layout_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. FUNCTIONS
-- ============================================================================

-- Function: Obter ou criar preferências do usuário
CREATE OR REPLACE FUNCTION get_or_create_dashboard_preferences(user_id_param UUID)
RETURNS public.dashboard_preferences AS $$
DECLARE
  preferences_record public.dashboard_preferences;
BEGIN
  -- Tentar buscar preferências existentes
  SELECT * INTO preferences_record
  FROM public.dashboard_preferences
  WHERE user_id = user_id_param;
  
  -- Se não existir, criar com valores padrão
  IF NOT FOUND THEN
    INSERT INTO public.dashboard_preferences (
      user_id,
      layout_config,
      enabled_widgets,
      theme_mode
    ) VALUES (
      user_id_param,
      '[
        {"id": "total-leads", "type": "metric", "position": {"x": 0, "y": 0}, "size": {"w": 3, "h": 1}},
        {"id": "conversion-rate", "type": "metric", "position": {"x": 3, "y": 0}, "size": {"w": 3, "h": 1}},
        {"id": "total-value", "type": "metric", "position": {"x": 6, "y": 0}, "size": {"w": 3, "h": 1}},
        {"id": "average-ticket", "type": "metric", "position": {"x": 9, "y": 0}, "size": {"w": 3, "h": 1}},
        {"id": "funnel-chart", "type": "chart", "position": {"x": 0, "y": 1}, "size": {"w": 6, "h": 2}},
        {"id": "conversion-chart", "type": "chart", "position": {"x": 6, "y": 1}, "size": {"w": 6, "h": 2}}
      ]'::jsonb,
      '["total-leads", "conversion-rate", "total-value", "average-ticket", "funnel-chart", "conversion-chart"]'::jsonb,
      'light'
    )
    RETURNING * INTO preferences_record;
  END IF;
  
  RETURN preferences_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Aplicar template de layout
CREATE OR REPLACE FUNCTION apply_layout_template(
  user_id_param UUID,
  template_id_param UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  template_record public.dashboard_layout_templates;
BEGIN
  -- Buscar template
  SELECT * INTO template_record
  FROM public.dashboard_layout_templates
  WHERE id = template_id_param
    AND (user_id = user_id_param OR is_public = true);
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template not found or not accessible';
  END IF;
  
  -- Atualizar preferências do usuário
  UPDATE public.dashboard_preferences
  SET 
    layout_config = template_record.layout_config,
    enabled_widgets = template_record.enabled_widgets,
    custom_theme = template_record.theme_config,
    updated_at = now()
  WHERE user_id = user_id_param;
  
  -- Se preferências não existem, criar
  IF NOT FOUND THEN
    INSERT INTO public.dashboard_preferences (
      user_id,
      layout_config,
      enabled_widgets,
      custom_theme
    ) VALUES (
      user_id_param,
      template_record.layout_config,
      template_record.enabled_widgets,
      template_record.theme_config
    );
  END IF;
  
  -- Incrementar contador de uso do template
  UPDATE public.dashboard_layout_templates
  SET usage_count = usage_count + 1
  WHERE id = template_id_param;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. TEMPLATES DO SISTEMA (Padrão)
-- ============================================================================

-- Template: Default (Completo)
INSERT INTO public.dashboard_layout_templates (
  name,
  description,
  layout_config,
  enabled_widgets,
  is_system,
  is_public,
  category
) VALUES (
  'Padrão Completo',
  'Layout padrão com todas as métricas e gráficos principais',
  '[
    {"id": "total-leads", "type": "metric", "position": {"x": 0, "y": 0}, "size": {"w": 3, "h": 1}},
    {"id": "conversion-rate", "type": "metric", "position": {"x": 3, "y": 0}, "size": {"w": 3, "h": 1}},
    {"id": "total-value", "type": "metric", "position": {"x": 6, "y": 0}, "size": {"w": 3, "h": 1}},
    {"id": "average-ticket", "type": "metric", "position": {"x": 9, "y": 0}, "size": {"w": 3, "h": 1}},
    {"id": "funnel-chart", "type": "chart", "position": {"x": 0, "y": 1}, "size": {"w": 6, "h": 2}},
    {"id": "conversion-chart", "type": "chart", "position": {"x": 6, "y": 1}, "size": {"w": 6, "h": 2}},
    {"id": "sources-chart", "type": "chart", "position": {"x": 0, "y": 3}, "size": {"w": 6, "h": 2}},
    {"id": "score-distribution", "type": "chart", "position": {"x": 6, "y": 3}, "size": {"w": 6, "h": 2}},
    {"id": "timeline-chart", "type": "chart", "position": {"x": 0, "y": 5}, "size": {"w": 12, "h": 2}},
    {"id": "stage-performance", "type": "list", "position": {"x": 0, "y": 7}, "size": {"w": 12, "h": 2}}
  ]'::jsonb,
  '["total-leads", "conversion-rate", "total-value", "average-ticket", "funnel-chart", "conversion-chart", "sources-chart", "score-distribution", "timeline-chart", "stage-performance"]'::jsonb,
  true,
  true,
  'analytics'
) ON CONFLICT DO NOTHING;

-- Template: Vendedor Focado
INSERT INTO public.dashboard_layout_templates (
  name,
  description,
  layout_config,
  enabled_widgets,
  is_system,
  is_public,
  category
) VALUES (
  'Vendedor Focado',
  'Layout otimizado para vendedores com métricas essenciais',
  '[
    {"id": "total-leads", "type": "metric", "position": {"x": 0, "y": 0}, "size": {"w": 4, "h": 1}},
    {"id": "conversion-rate", "type": "metric", "position": {"x": 4, "y": 0}, "size": {"w": 4, "h": 1}},
    {"id": "average-ticket", "type": "metric", "position": {"x": 8, "y": 0}, "size": {"w": 4, "h": 1}},
    {"id": "funnel-chart", "type": "chart", "position": {"x": 0, "y": 1}, "size": {"w": 12, "h": 3}}
  ]'::jsonb,
  '["total-leads", "conversion-rate", "average-ticket", "funnel-chart"]'::jsonb,
  true,
  true,
  'sales'
) ON CONFLICT DO NOTHING;

-- Template: Gestor Estratégico
INSERT INTO public.dashboard_layout_templates (
  name,
  description,
  layout_config,
  enabled_widgets,
  is_system,
  is_public,
  category
) VALUES (
  'Gestor Estratégico',
  'Visão gerencial com análises e tendências',
  '[
    {"id": "conversion-rate", "type": "metric", "position": {"x": 0, "y": 0}, "size": {"w": 6, "h": 1}},
    {"id": "total-value", "type": "metric", "position": {"x": 6, "y": 0}, "size": {"w": 6, "h": 1}},
    {"id": "conversion-chart", "type": "chart", "position": {"x": 0, "y": 1}, "size": {"w": 6, "h": 2}},
    {"id": "timeline-chart", "type": "chart", "position": {"x": 6, "y": 1}, "size": {"w": 6, "h": 2}},
    {"id": "stage-performance", "type": "list", "position": {"x": 0, "y": 3}, "size": {"w": 12, "h": 2}}
  ]'::jsonb,
  '["conversion-rate", "total-value", "conversion-chart", "timeline-chart", "stage-performance"]'::jsonb,
  true,
  true,
  'management'
) ON CONFLICT DO NOTHING;

-- Template: Minimalista
INSERT INTO public.dashboard_layout_templates (
  name,
  description,
  layout_config,
  enabled_widgets,
  is_system,
  is_public,
  category
) VALUES (
  'Minimalista',
  'Layout limpo com apenas o essencial',
  '[
    {"id": "total-leads", "type": "metric", "position": {"x": 0, "y": 0}, "size": {"w": 6, "h": 1}},
    {"id": "conversion-rate", "type": "metric", "position": {"x": 6, "y": 0}, "size": {"w": 6, "h": 1}},
    {"id": "funnel-chart", "type": "chart", "position": {"x": 0, "y": 1}, "size": {"w": 12, "h": 2}}
  ]'::jsonb,
  '["total-leads", "conversion-rate", "funnel-chart"]'::jsonb,
  true,
  true,
  'minimal'
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE public.dashboard_preferences IS 'Preferências personalizadas de dashboard por usuário';
COMMENT ON TABLE public.dashboard_layout_templates IS 'Templates de layout pré-configurados';

COMMENT ON COLUMN public.dashboard_preferences.layout_config IS 'Configuração de posição e tamanho dos widgets';
COMMENT ON COLUMN public.dashboard_preferences.enabled_widgets IS 'Lista de widgets habilitados';
COMMENT ON COLUMN public.dashboard_preferences.theme_mode IS 'Modo de tema: light, dark ou auto';
COMMENT ON COLUMN public.dashboard_preferences.custom_theme IS 'Cores customizadas do tema';
