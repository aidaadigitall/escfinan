-- Create system_users table if not exists
CREATE TABLE IF NOT EXISTS public.system_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'Usuário',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'system_users' AND policyname = 'Users can view system users') THEN
    CREATE POLICY "Users can view system users" ON public.system_users FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'system_users' AND policyname = 'Users can create system users') THEN
    CREATE POLICY "Users can create system users" ON public.system_users FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'system_users' AND policyname = 'Users can update system users') THEN
    CREATE POLICY "Users can update system users" ON public.system_users FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'system_users' AND policyname = 'Users can delete system users') THEN
    CREATE POLICY "Users can delete system users" ON public.system_users FOR DELETE USING (true);
  END IF;
END
$$;

-- Create updated_at trigger
DROP TRIGGER IF EXISTS update_system_users_updated_at ON public.system_users;
CREATE TRIGGER update_system_users_updated_at
  BEFORE UPDATE ON public.system_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();