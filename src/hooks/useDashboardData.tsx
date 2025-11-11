import { useTransactions } from "./useTransactions";
import { useMemo } from "react";
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const useDashboardData = () => {
  const { transactions, isLoading } = useTransactions();

  const dashboardData = useMemo(() => {
    const today = new Date();
    const startToday = startOfDay(today);
    const endToday = endOfDay(today);
    const startMonth = startOfMonth(today);
    const endMonth = endOfMonth(today);

    // Valores do dia
    const todayIncome = transactions
      .filter(t => {
        const dueDate = new Date(t.due_date);
        return t.type === "income" && dueDate >= startToday && dueDate <= endToday;
      })
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

    const todayExpenses = transactions
      .filter(t => {
        const dueDate = new Date(t.due_date);
        return t.type === "expense" && dueDate >= startToday && dueDate <= endToday;
      })
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

    // Valores do mês
    const monthIncome = transactions
      .filter(t => {
        const dueDate = new Date(t.due_date);
        return t.type === "income" && dueDate >= startMonth && dueDate <= endMonth;
      })
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

    const monthExpenses = transactions
      .filter(t => {
        const dueDate = new Date(t.due_date);
        return t.type === "expense" && dueDate >= startMonth && dueDate <= endMonth;
      })
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

    // Recebido vs a receber
    const monthIncomeReceived = transactions
      .filter(t => {
        const dueDate = new Date(t.due_date);
        return t.type === "income" && dueDate >= startMonth && dueDate <= endMonth && 
               (t.status === "received" || t.status === "confirmed" || t.status === "paid");
      })
      .reduce((sum, t) => {
        const paidValue = t.paid_amount && t.paid_amount > 0 ? t.paid_amount : t.amount;
        return sum + parseFloat(paidValue.toString());
      }, 0);

    const monthIncomePending = transactions
      .filter(t => {
        const dueDate = new Date(t.due_date);
        return t.type === "income" && dueDate >= startMonth && dueDate <= endMonth && 
               t.status === "pending";
      })
      .reduce((sum, t) => {
        const paidValue = t.paid_amount && t.paid_amount > 0 ? t.paid_amount : 0;
        const remainingValue = parseFloat(t.amount.toString()) - paidValue;
        return sum + remainingValue;
      }, 0);

    // Pago vs a pagar
    const monthExpensesPaid = transactions
      .filter(t => {
        const dueDate = new Date(t.due_date);
        return t.type === "expense" && dueDate >= startMonth && dueDate <= endMonth && 
               (t.status === "paid" || t.status === "confirmed");
      })
      .reduce((sum, t) => {
        const paidValue = t.paid_amount && t.paid_amount > 0 ? t.paid_amount : t.amount;
        return sum + parseFloat(paidValue.toString());
      }, 0);

    const monthExpensesPending = transactions
      .filter(t => {
        const dueDate = new Date(t.due_date);
        return t.type === "expense" && dueDate >= startMonth && dueDate <= endMonth && 
               t.status === "pending";
      })
      .reduce((sum, t) => {
        const paidValue = t.paid_amount && t.paid_amount > 0 ? t.paid_amount : 0;
        const remainingValue = parseFloat(t.amount.toString()) - paidValue;
        return sum + remainingValue;
      }, 0);

    // Últimos 6 meses para gráficos
    const last6MonthsData = Array.from({ length: 6 }, (_, i) => {
      const monthDate = subMonths(today, 5 - i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);

      const income = transactions
        .filter(t => {
          const dueDate = new Date(t.due_date);
          return t.type === "income" && dueDate >= monthStart && dueDate <= monthEnd &&
                 (t.status === "received" || t.status === "confirmed" || t.status === "paid");
        })
        .reduce((sum, t) => {
          const paidValue = t.paid_amount && t.paid_amount > 0 ? t.paid_amount : t.amount;
          return sum + parseFloat(paidValue.toString());
        }, 0);

      const expenses = transactions
        .filter(t => {
          const dueDate = new Date(t.due_date);
          return t.type === "expense" && dueDate >= monthStart && dueDate <= monthEnd &&
                 (t.status === "paid" || t.status === "confirmed");
        })
        .reduce((sum, t) => {
          const paidValue = t.paid_amount && t.paid_amount > 0 ? t.paid_amount : t.amount;
          return sum + parseFloat(paidValue.toString());
        }, 0);

      return {
        name: format(monthDate, "MMM", { locale: ptBR }),
        receitas: income,
        despesas: -expenses,
        valor: expenses,
      };
    });

    return {
      todayIncome,
      todayExpenses,
      monthIncome,
      monthExpenses,
      monthIncomeReceived,
      monthIncomePending,
      monthExpensesPaid,
      monthExpensesPending,
      incomePercentage: monthIncome > 0 ? (monthIncomeReceived / monthIncome) * 100 : 0,
      expensePercentage: monthExpenses > 0 ? (monthExpensesPaid / monthExpenses) * 100 : 0,
      last6MonthsData,
      currentMonth: format(today, "MMMM yyyy", { locale: ptBR }),
    };
  }, [transactions]);

  return { ...dashboardData, isLoading };
};
