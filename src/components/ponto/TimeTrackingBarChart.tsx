import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TimeEntry {
  clock_in: string;
  total_hours: number | null;
  total_break_minutes: number | null;
}

interface TimeTrackingBarChartProps {
  entries: TimeEntry[];
  title?: string;
}

const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export const TimeTrackingBarChart = ({
  entries,
  title = "Horas por Dia da Semana",
}: TimeTrackingBarChartProps) => {
  const chartData = useMemo(() => {
    // Group hours by day of week
    const hoursByDay: Record<number, { total: number; count: number }> = {};
    
    entries.forEach((entry) => {
      const dayOfWeek = getDay(parseISO(entry.clock_in));
      const hours = entry.total_hours || 0;
      
      if (!hoursByDay[dayOfWeek]) {
        hoursByDay[dayOfWeek] = { total: 0, count: 0 };
      }
      hoursByDay[dayOfWeek].total += hours;
      hoursByDay[dayOfWeek].count += 1;
    });

    // Create chart data with averages
    return dayNames.map((name, index) => ({
      name,
      horas: hoursByDay[index]
        ? Number((hoursByDay[index].total / hoursByDay[index].count).toFixed(1))
        : 0,
      meta: 8, // Expected hours per day
    }));
  }, [entries]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] sm:h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
                domain={[0, 12]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: number) => [`${value}h`, "Horas"]}
              />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Bar
                dataKey="horas"
                name="Média de Horas"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="meta"
                name="Meta (8h)"
                fill="hsl(var(--muted-foreground))"
                opacity={0.3}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
