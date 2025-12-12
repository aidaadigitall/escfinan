-- =============================================================================
-- EXECUTAR NO SQL EDITOR DO SUPABASE
-- Corrige o erro: "Could not find the table 'public.dashboard_preferences'"
-- =============================================================================

-- 1. Garantir que a função update_updated_at_column existe
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Criar tabela dashboard_preferences
CREATE TABLE IF NOT EXISTS public.dashboard_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Layout Configuration
  layout_config JSONB DEFAULT '[]',
  active_layout VARCHAR(50) DEFAULT 'default',
  
  -- Theme Configuration
  theme_mode VARCHAR(20) DEFAULT 'light',
  custom_theme JSONB,
  
  -- Widget Preferences
  enabled_widgets JSONB DEFAULT '[]',
  widget_settings JSONB DEFAULT '{}',
  
  -- Display Preferences
  compact_mode BOOLEAN DEFAULT false,
  show_sidebar BOOLEAN DEFAULT true,
  show_metrics BOOLEAN DEFAULT true,
  
  -- Dashboard Tabs
  active_tabs JSONB DEFAULT '["pipeline", "analytics", "automations", "capture"]',
  default_tab VARCHAR(50) DEFAULT 'pipeline',
  
  -- Quick Filters
  saved_filters JSONB DEFAULT '[]',
  default_filter VARCHAR(100),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(user_id)
);

-- 3. Criar índice
CREATE INDEX IF NOT EXISTS idx_dashboard_preferences_user_id ON public.dashboard_preferences(user_id);

-- 4. Habilitar RLS
ALTER TABLE public.dashboard_preferences ENABLE ROW LEVEL SECURITY;

-- 5. Criar políticas de segurança (DROP IF EXISTS para evitar erro de duplicata)
DROP POLICY IF EXISTS "Users can view their own preferences" ON public.dashboard_preferences;
CREATE POLICY "Users can view their own preferences"
  ON public.dashboard_preferences FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own preferences" ON public.dashboard_preferences;
CREATE POLICY "Users can insert their own preferences"
  ON public.dashboard_preferences FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own preferences" ON public.dashboard_preferences;
CREATE POLICY "Users can update their own preferences"
  ON public.dashboard_preferences FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own preferences" ON public.dashboard_preferences;
CREATE POLICY "Users can delete their own preferences"
  ON public.dashboard_preferences FOR DELETE
  USING (user_id = auth.uid());

-- 6. Criar trigger para updated_at
DROP TRIGGER IF EXISTS update_dashboard_preferences_updated_at ON public.dashboard_preferences;
CREATE TRIGGER update_dashboard_preferences_updated_at
  BEFORE UPDATE ON public.dashboard_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Criar tabela de templates (opcional, mas necessária para funcionalidade completa)
CREATE TABLE IF NOT EXISTS public.dashboard_layout_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  layout_config JSONB NOT NULL,
  enabled_widgets JSONB NOT NULL,
  theme_config JSONB,
  
  is_public BOOLEAN DEFAULT false,
  is_system BOOLEAN DEFAULT false,
  category VARCHAR(50),
  
  usage_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 8. Índices para templates
CREATE INDEX IF NOT EXISTS idx_dashboard_templates_user_id ON public.dashboard_layout_templates(user_id);

-- 9. RLS para templates
ALTER TABLE public.dashboard_layout_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own templates and public ones" ON public.dashboard_layout_templates;
CREATE POLICY "Users can view their own templates and public ones"
  ON public.dashboard_layout_templates FOR SELECT
  USING (user_id = auth.uid() OR is_public = true);

DROP POLICY IF EXISTS "Users can create templates" ON public.dashboard_layout_templates;
CREATE POLICY "Users can create templates"
  ON public.dashboard_layout_templates FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own templates" ON public.dashboard_layout_templates;
CREATE POLICY "Users can update their own templates"
  ON public.dashboard_layout_templates FOR UPDATE
  USING (user_id = auth.uid() AND is_system = false);

DROP POLICY IF EXISTS "Users can delete their own non-system templates" ON public.dashboard_layout_templates;
CREATE POLICY "Users can delete their own non-system templates"
  ON public.dashboard_layout_templates FOR DELETE
  USING (user_id = auth.uid() AND is_system = false);

-- 10. Trigger para templates
DROP TRIGGER IF EXISTS update_dashboard_templates_updated_at ON public.dashboard_layout_templates;
CREATE TRIGGER update_dashboard_templates_updated_at
  BEFORE UPDATE ON public.dashboard_layout_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 11. Inserir templates do sistema
INSERT INTO public.dashboard_layout_templates (
  name, description, layout_config, enabled_widgets, is_system, is_public, category
) VALUES (
  'Padrão Completo',
  'Layout padrão com todas as métricas e gráficos principais',
  '[
    {"id": "total-leads", "type": "metric"},
    {"id": "conversion-rate", "type": "metric"},
    {"id": "total-value", "type": "metric"},
    {"id": "average-ticket", "type": "metric"},
    {"id": "funnel-chart", "type": "chart"},
    {"id": "conversion-chart", "type": "chart"}
  ]'::jsonb,
  '["total-leads", "conversion-rate", "total-value", "average-ticket", "funnel-chart", "conversion-chart"]'::jsonb,
  true, true, 'analytics'
) ON CONFLICT DO NOTHING;

-- =============================================================================
-- FIM - Após executar, teste novamente a funcionalidade de widgets
-- =============================================================================
