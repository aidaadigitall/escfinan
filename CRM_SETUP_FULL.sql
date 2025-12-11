-- ==============================================================================
-- SCRIPT COMPLETO DE CONFIGURAÇÃO DO CRM
-- Execute este script no Editor SQL do Supabase para criar todas as tabelas necessárias
-- ==============================================================================

BEGIN;

-- 1. CRIAR TABELA DE ORIGENS DE LEADS (lead_sources)
CREATE TABLE IF NOT EXISTS public.lead_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_sources ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para lead_sources
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lead_sources' AND policyname = 'Users can view own lead sources') THEN
    CREATE POLICY "Users can view own lead sources" ON public.lead_sources FOR SELECT USING (user_id = auth.uid());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lead_sources' AND policyname = 'Users can create own lead sources') THEN
    CREATE POLICY "Users can create own lead sources" ON public.lead_sources FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lead_sources' AND policyname = 'Users can update own lead sources') THEN
    CREATE POLICY "Users can update own lead sources" ON public.lead_sources FOR UPDATE USING (user_id = auth.uid());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lead_sources' AND policyname = 'Users can delete own lead sources') THEN
    CREATE POLICY "Users can delete own lead sources" ON public.lead_sources FOR DELETE USING (user_id = auth.uid());
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_lead_sources_user_id ON public.lead_sources(user_id);


-- 2. CRIAR TABELA DE ESTÁGIOS DO FUNIL (pipeline_stages)
CREATE TABLE IF NOT EXISTS public.pipeline_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  probability_default DECIMAL(5, 2) DEFAULT 0,
  color VARCHAR(20) DEFAULT '#3B82F6',
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para pipeline_stages
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pipeline_stages' AND policyname = 'Users can view own pipeline stages') THEN
    CREATE POLICY "Users can view own pipeline stages" ON public.pipeline_stages FOR SELECT USING (user_id = auth.uid());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pipeline_stages' AND policyname = 'Users can create own pipeline stages') THEN
    CREATE POLICY "Users can create own pipeline stages" ON public.pipeline_stages FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pipeline_stages' AND policyname = 'Users can update own pipeline stages') THEN
    CREATE POLICY "Users can update own pipeline stages" ON public.pipeline_stages FOR UPDATE USING (user_id = auth.uid());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pipeline_stages' AND policyname = 'Users can delete own pipeline stages') THEN
    CREATE POLICY "Users can delete own pipeline stages" ON public.pipeline_stages FOR DELETE USING (user_id = auth.uid());
  END IF;
END $$;


-- 3. CRIAR TABELA DE LEADS (leads)
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_user_id UUID REFERENCES auth.users(id),
  
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  company VARCHAR(255),
  position VARCHAR(100),
  
  source VARCHAR(50) DEFAULT 'manual',
  source_details TEXT,
  
  pipeline_stage_id UUID REFERENCES public.pipeline_stages(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'new',
  
  score INTEGER DEFAULT 0,
  expected_value DECIMAL(15, 2),
  probability DECIMAL(5, 2),
  expected_close_date DATE,
  
  lost_reason TEXT,
  lost_date TIMESTAMP WITH TIME ZONE,
  
  converted_to_client BOOLEAN DEFAULT false,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  converted_at TIMESTAMP WITH TIME ZONE,
  
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  first_contact_date TIMESTAMP WITH TIME ZONE,
  last_contact_date TIMESTAMP WITH TIME ZONE,
  last_activity_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para leads
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'Users can view own leads') THEN
    CREATE POLICY "Users can view own leads" ON public.leads FOR SELECT USING (user_id = auth.uid() OR assigned_to = auth.uid());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'Users can create own leads') THEN
    CREATE POLICY "Users can create own leads" ON public.leads FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'Users can update own leads') THEN
    CREATE POLICY "Users can update own leads" ON public.leads FOR UPDATE USING (user_id = auth.uid() OR assigned_to = auth.uid());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'Users can delete own leads') THEN
    CREATE POLICY "Users can delete own leads" ON public.leads FOR DELETE USING (user_id = auth.uid());
  END IF;
END $$;


-- 4. CRIAR TABELA DE ATIVIDADES (lead_activities)
CREATE TABLE IF NOT EXISTS public.lead_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  outcome VARCHAR(50),
  outcome_notes TEXT,
  
  scheduled_for TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  is_completed BOOLEAN DEFAULT false,
  
  duration_minutes INTEGER,
  attachments JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para lead_activities
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lead_activities' AND policyname = 'Users can view own lead activities') THEN
    CREATE POLICY "Users can view own lead activities" ON public.lead_activities FOR SELECT USING (user_id = auth.uid());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lead_activities' AND policyname = 'Users can create own lead activities') THEN
    CREATE POLICY "Users can create own lead activities" ON public.lead_activities FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lead_activities' AND policyname = 'Users can update own lead activities') THEN
    CREATE POLICY "Users can update own lead activities" ON public.lead_activities FOR UPDATE USING (user_id = auth.uid());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lead_activities' AND policyname = 'Users can delete own lead activities') THEN
    CREATE POLICY "Users can delete own lead activities" ON public.lead_activities FOR DELETE USING (user_id = auth.uid());
  END IF;
END $$;


-- 5. ATUALIZAR PERMISSÕES DE USUÁRIO
DO $$ 
BEGIN
  -- can_view_crm
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_permissions' AND column_name = 'can_view_crm') THEN
    ALTER TABLE public.user_permissions ADD COLUMN can_view_crm BOOLEAN DEFAULT true;
  END IF;
  
  -- can_manage_crm
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_permissions' AND column_name = 'can_manage_crm') THEN
    ALTER TABLE public.user_permissions ADD COLUMN can_manage_crm BOOLEAN DEFAULT false;
  END IF;
  
  -- can_delete_leads
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_permissions' AND column_name = 'can_delete_leads') THEN
    ALTER TABLE public.user_permissions ADD COLUMN can_delete_leads BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Atualizar permissões existentes
UPDATE public.user_permissions 
SET 
  can_view_crm = true,
  can_manage_crm = false,
  can_delete_leads = false
WHERE can_view_crm IS NULL;

COMMIT;
