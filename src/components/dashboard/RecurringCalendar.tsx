import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, addMonths, addWeeks, addDays, isSameDay, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

type RecurringBill = {
  id: string;
  description: string;
  amount: number;
  type: string;
  recurrence_type: string;
  recurrence_day: number | null;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
};

type ProjectedOccurrence = {
  date: Date;
  bill: RecurringBill;
};

const RecurringCalendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  const { data: recurringBills = [], isLoading } = useQuery({
    queryKey: ["recurring-bills-calendar"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recurring_bills")
        .select("*")
        .eq("is_active", true);

      if (error) throw error;
      return data as RecurringBill[];
    },
  });

  const projectedOccurrences = useMemo(() => {
    const occurrences: ProjectedOccurrence[] = [];
    const today = new Date();
    const endDate = addMonths(today, 12);

    recurringBills.forEach((bill) => {
      let currentDate = new Date(bill.start_date);
      
      // Se a data de início é no futuro, começar dela
      if (currentDate > today) {
        currentDate = new Date(bill.start_date);
      } else {
        // Caso contrário, começar do próximo vencimento
        currentDate = getNextOccurrence(bill, today);
      }

      // Gerar ocorrências até 12 meses no futuro
      while (currentDate <= endDate) {
        // Verificar se está dentro do período ativo
        if (bill.end_date && currentDate > new Date(bill.end_date)) {
          break;
        }

        occurrences.push({
          date: new Date(currentDate),
          bill: bill,
        });

        currentDate = getNextOccurrence(bill, currentDate);
      }
    });

    return occurrences;
  }, [recurringBills]);

  const getNextOccurrence = (bill: RecurringBill, fromDate: Date): Date => {
    const nextDate = new Date(fromDate);
    
    switch (bill.recurrence_type) {
      case "daily":
        return addDays(nextDate, 1);
      case "weekly":
        return addWeeks(nextDate, 1);
      case "biweekly":
        return addWeeks(nextDate, 2);
      case "monthly":
        return addMonths(nextDate, 1);
      case "2_months":
        return addMonths(nextDate, 2);
      case "3_months":
        return addMonths(nextDate, 3);
      case "4_months":
        return addMonths(nextDate, 4);
      case "6_months":
        return addMonths(nextDate, 6);
      case "yearly":
        return addMonths(nextDate, 12);
      default:
        return addMonths(nextDate, 1);
    }
  };

  const occurrencesByDate = useMemo(() => {
    const map = new Map<string, ProjectedOccurrence[]>();
    
    projectedOccurrences.forEach((occurrence) => {
      const dateKey = format(occurrence.date, "yyyy-MM-dd");
      const existing = map.get(dateKey) || [];
      map.set(dateKey, [...existing, occurrence]);
    });
    
    return map;
  }, [projectedOccurrences]);

  const selectedDateOccurrences = useMemo(() => {
    const dateKey = format(selectedDate, "yyyy-MM-dd");
    return occurrencesByDate.get(dateKey) || [];
  }, [selectedDate, occurrencesByDate]);

  const dayTotals = useMemo(() => {
    const income = selectedDateOccurrences
      .filter(o => o.bill.type === "income")
      .reduce((sum, o) => sum + parseFloat(o.bill.amount.toString()), 0);
    
    const expenses = selectedDateOccurrences
      .filter(o => o.bill.type === "expense")
      .reduce((sum, o) => sum + parseFloat(o.bill.amount.toString()), 0);
    
    return { income, expenses, balance: income - expenses };
  }, [selectedDateOccurrences]);

  const modifiers = useMemo(() => {
    const daysWithIncome: Date[] = [];
    const daysWithExpenses: Date[] = [];
    const daysWithBoth: Date[] = [];

    occurrencesByDate.forEach((occurrences, dateStr) => {
      const date = new Date(dateStr);
      const hasIncome = occurrences.some(o => o.bill.type === "income");
      const hasExpense = occurrences.some(o => o.bill.type === "expense");
      
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
  }, [occurrencesByDate]);

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

  const getRecurrenceLabel = (type: string) => {
    const labels: Record<string, string> = {
      daily: "Diário",
      weekly: "Semanal",
      biweekly: "Quinzenal",
      monthly: "Mensal",
      "2_months": "Bimestral",
      "3_months": "Trimestral",
      "4_months": "Quadrimestral",
      "6_months": "Semestral",
      yearly: "Anual",
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-1">Calendário de Recorrências</h3>
        <p className="text-sm text-muted-foreground">
          Próximas ocorrências de contas fixas para os próximos 12 meses
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <style>{`
            .recurring-calendar {
              width: 100%;
            }
            .recurring-calendar .rdp-months {
              justify-content: center;
              width: 100%;
            }
            .recurring-calendar .rdp-month {
              width: 100%;
              max-width: 650px;
            }
            .recurring-calendar .rdp-caption {
              font-size: 1.125rem;
              font-weight: 600;
              padding: 0.75rem 0;
            }
            .recurring-calendar .rdp-table {
              width: 100%;
              max-width: none;
            }
            .recurring-calendar .rdp-head_cell {
              font-size: 0.875rem;
              font-weight: 600;
              padding: 0.75rem 0.5rem;
              color: hsl(var(--muted-foreground));
            }
            .recurring-calendar .rdp-cell {
              padding: 0.25rem;
            }
            .recurring-calendar .rdp-day {
              width: 3.5rem;
              height: 3.5rem;
              font-size: 1rem;
              border-radius: 0.5rem;
              transition: all 0.2s;
            }
            .recurring-calendar .rdp-day:hover {
              transform: scale(1.05);
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            .recurring-calendar .rdp-day_selected {
              background-color: hsl(var(--primary)) !important;
              color: hsl(var(--primary-foreground)) !important;
              font-weight: 700;
            }
            .recurring-calendar .rdp-day_today {
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
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              className={cn("rounded-md border pointer-events-auto recurring-calendar")}
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
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="text-base font-semibold mb-2">
              {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </h4>
            <p className="text-sm text-muted-foreground">
              {selectedDateOccurrences.length} recorrência(s)
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
              <span className="text-sm font-semibold">Saldo Projetado</span>
              <span className={`font-bold ${dayTotals.balance >= 0 ? 'text-income' : 'text-expense'}`}>
                R$ {dayTotals.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {selectedDateOccurrences.length > 0 && (
            <div className="pt-3 border-t space-y-3 max-h-[400px] overflow-y-auto">
              {selectedDateOccurrences.map((occurrence, index) => (
                <div 
                  key={`${occurrence.bill.id}-${index}`}
                  className="p-3 rounded-lg border bg-card/50 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge 
                          variant={occurrence.bill.type === "income" ? "default" : "destructive"} 
                          className="text-xs"
                        >
                          {occurrence.bill.type === "income" ? "Receita" : "Despesa"}
                        </Badge>
                      </div>
                      <p className="font-medium text-sm">{occurrence.bill.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {getRecurrenceLabel(occurrence.bill.recurrence_type)}
                      </p>
                    </div>
                    <div className={`text-right ml-2 font-bold text-sm ${
                      occurrence.bill.type === "income" ? "text-income" : "text-expense"
                    }`}>
                      {occurrence.bill.type === "income" ? "+" : "-"} R$ {parseFloat(occurrence.bill.amount.toString()).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedDateOccurrences.length === 0 && (
            <div className="pt-3 border-t text-center py-8">
              <p className="text-sm text-muted-foreground">
                Nenhuma recorrência para este dia
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default RecurringCalendar;
