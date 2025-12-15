import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TimeEntry {
  total_hours: number | null;
  total_break_minutes: number | null;
}

interface TimeDistributionPieChartProps {
  entries: TimeEntry[];
  expectedHours?: number;
  title?: string;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--muted-foreground))",
];

export const TimeDistributionPieChart = ({
  entries,
  expectedHours = 176, // 22 days * 8 hours
  title = "Distribuição de Tempo",
}: TimeDistributionPieChartProps) => {
  const chartData = useMemo(() => {
    const totalHours = entries.reduce((acc, e) => acc + (e.total_hours || 0), 0);
    const totalBreakMinutes = entries.reduce((acc, e) => acc + (e.total_break_minutes || 0), 0);
    const breakHours = totalBreakMinutes / 60;
    const overtimeHours = Math.max(0, totalHours - expectedHours);
    const regularHours = Math.min(totalHours, expectedHours);
    const missingHours = Math.max(0, expectedHours - totalHours);

    return [
      { name: "Horas Regulares", value: Number(regularHours.toFixed(1)), color: COLORS[0] },
      { name: "Horas Extras", value: Number(overtimeHours.toFixed(1)), color: COLORS[1] },
      { name: "Intervalos", value: Number(breakHours.toFixed(1)), color: COLORS[2] },
      { name: "Horas Faltantes", value: Number(missingHours.toFixed(1)), color: COLORS[3] },
    ].filter(item => item.value > 0);
  }, [entries, expectedHours]);

  const totalHours = entries.reduce((acc, e) => acc + (e.total_hours || 0), 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] sm:h-[250px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: number) => [`${value}h`, ""]}
              />
              <Legend
                wrapperStyle={{ fontSize: "11px" }}
                layout="vertical"
                verticalAlign="middle"
                align="right"
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Center text */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center" style={{ marginRight: "80px" }}>
              <p className="text-xl font-bold">{totalHours.toFixed(0)}h</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
