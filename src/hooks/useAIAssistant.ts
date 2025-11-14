import { useCallback } from "react";
import { useTransactions } from "./useTransactions";
import { useBankAccounts } from "./useBankAccounts";

export interface SystemAnalysis {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  pendingTransactions: number;
  accountsCount: number;
  incomeByCategory: { [key: string]: number };
  expenseByCategory: { [key: string]: number };
  monthlyTrend: { month: string; income: number; expense: number }[];
  topExpenses: { description: string; amount: number }[];
  topIncomes: { description: string; amount: number }[];
}

export const useAIAssistant = () => {
  const { transactions } = useTransactions();
  const { accounts } = useBankAccounts();

  const analyzeSystemData = useCallback((): SystemAnalysis => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Calcular totais
    const totalIncome = transactions
      .filter((t) => t.type === "income" && t.status === "received")
      .reduce((sum, t) => sum + (t.paid_amount || t.amount), 0);

    const totalExpense = transactions
      .filter((t) => t.type === "expense" && t.status === "paid")
      .reduce((sum, t) => sum + (t.paid_amount || t.amount), 0);

    const balance = accounts.reduce(
      (sum, acc) => sum + parseFloat(acc.current_balance.toString()),
      0
    );

    const pendingTransactions = transactions.filter(
      (t) => t.status === "pending"
    ).length;

    // Agrupar por categoria
    const incomeByCategory: { [key: string]: number } = {};
    const expenseByCategory: { [key: string]: number } = {};

    transactions.forEach((t) => {
      const category = "Geral"; // Category field doesn't exist in database
      const amount = t.paid_amount || t.amount;

      if (t.type === "income") {
        incomeByCategory[category] =
          (incomeByCategory[category] || 0) + amount;
      } else {
        expenseByCategory[category] =
          (expenseByCategory[category] || 0) + amount;
      }
    });

    // Tendência mensal (últimos 6 meses)
    const monthlyTrend: { month: string; income: number; expense: number }[] =
      [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - i, 1);
      const month = date.toLocaleDateString("pt-BR", {
        month: "short",
        year: "2-digit",
      });

      const monthIncome = transactions
        .filter(
          (t) =>
            t.type === "income" &&
            new Date(t.due_date).getMonth() === date.getMonth() &&
            new Date(t.due_date).getFullYear() === date.getFullYear()
        )
        .reduce((sum, t) => sum + (t.paid_amount || t.amount), 0);

      const monthExpense = transactions
        .filter(
          (t) =>
            t.type === "expense" &&
            new Date(t.due_date).getMonth() === date.getMonth() &&
            new Date(t.due_date).getFullYear() === date.getFullYear()
        )
        .reduce((sum, t) => sum + (t.paid_amount || t.amount), 0);

      monthlyTrend.push({ month, income: monthIncome, expense: monthExpense });
    }

    // Top despesas e receitas
    const topExpenses = transactions
      .filter((t) => t.type === "expense")
      .sort((a, b) => (b.paid_amount || b.amount) - (a.paid_amount || a.amount))
      .slice(0, 5)
      .map((t) => ({
        description: t.description,
        amount: t.paid_amount || t.amount,
      }));

    const topIncomes = transactions
      .filter((t) => t.type === "income")
      .sort((a, b) => (b.paid_amount || b.amount) - (a.paid_amount || a.amount))
      .slice(0, 5)
      .map((t) => ({
        description: t.description,
        amount: t.paid_amount || t.amount,
      }));

    return {
      totalIncome,
      totalExpense,
      balance,
      pendingTransactions,
      accountsCount: accounts.length,
      incomeByCategory,
      expenseByCategory,
      monthlyTrend,
      topExpenses,
      topIncomes,
    };
  }, [transactions, accounts]);

  const generateSystemContext = useCallback((): string => {
    const analysis = analyzeSystemData();

    return `
Contexto do Sistema Financeiro:
- Receita Total: R$ ${analysis.totalIncome.toFixed(2)}
- Despesa Total: R$ ${analysis.totalExpense.toFixed(2)}
- Saldo Atual: R$ ${analysis.balance.toFixed(2)}
- Transações Pendentes: ${analysis.pendingTransactions}
- Contas Bancárias: ${analysis.accountsCount}
- Principais Despesas: ${analysis.topExpenses
      .map((e) => `${e.description} (R$ ${e.amount.toFixed(2)})`)
      .join(", ")}
- Principais Receitas: ${analysis.topIncomes
      .map((i) => `${i.description} (R$ ${i.amount.toFixed(2)})`)
      .join(", ")}
`;
  }, [analyzeSystemData]);

  return {
    analyzeSystemData,
    generateSystemContext,
  };
};
