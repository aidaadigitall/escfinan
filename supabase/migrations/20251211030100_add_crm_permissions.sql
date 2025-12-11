-- Adicionar permissões de CRM na tabela user_permissions

-- Verificar se as colunas já existem antes de adicionar
DO $$ 
BEGIN
  -- can_view_crm
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_permissions' AND column_name = 'can_view_crm'
  ) THEN
    ALTER TABLE public.user_permissions ADD COLUMN can_view_crm BOOLEAN DEFAULT true;
  END IF;
  
  -- can_manage_crm
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_permissions' AND column_name = 'can_manage_crm'
  ) THEN
    ALTER TABLE public.user_permissions ADD COLUMN can_manage_crm BOOLEAN DEFAULT false;
  END IF;
  
  -- can_delete_leads
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_permissions' AND column_name = 'can_delete_leads'
  ) THEN
    ALTER TABLE public.user_permissions ADD COLUMN can_delete_leads BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Atualizar permissões existentes (dar acesso a todos por padrão)
UPDATE public.user_permissions 
SET 
  can_view_crm = true,
  can_manage_crm = false,
  can_delete_leads = false
WHERE can_view_crm IS NULL;

COMMENT ON COLUMN public.user_permissions.can_view_crm IS 'Permite visualizar leads e funil de vendas';
COMMENT ON COLUMN public.user_permissions.can_manage_crm IS 'Permite gerenciar todos os leads (não apenas os próprios)';
COMMENT ON COLUMN public.user_permissions.can_delete_leads IS 'Permite excluir leads';
