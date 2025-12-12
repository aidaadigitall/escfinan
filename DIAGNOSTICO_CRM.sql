-- ============================================================================
-- SCRIPT DE DIAGNÓSTICO: Verificar dados do CRM
-- ============================================================================

-- 1. Verificar se a tabela pipeline_stages existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'pipeline_stages'
) as tabela_existe;

-- 2. Contar registros na tabela
SELECT COUNT(*) as total_estagios FROM public.pipeline_stages;

-- 3. Ver todos os estágios
SELECT * FROM public.pipeline_stages ORDER BY user_id, order_index;

-- 4. Verificar políticas RLS
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual 
FROM pg_policies 
WHERE tablename = 'pipeline_stages';

-- 5. Verificar se RLS está habilitado
SELECT 
  relname as table_name,
  relrowsecurity as rls_enabled
FROM pg_class
WHERE relname = 'pipeline_stages';

-- 6. Ver estrutura da tabela leads
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'leads' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 7. Ver leads com seus estágios
SELECT 
  l.id,
  l.name,
  l.pipeline_stage_id,
  ps.name as stage_name
FROM public.leads l
LEFT JOIN public.pipeline_stages ps ON l.pipeline_stage_id = ps.id;
