-- ====================================
-- SCRIPT COMPLETO DE MIGRAÇÃO SUPABASE
-- ====================================
-- Este script consolida TODAS as migrações do sistema
-- Execute no SQL Editor do Supabase
-- ====================================

-- IMPORTANTE: Este script deve ser executado em um banco VAZIO
-- Se houver tabelas, pode gerar erros de "already exists"

-- ====================================
-- ETAPA 1: FUNÇÕES AUXILIARES
-- ====================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ====================================
-- ETAPA 2: TABELAS BASE
-- ====================================

-- Tabela: profiles (usuários base)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- Tabela: categories (receitas/despesas)
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
  description TEXT,
  color VARCHAR(20),
  icon VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own categories"
ON public.categories FOR ALL
USING (auth.uid() = user_id);

-- Tabela: bank_accounts
CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  bank_name VARCHAR(255),
  account_number VARCHAR(50),
  agency VARCHAR(50),
  initial_balance DECIMAL(15, 2) DEFAULT 0,
  current_balance DECIMAL(15, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own bank accounts"
ON public.bank_accounts FOR ALL
USING (auth.uid() = user_id);

-- Tabela: payment_methods
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own payment methods"
ON public.payment_methods FOR ALL
USING (auth.uid() = user_id);

-- Tabela: statuses
CREATE TABLE IF NOT EXISTS public.statuses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL,
  color VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.statuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own statuses"
ON public.statuses FOR ALL
USING (auth.uid() = user_id);

-- Tabela: cost_centers
CREATE TABLE IF NOT EXISTS public.cost_centers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own cost centers"
ON public.cost_centers FOR ALL
USING (auth.uid() = user_id);

-- Tabela: suppliers
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  document VARCHAR(20),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(2),
  zip_code VARCHAR(10),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own suppliers"
ON public.suppliers FOR ALL
USING (auth.uid() = user_id);

-- Tabela: clients
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  document VARCHAR(20),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(2),
  zip_code VARCHAR(10),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own clients"
ON public.clients FOR ALL
USING (auth.uid() = user_id);

-- Tabela: transactions (receitas/despesas)
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
  description TEXT NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  date DATE NOT NULL,
  due_date DATE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  bank_account_id UUID REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
  payment_method_id UUID REFERENCES public.payment_methods(id) ON DELETE SET NULL,
  cost_center_id UUID REFERENCES public.cost_centers(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'pending',
  notes TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_frequency VARCHAR(20),
  attachment_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own transactions"
ON public.transactions FOR ALL
USING (auth.uid() = user_id);

-- Tabela: recurring_bills
CREATE TABLE IF NOT EXISTS public.recurring_bills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
  description TEXT NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  frequency VARCHAR(20) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  payment_method_id UUID REFERENCES public.payment_methods(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.recurring_bills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own recurring bills"
ON public.recurring_bills FOR ALL
USING (auth.uid() = user_id);

-- Tabela: credit_cards
CREATE TABLE IF NOT EXISTS public.credit_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  bank_name VARCHAR(255),
  last_four_digits VARCHAR(4),
  card_limit DECIMAL(15, 2),
  closing_day INTEGER,
  due_day INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own credit cards"
ON public.credit_cards FOR ALL
USING (auth.uid() = user_id);

-- ====================================
-- ETAPA 3: SISTEMA DE PERMISSÕES
-- ====================================

-- Tabela: user_permissions
CREATE TABLE IF NOT EXISTS public.user_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Permissões financeiras
  can_view_receivables BOOLEAN DEFAULT true,
  can_edit_receivables BOOLEAN DEFAULT true,
  can_delete_receivables BOOLEAN DEFAULT false,
  can_view_payables BOOLEAN DEFAULT true,
  can_edit_payables BOOLEAN DEFAULT true,
  can_delete_payables BOOLEAN DEFAULT false,
  can_view_cashflow BOOLEAN DEFAULT true,
  can_view_transfers BOOLEAN DEFAULT true,
  can_view_cash BOOLEAN DEFAULT true,
  can_view_dre BOOLEAN DEFAULT true,
  can_view_reports BOOLEAN DEFAULT true,
  can_view_calendar BOOLEAN DEFAULT true,
  can_view_fixed_expenses BOOLEAN DEFAULT true,
  can_view_fixed_income BOOLEAN DEFAULT true,
  can_view_daily_entries BOOLEAN DEFAULT true,
  
  -- Permissões de cadastros
  can_view_clients BOOLEAN DEFAULT true,
  can_edit_clients BOOLEAN DEFAULT true,
  can_delete_clients BOOLEAN DEFAULT false,
  can_view_suppliers BOOLEAN DEFAULT true,
  can_edit_suppliers BOOLEAN DEFAULT true,
  can_delete_suppliers BOOLEAN DEFAULT false,
  can_view_employees BOOLEAN DEFAULT true,
  can_view_products BOOLEAN DEFAULT true,
  can_view_services BOOLEAN DEFAULT true,
  can_view_users BOOLEAN DEFAULT false,
  
  -- Permissões comerciais
  can_view_quotes BOOLEAN DEFAULT true,
  can_view_service_orders BOOLEAN DEFAULT true,
  can_view_sales BOOLEAN DEFAULT true,
  
  -- Permissões auxiliares
  can_view_bank_accounts BOOLEAN DEFAULT true,
  can_view_credit_cards BOOLEAN DEFAULT true,
  can_view_payment_methods BOOLEAN DEFAULT true,
  can_view_cost_centers BOOLEAN DEFAULT true,
  can_view_categories BOOLEAN DEFAULT true,
  can_view_chart_of_accounts BOOLEAN DEFAULT true,
  can_view_stock_movements BOOLEAN DEFAULT true,
  
  -- Permissões de tarefas
  can_view_tasks BOOLEAN DEFAULT true,
  can_edit_tasks BOOLEAN DEFAULT true,
  can_delete_tasks BOOLEAN DEFAULT false,
  
  -- Permissões de configurações
  can_view_settings BOOLEAN DEFAULT false,
  can_view_dashboard_values BOOLEAN DEFAULT true,
  
  -- Permissões administrativas
  can_manage_users BOOLEAN DEFAULT false,
  can_manage_employees BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own permissions"
ON public.user_permissions FOR SELECT
USING (auth.uid() = user_id);

-- ====================================
-- ETAPA 4: TABELAS DO CRM
-- ====================================

-- Adicionar permissões de CRM
ALTER TABLE public.user_permissions ADD COLUMN IF NOT EXISTS can_view_crm BOOLEAN DEFAULT true;
ALTER TABLE public.user_permissions ADD COLUMN IF NOT EXISTS can_manage_crm BOOLEAN DEFAULT false;
ALTER TABLE public.user_permissions ADD COLUMN IF NOT EXISTS can_delete_leads BOOLEAN DEFAULT false;

-- Tabela: pipeline_stages
CREATE TABLE IF NOT EXISTS public.pipeline_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  probability_default DECIMAL(5, 2) DEFAULT 0,
  color VARCHAR(20) DEFAULT '#3B82F6',
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own pipeline stages"
ON public.pipeline_stages FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pipeline stages"
ON public.pipeline_stages FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pipeline stages"
ON public.pipeline_stages FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pipeline stages"
ON public.pipeline_stages FOR DELETE
USING (auth.uid() = user_id AND is_system = false);

-- Tabela: leads
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_user_id UUID REFERENCES auth.users(id),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  company VARCHAR(255),
  position VARCHAR(100),
  source VARCHAR(50) DEFAULT 'manual',
  source_details TEXT,
  pipeline_stage_id UUID REFERENCES public.pipeline_stages(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'new',
  score INTEGER DEFAULT 0,
  expected_value DECIMAL(15, 2),
  probability DECIMAL(5, 2),
  expected_close_date DATE,
  lost_reason TEXT,
  lost_date TIMESTAMP WITH TIME ZONE,
  converted_to_client BOOLEAN DEFAULT false,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  converted_at TIMESTAMP WITH TIME ZONE,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  first_contact_date TIMESTAMP WITH TIME ZONE,
  last_contact_date TIMESTAMP WITH TIME ZONE,
  last_activity_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own leads or assigned leads"
ON public.leads FOR SELECT
USING (auth.uid() = user_id OR auth.uid() = assigned_to OR auth.uid() = owner_user_id);

CREATE POLICY "Users can insert their own leads"
ON public.leads FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leads or assigned leads"
ON public.leads FOR UPDATE
USING (auth.uid() = user_id OR auth.uid() = assigned_to);

CREATE POLICY "Users can delete their own leads"
ON public.leads FOR DELETE
USING (auth.uid() = user_id);

-- Tabela: lead_activities
CREATE TABLE IF NOT EXISTS public.lead_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  outcome VARCHAR(50),
  outcome_notes TEXT,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  is_completed BOOLEAN DEFAULT false,
  duration_minutes INTEGER,
  attachments JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view activities of their leads"
ON public.lead_activities FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.leads
    WHERE leads.id = lead_activities.lead_id
    AND (leads.user_id = auth.uid() OR leads.assigned_to = auth.uid())
  )
);

CREATE POLICY "Users can insert activities for their leads"
ON public.lead_activities FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.leads
    WHERE leads.id = lead_activities.lead_id
    AND (leads.user_id = auth.uid() OR leads.assigned_to = auth.uid())
  )
);

