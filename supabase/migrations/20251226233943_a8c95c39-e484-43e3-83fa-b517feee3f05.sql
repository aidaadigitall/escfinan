-- Tabela para configurações de IA por empresa/usuário
CREATE TABLE public.ai_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  
  -- Chaves API
  openai_api_key TEXT,
  google_api_key TEXT,
  
  -- Configurações
  default_provider TEXT DEFAULT 'lovable', -- 'lovable', 'openai', 'google'
  default_model TEXT DEFAULT 'gemini-2.5-flash',
  
  -- Limites e controles
  monthly_token_limit INTEGER DEFAULT 100000,
  tokens_used_this_month INTEGER DEFAULT 0,
  last_token_reset TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Auditoria
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para log de uso de IA
CREATE TABLE public.ai_usage_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  
  -- Detalhes do uso
  provider TEXT NOT NULL, -- 'lovable', 'openai', 'google'
  model TEXT NOT NULL,
  tokens_input INTEGER DEFAULT 0,
  tokens_output INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  
  -- Contexto
  request_type TEXT, -- 'chat', 'insights', 'analysis'
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_log ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para ai_settings
CREATE POLICY "Users can view their own AI settings" 
ON public.ai_settings 
FOR SELECT 
USING (public.can_access_user_data(user_id));

CREATE POLICY "Users can insert their own AI settings" 
ON public.ai_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR auth.uid() = public.get_effective_owner_id(user_id));

CREATE POLICY "Users can update their own AI settings" 
ON public.ai_settings 
FOR UPDATE 
USING (public.can_access_user_data(user_id));

CREATE POLICY "Users can delete their own AI settings" 
ON public.ai_settings 
FOR DELETE 
USING (public.can_access_user_data(user_id));

-- Políticas RLS para ai_usage_log
CREATE POLICY "Users can view their own AI usage log" 
ON public.ai_usage_log 
FOR SELECT 
USING (public.can_access_user_data(user_id));

CREATE POLICY "Users can insert their own AI usage log" 
ON public.ai_usage_log 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR auth.uid() = public.get_effective_owner_id(user_id));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_ai_settings_updated_at
BEFORE UPDATE ON public.ai_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_ai_settings_user_id ON public.ai_settings(user_id);
CREATE INDEX idx_ai_usage_log_user_id ON public.ai_usage_log(user_id);
CREATE INDEX idx_ai_usage_log_created_at ON public.ai_usage_log(created_at DESC);

-- Adicionar permissões de IA ao sistema de permissões
ALTER TABLE public.user_permissions 
ADD COLUMN IF NOT EXISTS can_view_projects BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS can_manage_projects BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS can_view_ai_settings BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_manage_ai_settings BOOLEAN DEFAULT false;