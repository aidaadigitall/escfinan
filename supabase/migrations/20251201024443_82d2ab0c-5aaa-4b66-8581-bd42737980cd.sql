-- Fix audit logging to allow NULL transaction_id for DELETE operations
-- This prevents foreign key violations when transactions are deleted

-- Update the bank_balance_audit table to allow NULL transaction_id
ALTER TABLE bank_balance_audit 
ALTER COLUMN transaction_id DROP NOT NULL;

-- Recreate the update_bank_balance function to handle NULL transaction_id on DELETE
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
  current_user_id uuid;
  current_bank_balance numeric;
  new_bank_balance numeric;
  operation_type text;
  audit_transaction_id uuid;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  
  -- Determine operation type
  IF TG_OP = 'INSERT' THEN
    operation_type := 'INSERT';
    audit_transaction_id := NEW.id;
  ELSIF TG_OP = 'UPDATE' THEN
    operation_type := 'UPDATE';
    audit_transaction_id := NEW.id;
  ELSIF TG_OP = 'DELETE' THEN
    operation_type := 'DELETE';
    audit_transaction_id := NULL; -- Use NULL for deletes to avoid FK violation
  END IF;

  -- UPDATE operation
  IF TG_OP = 'UPDATE' THEN
    -- Handle old transaction
    IF OLD.bank_account_id IS NOT NULL THEN
      IF OLD.type = 'transfer' THEN
        IF OLD.notes LIKE 'transfer_out:%' THEN
          IF OLD.status IN ('paid','received','confirmed') THEN
            old_effective := -COALESCE(NULLIF(OLD.paid_amount, 0), OLD.amount);
          ELSE
            old_effective := -COALESCE(OLD.paid_amount, 0);
          END IF;
        ELSIF OLD.notes LIKE 'transfer_in:%' THEN
          IF OLD.status IN ('paid','received','confirmed') THEN
            old_effective := COALESCE(NULLIF(OLD.paid_amount, 0), OLD.amount);
          ELSE
            old_effective := COALESCE(OLD.paid_amount, 0);
          END IF;
        END IF;
      ELSE
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
        SELECT current_balance INTO current_bank_balance FROM bank_accounts WHERE id = OLD.bank_account_id;
        new_bank_balance := current_bank_balance - old_effective;
        
        UPDATE bank_accounts
        SET current_balance = new_bank_balance
        WHERE id = OLD.bank_account_id;
        
        -- Create audit record
        INSERT INTO bank_balance_audit (bank_account_id, transaction_id, user_id, operation, old_balance, new_balance, balance_change, description)
        VALUES (OLD.bank_account_id, audit_transaction_id, current_user_id, operation_type, current_bank_balance, new_bank_balance, -old_effective, 'Account change - removed from old account');
        
        old_effective := 0;
      END IF;
    END IF;

    -- Handle new transaction
    IF NEW.bank_account_id IS NOT NULL THEN
      IF NEW.type = 'transfer' THEN
        IF NEW.notes LIKE 'transfer_out:%' THEN
          IF NEW.status IN ('paid','received','confirmed') THEN
            new_effective := -COALESCE(NULLIF(NEW.paid_amount, 0), NEW.amount);
          ELSE
            new_effective := -COALESCE(NEW.paid_amount, 0);
          END IF;
        ELSIF NEW.notes LIKE 'transfer_in:%' THEN
          IF NEW.status IN ('paid','received','confirmed') THEN
            new_effective := COALESCE(NULLIF(NEW.paid_amount, 0), NEW.amount);
          ELSE
            new_effective := COALESCE(NEW.paid_amount, 0);
          END IF;
        END IF;
      ELSE
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
        SELECT current_balance INTO current_bank_balance FROM bank_accounts WHERE id = NEW.bank_account_id;
        new_bank_balance := current_bank_balance + diff;
        
        -- Validate: prevent negative balance for transfers
        IF NEW.type = 'transfer' AND NEW.notes LIKE 'transfer_out:%' AND new_bank_balance < 0 THEN
          RAISE EXCEPTION 'Saldo insuficiente. Operação resultaria em saldo negativo de R$ %', new_bank_balance;
        END IF;
        
        UPDATE bank_accounts
        SET current_balance = new_bank_balance
        WHERE id = NEW.bank_account_id;
        
        -- Create audit record
        INSERT INTO bank_balance_audit (bank_account_id, transaction_id, user_id, operation, old_balance, new_balance, balance_change, description)
        VALUES (NEW.bank_account_id, audit_transaction_id, current_user_id, operation_type, current_bank_balance, new_bank_balance, diff, NEW.description);
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  -- INSERT operation
  IF TG_OP = 'INSERT' THEN
    IF NEW.bank_account_id IS NOT NULL THEN
      IF NEW.type = 'transfer' THEN
        IF NEW.notes LIKE 'transfer_out:%' THEN
          IF NEW.status IN ('paid','received','confirmed') THEN
            new_effective := -COALESCE(NULLIF(NEW.paid_amount, 0), NEW.amount);
          ELSE
            new_effective := -COALESCE(NEW.paid_amount, 0);
          END IF;
        ELSIF NEW.notes LIKE 'transfer_in:%' THEN
          IF NEW.status IN ('paid','received','confirmed') THEN
            new_effective := COALESCE(NULLIF(NEW.paid_amount, 0), NEW.amount);
          ELSE
            new_effective := COALESCE(NEW.paid_amount, 0);
          END IF;
        END IF;
      ELSE
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
        SELECT current_balance INTO current_bank_balance FROM bank_accounts WHERE id = NEW.bank_account_id;
        new_bank_balance := current_bank_balance + new_effective;
        
        -- Validate: prevent negative balance for transfers
        IF NEW.type = 'transfer' AND NEW.notes LIKE 'transfer_out:%' AND new_bank_balance < 0 THEN
          RAISE EXCEPTION 'Saldo insuficiente. Operação resultaria em saldo negativo de R$ %', new_bank_balance;
        END IF;
        
        UPDATE bank_accounts
        SET current_balance = new_bank_balance
        WHERE id = NEW.bank_account_id;
        
        -- Create audit record
        INSERT INTO bank_balance_audit (bank_account_id, transaction_id, user_id, operation, old_balance, new_balance, balance_change, description)
        VALUES (NEW.bank_account_id, audit_transaction_id, current_user_id, operation_type, current_bank_balance, new_bank_balance, new_effective, NEW.description);
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  -- DELETE operation
  IF TG_OP = 'DELETE' THEN
    IF OLD.bank_account_id IS NOT NULL THEN
      IF OLD.type = 'transfer' THEN
        IF OLD.notes LIKE 'transfer_out:%' THEN
          IF OLD.status IN ('paid','received','confirmed') THEN
            old_effective := -COALESCE(NULLIF(OLD.paid_amount, 0), OLD.amount);
          ELSE
            old_effective := -COALESCE(OLD.paid_amount, 0);
          END IF;
        ELSIF OLD.notes LIKE 'transfer_in:%' THEN
          IF OLD.status IN ('paid','received','confirmed') THEN
            old_effective := COALESCE(NULLIF(OLD.paid_amount, 0), OLD.amount);
          ELSE
            old_effective := COALESCE(OLD.paid_amount, 0);
          END IF;
        END IF;
      ELSE
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
        SELECT current_balance INTO current_bank_balance FROM bank_accounts WHERE id = OLD.bank_account_id;
        new_bank_balance := current_bank_balance - old_effective;
        
        UPDATE bank_accounts
        SET current_balance = new_bank_balance
        WHERE id = OLD.bank_account_id;
        
        -- Create audit record with NULL transaction_id for deletes
        INSERT INTO bank_balance_audit (bank_account_id, transaction_id, user_id, operation, old_balance, new_balance, balance_change, description)
        VALUES (OLD.bank_account_id, audit_transaction_id, current_user_id, operation_type, current_bank_balance, new_bank_balance, -old_effective, 'Transaction deleted: ' || OLD.description);
      END IF;
    END IF;
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$function$;