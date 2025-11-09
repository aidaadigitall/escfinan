import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { useDashboardData } from "@/hooks/useDashboardData";

export const CashFlowChart = () => {
  const { last6MonthsData, isLoading } = useDashboardData();

  if (isLoading) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Fluxo de caixa</h3>
        <div className="flex items-center justify-center h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Fluxo de caixa</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={last6MonthsData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
          <YAxis stroke="hsl(var(--muted-foreground))" />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: "hsl(var(--card))", 
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px"
            }}
            formatter={(value: number) => value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          />
          <ReferenceLine y={0} stroke="hsl(var(--border))" />
          <Bar dataKey="receitas" fill="hsl(var(--income))" radius={[4, 4, 0, 0]} />
          <Bar dataKey="despesas" fill="hsl(var(--expense))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};
