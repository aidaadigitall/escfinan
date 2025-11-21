-- Update handle_new_user to create default payment methods
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  
  -- Insert default categories for new user
  INSERT INTO public.categories (user_id, name, type) VALUES
    (NEW.id, 'Licença ou aluguel de softwares', 'expense'),
    (NEW.id, 'Pró Labore', 'expense'),
    (NEW.id, 'Alimentação', 'expense'),
    (NEW.id, 'Material para uso interno', 'expense'),
    (NEW.id, 'Compras', 'expense'),
    (NEW.id, 'Vendas', 'income'),
    (NEW.id, 'Serviços', 'income'),
    (NEW.id, 'Consultoria', 'income');
  
  -- Insert default payment methods for new user
  INSERT INTO public.payment_methods (user_id, name, is_active) VALUES
    (NEW.id, 'Pix', true),
    (NEW.id, 'Cartão de Crédito', true),
    (NEW.id, 'Cartão de Débito', true),
    (NEW.id, 'Boleto Bancário', true),
    (NEW.id, 'Dinheiro', true),
    (NEW.id, 'Transferência Bancária', true);
  
  RETURN NEW;
END;
$function$;