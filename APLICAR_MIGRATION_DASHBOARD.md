# 🚀 Guia Rápido: Aplicar Migration do Dashboard Personalizado

## Passo 1: Acessar o Supabase Dashboard

1. Acesse [supabase.com](https://supabase.com)
2. Faça login na sua conta
3. Selecione seu projeto `escfinan`

## Passo 2: Abrir SQL Editor

1. No menu lateral esquerdo, clique em **"SQL Editor"**
2. Clique em **"New Query"** ou **"+ Nova Query"**

## Passo 3: Copiar a Migration

1. Abra o arquivo:
   ```
   supabase/migrations/20251211_dashboard_preferences.sql
   ```

2. Copie **TODO O CONTEÚDO** do arquivo (Ctrl+A, Ctrl+C)

## Passo 4: Executar a Migration

1. Cole o conteúdo no SQL Editor do Supabase
2. Clique no botão **"Run"** (▶️) ou pressione **Ctrl+Enter**
3. Aguarde a execução (deve levar alguns segundos)

## Passo 5: Verificar Sucesso

Você deve ver mensagens de sucesso como:

```
✅ CREATE TABLE IF NOT EXISTS dashboard_preferences
✅ CREATE TABLE IF NOT EXISTS dashboard_layout_templates
✅ INSERT INTO dashboard_layout_templates (4 rows)
✅ CREATE OR REPLACE FUNCTION get_or_create_dashboard_preferences
✅ CREATE OR REPLACE FUNCTION apply_layout_template
```

## Passo 6: Regenerar Tipos TypeScript (Opcional mas Recomendado)

### Opção A: Via Supabase CLI (se instalado)

```bash
# No terminal do projeto
cd /workspaces/escfinan

# Fazer login (se necessário)
npx supabase login

# Gerar tipos
npx supabase gen types typescript --project-id <seu-project-id> > src/integrations/supabase/types.ts
```

### Opção B: Manualmente (se não tiver CLI)

Os erros TypeScript vão sumir gradualmente conforme o sistema usar as novas tabelas. Por enquanto, você pode:

1. Comentar temporariamente os imports que dão erro
2. OU aguardar até ter acesso ao Supabase CLI
3. OU aceitar os avisos de tipo (não afeta funcionalidade)

## Passo 7: Testar Funcionalidade

1. Acesse a página **CRM** no sistema
2. Clique no botão **"⚙️ Dashboard"** no header
3. Você verá o modal de configurações com 4 abas

### Teste cada aba:

#### ✅ Layout
- Ative/desative o modo compacto
- Teste mostrar/ocultar sidebar
- Clique em "Resetar para Padrão"

#### ✅ Widgets
- Ative/desative alguns widgets
- Observe que as mudanças são salvas automaticamente

#### ✅ Tema
- Alterne entre Claro/Escuro/Auto
- Teste aplicar um tema predefinido
- Crie cores personalizadas

#### ✅ Templates
- Aplique cada template do sistema
- Salve seu layout atual como template

## 🎉 Pronto!

Seu **Dashboard Personalizado** está funcionando!

Cada usuário agora pode:
- ✅ Customizar cores e temas
- ✅ Escolher quais widgets exibir
- ✅ Aplicar layouts predefinidos
- ✅ Salvar seus próprios templates
- ✅ Alternar entre modo claro/escuro

---

## 📋 Checklist de Verificação

- [ ] Migration executada sem erros
- [ ] Tabela `dashboard_preferences` criada
- [ ] Tabela `dashboard_layout_templates` criada
- [ ] 4 templates do sistema inseridos
- [ ] Funções RPC criadas
- [ ] Botão "Dashboard" aparece no CRM
- [ ] Modal de configurações abre corretamente
- [ ] Mudanças de tema funcionam
- [ ] Ativar/desativar widgets funciona
- [ ] Templates podem ser aplicados

---

## 🆘 Solução de Problemas

### Erro: "relation dashboard_preferences does not exist"
**Solução**: A migration não foi executada. Repita os passos 2-4.

### Erro: "permission denied for table dashboard_preferences"
**Solução**: Verifique as políticas RLS. A migration já cria as políticas corretas, mas pode precisar de ajuste se seu setup de auth for customizado.

### Erro TypeScript: "Property does not exist on type"
**Solução**: Execute o Passo 6 para regenerar os tipos TypeScript.

### Modal de configurações não abre
**Solução**: 
1. Abra o console do navegador (F12)
2. Verifique se há erros JavaScript
3. Confirme que a migration foi executada
4. Limpe o cache do navegador (Ctrl+Shift+R)

---

## 📝 Notas Importantes

1. **Multi-tenancy**: As preferências são isoladas por usuário (RLS ativo)
2. **Performance**: Queries são otimizadas com índices
3. **Cache**: React Query mantém preferências em cache (5min)
4. **Auto-save**: Mudanças são salvas automaticamente
5. **Fallback**: Se não houver preferências, usa valores padrão

---

**Documentação Completa**: Consulte `DASHBOARD_PERSONALIZADO.md`