CREATE POLICY "Users can update their own activities"
ON public.lead_activities FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activities"
ON public.lead_activities FOR DELETE
USING (auth.uid() = user_id);

-- ====================================
-- ETAPA 5: TRIGGERS
-- ====================================

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bank_accounts_updated_at
BEFORE UPDATE ON public.bank_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at
BEFORE UPDATE ON public.suppliers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
BEFORE UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_recurring_bills_updated_at
BEFORE UPDATE ON public.recurring_bills
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_credit_cards_updated_at
BEFORE UPDATE ON public.credit_cards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_permissions_updated_at
BEFORE UPDATE ON public.user_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pipeline_stages_updated_at
BEFORE UPDATE ON public.pipeline_stages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lead_activities_updated_at
BEFORE UPDATE ON public.lead_activities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ====================================
-- ETAPA 6: ÍNDICES PARA PERFORMANCE
-- ====================================

CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_type ON public.categories(type);

CREATE INDEX IF NOT EXISTS idx_bank_accounts_user_id ON public.bank_accounts(user_id);

CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);

CREATE INDEX IF NOT EXISTS idx_suppliers_user_id ON public.suppliers(user_id);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);

CREATE INDEX IF NOT EXISTS idx_pipeline_stages_user_id ON public.pipeline_stages(user_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_order ON public.pipeline_stages("order");

CREATE INDEX IF NOT EXISTS idx_leads_user_id ON public.leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON public.leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_pipeline_stage_id ON public.leads(pipeline_stage_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_expected_close_date ON public.leads(expected_close_date);
CREATE INDEX IF NOT EXISTS idx_leads_client_id ON public.leads(client_id);

CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON public.lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_user_id ON public.lead_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_scheduled_for ON public.lead_activities(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_lead_activities_type ON public.lead_activities(type);

-- ====================================
-- ETAPA 7: DADOS INICIAIS
-- ====================================

-- Função para criar estágios padrão do CRM para novos usuários
CREATE OR REPLACE FUNCTION create_default_pipeline_stages()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.pipeline_stages (user_id, name, description, "order", probability_default, color, is_system)
  VALUES
    (NEW.id, 'Novo Lead', 'Leads recém-capturados que ainda não foram contatados', 1, 10, '#6B7280', true),
    (NEW.id, 'Contato Inicial', 'Primeiro contato realizado, aguardando qualificação', 2, 20, '#3B82F6', true),
    (NEW.id, 'Qualificado', 'Lead qualificado com potencial de compra', 3, 40, '#8B5CF6', true),
    (NEW.id, 'Proposta Enviada', 'Proposta comercial enviada ao lead', 4, 60, '#F59E0B', true),
    (NEW.id, 'Negociação', 'Em negociação de valores e condições', 5, 80, '#EF4444', true),
    (NEW.id, 'Ganho', 'Negócio fechado com sucesso', 6, 100, '#10B981', true),
    (NEW.id, 'Perdido', 'Oportunidade perdida', 7, 0, '#DC2626', true);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar estágios padrão automaticamente
DROP TRIGGER IF EXISTS create_default_pipeline_stages_trigger ON auth.users;
CREATE TRIGGER create_default_pipeline_stages_trigger
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_default_pipeline_stages();

-- Inserir estágios padrão para usuários existentes
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT id FROM auth.users 
    WHERE NOT EXISTS (
      SELECT 1 FROM public.pipeline_stages WHERE user_id = auth.users.id
    )
  LOOP
    INSERT INTO public.pipeline_stages (user_id, name, description, "order", probability_default, color, is_system)
    VALUES
      (user_record.id, 'Novo Lead', 'Leads recém-capturados que ainda não foram contatados', 1, 10, '#6B7280', true),
      (user_record.id, 'Contato Inicial', 'Primeiro contato realizado, aguardando qualificação', 2, 20, '#3B82F6', true),
      (user_record.id, 'Qualificado', 'Lead qualificado com potencial de compra', 3, 40, '#8B5CF6', true),
      (user_record.id, 'Proposta Enviada', 'Proposta comercial enviada ao lead', 4, 60, '#F59E0B', true),
      (user_record.id, 'Negociação', 'Em negociação de valores e condições', 5, 80, '#EF4444', true),
      (user_record.id, 'Ganho', 'Negócio fechado com sucesso', 6, 100, '#10B981', true),
      (user_record.id, 'Perdido', 'Oportunidade perdida', 7, 0, '#DC2626', true);
  END LOOP;
END $$;

-- ====================================
-- SCRIPT CONCLUÍDO!
-- ====================================
-- Todas as tabelas foram criadas
-- CRM está pronto para uso
-- ====================================
