import { useTransactions } from "./useTransactions";
import { useMemo } from "react";
import { startOfMonth, endOfMonth, subMonths, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

// Helper function to parse date string as local date (avoiding timezone issues)
const parseLocalDate = (dateString: string): Date => {
  // Parse the date string as local date to avoid UTC conversion issues
  const date = parseISO(dateString);
  return date;
};

// Helper function to check if a date is within a range (comparing date parts only)
const isDateInRange = (dateStr: string, start: Date, end: Date): boolean => {
  const date = parseLocalDate(dateStr);
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const startOnly = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  return dateOnly >= startOnly && dateOnly <= endOnly;
};

// Helper function to check if a date is today
const isToday = (dateStr: string): boolean => {
  const date = parseLocalDate(dateStr);
  const today = new Date();
  return date.getFullYear() === today.getFullYear() &&
         date.getMonth() === today.getMonth() &&
         date.getDate() === today.getDate();
};

// Helper function to check if a date is in current month
const isCurrentMonth = (dateStr: string): boolean => {
  const date = parseLocalDate(dateStr);
  const today = new Date();
  return date.getFullYear() === today.getFullYear() &&
         date.getMonth() === today.getMonth();
};

export const useDashboardData = () => {
  const { transactions, isLoading } = useTransactions();

  const dashboardData = useMemo(() => {
    const today = new Date();
    const startMonth = startOfMonth(today);
    const endMonth = endOfMonth(today);

    // Valores do dia - somente pendentes (a receber/pagar)
    const todayIncome = transactions
      .filter(t => {
        return t.type === "income" && 
               isToday(t.due_date) && 
               t.status !== "received" && 
               t.status !== "confirmed" &&
               t.status !== "paid";
      })
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

    const todayExpenses = transactions
      .filter(t => {
        return t.type === "expense" && 
               isToday(t.due_date) && 
               t.status !== "paid" && 
               t.status !== "confirmed";
      })
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

    // Valores do mês - total previsto
    const monthIncome = transactions
      .filter(t => t.type === "income" && isCurrentMonth(t.due_date))
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

    const monthExpenses = transactions
      .filter(t => t.type === "expense" && isCurrentMonth(t.due_date))
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

    // Recebido vs a receber (incluindo parciais)
    const monthIncomeReceived = transactions
      .filter(t => t.type === "income" && isCurrentMonth(t.due_date))
      .reduce((sum, t) => {
        // Se está confirmado/recebido, use paid_amount ou amount
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

    const monthIncomePending = transactions
      .filter(t => {
        return t.type === "income" && 
               isCurrentMonth(t.due_date) && 
               (t.status === "pending" || t.status === "overdue");
      })
      .reduce((sum, t) => {
        const paidValue = t.paid_amount && t.paid_amount > 0 ? t.paid_amount : 0;
        const remainingValue = parseFloat(t.amount.toString()) - paidValue;
        return sum + remainingValue;
      }, 0);

    // Pago vs a pagar (incluindo parciais)
    const monthExpensesPaid = transactions
      .filter(t => t.type === "expense" && isCurrentMonth(t.due_date))
      .reduce((sum, t) => {
        // Se está confirmado/pago, use paid_amount ou amount
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

    const monthExpensesPending = transactions
      .filter(t => {
        return t.type === "expense" && 
               isCurrentMonth(t.due_date) && 
               (t.status === "pending" || t.status === "overdue");
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
          return t.type === "income" && 
                 isDateInRange(t.due_date, monthStart, monthEnd) &&
                 (t.status === "received" || t.status === "confirmed" || t.status === "paid");
        })
        .reduce((sum, t) => {
          const paidValue = t.paid_amount && t.paid_amount > 0 ? t.paid_amount : t.amount;
          return sum + parseFloat(paidValue.toString());
        }, 0);

      const expenses = transactions
        .filter(t => {
          return t.type === "expense" && 
                 isDateInRange(t.due_date, monthStart, monthEnd) &&
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

    // Calcular percentagens com arredondamento
    const incomePercentage = monthIncome > 0 ? Math.round((monthIncomeReceived / monthIncome) * 100) : 0;
    const expensePercentage = monthExpenses > 0 ? Math.round((monthExpensesPaid / monthExpenses) * 100) : 0;

    return {
      todayIncome,
      todayExpenses,
      monthIncome,
      monthExpenses,
      monthIncomeReceived,
      monthIncomePending,
      monthExpensesPaid,
      monthExpensesPending,
      incomePercentage,
      expensePercentage,
      last6MonthsData,
      currentMonth: format(today, "MMMM yyyy", { locale: ptBR }),
    };
  }, [transactions]);

  return { ...dashboardData, isLoading };
};
