# Lovable Setup & Operations Guide

Este guia explica como configurar o Lovable para operar no repositório escfinan e evitar bloqueios de atualização.

## 1. Permissões GitHub
- Conecte o Lovable à sua conta GitHub.
- Autorize acesso ao repositório `aidaadigitall/escfinan`.
- Caso a organização exija aprovação, peça a um admin para aprovar o app do Lovable.
- Habilite permissões de escrita (write) para permitir commits/PRs.
- Se houver proteção de branch, use PR com aprovação manual para merges.

## 2. Supabase: Função `chat` e Logs
- Edge Function: `supabase/functions/chat/index.ts`.
- Variáveis de ambiente: configure `LOVABLE_API_KEY` no projeto Supabase.
- Deploy (Dashboard): Edge Functions → chat → Deploy. 
- Logs: Edge Functions → chat → Logs. 
- Em caso de erro, você verá uma entrada “AI gateway error { … }” com detalhes.

## 3. Falta de Créditos no Lovable (402)
- O gateway não responderá sem créditos. 
- Soluções:
  - Recarregar créditos no Lovable.
  - Temporariamente desabilitar o Assistente de IA no frontend.
  - Alternar para outro provedor (OpenAI/Google) e atualizar `chat/index.ts`.

## 4. Checklists para Operar PRs do Lovable
- Branch de trabalho: `lovable-fix-crm`.
- Itens do PR:
  - [ ] Alinhar navegação CRM para `?leadId=`.
  - [ ] Pré-preencher Orçamentos/OS/Vendas a partir do `leadId`.
  - [ ] Adicionar `AdvancedSearchBar` em Clientes/Fornecedores.
  - [ ] Migrar `lead_sources` com RLS + índices.
  - [ ] Melhorar logs da função `chat` (request/response detalhados).

## 5. Comandos úteis (local)
```bash
npm install
npm run dev
```

## 6. Dúvidas comuns
- “Lovable não atualiza”: verifique créditos, permissões GitHub e variáveis no Supabase.
- “Sem logs”: ajuste nível de compartilhamento na org do Supabase para permitir leitura de metadata/logs.

---
Última atualização: 2025-12-11
