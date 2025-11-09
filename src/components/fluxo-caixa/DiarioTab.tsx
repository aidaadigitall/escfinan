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
import { useFluxoCaixaData } from "@/hooks/useFluxoCaixaData";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DiarioTabProps {
  selectedPeriod: { start: Date; end: Date };
}

export const DiarioTab = ({ selectedPeriod }: DiarioTabProps) => {
  const { dailyFlow, isLoading } = useFluxoCaixaData(selectedPeriod);

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      pending: { label: "Pendente", className: "bg-warning text-warning-foreground" },
      confirmed: { label: "Confirmado", className: "bg-income text-income-foreground" },
      overdue: { label: "Atrasado", className: "bg-destructive text-destructive-foreground" },
      paid: { label: "Pago", className: "bg-income text-income-foreground" },
      received: { label: "Recebido", className: "bg-income text-income-foreground" },
    };
    return statusMap[status] || { label: status, className: "bg-muted text-muted-foreground" };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const chartData = dailyFlow.map(day => ({
    date: day.date,
    value: day.accumulated,
  }));

  return (
    <div className="space-y-6">
      {/* Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Fluxo diário</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {format(selectedPeriod.start, "MM/yyyy", { locale: ptBR })}
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
            <YAxis stroke="hsl(var(--muted-foreground))" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "hsl(var(--card))", 
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px"
              }}
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

        {dailyFlow
          .filter(day => day.transactions.length > 0)
          .map((day, dayIndex) => (
            <div key={dayIndex} className="space-y-2">
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Plano de contas</TableHead>
                      <TableHead>Centro de custo</TableHead>
                      <TableHead>Situação</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {day.transactions.map((transaction) => {
                      const statusBadge = getStatusBadge(transaction.status);
                      return (
                        <TableRow 
                          key={transaction.id} 
                          className={transaction.type === "expense" ? "bg-expense/10" : "bg-income/10"}
                        >
                          <TableCell>{format(new Date(transaction.due_date), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell>{transaction.account || "-"}</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>
                            <Badge className={statusBadge.className}>
                              {statusBadge.label}
                            </Badge>
                          </TableCell>
                          <TableCell className={`text-right font-semibold ${transaction.type === "expense" ? "text-expense" : "text-income"}`}>
                            {transaction.type === "expense" ? "-" : ""}
                            {parseFloat(transaction.amount.toString()).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>

              <div className="text-right pr-4">
                <span className="text-sm text-muted-foreground">Total no dia {day.date}: </span>
                <span className={`font-bold ${day.value >= 0 ? 'text-income' : 'text-expense'}`}>
                  {day.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          ))}

        {dailyFlow.every(day => day.transactions.length === 0) && (
          <Card className="p-8">
            <p className="text-center text-muted-foreground">Nenhuma transação encontrada no período selecionado</p>
          </Card>
        )}
      </div>
    </div>
  );
};
