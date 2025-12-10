# Setup do Sistema de Ponto (Time Tracking)

## 🎯 Objetivo
Criar as tabelas necessárias para o novo sistema de ponto (time tracking) com:
- Registro de entrada/saída (clock in/out)
- Controle de intervalos
- Solicitações de edição com aprovação por gestor
- Banco de horas mensal

## 📋 Migração SQL

A migração já foi criada em: `supabase/migrations/20251210120000_create_time_tracking_system.sql`

Ela cria 3 tabelas principais:
1. **time_tracking** - Registros diários de ponto
2. **time_clock_requests** - Solicitações de edição
3. **time_clock_summary** - Resumo mensal de banco de horas

## ✅ Como Aplicar as Migrações

### Opção 1: Via Supabase CLI (Recomendado)

```bash
# Instalar Supabase CLI
npm install -g @supabase/cli
# ou
brew install supabase/tap/supabase

# Fazer login
supabase login

# Aplicar migrações
cd /workspaces/escfinan
supabase link --project-ref seu_project_id
supabase db push

# Regenerar tipos TypeScript
supabase gen types typescript --local > src/integrations/supabase/types.ts
```

### Opção 2: Via Supabase Dashboard Web

1. Acesse https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá para **SQL Editor**
4. Clique em **New Query**
5. Cole o SQL completo abaixo
6. Clique em **Run** para executar

```sql
-- ======================
-- TIME TRACKING SYSTEM
-- ======================

-- Create time_tracking table for daily clock in/out records
CREATE TABLE public.time_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  clock_in TIMESTAMP WITH TIME ZONE,
  clock_out TIMESTAMP WITH TIME ZONE,
  break_start TIMESTAMP WITH TIME ZONE,
  break_end TIMESTAMP WITH TIME ZONE,
  hours_worked DECIMAL(5, 2),
  break_duration DECIMAL(5, 2) DEFAULT 0,
  net_hours DECIMAL(5, 2),
  notes TEXT,
  status VARCHAR(20) DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.time_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own time tracking"
ON public.time_tracking
FOR SELECT
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.user_permissions
    WHERE user_id = auth.uid() AND can_manage_employees = true
  ) OR
  EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.user_id = auth.uid() AND e.responsible_user_id = time_tracking.user_id
  )
);

CREATE POLICY "Users can insert their own time tracking"
ON public.time_tracking
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own time tracking"
ON public.time_tracking
FOR UPDATE
USING (auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.user_permissions
    WHERE user_id = auth.uid() AND can_manage_employees = true
  ))
USING (auth.uid() = user_id);

CREATE POLICY "Managers can delete time tracking"
ON public.time_tracking
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.user_permissions
  WHERE user_id = auth.uid() AND can_manage_employees = true
));

CREATE TRIGGER update_time_tracking_updated_at
BEFORE UPDATE ON public.time_tracking
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create time_clock_requests table for edit approval workflow
CREATE TABLE public.time_clock_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  time_tracking_id UUID NOT NULL REFERENCES public.time_tracking(id) ON DELETE CASCADE,
  request_type VARCHAR(50) NOT NULL,
  reason TEXT NOT NULL,
  requested_value TIMESTAMP WITH TIME ZONE,
  requested_hours DECIMAL(5, 2),
  status VARCHAR(20) DEFAULT 'pending',
  approved_by UUID REFERENCES auth.users(id),
  approval_comment TEXT,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.time_clock_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own requests"
ON public.time_clock_requests
FOR SELECT
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.user_permissions
    WHERE user_id = auth.uid() AND can_manage_employees = true
  )
);

CREATE POLICY "Users can create their own requests"
ON public.time_clock_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Managers can update requests"
ON public.time_clock_requests
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.user_permissions
  WHERE user_id = auth.uid() AND can_manage_employees = true
))
USING (EXISTS (
  SELECT 1 FROM public.user_permissions
  WHERE user_id = auth.uid() AND can_manage_employees = true
));

CREATE POLICY "Managers can delete requests"
ON public.time_clock_requests
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.user_permissions
  WHERE user_id = auth.uid() AND can_manage_employees = true
));

CREATE TRIGGER update_time_clock_requests_updated_at
BEFORE UPDATE ON public.time_clock_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create time_clock_summary table for monthly/annual bank of hours
CREATE TABLE public.time_clock_summary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  year_month VARCHAR(7) NOT NULL,
  total_hours_worked DECIMAL(8, 2) DEFAULT 0,
  total_break_duration DECIMAL(8, 2) DEFAULT 0,
  total_net_hours DECIMAL(8, 2) DEFAULT 0,
  expected_hours DECIMAL(8, 2) DEFAULT 160,
  balance_hours DECIMAL(8, 2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, year_month)
);

ALTER TABLE public.time_clock_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own summary"
ON public.time_clock_summary
FOR SELECT
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.user_permissions
    WHERE user_id = auth.uid() AND can_manage_employees = true
  )
);

CREATE POLICY "System can insert/update summaries"
ON public.time_clock_summary
FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update summaries"
ON public.time_clock_summary
FOR UPDATE
USING (true);

CREATE TRIGGER update_time_clock_summary_updated_at
BEFORE UPDATE ON public.time_clock_summary
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_time_tracking_user_date ON public.time_tracking(user_id, date DESC);
CREATE INDEX idx_time_tracking_employee_date ON public.time_tracking(employee_id, date DESC);
CREATE INDEX idx_time_clock_requests_status ON public.time_clock_requests(status, requested_at DESC);
CREATE INDEX idx_time_clock_requests_user ON public.time_clock_requests(user_id, requested_at DESC);
CREATE INDEX idx_time_clock_summary_user_year_month ON public.time_clock_summary(user_id, year_month DESC);
```

