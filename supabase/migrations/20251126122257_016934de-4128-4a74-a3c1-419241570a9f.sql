-- Remove all duplicate triggers
DROP TRIGGER IF EXISTS transactions_update_bank_balance ON public.transactions;
DROP TRIGGER IF EXISTS trigger_update_bank_balance ON public.transactions;
DROP TRIGGER IF EXISTS update_bank_balance_trigger ON public.transactions;

-- Create a single correct trigger
CREATE TRIGGER transactions_bank_balance_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION update_bank_balance();