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
import { Plus, Search, Eye, Edit, Trash2, Copy, ExternalLink, Wallet, FileText, Settings, Check, X, ArrowRightLeft, Upload, Download, Group, Trash } from "lucide-react";
import { TableSortHeader } from "@/components/TableSortHeader";
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
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const Receitas = () => {
  const { transactions, isLoading, createTransaction, updateTransaction, deleteTransaction } = useTransactions("income");
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
  const [filters, setFilters] = useState<any>({});
  const [sortKey, setSortKey] = useState<string>("due_date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const summaryData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdue = transactions.filter(t => {
      const dueDate = new Date(t.due_date);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate < today && t.status !== "received" && t.status !== "paid";
    });
    
    const dueToday = transactions.filter(t => {
      const dueDate = new Date(t.due_date);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate.getTime() === today.getTime() && t.status !== "received" && t.status !== "paid";
    });
    
    const upcoming = transactions.filter(t => {
      const dueDate = new Date(t.due_date);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate > today && t.status !== "received" && t.status !== "paid";
    });
    
    const received = transactions.filter(t => t.status === "received" || t.status === "paid");

    const total = transactions.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
    const overdueTotal = overdue.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
    const dueTodayTotal = dueToday.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
    const upcomingTotal = upcoming.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
    const receivedTotal = received.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

    return {
      cards: [
        { key: "overdue", label: "Vencidos", value: overdueTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }), variant: "expense" as const, count: overdue.length },
        { key: "dueToday", label: "Vencem hoje", value: dueTodayTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }), variant: "warning" as const, count: dueToday.length },
        { key: "upcoming", label: "A vencer", value: upcomingTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }), variant: "pending" as const, count: upcoming.length },
        { key: "received", label: "Recebidos", value: receivedTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }), variant: "income" as const, count: received.length },
        { key: "total", label: "Total", value: total.toLocaleString('pt-BR', { minimumFractionDigits: 2 }), variant: "default" as const, count: transactions.length },
      ],
      overdue,
      dueToday,
      upcoming,
      received,
    };
  }, [transactions]);

  const handleSort = (key: string) => {
    if (key === sortKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const filteredAndSortedTransactions = useMemo(() => {
    // 1) Começa com todas as transações
    let base = transactions;

    // 2) Filtros da busca avançada
    if (filters && Object.keys(filters).length > 0) {
      base = base.filter((t) => {
        // Período (due_date)
        if (filters.startDate) {
          const start = new Date(filters.startDate);
          if (!isNaN(start.getTime()) && new Date(t.due_date) < start) return false;
        }
        if (filters.endDate) {
          const end = new Date(filters.endDate);
          if (!isNaN(end.getTime()) && new Date(t.due_date) > end) return false;
        }

        if (filters.client && !t.client?.toLowerCase().includes(String(filters.client).toLowerCase())) return false;
        if (filters.description && !t.description?.toLowerCase().includes(String(filters.description).toLowerCase())) return false;

        if (filters.minValue && parseFloat(String(t.amount)) < parseFloat(String(filters.minValue))) return false;
        if (filters.maxValue && parseFloat(String(t.amount)) > parseFloat(String(filters.maxValue))) return false;

        if (filters.account && filters.account !== "todos" && t.account !== filters.account) return false;
        if (filters.payment && filters.payment !== "todos" && t.payment_method !== filters.payment) return false;
        if (filters.status && filters.status !== "todos" && t.status !== filters.status) return false;
        if (filters.bank && filters.bank !== "todos" && t.bank_account_id !== filters.bank) return false;

        // Movimento: esta página é apenas de receitas; se o usuário escolher "despesas", não mostrará nada
        if (filters.movement && filters.movement === "despesas") return false;
        return true;
      });
    }

    // 3) Filtro rápido pelos cards
    let filtered = activeFilter ? base.filter(t => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      switch (activeFilter) {
        case "overdue":
          const dueDateOverdue = new Date(t.due_date);
          dueDateOverdue.setHours(0, 0, 0, 0);
          return dueDateOverdue < today && t.status !== "received" && t.status !== "paid";
        case "dueToday":
          const dueDateToday = new Date(t.due_date);
          dueDateToday.setHours(0, 0, 0, 0);
          return dueDateToday.getTime() === today.getTime() && t.status !== "received" && t.status !== "paid";
        case "upcoming":
          const dueDateUpcoming = new Date(t.due_date);
          dueDateUpcoming.setHours(0, 0, 0, 0);
          return dueDateUpcoming > today && t.status !== "received" && t.status !== "paid";
        case "received":
          return t.status === "received" || t.status === "paid";
        default:
          return true;
      }
    }) : base;

    // 4) Ordenação
    return filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortKey) {
        case "due_date":
          aValue = new Date(a.due_date).getTime();
          bValue = new Date(b.due_date).getTime();
          break;
        case "description":
          aValue = a.description.toLowerCase();
          bValue = b.description.toLowerCase();
          break;
        case "amount":
          aValue = parseFloat(a.amount.toString());
          bValue = parseFloat(b.amount.toString());
          break;
        case "status":
          aValue = a.status.toLowerCase();
          bValue = b.status.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortDirection === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [transactions, activeFilter, filters, sortKey, sortDirection]);

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
      received: { label: "Recebida", className: "bg-income text-income-foreground" },
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
        <h1 className="text-2xl font-bold">Contas a Receber</h1>
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
              <DropdownMenuItem onClick={() => toast.info("Função em desenvolvimento")}>
                <Check className="h-4 w-4 mr-2" /> Confirmar recebimentos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info("Função em desenvolvimento")}>
                <X className="h-4 w-4 mr-2" /> Cancelar recebimentos
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/contas-fixas")}>
                <FileText className="h-4 w-4 mr-2" /> Contas fixas
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/transferencias")}>
                <ArrowRightLeft className="h-4 w-4 mr-2" /> Transferências entre contas
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => toast.info("Função em desenvolvimento")}>
                <Upload className="h-4 w-4 mr-2" /> Importar extrato
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info("Função em desenvolvimento")}>
                <Upload className="h-4 w-4 mr-2" /> Importar planilha
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info("Função em desenvolvimento")}>
                <Download className="h-4 w-4 mr-2" /> Exportar recebimentos
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => toast.info("Função em desenvolvimento")}>
                <Group className="h-4 w-4 mr-2" /> Agrupar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info("Função em desenvolvimento")}>
                <Trash className="h-4 w-4 mr-2" /> Excluir recebimentos
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
	              <TableSortHeader
	                label="Descrição"
	                columnKey="description"
	                sortKey={sortKey}
	                sortDirection={sortDirection}
	                onSort={handleSort}
	              />
	              <TableHead>Entidade</TableHead>
	              <TableHead>Conta</TableHead>
	              <TableHead>Pagamento</TableHead>
	              <TableSortHeader
	                label="Data"
	                columnKey="due_date"
	                sortKey={sortKey}
	                sortDirection={sortDirection}
	                onSort={handleSort}
	              />
	              <TableSortHeader
	                label="Situação"
	                columnKey="status"
	                sortKey={sortKey}
	                sortDirection={sortDirection}
	                onSort={handleSort}
	              />
	              <TableSortHeader
	                label="Valor"
	                columnKey="amount"
	                sortKey={sortKey}
	                sortDirection={sortDirection}
	                onSort={handleSort}
	                className="text-right"
	              />
	              <TableHead>Ações</TableHead>
	            </TableRow>
	          </TableHeader>
	          <TableBody>
	            {filteredAndSortedTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  {activeFilter ? "Nenhum lançamento encontrado para este filtro" : "Nenhuma conta a receber cadastrada"}
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
        type="income"
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
	        type="income"
	        onSave={createTransaction}
	      />
	
	      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
	        <AlertDialogContent>
	          <AlertDialogHeader>
	            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
	            <AlertDialogDescription>
	              Tem certeza que deseja excluir esta conta a receber? Esta ação não pode ser desfeita.
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
	          toast.success("Filtros aplicados com sucesso!");
	        }}
	        onClear={() => {
	          setFilters({});
	          toast.info("Filtros removidos.");
	        }}
	        initialFilters={filters}
	        type="income"
	      />
	    </div>
	  );
	};
	
	export default Receitas;
