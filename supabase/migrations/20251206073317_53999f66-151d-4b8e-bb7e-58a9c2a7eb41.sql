
-- Create function to get effective owner_user_id (returns own id if admin, or owner_user_id if sub-user)
CREATE OR REPLACE FUNCTION public.get_effective_owner_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT owner_user_id FROM public.system_users WHERE user_id = _user_id),
    _user_id
  )
$$;

-- Create function to check if user can access data for a given user_id
CREATE OR REPLACE FUNCTION public.can_access_user_data(_data_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    auth.uid() = _data_user_id 
    OR 
    public.get_effective_owner_id(auth.uid()) = _data_user_id
    OR
    auth.uid() = public.get_effective_owner_id(_data_user_id)
$$;

-- Update RLS policies for bank_accounts
DROP POLICY IF EXISTS "Users can view their own bank accounts" ON public.bank_accounts;
DROP POLICY IF EXISTS "Users can create their own bank accounts" ON public.bank_accounts;
DROP POLICY IF EXISTS "Users can update their own bank accounts" ON public.bank_accounts;
DROP POLICY IF EXISTS "Users can delete their own bank accounts" ON public.bank_accounts;

CREATE POLICY "Users can view bank accounts" ON public.bank_accounts FOR SELECT USING (public.can_access_user_data(user_id));
CREATE POLICY "Users can create bank accounts" ON public.bank_accounts FOR INSERT WITH CHECK (public.can_access_user_data(user_id));
CREATE POLICY "Users can update bank accounts" ON public.bank_accounts FOR UPDATE USING (public.can_access_user_data(user_id));
CREATE POLICY "Users can delete bank accounts" ON public.bank_accounts FOR DELETE USING (public.can_access_user_data(user_id));

-- Update RLS policies for transactions
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can create their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete their own transactions" ON public.transactions;

CREATE POLICY "Users can view transactions" ON public.transactions FOR SELECT USING (public.can_access_user_data(user_id));
CREATE POLICY "Users can create transactions" ON public.transactions FOR INSERT WITH CHECK (public.can_access_user_data(user_id));
CREATE POLICY "Users can update transactions" ON public.transactions FOR UPDATE USING (public.can_access_user_data(user_id));
CREATE POLICY "Users can delete transactions" ON public.transactions FOR DELETE USING (public.can_access_user_data(user_id));

-- Update RLS policies for categories
DROP POLICY IF EXISTS "Users can view their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can create their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can update their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can delete their own categories" ON public.categories;

CREATE POLICY "Users can view categories" ON public.categories FOR SELECT USING (public.can_access_user_data(user_id));
CREATE POLICY "Users can create categories" ON public.categories FOR INSERT WITH CHECK (public.can_access_user_data(user_id));
CREATE POLICY "Users can update categories" ON public.categories FOR UPDATE USING (public.can_access_user_data(user_id));
CREATE POLICY "Users can delete categories" ON public.categories FOR DELETE USING (public.can_access_user_data(user_id));

-- Update RLS policies for clients
DROP POLICY IF EXISTS "Users can view their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can create their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can update their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can delete their own clients" ON public.clients;

CREATE POLICY "Users can view clients" ON public.clients FOR SELECT USING (public.can_access_user_data(user_id));
CREATE POLICY "Users can create clients" ON public.clients FOR INSERT WITH CHECK (public.can_access_user_data(user_id));
CREATE POLICY "Users can update clients" ON public.clients FOR UPDATE USING (public.can_access_user_data(user_id));
CREATE POLICY "Users can delete clients" ON public.clients FOR DELETE USING (public.can_access_user_data(user_id));

-- Update RLS policies for suppliers
DROP POLICY IF EXISTS "Users can view their own suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Users can create their own suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Users can update their own suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Users can delete their own suppliers" ON public.suppliers;

CREATE POLICY "Users can view suppliers" ON public.suppliers FOR SELECT USING (public.can_access_user_data(user_id));
CREATE POLICY "Users can create suppliers" ON public.suppliers FOR INSERT WITH CHECK (public.can_access_user_data(user_id));
CREATE POLICY "Users can update suppliers" ON public.suppliers FOR UPDATE USING (public.can_access_user_data(user_id));
CREATE POLICY "Users can delete suppliers" ON public.suppliers FOR DELETE USING (public.can_access_user_data(user_id));

-- Update RLS policies for products
DROP POLICY IF EXISTS "Users can view their own products" ON public.products;
DROP POLICY IF EXISTS "Users can create their own products" ON public.products;
DROP POLICY IF EXISTS "Users can update their own products" ON public.products;
DROP POLICY IF EXISTS "Users can delete their own products" ON public.products;

CREATE POLICY "Users can view products" ON public.products FOR SELECT USING (public.can_access_user_data(user_id));
CREATE POLICY "Users can create products" ON public.products FOR INSERT WITH CHECK (public.can_access_user_data(user_id));
CREATE POLICY "Users can update products" ON public.products FOR UPDATE USING (public.can_access_user_data(user_id));
CREATE POLICY "Users can delete products" ON public.products FOR DELETE USING (public.can_access_user_data(user_id));

-- Update RLS policies for services
DROP POLICY IF EXISTS "Users can view their own services" ON public.services;
DROP POLICY IF EXISTS "Users can create their own services" ON public.services;
DROP POLICY IF EXISTS "Users can update their own services" ON public.services;
DROP POLICY IF EXISTS "Users can delete their own services" ON public.services;

CREATE POLICY "Users can view services" ON public.services FOR SELECT USING (public.can_access_user_data(user_id));
CREATE POLICY "Users can create services" ON public.services FOR INSERT WITH CHECK (public.can_access_user_data(user_id));
CREATE POLICY "Users can update services" ON public.services FOR UPDATE USING (public.can_access_user_data(user_id));
CREATE POLICY "Users can delete services" ON public.services FOR DELETE USING (public.can_access_user_data(user_id));

-- Update RLS policies for employees
DROP POLICY IF EXISTS "Users can view their own employees" ON public.employees;
DROP POLICY IF EXISTS "Users can create their own employees" ON public.employees;
DROP POLICY IF EXISTS "Users can update their own employees" ON public.employees;
DROP POLICY IF EXISTS "Users can delete their own employees" ON public.employees;

CREATE POLICY "Users can view employees" ON public.employees FOR SELECT USING (public.can_access_user_data(user_id));
CREATE POLICY "Users can create employees" ON public.employees FOR INSERT WITH CHECK (public.can_access_user_data(user_id));
CREATE POLICY "Users can update employees" ON public.employees FOR UPDATE USING (public.can_access_user_data(user_id));
CREATE POLICY "Users can delete employees" ON public.employees FOR DELETE USING (public.can_access_user_data(user_id));

-- Update RLS policies for payment_methods
DROP POLICY IF EXISTS "Users can view their own payment methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Users can create their own payment methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Users can update their own payment methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Users can delete their own payment methods" ON public.payment_methods;

CREATE POLICY "Users can view payment methods" ON public.payment_methods FOR SELECT USING (public.can_access_user_data(user_id));
CREATE POLICY "Users can create payment methods" ON public.payment_methods FOR INSERT WITH CHECK (public.can_access_user_data(user_id));
CREATE POLICY "Users can update payment methods" ON public.payment_methods FOR UPDATE USING (public.can_access_user_data(user_id));
CREATE POLICY "Users can delete payment methods" ON public.payment_methods FOR DELETE USING (public.can_access_user_data(user_id));

-- Update RLS policies for cost_centers
DROP POLICY IF EXISTS "Users can view their own cost centers" ON public.cost_centers;
DROP POLICY IF EXISTS "Users can create their own cost centers" ON public.cost_centers;
DROP POLICY IF EXISTS "Users can update their own cost centers" ON public.cost_centers;
DROP POLICY IF EXISTS "Users can delete their own cost centers" ON public.cost_centers;

CREATE POLICY "Users can view cost centers" ON public.cost_centers FOR SELECT USING (public.can_access_user_data(user_id));
CREATE POLICY "Users can create cost centers" ON public.cost_centers FOR INSERT WITH CHECK (public.can_access_user_data(user_id));
CREATE POLICY "Users can update cost centers" ON public.cost_centers FOR UPDATE USING (public.can_access_user_data(user_id));
CREATE POLICY "Users can delete cost centers" ON public.cost_centers FOR DELETE USING (public.can_access_user_data(user_id));

-- Update RLS policies for chart_of_accounts
DROP POLICY IF EXISTS "Users can view their own chart of accounts" ON public.chart_of_accounts;
DROP POLICY IF EXISTS "Users can create their own chart of accounts" ON public.chart_of_accounts;
DROP POLICY IF EXISTS "Users can update their own chart of accounts" ON public.chart_of_accounts;
DROP POLICY IF EXISTS "Users can delete their own chart of accounts" ON public.chart_of_accounts;

CREATE POLICY "Users can view chart of accounts" ON public.chart_of_accounts FOR SELECT USING (public.can_access_user_data(user_id));
CREATE POLICY "Users can create chart of accounts" ON public.chart_of_accounts FOR INSERT WITH CHECK (public.can_access_user_data(user_id));
CREATE POLICY "Users can update chart of accounts" ON public.chart_of_accounts FOR UPDATE USING (public.can_access_user_data(user_id));
CREATE POLICY "Users can delete chart of accounts" ON public.chart_of_accounts FOR DELETE USING (public.can_access_user_data(user_id));

-- Update RLS policies for recurring_bills
DROP POLICY IF EXISTS "Users can view their own recurring bills" ON public.recurring_bills;
DROP POLICY IF EXISTS "Users can create their own recurring bills" ON public.recurring_bills;
DROP POLICY IF EXISTS "Users can update their own recurring bills" ON public.recurring_bills;
DROP POLICY IF EXISTS "Users can delete their own recurring bills" ON public.recurring_bills;

CREATE POLICY "Users can view recurring bills" ON public.recurring_bills FOR SELECT USING (public.can_access_user_data(user_id));
CREATE POLICY "Users can create recurring bills" ON public.recurring_bills FOR INSERT WITH CHECK (public.can_access_user_data(user_id));
CREATE POLICY "Users can update recurring bills" ON public.recurring_bills FOR UPDATE USING (public.can_access_user_data(user_id));
CREATE POLICY "Users can delete recurring bills" ON public.recurring_bills FOR DELETE USING (public.can_access_user_data(user_id));

-- Update RLS policies for credit_cards
DROP POLICY IF EXISTS "Users can view their own credit cards" ON public.credit_cards;
DROP POLICY IF EXISTS "Users can create their own credit cards" ON public.credit_cards;
DROP POLICY IF EXISTS "Users can update their own credit cards" ON public.credit_cards;
DROP POLICY IF EXISTS "Users can delete their own credit cards" ON public.credit_cards;

CREATE POLICY "Users can view credit cards" ON public.credit_cards FOR SELECT USING (public.can_access_user_data(user_id));
CREATE POLICY "Users can create credit cards" ON public.credit_cards FOR INSERT WITH CHECK (public.can_access_user_data(user_id));
CREATE POLICY "Users can update credit cards" ON public.credit_cards FOR UPDATE USING (public.can_access_user_data(user_id));
CREATE POLICY "Users can delete credit cards" ON public.credit_cards FOR DELETE USING (public.can_access_user_data(user_id));

-- Update RLS policies for credit_card_transactions
DROP POLICY IF EXISTS "Users can view their own card transactions" ON public.credit_card_transactions;
DROP POLICY IF EXISTS "Users can create their own card transactions" ON public.credit_card_transactions;
DROP POLICY IF EXISTS "Users can update their own card transactions" ON public.credit_card_transactions;
DROP POLICY IF EXISTS "Users can delete their own card transactions" ON public.credit_card_transactions;

CREATE POLICY "Users can view card transactions" ON public.credit_card_transactions FOR SELECT USING (public.can_access_user_data(user_id));
CREATE POLICY "Users can create card transactions" ON public.credit_card_transactions FOR INSERT WITH CHECK (public.can_access_user_data(user_id));
CREATE POLICY "Users can update card transactions" ON public.credit_card_transactions FOR UPDATE USING (public.can_access_user_data(user_id));
CREATE POLICY "Users can delete card transactions" ON public.credit_card_transactions FOR DELETE USING (public.can_access_user_data(user_id));

-- Update RLS policies for quotes
DROP POLICY IF EXISTS "Users can view their own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can create their own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can update their own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can delete their own quotes" ON public.quotes;

CREATE POLICY "Users can view quotes" ON public.quotes FOR SELECT USING (public.can_access_user_data(user_id));
CREATE POLICY "Users can create quotes" ON public.quotes FOR INSERT WITH CHECK (public.can_access_user_data(user_id));
CREATE POLICY "Users can update quotes" ON public.quotes FOR UPDATE USING (public.can_access_user_data(user_id));
CREATE POLICY "Users can delete quotes" ON public.quotes FOR DELETE USING (public.can_access_user_data(user_id));

-- Update RLS policies for quote_items
DROP POLICY IF EXISTS "Users can view their own quote items" ON public.quote_items;
DROP POLICY IF EXISTS "Users can create their own quote items" ON public.quote_items;
DROP POLICY IF EXISTS "Users can update their own quote items" ON public.quote_items;
DROP POLICY IF EXISTS "Users can delete their own quote items" ON public.quote_items;

CREATE POLICY "Users can view quote items" ON public.quote_items FOR SELECT USING (public.can_access_user_data(user_id));
CREATE POLICY "Users can create quote items" ON public.quote_items FOR INSERT WITH CHECK (public.can_access_user_data(user_id));
CREATE POLICY "Users can update quote items" ON public.quote_items FOR UPDATE USING (public.can_access_user_data(user_id));
CREATE POLICY "Users can delete quote items" ON public.quote_items FOR DELETE USING (public.can_access_user_data(user_id));

-- Update RLS policies for sales
DROP POLICY IF EXISTS "Users can view their own sales" ON public.sales;
DROP POLICY IF EXISTS "Users can create their own sales" ON public.sales;
DROP POLICY IF EXISTS "Users can update their own sales" ON public.sales;
DROP POLICY IF EXISTS "Users can delete their own sales" ON public.sales;

CREATE POLICY "Users can view sales" ON public.sales FOR SELECT USING (public.can_access_user_data(user_id));
CREATE POLICY "Users can create sales" ON public.sales FOR INSERT WITH CHECK (public.can_access_user_data(user_id));
CREATE POLICY "Users can update sales" ON public.sales FOR UPDATE USING (public.can_access_user_data(user_id));
CREATE POLICY "Users can delete sales" ON public.sales FOR DELETE USING (public.can_access_user_data(user_id));

-- Update RLS policies for sale_items
DROP POLICY IF EXISTS "Users can view their own sale items" ON public.sale_items;
DROP POLICY IF EXISTS "Users can create their own sale items" ON public.sale_items;
DROP POLICY IF EXISTS "Users can update their own sale items" ON public.sale_items;
DROP POLICY IF EXISTS "Users can delete their own sale items" ON public.sale_items;

CREATE POLICY "Users can view sale items" ON public.sale_items FOR SELECT USING (public.can_access_user_data(user_id));
CREATE POLICY "Users can create sale items" ON public.sale_items FOR INSERT WITH CHECK (public.can_access_user_data(user_id));
CREATE POLICY "Users can update sale items" ON public.sale_items FOR UPDATE USING (public.can_access_user_data(user_id));
CREATE POLICY "Users can delete sale items" ON public.sale_items FOR DELETE USING (public.can_access_user_data(user_id));

-- Update RLS policies for service_orders
DROP POLICY IF EXISTS "Users can view their own service orders" ON public.service_orders;
DROP POLICY IF EXISTS "Users can create their own service orders" ON public.service_orders;
DROP POLICY IF EXISTS "Users can update their own service orders" ON public.service_orders;
DROP POLICY IF EXISTS "Users can delete their own service orders" ON public.service_orders;

CREATE POLICY "Users can view service orders" ON public.service_orders FOR SELECT USING (public.can_access_user_data(user_id));
CREATE POLICY "Users can create service orders" ON public.service_orders FOR INSERT WITH CHECK (public.can_access_user_data(user_id));
CREATE POLICY "Users can update service orders" ON public.service_orders FOR UPDATE USING (public.can_access_user_data(user_id));
CREATE POLICY "Users can delete service orders" ON public.service_orders FOR DELETE USING (public.can_access_user_data(user_id));

-- Update RLS policies for service_order_items
DROP POLICY IF EXISTS "Users can view their own so items" ON public.service_order_items;
DROP POLICY IF EXISTS "Users can create their own so items" ON public.service_order_items;
DROP POLICY IF EXISTS "Users can update their own so items" ON public.service_order_items;
DROP POLICY IF EXISTS "Users can delete their own so items" ON public.service_order_items;

CREATE POLICY "Users can view so items" ON public.service_order_items FOR SELECT USING (public.can_access_user_data(user_id));
CREATE POLICY "Users can create so items" ON public.service_order_items FOR INSERT WITH CHECK (public.can_access_user_data(user_id));
CREATE POLICY "Users can update so items" ON public.service_order_items FOR UPDATE USING (public.can_access_user_data(user_id));
CREATE POLICY "Users can delete so items" ON public.service_order_items FOR DELETE USING (public.can_access_user_data(user_id));

-- Update RLS policies for tasks
DROP POLICY IF EXISTS "Users can view their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can create their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON public.tasks;

CREATE POLICY "Users can view tasks" ON public.tasks FOR SELECT USING (public.can_access_user_data(user_id));
CREATE POLICY "Users can create tasks" ON public.tasks FOR INSERT WITH CHECK (public.can_access_user_data(user_id));
CREATE POLICY "Users can update tasks" ON public.tasks FOR UPDATE USING (public.can_access_user_data(user_id));
CREATE POLICY "Users can delete tasks" ON public.tasks FOR DELETE USING (public.can_access_user_data(user_id));

-- Update RLS policies for stock_movements
DROP POLICY IF EXISTS "Users can view their own stock movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Users can create their own stock movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Users can update their own stock movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Users can delete their own stock movements" ON public.stock_movements;

CREATE POLICY "Users can view stock movements" ON public.stock_movements FOR SELECT USING (public.can_access_user_data(user_id));
CREATE POLICY "Users can create stock movements" ON public.stock_movements FOR INSERT WITH CHECK (public.can_access_user_data(user_id));
CREATE POLICY "Users can update stock movements" ON public.stock_movements FOR UPDATE USING (public.can_access_user_data(user_id));
CREATE POLICY "Users can delete stock movements" ON public.stock_movements FOR DELETE USING (public.can_access_user_data(user_id));

-- Update RLS policies for notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;

CREATE POLICY "Users can view notifications" ON public.notifications FOR SELECT USING (public.can_access_user_data(user_id));
CREATE POLICY "Users can update notifications" ON public.notifications FOR UPDATE USING (public.can_access_user_data(user_id));
CREATE POLICY "Users can delete notifications" ON public.notifications FOR DELETE USING (public.can_access_user_data(user_id));

-- Update RLS policies for statuses
DROP POLICY IF EXISTS "Users can view their own statuses" ON public.statuses;
DROP POLICY IF EXISTS "Users can create their own statuses" ON public.statuses;
DROP POLICY IF EXISTS "Users can update their own statuses" ON public.statuses;
DROP POLICY IF EXISTS "Users can delete their own statuses" ON public.statuses;

CREATE POLICY "Users can view statuses" ON public.statuses FOR SELECT USING (public.can_access_user_data(user_id));
CREATE POLICY "Users can create statuses" ON public.statuses FOR INSERT WITH CHECK (public.can_access_user_data(user_id));
CREATE POLICY "Users can update statuses" ON public.statuses FOR UPDATE USING (public.can_access_user_data(user_id));
CREATE POLICY "Users can delete statuses" ON public.statuses FOR DELETE USING (public.can_access_user_data(user_id));

-- Update RLS policies for profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can view profiles" ON public.profiles FOR SELECT USING (public.can_access_user_data(user_id));
CREATE POLICY "Users can update profiles" ON public.profiles FOR UPDATE USING (public.can_access_user_data(user_id));

-- Update RLS policies for system_settings
DROP POLICY IF EXISTS "Users can view their own system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Users can insert their own system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Users can update their own system settings" ON public.system_settings;

CREATE POLICY "Users can view system settings" ON public.system_settings FOR SELECT USING (public.can_access_user_data(user_id));
CREATE POLICY "Users can insert system settings" ON public.system_settings FOR INSERT WITH CHECK (public.can_access_user_data(user_id));
CREATE POLICY "Users can update system settings" ON public.system_settings FOR UPDATE USING (public.can_access_user_data(user_id));

-- Update RLS policies for company_settings
DROP POLICY IF EXISTS "Users can view their own company settings" ON public.company_settings;
DROP POLICY IF EXISTS "Users can create their own company settings" ON public.company_settings;
DROP POLICY IF EXISTS "Users can update their own company settings" ON public.company_settings;

CREATE POLICY "Users can view company settings" ON public.company_settings FOR SELECT USING (public.can_access_user_data(user_id));
CREATE POLICY "Users can create company settings" ON public.company_settings FOR INSERT WITH CHECK (public.can_access_user_data(user_id));
CREATE POLICY "Users can update company settings" ON public.company_settings FOR UPDATE USING (public.can_access_user_data(user_id));

-- Update RLS policies for bank_balance_audit
DROP POLICY IF EXISTS "Users can view their own balance audit" ON public.bank_balance_audit;

CREATE POLICY "Users can view balance audit" ON public.bank_balance_audit FOR SELECT USING (public.can_access_user_data(user_id));

-- Update RLS policies for transaction_status_history
DROP POLICY IF EXISTS "Users can view their own status history" ON public.transaction_status_history;
DROP POLICY IF EXISTS "Users can create status history" ON public.transaction_status_history;

CREATE POLICY "Users can view status history" ON public.transaction_status_history FOR SELECT USING (public.can_access_user_data(user_id));
CREATE POLICY "Users can create status history" ON public.transaction_status_history FOR INSERT WITH CHECK (public.can_access_user_data(user_id));
