-- =====================================================
-- GESTÃO DE PROJETOS - TABELAS PRINCIPAIS
-- =====================================================
-- Criado em: 2025-12-11
-- Descrição: Sistema completo de gestão de projetos com
--            controle de tempo, despesas e rentabilidade
-- =====================================================

-- =====================================================
-- 1. TABELA: projects
-- =====================================================
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identificação
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE,
    description TEXT,
    
    -- Cliente e Negócio
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    project_type VARCHAR(50), -- 'fixed_price', 'time_material', 'retainer', 'internal'
    
    -- Financeiro
    budget_amount DECIMAL(15,2) DEFAULT 0,
    budget_hours DECIMAL(10,2) DEFAULT 0,
    hourly_rate DECIMAL(10,2),
    
    -- Datas
    start_date DATE,
    expected_end_date DATE,
    actual_end_date DATE,
    
    -- Status e Progresso
    status VARCHAR(50) DEFAULT 'planning', -- 'planning', 'active', 'on_hold', 'completed', 'cancelled'
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    
    -- Responsáveis
    project_manager_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Controle de acesso
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Metadados
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT projects_dates_check CHECK (
        (start_date IS NULL OR expected_end_date IS NULL) OR 
        (start_date <= expected_end_date)
    )
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_owner_user_id ON public.projects(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON public.projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_project_manager_id ON public.projects(project_manager_id);
CREATE INDEX IF NOT EXISTS idx_projects_start_date ON public.projects(start_date);
CREATE INDEX IF NOT EXISTS idx_projects_code ON public.projects(code);

-- =====================================================
-- 2. TABELA: project_tasks
-- =====================================================
CREATE TABLE IF NOT EXISTS public.project_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relacionamento
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    parent_task_id UUID REFERENCES public.project_tasks(id) ON DELETE CASCADE,
    
    -- Identificação
    title VARCHAR(255) NOT NULL,
    description TEXT,
    task_number INTEGER,
    
    -- Planejamento
    estimated_hours DECIMAL(10,2) DEFAULT 0,
    actual_hours DECIMAL(10,2) DEFAULT 0,
    
    -- Datas
    start_date DATE,
    due_date DATE,
    completed_date DATE,
    
    -- Status e Progresso
    status VARCHAR(50) DEFAULT 'todo', -- 'todo', 'in_progress', 'review', 'completed', 'blocked'
    priority VARCHAR(20) DEFAULT 'medium',
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    
    -- Responsável
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Controle de acesso
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Metadados
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_project_tasks_project_id ON public.project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_parent_task_id ON public.project_tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_assigned_to ON public.project_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_project_tasks_status ON public.project_tasks(status);
CREATE INDEX IF NOT EXISTS idx_project_tasks_user_id ON public.project_tasks(user_id);

-- =====================================================
-- 3. TABELA: project_team
-- =====================================================
CREATE TABLE IF NOT EXISTS public.project_team (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relacionamento
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Função no projeto
    role VARCHAR(100), -- 'manager', 'developer', 'designer', 'qa', 'analyst', etc
    hourly_rate DECIMAL(10,2),
    allocated_hours DECIMAL(10,2) DEFAULT 0,
    
    -- Permissões
    can_edit_project BOOLEAN DEFAULT false,
    can_manage_tasks BOOLEAN DEFAULT false,
    can_view_financials BOOLEAN DEFAULT false,
    
    -- Período
    start_date DATE,
    end_date DATE,
    
    -- Controle
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Metadados
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(project_id, user_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_project_team_project_id ON public.project_team(project_id);
CREATE INDEX IF NOT EXISTS idx_project_team_user_id ON public.project_team(user_id);
CREATE INDEX IF NOT EXISTS idx_project_team_owner_user_id ON public.project_team(owner_user_id);

-- =====================================================
-- 4. TABELA: project_time_entries
-- =====================================================
CREATE TABLE IF NOT EXISTS public.project_time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relacionamento
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    task_id UUID REFERENCES public.project_tasks(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Tempo
    date DATE NOT NULL,
    hours DECIMAL(10,2) NOT NULL CHECK (hours > 0),
    description TEXT,
    
    -- Faturamento
    is_billable BOOLEAN DEFAULT true,
    hourly_rate DECIMAL(10,2),
    amount DECIMAL(15,2) GENERATED ALWAYS AS (hours * COALESCE(hourly_rate, 0)) STORED,
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'billed'
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    
    -- Controle
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Metadados
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_project_time_entries_project_id ON public.project_time_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_project_time_entries_task_id ON public.project_time_entries(task_id);
CREATE INDEX IF NOT EXISTS idx_project_time_entries_user_id ON public.project_time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_project_time_entries_date ON public.project_time_entries(date);
CREATE INDEX IF NOT EXISTS idx_project_time_entries_status ON public.project_time_entries(status);
CREATE INDEX IF NOT EXISTS idx_project_time_entries_owner_user_id ON public.project_time_entries(owner_user_id);

-- =====================================================
-- 5. TABELA: project_expenses
-- =====================================================
CREATE TABLE IF NOT EXISTS public.project_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relacionamento
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
    
    -- Despesa
    description TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL CHECK (amount >= 0),
    expense_date DATE NOT NULL,
    
    -- Categoria
    expense_type VARCHAR(50), -- 'material', 'service', 'travel', 'equipment', 'software', 'other'
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    
    -- Faturamento
    is_billable BOOLEAN DEFAULT false,
    is_billed BOOLEAN DEFAULT false,
    markup_percentage DECIMAL(5,2) DEFAULT 0,
    billable_amount DECIMAL(15,2) GENERATED ALWAYS AS (amount * (1 + COALESCE(markup_percentage, 0) / 100)) STORED,
    
    -- Comprovante
    receipt_url TEXT,
    notes TEXT,
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'reimbursed'
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    
    -- Controle
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Metadados
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_project_expenses_project_id ON public.project_expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_project_expenses_transaction_id ON public.project_expenses(transaction_id);
CREATE INDEX IF NOT EXISTS idx_project_expenses_expense_date ON public.project_expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_project_expenses_status ON public.project_expenses(status);
CREATE INDEX IF NOT EXISTS idx_project_expenses_user_id ON public.project_expenses(user_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

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

-- Project Tasks
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;

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

-- Project Team
ALTER TABLE public.project_team ENABLE ROW LEVEL SECURITY;

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

-- Project Time Entries
ALTER TABLE public.project_time_entries ENABLE ROW LEVEL SECURITY;

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

-- Project Expenses
ALTER TABLE public.project_expenses ENABLE ROW LEVEL SECURITY;

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
-- TRIGGERS
-- =====================================================

-- Trigger para updated_at em projects
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para updated_at em project_tasks
CREATE TRIGGER update_project_tasks_updated_at
    BEFORE UPDATE ON public.project_tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para updated_at em project_team
CREATE TRIGGER update_project_team_updated_at
    BEFORE UPDATE ON public.project_team
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para updated_at em project_time_entries
CREATE TRIGGER update_project_time_entries_updated_at
    BEFORE UPDATE ON public.project_time_entries
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para updated_at em project_expenses
CREATE TRIGGER update_project_expenses_updated_at
    BEFORE UPDATE ON public.project_expenses
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

-- Função para calcular horas totais trabalhadas no projeto
CREATE OR REPLACE FUNCTION get_project_total_hours(project_uuid UUID)
RETURNS DECIMAL AS $$
BEGIN
    RETURN COALESCE(
        (SELECT SUM(hours) FROM public.project_time_entries WHERE project_id = project_uuid),
        0
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- Função para calcular total de despesas do projeto
CREATE OR REPLACE FUNCTION get_project_total_expenses(project_uuid UUID)
RETURNS DECIMAL AS $$
BEGIN
    RETURN COALESCE(
        (SELECT SUM(amount) FROM public.project_expenses WHERE project_id = project_uuid),
        0
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- Função para calcular margem do projeto
CREATE OR REPLACE FUNCTION get_project_margin(project_uuid UUID)
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
-- COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE public.projects IS 'Projetos com controle de orçamento, tempo e rentabilidade';
COMMENT ON TABLE public.project_tasks IS 'Tarefas e subtarefas dos projetos';
COMMENT ON TABLE public.project_team IS 'Membros da equipe alocados aos projetos';
COMMENT ON TABLE public.project_time_entries IS 'Lançamentos de horas trabalhadas nos projetos';
COMMENT ON TABLE public.project_expenses IS 'Despesas diretas dos projetos';
