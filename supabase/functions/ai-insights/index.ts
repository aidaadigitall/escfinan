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
    const { analysis } = await req.json();

    if (!analysis) {
      return new Response(
        JSON.stringify({ error: "Campo 'analysis' é obrigatório" }),
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

    const prompt = `Baseado nos seguintes dados financeiros, forneça 3-4 insights principais e recomendações práticas, em português brasileiro.\n\nReceita Total: R$ ${Number(analysis.totalIncome || 0).toFixed(2)}\nDespesa Total: R$ ${Number(analysis.totalExpense || 0).toFixed(2)}\nSaldo: R$ ${Number(analysis.balance || 0).toFixed(2)}\n\nPrincipais Despesas:\n${(analysis.topExpenses || [])
      .map((e: any) => `- ${e.description}: R$ ${Number(e.amount || 0).toFixed(2)}`)
      .join("\n")}\n\nPrincipais Receitas:\n${(analysis.topIncomes || [])
      .map((i: any) => `- ${i.description}: R$ ${Number(i.amount || 0).toFixed(2)}`)
      .join("\n")}\n\nTendência Mensal:\n${(analysis.monthlyTrend || [])
      .map((t: any) => `- ${t.month}: Receita R$ ${Number(t.income || 0).toFixed(2)}, Despesa R$ ${Number(t.expense || 0).toFixed(2)}`)
      .join("\n")}`;

    const gatewayResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "Você é um analista financeiro especializado. Forneça insights claros, objetivos e acionáveis.",
          },
          { role: "user", content: prompt },
        ],
        stream: false,
      }),
    });

    if (!gatewayResp.ok) {
      if (gatewayResp.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de solicitações excedido. Tente novamente." }),
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
      console.error("AI gateway error (insights):", gatewayResp.status, t);
      return new Response(JSON.stringify({ error: "Falha no gateway de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await gatewayResp.json();
    const insights: string = data?.choices?.[0]?.message?.content ?? "Não foi possível gerar insights agora.";

    return new Response(JSON.stringify({ insights }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-insights error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
