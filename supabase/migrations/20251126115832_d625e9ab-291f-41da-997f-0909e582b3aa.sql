-- Remove the old type check constraint
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_type_check;

-- Add the new type check constraint including 'transfer'
ALTER TABLE public.transactions 
ADD CONSTRAINT transactions_type_check 
CHECK (type = ANY (ARRAY['income'::text, 'expense'::text, 'transfer'::text]));