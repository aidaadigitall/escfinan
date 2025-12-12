-- ============================================================================
-- SCRIPT: Atualizar leads existentes para o primeiro estágio
-- ============================================================================

-- Ver todos os estágios existentes
SELECT id, user_id, name, order_index, color FROM public.pipeline_stages ORDER BY user_id, order_index;

-- Ver leads sem estágio
SELECT id, name, email, pipeline_stage_id FROM public.leads WHERE pipeline_stage_id IS NULL;

-- Atualizar leads sem estágio para o primeiro estágio do respectivo usuário
UPDATE public.leads l
SET pipeline_stage_id = (
  SELECT ps.id 
  FROM public.pipeline_stages ps 
  WHERE ps.user_id = l.user_id 
  AND ps.order_index = 0
  LIMIT 1
)
WHERE l.pipeline_stage_id IS NULL;

-- Verificar resultado
SELECT 
  l.id, 
  l.name as lead_name, 
  l.email,
  ps.name as stage_name,
  ps.color
FROM public.leads l
LEFT JOIN public.pipeline_stages ps ON l.pipeline_stage_id = ps.id
ORDER BY l.created_at DESC;
