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
import { Plus, Search, Eye, Edit, Trash2, Copy, ExternalLink, Wallet, FileText, Settings, Check, X, List, ArrowRightLeft, Upload, Download, Group, Trash } from "lucide-react";
import { useTransactions, Transaction } from "@/hooks/useTransactions";
import { TransactionDialog } from "@/components/TransactionDialog";
import { PartialPaymentDialog } from "@/components/PartialPaymentDialog";
import { DailyTransactionDialog } from "@/components/DailyTransactionDialog";
import { AdvancedSearchDialog } from "@/components/fluxo-caixa/AdvancedSearchDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";

const Despesas = () => {
  const { transactions, isLoading, createTransaction, updateTransaction, deleteTransaction } = useTransactions("expense", filters);
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [partialPaymentDialogOpen, setPartialPaymentDialogOpen] = useState(false);
  const [transactionForPartialPayment, setTransactionForPartialPayment] = useState<Transaction | null>(null);
  const [dailyDialogOpen, setDailyDialogOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [filters, setFilters] = useState({});

  const summaryData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdue = transactions.filter(t => {
      const dueDate = new Date(t.due_date);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate < today && t.status !== "paid" && t.status !== "confirmed";
    });
    
    const dueToday = transactions.filter(t => {
      const dueDate = new Date(t.due_date);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate.getTime() === today.getTime() && t.status !== "paid" && t.status !== "confirmed";
    });
    
    const upcoming = transactions.filter(t => {
      const dueDate = new Date(t.due_date);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate > today && t.status !== "paid" && t.status !== "confirmed";
    });
    
    const paid = transactions.filter(t => t.status === "paid" || t.status === "confirmed");

    const total = transactions.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
    const overdueTotal = overdue.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
    const dueTodayTotal = dueToday.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
    const upcomingTotal = upcoming.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
    const paidTotal = paid.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

    return {
      cards: [
        { key: "overdue", label: "Vencidos", value: overdueTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }), variant: "expense" as const, count: overdue.length },
        { key: "dueToday", label: "Vencem hoje", value: dueTodayTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }), variant: "warning" as const, count: dueToday.length },
        { key: "upcoming", label: "A vencer", value: upcomingTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }), variant: "pending" as const, count: upcoming.length },
        { key: "paid", label: "Pagos", value: paidTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }), variant: "income" as const, count: paid.length },
        { key: "total", label: "Total", value: total.toLocaleString('pt-BR', { minimumFractionDigits: 2 }), variant: "default" as const, count: transactions.length },
      ],
      overdue,
      dueToday,
      upcoming,
      paid,
    };
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    if (!activeFilter) return transactions;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch (activeFilter) {
      case "overdue":
        return transactions.filter(t => {
          const dueDate = new Date(t.due_date);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate < today && t.status !== "paid" && t.status !== "confirmed";
        });
      case "dueToday":
        return transactions.filter(t => {
          const dueDate = new Date(t.due_date);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate.getTime() === today.getTime() && t.status !== "paid" && t.status !== "confirmed";
        });
      case "upcoming":
        return transactions.filter(t => {
          const dueDate = new Date(t.due_date);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate > today && t.status !== "paid" && t.status !== "confirmed";
        });
      case "paid":
        return transactions.filter(t => t.status === "paid" || t.status === "confirmed");
      default:
        return transactions;
    }
  }, [transactions, activeFilter]);

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

  const handlePartialPayment = (transaction: Transaction) => {
    setTransactionForPartialPayment(transaction);
    setPartialPaymentDialogOpen(true);
  };

  const handleCardAction = (filterKey: string) => {
    setActiveFilter(activeFilter === filterKey ? null : filterKey);
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
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => navigate("/contas-fixas")}
            className="bg-primary/10 hover:bg-primary/20 border-primary"
          >
            <FileText className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Contas fixas</span>
            <span className="sm:hidden">Fixas</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Mais ações</span>
                <span className="sm:hidden">Ações</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => console.log("Confirmar pagamentos")}>
                <Check className="h-4 w-4 mr-2" /> Confirmar pagamentos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => console.log("Cancelar pagamentos")}>
                <X className="h-4 w-4 mr-2" /> Cancelar pagamentos
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/contas-fixas")}>
                <FileText className="h-4 w-4 mr-2" /> Contas fixas
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/transferencias")}>
                <ArrowRightLeft className="h-4 w-4 mr-2" /> Transferências entre contas
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => console.log("Importar extrato")}>
                <Upload className="h-4 w-4 mr-2" /> Importar extrato
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => console.log("Importar planilha")}>
                <Upload className="h-4 w-4 mr-2" /> Importar planilha
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => console.log("Exportar pagamentos")}>
                <Download className="h-4 w-4 mr-2" /> Exportar pagamentos
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => console.log("Agrupar")}>
                <Group className="h-4 w-4 mr-2" /> Agrupar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => console.log("Excluir pagamentos")}>
                <Trash className="h-4 w-4 mr-2" /> Excluir pagamentos
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" onClick={() => setSearchOpen(true)}>
            <Search className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Busca avançada</span>
            <span className="sm:hidden">Buscar</span>
          </Button>
          <Button variant="outline" onClick={() => setDailyDialogOpen(true)}>
            <Wallet className="h-4 w-4 mr-2" />
            <span className="hidden md:inline">Lançamento Diário</span>
            <span className="md:hidden">Diário</span>
          </Button>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Adicionar</span>
            <span className="sm:hidden">+</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {summaryData.cards.map((item) => (
          <Card 
            key={item.key} 
            className={`p-4 transition-all hover:shadow-lg cursor-pointer ${
              activeFilter === item.key ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => handleCardAction(item.key)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
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
                {activeFilter === item.key && (
                  <p className="text-xs text-primary mt-1">
                    Mostrando {item.count} lançamento(s)
                  </p>
                )}
              </div>
              {item.key !== "total" && (
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
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
            {filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  {activeFilter ? "Nenhum lançamento encontrado para este filtro" : "Nenhuma conta a pagar cadastrada"}
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map((transaction) => {
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
                      <div className="flex flex-col gap-1">
                        <span>
                          R$ {parseFloat(transaction.amount.toString()).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                        {transaction.paid_amount && transaction.paid_amount > 0 && (
                          <div className="text-xs space-y-0.5">
                            <div className="text-income">
                              Pago: R$ {transaction.paid_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                            <div className="text-warning">
                              Restante: R$ {(parseFloat(transaction.amount.toString()) - transaction.paid_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handlePartialPayment(transaction)}
                          title="Pagamento Parcial"
                        >
                          <Wallet className="h-4 w-4 text-income" />
                        </Button>
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

      <PartialPaymentDialog
        open={partialPaymentDialogOpen}
        onOpenChange={setPartialPaymentDialogOpen}
        transaction={transactionForPartialPayment}
        onSave={updateTransaction}
      />

      <DailyTransactionDialog
        open={dailyDialogOpen}
        onOpenChange={setDailyDialogOpen}
        type="expense"
        onSave={createTransaction}
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

      <AdvancedSearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onSearch={(newFilters) => {
          setFilters(newFilters);
          // toast.success("Busca avançada aplicada!");
        }}
        onClear={() => {
          setFilters({});
          // toast.info("Filtros removidos.");
        }}
      />
    </div>
  );
};

export default Despesas;
