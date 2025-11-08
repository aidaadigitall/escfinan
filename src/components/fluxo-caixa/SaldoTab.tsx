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
import { useTransactions } from "@/hooks/useTransactions";
import { useMemo } from "react";

export const SaldoTab = () => {
  const { transactions, isLoading } = useTransactions();

  const summary = useMemo(() => {
    const income = transactions
      .filter(t => t.type === "income" && (t.status === "received" || t.status === "confirmed"))
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
    
    const expenses = transactions
      .filter(t => t.type === "expense" && (t.status === "paid" || t.status === "confirmed"))
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

    const balance = income - expenses;

    const pendingIncome = transactions
      .filter(t => t.type === "income" && t.status === "pending")
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
    
    const pendingExpenses = transactions
      .filter(t => t.type === "expense" && t.status === "pending")
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

    const finalBalance = balance + pendingIncome - pendingExpenses;

    return { balance, finalBalance };
  }, [transactions]);

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
              <p className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-income' : 'text-expense'}`}>
                {summary.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Saldo final previsto:</p>
              <p className={`text-2xl font-bold ${summary.finalBalance >= 0 ? 'text-income' : 'text-expense'}`}>
                {summary.finalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Transactions table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Entidade</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Plano de contas</TableHead>
              <TableHead>Movimentação</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Nenhuma transação encontrada
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((transaction) => {
                const statusBadge = getStatusBadge(transaction.status);
                return (
                  <TableRow 
                    key={transaction.id} 
                    className={transaction.type === "expense" ? "bg-expense/10" : "bg-income/10"}
                  >
                    <TableCell>{transaction.entity || "-"}</TableCell>
                    <TableCell>{transaction.client || "-"}</TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>{transaction.account || "-"}</TableCell>
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
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};
