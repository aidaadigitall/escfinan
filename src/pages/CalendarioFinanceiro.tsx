import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { useTransactions } from "@/hooks/useTransactions";
import { format, isSameDay, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

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
          <style>{`
            .calendar-expanded {
              width: 100%;
            }
            .calendar-expanded .rdp-months {
              justify-content: center;
              width: 100%;
            }
            .calendar-expanded .rdp-month {
              width: 100%;
              max-width: 650px;
            }
            .calendar-expanded .rdp-caption {
              font-size: 1.125rem;
              font-weight: 600;
              padding: 0.75rem 0;
            }
            .calendar-expanded .rdp-table {
              width: 100%;
              max-width: none;
            }
            .calendar-expanded .rdp-head_cell {
              font-size: 0.875rem;
              font-weight: 600;
              padding: 0.75rem 0.5rem;
              color: hsl(var(--muted-foreground));
            }
            .calendar-expanded .rdp-cell {
              padding: 0.25rem;
            }
            .calendar-expanded .rdp-day {
              width: 3.5rem;
              height: 3.5rem;
              font-size: 1rem;
              border-radius: 0.5rem;
              transition: all 0.2s;
            }
            .calendar-expanded .rdp-day:hover {
              transform: scale(1.05);
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            .calendar-expanded .rdp-day_selected {
              background-color: hsl(var(--primary)) !important;
              color: hsl(var(--primary-foreground)) !important;
              font-weight: 700;
            }
            .calendar-expanded .rdp-day_today {
              font-weight: 700;
              border: 2px solid hsl(var(--primary));
            }
          `}</style>
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              locale={ptBR}
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
              className={cn("rounded-md border pointer-events-auto calendar-expanded")}
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
          <h3 className="text-lg font-semibold mb-4">
            Compromissos de {format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}
          </h3>
          <div className="space-y-3">
            {selectedDateTransactions.map((transaction) => {
              const statusBadge = getStatusBadge(transaction.status);
              return (
                <div 
                  key={transaction.id}
                  className="flex flex-col p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant={transaction.type === "income" ? "default" : "destructive"} className="text-xs">
                          {transaction.type === "income" ? "Receita" : "Despesa"}
                        </Badge>
                        <Badge className={statusBadge.className}>
                          {statusBadge.label}
                        </Badge>
                      </div>
                      <h4 className="font-semibold text-lg mb-1">{transaction.description}</h4>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        {transaction.entity && (
                          <span className="flex items-center gap-1">
                            <span className="font-medium">Entidade:</span> {transaction.entity}
                          </span>
                        )}
                        {transaction.payment_method && (
                          <span className="flex items-center gap-1">
                            <span className="font-medium">• Pagamento:</span> {transaction.payment_method}
                          </span>
                        )}
                        {transaction.account && (
                          <span className="flex items-center gap-1">
                            <span className="font-medium">• Categoria:</span> {transaction.account}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className={`text-xl font-bold ${
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
                  
                  {transaction.notes && transaction.notes.trim() && !transaction.notes.includes("recurring_bill_id") && !transaction.notes.includes("transfer_") && (
                    <div className="mt-2 pt-3 border-t">
                      <div className="flex items-start gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-muted-foreground mb-1">Observações:</p>
                          <p className="text-sm text-foreground">{transaction.notes}</p>
                        </div>
                      </div>
                    </div>
                  )}
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
