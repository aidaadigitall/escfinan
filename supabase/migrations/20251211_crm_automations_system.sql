-- Migration: CRM Automations and Lead Capture System
-- Criado em: 2025-12-11
-- Descrição: Sistema completo de automações de CRM e captura de leads

-- ============================================================================
-- 1. TABELA DE REGRAS DE AUTOMAÇÃO
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.lead_automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  
  -- Trigger (quando executar)
  trigger_type VARCHAR(50) NOT NULL, -- 'stage_change', 'time_in_stage', 'score_change', 'new_lead', 'activity_created', 'no_activity'
  trigger_config JSONB, -- Configuração específica do trigger
  
  -- Conditions (condições para executar)
  conditions JSONB, -- Array de condições: [{field, operator, value}]
  
  -- Actions (o que fazer)
  actions JSONB NOT NULL, -- Array de ações: [{type, config}]
  -- Tipos de ação: 'change_stage', 'assign_user', 'send_email', 'create_task', 'update_score', 'send_notification', 'webhook'
  
  -- Controle de execução
  max_executions INTEGER, -- Máximo de vezes que pode executar por lead (null = ilimitado)
  cooldown_hours INTEGER, -- Tempo mínimo entre execuções para o mesmo lead
  
  -- Ordem de execução
  priority INTEGER DEFAULT 0,
  
  -- Estatísticas
  execution_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_lead_automation_rules_user_id ON public.lead_automation_rules(user_id);
CREATE INDEX idx_lead_automation_rules_trigger_type ON public.lead_automation_rules(trigger_type) WHERE is_active = true;
CREATE INDEX idx_lead_automation_rules_priority ON public.lead_automation_rules(priority DESC) WHERE is_active = true;

