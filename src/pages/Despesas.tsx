import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, Eye, Edit, Trash2, Copy } from "lucide-react";
import { useTransactions, Transaction } from "@/hooks/useTransactions";
import { TransactionDialog } from "@/components/TransactionDialog";

const Despesas = () => {
  const { transactions, isLoading, createTransaction, updateTransaction, deleteTransaction } = useTransactions("expense");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);

  const summaryData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdue = transactions.filter(t => 
      new Date(t.due_date) < today && t.status !== "paid"
    );
    const dueToday = transactions.filter(t => {
      const dueDate = new Date(t.due_date);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate.getTime() === today.getTime() && t.status !== "paid";
    });
    const upcoming = transactions.filter(t => 
      new Date(t.due_date) > today && t.status !== "paid"
    );
    const paid = transactions.filter(t => t.status === "paid");

    const total = transactions.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
    const overdueTotal = overdue.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
    const dueTodayTotal = dueToday.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
    const upcomingTotal = upcoming.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
    const paidTotal = paid.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

    return [
      { label: "Vencidos", value: overdueTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }), variant: "expense" as const },
      { label: "Vencem hoje", value: dueTodayTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }), variant: "warning" as const },
      { label: "A vencer", value: upcomingTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }), variant: "pending" as const },
      { label: "Pagos", value: paidTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }), variant: "income" as const },
      { label: "Total", value: total.toLocaleString('pt-BR', { minimumFractionDigits: 2 }), variant: "default" as const },
    ];
  }, [transactions]);

  const handleAdd = () => {
    setSelectedTransaction(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setTransactionToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (transactionToDelete) {
      deleteTransaction(transactionToDelete);
      setDeleteDialogOpen(false);
      setTransactionToDelete(null);
    }
  };

  const handleCopy = (transaction: Transaction) => {
    const { id, user_id, created_at, updated_at, ...transactionData } = transaction;
    createTransaction(transactionData);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      pending: { label: "Pendente", className: "bg-warning text-warning-foreground" },
      confirmed: { label: "Confirmada", className: "bg-income text-income-foreground" },
      overdue: { label: "Atrasada", className: "bg-destructive text-destructive-foreground" },
      paid: { label: "Paga", className: "bg-income text-income-foreground" },
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Contas a Pagar</h1>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <Search className="h-4 w-4 mr-2" />
            Busca avançada
          </Button>
          <Button size="sm" onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {summaryData.map((item) => (
          <Card key={item.label} className="p-4">
            <p className="text-sm text-muted-foreground mb-1">{item.label}</p>
            <p className={`text-2xl font-bold ${
              item.variant === "income" ? "text-income" :
              item.variant === "expense" ? "text-expense" :
              item.variant === "warning" ? "text-warning" :
              item.variant === "pending" ? "text-pending" :
              "text-foreground"
            }`}>
              {item.value}
            </p>
          </Card>
        ))}
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Entidade</TableHead>
              <TableHead>Conta</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  Nenhuma conta a pagar cadastrada
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((transaction) => {
                const statusBadge = getStatusBadge(transaction.status);
                return (
                  <TableRow key={transaction.id}>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>{transaction.entity || "-"}</TableCell>
                    <TableCell>{transaction.account || "-"}</TableCell>
                    <TableCell>{transaction.payment_method || "-"}</TableCell>
                    <TableCell>{new Date(transaction.due_date).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>
                      <Badge className={statusBadge.className}>
                        {statusBadge.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {parseFloat(transaction.amount.toString()).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleEdit(transaction)}
                          title="Visualizar/Editar"
                        >
                          <Eye className="h-4 w-4 text-primary" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleEdit(transaction)}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4 text-warning" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleDelete(transaction.id)}
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4 text-expense" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleCopy(transaction)}
                          title="Copiar"
                        >
                          <Copy className="h-4 w-4 text-income" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      <TransactionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        type="expense"
        transaction={selectedTransaction}
        onSave={(data) => {
          if (selectedTransaction) {
            updateTransaction(data);
          } else {
            createTransaction(data);
          }
        }}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta conta a pagar? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Despesas;
