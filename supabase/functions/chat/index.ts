import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, systemData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build system prompt with financial context
    let systemPrompt = `Você é o assistente de IA do EscFinan, um sistema de gestão financeira. 
Seja sempre educado, prestativo e forneça respostas claras e objetivas.
Você pode ajudar com:
- Dúvidas sobre como usar o sistema
- Estratégias financeiras e melhores práticas
- Análises e insights baseados nos dados do usuário
- Recomendações personalizadas para melhorar a gestão financeira

Responda sempre em português brasileiro.`;

    if (systemData) {
      systemPrompt += `\n\nContexto financeiro atual do usuário:
- Total de receitas: R$ ${systemData.totalIncome?.toLocaleString('pt-BR') || '0,00'}
- Total de despesas: R$ ${systemData.totalExpense?.toLocaleString('pt-BR') || '0,00'}
- Saldo: R$ ${systemData.balance?.toLocaleString('pt-BR') || '0,00'}
- Transações pendentes: ${systemData.pendingTransactions || 0}
- Contas bancárias: ${systemData.accountsCount || 0}`;
    }

    const gatewayUrl = "https://ai.gateway.lovable.dev/v1/chat/completions";
    const requestPayload = {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      stream: false,
    };

    const response = await fetch(gatewayUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestPayload),
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
          JSON.stringify({ error: "Créditos insuficientes. Por favor, adicione créditos à sua conta." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error", {
        status: response.status,
        statusText: response.statusText,
        url: gatewayUrl,
        requestPayload,
        headers: Object.fromEntries(response.headers.entries()),
        body: errorText,
      });
      return new Response(
        JSON.stringify({ 
          error: "Erro ao processar sua solicitação",
          details: {
            status: response.status,
            statusText: response.statusText,
            body: errorText?.slice(0, 1000),
          }
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    // Log mínimo para rastrear retorno do gateway
    try {
      console.log("AI gateway ok", {
        model: data.model,
        usage: data.usage,
        choice_preview: data.choices?.[0]?.message?.content?.slice(0, 200),
      });
    } catch (_) {}
    const aiResponse = data.choices?.[0]?.message?.content || "Desculpe, não consegui processar sua solicitação.";

    return new Response(
      JSON.stringify({
        response: aiResponse,
        type: "text",
      }),
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
