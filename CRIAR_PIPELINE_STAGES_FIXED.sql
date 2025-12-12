-- ============================================================================
-- SCRIPT CORRIGIDO: Criação das tabelas CRM (pipeline_stages, leads, etc)
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
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT pipeline_stages_user_id_order_index_key UNIQUE (user_id, order_index),
  CONSTRAINT pipeline_stages_probability_check CHECK (probability_default >= 0 AND probability_default <= 100)
);

-- 2. Habilitar RLS na tabela pipeline_stages
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;

-- 3. Criar políticas RLS para pipeline_stages
DROP POLICY IF EXISTS "Users can view pipeline stages" ON public.pipeline_stages;
CREATE POLICY "Users can view pipeline stages" 
ON public.pipeline_stages 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR 
  public.get_effective_owner_id(auth.uid()) = user_id
  OR
  auth.uid() = public.get_effective_owner_id(user_id)
);

DROP POLICY IF EXISTS "Users can create pipeline stages" ON public.pipeline_stages;
CREATE POLICY "Users can create pipeline stages" 
ON public.pipeline_stages 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  OR 
  public.get_effective_owner_id(auth.uid()) = user_id
  OR
  auth.uid() = public.get_effective_owner_id(user_id)
);

DROP POLICY IF EXISTS "Users can update pipeline stages" ON public.pipeline_stages;
CREATE POLICY "Users can update pipeline stages" 
ON public.pipeline_stages 
FOR UPDATE 
USING (
  auth.uid() = user_id 
  OR 
  public.get_effective_owner_id(auth.uid()) = user_id
  OR
  auth.uid() = public.get_effective_owner_id(user_id)
);

DROP POLICY IF EXISTS "Users can delete pipeline stages" ON public.pipeline_stages;
CREATE POLICY "Users can delete pipeline stages" 
ON public.pipeline_stages 
FOR DELETE 
USING (
  auth.uid() = user_id 
  OR 
  public.get_effective_owner_id(auth.uid()) = user_id
  OR
  auth.uid() = public.get_effective_owner_id(user_id)
);

-- 4. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_user_id ON public.pipeline_stages(user_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_order_index ON public.pipeline_stages(order_index);
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_is_active ON public.pipeline_stages(is_active);

-- 5. Verificar se a coluna pipeline_stage_id existe na tabela leads
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

-- 6. Verificar se a coluna client_id existe na tabela leads
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

-- 7. Criar função para inserir estágios padrão para um usuário
CREATE OR REPLACE FUNCTION create_default_pipeline_stages_for_user(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Inserir estágios padrão apenas se o usuário não tiver nenhum
  IF NOT EXISTS (SELECT 1 FROM public.pipeline_stages WHERE user_id = _user_id) THEN
    INSERT INTO public.pipeline_stages (user_id, name, description, order_index, color, probability_default, is_system)
    VALUES
      (_user_id, 'Novo Lead', 'Leads recém-capturados', 0, '#94a3b8', 10, true),
      (_user_id, 'Contato Inicial', 'Primeiro contato realizado', 1, '#3b82f6', 25, true),
      (_user_id, 'Qualificação', 'Lead está sendo qualificado', 2, '#8b5cf6', 40, true),
      (_user_id, 'Proposta', 'Proposta enviada ao cliente', 3, '#f59e0b', 60, true),
      (_user_id, 'Negociação', 'Em negociação final', 4, '#10b981', 80, true),
      (_user_id, 'Fechamento', 'Pronto para fechar', 5, '#22c55e', 95, true);
  END IF;
END;
$$;

-- 8. Criar trigger para criar estágios padrão quando um novo usuário for criado
DROP TRIGGER IF EXISTS create_pipeline_stages_on_user_creation ON auth.users;
CREATE OR REPLACE FUNCTION trigger_create_default_pipeline_stages()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM create_default_pipeline_stages_for_user(NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER create_pipeline_stages_on_user_creation
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION trigger_create_default_pipeline_stages();

-- 9. Criar estágios padrão para todos os usuários existentes que não têm
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT DISTINCT au.id 
    FROM auth.users au
    LEFT JOIN public.pipeline_stages ps ON ps.user_id = au.id
    WHERE ps.id IS NULL
  LOOP
    PERFORM create_default_pipeline_stages_for_user(user_record.id);
  END LOOP;
END $$;

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
  COUNT(l.id) as lead_count
FROM public.pipeline_stages ps
LEFT JOIN public.leads l ON l.pipeline_stage_id = ps.id
GROUP BY ps.id, ps.user_id, ps.name, ps.order_index, ps.probability_default, ps.color
ORDER BY ps.user_id, ps.order_index;

-- ============================================================================
-- FIM - Tabela pipeline_stages criada com sucesso!
-- ============================================================================
