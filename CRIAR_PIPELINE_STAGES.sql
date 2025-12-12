-- =============================================================================
-- CRIAR TABELA PIPELINE_STAGES E ESTRUTURA COMPLETA DO CRM
-- Execute este SQL no SQL Editor do Supabase
-- =============================================================================

-- 1. Criar tabela pipeline_stages
CREATE TABLE IF NOT EXISTS public.pipeline_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  probability_default DECIMAL(5, 2) DEFAULT 50,
  color VARCHAR(20) DEFAULT '#3B82F6',
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

-- 2. Criar índices
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_user_id ON public.pipeline_stages(user_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_order ON public.pipeline_stages(order_index);

-- 3. Habilitar RLS
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas de segurança (DROP IF EXISTS para evitar erro de duplicata)
DROP POLICY IF EXISTS "Users can view their own stages" ON public.pipeline_stages;
CREATE POLICY "Users can view their own stages"
  ON public.pipeline_stages FOR SELECT
  USING (user_id = auth.uid() OR can_access_user_data(user_id));

DROP POLICY IF EXISTS "Users can insert their own stages" ON public.pipeline_stages;
CREATE POLICY "Users can insert their own stages"
  ON public.pipeline_stages FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own stages" ON public.pipeline_stages;
CREATE POLICY "Users can update their own stages"
  ON public.pipeline_stages FOR UPDATE
  USING (user_id = auth.uid() OR can_access_user_data(user_id));

DROP POLICY IF EXISTS "Users can delete their own stages" ON public.pipeline_stages;
CREATE POLICY "Users can delete their own stages"
  ON public.pipeline_stages FOR DELETE
  USING (user_id = auth.uid());

-- 5. Criar trigger para updated_at
DROP TRIGGER IF EXISTS update_pipeline_stages_updated_at ON public.pipeline_stages;
CREATE TRIGGER update_pipeline_stages_updated_at
  BEFORE UPDATE ON public.pipeline_stages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Atualizar tabela leads para adicionar coluna pipeline_stage_id se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'leads' 
    AND column_name = 'pipeline_stage_id'
  ) THEN
    ALTER TABLE public.leads 
    ADD COLUMN pipeline_stage_id UUID REFERENCES public.pipeline_stages(id) ON DELETE SET NULL;
    
    CREATE INDEX IF NOT EXISTS idx_leads_pipeline_stage ON public.leads(pipeline_stage_id);
  END IF;
END $$;

-- 7. Adicionar coluna client_id na tabela leads se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'leads' 
    AND column_name = 'client_id'
  ) THEN
    ALTER TABLE public.leads 
    ADD COLUMN client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;
    
    CREATE INDEX IF NOT EXISTS idx_leads_client ON public.leads(client_id);
  END IF;
END $$;

-- 8. Função para criar estágios padrão automaticamente
CREATE OR REPLACE FUNCTION create_default_pipeline_stages_for_user(target_user_id UUID)
RETURNS void AS $$
BEGIN
  -- Verificar se já existem estágios para este usuário
  IF NOT EXISTS (SELECT 1 FROM public.pipeline_stages WHERE user_id = target_user_id) THEN
    -- Criar estágios padrão
    INSERT INTO public.pipeline_stages (user_id, name, description, order_index, probability_default, color)
    VALUES
      (target_user_id, 'Novo Lead', 'Lead recém captado, aguardando primeira abordagem', 0, 10, '#6b7280'),
      (target_user_id, 'Contato Inicial', 'Primeiro contato realizado, qualificando interesse', 1, 25, '#3b82f6'),
      (target_user_id, 'Qualificação', 'Lead qualificado, entendendo necessidades', 2, 40, '#8b5cf6'),
      (target_user_id, 'Proposta', 'Proposta comercial enviada', 3, 60, '#f59e0b'),
      (target_user_id, 'Negociação', 'Em negociação de valores e condições', 4, 75, '#f97316'),
      (target_user_id, 'Fechamento', 'Pronto para fechar negócio', 5, 90, '#10b981');
    
    RAISE NOTICE 'Estágios padrão criados para usuário %', target_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 9. Criar estágios padrão para todos os usuários existentes
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id FROM auth.users LOOP
    PERFORM create_default_pipeline_stages_for_user(user_record.id);
  END LOOP;
END $$;

-- 10. Trigger para criar estágios automaticamente para novos usuários
CREATE OR REPLACE FUNCTION trigger_create_default_pipeline_stages()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_default_pipeline_stages_for_user(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS create_default_pipeline_stages_trigger ON auth.users;
CREATE TRIGGER create_default_pipeline_stages_trigger
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION trigger_create_default_pipeline_stages();

-- =============================================================================
-- VERIFICAR RESULTADO
-- =============================================================================

-- Ver estágios criados
SELECT 
  ps.user_id,
  ps.name,
  ps.order_index,
  ps.probability_default,
  ps.color,
  COUNT(l.id) as lead_count
FROM public.pipeline_stages ps
LEFT JOIN public.leads l ON l.pipeline_stage_id = ps.id
GROUP BY ps.id, ps.user_id, ps.name, ps.order_index, ps.probability_default, ps.color
ORDER BY ps.user_id, ps.order_index;

-- =============================================================================
-- FIM - Tabela pipeline_stages criada com sucesso!
-- =============================================================================
