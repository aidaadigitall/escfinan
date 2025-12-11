-- ====================================
-- CRM - SISTEMA DE FUNIL DE VENDAS
-- ====================================
-- Este script cria as tabelas do CRM:
-- 1. pipeline_stages - Estágios do funil
-- 2. leads - Leads/oportunidades
-- 3. lead_activities - Atividades/histórico
-- ====================================

-- Create pipeline_stages table
CREATE TABLE IF NOT EXISTS public.pipeline_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  probability_default DECIMAL(5, 2) DEFAULT 0, -- Probabilidade de fechamento (0-100)
  color VARCHAR(20) DEFAULT '#3B82F6',
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false, -- Estágios padrão do sistema
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Create leads table
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_user_id UUID REFERENCES auth.users(id), -- Dono do sistema (multi-tenant)
  
  -- Informações básicas
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  company VARCHAR(255),
  position VARCHAR(100),
  
  -- Origem do lead
  source VARCHAR(50) DEFAULT 'manual', -- manual, website, indication, cold_call, social_media, event
  source_details TEXT,
  
  -- Status e funil
  pipeline_stage_id UUID REFERENCES public.pipeline_stages(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'new', -- new, contacted, qualified, proposal, negotiation, won, lost
  
  -- Qualificação e valor
  score INTEGER DEFAULT 0, -- 0-100, pontuação de qualificação
  expected_value DECIMAL(15, 2),
  probability DECIMAL(5, 2), -- 0-100, probabilidade de fechamento
  expected_close_date DATE,
  
  -- Motivo de perda
  lost_reason TEXT,
  lost_date TIMESTAMP WITH TIME ZONE,
  
  -- Conversão
  converted_to_client BOOLEAN DEFAULT false,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  converted_at TIMESTAMP WITH TIME ZONE,
  
  -- Responsável
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Datas e notas
  first_contact_date TIMESTAMP WITH TIME ZONE,
  last_contact_date TIMESTAMP WITH TIME ZONE,
  last_activity_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  
  -- Auditoria
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create lead_activities table
CREATE TABLE IF NOT EXISTS public.lead_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Tipo de atividade
  type VARCHAR(50) NOT NULL, -- call, email, meeting, whatsapp, note, task, proposal_sent
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Resultado
  outcome VARCHAR(50), -- positive, negative, neutral, scheduled_followup
  outcome_notes TEXT,
  
  -- Agendamento
  scheduled_for TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  is_completed BOOLEAN DEFAULT false,
  
  -- Metadados
  duration_minutes INTEGER,
  attachments JSONB, -- Array de URLs de anexos
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

-- ====================================
-- RLS POLICIES - pipeline_stages
-- ====================================

CREATE POLICY "Users can view their own pipeline stages"
ON public.pipeline_stages
FOR SELECT
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.user_permissions
    WHERE user_id = auth.uid() AND can_view_crm = true
  )
);

CREATE POLICY "Users can insert their own pipeline stages"
ON public.pipeline_stages
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pipeline stages"
ON public.pipeline_stages
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pipeline stages"
ON public.pipeline_stages
FOR DELETE
USING (auth.uid() = user_id AND is_system = false);

-- ====================================
-- RLS POLICIES - leads
-- ====================================

CREATE POLICY "Users can view their own leads or assigned leads"
ON public.leads
FOR SELECT
USING (
  auth.uid() = user_id OR
  auth.uid() = assigned_to OR
  auth.uid() = owner_user_id OR
  EXISTS (
    SELECT 1 FROM public.user_permissions
    WHERE user_id = auth.uid() AND can_view_crm = true
  )
);

CREATE POLICY "Users can insert their own leads"
ON public.leads
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leads or assigned leads"
ON public.leads
FOR UPDATE
USING (
  auth.uid() = user_id OR 
  auth.uid() = assigned_to OR
  EXISTS (
    SELECT 1 FROM public.user_permissions
    WHERE user_id = auth.uid() AND can_manage_crm = true
  )
);

CREATE POLICY "Users can delete their own leads"
ON public.leads
FOR DELETE
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.user_permissions
    WHERE user_id = auth.uid() AND can_manage_crm = true
  )
);

-- ====================================
-- RLS POLICIES - lead_activities
-- ====================================

CREATE POLICY "Users can view activities of their leads"
ON public.lead_activities
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.leads
    WHERE leads.id = lead_activities.lead_id
    AND (
      leads.user_id = auth.uid() OR
      leads.assigned_to = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.user_permissions
        WHERE user_id = auth.uid() AND can_view_crm = true
      )
    )
  )
);

