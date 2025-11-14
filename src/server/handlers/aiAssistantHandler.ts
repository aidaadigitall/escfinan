// Este arquivo contém os handlers para o backend
// Deve ser usado em um servidor Node.js/Express

import { initializeOpenAI, SYSTEM_PROMPT, CREDITS_CONFIG } from "../openai-config";
import type { AIAssistantRequest, AIAssistantResponse } from "../openai-config";

/**
 * Handler para processar requisições de IA
 * Chamado pelo endpoint POST /api/ai-assistant
 */
export const handleAIAssistantRequest = async (
  request: AIAssistantRequest,
  userId: string,
  userCredits: { available_credits: number }
): Promise<AIAssistantResponse> => {
  try {
    // 1. Verificar créditos
    if (userCredits.available_credits < CREDITS_CONFIG.MINIMUM_CREDITS_REQUIRED) {
      throw new Error(
        `Créditos insuficientes. Você tem ${userCredits.available_credits} créditos, mas precisa de ${CREDITS_CONFIG.MINIMUM_CREDITS_REQUIRED}.`
      );
    }

    // 2. Inicializar cliente OpenAI (apenas no servidor)
    const client = initializeOpenAI();

    // 3. Construir contexto do sistema
    let systemContext = SYSTEM_PROMPT;

    if (request.systemData) {
      systemContext += `\n\nDados Financeiros Atuais do Usuário:
- Receita Total: R$ ${(request.systemData.totalIncome || 0).toFixed(2)}
- Despesa Total: R$ ${(request.systemData.totalExpense || 0).toFixed(2)}
- Saldo Atual: R$ ${(request.systemData.balance || 0).toFixed(2)}
- Transações Pendentes: ${request.systemData.pendingTransactions || 0}
- Contas Bancárias: ${request.systemData.accountsCount || 0}`;
    }

    // 4. Construir histórico de mensagens
    const messages: any[] = [];

    if (request.conversationHistory && request.conversationHistory.length > 0) {
      request.conversationHistory.forEach((msg) => {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      });
    }

    // 5. Adicionar mensagem atual
    messages.push({
      role: "user",
      content: request.message,
    });

    // 6. Chamar API OpenAI
    const response = await client.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: systemContext,
        },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 1000,
      top_p: 0.9,
    });

    const assistantMessage =
      response.choices[0]?.message?.content ||
      "Desculpe, não consegui processar sua solicitação.";

    // 7. Calcular tokens usados
    const tokensUsed = response.usage?.total_tokens || 0;
    const creditsUsed = Math.max(
      CREDITS_CONFIG.CHAT_REQUEST_BASE_COST,
      Math.ceil((tokensUsed / 1000) * CREDITS_CONFIG.COST_PER_1K_TOKENS)
    );

    // 8. Determinar tipo de resposta
    let responseType: "text" | "suggestion" | "insight" = "text";
    if (
      assistantMessage.toLowerCase().includes("sugestão") ||
      assistantMessage.toLowerCase().includes("recomendo")
    ) {
      responseType = "suggestion";
    } else if (
      assistantMessage.toLowerCase().includes("insight") ||
      assistantMessage.toLowerCase().includes("análise")
    ) {
      responseType = "insight";
    }

    // 9. Registrar uso no banco de dados
    // TODO: Implementar registro em banco de dados
    // await db.query(
    //   `INSERT INTO ai_usage_log (user_id, credits_used, tokens_used, request_type)
    //    VALUES ($1, $2, $3, $4)`,
    //   [userId, creditsUsed, tokensUsed, responseType]
    // );

    // 10. Deduzir créditos
    // TODO: Implementar dedução de créditos
    // await db.query(
    //   `UPDATE user_ai_credits SET used_credits = used_credits + $1 WHERE user_id = $2`,
    //   [creditsUsed, userId]
    // );

    return {
      response: assistantMessage,
      type: responseType,
      tokensUsed,
      creditsUsed,
    };
  } catch (error) {
    console.error("Erro ao processar requisição de IA:", error);
    throw error;
  }
};

/**
 * Handler para gerar insights financeiros
 * Chamado pelo endpoint POST /api/ai-insights
 */
export const handleGenerateInsights = async (
  analysis: {
    totalIncome: number;
    totalExpense: number;
    balance: number;
    topExpenses: Array<{ description: string; amount: number }>;
    topIncomes: Array<{ description: string; amount: number }>;
    monthlyTrend: Array<{ month: string; income: number; expense: number }>;
  },
  userId: string,
  userCredits: { available_credits: number }
): Promise<{ insights: string; creditsUsed: number }> => {
  try {
    // 1. Verificar créditos
    if (userCredits.available_credits < CREDITS_CONFIG.INSIGHT_REQUEST_BASE_COST) {
      throw new Error(
        `Créditos insuficientes para gerar insights. Você tem ${userCredits.available_credits} créditos, mas precisa de ${CREDITS_CONFIG.INSIGHT_REQUEST_BASE_COST}.`
      );
    }

    // 2. Inicializar cliente OpenAI
    const client = initializeOpenAI();

    // 3. Construir prompt
    const prompt = `Baseado nos seguintes dados financeiros, forneça 3-4 insights principais e recomendações:

Receita Total: R$ ${analysis.totalIncome.toFixed(2)}
Despesa Total: R$ ${analysis.totalExpense.toFixed(2)}
Saldo: R$ ${analysis.balance.toFixed(2)}

Principais Despesas:
${analysis.topExpenses.map((e) => `- ${e.description}: R$ ${e.amount.toFixed(2)}`).join("\n")}

Principais Receitas:
${analysis.topIncomes.map((i) => `- ${i.description}: R$ ${i.amount.toFixed(2)}`).join("\n")}

Tendência Mensal:
${analysis.monthlyTrend.map((t) => `- ${t.month}: Receita R$ ${t.income.toFixed(2)}, Despesa R$ ${t.expense.toFixed(2)}`).join("\n")}

Forneça insights práticos e acionáveis em português brasileiro.`;

    // 4. Chamar API OpenAI
    const response = await client.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content:
            "Você é um analista financeiro especializado. Forneça insights claros e recomendações práticas.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const insights =
      response.choices[0]?.message?.content ||
      "Não foi possível gerar insights no momento.";

    // 5. Calcular tokens e créditos
    const tokensUsed = response.usage?.total_tokens || 0;
    const creditsUsed = Math.max(
      CREDITS_CONFIG.INSIGHT_REQUEST_BASE_COST,
      Math.ceil((tokensUsed / 1000) * CREDITS_CONFIG.COST_PER_1K_TOKENS)
    );

    // 6. Deduzir créditos
    // TODO: Implementar dedução de créditos
    // await db.query(
    //   `UPDATE user_ai_credits SET used_credits = used_credits + $1 WHERE user_id = $2`,
    //   [creditsUsed, userId]
    // );

    return {
      insights,
      creditsUsed,
    };
  } catch (error) {
    console.error("Erro ao gerar insights:", error);
    throw error;
  }
};
