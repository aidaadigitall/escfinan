import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Loader2, TrendingDown, TrendingUp } from "lucide-react";
import { format, addMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

interface UpcomingRecurringBillsProps {
  hideValues?: boolean;
}

export const UpcomingRecurringBills = ({ hideValues = false }: UpcomingRecurringBillsProps) => {
  const { data: recurringBills = [], isLoading } = useQuery({
    queryKey: ["recurring-bills-upcoming"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recurring_bills")
        .select("*")
        .eq("is_active", true)
        .order("recurrence_day");

      if (error) throw error;
      return data;
    },
  });

  const getNextOccurrences = () => {
    const today = new Date();
    const nextMonth = addMonths(today, 1);
    const occurrences: any[] = [];

    recurringBills.forEach((bill: any) => {
      const startDate = new Date(bill.start_date);
      
      // Verificar se já começou
      if (today < startDate) return;

      // Verificar se já terminou
      if (bill.end_date && today > new Date(bill.end_date)) return;

      // Calcular próxima ocorrência
      let nextDate: Date;

      switch (bill.recurrence_type) {
        case 'monthly':
          const day = bill.recurrence_day || 1;
          const lastDayThisMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
          const lastDayNextMonth = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate();
          
          const actualDayThisMonth = Math.min(day, lastDayThisMonth);
          const actualDayNextMonth = Math.min(day, lastDayNextMonth);
          
          nextDate = new Date(today.getFullYear(), today.getMonth(), actualDayThisMonth);
          
          if (nextDate <= today) {
            nextDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), actualDayNextMonth);
          }
          break;
        case 'yearly':
          nextDate = new Date(today.getFullYear(), startDate.getMonth(), startDate.getDate());
          if (nextDate <= today) {
            nextDate = new Date(today.getFullYear() + 1, startDate.getMonth(), startDate.getDate());
          }
          break;
        default:
          return;
      }

      occurrences.push({
        ...bill,
        nextDate,
      });
    });

    return occurrences.sort((a, b) => a.nextDate - b.nextDate).slice(0, 5);
  };

  const upcomingOccurrences = getNextOccurrences();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Próximas Contas Recorrentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Próximas Contas Recorrentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {upcomingOccurrences.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma conta recorrente programada
          </p>
        ) : (
          <div className="space-y-3">
            {upcomingOccurrences.map((occurrence: any) => (
              <div
                key={occurrence.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    occurrence.type === 'income' 
                      ? 'bg-income/10 text-income' 
                      : 'bg-expense/10 text-expense'
                  }`}>
                    {occurrence.type === 'income' ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{occurrence.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(occurrence.nextDate, "dd 'de' MMMM", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                <div className={`font-semibold ${
                  occurrence.type === 'income' ? 'text-income' : 'text-expense'
                }`}>
                  {hideValues 
                    ? "••••••" 
                    : `R$ ${parseFloat(occurrence.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                  }
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
