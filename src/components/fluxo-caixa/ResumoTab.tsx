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
import { useFluxoCaixaData } from "@/hooks/useFluxoCaixaData";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ResumoTabProps {
  selectedPeriod: { start: Date; end: Date };
}

export const ResumoTab = ({ selectedPeriod }: ResumoTabProps) => {
  const {
    balance,
    finalBalance,
    income,
    expenses,
    pendingIncome,
    pendingExpenses,
    incomeTransactions,
    expenseTransactions,
    isLoading,
  } = useFluxoCaixaData(selectedPeriod);

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

  const receivedIncome = incomeTransactions
    .filter(t => t.status === "received" || t.status === "confirmed")
    .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

  const paidExpenses = expenseTransactions
    .filter(t => t.status === "paid" || t.status === "confirmed")
    .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

  const totalIncome = receivedIncome + pendingIncome;
  const totalExpenses = paidExpenses + pendingExpenses;

  return (
    <div className="space-y-6">
      {/* Header with balance */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Pagamentos X Recebimentos</h3>
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-sm text-muted-foreground">Saldo:</p>
              <p className={`text-2xl font-bold ${balance >= 0 ? 'text-income' : 'text-expense'}`}>
                {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Saldo final previsto:</p>
              <p className={`text-2xl font-bold ${finalBalance >= 0 ? 'text-income' : 'text-expense'}`}>
                {finalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Recebimentos */}
      <div className="space-y-3">
        <h3 className="text-xl font-bold">Recebimentos</h3>
        <Card>
          <Table>
            <TableHeader>
              <TableRow className="bg-income/20">
                <TableHead>Data</TableHead>
                <TableHead>Descrição do recebimento</TableHead>
                <TableHead>Plano de contas</TableHead>
                <TableHead>Centro de custo</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incomeTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhum recebimento encontrado
                  </TableCell>
                </TableRow>
              ) : (
                incomeTransactions.map((item) => {
                  const statusBadge = getStatusBadge(item.status);
                  return (
                    <TableRow key={item.id} className="bg-income/10">
                      <TableCell>{format(new Date(item.due_date), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>{item.account || "-"}</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>
                        <Badge className={statusBadge.className}>
                          {statusBadge.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {parseFloat(item.amount.toString()).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
        <div className="text-right pr-4">
          <span className="text-lg font-bold">Valor Total: </span>
          <span className="text-2xl font-bold text-income">{totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* Pagamentos */}
      <div className="space-y-3">
        <h3 className="text-xl font-bold">Pagamentos</h3>
        <Card>
          <Table>
            <TableHeader>
              <TableRow className="bg-expense/20">
                <TableHead>Data</TableHead>
                <TableHead>Descrição do pagamento</TableHead>
                <TableHead>Plano de contas</TableHead>
                <TableHead>Centro de custo</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenseTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhum pagamento encontrado
                  </TableCell>
                </TableRow>
              ) : (
                expenseTransactions.map((item) => {
                  const statusBadge = getStatusBadge(item.status);
                  return (
                    <TableRow key={item.id} className="bg-expense/10">
                      <TableCell>{format(new Date(item.due_date), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>{item.account || "-"}</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>
                        <Badge className={statusBadge.className}>
                          {statusBadge.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        -{parseFloat(item.amount.toString()).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
        <div className="text-right pr-4">
          <span className="text-lg font-bold">Valor Total: </span>
          <span className="text-2xl font-bold text-expense">-{totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* Total Summary */}
      <Card className="p-6 bg-muted/30">
        <h3 className="text-xl font-bold mb-4">Total</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Total recebido</span>
            <span className="font-semibold">{receivedIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-income">Total a receber</span>
            <span className="font-semibold text-income">{pendingIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between">
            <span>Total pago</span>
            <span className="font-semibold">{paidExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-expense">Total a pagar</span>
            <span className="font-semibold text-expense">{pendingExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between pt-2 border-t">
            <span className="text-lg font-bold">Total</span>
            <span className={`text-xl font-bold ${finalBalance >= 0 ? 'text-income' : 'text-expense'}`}>
              {finalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};
