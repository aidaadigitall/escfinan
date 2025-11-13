import { OpenAI } from "openai";

interface AIAssistantRequest {
  message: string;
  systemData?: {
    totalIncome?: number;
    totalExpense?: number;
    balance?: number;
    pendingTransactions?: number;
    accountsCount?: number;
  };
  conversationHistory?: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}

interface AIAssistantResponse {
  response: string;
  type: "text" | "suggestion" | "insight";
}

const client = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `Você é um assistente de IA especializado em gestão financeira e consultoria empresarial. 
Seu objetivo é ajudar usuários do sistema EscFinan a:

1. **Suporte e Ajuda**: Responder dúvidas sobre como usar o sistema, explicar funcionalidades e guiar usuários.
2. **Análise Financeira**: Analisar dados financeiros fornecidos e identificar padrões, tendências e oportunidades.
3. **Estratégias**: Sugerir estratégias para melhorar a gestão financeira, reduzir custos e aumentar receitas.
4. **Tomadas de Decisão**: Fornecer recomendações baseadas em dados para ajudar em decisões importantes.

Você deve:
- Ser amigável, profissional e empático
- Fornecer respostas claras e concisas
- Usar dados concretos quando disponíveis
- Fazer perguntas de acompanhamento para entender melhor as necessidades
- Sugerir ações práticas e implementáveis
- Alertar sobre riscos financeiros quando identificados
- Reconhecer limitações e sugerir consulta com profissionais quando necessário

Responda sempre em português brasileiro.`;

export const callAIAssistant = async (
  request: AIAssistantRequest
): Promise<AIAssistantResponse> => {
  try {
    // Construir contexto do sistema
    let systemContext = SYSTEM_PROMPT;

    if (request.systemData) {
      systemContext += `\n\nDados Financeiros Atuais do Usuário:
- Receita Total: R$ ${(request.systemData.totalIncome || 0).toFixed(2)}
- Despesa Total: R$ ${(request.systemData.totalExpense || 0).toFixed(2)}
- Saldo Atual: R$ ${(request.systemData.balance || 0).toFixed(2)}
- Transações Pendentes: ${request.systemData.pendingTransactions || 0}
- Contas Bancárias: ${request.systemData.accountsCount || 0}`;
    }

    // Construir histórico de mensagens
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    if (request.conversationHistory && request.conversationHistory.length > 0) {
      request.conversationHistory.forEach((msg) => {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      });
    }

    // Adicionar mensagem atual
    messages.push({
      role: "user",
      content: request.message,
    });

    // Chamar API OpenAI
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
      response.choices[0]?.message?.content || "Desculpe, não consegui processar sua solicitação.";

    // Determinar tipo de resposta
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

    return {
      response: assistantMessage,
      type: responseType,
    };
  } catch (error) {
    console.error("Erro ao chamar assistente de IA:", error);
    throw new Error("Erro ao processar solicitação do assistente de IA");
  }
};

// Função para gerar sugestões baseadas em dados
export const generateFinancialInsights = async (
  analysis: {
    totalIncome: number;
    totalExpense: number;
    balance: number;
    topExpenses: Array<{ description: string; amount: number }>;
    topIncomes: Array<{ description: string; amount: number }>;
    monthlyTrend: Array<{ month: string; income: number; expense: number }>;
  }
): Promise<string> => {
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

  try {
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

    return (
      response.choices[0]?.message?.content ||
      "Não foi possível gerar insights no momento."
    );
  } catch (error) {
    console.error("Erro ao gerar insights:", error);
    throw new Error("Erro ao gerar insights financeiros");
  }
};
