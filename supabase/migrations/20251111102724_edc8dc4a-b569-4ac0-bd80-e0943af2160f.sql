-- Create credit_cards table for managing credit cards
CREATE TABLE public.credit_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  card_name TEXT NOT NULL,
  card_number TEXT NOT NULL, -- Last 4 digits only for security
  cardholder_name TEXT NOT NULL,
  card_brand TEXT NOT NULL, -- Visa, Mastercard, etc
  credit_limit NUMERIC NOT NULL DEFAULT 0,
  available_credit NUMERIC NOT NULL DEFAULT 0,
  closing_day INTEGER NOT NULL, -- Day of month (1-31)
  due_day INTEGER NOT NULL, -- Day of month (1-31)
  operator_integration TEXT, -- Integration provider (e.g., 'nubank', 'inter', 'manual')
  operator_card_id TEXT, -- External card ID from operator
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_enabled BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own credit cards"
  ON public.credit_cards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own credit cards"
  ON public.credit_cards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own credit cards"
  ON public.credit_cards FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own credit cards"
  ON public.credit_cards FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_credit_cards_updated_at
  BEFORE UPDATE ON public.credit_cards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create credit_card_transactions table for tracking card transactions
CREATE TABLE public.credit_card_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  credit_card_id UUID NOT NULL REFERENCES public.credit_cards(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  transaction_date DATE NOT NULL,
  category TEXT,
  installments INTEGER DEFAULT 1,
  current_installment INTEGER DEFAULT 1,
  operator_transaction_id TEXT, -- External transaction ID from operator
  is_synced BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.credit_card_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for card transactions
CREATE POLICY "Users can view their own card transactions"
  ON public.credit_card_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own card transactions"
  ON public.credit_card_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own card transactions"
  ON public.credit_card_transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own card transactions"
  ON public.credit_card_transactions FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_credit_card_transactions_updated_at
  BEFORE UPDATE ON public.credit_card_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();