-- ============================================================================
-- 2. TABELA DE LOG DE EXECUÇÕES DE AUTOMAÇÃO
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.lead_automation_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES public.lead_automation_rules(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  
  -- Status da execução
  status VARCHAR(20) NOT NULL, -- 'success', 'failed', 'skipped'
  error_message TEXT,
  
  -- Dados da execução
  trigger_data JSONB, -- Dados que dispararam a automação
  actions_executed JSONB, -- Ações que foram executadas
  
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices
CREATE INDEX idx_lead_automation_executions_rule_id ON public.lead_automation_executions(rule_id);
CREATE INDEX idx_lead_automation_executions_lead_id ON public.lead_automation_executions(lead_id);
CREATE INDEX idx_lead_automation_executions_executed_at ON public.lead_automation_executions(executed_at DESC);

-- ============================================================================
-- 3. TABELA DE FORMULÁRIOS DE CAPTURA DE LEADS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.lead_capture_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  slug VARCHAR(255) UNIQUE NOT NULL, -- URL amigável: /captura/slug
  
  -- Configuração do formulário
  fields JSONB NOT NULL DEFAULT '[]', -- Array de campos: [{name, type, label, required, options}]
  -- Tipos: 'text', 'email', 'phone', 'textarea', 'select', 'checkbox', 'radio'
  
  -- Configurações de destino
  default_source VARCHAR(100), -- Fonte padrão para leads capturados
  default_pipeline_stage_id UUID REFERENCES public.pipeline_stages(id),
  assign_to_user_id UUID REFERENCES auth.users(id), -- Usuário para atribuir automaticamente
  
  -- Automação após captura
  automation_rule_id UUID REFERENCES public.lead_automation_rules(id), -- Automação para executar após captura
  
  -- Personalização
  title TEXT,
  subtitle TEXT,
  success_message TEXT,
  redirect_url TEXT,
  button_text VARCHAR(100) DEFAULT 'Enviar',
  
  -- Configurações visuais
  theme_color VARCHAR(7) DEFAULT '#6366f1',
  logo_url TEXT,
  background_image_url TEXT,
  custom_css TEXT,
  
  -- Controle
  is_active BOOLEAN DEFAULT true,
  require_double_optin BOOLEAN DEFAULT false,
  
  -- Estatísticas
  view_count INTEGER DEFAULT 0,
  submission_count INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices
CREATE INDEX idx_lead_capture_forms_user_id ON public.lead_capture_forms(user_id);
CREATE INDEX idx_lead_capture_forms_slug ON public.lead_capture_forms(slug) WHERE is_active = true;
CREATE INDEX idx_lead_capture_forms_active ON public.lead_capture_forms(is_active);

-- ============================================================================
-- 4. TABELA DE SUBMISSÕES DE FORMULÁRIOS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.lead_capture_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES public.lead_capture_forms(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL, -- Pode não ter lead se falhar
  
  -- Dados submetidos
  form_data JSONB NOT NULL,
  
  -- Informações de rastreamento
  ip_address VARCHAR(45),
  user_agent TEXT,
  referrer TEXT,
  utm_source VARCHAR(255),
  utm_medium VARCHAR(255),
  utm_campaign VARCHAR(255),
  utm_term VARCHAR(255),
  utm_content VARCHAR(255),
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processed', 'failed', 'spam'
  error_message TEXT,
  
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Índices
CREATE INDEX idx_lead_capture_submissions_form_id ON public.lead_capture_submissions(form_id);
CREATE INDEX idx_lead_capture_submissions_lead_id ON public.lead_capture_submissions(lead_id);
CREATE INDEX idx_lead_capture_submissions_submitted_at ON public.lead_capture_submissions(submitted_at DESC);

-- ============================================================================
-- 5. TABELA DE PONTUAÇÃO DE LEADS (LEAD SCORING)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.lead_scoring_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  
  -- Critério de pontuação
  criteria_type VARCHAR(50) NOT NULL, -- 'field_value', 'activity', 'behavior', 'demographic'
  field_name VARCHAR(100), -- Campo do lead ou atividade
  operator VARCHAR(20), -- 'equals', 'contains', 'greater_than', 'less_than', etc.
  value TEXT, -- Valor para comparar
  
  -- Pontuação
  points INTEGER NOT NULL, -- Positivo ou negativo
  
  -- Validade da pontuação
  expires_after_days INTEGER, -- Após quantos dias os pontos expiram (null = nunca)
  
  priority INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices
CREATE INDEX idx_lead_scoring_rules_user_id ON public.lead_scoring_rules(user_id);
CREATE INDEX idx_lead_scoring_rules_active ON public.lead_scoring_rules(is_active);

-- ============================================================================
-- 6. TABELA DE HISTÓRICO DE PONTUAÇÃO
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.lead_score_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES public.lead_scoring_rules(id) ON DELETE SET NULL,
  
  points_change INTEGER NOT NULL,
  previous_score INTEGER NOT NULL,
  new_score INTEGER NOT NULL,
  
  reason TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices
CREATE INDEX idx_lead_score_history_lead_id ON public.lead_score_history(lead_id);
CREATE INDEX idx_lead_score_history_created_at ON public.lead_score_history(created_at DESC);

-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Lead Automation Rules
ALTER TABLE public.lead_automation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own automation rules"
  ON public.lead_automation_rules FOR SELECT
  USING (user_id = auth.uid() OR owner_user_id = auth.uid());

CREATE POLICY "Users can create automation rules"
  ON public.lead_automation_rules FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own automation rules"
  ON public.lead_automation_rules FOR UPDATE
  USING (user_id = auth.uid() OR owner_user_id = auth.uid());

CREATE POLICY "Users can delete their own automation rules"
  ON public.lead_automation_rules FOR DELETE
  USING (user_id = auth.uid() OR owner_user_id = auth.uid());

-- Lead Automation Executions
ALTER TABLE public.lead_automation_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their automation executions"
  ON public.lead_automation_executions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.lead_automation_rules r
    WHERE r.id = rule_id AND (r.user_id = auth.uid() OR r.owner_user_id = auth.uid())
  ));

-- Lead Capture Forms
ALTER TABLE public.lead_capture_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own capture forms"
  ON public.lead_capture_forms FOR SELECT
  USING (user_id = auth.uid() OR owner_user_id = auth.uid());

CREATE POLICY "Public can view active forms by slug"
  ON public.lead_capture_forms FOR SELECT
  USING (is_active = true);

CREATE POLICY "Users can create capture forms"
  ON public.lead_capture_forms FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own capture forms"
  ON public.lead_capture_forms FOR UPDATE
  USING (user_id = auth.uid() OR owner_user_id = auth.uid());

CREATE POLICY "Users can delete their own capture forms"
  ON public.lead_capture_forms FOR DELETE
  USING (user_id = auth.uid() OR owner_user_id = auth.uid());

-- Lead Capture Submissions
ALTER TABLE public.lead_capture_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view submissions from their forms"
  ON public.lead_capture_submissions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.lead_capture_forms f
    WHERE f.id = form_id AND (f.user_id = auth.uid() OR f.owner_user_id = auth.uid())
  ));

