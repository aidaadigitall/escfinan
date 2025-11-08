import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const chartData = [
  { date: "01/11", value: 0 },
  { date: "02/11", value: -100 },
  { date: "03/11", value: 200 },
  { date: "04/11", value: 300 },
  { date: "05/11", value: -200 },
  { date: "10/11", value: 500 },
  { date: "15/11", value: -800 },
  { date: "20/11", value: -1200 },
  { date: "25/11", value: -2500 },
  { date: "30/11", value: -4000 },
];

const dailyTransactions = [
  {
    date: "01/11/2025",
    description: "Chat GPT Plus (4/12) - Chat GPT",
    account: "Licença ou aluguel de softwares",
    costCenter: "",
    status: "Atrasado",
    value: -120.00,
    type: "expense",
  },
  {
    date: "01/11/2025",
    description: "Pro Labore (102/111) - Elisa Souza",
    account: "Pró Labore",
    costCenter: "",
    status: "Confirmado",
    value: -4.40,
    type: "expense",
  },
  {
    date: "02/11/2025",
    description: "Pro Labore (102/111) - Elisa Souza",
    account: "Pró Labore",
    costCenter: "",
    status: "Confirmado",
    value: -64.00,
    type: "expense",
  },
];

export const DiarioTab = () => {
  return (
    <div className="space-y-6">
      {/* Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Fluxo diário</h3>
        <p className="text-sm text-muted-foreground mb-4">11/2025</p>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip 
              formatter={(value: number) => value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            />
            <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Extrato section */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold">Extrato</h3>
          <p className="text-muted-foreground">Saldo anterior: 0,00</p>
        </div>

        {/* Daily transactions grouped */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição do recebimento</TableHead>
                <TableHead>Plano de contas</TableHead>
                <TableHead>Centro de custo</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dailyTransactions.map((transaction, index) => (
                <TableRow key={index} className={transaction.type === "expense" ? "bg-expense/10" : "bg-income/10"}>
                  <TableCell>{transaction.date}</TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell>{transaction.account}</TableCell>
                  <TableCell>{transaction.costCenter}</TableCell>
                  <TableCell>
                    <Badge 
                      className={
                        transaction.status === "Confirmado" 
                          ? "bg-income text-income-foreground" 
                          : "bg-destructive text-destructive-foreground"
                      }
                    >
                      {transaction.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {transaction.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* Daily subtotal */}
        <div className="text-right pr-4">
          <span className="text-sm text-muted-foreground">Total no dia 01/11/2025: </span>
          <span className="font-bold text-expense">-306,59</span>
        </div>
      </div>
    </div>
  );
};
