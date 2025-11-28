-- Criar tabela para histórico de status de transações
CREATE TABLE IF NOT EXISTS public.transaction_status_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  old_status TEXT,
  new_status TEXT NOT NULL,
  observation TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by_name TEXT
);

-- Habilitar RLS
ALTER TABLE public.transaction_status_history ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own transaction history"
  ON public.transaction_status_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transaction history"
  ON public.transaction_status_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_transaction_status_history_transaction_id 
  ON public.transaction_status_history(transaction_id);

-- Função para registrar mudanças de status automaticamente
CREATE OR REPLACE FUNCTION public.log_transaction_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Registra apenas se o status mudou
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO public.transaction_status_history (
      transaction_id,
      user_id,
      old_status,
      new_status,
      observation
    ) VALUES (
      NEW.id,
      NEW.user_id,
      OLD.status,
      NEW.status,
      NEW.notes
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para registrar mudanças de status
DROP TRIGGER IF EXISTS transaction_status_change_trigger ON public.transactions;
CREATE TRIGGER transaction_status_change_trigger
  AFTER UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.log_transaction_status_change();