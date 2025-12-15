import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

interface StaffMetric {
  name: string;
  totalHours: number;
  expectedHours: number;
  bankHours: number;
}

interface TeamHoursChartProps {
  staffMetrics: Record<string, StaffMetric>;
  title?: string;
}

export const TeamHoursChart = ({
  staffMetrics,
  title = "Comparativo de Horas por Funcionário",
}: TeamHoursChartProps) => {
  const chartData = useMemo(() => {
    return Object.entries(staffMetrics)
      .map(([id, metrics]) => ({
        name: metrics.name.split(" ")[0], // First name only
        fullName: metrics.name,
        horas: Number(metrics.totalHours.toFixed(1)),
        meta: metrics.expectedHours,
        banco: Number(metrics.bankHours.toFixed(1)),
      }))
      .sort((a, b) => b.horas - a.horas);
  }, [staffMetrics]);

  const getBarColor = (banco: number) => {
    if (banco >= 0) return "hsl(var(--chart-2))"; // Green for positive
    if (banco >= -8) return "hsl(var(--chart-3))"; // Yellow for slight negative
    return "hsl(var(--destructive))"; // Red for very negative
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            Nenhum dado disponível
          </div>
        ) : (
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                  domain={[0, "dataMax + 20"]}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                  width={60}
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
                      horas: "Horas Trabalhadas",
                      meta: "Meta",
                      banco: "Banco de Horas",
                    };
                    return [`${value}h`, labels[name] || name];
                  }}
                  labelFormatter={(label) => {
                    const item = chartData.find((d) => d.name === label);
                    return item?.fullName || label;
                  }}
                />
                <ReferenceLine x={176} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                <Bar dataKey="horas" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry.banco)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 justify-center text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: "hsl(var(--chart-2))" }} />
            <span className="text-muted-foreground">Banco positivo</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: "hsl(var(--chart-3))" }} />
            <span className="text-muted-foreground">Banco neutro</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: "hsl(var(--destructive))" }} />
            <span className="text-muted-foreground">Banco negativo</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
