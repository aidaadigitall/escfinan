// Este arquivo contém apenas a lógica de chamada para o backend
// A IA é chamada através do Lovable AI Gateway
import { supabase } from "@/integrations/supabase/client";

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
  creditsUsed?: number;
  creditsRemaining?: number;
}

/**
 * Chama o assistente de IA através da edge function
 * A edge function usa o Lovable AI Gateway
 */
export const callAIAssistant = async (
  request: AIAssistantRequest
): Promise<AIAssistantResponse> => {
  try {
    // Build messages array from conversation history
    const messages = request.conversationHistory?.map(m => ({
      role: m.role,
      content: m.content
    })) || [];

    // Add current user message
    messages.push({
      role: "user" as const,
      content: request.message
    });

    const { data, error } = await supabase.functions.invoke('chat', {
      body: { 
        messages,
        systemData: request.systemData
      }
    });

    if (error) {
      console.error("Erro ao chamar assistente de IA:", error);
      throw new Error(error.message || "Erro ao conectar com o assistente");
    }

    if (data?.error) {
      throw new Error(data.error);
    }

    return {
      response: data.response,
      type: data.type || "text",
    };
  } catch (error) {
    console.error("Erro ao chamar assistente de IA:", error);
    throw error;
  }
};

/**
 * Gera insights financeiros através do backend
 */
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
  try {
    const prompt = `Analise os seguintes dados financeiros e forneça insights úteis:

Total de Receitas: R$ ${analysis.totalIncome.toLocaleString('pt-BR')}
Total de Despesas: R$ ${analysis.totalExpense.toLocaleString('pt-BR')}
Saldo: R$ ${analysis.balance.toLocaleString('pt-BR')}

Principais Despesas:
${analysis.topExpenses.map(e => `- ${e.description}: R$ ${e.amount.toLocaleString('pt-BR')}`).join('\n')}

Principais Receitas:
${analysis.topIncomes.map(i => `- ${i.description}: R$ ${i.amount.toLocaleString('pt-BR')}`).join('\n')}

Tendência Mensal:
${analysis.monthlyTrend.map(m => `- ${m.month}: Receitas R$ ${m.income.toLocaleString('pt-BR')}, Despesas R$ ${m.expense.toLocaleString('pt-BR')}`).join('\n')}

Forneça 3-5 insights práticos e acionáveis para melhorar a saúde financeira.`;

    const { data, error } = await supabase.functions.invoke('chat', {
      body: { 
        messages: [{ role: "user", content: prompt }]
      }
    });

    if (error) {
      throw new Error(error.message || "Erro ao gerar insights");
    }

    return data.response;
  } catch (error) {
    console.error("Erro ao gerar insights:", error);
    throw error;
  }
};

/**
 * Busca o saldo de créditos do usuário (não aplicável ao Lovable AI)
 */
export const getUserAICredits = async (): Promise<{
  available_credits: number;
  total_credits: number;
  plan_type: string;
}> => {
  // Lovable AI tem créditos inclusos, retornamos valores padrão
  return {
    available_credits: 1000,
    total_credits: 1000,
    plan_type: "lovable"
  };
};
