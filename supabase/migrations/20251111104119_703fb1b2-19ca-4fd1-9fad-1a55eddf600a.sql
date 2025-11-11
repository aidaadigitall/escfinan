-- Update update_bank_balance to handle partial payments even when status is pending
-- and add trigger to ensure it runs on transactions changes.

-- 1) Replace function with logic that considers paid_amount for pending,
--    and uses amount when settled with paid_amount null/0. Also handle INSERT/UPDATE/DELETE.
CREATE OR REPLACE FUNCTION public.update_bank_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  old_effective numeric := 0;
  new_effective numeric := 0;
  diff numeric := 0;
BEGIN
  -- UPDATE: compute old and new effective amounts regardless of status
  IF TG_OP = 'UPDATE' THEN
    IF OLD.bank_account_id IS NOT NULL THEN
      -- For OLD: calculate effective paid
      IF OLD.status IN ('paid','received','confirmed') THEN
        old_effective := COALESCE(NULLIF(OLD.paid_amount, 0), OLD.amount);
      ELSE
        old_effective := COALESCE(OLD.paid_amount, 0);
      END IF;
      
      IF OLD.type = 'expense' THEN
        old_effective := -old_effective;
      END IF;
      
      -- If bank account changed, remove old_effective from OLD account explicitly
      IF NEW.bank_account_id IS DISTINCT FROM OLD.bank_account_id THEN
        UPDATE bank_accounts
        SET current_balance = current_balance - old_effective
        WHERE id = OLD.bank_account_id;
        old_effective := 0; -- so diff applies only to NEW account below
      END IF;
    END IF;

    IF NEW.bank_account_id IS NOT NULL THEN
      -- For NEW: calculate effective paid
      IF NEW.status IN ('paid','received','confirmed') THEN
        new_effective := COALESCE(NULLIF(NEW.paid_amount, 0), NEW.amount);
      ELSE
        new_effective := COALESCE(NEW.paid_amount, 0);
      END IF;
      
      IF NEW.type = 'expense' THEN
        new_effective := -new_effective;
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

  -- INSERT: add effective amount if any (handles partial on pending)
  IF TG_OP = 'INSERT' THEN
    IF NEW.bank_account_id IS NOT NULL THEN
      IF NEW.status IN ('paid','received','confirmed') THEN
        new_effective := COALESCE(NULLIF(NEW.paid_amount, 0), NEW.amount);
      ELSE
        new_effective := COALESCE(NEW.paid_amount, 0);
      END IF;
      
      IF NEW.type = 'expense' THEN
        new_effective := -new_effective;
      END IF;
      
      IF new_effective != 0 THEN
        UPDATE bank_accounts
        SET current_balance = current_balance + new_effective
        WHERE id = NEW.bank_account_id;
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  -- DELETE: revert effective amount
  IF TG_OP = 'DELETE' THEN
    IF OLD.bank_account_id IS NOT NULL THEN
      IF OLD.status IN ('paid','received','confirmed') THEN
        old_effective := COALESCE(NULLIF(OLD.paid_amount, 0), OLD.amount);
      ELSE
        old_effective := COALESCE(OLD.paid_amount, 0);
      END IF;
      
      IF OLD.type = 'expense' THEN
        old_effective := -old_effective;
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
$$;

-- 2) Ensure trigger exists on transactions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'transactions_update_bank_balance'
  ) THEN
    CREATE TRIGGER transactions_update_bank_balance
    AFTER INSERT OR UPDATE OR DELETE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION public.update_bank_balance();
  END IF;
END
$$;