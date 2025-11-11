-- Fix function search path for security - drop trigger first
DROP TRIGGER IF EXISTS trigger_update_bank_balance ON public.transactions;
DROP FUNCTION IF EXISTS public.update_bank_balance();

CREATE OR REPLACE FUNCTION public.update_bank_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_amount numeric := 0;
  new_amount numeric := 0;
BEGIN
  -- Calculate old amount to reverse
  IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
    IF OLD.bank_account_id IS NOT NULL AND OLD.status IN ('paid', 'received', 'confirmed') THEN
      IF OLD.type = 'expense' THEN
        old_amount := -COALESCE(OLD.paid_amount, OLD.amount);
      ELSE
        old_amount := COALESCE(OLD.paid_amount, OLD.amount);
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
      IF NEW.type = 'expense' THEN
        new_amount := -COALESCE(NEW.paid_amount, NEW.amount);
      ELSE
        new_amount := COALESCE(NEW.paid_amount, NEW.amount);
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
$$;

-- Recreate trigger with the fixed function
CREATE TRIGGER trigger_update_bank_balance
AFTER INSERT OR UPDATE OR DELETE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_bank_balance();