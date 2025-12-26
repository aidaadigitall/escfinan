import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from "@/components/ui/card";
import { TrendingUp, Settings } from "lucide-react";

interface FaturamentoTechData {
  technician: string;
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

export const BarChartTechOS = ({ data }: { data: FaturamentoTechData[] }) => {
  return (
    <Card className="p-4 h-96">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Faturamento por Técnico
        </h2>
        <Settings className="h-4 w-4 text-muted-foreground cursor-pointer" />
      </div>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-gray-200 dark:stroke-gray-700" />
          <XAxis
            type="number"
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => formatCurrency(value)}
          />
          <YAxis
            dataKey="technician"
            type="category"
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            width={100}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="total" fill="#10b981" radius={[0, 4, 4, 0]} name="Faturamento" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};
