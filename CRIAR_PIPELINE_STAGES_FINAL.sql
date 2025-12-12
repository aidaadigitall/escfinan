-- ============================================================================
-- SCRIPT FINAL: Criação da tabela pipeline_stages
-- (Funciona no SQL Editor sem usuário autenticado)
-- ============================================================================

-- 1. Criar tabela pipeline_stages
CREATE TABLE IF NOT EXISTS public.pipeline_stages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  order_index integer NOT NULL DEFAULT 0,
  color text NOT NULL DEFAULT '#3b82f6',
  probability_default integer DEFAULT 0,
  is_active boolean DEFAULT true NOT NULL,
  is_system boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Remover constraint que pode causar conflito
ALTER TABLE public.pipeline_stages DROP CONSTRAINT IF EXISTS pipeline_stages_user_id_order_index_key;

-- 3. Habilitar RLS na tabela pipeline_stages
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas RLS SIMPLES para pipeline_stages
DROP POLICY IF EXISTS "Users can view pipeline stages" ON public.pipeline_stages;
CREATE POLICY "Users can view pipeline stages" 
ON public.pipeline_stages 
FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create pipeline stages" ON public.pipeline_stages;
CREATE POLICY "Users can create pipeline stages" 
ON public.pipeline_stages 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update pipeline stages" ON public.pipeline_stages;
CREATE POLICY "Users can update pipeline stages" 
ON public.pipeline_stages 
FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete pipeline stages" ON public.pipeline_stages;
CREATE POLICY "Users can delete pipeline stages" 
ON public.pipeline_stages 
FOR DELETE 
USING (auth.uid() = user_id);

-- 5. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_user_id ON public.pipeline_stages(user_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_order_index ON public.pipeline_stages(order_index);
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_is_active ON public.pipeline_stages(is_active);

-- 6. Adicionar coluna pipeline_stage_id na tabela leads (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'leads' 
    AND column_name = 'pipeline_stage_id'
  ) THEN
    ALTER TABLE public.leads ADD COLUMN pipeline_stage_id uuid REFERENCES public.pipeline_stages(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_leads_pipeline_stage_id ON public.leads(pipeline_stage_id);
  END IF;
END $$;

-- 7. Adicionar coluna client_id na tabela leads (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'leads' 
    AND column_name = 'client_id'
  ) THEN
    ALTER TABLE public.leads ADD COLUMN client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_leads_client_id ON public.leads(client_id);
  END IF;
END $$;

-- 8. Criar estágios padrão para TODOS os usuários existentes
INSERT INTO public.pipeline_stages (user_id, name, description, order_index, color, probability_default, is_system)
SELECT 
  u.id,
  stage.name,
  stage.description,
  stage.order_index,
  stage.color,
  stage.probability_default,
  stage.is_system
FROM auth.users u
CROSS JOIN (
  VALUES
    ('Novo Lead', 'Leads recém-capturados', 0, '#94a3b8', 10, true),
    ('Contato Inicial', 'Primeiro contato realizado', 1, '#3b82f6', 25, true),
    ('Qualificação', 'Lead está sendo qualificado', 2, '#8b5cf6', 40, true),
    ('Proposta', 'Proposta enviada ao cliente', 3, '#f59e0b', 60, true),
    ('Negociação', 'Em negociação final', 4, '#10b981', 80, true),
    ('Fechamento', 'Pronto para fechar', 5, '#22c55e', 95, true)
) AS stage(name, description, order_index, color, probability_default, is_system)
WHERE NOT EXISTS (
  SELECT 1 FROM public.pipeline_stages ps 
  WHERE ps.user_id = u.id AND ps.name = stage.name
);

-- ============================================================================
-- FIM DO SCRIPT - Verificação
-- ============================================================================

-- Ver estágios criados
SELECT 
  ps.user_id,
  ps.name,
  ps.order_index,
  ps.probability_default,
  ps.color,
  ps.is_active
FROM public.pipeline_stages ps
ORDER BY ps.user_id, ps.order_index;

-- ============================================================================
-- SUCESSO! Tabela pipeline_stages criada e estágios padrão inseridos!
-- ============================================================================
