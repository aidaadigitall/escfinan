import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Autenticação necessária. Faça login." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { authorization: authHeader } }
    });
    
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Sessão expirada. Faça login novamente." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { messages, systemData, systemContext, model, provider, customApiKey } = await req.json();
    
    // Build comprehensive system prompt - CEO/Estrategista de todos os setores
    let systemPrompt = `Você é um CEO, Gestor Estratégico e Consultor Executivo de alta performance do sistema EscFinan.

🎯 SUA MISSÃO:
Atuar como um especialista em TODOS os setores da empresa, fornecendo orientação estratégica, análises inteligentes e recomendações acionáveis para o usuário e o CEO da empresa.

═══════════════════════════════════════════════════════════
📊 SUAS ÁREAS DE EXPERTISE
═══════════════════════════════════════════════════════════

💰 FINANCEIRO
- Análise de fluxo de caixa e DRE
- Gestão de contas a pagar e receber
- Planejamento orçamentário
- Otimização de custos e margem de lucro
- Indicadores financeiros (ROI, EBITDA, Liquidez)

🎯 CRM & VENDAS
- Gestão do pipeline de vendas
- Qualificação e scoring de leads
- Estratégias de conversão
- Análise de funil de vendas
- Previsão de receitas (forecast)

📋 PROJETOS
- Gestão de portfólio de projetos
- Análise de progresso e riscos
- Alocação de recursos
- Controle de orçamento de projetos
- Metodologias ágeis e tradicionais

🔧 OPERAÇÕES & SERVIÇOS
- Gestão de ordens de serviço
- Eficiência operacional
- Controle de qualidade
- SLA e tempo de resposta
- Melhoria contínua

👥 RECURSOS HUMANOS
- Gestão de equipe e produtividade
- Alocação de funcionários
- Controle de ponto e férias
- Performance e metas

📦 ESTOQUE & PRODUTOS
- Gestão de inventário
- Análise de giro de estoque
- Reposição inteligente
- Precificação e markup

🏢 CLIENTES
- Relacionamento com clientes
- Análise de carteira
- Retenção e fidelização
- Customer Success

═══════════════════════════════════════════════════════════
🧠 COMO VOCÊ DEVE RESPONDER
═══════════════════════════════════════════════════════════

1. SEJA ESTRATÉGICO: Sempre analise o contexto geral antes de responder
2. SEJA PRÁTICO: Forneça recomendações acionáveis e específicas
3. USE DADOS: Baseie suas análises nos números e métricas disponíveis
4. PRIORIZE: Indique o que é mais urgente ou importante
5. SUGIRA AÇÕES: Termine com próximos passos claros
6. SEJA PROATIVO: Antecipe problemas e oportunidades

📝 FORMATO DE RESPOSTA:
- Use emojis para organizar visualmente
- Destaque números importantes
- Divida em seções claras
- Seja objetivo mas completo
- Forneça insights de CEO

Você está aqui para GUIAR, ORIENTAR e AJUDAR o usuário a tomar as melhores decisões para o negócio.
Responda sempre em português brasileiro de forma profissional mas acessível.`;

    // Add full system context if available
    if (systemContext) {
      systemPrompt += `\n\n${systemContext}`;
    } else if (systemData) {
      // Legacy support for simple financial data
      systemPrompt += `\n\n📊 CONTEXTO FINANCEIRO:
• Receitas: R$ ${systemData.totalIncome?.toLocaleString('pt-BR') || '0'}
• Despesas: R$ ${systemData.totalExpense?.toLocaleString('pt-BR') || '0'}
• Saldo: R$ ${systemData.balance?.toLocaleString('pt-BR') || '0'}
• Transações pendentes: ${systemData.pendingTransactions || 0}
• Contas bancárias: ${systemData.accountsCount || 0}`;
    }

    // Use Lovable AI Gateway
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("Configuração de IA não encontrada");
    }

    // Map model names for gateway
    let gatewayModel = model || "google/gemini-2.5-flash";
    if (!gatewayModel.includes("/")) {
      const modelMap: Record<string, string> = {
        "gemini-2.5-flash": "google/gemini-2.5-flash",
        "gemini-2.5-pro": "google/gemini-2.5-pro",
        "gpt-4o": "openai/gpt-5",
        "gpt-4o-mini": "openai/gpt-5-mini",
        "gpt-4.1-mini": "openai/gpt-5-mini",
      };
      gatewayModel = modelMap[gatewayModel] || "google/gemini-2.5-flash";
    }

    console.log(`AI Strategic Request - User: ${user.id}, Model: ${gatewayModel}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: gatewayModel,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Aguarde alguns minutos e tente novamente." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA insuficientes. Verifique seu plano." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Erro ao processar sua solicitação");
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || "Desculpe, não consegui processar sua solicitação no momento.";

    return new Response(
      JSON.stringify({ response: aiResponse, type: "text" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
