-- =============================================================================
-- Forçar recarregamento do cache de schema do PostgREST (Supabase)
-- Execute no SQL Editor do Supabase
-- =============================================================================

-- Recarregar schema do PostgREST
SELECT pg_notify('pgrst', 'reload schema');

-- Opcional: recarregar configuração do PostgreSQL (não necessário na maioria dos casos)
-- SELECT pg_reload_conf();

-- Verificar tabelas existentes
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
