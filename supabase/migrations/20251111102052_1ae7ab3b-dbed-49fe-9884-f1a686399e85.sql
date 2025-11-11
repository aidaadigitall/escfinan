-- Fix the update_bank_balance trigger to correctly handle partial payments
-- The trigger should only apply the DIFFERENCE in paid amounts, not revert and reapply everything

DROP TRIGGER IF EXISTS update_bank_balance_trigger ON public.transactions;

CREATE OR REPLACE FUNCTION public.update_bank_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  old_paid numeric := 0;
  new_paid numeric := 0;
  amount_diff numeric := 0;
BEGIN
  -- For UPDATE operations
  IF TG_OP = 'UPDATE' THEN
    -- Calculate the difference in paid amounts
    old_paid := CASE 
      WHEN OLD.bank_account_id IS NOT NULL AND OLD.status IN ('paid', 'received', 'confirmed') THEN
        COALESCE(OLD.paid_amount, OLD.amount)
      ELSE 0
    END;
    
    new_paid := CASE 
      WHEN NEW.bank_account_id IS NOT NULL AND NEW.status IN ('paid', 'received', 'confirmed') THEN
        COALESCE(NEW.paid_amount, NEW.amount)
      ELSE 0
    END;
    
    amount_diff := new_paid - old_paid;
    
    -- Only update if there's a difference and a bank account is set
    IF amount_diff != 0 AND NEW.bank_account_id IS NOT NULL THEN
      IF NEW.type = 'expense' THEN
        amount_diff := -amount_diff;
      END IF;
      
      UPDATE bank_accounts
      SET current_balance = current_balance + amount_diff
      WHERE id = NEW.bank_account_id;
    END IF;
  END IF;
  
  -- For INSERT operations
  IF TG_OP = 'INSERT' THEN
    IF NEW.bank_account_id IS NOT NULL AND NEW.status IN ('paid', 'received', 'confirmed') THEN
      new_paid := COALESCE(NEW.paid_amount, NEW.amount);
      
      IF NEW.type = 'expense' THEN
        new_paid := -new_paid;
      END IF;
      
      UPDATE bank_accounts
      SET current_balance = current_balance + new_paid
      WHERE id = NEW.bank_account_id;
    END IF;
  END IF;
  
  -- For DELETE operations
  IF TG_OP = 'DELETE' THEN
    IF OLD.bank_account_id IS NOT NULL AND OLD.status IN ('paid', 'received', 'confirmed') THEN
      old_paid := COALESCE(OLD.paid_amount, OLD.amount);
      
      IF OLD.type = 'expense' THEN
        old_paid := -old_paid;
      END IF;
      
      UPDATE bank_accounts
      SET current_balance = current_balance - old_paid
      WHERE id = OLD.bank_account_id;
    END IF;
    RETURN OLD;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Recreate the trigger
CREATE TRIGGER update_bank_balance_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_bank_balance();