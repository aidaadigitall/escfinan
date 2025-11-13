// Este arquivo contém apenas a lógica de chamada para o backend
// A OpenAI é chamada apenas no servidor (seguro)

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
 * Chama o assistente de IA através do backend
 * O backend é responsável por chamar a OpenAI com segurança
 */
export const callAIAssistant = async (
  request: AIAssistantRequest
): Promise<AIAssistantResponse> => {
  try {
    const response = await fetch("/api/ai-assistant", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Erro ao conectar com o assistente");
    }

    const data: AIAssistantResponse = await response.json();
    return data;
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
    const response = await fetch("/api/ai-insights", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
      body: JSON.stringify({ analysis }),
    });

    if (!response.ok) {
      throw new Error("Erro ao gerar insights");
    }

    const data = await response.json();
    return data.insights;
  } catch (error) {
    console.error("Erro ao gerar insights:", error);
    throw error;
  }
};

/**
 * Busca o saldo de créditos do usuário
 */
export const getUserAICredits = async (): Promise<{
  available_credits: number;
  total_credits: number;
  plan_type: string;
}> => {
  try {
    const response = await fetch("/api/user/ai-credits", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
    });

    if (!response.ok) {
      throw new Error("Erro ao buscar créditos");
    }

    return await response.json();
  } catch (error) {
    console.error("Erro ao buscar créditos:", error);
    throw error;
  }
};
