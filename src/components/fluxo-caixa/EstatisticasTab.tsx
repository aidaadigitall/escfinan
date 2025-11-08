import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar } from "recharts";

const cashFlowData = [
  { month: "11 2025", value: -4073.47 },
];

const paymentsVsReceiptsData = [
  { name: "Pagamentos", value: 12984.48, color: "hsl(var(--expense))" },
  { name: "Recebimentos", value: 8911.02, color: "hsl(var(--income))" },
];

const accountPlanData = [
  { name: "Combustível e translados", value: 3930.80, color: "#FF6B35" },
  { name: "Área Comercial", value: 2676.44, color: "#004E89" },
  { name: "Licença ou Aluguel de softwares", value: 1730.00, color: "#1A936F" },
  { name: "Marketing e publicidade", value: 1480.44, color: "#F77F00" },
  { name: "Telefones", value: 627.60, color: "#D62828" },
  { name: "Servidor de contabilidade", value: 656.90, color: "#8338EC" },
  { name: "Salário", value: 0, color: "#4CC9F0" },
  { name: "Pró Labore", value: 0, color: "#9D4EDD" },
  { name: "Outros", value: 883.30, color: "#06AED5" },
];

export const EstatisticasTab = () => {
  return (
    <div className="space-y-6">
      {/* Cash Flow Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Fluxo de caixa mensal</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={cashFlowData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value: number) => value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} />
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
              <Tooltip formatter={(value: number) => value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: "hsl(var(--expense))" }}></div>
                <span className="text-sm">Pagamentos</span>
              </div>
              <span className="font-semibold">Total:8112.284,48</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: "hsl(var(--income))" }}></div>
                <span className="text-sm">Recebimentos</span>
              </div>
              <span className="font-semibold">Total:8818.911,02</span>
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
              <Tooltip formatter={(value: number) => value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            {accountPlanData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }}></div>
                <span className="truncate">{item.name}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