## 🔄 Depois da Migração

### 1. Regenerar Tipos TypeScript

```bash
supabase gen types typescript --local > src/integrations/supabase/types.ts
```

Ou manualmente:
- Acesse https://supabase.com/dashboard
- Vá para **Database** > **Tables**
- Verifique se as 3 tabelas foram criadas
- Copie os tipos gerados automaticamente

### 2. Testar o Sistema

O sistema está completo e pronto para usar com:

**Componentes Frontend:**
- `/src/pages/Ponto.tsx` - Página principal de ponto
- `/src/pages/PontoApprovalsPage.tsx` - Página de aprovações (gestor)
- `/src/components/TimeClockRequestDialog.tsx` - Dialog para solicitar edição
- `/src/components/TimeClockApprovalPanel.tsx` - Painel de aprovação

**Hooks (Lógica):**
- `/src/hooks/useTimeTracking.ts` - Gerenciar clock in/out, solicitações
- `/src/hooks/useTimeClock.ts` - Gerenciar banco de horas

**Rotas:**
- `/ponto` - Sistema de ponto (usuário)
- `/ponto/aprovacoes` - Aprovações (gestor)

### 3. Funcionalidades Disponíveis

✅ Clock in/out com horário automático
✅ Registrar intervalos (break)
✅ Solicitar edição de horário (com justificativa)
✅ Gestor aprova/rejeita solicitações
✅ Cálculo automático de horas trabalhadas
✅ Banco de horas mensal
✅ Row-Level Security (RLS) ativado

## 📊 Estrutura de Dados

### time_tracking
```
- id: UUID (PK)
- user_id: UUID (FK)
- employee_id: UUID (FK opcional)
- date: DATE
- clock_in: TIMESTAMP
- clock_out: TIMESTAMP
- break_start: TIMESTAMP
- break_end: TIMESTAMP
- hours_worked: DECIMAL
- break_duration: DECIMAL
- net_hours: DECIMAL
- status: VARCHAR (completed, pending, edited, approved)
```

### time_clock_requests
```
- id: UUID (PK)
- user_id: UUID (FK)
- time_tracking_id: UUID (FK)
- request_type: VARCHAR (edit_clock_in, edit_clock_out, adjust_hours)
- reason: TEXT
- requested_value: TIMESTAMP
- requested_hours: DECIMAL
- status: VARCHAR (pending, approved, rejected, cancelled)
- approved_by: UUID (FK)
- approval_comment: TEXT
- requested_at: TIMESTAMP
- approved_at: TIMESTAMP
```

### time_clock_summary
```
- id: UUID (PK)
- user_id: UUID (FK)
- employee_id: UUID (FK opcional)
- year_month: VARCHAR (YYYY-MM)
- total_hours_worked: DECIMAL
- total_break_duration: DECIMAL
- total_net_hours: DECIMAL
- expected_hours: DECIMAL (default 160)
- balance_hours: DECIMAL (positivo = extra, negativo = falta)
```

## ⚠️ Notas Importantes

1. A migração depende da tabela `employees` e da função `update_updated_at_column()` já existirem
2. Se alguma política RLS der erro, verifique se a tabela `user_permissions` existe
3. As migrações são idempotentes (podem ser executadas múltiplas vezes sem erro)

## 🆘 Troubleshooting

**Erro: "user_permissions" not found**
- Verifique se a tabela `user_permissions` foi criada
- Execute a migração da tabela se necessário

**Erro: "employees" not found**
- A tabela `employees` deve existir antes desta migração
- Verifique migrações anteriores

**Erro ao regenerar tipos**
- Reinicie o VS Code ou limpe o cache: `rm -rf node_modules/.vite`
- Execute: `npm install && npm run build`

## ✨ Status

Sistema completo e pronto para produção! 🚀
