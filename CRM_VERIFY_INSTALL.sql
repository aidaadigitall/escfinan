-- =====================================================
-- VERIFICAÇÃO E INSTALAÇÃO DO CRM
-- =====================================================
-- Execute este script para verificar se as tabelas do CRM existem
-- Se não existirem, elas serão criadas
-- =====================================================

-- Verificar se pipeline_stages existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pipeline_stages') THEN
        RAISE NOTICE 'Tabela pipeline_stages não existe. Será criada.';
    ELSE
        RAISE NOTICE 'Tabela pipeline_stages já existe.';
    END IF;
END $$;

-- Verificar se leads existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leads') THEN
        RAISE NOTICE 'Tabela leads não existe. Será criada.';
    ELSE
        RAISE NOTICE 'Tabela leads já existe.';
    END IF;
END $$;

-- Criar pipeline_stages se não existir
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

-- Criar leads se não existir
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
  lost_date DATE,
  converted_to_client BOOLEAN DEFAULT false,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  converted_at TIMESTAMP WITH TIME ZONE,
  assigned_to UUID REFERENCES auth.users(id),
  first_contact_date DATE,
  last_contact_date DATE,
  last_activity_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Criar lead_activities se não existir
CREATE TABLE IF NOT EXISTS public.lead_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  activity_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  duration_minutes INTEGER,
  outcome VARCHAR(50),
  next_action VARCHAR(255),
  next_action_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

-- Policies para pipeline_stages
DROP POLICY IF EXISTS "Users can view own pipeline stages" ON public.pipeline_stages;
CREATE POLICY "Users can view own pipeline stages"
ON public.pipeline_stages
FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create own pipeline stages" ON public.pipeline_stages;
CREATE POLICY "Users can create own pipeline stages"
ON public.pipeline_stages
FOR INSERT
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own pipeline stages" ON public.pipeline_stages;
CREATE POLICY "Users can update own pipeline stages"
ON public.pipeline_stages
FOR UPDATE
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own pipeline stages" ON public.pipeline_stages;
CREATE POLICY "Users can delete own pipeline stages"
ON public.pipeline_stages
FOR DELETE
USING (user_id = auth.uid() AND is_system = false);

-- Policies para leads
DROP POLICY IF EXISTS "Users can view own leads" ON public.leads;
CREATE POLICY "Users can view own leads"
ON public.leads
FOR SELECT
USING (user_id = auth.uid() OR owner_user_id = auth.uid() OR assigned_to = auth.uid());

DROP POLICY IF EXISTS "Users can create own leads" ON public.leads;
CREATE POLICY "Users can create own leads"
ON public.leads
FOR INSERT
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own leads" ON public.leads;
CREATE POLICY "Users can update own leads"
ON public.leads
FOR UPDATE
USING (user_id = auth.uid() OR owner_user_id = auth.uid() OR assigned_to = auth.uid());

DROP POLICY IF EXISTS "Users can delete own leads" ON public.leads;
CREATE POLICY "Users can delete own leads"
ON public.leads
FOR DELETE
USING (user_id = auth.uid() OR owner_user_id = auth.uid());

-- Policies para lead_activities
DROP POLICY IF EXISTS "Users can view activities of accessible leads" ON public.lead_activities;
CREATE POLICY "Users can view activities of accessible leads"
ON public.lead_activities
FOR SELECT
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.leads
    WHERE leads.id = lead_activities.lead_id
    AND (leads.user_id = auth.uid() OR leads.owner_user_id = auth.uid() OR leads.assigned_to = auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can create activities" ON public.lead_activities;
CREATE POLICY "Users can create activities"
ON public.lead_activities
FOR INSERT
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own activities" ON public.lead_activities;
CREATE POLICY "Users can update own activities"
ON public.lead_activities
FOR UPDATE
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own activities" ON public.lead_activities;
CREATE POLICY "Users can delete own activities"
ON public.lead_activities
FOR DELETE
USING (user_id = auth.uid());

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_user_id ON public.pipeline_stages(user_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_order ON public.pipeline_stages("order");
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON public.leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_pipeline_stage_id ON public.leads(pipeline_stage_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON public.leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON public.lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_user_id ON public.lead_activities(user_id);

-- Adicionar permissões no sistema
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_permissions' 
        AND column_name = 'can_view_crm'
    ) THEN
        ALTER TABLE public.user_permissions ADD COLUMN can_view_crm BOOLEAN DEFAULT true;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_permissions' 
        AND column_name = 'can_manage_crm'
    ) THEN
        ALTER TABLE public.user_permissions ADD COLUMN can_manage_crm BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Mensagem final
DO $$ 
BEGIN
    RAISE NOTICE '✅ Verificação e instalação do CRM concluída!';
    RAISE NOTICE 'Verifique se as tabelas foram criadas:';
    RAISE NOTICE '- pipeline_stages';
    RAISE NOTICE '- leads';
    RAISE NOTICE '- lead_activities';
END $$;
