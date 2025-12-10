# Guia de Testes em Dispositivos Reais — Responsividade Cross-Browser

## 📱 Testes em iPhone (iOS)

### Preparação
1. **Conecte o iPhone na mesma rede que o computador de desenvolvimento**
2. **Inicie o servidor dev:**
   ```bash
   npm run dev
   ```
   Nota: Anotee o IP local mostrado (ex: `http://192.168.x.x:5173`)

3. **No iPhone, abra Safari e acesse:**
   - `http://192.168.x.x:5173` (substitua o IP)
   - Safari abrirá a aplicação

### Checklist de Testes — iPhone

#### Layout & Navegação
- [ ] **Sidebar em mobile:** colapsada ou em overlay (não deve ocupar > 25% da tela)
- [ ] **Botão flutuante do AI:** posicionado corretamente (canto inferior direito, com margem)
- [ ] **Cabeçalho (Header):** nenhum elemento transborda (menu, logo, notifications)
- [ ] **Menu items:** todos os itens são tocáveis (altura mín. 44px)

#### Tabelas
- [ ] **Scroll horizontal:** tabelas grandes podem ser roladas horizontalmente (não cortadas)
- [ ] **Fonte legível:** texto não fica muito pequeno em telas pequeninhas (5S: 5.1")
- [ ] **Dados financeiros:** formatação de moeda visível (R$ XXX,XX)

#### Diálogos e Forms
- [ ] **Diálogos modais:** ocupam 95% da largura da tela (margem 2.5% em cada lado)
- [ ] **Campos de input:** altura mín. 44px para toque confortável
- [ ] **Botões (OK, Cancelar):** alinhados corretamente, separados por gap
- [ ] **Teclado virtual:** não obscurece campos de input críticos (scroll automático)

#### Chat de IA
- [ ] **Chat window:** responsiva (mobile: `calc(100vw - 32px)`, sm+: 384px)
- [ ] **Mensagens:** quebram corretamente, máx 80% de largura em mobile
- [ ] **Ações rápidas:** 2 colunas em mobile (Ajuda | Estratégia; Análise | Decisão)
- [ ] **Input de texto:** visível acima do teclado

#### Compatibilidade Safari iOS
- [ ] **Notch/safe-area:** conteúdo não fica atrás do notch (iPhone X+)
- [ ] **Dark mode:** ativa/desativa corretamente (Settings > Display)
- [ ] **Zoom:** página não permite zoom indesejado (viewport meta está correto)
- [ ] **Pesquisa por voz:** funciona em campos de input

---

## 🤖 Testes em Android

### Preparação
1. **Use um emulador Android ou dispositivo físico conectado com USB**
2. **Ativar USB debugging (Configurações > Opções de desenvolvedor > Depuração USB)**
3. **Inicie o servidor dev:**
   ```bash
   npm run dev
   ```

4. **No Android, abra Chrome e acesse:**
   - `http://192.168.x.x:5173` (substitua o IP local)
   - Chrome abrirá a aplicação

### Checklist de Testes — Android

#### Layout & Navegação
- [ ] **Sidebar:** responsiva em breakpoints sm/md (320px, 375px, 480px, 768px)
- [ ] **Botão flutuante:** não sobrepõe navegação de sistema (gestos, botões virtuais)
- [ ] **StatusBar + NavBar:** não obstruem conteúdo principal
- [ ] **Touch targets:** mínimo 48px (Android standard) para todos os botões

#### Tabelas
- [ ] **Scroll horizontal:** fluido (sem travamentos em Snapdragon/Exynos)
- [ ] **Linhas alternadas:** cores contrastam bem em luz e escuridade
- [ ] **Compressão de texto:** labels longos não quebram design

#### Diálogos e Forms
- [ ] **Teclado virtual:** push-up do conteúdo funciona (não fica oculto)
- [ ] **Campos de input:** ativação correta (foco visual, cor de borda)
- [ ] **Autocomplete:** não interfere com UX (desabilitar se necessário)
- [ ] **Datepicker:** abre nativa (Material Design picker)

#### Chat de IA
- [ ] **Responsividade:** idêntica ao iOS
- [ ] **Scroll de mensagens:** animação suave
- [ ] **Botões rápidos:** tamanho adaptável (10px font em mobile)
- [ ] **Notificações (toasts):** aparecem no topo/centro, não obscurecem

#### Compatibilidade Chrome Android
- [ ] **Tema de cor:** detecta e respeita dark mode (Settings > Display)
- [ ] **Font scaling:** aumentar/diminuir fonte do sistema não quebra layout
- [ ] **Hardware acceleration:** gráficos/charts renderizam smoothly
- [ ] **Gesture:** suporte a pinch-to-zoom, swipe (se implementado)

---

## 🔬 Testes de Performance & Rede

### Throttling (ambos iOS e Android)
Use DevTools (Chrome) para simular conexão lenta:
1. **Abra DevTools:** F12 (Windows/Linux) ou ⌘+Option+I (Mac)
2. **Network tab:** defina throttling para "Slow 4G"
3. **Recarregue:** `npm run dev` deve renderizar em < 3s mesmo em rede lenta
4. **Observações:**
   - Telas de loading aparecem (spinners, skeletons)
   - Chat de IA aguarda resposta com indicador de loading
   - Tabelas carregam de forma progressiva (não congelam)

### Teste de Bateria (Android)
- Deixe a aplicação rodar por 10+ minutos
- Verificar se CPU/GPU não ficam em 100% (battery drain excessivo)
- Scroll infinito em tabelas não causa vazamento de memória

---

## 📐 Breakpoints para Testar Especificamente

| Device | Width | Height | Nota |
|--------|-------|--------|------|
| iPhone SE (1ª gen) | 320px | 568px | Teste mais rigoroso (super pequena) |
| iPhone 8 | 375px | 667px | Baseline mobile |
| iPhone 11 | 414px | 896px | Tela maior, notch |
| iPhone 14 Pro | 393px | 852px | Dinâmica island |
| Pixel 5 | 393px | 851px | Android baseline |
| Pixel 7 | 412px | 915px | Tela grande |
| iPad Air | 768px | 1024px | Tablet (sm breakpoint) |
| iPad Pro 12.9" | 1024px | 1366px | Tablet grande (md+ breakpoint) |

**Dica:** Use Chrome DevTools `Cmd/Ctrl + Shift + M` para simular esses tamanhos.

---

## 🐛 Problemas Comuns & Soluções Rápidas

### Problema: Sidebar oculta conteúdo em mobile
**Solução:** Verify `w-full sm:w-56 md:w-64` e `overflow-y-auto` em `src/components/Sidebar.tsx`

### Problema: Tabelas cortadas em mobile
**Solução:** Verify `overflow-x-auto` e `scrollbar-hide` em `src/components/ui/table.tsx`

### Problema: Diálogo fecha inesperadamente
**Solução:** Verifique `max-h-[90vh] overflow-y-auto` em `src/components/ui/dialog.tsx`

### Problema: Teclado cobre campo de input
**Solução:** Usar `scrollIntoView({ behavior: 'smooth' })` em forms (check in `TransactionDialog.tsx`)

### Problema: Fonte muito pequena em mobile
**Solução:** Classes como `text-xs sm:text-sm` e `text-base sm:text-sm` em inputs

---

## ✅ Relatório Final

Após testar em ambos iOS e Android, preencha:

```markdown
## Testes Completados

### iPhone (Safari)
- [ ] Layout responsivo OK
- [ ] Tabelas com scroll horizontal OK
- [ ] Diálogos/Forms OK
- [ ] Chat de IA OK
- [ ] Dark mode OK
- [ ] Notch/safe-area OK
- **Observações:**

### Android (Chrome)
- [ ] Layout responsivo OK
- [ ] Tabelas com scroll horizontal OK
- [ ] Diálogos/Forms OK
- [ ] Chat de IA OK
- [ ] Dark mode OK
- [ ] Teclado virtual OK
- **Observações:**

### Performance & Bateria
- [ ] Sem travamentos em rede lenta OK
- [ ] Sem excessive battery drain OK
- [ ] Sem memory leaks OK

### Issues Encontrados
- [ ] Nenhum
- [ ] [Descrever]
```

---

## 📞 Suporte Rápido

Se encontrar problemas, execute:
```bash
# Verificar console do navegador (DevTools)
# Abrir: F12 (Windows/Linux) ou ⌘+Option+I (Mac)
# Aba: Console, Network, Device Toolbar

# Build de produção local (simula deploy real)
npm run build
npm run preview  # Abre http://localhost:4173

# Limpar cache (se tiver problemas de renderização)
# iOS Safari: Settings > Safari > Clear History and Website Data
# Android Chrome: Settings > Apps > Chrome > Storage > Clear Cache
```

---

**Criado:** 9 de Dezembro de 2025  
**Última atualização:** Sistema responsivo v1.0 (Sidebar, AIAssistant, Tables, Forms, Dialogs)
