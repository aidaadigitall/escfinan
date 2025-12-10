# 🎯 Guia de Migração Supabase Dashboard

## ⚡ Passos Rápidos (5-10 minutos)

### Passo 1: Abrir SQL Editor

1. Acesse: **https://supabase.com/dashboard**
2. Selecione projeto: **qdavvdfjhskdwelyvwjy**
3. No menu esquerdo: **SQL Editor**
4. Clique em: **New Query** (botão azul no topo)

### Passo 2: Copiar SQL Completo

O SQL completo está em:
📁 `/supabase/migrations/20251210120000_create_time_tracking_system.sql`

**Conteúdo do arquivo (187 linhas):**

```sql
-- ====================================
-- SISTEMA DE PONTO (TIME TRACKING)
-- ====================================
-- Este script cria 3 tabelas principais:
-- 1. time_tracking - Registros diários
-- 2. time_clock_requests - Solicitações de edição
-- 3. time_clock_summary - Banco de horas mensal
-- ====================================

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
  status VARCHAR(20) DEFAULT 'completed', -- completed, pending, edited, approved
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable RLS
ALTER TABLE public.time_tracking ENABLE ROW LEVEL SECURITY;

-- Policies for time_tracking
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

-- Add updated_at trigger
CREATE TRIGGER update_time_tracking_updated_at
BEFORE UPDATE ON public.time_tracking
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create time_clock_requests table for edit approval workflow
CREATE TABLE public.time_clock_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  time_tracking_id UUID NOT NULL REFERENCES public.time_tracking(id) ON DELETE CASCADE,
  request_type VARCHAR(50) NOT NULL, -- 'edit_clock_in', 'edit_clock_out', 'add_break', 'remove_break', 'adjust_hours'
  reason TEXT NOT NULL,
  requested_value TIMESTAMP WITH TIME ZONE,
  requested_hours DECIMAL(5, 2),
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, cancelled
  approved_by UUID REFERENCES auth.users(id),
  approval_comment TEXT,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.time_clock_requests ENABLE ROW LEVEL SECURITY;

-- Policies for time_clock_requests
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

-- Add updated_at trigger
CREATE TRIGGER update_time_clock_requests_updated_at
BEFORE UPDATE ON public.time_clock_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create time_clock_summary table for monthly/annual bank of hours
CREATE TABLE public.time_clock_summary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  year_month VARCHAR(7) NOT NULL, -- YYYY-MM format
  total_hours_worked DECIMAL(8, 2) DEFAULT 0,
  total_break_duration DECIMAL(8, 2) DEFAULT 0,
  total_net_hours DECIMAL(8, 2) DEFAULT 0,
  expected_hours DECIMAL(8, 2) DEFAULT 160, -- 8h/day * 20 workdays
  balance_hours DECIMAL(8, 2) DEFAULT 0, -- positive = extra hours, negative = debt
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, year_month)
);

-- Enable RLS
ALTER TABLE public.time_clock_summary ENABLE ROW LEVEL SECURITY;

-- Policies for time_clock_summary
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

-- Add updated_at trigger
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

### Passo 3: Executar SQL

1. **Cole o SQL** na caixa de texto do SQL Editor
2. Clique em **RUN** (botão azul no canto inferior direito)
3. Aguarde a mensagem: ✅ **Query successful**

### Passo 4: Verificar Tabelas

1. Menu esquerdo: **Database** → **Tables**
2. Procure pelas 3 tabelas:
   - ✅ `time_tracking`
   - ✅ `time_clock_requests`
   - ✅ `time_clock_summary`

Todas devem ter ícone verde ✓

---

## ⚠️ Se Encontrar Erros

### Erro: "user_permissions" does not exist

**Causa:** Tabela `user_permissions` não foi criada ainda

**Solução:**
1. Verifique se a tabela existe: `SELECT * FROM user_permissions LIMIT 1;`
2. Se não existir, execute em um outro query:
```sql
-- Verificar se tabela existe
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_name = 'user_permissions'
);
```

### Erro: "employees" does not exist

**Causa:** Tabela `employees` não foi criada

**Solução:** Mesma acima - verifique se a tabela existe

### Erro: "update_updated_at_column()" does not exist

**Causa:** Função não foi criada em migrações anteriores

**Solução:** Execute esta função primeiro:
```sql
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## ✅ Verificação Pós-Migração

### 1. Tabelas Criadas
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('time_tracking', 'time_clock_requests', 'time_clock_summary');
```

**Resultado esperado:**
```
time_tracking
time_clock_requests
time_clock_summary
```

### 2. RLS Habilitado
```sql
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename IN ('time_tracking', 'time_clock_requests', 'time_clock_summary');
```

**Resultado esperado:**
```
time_tracking | true
time_clock_requests | true
time_clock_summary | true
```

### 3. Policies Criadas
```sql
SELECT tablename, policyname FROM pg_policies 
WHERE tablename = 'time_tracking';
```

**Resultado esperado:**
```
5 políticas (Select, Insert, Update, Delete, etc)
```

### 4. Índices Criados
```sql
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('time_tracking', 'time_clock_requests', 'time_clock_summary');
```

**Resultado esperado:**
```
5 índices criados
```

---

## 🔄 Próximos Passos Após Migração

### 1. Confirmar no Git
```bash
cd /workspaces/escfinan
git status
# Deve mostrar: "nothing to commit, working tree clean"
```

### 2. Regenerar Tipos TypeScript
```bash
supabase gen types typescript --local > src/integrations/supabase/types.ts
```

### 3. Build do Projeto
```bash
npm run build
```

### 4. Deploy
```bash
git push origin main
# Sua CI/CD fará deploy automático
```

---

## 📊 Timeline Esperado

| Etapa | Tempo | Status |
|-------|-------|--------|
| Abrir Dashboard | 1 min | ⏳ |
| Copiar SQL | 2 min | ⏳ |
| Executar no Supabase | 2 min | ⏳ |
| Verificar tabelas | 2 min | ⏳ |
| Regenerar tipos | 2 min | ⏳ |
| Build | 10 min | ⏳ |
| **Total** | **~20 min** | ⏳ |

---

## ✨ Status Atual

```
GitHub:    ✅ Sincronizado (commit e8c041c)
Build:     ✅ OK (sem erros)
Migração:  ⏳ PENDENTE
Supabase:  ⏳ AGUARDANDO APLICAÇÃO
Tipos TS:  ⏳ AGUARDANDO MIGRAÇÃO
Deploy:    ⏳ AGUARDANDO TIPOS
```

---

## 💬 Resumo

Você tem duas opções agora:

### ✅ Opção 1: GitHub Sync (Automático)
- Conectar Supabase com GitHub
- Deixar fazer deploy automático
- Mais prático e seguro

### ✅ Opção 2: SQL Editor (Manual)
- Cole o SQL no Dashboard
- Execute manualmente
- Mais rápido (5 minutos)

**Recomendação:** Use a **Opção 2** agora (5 min) e depois configure GitHub Sync

---

**Próximo passo:** Abra o Supabase Dashboard e execute o SQL acima!

Data: 10 de dezembro de 2025
