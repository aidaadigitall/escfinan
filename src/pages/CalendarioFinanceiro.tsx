import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { useTransactions } from "@/hooks/useTransactions";
import { format, isSameDay, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

const CalendarioFinanceiro = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { transactions, isLoading } = useTransactions();

  const transactionsByDate = useMemo(() => {
    const map = new Map<string, typeof transactions>();
    
    transactions.forEach((transaction) => {
      const dateKey = format(new Date(transaction.due_date), "yyyy-MM-dd");
      const existing = map.get(dateKey) || [];
      map.set(dateKey, [...existing, transaction]);
    });
    
    return map;
  }, [transactions]);

  const selectedDateTransactions = useMemo(() => {
    const dateKey = format(selectedDate, "yyyy-MM-dd");
    return transactionsByDate.get(dateKey) || [];
  }, [selectedDate, transactionsByDate]);

  const dayTotals = useMemo(() => {
    const dateKey = format(selectedDate, "yyyy-MM-dd");
    const dayTransactions = transactionsByDate.get(dateKey) || [];
    
    const income = dayTransactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
    
    const expenses = dayTransactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
    
    return { income, expenses, balance: income - expenses };
  }, [selectedDate, transactionsByDate]);

  const modifiers = useMemo(() => {
    const daysWithIncome: Date[] = [];
    const daysWithExpenses: Date[] = [];
    const daysWithBoth: Date[] = [];

    transactionsByDate.forEach((transactions, dateStr) => {
      const date = new Date(dateStr);
      const hasIncome = transactions.some(t => t.type === "income");
      const hasExpense = transactions.some(t => t.type === "expense");
      
      if (hasIncome && hasExpense) {
        daysWithBoth.push(date);
      } else if (hasIncome) {
        daysWithIncome.push(date);
      } else if (hasExpense) {
        daysWithExpenses.push(date);
      }
    });

    return {
      income: daysWithIncome,
      expense: daysWithExpenses,
      both: daysWithBoth,
    };
  }, [transactionsByDate]);

  const modifiersStyles = {
    income: { 
      backgroundColor: "hsl(var(--income) / 0.2)",
      color: "hsl(var(--income))",
      fontWeight: "bold"
    },
    expense: { 
      backgroundColor: "hsl(var(--expense) / 0.2)",
      color: "hsl(var(--expense))",
      fontWeight: "bold"
    },
    both: { 
      backgroundColor: "hsl(var(--warning) / 0.2)",
      color: "hsl(var(--warning))",
      fontWeight: "bold"
    },
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      pending: { label: "Pendente", className: "bg-warning text-warning-foreground" },
      confirmed: { label: "Confirmada", className: "bg-income text-income-foreground" },
      overdue: { label: "Atrasada", className: "bg-destructive text-destructive-foreground" },
      received: { label: "Recebida", className: "bg-income text-income-foreground" },
      paid: { label: "Paga", className: "bg-income text-income-foreground" },
    };
    return statusMap[status] || { label: status, className: "bg-muted text-muted-foreground" };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Calendário Financeiro</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              locale={ptBR}
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
              className="rounded-md border"
            />
          </div>
          
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "hsl(var(--income) / 0.4)" }}></div>
              <span className="text-sm text-muted-foreground">Receitas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "hsl(var(--expense) / 0.4)" }}></div>
              <span className="text-sm text-muted-foreground">Despesas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "hsl(var(--warning) / 0.4)" }}></div>
              <span className="text-sm text-muted-foreground">Ambos</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">
              {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </h3>
            <p className="text-sm text-muted-foreground">
              {selectedDateTransactions.length} compromisso(s)
            </p>
          </div>

          <div className="space-y-3 pt-3 border-t">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Receitas</span>
              <span className="font-semibold text-income">
                R$ {dayTotals.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Despesas</span>
              <span className="font-semibold text-expense">
                R$ {dayTotals.expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t">
              <span className="text-sm font-semibold">Saldo do Dia</span>
              <span className={`font-bold ${dayTotals.balance >= 0 ? 'text-income' : 'text-expense'}`}>
                R$ {dayTotals.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {selectedDateTransactions.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Compromissos do Dia</h3>
          <div className="space-y-3">
            {selectedDateTransactions.map((transaction) => {
              const statusBadge = getStatusBadge(transaction.status);
              return (
                <div 
                  key={transaction.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium">{transaction.description}</h4>
                      <Badge className={statusBadge.className}>
                        {statusBadge.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {transaction.entity && <span>{transaction.entity}</span>}
                      {transaction.payment_method && <span>• {transaction.payment_method}</span>}
                      {transaction.account && <span>• {transaction.account}</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${
                      transaction.type === "income" ? "text-income" : "text-expense"
                    }`}>
                      {transaction.type === "income" ? "+" : "-"} R$ {parseFloat(transaction.amount.toString()).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    {transaction.paid_amount && transaction.paid_amount > 0 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Pago: R$ {transaction.paid_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {selectedDateTransactions.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">
            Nenhum compromisso financeiro para este dia
          </p>
        </Card>
      )}
    </div>
  );
};

export default CalendarioFinanceiro;
