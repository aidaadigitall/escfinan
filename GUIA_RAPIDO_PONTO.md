# ⚡ Guia Rápido - Sistema de Ponto

## 🎯 5 Passos para Começar

### 1️⃣ Aplicar Migrações (5 min)

**Via Supabase Dashboard (Recomendado):**
1. Acesse https://supabase.com/dashboard
2. Selecione seu projeto
3. SQL Editor → New Query
4. Copie todo o SQL de `/SETUP_MIGRACAO_TEMPO.md`
5. Execute

**Ou via Supabase CLI:**
```bash
supabase db push
```

### 2️⃣ Regenerar Tipos (2 min)

```bash
supabase gen types typescript --local > src/integrations/supabase/types.ts
```

### 3️⃣ Fazer Build (10 min)

```bash
npm run build
```

Deve terminar com: ✓ built in X.XXs

### 4️⃣ Deploy (varia)

Seu processo de deploy habitual (Vercel, GitHub Pages, etc)

### 5️⃣ Testar (5 min)

- Acesse `/ponto` no app
- Clique "Clock In"
- Clique "Clock Out"
- Verifique no "Banco de Horas"

---

## 🔑 URLs Principais

| Página | Caminho | Quem acessa |
|--------|---------|------------|
| Sistema de Ponto | `/ponto` | Todos |
| Aprovações | `/ponto/aprovacoes` | Gestores |

---

## 📱 Interface Rápida

### Aba "Hoje"
```
┌─────────────────────────┐
│ Entrada: 08:00          │
│ Saída: 18:00            │
│                         │
│ [Clock In]  [Clock Out] │
│ [Start Break] [End Break]│
│                         │
│ Horas: 9h 30m           │
│ Intervalo: 30m          │
└─────────────────────────┘
```

### Aba "Histórico"
```
┌─────┬─────────┬─────────┬──────┐
│ Data│ Entrada │ Saída   │ Hrs  │
├─────┼─────────┼─────────┼──────┤
│ 10/12│ 08:00  │ 18:00   │ 9h30m│
│ 09/12│ 08:15  │ 17:45   │ 9h20m│
└─────┴─────────┴─────────┴──────┘
```

### Aba "Banco de Horas"
```
┌──────────────┐
│ SALDO: +5h   │ ← positivo = crédito
│              │
│ Esperado: 160h
│ Trabalhado: 165h
└──────────────┘
```

---

## 🆘 Problemas Comuns

### "Erro ao fazer clock in"
✓ Verifique permissões no Supabase
✓ Confirme que a migração foi executada
✓ Limpe cache: `npm run build`

### Tabelas não aparecem
✓ Execute a migração novamente
✓ Atualize a página
✓ Regenere tipos: `supabase gen types typescript --local > src/integrations/supabase/types.ts`

### Botões não funcionam
✓ Verifique se está logado
✓ Abra DevTools (F12) → Console
✓ Procure por erros de rede

---

## 📊 Dados de Exemplo

```typescript
// Clock in
POST /api/time-tracking
{
  user_id: "uuid",
  date: "2025-12-10",
  clock_in: "2025-12-10T08:00:00Z",
  status: "completed"
}

// Solicitar edição
POST /api/time-clock-requests
{
  user_id: "uuid",
  time_tracking_id: "uuid",
  request_type: "edit_clock_in",
  reason: "Cheguei 5 minutos atrasado no trânsito",
  requested_value: "2025-12-10T08:05:00Z",
  status: "pending"
}
```

---

## 🎓 Conceitos

**Clock In**: Registro de entrada
**Clock Out**: Registro de saída
**Break**: Intervalo (almoço, café)
**Net Hours**: Horas trabalhadas - intervalo
**Balance Hours**: Net hours - horas esperadas (160h)

---

## ✅ Checklist Pós-Deploy

- [ ] Migrações aplicadas
- [ ] Tipos regenerados
- [ ] Build completo
- [ ] Deploy realizado
- [ ] URL `/ponto` acessível
- [ ] Clock in funciona
- [ ] Clock out funciona
- [ ] Banco de horas exibe saldo
- [ ] Gestor consegue aprovar (se configurado)

---

## 💬 Necessário Suporte?

Consulte:
1. `SETUP_MIGRACAO_TEMPO.md` - Migrações
2. `SISTEMA_DE_PONTO_COMPLETO.md` - Documentação completa
3. `RESUMO_IMPLEMENTACAO.txt` - Visão geral

---

**Status**: ✅ Pronto para uso
**Versão**: 1.0.0
**Data**: 10 de dezembro de 2025
