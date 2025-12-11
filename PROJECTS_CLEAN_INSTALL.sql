-- =====================================================
-- GESTÃO DE PROJETOS - INSTALAÇÃO LIMPA
-- =====================================================
-- Remove tudo existente e cria do zero
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- =====================================================
-- PARTE 1: REMOVER TUDO EXISTENTE (LIMPEZA)
-- =====================================================

-- Remover policies existentes
DROP POLICY IF EXISTS "Users can view own projects or team projects" ON public.projects;
DROP POLICY IF EXISTS "Users can insert own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update own projects or as team member with permission" ON public.projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;

DROP POLICY IF EXISTS "Users can view tasks from accessible projects" ON public.project_tasks;
DROP POLICY IF EXISTS "Users can insert tasks in accessible projects" ON public.project_tasks;
DROP POLICY IF EXISTS "Users can update tasks in accessible projects" ON public.project_tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON public.project_tasks;

DROP POLICY IF EXISTS "Users can view team members of accessible projects" ON public.project_team;
DROP POLICY IF EXISTS "Project owners can manage team" ON public.project_team;

DROP POLICY IF EXISTS "Users can view own time entries or as project manager" ON public.project_time_entries;
DROP POLICY IF EXISTS "Users can insert own time entries" ON public.project_time_entries;
DROP POLICY IF EXISTS "Users can update own time entries" ON public.project_time_entries;
DROP POLICY IF EXISTS "Users can delete own time entries" ON public.project_time_entries;

DROP POLICY IF EXISTS "Users can view expenses from accessible projects" ON public.project_expenses;
DROP POLICY IF EXISTS "Users can insert expenses in accessible projects" ON public.project_expenses;
DROP POLICY IF EXISTS "Users can update own expenses" ON public.project_expenses;
DROP POLICY IF EXISTS "Users can delete own expenses" ON public.project_expenses;

-- Remover tabelas (em ordem reversa de dependências)
DROP TABLE IF EXISTS public.project_expenses CASCADE;
DROP TABLE IF EXISTS public.project_time_entries CASCADE;
DROP TABLE IF EXISTS public.project_team CASCADE;
DROP TABLE IF EXISTS public.project_tasks CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;

-- Remover funções
DROP FUNCTION IF EXISTS get_project_total_hours(UUID);
DROP FUNCTION IF EXISTS get_project_total_expenses(UUID);
DROP FUNCTION IF EXISTS get_project_margin(UUID);

-- =====================================================
-- PARTE 2: CRIAR TABELAS
-- =====================================================

-- 1. TABELA: projects
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE,
    description TEXT,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    project_type VARCHAR(50),
    budget_amount DECIMAL(15,2) DEFAULT 0,
    budget_hours DECIMAL(10,2) DEFAULT 0,
    hourly_rate DECIMAL(10,2),
    start_date DATE,
    expected_end_date DATE,
    actual_end_date DATE,
    status VARCHAR(50) DEFAULT 'planning',
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    priority VARCHAR(20) DEFAULT 'medium',
    project_manager_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT projects_dates_check CHECK (
        (start_date IS NULL OR expected_end_date IS NULL) OR 
        (start_date <= expected_end_date)
    )
);

CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_projects_owner_user_id ON public.projects(owner_user_id);
CREATE INDEX idx_projects_client_id ON public.projects(client_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_projects_project_manager_id ON public.projects(project_manager_id);
CREATE INDEX idx_projects_start_date ON public.projects(start_date);
CREATE INDEX idx_projects_code ON public.projects(code);

-- 2. TABELA: project_tasks
CREATE TABLE public.project_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    parent_task_id UUID REFERENCES public.project_tasks(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    task_number INTEGER,
    estimated_hours DECIMAL(10,2) DEFAULT 0,
    actual_hours DECIMAL(10,2) DEFAULT 0,
    start_date DATE,
    due_date DATE,
    completed_date DATE,
    status VARCHAR(50) DEFAULT 'todo',
    priority VARCHAR(20) DEFAULT 'medium',
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_project_tasks_project_id ON public.project_tasks(project_id);
CREATE INDEX idx_project_tasks_parent_task_id ON public.project_tasks(parent_task_id);
CREATE INDEX idx_project_tasks_assigned_to ON public.project_tasks(assigned_to);
CREATE INDEX idx_project_tasks_status ON public.project_tasks(status);
CREATE INDEX idx_project_tasks_user_id ON public.project_tasks(user_id);

-- 3. TABELA: project_team
CREATE TABLE public.project_team (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(100),
    hourly_rate DECIMAL(10,2),
    allocated_hours DECIMAL(10,2) DEFAULT 0,
    can_edit_project BOOLEAN DEFAULT false,
    can_manage_tasks BOOLEAN DEFAULT false,
    can_view_financials BOOLEAN DEFAULT false,
    start_date DATE,
    end_date DATE,
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

CREATE INDEX idx_project_team_project_id ON public.project_team(project_id);
CREATE INDEX idx_project_team_user_id ON public.project_team(user_id);
CREATE INDEX idx_project_team_owner_user_id ON public.project_team(owner_user_id);

-- 4. TABELA: project_time_entries
CREATE TABLE public.project_time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    task_id UUID REFERENCES public.project_tasks(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    hours DECIMAL(10,2) NOT NULL CHECK (hours > 0),
    description TEXT,
    is_billable BOOLEAN DEFAULT true,
    hourly_rate DECIMAL(10,2),
    amount DECIMAL(15,2) GENERATED ALWAYS AS (hours * COALESCE(hourly_rate, 0)) STORED,
    status VARCHAR(50) DEFAULT 'pending',
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_project_time_entries_project_id ON public.project_time_entries(project_id);
CREATE INDEX idx_project_time_entries_task_id ON public.project_time_entries(task_id);
CREATE INDEX idx_project_time_entries_user_id ON public.project_time_entries(user_id);
CREATE INDEX idx_project_time_entries_date ON public.project_time_entries(date);
CREATE INDEX idx_project_time_entries_status ON public.project_time_entries(status);
CREATE INDEX idx_project_time_entries_owner_user_id ON public.project_time_entries(owner_user_id);

-- 5. TABELA: project_expenses
CREATE TABLE public.project_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL CHECK (amount >= 0),
    expense_date DATE NOT NULL,
    expense_type VARCHAR(50),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    is_billable BOOLEAN DEFAULT false,
    is_billed BOOLEAN DEFAULT false,
    markup_percentage DECIMAL(5,2) DEFAULT 0,
    billable_amount DECIMAL(15,2) GENERATED ALWAYS AS (amount * (1 + COALESCE(markup_percentage, 0) / 100)) STORED,
    receipt_url TEXT,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_project_expenses_project_id ON public.project_expenses(project_id);
CREATE INDEX idx_project_expenses_transaction_id ON public.project_expenses(transaction_id);
CREATE INDEX idx_project_expenses_expense_date ON public.project_expenses(expense_date);
CREATE INDEX idx_project_expenses_status ON public.project_expenses(status);
CREATE INDEX idx_project_expenses_user_id ON public.project_expenses(user_id);

-- =====================================================
-- PARTE 3: ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_team ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_expenses ENABLE ROW LEVEL SECURITY;

-- Projects Policies
CREATE POLICY "Users can view own projects or team projects"
    ON public.projects FOR SELECT
    USING (
        user_id = auth.uid() OR 
        owner_user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.project_team
            WHERE project_team.project_id = projects.id
            AND project_team.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own projects"
    ON public.projects FOR INSERT
    WITH CHECK (user_id = auth.uid() AND owner_user_id = auth.uid());

CREATE POLICY "Users can update own projects or as team member with permission"
    ON public.projects FOR UPDATE
    USING (
        user_id = auth.uid() OR 
        owner_user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.project_team
            WHERE project_team.project_id = projects.id
            AND project_team.user_id = auth.uid()
            AND project_team.can_edit_project = true
        )
    );

CREATE POLICY "Users can delete own projects"
    ON public.projects FOR DELETE
    USING (user_id = auth.uid() OR owner_user_id = auth.uid());

-- Project Tasks Policies
CREATE POLICY "Users can view tasks from accessible projects"
    ON public.project_tasks FOR SELECT
    USING (
        user_id = auth.uid() OR 
        owner_user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = project_tasks.project_id
            AND (projects.user_id = auth.uid() OR projects.owner_user_id = auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM public.project_team
            WHERE project_team.project_id = project_tasks.project_id
            AND project_team.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert tasks in accessible projects"
    ON public.project_tasks FOR INSERT
    WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = project_tasks.project_id
            AND (projects.user_id = auth.uid() OR projects.owner_user_id = auth.uid())
        )
    );

CREATE POLICY "Users can update tasks in accessible projects"
    ON public.project_tasks FOR UPDATE
    USING (
        user_id = auth.uid() OR 
        owner_user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.project_team
            WHERE project_team.project_id = project_tasks.project_id
            AND project_team.user_id = auth.uid()
            AND project_team.can_manage_tasks = true
        )
    );

CREATE POLICY "Users can delete own tasks"
    ON public.project_tasks FOR DELETE
    USING (user_id = auth.uid() OR owner_user_id = auth.uid());

-- Project Team Policies
CREATE POLICY "Users can view team members of accessible projects"
    ON public.project_team FOR SELECT
    USING (
        user_id = auth.uid() OR
        owner_user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = project_team.project_id
            AND (projects.user_id = auth.uid() OR projects.owner_user_id = auth.uid())
        )
    );

CREATE POLICY "Project owners can manage team"
    ON public.project_team FOR ALL
    USING (
        owner_user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = project_team.project_id
            AND (projects.user_id = auth.uid() OR projects.owner_user_id = auth.uid())
        )
    );

-- Project Time Entries Policies
CREATE POLICY "Users can view own time entries or as project manager"
    ON public.project_time_entries FOR SELECT
    USING (
        user_id = auth.uid() OR
        owner_user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = project_time_entries.project_id
            AND (projects.user_id = auth.uid() OR projects.project_manager_id = auth.uid())
        )
    );

