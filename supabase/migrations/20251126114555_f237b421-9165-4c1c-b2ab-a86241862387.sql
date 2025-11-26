-- Drop the existing trigger first
DROP TRIGGER IF EXISTS update_bank_balance_trigger ON public.transactions;

-- Update the function to handle transfers correctly
CREATE OR REPLACE FUNCTION public.update_bank_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  old_effective numeric := 0;
  new_effective numeric := 0;
  diff numeric := 0;
  transfer_account_id uuid;
BEGIN
  -- UPDATE operation
  IF TG_OP = 'UPDATE' THEN
    -- Handle old transaction
    IF OLD.bank_account_id IS NOT NULL THEN
      IF OLD.type = 'transfer' THEN
        -- For transfers, check if it's transfer_out or transfer_in
        IF OLD.notes LIKE 'transfer_out:%' THEN
          -- Transfer out: remove money from source account
          IF OLD.status IN ('paid','received','confirmed') THEN
            old_effective := -COALESCE(NULLIF(OLD.paid_amount, 0), OLD.amount);
          ELSE
            old_effective := -COALESCE(OLD.paid_amount, 0);
          END IF;
        ELSIF OLD.notes LIKE 'transfer_in:%' THEN
          -- Transfer in: add money to destination account
          IF OLD.status IN ('paid','received','confirmed') THEN
            old_effective := COALESCE(NULLIF(OLD.paid_amount, 0), OLD.amount);
          ELSE
            old_effective := COALESCE(OLD.paid_amount, 0);
          END IF;
        END IF;
      ELSE
        -- Regular transaction logic
        IF OLD.status IN ('paid','received','confirmed') THEN
          old_effective := COALESCE(NULLIF(OLD.paid_amount, 0), OLD.amount);
        ELSE
          old_effective := COALESCE(OLD.paid_amount, 0);
        END IF;
        
        IF OLD.type = 'expense' THEN
          old_effective := -old_effective;
        END IF;
      END IF;
      
      -- If bank account changed, adjust the old account
      IF NEW.bank_account_id IS DISTINCT FROM OLD.bank_account_id THEN
        UPDATE bank_accounts
        SET current_balance = current_balance - old_effective
        WHERE id = OLD.bank_account_id;
        old_effective := 0;
      END IF;
    END IF;

    -- Handle new transaction
    IF NEW.bank_account_id IS NOT NULL THEN
      IF NEW.type = 'transfer' THEN
        -- For transfers, check if it's transfer_out or transfer_in
        IF NEW.notes LIKE 'transfer_out:%' THEN
          -- Transfer out: remove money from source account
          IF NEW.status IN ('paid','received','confirmed') THEN
            new_effective := -COALESCE(NULLIF(NEW.paid_amount, 0), NEW.amount);
          ELSE
            new_effective := -COALESCE(NEW.paid_amount, 0);
          END IF;
        ELSIF NEW.notes LIKE 'transfer_in:%' THEN
          -- Transfer in: add money to destination account
          IF NEW.status IN ('paid','received','confirmed') THEN
            new_effective := COALESCE(NULLIF(NEW.paid_amount, 0), NEW.amount);
          ELSE
            new_effective := COALESCE(NEW.paid_amount, 0);
          END IF;
        END IF;
      ELSE
        -- Regular transaction logic
        IF NEW.status IN ('paid','received','confirmed') THEN
          new_effective := COALESCE(NULLIF(NEW.paid_amount, 0), NEW.amount);
        ELSE
          new_effective := COALESCE(NEW.paid_amount, 0);
        END IF;
        
        IF NEW.type = 'expense' THEN
          new_effective := -new_effective;
        END IF;
      END IF;
      
      diff := new_effective - old_effective;
      IF diff != 0 THEN
        UPDATE bank_accounts
        SET current_balance = current_balance + diff
        WHERE id = NEW.bank_account_id;
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  -- INSERT operation
  IF TG_OP = 'INSERT' THEN
    IF NEW.bank_account_id IS NOT NULL THEN
      IF NEW.type = 'transfer' THEN
        -- For transfers, check if it's transfer_out or transfer_in
        IF NEW.notes LIKE 'transfer_out:%' THEN
          -- Transfer out: remove money from source account
          IF NEW.status IN ('paid','received','confirmed') THEN
            new_effective := -COALESCE(NULLIF(NEW.paid_amount, 0), NEW.amount);
          ELSE
            new_effective := -COALESCE(NEW.paid_amount, 0);
          END IF;
        ELSIF NEW.notes LIKE 'transfer_in:%' THEN
          -- Transfer in: add money to destination account
          IF NEW.status IN ('paid','received','confirmed') THEN
            new_effective := COALESCE(NULLIF(NEW.paid_amount, 0), NEW.amount);
          ELSE
            new_effective := COALESCE(NEW.paid_amount, 0);
          END IF;
        END IF;
      ELSE
        -- Regular transaction logic
        IF NEW.status IN ('paid','received','confirmed') THEN
          new_effective := COALESCE(NULLIF(NEW.paid_amount, 0), NEW.amount);
        ELSE
          new_effective := COALESCE(NEW.paid_amount, 0);
        END IF;
        
        IF NEW.type = 'expense' THEN
          new_effective := -new_effective;
        END IF;
      END IF;
      
      IF new_effective != 0 THEN
        UPDATE bank_accounts
        SET current_balance = current_balance + new_effective
        WHERE id = NEW.bank_account_id;
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  -- DELETE operation
  IF TG_OP = 'DELETE' THEN
    IF OLD.bank_account_id IS NOT NULL THEN
      IF OLD.type = 'transfer' THEN
        -- For transfers, check if it's transfer_out or transfer_in
        IF OLD.notes LIKE 'transfer_out:%' THEN
          -- Transfer out: revert removal (add back)
          IF OLD.status IN ('paid','received','confirmed') THEN
            old_effective := -COALESCE(NULLIF(OLD.paid_amount, 0), OLD.amount);
          ELSE
            old_effective := -COALESCE(OLD.paid_amount, 0);
          END IF;
        ELSIF OLD.notes LIKE 'transfer_in:%' THEN
          -- Transfer in: revert addition (remove)
          IF OLD.status IN ('paid','received','confirmed') THEN
            old_effective := COALESCE(NULLIF(OLD.paid_amount, 0), OLD.amount);
          ELSE
            old_effective := COALESCE(OLD.paid_amount, 0);
          END IF;
        END IF;
      ELSE
        -- Regular transaction logic
        IF OLD.status IN ('paid','received','confirmed') THEN
          old_effective := COALESCE(NULLIF(OLD.paid_amount, 0), OLD.amount);
        ELSE
          old_effective := COALESCE(OLD.paid_amount, 0);
        END IF;
        
        IF OLD.type = 'expense' THEN
          old_effective := -old_effective;
        END IF;
      END IF;
      
      IF old_effective != 0 THEN
        UPDATE bank_accounts
        SET current_balance = current_balance - old_effective
        WHERE id = OLD.bank_account_id;
      END IF;
    END IF;
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$function$;

-- Recreate the trigger
CREATE TRIGGER update_bank_balance_trigger
  BEFORE INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_bank_balance();