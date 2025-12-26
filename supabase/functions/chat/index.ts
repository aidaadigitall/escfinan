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
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { authorization: authHeader } }
    });
    
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { messages, systemData, model, provider, customApiKey } = await req.json();
    
    // Build system prompt - CEO/Estrategista
    let systemPrompt = `Você é um CEO, Analista de Negócios e Estrategista altamente inteligente do sistema EscFinan.
Você atua como um consultor executivo em todos os departamentos: Financeiro, Comercial, Operacional e Estratégico.

Suas competências:
- 📊 Análise financeira avançada (DRE, fluxo de caixa, indicadores)
- 💼 Estratégias comerciais e de vendas
- 🎯 Insights de negócios e oportunidades de crescimento
- 📈 Recomendações baseadas em dados
- 🔮 Previsões e tendências de mercado
- ⚡ Otimização de processos e custos

Seja direto, objetivo e forneça recomendações acionáveis. Responda em português brasileiro.`;

    if (systemData) {
      systemPrompt += `\n\nContexto financeiro atual:
- Receitas: R$ ${systemData.totalIncome?.toLocaleString('pt-BR') || '0'}
- Despesas: R$ ${systemData.totalExpense?.toLocaleString('pt-BR') || '0'}
- Saldo: R$ ${systemData.balance?.toLocaleString('pt-BR') || '0'}
- Transações pendentes: ${systemData.pendingTransactions || 0}
- Contas bancárias: ${systemData.accountsCount || 0}`;
    }

    // Use Lovable AI Gateway by default
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
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

    console.log(`AI request - User: ${user.id}, Model: ${gatewayModel}`);

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
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Erro no gateway de IA");
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || "Desculpe, não consegui processar sua solicitação.";

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