CREATE POLICY "Users can insert own time entries"
    ON public.project_time_entries FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own time entries"
    ON public.project_time_entries FOR UPDATE
    USING (user_id = auth.uid() OR owner_user_id = auth.uid());

CREATE POLICY "Users can delete own time entries"
    ON public.project_time_entries FOR DELETE
    USING (user_id = auth.uid() OR owner_user_id = auth.uid());

-- Project Expenses Policies
CREATE POLICY "Users can view expenses from accessible projects"
    ON public.project_expenses FOR SELECT
    USING (
        user_id = auth.uid() OR
        owner_user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = project_expenses.project_id
            AND (projects.user_id = auth.uid() OR projects.owner_user_id = auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM public.project_team
            WHERE project_team.project_id = project_expenses.project_id
            AND project_team.user_id = auth.uid()
            AND project_team.can_view_financials = true
        )
    );

CREATE POLICY "Users can insert expenses in accessible projects"
    ON public.project_expenses FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own expenses"
    ON public.project_expenses FOR UPDATE
    USING (user_id = auth.uid() OR owner_user_id = auth.uid());

CREATE POLICY "Users can delete own expenses"
    ON public.project_expenses FOR DELETE
    USING (user_id = auth.uid() OR owner_user_id = auth.uid());

-- =====================================================
-- PARTE 4: TRIGGERS
-- =====================================================

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_tasks_updated_at
    BEFORE UPDATE ON public.project_tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_team_updated_at
    BEFORE UPDATE ON public.project_team
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_time_entries_updated_at
    BEFORE UPDATE ON public.project_time_entries
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_expenses_updated_at
    BEFORE UPDATE ON public.project_expenses
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- PARTE 5: FUNÇÕES AUXILIARES
-- =====================================================

