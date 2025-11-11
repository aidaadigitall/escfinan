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

    // Resumo - incluindo pagamentos parciais
    const income = filteredTransactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => {
        // Se está confirmado, use paid_amount ou amount
        if (t.status === "received" || t.status === "confirmed" || t.status === "paid") {
          const paidValue = t.paid_amount && t.paid_amount > 0 ? t.paid_amount : t.amount;
          return sum + parseFloat(paidValue.toString());
        }
        // Se está pendente mas tem pagamento parcial, some apenas o parcial
        if (t.status === "pending" && t.paid_amount && t.paid_amount > 0) {
          return sum + parseFloat(t.paid_amount.toString());
        }
        return sum;
      }, 0);

    const expenses = filteredTransactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => {
        // Se está confirmado, use paid_amount ou amount
        if (t.status === "paid" || t.status === "confirmed") {
          const paidValue = t.paid_amount && t.paid_amount > 0 ? t.paid_amount : t.amount;
          return sum + parseFloat(paidValue.toString());
        }
        // Se está pendente mas tem pagamento parcial, some apenas o parcial
        if (t.status === "pending" && t.paid_amount && t.paid_amount > 0) {
          return sum + parseFloat(t.paid_amount.toString());
        }
        return sum;
      }, 0);

    const pendingIncome = filteredTransactions
      .filter(t => t.type === "income" && t.status === "pending")
      .reduce((sum, t) => {
        const paidValue = t.paid_amount && t.paid_amount > 0 ? t.paid_amount : 0;
        const remainingValue = parseFloat(t.amount.toString()) - paidValue;
        return sum + remainingValue;
      }, 0);

    const pendingExpenses = filteredTransactions
      .filter(t => t.type === "expense" && t.status === "pending")
      .reduce((sum, t) => {
        const paidValue = t.paid_amount && t.paid_amount > 0 ? t.paid_amount : 0;
        const remainingValue = parseFloat(t.amount.toString()) - paidValue;
        return sum + remainingValue;
      }, 0);

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
        .filter(t => t.type === "income")
        .reduce((sum, t) => {
          // Se está confirmado, use paid_amount ou amount
          if (t.status === "received" || t.status === "confirmed" || t.status === "paid") {
            const paidValue = t.paid_amount && t.paid_amount > 0 ? t.paid_amount : t.amount;
            return sum + parseFloat(paidValue.toString());
          }
          // Se está pendente mas tem pagamento parcial, some apenas o parcial
          if (t.status === "pending" && t.paid_amount && t.paid_amount > 0) {
            return sum + parseFloat(t.paid_amount.toString());
          }
          return sum;
        }, 0);

      const dayExpenses = dayTransactions
        .filter(t => t.type === "expense")
        .reduce((sum, t) => {
          // Se está confirmado, use paid_amount ou amount
          if (t.status === "paid" || t.status === "confirmed") {
            const paidValue = t.paid_amount && t.paid_amount > 0 ? t.paid_amount : t.amount;
            return sum + parseFloat(paidValue.toString());
          }
          // Se está pendente mas tem pagamento parcial, some apenas o parcial
          if (t.status === "pending" && t.paid_amount && t.paid_amount > 0) {
            return sum + parseFloat(t.paid_amount.toString());
          }
          return sum;
        }, 0);

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

    // Estatísticas - por categoria (incluindo pagamentos parciais)
    const expensesByCategory = filteredTransactions
      .filter(t => t.type === "expense")
      .reduce((acc, t) => {
        const category = t.account || "Outros";
        let paidValue = 0;
        
        if (t.status === "paid" || t.status === "confirmed") {
          paidValue = t.paid_amount && t.paid_amount > 0 ? t.paid_amount : t.amount;
        } else if (t.status === "pending" && t.paid_amount && t.paid_amount > 0) {
          paidValue = t.paid_amount;
        }
        
        if (paidValue > 0) {
          acc[category] = (acc[category] || 0) + parseFloat(paidValue.toString());
        }
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
