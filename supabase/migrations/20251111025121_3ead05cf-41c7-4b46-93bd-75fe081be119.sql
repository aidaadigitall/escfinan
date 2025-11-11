-- Add partial payment support to transactions
ALTER TABLE public.transactions
ADD COLUMN paid_amount numeric DEFAULT 0,
ADD COLUMN bank_account_id uuid REFERENCES public.bank_accounts(id);

-- Create index for better performance
CREATE INDEX idx_transactions_bank_account ON public.transactions(bank_account_id);
CREATE INDEX idx_transactions_status ON public.transactions(status);

-- Function to update bank account balance when transaction changes
CREATE OR REPLACE FUNCTION public.update_bank_balance()
RETURNS TRIGGER AS $$
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
      UPDATE public.bank_accounts
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
      UPDATE public.bank_accounts
      SET current_balance = current_balance + new_amount
      WHERE id = NEW.bank_account_id;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic bank balance updates
DROP TRIGGER IF EXISTS trigger_update_bank_balance ON public.transactions;
CREATE TRIGGER trigger_update_bank_balance
AFTER INSERT OR UPDATE OR DELETE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_bank_balance();