CREATE POLICY "Users can insert activities for their leads"
ON public.lead_activities
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.leads
    WHERE leads.id = lead_activities.lead_id
    AND (leads.user_id = auth.uid() OR leads.assigned_to = auth.uid())
  )
);

CREATE POLICY "Users can update their own activities"
ON public.lead_activities
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activities"
ON public.lead_activities
FOR DELETE
USING (auth.uid() = user_id);

-- ====================================
-- TRIGGERS
-- ====================================

CREATE TRIGGER update_pipeline_stages_updated_at
BEFORE UPDATE ON public.pipeline_stages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lead_activities_updated_at
BEFORE UPDATE ON public.lead_activities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ====================================
-- INDICES PARA PERFORMANCE
-- ====================================

CREATE INDEX idx_pipeline_stages_user_id ON public.pipeline_stages(user_id);
CREATE INDEX idx_pipeline_stages_order ON public.pipeline_stages("order");

CREATE INDEX idx_leads_user_id ON public.leads(user_id);
CREATE INDEX idx_leads_assigned_to ON public.leads(assigned_to);
CREATE INDEX idx_leads_pipeline_stage_id ON public.leads(pipeline_stage_id);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_expected_close_date ON public.leads(expected_close_date);
CREATE INDEX idx_leads_client_id ON public.leads(client_id);

CREATE INDEX idx_lead_activities_lead_id ON public.lead_activities(lead_id);
CREATE INDEX idx_lead_activities_user_id ON public.lead_activities(user_id);
CREATE INDEX idx_lead_activities_scheduled_for ON public.lead_activities(scheduled_for);
CREATE INDEX idx_lead_activities_type ON public.lead_activities(type);

-- ====================================
-- DADOS INICIAIS - ESTÁGIOS PADRÃO
-- ====================================

-- Função para inserir estágios padrão para novos usuários
CREATE OR REPLACE FUNCTION create_default_pipeline_stages()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir estágios padrão para o novo usuário
  INSERT INTO public.pipeline_stages (user_id, name, description, "order", probability_default, color, is_system)
  VALUES
    (NEW.id, 'Novo Lead', 'Leads recém-capturados que ainda não foram contatados', 1, 10, '#6B7280', true),
    (NEW.id, 'Contato Inicial', 'Primeiro contato realizado, aguardando qualificação', 2, 20, '#3B82F6', true),
    (NEW.id, 'Qualificado', 'Lead qualificado com potencial de compra', 3, 40, '#8B5CF6', true),
    (NEW.id, 'Proposta Enviada', 'Proposta comercial enviada ao lead', 4, 60, '#F59E0B', true),
    (NEW.id, 'Negociação', 'Em negociação de valores e condições', 5, 80, '#EF4444', true),
    (NEW.id, 'Ganho', 'Negócio fechado com sucesso', 6, 100, '#10B981', true),
    (NEW.id, 'Perdido', 'Oportunidade perdida', 7, 0, '#DC2626', true);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar estágios padrão automaticamente
CREATE TRIGGER create_default_pipeline_stages_trigger
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_default_pipeline_stages();

-- Inserir estágios padrão para usuários existentes (executar uma vez)
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT id FROM auth.users 
    WHERE NOT EXISTS (
      SELECT 1 FROM public.pipeline_stages WHERE user_id = auth.users.id
    )
  LOOP
    INSERT INTO public.pipeline_stages (user_id, name, description, "order", probability_default, color, is_system)
    VALUES
      (user_record.id, 'Novo Lead', 'Leads recém-capturados que ainda não foram contatados', 1, 10, '#6B7280', true),
      (user_record.id, 'Contato Inicial', 'Primeiro contato realizado, aguardando qualificação', 2, 20, '#3B82F6', true),
      (user_record.id, 'Qualificado', 'Lead qualificado com potencial de compra', 3, 40, '#8B5CF6', true),
      (user_record.id, 'Proposta Enviada', 'Proposta comercial enviada ao lead', 4, 60, '#F59E0B', true),
      (user_record.id, 'Negociação', 'Em negociação de valores e condições', 5, 80, '#EF4444', true),
      (user_record.id, 'Ganho', 'Negócio fechado com sucesso', 6, 100, '#10B981', true),
      (user_record.id, 'Perdido', 'Oportunidade perdida', 7, 0, '#DC2626', true);
  END LOOP;
END $$;

-- ====================================
-- COMENTÁRIOS
-- ====================================

COMMENT ON TABLE public.pipeline_stages IS 'Estágios personalizáveis do funil de vendas';
COMMENT ON TABLE public.leads IS 'Leads e oportunidades de venda';
COMMENT ON TABLE public.lead_activities IS 'Histórico de atividades e interações com leads';
