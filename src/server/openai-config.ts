// Este arquivo DEVE ser executado apenas no servidor (backend)
// Nunca exponha a chave da OpenAI no frontend

import { OpenAI } from "openai";

// Inicializar cliente OpenAI apenas no servidor
export const initializeOpenAI = () => {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY não configurada. Configure a variável de ambiente."
    );
  }

  return new OpenAI({
    apiKey,
  });
};

// Tipos para requisições
export interface AIAssistantRequest {
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

export interface AIAssistantResponse {
  response: string;
  type: "text" | "suggestion" | "insight";
  tokensUsed: number;
  creditsUsed: number;
}

// Constantes
export const SYSTEM_PROMPT = `Você é um assistente de IA especializado em gestão financeira e consultoria empresarial. 
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

// Configuração de créditos
export const CREDITS_CONFIG = {
  COST_PER_1K_TOKENS: 10, // 1000 tokens = 10 créditos
  MINIMUM_CREDITS_REQUIRED: 10,
  CHAT_REQUEST_BASE_COST: 10,
  INSIGHT_REQUEST_BASE_COST: 50,
};

// Planos de créditos
export const CREDIT_PLANS = {
  starter: {
    name: "Starter",
    price: 29,
    credits: 5000,
    description: "Para pequenos negócios",
  },
  professional: {
    name: "Professional",
    price: 79,
    credits: 20000,
    description: "Para médias empresas",
  },
  enterprise: {
    name: "Enterprise",
    price: 199,
    credits: 100000,
    description: "Para grandes empresas",
  },
};
