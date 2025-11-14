import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é um assistente de IA especializado em gestão financeira e consultoria empresarial.
Responda em português brasileiro, de forma clara e objetiva, ajudando com dúvidas do sistema, análises e recomendações.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, systemData, conversationHistory } = await req.json();

    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "Campo 'message' é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY não configurada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Monta contexto do sistema com dados financeiros, se fornecidos
    let systemContext = SYSTEM_PROMPT;
    if (systemData && typeof systemData === "object") {
      const { totalIncome = 0, totalExpense = 0, balance = 0, pendingTransactions = 0, accountsCount = 0 } = systemData;
      systemContext += `\n\nDados atuais do usuário:\n- Receita Total: R$ ${Number(totalIncome).toFixed(2)}\n- Despesa Total: R$ ${Number(totalExpense).toFixed(2)}\n- Saldo Atual: R$ ${Number(balance).toFixed(2)}\n- Transações Pendentes: ${pendingTransactions}\n- Contas Bancárias: ${accountsCount}`;
    }

    // Converte histórico apenas para role/content
    const history = Array.isArray(conversationHistory)
      ? conversationHistory
          .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
          .map((m) => ({ role: m.role, content: m.content }))
      : [];

    // Chamada ao gateway de IA (compatível com OpenAI)
    const gatewayResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemContext },
          ...history,
          { role: "user", content: message },
        ],
        stream: false,
      }),
    });

    if (!gatewayResp.ok) {
      if (gatewayResp.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de solicitações excedido. Tente novamente em instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (gatewayResp.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos esgotados. Adicione créditos para continuar usando a IA." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await gatewayResp.text();
      console.error("AI gateway error:", gatewayResp.status, t);
      return new Response(JSON.stringify({ error: "Falha no gateway de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await gatewayResp.json();
    const content: string = data?.choices?.[0]?.message?.content ?? "Não foi possível obter resposta agora.";

    let type: "text" | "suggestion" | "insight" = "text";
    const lc = content.toLowerCase();
    if (lc.includes("sugestão") || lc.includes("recomendo")) type = "suggestion";
    else if (lc.includes("insight") || lc.includes("análise")) type = "insight";

    const responseBody = {
      response: content,
      type,
      creditsUsed: data?.usage?.total_tokens ? Math.max(10, Math.ceil((data.usage.total_tokens / 1000) * 10)) : undefined,
      tokensUsed: data?.usage?.total_tokens,
    };

    return new Response(JSON.stringify(responseBody), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-assistant error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
