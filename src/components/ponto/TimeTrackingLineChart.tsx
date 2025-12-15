import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO, eachDayOfInterval, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TimeEntry {
  clock_in: string;
  total_hours: number | null;
}

interface TimeTrackingLineChartProps {
  entries: TimeEntry[];
  selectedMonth: string;
  title?: string;
}

export const TimeTrackingLineChart = ({
  entries,
  selectedMonth,
  title = "Evolução de Horas no Mês",
}: TimeTrackingLineChartProps) => {
  const chartData = useMemo(() => {
    const monthStart = startOfMonth(parseISO(selectedMonth + "-01"));
    const monthEnd = endOfMonth(parseISO(selectedMonth + "-01"));
    const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Group hours by date
    const hoursByDate: Record<string, number> = {};
    entries.forEach((entry) => {
      const date = format(parseISO(entry.clock_in), "yyyy-MM-dd");
      if (!hoursByDate[date]) {
        hoursByDate[date] = 0;
      }
      hoursByDate[date] += entry.total_hours || 0;
    });

    // Calculate cumulative hours
    let cumulativeHours = 0;
    let cumulativeExpected = 0;

    return allDays.map((day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      const dayOfWeek = day.getDay();
      const isWorkday = dayOfWeek >= 1 && dayOfWeek <= 5;

      const dailyHours = hoursByDate[dateStr] || 0;
      cumulativeHours += dailyHours;
      
      if (isWorkday) {
        cumulativeExpected += 8;
      }

      return {
        date: format(day, "dd", { locale: ptBR }),
        horas: dailyHours > 0 ? Number(dailyHours.toFixed(1)) : null,
        acumulado: Number(cumulativeHours.toFixed(1)),
        esperado: cumulativeExpected,
      };
    });
  }, [entries, selectedMonth]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] sm:h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                className="text-muted-foreground"
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: number, name: string) => {
                  const labels: Record<string, string> = {
                    horas: "Horas do Dia",
                    acumulado: "Acumulado",
                    esperado: "Esperado",
                  };
                  return value !== null ? [`${value}h`, labels[name] || name] : null;
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Line
                type="monotone"
                dataKey="acumulado"
                name="Acumulado"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="esperado"
                name="Esperado"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="horas"
                name="Diário"
                stroke="hsl(var(--chart-2))"
                strokeWidth={1}
                dot={{ fill: "hsl(var(--chart-2))", strokeWidth: 0, r: 2 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
