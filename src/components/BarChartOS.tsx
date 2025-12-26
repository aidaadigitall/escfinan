import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from "@/components/ui/card";
import { TrendingUp, Settings } from "lucide-react";

interface FaturamentoData {
  month: string;
  total: number;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 bg-white border border-gray-200 rounded-md shadow-md text-sm">
        <p className="font-semibold">{label}</p>
        <p className="text-primary">{`Faturamento: ${formatCurrency(payload[0].value)}`}</p>
      </div>
    );
  }
  return null;
};

export const BarChartOS = ({ data }: { data: FaturamentoData[] }) => {
  // Formatar o mês para exibição (ex: 2025-07 -> Jul 2025)
  const formattedData = data.map(item => {
    const [year, month] = item.month.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    const monthName = date.toLocaleString('pt-BR', { month: 'short' });
    return {
      ...item,
      month: `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`,
    };
  });

  return (
    <Card className="p-4 h-96">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Faturamento Mensal
        </h2>
        <Settings className="h-4 w-4 text-muted-foreground cursor-pointer" />
      </div>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart
          data={formattedData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-gray-200 dark:stroke-gray-700" />
          <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => formatCurrency(value)}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Faturamento" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};
