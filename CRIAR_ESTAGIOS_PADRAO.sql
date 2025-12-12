-- =============================================================================
-- CRIAR ESTÁGIOS PADRÃO DO FUNIL DE VENDAS
-- Execute este SQL no Supabase se você não tiver estágios criados ainda
-- =============================================================================

-- Função para criar estágios padrão para um usuário
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
  ELSE
    RAISE NOTICE 'Usuário % já possui estágios configurados', target_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- CRIAR ESTÁGIOS PARA O USUÁRIO ATUAL
-- Substitua 'SEU_USER_ID_AQUI' pelo ID do seu usuário ou use auth.uid()
-- =============================================================================

-- Opção 1: Para o usuário logado atualmente (execute como usuário autenticado)
-- SELECT create_default_pipeline_stages_for_user(auth.uid());

-- Opção 2: Para um usuário específico (substitua o UUID)
-- SELECT create_default_pipeline_stages_for_user('SEU_USER_ID_AQUI'::UUID);

-- =============================================================================
-- CRIAR ESTÁGIOS PARA TODOS OS USUÁRIOS EXISTENTES
-- (Útil para migração de dados)
-- =============================================================================

-- Criar estágios padrão para todos os usuários que não têm estágios
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id FROM auth.users LOOP
    PERFORM create_default_pipeline_stages_for_user(user_record.id);
  END LOOP;
END $$;

-- =============================================================================
-- VERIFICAR ESTÁGIOS CRIADOS
-- =============================================================================

-- Ver estágios de todos os usuários
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
-- ATUALIZAR ORDEM DOS ESTÁGIOS (se necessário)
-- =============================================================================

-- Reorganizar ordem dos estágios (ajuste os IDs conforme necessário)
-- UPDATE public.pipeline_stages SET order_index = 0 WHERE name = 'Novo Lead';
-- UPDATE public.pipeline_stages SET order_index = 1 WHERE name = 'Contato Inicial';
-- UPDATE public.pipeline_stages SET order_index = 2 WHERE name = 'Qualificação';
-- UPDATE public.pipeline_stages SET order_index = 3 WHERE name = 'Proposta';
-- UPDATE public.pipeline_stages SET order_index = 4 WHERE name = 'Negociação';
-- UPDATE public.pipeline_stages SET order_index = 5 WHERE name = 'Fechamento';

-- =============================================================================
-- FIM
-- =============================================================================
