-- Create user_permissions table for granular access control
CREATE TABLE IF NOT EXISTS public.user_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  owner_user_id UUID NOT NULL, -- The admin/owner who created this user
  
  -- Cadastros permissions
  can_view_clients BOOLEAN DEFAULT true,
  can_manage_clients BOOLEAN DEFAULT true,
  can_view_suppliers BOOLEAN DEFAULT true,
  can_manage_suppliers BOOLEAN DEFAULT true,
  can_view_products BOOLEAN DEFAULT true,
  can_manage_products BOOLEAN DEFAULT true,
  can_view_services BOOLEAN DEFAULT true,
  can_manage_services BOOLEAN DEFAULT true,
  can_view_employees BOOLEAN DEFAULT true,
  can_manage_employees BOOLEAN DEFAULT true,
  can_view_users BOOLEAN DEFAULT false,
  can_manage_users BOOLEAN DEFAULT false,
  
  -- Comercial permissions
  can_view_quotes BOOLEAN DEFAULT true,
  can_manage_quotes BOOLEAN DEFAULT true,
  can_view_sales BOOLEAN DEFAULT true,
  can_manage_sales BOOLEAN DEFAULT true,
  can_view_service_orders BOOLEAN DEFAULT true,
  can_manage_service_orders BOOLEAN DEFAULT true,
  
  -- Estoque permissions
  can_view_stock BOOLEAN DEFAULT true,
  can_manage_stock BOOLEAN DEFAULT true,
  can_view_stock_movements BOOLEAN DEFAULT true,
  can_manage_stock_movements BOOLEAN DEFAULT true,
  
  -- Financeiro permissions
  can_view_receivables BOOLEAN DEFAULT true,
  can_manage_receivables BOOLEAN DEFAULT true,
  can_view_payables BOOLEAN DEFAULT true,
  can_manage_payables BOOLEAN DEFAULT true,
  can_view_fixed_expenses BOOLEAN DEFAULT true,
  can_manage_fixed_expenses BOOLEAN DEFAULT true,
  can_view_fixed_income BOOLEAN DEFAULT true,
  can_manage_fixed_income BOOLEAN DEFAULT true,
  can_view_daily_entries BOOLEAN DEFAULT true,
  can_manage_daily_entries BOOLEAN DEFAULT true,
  can_view_dre BOOLEAN DEFAULT true,
  can_view_reports BOOLEAN DEFAULT true,
  can_view_cashflow BOOLEAN DEFAULT true,
  can_view_transfers BOOLEAN DEFAULT true,
  can_manage_transfers BOOLEAN DEFAULT true,
  can_view_cash BOOLEAN DEFAULT true,
  can_manage_cash BOOLEAN DEFAULT true,
  
  -- Configurações permissions
  can_view_categories BOOLEAN DEFAULT true,
  can_manage_categories BOOLEAN DEFAULT true,
  can_view_chart_of_accounts BOOLEAN DEFAULT true,
  can_manage_chart_of_accounts BOOLEAN DEFAULT true,
  can_view_cost_centers BOOLEAN DEFAULT true,
  can_manage_cost_centers BOOLEAN DEFAULT true,
  can_view_payment_methods BOOLEAN DEFAULT true,
  can_manage_payment_methods BOOLEAN DEFAULT true,
  can_view_bank_accounts BOOLEAN DEFAULT true,
  can_manage_bank_accounts BOOLEAN DEFAULT true,
  can_view_credit_cards BOOLEAN DEFAULT true,
  can_manage_credit_cards BOOLEAN DEFAULT true,
  can_view_settings BOOLEAN DEFAULT false,
  can_manage_settings BOOLEAN DEFAULT false,
  
  -- Tasks and Calendar
  can_view_tasks BOOLEAN DEFAULT true,
  can_manage_tasks BOOLEAN DEFAULT true,
  can_view_calendar BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own permissions" 
ON public.user_permissions 
FOR SELECT 
USING (auth.uid() = user_id OR auth.uid() = owner_user_id);

CREATE POLICY "Owners can manage permissions for their users" 
ON public.user_permissions 
FOR ALL 
USING (auth.uid() = owner_user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_permissions_updated_at
BEFORE UPDATE ON public.user_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add owner_user_id to system_users to track who created the user
ALTER TABLE public.system_users 
ADD COLUMN IF NOT EXISTS owner_user_id UUID;