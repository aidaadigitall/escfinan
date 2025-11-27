-- Create chart_of_accounts table for plano de contas
CREATE TABLE IF NOT EXISTS public.chart_of_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
  parent_id UUID REFERENCES public.chart_of_accounts(id) ON DELETE SET NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, code)
);

-- Enable RLS
ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chart_of_accounts
CREATE POLICY "Users can view their own chart of accounts"
ON public.chart_of_accounts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chart of accounts"
ON public.chart_of_accounts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chart of accounts"
ON public.chart_of_accounts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chart of accounts"
ON public.chart_of_accounts FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_chart_of_accounts_updated_at
BEFORE UPDATE ON public.chart_of_accounts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create bank_balance_audit table for tracking balance changes
CREATE TABLE IF NOT EXISTS public.bank_balance_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_account_id UUID NOT NULL REFERENCES public.bank_accounts(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE', 'TRANSFER', 'MANUAL_ADJUSTMENT')),
  old_balance NUMERIC,
  new_balance NUMERIC NOT NULL,
  balance_change NUMERIC NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bank_balance_audit ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bank_balance_audit
CREATE POLICY "Users can view their own balance audit"
ON public.bank_balance_audit FOR SELECT
USING (auth.uid() = user_id);

-- Index for better query performance
CREATE INDEX idx_bank_balance_audit_account ON public.bank_balance_audit(bank_account_id);
CREATE INDEX idx_bank_balance_audit_created_at ON public.bank_balance_audit(created_at DESC);

-- Update the update_bank_balance function to include audit trail and validation
CREATE OR REPLACE FUNCTION public.update_bank_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_effective numeric := 0;
  new_effective numeric := 0;
  diff numeric := 0;
  current_user_id uuid;
  current_bank_balance numeric;
  new_bank_balance numeric;
  operation_type text;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  
  -- Determine operation type
  IF TG_OP = 'INSERT' THEN
    operation_type := 'INSERT';
  ELSIF TG_OP = 'UPDATE' THEN
    operation_type := 'UPDATE';
  ELSIF TG_OP = 'DELETE' THEN
    operation_type := 'DELETE';
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
        VALUES (OLD.bank_account_id, OLD.id, current_user_id, operation_type, current_bank_balance, new_bank_balance, -old_effective, 'Account change - removed from old account');
        
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
        VALUES (NEW.bank_account_id, NEW.id, current_user_id, operation_type, current_bank_balance, new_bank_balance, diff, NEW.description);
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
        VALUES (NEW.bank_account_id, NEW.id, current_user_id, operation_type, current_bank_balance, new_bank_balance, new_effective, NEW.description);
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
        
        -- Create audit record
        INSERT INTO bank_balance_audit (bank_account_id, transaction_id, user_id, operation, old_balance, new_balance, balance_change, description)
        VALUES (OLD.bank_account_id, OLD.id, current_user_id, operation_type, current_bank_balance, new_bank_balance, -old_effective, 'Transaction deleted: ' || OLD.description);
      END IF;
    END IF;
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;