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
import { Checkbox } from "@/components/ui/checkbox";
import { TableSortHeader } from "@/components/TableSortHeader";
import { useTransactions, Transaction } from "@/hooks/useTransactions";
import { PartialPaymentDialog } from "@/components/PartialPaymentDialog";
import { TransactionDialog } from "@/components/TransactionDialog";
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
import { ChangeStatusDialog } from "@/components/ChangeStatusDialog";

const Receitas = () => {
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | undefined>(undefined);
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [partialPaymentDialogOpen, setPartialPaymentDialogOpen] = useState(false);
  const [transactionForPartialPayment, setTransactionForPartialPayment] = useState<Transaction | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [filters, setFilters] = useState<any>({});
  const [sortKey, setSortKey] = useState<string>("due_date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [isChangeStatusOpen, setIsChangeStatusOpen] = useState(false);
  const [transactionToChangeStatus, setTransactionToChangeStatus] = useState<any>(null);
  
  const { transactions, isLoading, createTransaction, updateTransaction, deleteTransaction } = useTransactions("income");

  const handleOpenTransactionDialog = (transaction?: Transaction) => {
    setTransactionToEdit(transaction);
    setTransactionDialogOpen(true);
  };

  const handleSaveTransaction = (data: any) => {
    if (data.id) {
      updateTransaction(data);
    } else {
      createTransaction(data);
    }
  };

  const summaryData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdue = transactions.filter(t => {
      const dueDate = new Date(t.due_date);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate < today && t.status !== "received" && t.status !== "confirmed";
    });
    
    const dueToday = transactions.filter(t => {
      const dueDate = new Date(t.due_date);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate.getTime() === today.getTime() && t.status !== "received" && t.status !== "confirmed";
    });
    
    const upcoming = transactions.filter(t => {
      const dueDate = new Date(t.due_date);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate > today && t.status !== "received" && t.status !== "confirmed";
    });
    
    const received = transactions.filter(t => t.status === "received" || t.status === "confirmed");

    const total = transactions.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
    const overdueTotal = overdue.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
    const dueTodayTotal = dueToday.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
    const upcomingTotal = upcoming.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
    const receivedTotal = received.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

    return {
      cards: [
        { key: "overdue", label: "Vencidos", value: overdueTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }), variant: "destructive" as const, count: overdue.length, color: "text-destructive", bandClass: "bg-destructive" },
        { key: "dueToday", label: "Vencem hoje", value: dueTodayTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }), variant: "secondary" as const, count: dueToday.length, color: "text-warning", bandClass: "bg-warning" },
        { key: "upcoming", label: "A vencer", value: upcomingTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }), variant: "outline" as const, count: upcoming.length, color: "text-foreground", bandClass: "bg-gray-400" },
        { key: "received", label: "Recebidos", value: receivedTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }), variant: "default" as const, count: received.length, color: "text-success", bandClass: "bg-success" },
        { key: "total", label: "Total", value: total.toLocaleString('pt-BR', { minimumFractionDigits: 2 }), variant: "default" as const, count: transactions.length, color: "text-black", bandClass: "bg-black" },
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
    let base = transactions;

    if (filters && Object.keys(filters).length > 0) {
      base = base.filter((t) => {
        if (filters.startDate) {
          const start = new Date(filters.startDate);
          const transactionDate = new Date(t.due_date);
          if (!isNaN(start.getTime()) && transactionDate < start) return false;
        }
        if (filters.endDate) {
          const end = new Date(filters.endDate);
          const transactionDate = new Date(t.due_date);
          end.setDate(end.getDate() + 1);
          if (!isNaN(end.getTime()) && transactionDate >= end) return false;
        }

        // Competence date filters removed - field not in database

        if (filters.entity && !t.entity?.toLowerCase().includes(String(filters.entity).toLowerCase())) return false;
        if (filters.description && !t.description?.toLowerCase().includes(String(filters.description).toLowerCase())) return false;

        if (filters.minValue && parseFloat(String(t.amount)) < parseFloat(String(filters.minValue))) return false;
        if (filters.maxValue && parseFloat(String(t.amount)) > parseFloat(String(filters.maxValue))) return false;

        if (filters.account && filters.account !== "todos" && t.account !== filters.account) return false;
        if (filters.payment && filters.payment !== "todos" && t.payment_method !== filters.payment) return false;
        if (filters.status && filters.status !== "todos" && t.status !== filters.status) return false;
        if (filters.bank && filters.bank !== "todos" && t.bank_account_id !== filters.bank) return false;

        if (filters.movement && filters.movement === "despesas") return false;
        return true;
      });
    }

    let filtered = activeFilter ? base.filter(t => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      switch (activeFilter) {
        case "overdue":
          const dueDateOverdue = new Date(t.due_date);
          dueDateOverdue.setHours(0, 0, 0, 0);
          return dueDateOverdue < today && t.status !== "received" && t.status !== "confirmed";
        case "dueToday":
          const dueDateToday = new Date(t.due_date);
          dueDateToday.setHours(0, 0, 0, 0);
          return dueDateToday.getTime() === today.getTime() && t.status !== "received" && t.status !== "confirmed";
        case "upcoming":
          const dueDateUpcoming = new Date(t.due_date);
          dueDateUpcoming.setHours(0, 0, 0, 0);
          return dueDateUpcoming > today && t.status !== "received" && t.status !== "confirmed";
        case "received":
          return t.status === "received" || t.status === "confirmed";
        default:
          return true;
      }
    }) : base;

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

  const handleEdit = (transaction: Transaction) => {
    handleOpenTransactionDialog(transaction);
  };

  const handleView = (transaction: Transaction) => {
    // Por enquanto, apenas abre o modal em modo de visualização/edição
    handleOpenTransactionDialog(transaction);
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
    const newTransaction = { ...transaction, due_date: new Date().toISOString().split('T')[0] };
    delete newTransaction.id;
    createTransaction(newTransaction);
  };

  const handlePartialPayment = (transaction: Transaction) => {
    setTransactionForPartialPayment(transaction);
    setPartialPaymentDialogOpen(true);
  };

  const handleSelectTransaction = (id: string) => {
    setSelectedTransactions(prev => 
      prev.includes(id) ? prev.filter(tId => tId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedTransactions.length === filteredAndSortedTransactions.length && filteredAndSortedTransactions.length > 0) {
      setSelectedTransactions([]);
    } else {
      setSelectedTransactions(filteredAndSortedTransactions.map(t => t.id));
    }
  };

  const handleChangeStatus = (transaction: any) => {
    setTransactionToChangeStatus(transaction);
    setIsChangeStatusOpen(true);
  };

  const handleBulkMarkAsReceived = () => {
    if (window.confirm(`Tem certeza que deseja marcar ${selectedTransactions.length} transações como Recebidas?`)) {
      selectedTransactions.forEach(id => updateTransaction({ id, status: "received", received_date: new Date().toISOString() }));
      setSelectedTransactions([]);
      toast.success(`${selectedTransactions.length} transações marcadas como Recebidas com sucesso!`);
    }
  };

  const handleBulkChangeDueDate = () => {
    const newDueDate = prompt("Digite a nova data de vencimento (AAAA-MM-DD):");
    if (newDueDate) {
      if (window.confirm(`Tem certeza que deseja alterar o vencimento de ${selectedTransactions.length} transações para ${newDueDate}?`)) {
        selectedTransactions.forEach(id => updateTransaction({ id, due_date: newDueDate }));
        setSelectedTransactions([]);
        toast.success(`${selectedTransactions.length} vencimentos alterados com sucesso!`);
      }
    }
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Tem certeza que deseja excluir ${selectedTransactions.length} transações?`)) {
      selectedTransactions.forEach(id => deleteTransaction(id));
      setSelectedTransactions([]);
      toast.success(`${selectedTransactions.length} transações excluídas com sucesso!`);
    }
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Contas a Receber</h2>
        <div className="flex items-center space-x-2">
                <Button variant="outline" onClick={() => navigate("/contas-fixas")}>Receitas Fixas</Button>
          <Button variant="outline" onClick={() => handleOpenTransactionDialog()}>Lançamento Diário</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={selectedTransactions.length === 0}>
                Ações em Lote ({selectedTransactions.length})
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleBulkMarkAsReceived}>
                Marcar como Recebido
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleBulkChangeDueDate}>
                Alterar Vencimento
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleBulkDelete} className="text-red-600">
                Excluir Selecionados
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" onClick={() => setSearchOpen(true)}>
            <Search className="h-4 w-4 mr-2" />
            Busca avançada
          </Button>
          <Button variant="default" onClick={() => handleOpenTransactionDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Adicionar</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {summaryData.cards.map((card) => (
          <Card 
            key={card.key}
            className={`relative overflow-hidden cursor-pointer ${activeFilter === card.key ? 'border-primary' : ''}`}
            onClick={() => setActiveFilter(activeFilter === card.key ? null : card.key)}
          >
            <div className={`absolute top-0 left-0 right-0 h-2 ${card.bandClass}`}></div>
            <div className="p-4 pt-6">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-muted-foreground">{card.label}</h3>
                <span className="text-xs text-muted-foreground">{card.count} item(s)</span>
              </div>
              <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox 
                  checked={selectedTransactions.length === filteredAndSortedTransactions.length && filteredAndSortedTransactions.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
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
            {filteredAndSortedTransactions.map((transaction) => {
              const statusText = transaction.status === 'paid' ? 'Pago' : transaction.status === 'received' ? 'Recebido' : transaction.status === 'pending' ? 'Pendente' : 'Vencido';
              const statusVariant = transaction.status === 'paid' || transaction.status === 'received' ? 'default' : transaction.status === 'pending' ? 'secondary' : 'destructive';
              const statusClass = transaction.status === 'pending' ? 'bg-orange-500 text-white hover:bg-orange-600' : '';

              return (
                <TableRow key={transaction.id}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedTransactions.includes(transaction.id)}
                      onCheckedChange={() => handleSelectTransaction(transaction.id)}
                    />
                  </TableCell>
                  <TableCell>{new Date(transaction.due_date).toLocaleDateString()}</TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell>{parseFloat(transaction.amount.toString()).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant} className={statusClass} onClick={() => handleChangeStatus(transaction)}>
                      {statusText}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => handleView(transaction)}>
                        <Eye className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(transaction)}>
                        <Edit className="h-4 w-4 text-yellow-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handlePartialPayment(transaction)}>
                        <Copy className="h-4 w-4 text-green-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(transaction.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente a transação.
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
        onSave={(updatedTransaction) => {
          updateTransaction(updatedTransaction);
          setPartialPaymentDialogOpen(false);
        }}
      />

      <AdvancedSearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onSearch={(newFilters) => {
          setFilters(newFilters);
          setSearchOpen(false);
        }}
        onClear={() => setFilters({})}
      />

      <TransactionDialog
        open={transactionDialogOpen}
        onOpenChange={setTransactionDialogOpen}
        type="income"
        transaction={transactionToEdit}
        onSave={handleSaveTransaction}
      />

      {transactionToChangeStatus && (
        <ChangeStatusDialog
          open={isChangeStatusOpen}
          onOpenChange={setIsChangeStatusOpen}
          transaction={transactionToChangeStatus}
          onStatusChange={(id, data) => {
            updateTransaction({ ...transactionToChangeStatus, ...data, id });
            setIsChangeStatusOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default Receitas;
