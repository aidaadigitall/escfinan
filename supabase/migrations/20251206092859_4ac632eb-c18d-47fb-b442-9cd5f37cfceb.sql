-- Add fee_percentage column to payment_methods table
ALTER TABLE public.payment_methods 
ADD COLUMN fee_percentage numeric DEFAULT 0;

-- Add comment to explain the column
COMMENT ON COLUMN public.payment_methods.fee_percentage IS 'Percentage fee charged by payment operators (e.g., 2.5 for 2.5%)';