CREATE POLICY "Anyone can submit to active forms"
  ON public.lead_capture_submissions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.lead_capture_forms f
    WHERE f.id = form_id AND f.is_active = true
  ));

-- Lead Scoring Rules
ALTER TABLE public.lead_scoring_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their scoring rules"
  ON public.lead_scoring_rules FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create scoring rules"
  ON public.lead_scoring_rules FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their scoring rules"
  ON public.lead_scoring_rules FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their scoring rules"
  ON public.lead_scoring_rules FOR DELETE
  USING (user_id = auth.uid());

-- Lead Score History
ALTER TABLE public.lead_score_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view score history of their leads"
  ON public.lead_score_history FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.leads l
    WHERE l.id = lead_id AND (l.user_id = auth.uid() OR l.owner_user_id = auth.uid())
  ));

-- ============================================================================
-- 8. TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA
-- ============================================================================

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_lead_automation_rules_updated_at
  BEFORE UPDATE ON public.lead_automation_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lead_capture_forms_updated_at
  BEFORE UPDATE ON public.lead_capture_forms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lead_scoring_rules_updated_at
  BEFORE UPDATE ON public.lead_scoring_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 9. FUNCTION: Calcular score do lead
-- ============================================================================
CREATE OR REPLACE FUNCTION calculate_lead_score(lead_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
  total_score INTEGER := 0;
BEGIN
  -- Soma todos os pontos válidos (não expirados) do histórico
  SELECT COALESCE(SUM(points_change), 0) INTO total_score
  FROM public.lead_score_history
  WHERE lead_id = lead_id_param
    AND (expires_at IS NULL OR expires_at > now());
  
  RETURN total_score;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 10. FUNCTION: Processar submissão de formulário
-- ============================================================================
CREATE OR REPLACE FUNCTION process_lead_capture_submission(submission_id_param UUID)
RETURNS UUID AS $$
DECLARE
  submission_record RECORD;
  form_record RECORD;
  new_lead_id UUID;
  lead_data JSONB;
BEGIN
  -- Buscar submissão
  SELECT * INTO submission_record
  FROM public.lead_capture_submissions
  WHERE id = submission_id_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Submission not found';
  END IF;
  
  -- Buscar formulário
  SELECT * INTO form_record
  FROM public.lead_capture_forms
  WHERE id = submission_record.form_id;
  
  -- Extrair dados do lead do form_data
  lead_data := submission_record.form_data;
  
  -- Criar novo lead
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
    assigned_to,
    notes,
    status
  ) VALUES (
    form_record.user_id,
    form_record.owner_user_id,
    lead_data->>'name',
    lead_data->>'email',
    lead_data->>'phone',
    lead_data->>'company',
    COALESCE(form_record.default_source, 'website'),
    submission_record.utm_campaign,
    form_record.default_pipeline_stage_id,
    form_record.assign_to_user_id,
    lead_data->>'message',
    'new'
  )
  RETURNING id INTO new_lead_id;
  
  -- Atualizar submissão com lead_id
  UPDATE public.lead_capture_submissions
  SET lead_id = new_lead_id,
      status = 'processed',
      processed_at = now()
  WHERE id = submission_id_param;
  
  -- Atualizar contadores do formulário
  UPDATE public.lead_capture_forms
  SET submission_count = submission_count + 1,
      conversion_rate = (submission_count::DECIMAL / NULLIF(view_count, 0)) * 100
  WHERE id = form_record.id;
  
  RETURN new_lead_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 11. DADOS INICIAIS - REGRAS DE AUTOMAÇÃO PADRÃO
-- ============================================================================

-- Inserir regras de automação de exemplo (apenas se não existirem)
-- Nota: Estas serão templates que o usuário pode ativar/personalizar

COMMENT ON TABLE public.lead_automation_rules IS 'Regras de automação para leads - gatilhos, condições e ações';
COMMENT ON TABLE public.lead_automation_executions IS 'Log de execuções de automações';
COMMENT ON TABLE public.lead_capture_forms IS 'Formulários públicos de captura de leads';
COMMENT ON TABLE public.lead_capture_submissions IS 'Submissões de formulários de captura';
COMMENT ON TABLE public.lead_scoring_rules IS 'Regras de pontuação de leads';
COMMENT ON TABLE public.lead_score_history IS 'Histórico de mudanças na pontuação de leads';
