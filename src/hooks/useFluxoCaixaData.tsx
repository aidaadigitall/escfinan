import { useTransactions } from "./useTransactions";
import { useMemo } from "react";
import { startOfMonth, endOfMonth, format, eachDayOfInterval, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

export const useFluxoCaixaData = (selectedPeriod: { start: Date; end: Date }) => {
  const { transactions, isLoading } = useTransactions();

  const fluxoData = useMemo(() => {
    const { start, end } = selectedPeriod;

    const filteredTransactions = transactions.filter(t => {
      const dueDate = new Date(t.due_date);
      return dueDate >= start && dueDate <= end;
    });

    // Resumo
    const income = filteredTransactions
      .filter(t => t.type === "income" && (t.status === "received" || t.status === "confirmed"))
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

    const expenses = filteredTransactions
      .filter(t => t.type === "expense" && (t.status === "paid" || t.status === "confirmed"))
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

    const pendingIncome = filteredTransactions
      .filter(t => t.type === "income" && t.status === "pending")
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

    const pendingExpenses = filteredTransactions
      .filter(t => t.type === "expense" && t.status === "pending")
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

    const balance = income - expenses;
    const finalBalance = balance + pendingIncome - pendingExpenses;

    // Diário - fluxo acumulado
    const days = eachDayOfInterval({ start, end });
    const dailyFlow = days.map(day => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);
      
      const dayTransactions = filteredTransactions.filter(t => {
        const dueDate = new Date(t.due_date);
        return dueDate >= dayStart && dueDate <= dayEnd;
      });

      const dayIncome = dayTransactions
        .filter(t => t.type === "income" && (t.status === "received" || t.status === "confirmed"))
        .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

      const dayExpenses = dayTransactions
        .filter(t => t.type === "expense" && (t.status === "paid" || t.status === "confirmed"))
        .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

      return {
        date: format(day, "dd/MM", { locale: ptBR }),
        value: dayIncome - dayExpenses,
        transactions: dayTransactions,
      };
    });

    // Calcular fluxo acumulado
    let accumulated = 0;
    const dailyFlowAccumulated = dailyFlow.map(day => {
      accumulated += day.value;
      return {
        ...day,
        accumulated,
      };
    });

    // Estatísticas - por categoria
    const expensesByCategory = filteredTransactions
      .filter(t => t.type === "expense" && (t.status === "paid" || t.status === "confirmed"))
      .reduce((acc, t) => {
        const category = t.account || "Outros";
        acc[category] = (acc[category] || 0) + parseFloat(t.amount.toString());
        return acc;
      }, {} as Record<string, number>);

    const categoryData = Object.entries(expensesByCategory).map(([name, value]) => ({
      name,
      value,
    }));

    return {
      balance,
      finalBalance,
      income,
      expenses,
      pendingIncome,
      pendingExpenses,
      incomeTransactions: filteredTransactions.filter(t => t.type === "income"),
      expenseTransactions: filteredTransactions.filter(t => t.type === "expense"),
      dailyFlow: dailyFlowAccumulated,
      categoryData,
    };
  }, [transactions, selectedPeriod]);

  return { ...fluxoData, isLoading };
};
