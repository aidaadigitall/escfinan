-- Grants e reload de schema para dashboard_preferences
-- Data: 2025-12-11

BEGIN;

-- Garantir extensão para UUID aleatório (caso ainda não exista)
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

-- Garantir uso do schema public
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Conceder privilégios nas tabelas (RLS continuará controlando acesso)
GRANT SELECT ON TABLE public.dashboard_preferences TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.dashboard_preferences TO authenticated;

GRANT SELECT ON TABLE public.dashboard_layout_templates TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.dashboard_layout_templates TO authenticated;

-- Conceder EXECUTE nas funções RPC
GRANT EXECUTE ON FUNCTION public.get_or_create_dashboard_preferences(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_layout_template(uuid, uuid) TO authenticated;

-- Forçar reload do cache de schema do PostgREST (API)
NOTIFY pgrst, 'reload schema';

COMMIT;