CREATE FUNCTION get_project_total_hours(project_uuid UUID)
RETURNS DECIMAL AS $$
BEGIN
    RETURN COALESCE(
        (SELECT SUM(hours) FROM public.project_time_entries WHERE project_id = project_uuid),
        0
    );
END;
$$ LANGUAGE plpgsql STABLE;

CREATE FUNCTION get_project_total_expenses(project_uuid UUID)
RETURNS DECIMAL AS $$
BEGIN
    RETURN COALESCE(
        (SELECT SUM(amount) FROM public.project_expenses WHERE project_id = project_uuid),
        0
    );
END;
$$ LANGUAGE plpgsql STABLE;

CREATE FUNCTION get_project_margin(project_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
    budget DECIMAL;
    hours_cost DECIMAL;
    expenses_total DECIMAL;
BEGIN
    SELECT budget_amount INTO budget FROM public.projects WHERE id = project_uuid;
    
    SELECT COALESCE(SUM(amount), 0) INTO hours_cost 
    FROM public.project_time_entries 
    WHERE project_id = project_uuid;
    
    SELECT COALESCE(SUM(amount), 0) INTO expenses_total 
    FROM public.project_expenses 
    WHERE project_id = project_uuid;
    
    RETURN budget - hours_cost - expenses_total;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- PARTE 6: PERMISSÕES NO SISTEMA
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_permissions' 
        AND column_name = 'can_view_projects'
    ) THEN
        ALTER TABLE public.user_permissions 
        ADD COLUMN can_view_projects BOOLEAN DEFAULT true;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_permissions' 
        AND column_name = 'can_manage_projects'
    ) THEN
        ALTER TABLE public.user_permissions 
        ADD COLUMN can_manage_projects BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_permissions' 
        AND column_name = 'can_delete_projects'
    ) THEN
        ALTER TABLE public.user_permissions 
        ADD COLUMN can_delete_projects BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_permissions' 
        AND column_name = 'can_view_project_financials'
    ) THEN
        ALTER TABLE public.user_permissions 
        ADD COLUMN can_view_project_financials BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_permissions' 
        AND column_name = 'can_approve_project_hours'
    ) THEN
        ALTER TABLE public.user_permissions 
        ADD COLUMN can_approve_project_hours BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_permissions' 
        AND column_name = 'can_approve_project_expenses'
    ) THEN
        ALTER TABLE public.user_permissions 
        ADD COLUMN can_approve_project_expenses BOOLEAN DEFAULT false;
    END IF;
END $$;

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE public.projects IS 'Projetos com controle de orçamento, tempo e rentabilidade';
COMMENT ON TABLE public.project_tasks IS 'Tarefas e subtarefas dos projetos';
COMMENT ON TABLE public.project_team IS 'Membros da equipe alocados aos projetos';
COMMENT ON TABLE public.project_time_entries IS 'Lançamentos de horas trabalhadas nos projetos';
COMMENT ON TABLE public.project_expenses IS 'Despesas diretas dos projetos';

COMMENT ON COLUMN public.user_permissions.can_view_projects IS 'Permite visualizar projetos';
COMMENT ON COLUMN public.user_permissions.can_manage_projects IS 'Permite criar e editar projetos';
COMMENT ON COLUMN public.user_permissions.can_delete_projects IS 'Permite excluir projetos';
COMMENT ON COLUMN public.user_permissions.can_view_project_financials IS 'Permite visualizar informações financeiras dos projetos';
COMMENT ON COLUMN public.user_permissions.can_approve_project_hours IS 'Permite aprovar lançamentos de horas';
COMMENT ON COLUMN public.user_permissions.can_approve_project_expenses IS 'Permite aprovar despesas de projetos';

-- =====================================================
-- ✅ INSTALAÇÃO LIMPA CONCLUÍDA!
-- =====================================================
