-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'gerente', 'usuario');

-- Create user_roles table for permissions
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'usuario',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create products table with pricing fields
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT,
  unit TEXT DEFAULT 'UN',
  cost_price NUMERIC NOT NULL DEFAULT 0,
  sale_price NUMERIC NOT NULL DEFAULT 0,
  profit_margin NUMERIC GENERATED ALWAYS AS (CASE WHEN cost_price > 0 THEN ((sale_price - cost_price) / cost_price) * 100 ELSE 0 END) STORED,
  markup NUMERIC GENERATED ALWAYS AS (CASE WHEN cost_price > 0 THEN ((sale_price - cost_price) / cost_price) * 100 ELSE 0 END) STORED,
  profit_amount NUMERIC GENERATED ALWAYS AS (sale_price - cost_price) STORED,
  stock_quantity NUMERIC NOT NULL DEFAULT 0,
  min_stock NUMERIC DEFAULT 0,
  category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own products" ON public.products FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own products" ON public.products FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own products" ON public.products FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own products" ON public.products FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create services table
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  cost_price NUMERIC NOT NULL DEFAULT 0,
  sale_price NUMERIC NOT NULL DEFAULT 0,
  estimated_hours NUMERIC,
  category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own services" ON public.services FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own services" ON public.services FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own services" ON public.services FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own services" ON public.services FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create tasks table (Todoist style)
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  due_time TIME,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  responsible_id UUID,
  labels TEXT[],
  reminder_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_type TEXT,
  parent_task_id UUID REFERENCES public.tasks(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own tasks" ON public.tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own tasks" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tasks" ON public.tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tasks" ON public.tasks FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create quotes (orçamentos) table
CREATE TABLE public.quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  quote_number SERIAL,
  client_id UUID REFERENCES public.clients(id),
  seller_id UUID,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'approved', 'rejected', 'expired')),
  validity_days INTEGER DEFAULT 3,
  delivery_date DATE,
  products_total NUMERIC DEFAULT 0,
  services_total NUMERIC DEFAULT 0,
  discount_total NUMERIC DEFAULT 0,
  total_amount NUMERIC DEFAULT 0,
  notes TEXT,
  internal_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own quotes" ON public.quotes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own quotes" ON public.quotes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own quotes" ON public.quotes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own quotes" ON public.quotes FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON public.quotes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create quote items table
CREATE TABLE public.quote_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('product', 'service')),
  product_id UUID REFERENCES public.products(id),
  service_id UUID REFERENCES public.services(id),
  name TEXT NOT NULL,
  unit TEXT DEFAULT 'UN',
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  subtotal NUMERIC GENERATED ALWAYS AS ((quantity * unit_price) - discount) STORED,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own quote items" ON public.quote_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own quote items" ON public.quote_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own quote items" ON public.quote_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own quote items" ON public.quote_items FOR DELETE USING (auth.uid() = user_id);

-- Create service orders table
CREATE TABLE public.service_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  order_number SERIAL,
  client_id UUID REFERENCES public.clients(id),
  technician_id UUID,
  responsible_id UUID,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'waiting_parts', 'completed', 'delivered', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  entry_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  exit_date TIMESTAMP WITH TIME ZONE,
  equipment_name TEXT,
  equipment_brand TEXT,
  equipment_model TEXT,
  equipment_serial TEXT,
  equipment_memory TEXT,
  equipment_storage TEXT,
  equipment_processor TEXT,
  defects TEXT,
  technical_report TEXT,
  warranty_terms TEXT,
  products_total NUMERIC DEFAULT 0,
  services_total NUMERIC DEFAULT 0,
  discount_total NUMERIC DEFAULT 0,
  total_amount NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own service orders" ON public.service_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own service orders" ON public.service_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own service orders" ON public.service_orders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own service orders" ON public.service_orders FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_service_orders_updated_at BEFORE UPDATE ON public.service_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create service order items table
CREATE TABLE public.service_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  service_order_id UUID NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('product', 'service')),
  product_id UUID REFERENCES public.products(id),
  service_id UUID REFERENCES public.services(id),
  name TEXT NOT NULL,
  unit TEXT DEFAULT 'UN',
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  subtotal NUMERIC GENERATED ALWAYS AS ((quantity * unit_price) - discount) STORED,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.service_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own so items" ON public.service_order_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own so items" ON public.service_order_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own so items" ON public.service_order_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own so items" ON public.service_order_items FOR DELETE USING (auth.uid() = user_id);

-- Create sales table
CREATE TABLE public.sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sale_number SERIAL,
  client_id UUID REFERENCES public.clients(id),
  seller_id UUID,
  quote_id UUID REFERENCES public.quotes(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'delivered', 'cancelled')),
  sale_date DATE DEFAULT CURRENT_DATE,
  delivery_date DATE,
  products_total NUMERIC DEFAULT 0,
  services_total NUMERIC DEFAULT 0,
  discount_total NUMERIC DEFAULT 0,
  total_amount NUMERIC DEFAULT 0,
  payment_method TEXT,
  notes TEXT,
  warranty_terms TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own sales" ON public.sales FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own sales" ON public.sales FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own sales" ON public.sales FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own sales" ON public.sales FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON public.sales FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create sale items table
CREATE TABLE public.sale_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('product', 'service')),
  product_id UUID REFERENCES public.products(id),
  service_id UUID REFERENCES public.services(id),
  name TEXT NOT NULL,
  unit TEXT DEFAULT 'UN',
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  subtotal NUMERIC GENERATED ALWAYS AS ((quantity * unit_price) - discount) STORED,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own sale items" ON public.sale_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own sale items" ON public.sale_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own sale items" ON public.sale_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own sale items" ON public.sale_items FOR DELETE USING (auth.uid() = user_id);

-- Create stock movements table
CREATE TABLE public.stock_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id),
  movement_type TEXT NOT NULL CHECK (movement_type IN ('entry', 'exit', 'adjustment', 'sale', 'purchase', 'return')),
  quantity NUMERIC NOT NULL,
  unit_cost NUMERIC,
  reference_type TEXT,
  reference_id UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own stock movements" ON public.stock_movements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own stock movements" ON public.stock_movements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own stock movements" ON public.stock_movements FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own stock movements" ON public.stock_movements FOR DELETE USING (auth.uid() = user_id);

-- Create company_settings table for company data
CREATE TABLE public.company_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  company_name TEXT,
  trading_name TEXT,
  cnpj TEXT,
  ie TEXT,
  im TEXT,
  phone TEXT,
  phone2 TEXT,
  email TEXT,
  website TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zipcode TEXT,
  logo_header_url TEXT,
  logo_sidebar_url TEXT,
  warranty_terms TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own company settings" ON public.company_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own company settings" ON public.company_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own company settings" ON public.company_settings FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_company_settings_updated_at BEFORE UPDATE ON public.company_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add document_type column to clients and suppliers
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS document_type TEXT DEFAULT 'cpf' CHECK (document_type IN ('cpf', 'cnpj'));
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS document_type TEXT DEFAULT 'cnpj' CHECK (document_type IN ('cpf', 'cnpj'));