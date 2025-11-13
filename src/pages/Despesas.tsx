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
	import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

	const Despesas = () => {
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
	  
	  const { transactions, isLoading, createTransaction, updateTransaction, deleteTransaction } = useTransactions("expense");
	
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
        { key: "overdue", label: "Vencidos", value: overdueTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }), variant: "destructive" as const, count: overdue.length },
        { key: "dueToday", label: "Vencem hoje", value: dueTodayTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }), variant: "secondary" as const, count: dueToday.length },
        { key: "upcoming", label: "A vencer", value: upcomingTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }), variant: "outline" as const, count: upcoming.length },
        { key: "paid", label: "Pagos", value: paidTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }), variant: "default" as const, count: paid.length },
        { key: "total", label: "Total", value: total.toLocaleString('pt-BR', { minimumFractionDigits: 2 }), variant: "secondary" as const, count: transactions.length },
      ],
      overdue,
      dueToday,
      upcoming,
      paid,
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

        if (filters.entity && !t.entity?.toLowerCase().includes(String(filters.entity).toLowerCase())) return false;
        if (filters.description && !t.description?.toLowerCase().includes(String(filters.description).toLowerCase())) return false;

        if (filters.minValue && parseFloat(String(t.amount)) < parseFloat(String(filters.minValue))) return false;
        if (filters.maxValue && parseFloat(String(t.amount)) > parseFloat(String(filters.maxValue))) return false;

        if (filters.account && filters.account !== "todos" && t.account !== filters.account) return false;
        if (filters.payment && filters.payment !== "todos" && t.payment_method !== filters.payment) return false;
        if (filters.status && filters.status !== "todos" && t.status !== filters.status) return false;
        if (filters.bank && filters.bank !== "todos" && t.bank_account_id !== filters.bank) return false;

        // Movimento: esta página é apenas de despesas; se o usuário escolher "receitas", não mostrará nada
        if (filters.movement && filters.movement === "receitas") return false;
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
          return dueDateOverdue < today && t.status !== "paid" && t.status !== "confirmed";
        case "dueToday":
          const dueDateToday = new Date(t.due_date);
          dueDateToday.setHours(0, 0, 0, 0);
          return dueDateToday.getTime() === today.getTime() && t.status !== "paid" && t.status !== "confirmed";
        case "upcoming":
          const dueDateUpcoming = new Date(t.due_date);
          dueDateUpcoming.setHours(0, 0, 0, 0);
          return dueDateUpcoming > today && t.status !== "paid" && t.status !== "confirmed";
        case "paid":
          return t.status === "paid" || t.status === "confirmed";
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
          <Button variant="outline" onClick={() => setSearchOpen(true)}>
            <Search className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Busca avançada</span>
            <span className="sm:hidden">Buscar</span>
          </Button>
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
                <Check className="h-4 w-4 mr-2" /> Confirmar pagamentos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info("Função em desenvolvimento")}>
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
              <DropdownMenuItem onClick={() => toast.info("Função em desenvolvimento")}>
                <Upload className="h-4 w-4 mr-2" /> Importar extrato
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info("Função em desenvolvimento")}>
                <Upload className="h-4 w-4 mr-2" /> Importar planilha
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info("Função em desenvolvimento")}>
                <Download className="h-4 w-4 mr-2" /> Exportar pagamentos
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => toast.info("Função em desenvolvimento")}>
                <Group className="h-4 w-4 mr-2" /> Agrupar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info("Função em desenvolvimento")}>
                <Trash className="h-4 w-4 mr-2" /> Excluir pagamentos
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
              activeFilter === item.key
                ? 'ring-2 ring-primary'
                : 'hover:bg-muted/50'
            }`}
            onClick={() => handleCardAction(item.key)}
          >
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">{item.label}</div>
              <Badge variant={item.variant}>{item.count}</Badge>
            </div>
            <div className="text-2xl font-bold">R$ {item.value}</div>
          </Card>
        ))}
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableSortHeader
                label="Vencimento"
                columnKey="due_date"
                sortKey={sortKey}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <TableSortHeader
                label="Descrição"
                columnKey="description"
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
              <TableSortHeader
                label="Status"
                columnKey="status"
                sortKey={sortKey}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedTransactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>{new Date(transaction.due_date).toLocaleDateString('pt-BR')}</TableCell>
                <TableCell>{transaction.description}</TableCell>
                <TableCell>R$ {parseFloat(transaction.amount.toString()).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                <TableCell>
                  <Badge className={getStatusBadge(transaction.status).className}>
                    {getStatusBadge(transaction.status).label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleEdit(transaction)}>
                        <Edit className="h-4 w-4 mr-2" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(transaction.id)}>
                        <Trash2 className="h-4 w-4 mr-2" /> Excluir
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleCopy(transaction)}>
                        <Copy className="h-4 w-4 mr-2" /> Duplicar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handlePartialPayment(transaction)}>
                        <Wallet className="h-4 w-4 mr-2" /> Pagamento Parcial
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => window.open(`/transactions/${transaction.id}`, '_blank')}>
                        <ExternalLink className="h-4 w-4 mr-2" /> Detalhes
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <TransactionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        transaction={selectedTransaction}
        onSave={(data) => {
          if (selectedTransaction) {
            updateTransaction({ ...selectedTransaction, ...data });
          } else {
            createTransaction(data);
          }
          setDialogOpen(false);
        }}
        type="expense"
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta despesa? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PartialPaymentDialog
        open={partialPaymentDialogOpen}
        onOpenChange={setPartialPaymentDialogOpen}
        transaction={transactionForPartialPayment}
        onSave={(data) => {
          console.log("Pagamento parcial salvo", data);
          setPartialPaymentDialogOpen(false);
        }}
      />

      <DailyTransactionDialog
        open={dailyDialogOpen}
        onOpenChange={setDailyDialogOpen}
        onSave={(data) => {
          console.log("Lançamento diário salvo", data);
          setDailyDialogOpen(false);
        }}
        type="expense"
      />

      <AdvancedSearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onSearch={setFilters}
        onClear={() => setFilters({})}
      />
    </div>
  );
};

export default Despesas;
