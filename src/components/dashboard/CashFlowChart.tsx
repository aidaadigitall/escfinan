import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

const data = [
  { name: "Jan", receitas: 20000, despesas: -15000 },
  { name: "Fev", receitas: 15000, despesas: -12000 },
  { name: "Mar", receitas: 18000, despesas: -14000 },
  { name: "Abr", receitas: 22000, despesas: -18000 },
  { name: "Mai", receitas: 12000, despesas: -15000 },
  { name: "Jun", receitas: 5000, despesas: -3000 },
];

export const CashFlowChart = () => {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Fluxo de caixa</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
          <YAxis stroke="hsl(var(--muted-foreground))" />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: "hsl(var(--card))", 
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px"
            }}
          />
          <ReferenceLine y={0} stroke="hsl(var(--border))" />
          <Bar dataKey="receitas" fill="hsl(var(--income))" radius={[4, 4, 0, 0]} />
          <Bar dataKey="despesas" fill="hsl(var(--expense))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};
