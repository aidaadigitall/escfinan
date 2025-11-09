import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { useFluxoCaixaData } from "@/hooks/useFluxoCaixaData";

interface EstatisticasTabProps {
  selectedPeriod: { start: Date; end: Date };
}

export const EstatisticasTab = ({ selectedPeriod }: EstatisticasTabProps) => {
  const { income, expenses, categoryData, isLoading } = useFluxoCaixaData(selectedPeriod);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const cashFlowData = [
    { month: "Período", value: income - expenses },
  ];

  const paymentsVsReceiptsData = [
    { name: "Pagamentos", value: expenses, color: "hsl(var(--expense))" },
    { name: "Recebimentos", value: income, color: "hsl(var(--income))" },
  ];

  const colors = [
    "#FF6B35", "#004E89", "#1A936F", "#F77F00", "#D62828", 
    "#8338EC", "#4CC9F0", "#9D4EDD", "#06AED5", "#FFB627"
  ];

  const accountPlanData = categoryData.map((item, index) => ({
    ...item,
    color: colors[index % colors.length],
  }));

  return (
    <div className="space-y-6">
      {/* Cash Flow Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Fluxo de caixa mensal</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={cashFlowData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
            <YAxis stroke="hsl(var(--muted-foreground))" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "hsl(var(--card))", 
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px"
              }}
              formatter={(value: number) => value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} 
            />
            <Bar dataKey="value" fill="hsl(var(--primary))" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Payments vs Receipts */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Pagamentos X Recebimentos</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={paymentsVsReceiptsData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {paymentsVsReceiptsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))", 
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px"
                }}
                formatter={(value: number) => value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} 
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: "hsl(var(--expense))" }}></div>
                <span className="text-sm">Pagamentos</span>
              </div>
              <span className="font-semibold">Total: {expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: "hsl(var(--income))" }}></div>
                <span className="text-sm">Recebimentos</span>
              </div>
              <span className="font-semibold">Total: {income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </Card>

        {/* Account Plan Breakdown */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Pagamentos X Plano de contas</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={accountPlanData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {accountPlanData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))", 
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px"
                }}
                formatter={(value: number) => value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} 
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            {accountPlanData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }}></div>
                <span className="truncate">{item.name}: {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
