import { useMemo } from "react";
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  PolarAngleAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface HoursProgressGaugeProps {
  currentHours: number;
  targetHours?: number;
  title?: string;
}

export const HoursProgressGauge = ({
  currentHours,
  targetHours = 176, // 22 days * 8 hours
  title = "Progresso Mensal",
}: HoursProgressGaugeProps) => {
  const percentage = useMemo(() => {
    return Math.min(100, (currentHours / targetHours) * 100);
  }, [currentHours, targetHours]);

  const data = [
    {
      name: "Horas",
      value: percentage,
      fill: percentage >= 100 
        ? "hsl(var(--chart-2))" 
        : percentage >= 75 
          ? "hsl(var(--primary))" 
          : percentage >= 50 
            ? "hsl(var(--chart-3))" 
            : "hsl(var(--destructive))",
    },
  ];

  const remaining = Math.max(0, targetHours - currentHours);
  const overtime = Math.max(0, currentHours - targetHours);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[180px] sm:h-[200px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="100%"
              barSize={12}
              data={data}
              startAngle={180}
              endAngle={0}
            >
              <PolarAngleAxis
                type="number"
                domain={[0, 100]}
                angleAxisId={0}
                tick={false}
              />
              <RadialBar
                background={{ fill: "hsl(var(--muted))" }}
                dataKey="value"
                cornerRadius={6}
              />
            </RadialBarChart>
          </ResponsiveContainer>
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ marginTop: "-10px" }}>
            <p className="text-2xl sm:text-3xl font-bold">{currentHours.toFixed(0)}h</p>
            <p className="text-xs text-muted-foreground">de {targetHours}h</p>
            <p className="text-sm font-medium mt-1">
              {percentage >= 100 ? (
                <span className="text-green-600">+{overtime.toFixed(0)}h extras</span>
              ) : (
                <span className="text-muted-foreground">{remaining.toFixed(0)}h restantes</span>
              )}
            </p>
          </div>
        </div>
        {/* Progress indicator */}
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>0%</span>
          <span className="font-medium">{percentage.toFixed(0)}%</span>
          <span>100%</span>
        </div>
      </CardContent>
    </Card>
  );
};
