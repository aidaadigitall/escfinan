-- =====================================================
-- GESTÃO DE PROJETOS - PERMISSÕES
-- =====================================================
-- Criado em: 2025-12-11
-- Adiciona permissões para o módulo de gestão de projetos
-- =====================================================

-- Adiciona colunas de permissões de projetos se não existirem
DO $$
BEGIN
    -- Visualizar projetos
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_permissions' 
        AND column_name = 'can_view_projects'
    ) THEN
        ALTER TABLE public.user_permissions 
        ADD COLUMN can_view_projects BOOLEAN DEFAULT true;
    END IF;

    -- Gerenciar projetos (criar, editar, excluir)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_permissions' 
        AND column_name = 'can_manage_projects'
    ) THEN
        ALTER TABLE public.user_permissions 
        ADD COLUMN can_manage_projects BOOLEAN DEFAULT false;
    END IF;

    -- Excluir projetos
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_permissions' 
        AND column_name = 'can_delete_projects'
    ) THEN
        ALTER TABLE public.user_permissions 
        ADD COLUMN can_delete_projects BOOLEAN DEFAULT false;
    END IF;

    -- Visualizar financeiro dos projetos
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_permissions' 
        AND column_name = 'can_view_project_financials'
    ) THEN
        ALTER TABLE public.user_permissions 
        ADD COLUMN can_view_project_financials BOOLEAN DEFAULT false;
    END IF;

    -- Aprovar horas de projetos
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_permissions' 
        AND column_name = 'can_approve_project_hours'
    ) THEN
        ALTER TABLE public.user_permissions 
        ADD COLUMN can_approve_project_hours BOOLEAN DEFAULT false;
    END IF;

    -- Aprovar despesas de projetos
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_permissions' 
        AND column_name = 'can_approve_project_expenses'
    ) THEN
        ALTER TABLE public.user_permissions 
        ADD COLUMN can_approve_project_expenses BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Comentários
COMMENT ON COLUMN public.user_permissions.can_view_projects IS 'Permite visualizar projetos';
COMMENT ON COLUMN public.user_permissions.can_manage_projects IS 'Permite criar e editar projetos';
COMMENT ON COLUMN public.user_permissions.can_delete_projects IS 'Permite excluir projetos';
COMMENT ON COLUMN public.user_permissions.can_view_project_financials IS 'Permite visualizar informações financeiras dos projetos';
COMMENT ON COLUMN public.user_permissions.can_approve_project_hours IS 'Permite aprovar lançamentos de horas';
COMMENT ON COLUMN public.user_permissions.can_approve_project_expenses IS 'Permite aprovar despesas de projetos';
