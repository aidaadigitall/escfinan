-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('payment', 'overdue', 'due_today', 'due_soon', 'received', 'info')),
  transaction_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" 
ON public.notifications 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);

-- Create function to generate notifications for transactions
CREATE OR REPLACE FUNCTION public.generate_transaction_notifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Notification for overdue transactions
  IF NEW.status = 'overdue' AND (OLD.status IS NULL OR OLD.status != 'overdue') THEN
    INSERT INTO public.notifications (user_id, title, message, type, transaction_id)
    VALUES (
      NEW.user_id,
      'Conta Vencida',
      'A ' || (CASE WHEN NEW.type = 'income' THEN 'receita' ELSE 'despesa' END) || ' "' || NEW.description || '" está vencida.',
      'overdue',
      NEW.id
    );
  END IF;

  -- Notification for paid/received transactions
  IF (NEW.status = 'paid' OR NEW.status = 'received' OR NEW.status = 'confirmed') 
     AND (OLD.status IS NULL OR (OLD.status != 'paid' AND OLD.status != 'received' AND OLD.status != 'confirmed')) THEN
    INSERT INTO public.notifications (user_id, title, message, type, transaction_id)
    VALUES (
      NEW.user_id,
      CASE WHEN NEW.type = 'income' THEN 'Receita Confirmada' ELSE 'Pagamento Confirmado' END,
      'A ' || (CASE WHEN NEW.type = 'income' THEN 'receita' ELSE 'despesa' END) || ' "' || NEW.description || '" foi ' || (CASE WHEN NEW.type = 'income' THEN 'recebida' ELSE 'paga' END) || '.',
      'payment',
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for transaction notifications
CREATE TRIGGER trigger_transaction_notifications
AFTER INSERT OR UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.generate_transaction_notifications();

-- Create function to check for due transactions (to be called daily)
CREATE OR REPLACE FUNCTION public.check_due_transactions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  transaction_record RECORD;
BEGIN
  -- Check for transactions due today
  FOR transaction_record IN
    SELECT id, user_id, description, type
    FROM public.transactions
    WHERE due_date = CURRENT_DATE
    AND status = 'pending'
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications 
      WHERE transaction_id = transactions.id 
      AND type = 'due_today'
      AND created_at::date = CURRENT_DATE
    )
  LOOP
    INSERT INTO public.notifications (user_id, title, message, type, transaction_id)
    VALUES (
      transaction_record.user_id,
      'Vencimento Hoje',
      'A ' || (CASE WHEN transaction_record.type = 'income' THEN 'receita' ELSE 'despesa' END) || ' "' || transaction_record.description || '" vence hoje.',
      'due_today',
      transaction_record.id
    );
  END LOOP;

  -- Check for transactions due in 3 days
  FOR transaction_record IN
    SELECT id, user_id, description, type, due_date
    FROM public.transactions
    WHERE due_date = CURRENT_DATE + INTERVAL '3 days'
    AND status = 'pending'
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications 
      WHERE transaction_id = transactions.id 
      AND type = 'due_soon'
      AND created_at::date = CURRENT_DATE
    )
  LOOP
    INSERT INTO public.notifications (user_id, title, message, type, transaction_id)
    VALUES (
      transaction_record.user_id,
      'Vencimento Próximo',
      'A ' || (CASE WHEN transaction_record.type = 'income' THEN 'receita' ELSE 'despesa' END) || ' "' || transaction_record.description || '" vence em 3 dias.',
      'due_soon',
      transaction_record.id
    );
  END LOOP;

  -- Update overdue transactions
  UPDATE public.transactions
  SET status = 'overdue'
  WHERE due_date < CURRENT_DATE
  AND status = 'pending';
END;
$$;