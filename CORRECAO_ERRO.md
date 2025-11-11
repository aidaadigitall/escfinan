# Correção do Erro da Página em Branco na Rota /auth

## Problema Identificado

A página `/auth` estava ficando em branco devido a um erro no componente `Auth.tsx`. O erro ocorria porque o componente `TabsTrigger` do Radix UI estava sendo usado incorretamente **dentro** do `TabsContent`, nas linhas 336 e 471.

### Erro no Console:
```
Error: The above error occurred in the <RovingFocusGroupItem> component
```

## Causa Raiz

O componente `TabsTrigger` do Radix UI Tabs só pode ser usado dentro do componente `TabsList`. Quando usado fora desse contexto (como dentro de um `TabsContent`), ele causa um erro de contexto React porque espera estar dentro do `RovingFocusGroup` que é fornecido pelo `TabsList`.

## Locais do Erro

1. **Linha 336** - Dentro do `TabsContent` de "signin":
```tsx
<TabsTrigger value="signup" className="text-gray-400 hover:text-white flex items-center gap-1 p-0 h-auto">
  <User className="h-3 w-3" />
  Cadastre-se
</TabsTrigger>
```

2. **Linha 471** - Dentro do `TabsContent` de "signup":
```tsx
<TabsTrigger value="signin" className="text-gray-400 hover:text-white flex items-center gap-1 p-0 h-auto">
  <Lock className="h-3 w-3" />
  Já tenho conta
</TabsTrigger>
```

## Solução

Substituir o componente `TabsTrigger` por um botão simples que programaticamente muda a aba ativa usando o estado do React.

### Implementação:

1. Adicionar um estado para controlar a aba ativa
2. Substituir os `TabsTrigger` problemáticos por botões normais
3. Usar o evento `onClick` para mudar a aba ativa

## Arquivos Afetados

- `src/pages/Auth.tsx`
