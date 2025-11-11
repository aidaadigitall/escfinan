-- Corrigir a função update_bank_balance para usar amount quando paid_amount é 0 ou null
CREATE OR REPLACE FUNCTION public.update_bank_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  old_amount numeric := 0;
  new_amount numeric := 0;
  old_value numeric := 0;
  new_value numeric := 0;
BEGIN
  -- Calculate old amount to reverse
  IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
    IF OLD.bank_account_id IS NOT NULL AND OLD.status IN ('paid', 'received', 'confirmed') THEN
      -- Use paid_amount if > 0, otherwise use amount
      old_value := CASE 
        WHEN OLD.paid_amount IS NOT NULL AND OLD.paid_amount > 0 THEN OLD.paid_amount 
        ELSE OLD.amount 
      END;
      
      IF OLD.type = 'expense' THEN
        old_amount := -old_value;
      ELSE
        old_amount := old_value;
      END IF;
      
      -- Reverse old balance
      UPDATE bank_accounts
      SET current_balance = current_balance - old_amount
      WHERE id = OLD.bank_account_id;
    END IF;
  END IF;

  -- Calculate new amount to apply
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.bank_account_id IS NOT NULL AND NEW.status IN ('paid', 'received', 'confirmed') THEN
      -- Use paid_amount if > 0, otherwise use amount
      new_value := CASE 
        WHEN NEW.paid_amount IS NOT NULL AND NEW.paid_amount > 0 THEN NEW.paid_amount 
        ELSE NEW.amount 
      END;
      
      IF NEW.type = 'expense' THEN
        new_amount := -new_value;
      ELSE
        new_amount := new_value;
      END IF;
      
      -- Apply new balance
      UPDATE bank_accounts
      SET current_balance = current_balance + new_amount
      WHERE id = NEW.bank_account_id;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  
  RETURN NEW;
END;
$function$;