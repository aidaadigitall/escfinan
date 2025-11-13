import { useTransactions } from "./useTransactions";
import { useMemo } from "react";
import { startOfMonth, endOfMonth, format, eachDayOfInterval, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

export const useFluxoCaixaData = (selectedPeriod: { start: Date; end: Date }, filters: any = {}) => {
  const { transactions, isLoading } = useTransactions();

  const fluxoData = useMemo(() => {
    const { start, end } = selectedPeriod;

    const filteredTransactions = transactions.filter(t => {
      const dueDate = new Date(t.due_date);

      // 1. Filtro por Período (Data de Vencimento)
      // O filtro de período no Fluxo de Caixa deve ser aplicado à data de vencimento (due_date)
      // e o período selecionado já está ajustado para o início e fim do dia.
      if (!(dueDate >= start && dueDate <= end)) {
        return false;
      }
      
      // 1.1. Filtro de Data de Competência (competence_date)
      // Este filtro só deve ser aplicado se estiver presente na busca avançada
      if (filters.competenceStartDate || filters.competenceEndDate) {
        const competenceDate = new Date(t.competence_date);
        
        if (filters.competenceStartDate) {
          const startComp = new Date(filters.competenceStartDate + 'T00:00:00');
          if (competenceDate < startComp) return false;
        }
        
        if (filters.competenceEndDate) {
          const endComp = new Date(filters.competenceEndDate + 'T00:00:00');
          endComp.setDate(endComp.getDate() + 1); // Inclui o dia final
          if (competenceDate >= endComp) return false;
        }
      }

      // 2. Filtros da Busca Avançada
      if (filters.entity && filters.entity !== "todos") {
        // A lógica de entidade precisa ser implementada com base na estrutura de dados de 't'
        // Assumindo que 't' tem um campo 'entity_type' ou similar
        // Por enquanto, vamos ignorar este filtro, pois a estrutura de dados não é clara.
      }

      if (filters.client && !t.client?.toLowerCase().includes(filters.client.toLowerCase())) {
        return false;
      }

      if (filters.description && !t.description?.toLowerCase().includes(filters.description.toLowerCase())) {
        return false;
      }

      if (filters.movement && filters.movement !== "todas") {
        const movementType = filters.movement === "receitas" ? "income" : filters.movement === "despesas" ? "expense" : null;
        if (movementType && t.type !== movementType) {
          return false;
        }
      }

      if (filters.minValue && t.amount < parseFloat(filters.minValue)) {
        return false;
      }
      if (filters.maxValue && t.amount > parseFloat(filters.maxValue)) {
        return false;
      }

      if (filters.account && filters.account !== "todos" && t.account !== filters.account) {
        return false;
      }

      if (filters.status && filters.status !== "todos" && t.status !== filters.status) {
        return false;
      }

      if (filters.bank && filters.bank !== "todos" && t.bank_account_id !== filters.bank) {
        return false;
      }

      if (filters.payment && filters.payment !== "todos" && t.payment_method !== filters.payment) {
        return false;
      }

      // Os filtros showPrevious e showTransfers são mais complexos e dependem de como o dado é exibido.
      // Por enquanto, vamos ignorá-los para focar nos filtros principais.

      return true;
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
  }, [transactions, selectedPeriod, filters]);

  return { ...fluxoData, isLoading };
};
