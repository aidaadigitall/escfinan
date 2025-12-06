-- Add fee_type column to payment_methods (percentage or fixed)
ALTER TABLE public.payment_methods 
ADD COLUMN IF NOT EXISTS fee_type text DEFAULT 'percentage' CHECK (fee_type IN ('percentage', 'fixed'));