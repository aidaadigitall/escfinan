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
		import { Checkbox } from "@/components/ui/checkbox";
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
import { ChangeStatusDialog } from "@/components/ChangeStatusDialog";
	
		const Receitas = () => {
		  const navigate = useNavigate();
		  const [dialogOpen, setDialogOpen] = useState(false);
		  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | undefined>();
		  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
		  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
		  const [activeFilter, setActiveFilter] = useState<string | null>(null);
		  const [partialPaymentDialogOpen, setPartialPaymentDialogOpen] = useState(false);
		  const [transactionForPartialPayment, setTransactionForPartialPayment] = useState<Transaction | null>(null);
		  const [dailyDialogOpen, setDailyDialogOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
		  const [searchOpen, setSearchOpen] = useState(false);
		  const [filters, setFilters] = useState<any>({});
		  const [sortKey, setSortKey] = useState<string>("due_date");
		  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
		  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [isChangeStatusOpen, setIsChangeStatusOpen] = useState(false);
  const [transactionToChangeStatus, setTransactionToChangeStatus] = useState<any>(null);
		  
		  const { transactions, isLoading, createTransaction, updateTransaction, deleteTransaction } = useTransactions("income");
		
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
		    // 1) Começa com todas as transações
    let base = transactions;

    // 2) Filtros da busca avançada
    if (filters && Object.keys(filters).length > 0) {
      base = base.filter((t) => {
        // Data de vencimento
        if (filters.startDate) {
          const start = new Date(filters.startDate);
          const transactionDate = new Date(t.due_date);
          if (!isNaN(start.getTime()) && transactionDate < start) return false;
        }
	        if (filters.endDate) {
	          const end = new Date(filters.endDate);
	          const transactionDate = new Date(t.due_date);
	          // Adiciona 1 dia para incluir o dia final no filtro
	          end.setDate(end.getDate() + 1);
	          if (!isNaN(end.getTime()) && transactionDate >= end) return false;
	        }
	
	        // Data de competência (competence_date)
	          if (filters.competenceStartDate) {
	            const start = new Date(filters.competenceStartDate);
	            const transactionDate = new Date(t.competence_date);
	            if (!isNaN(start.getTime()) && transactionDate < start) return false;
	          }
	          if (filters.competenceEndDate) {
	            const end = new Date(filters.competenceEndDate);
	            const transactionDate = new Date(t.competence_date);
	            // Adiciona 1 dia para incluir o dia final no filtro
	            end.setDate(end.getDate() + 1);
	            if (!isNaN(end.getTime()) && transactionDate >= end) return false;
	          }
	
	        if (filters.entity && !t.entity?.toLowerCase().includes(String(filters.entity).toLowerCase())) return false;
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
	
		  const handleChangeStatus = (transactionId: string, newTransactionData: any) => {
    // Lógica para atualizar o status da transação (simulação)
    console.log(`Atualizando transação ${transactionId} com dados:`, newTransactionData);
    toast.success(`Transação ${transactionId} atualizada para ${newTransactionData.status}`);
    // Aqui você chamaria a API para persistir a mudança
  };

  const handleBatchAction = (action: "confirm" | "cancel" | "delete") => {
		    if (action === "delete") {
		      // Lógica para deletar em lote
		      selectedTransactions.forEach(id => deleteTransaction(id));
		    } else {
		      // Lógica para confirmar ou cancelar em lote
		      const newStatus = action === "confirm" ? "received" : "pending";
		      selectedTransactions.forEach(id => {
		        const transaction = transactions.find(t => t.id === id);
		        if (transaction) {
		          updateTransaction({ ...transaction, status: newStatus });
		        }
		      });
		    }
		    setSelectedTransactions([]);
		  };
		
		  return (
		    <div className="space-y-6">
		      <div className="flex justify-between items-center sticky top-0 bg-background z-10 py-4">
		        <h1 className="text-2xl font-bold">Contas a Receber</h1>
		        <div className="flex gap-2">
		
		          {/* 1. Receitas Fixas */}
		          <Button 
		            variant="outline"
		            onClick={() => navigate("/receitas-fixas")}
		            className="bg-primary/10 hover:bg-primary/20 border-primary"
		          >
		            <FileText className="h-4 w-4 mr-2" />
		            <span className="hidden sm:inline">Receitas Fixas</span>
		            <span className="sm:hidden">Fixas</span>
		          </Button>
		
		          {/* 2. Lançamento Diário */}
		          <Button variant="outline" onClick={() => setDailyDialogOpen(true)}>
		            <Wallet className="h-4 w-4 mr-2" />
		            <span className="hidden sm:inline">Lançamento Diário</span>
		            <span className="sm:hidden">Diário</span>
		          </Button>
		
		          {/* 3. Ações em Lote */}
		          <DropdownMenu>
		            <DropdownMenuTrigger asChild>
		              <Button variant="outline" disabled={selectedTransactions.length === 0}>
		                <Settings className="h-4 w-4 mr-2" />
		                <span className="hidden sm:inline">Ações em Lote ({selectedTransactions.length})</span>
		                <span className="sm:hidden">Ações ({selectedTransactions.length})</span>
		              </Button>
		            </DropdownMenuTrigger>
		            <DropdownMenuContent align="end">
		              <DropdownMenuItem onClick={() => handleBatchAction("confirm")}>
		                <Check className="h-4 w-4 mr-2" /> Confirmar recebimentos
		              </DropdownMenuItem>
		              <DropdownMenuItem onClick={() => handleBatchAction("cancel")}>
		                <X className="h-4 w-4 mr-2" /> Cancelar recebimentos
		              </DropdownMenuItem>
		              <DropdownMenuItem onClick={() => handleBatchAction("delete")}>
		                <Trash className="h-4 w-4 mr-2" /> Excluir em lote
		              </DropdownMenuItem>
		              <DropdownMenuSeparator />
		              <DropdownMenuItem onClick={() => navigate("/receitas-fixas")}>
		                <FileText className="h-4 w-4 mr-2" /> Receitas fixas
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
		            </DropdownMenuContent>
		          </DropdownMenu>
		
		          {/* 4. Busca Avançada */}
		          <Button variant="outline" onClick={() => setSearchOpen(true)}>
		            <Search className="h-4 w-4 mr-2" />
		            <span className="hidden sm:inline">Busca avançada</span>
		            <span className="sm:hidden">Buscar</span>
		          </Button>
		
<<<<<<< HEAD
          {/* Adicionar */}
          <Button variant="default" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Adicionar</span>
            <span className="sm:hidden">Add</span>
          </Button>
=======
		          {/* Adicionar */}
		          <Button variant="default" onClick={() => setIsAdding(!isAdding)}>
		            <Plus className="h-4 w-4 mr-2" />
		            <span className="hidden sm:inline">{isAdding ? 'Cancelar' : 'Adicionar'}</span>
		            <span className="sm:hidden">{isAdding ? 'Canc.' : 'Add'}</span>
		          </Button>
>>>>>>> 2293cf3 (feat: Implementa menu de ações completo e botão 'Adicionar' inline em Despesas e Receitas)
		        </div>
		      </div>
	
		      {isAdding && (
        <Card className="mb-4 p-4">
          <h3 className="text-lg font-semibold mb-4">Novo Lançamento de Receita</h3>
          {/* Aqui será o formulário de adição */}
          <p>Formulário de adição de receita será implementado aqui.</p>
          <Button onClick={() => setIsAdding(false)} className="mt-4">Salvar</Button>
        </Card>
      )}

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
              <TableHead className="w-12">
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
                className="text-right"
              />
              <TableSortHeader
                label="Status"
                columnKey="status"
                sortKey={sortKey}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <TableHead className="text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
		          <TableBody>
		            {isLoading ? (
		              <TableRow>
		                <TableCell colSpan={6} className="text-center">Carregando...</TableCell>
		              </TableRow>
		            ) : (
		              filteredAndSortedTransactions.map((transaction) => (
		                <TableRow key={transaction.id}>
		                  <TableCell>
		                    <Checkbox 
		                      checked={selectedTransactions.includes(transaction.id)}
		                      onCheckedChange={() => handleSelectTransaction(transaction.id)}
		                    />
		                  </TableCell>
		                  <TableCell>{new Date(transaction.due_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</TableCell>
		                  <TableCell>{transaction.description}</TableCell>
		                  <TableCell>{parseFloat(transaction.amount.toString()).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                  <TableCell>
                    <Badge 
                      className="cursor-pointer"
                      variant={transaction.status === 'received' ? 'default' : transaction.status === 'pending' ? 'outline' : 'destructive'}
                      onClick={() => {
                        setTransactionToChangeStatus(transaction);
                        setIsChangeStatusOpen(true);
                      }}
                    >
                      {transaction.status === 'received' ? 'Recebido' : transaction.status === 'pending' ? 'Pendente' : 'Vencido'}
                    </Badge>
<<<<<<< HEAD
                  </TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(transaction)}>
                      <Edit className="h-4 w-4 text-orange-500" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(transaction.id)}>
                      <Trash className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
		                </TableRow>
		              ))
=======
		                  </TableCell>
			                  <TableCell className="text-center space-x-2">
			                    <Button variant="ghost" size="icon" onClick={() => handleView(transaction)}>
			           <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => toast.info("Função em desenvolvimento")}>
                        <Eye className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(transaction)}>
                        <Edit className="h-4 w-4 text-orange-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handlePartialPayment(transaction)}>
                        <Copy className="h-4 w-4 text-green-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(transaction.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>              ))
>>>>>>> 2293cf3 (feat: Implementa menu de ações completo e botão 'Adicionar' inline em Despesas e Receitas)
		            )}
		          </TableBody>
		        </Table>
		      </Card>
	
      <TransactionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        transaction={selectedTransaction}
        type="income"
        onSave={() => {}}
      />

      <PartialPaymentDialog
        open={partialPaymentDialogOpen}
        onOpenChange={setPartialPaymentDialogOpen}
        transaction={transactionForPartialPayment}
        onSave={() => {}}
      />

      <DailyTransactionDialog
        open={dailyDialogOpen}
        onOpenChange={setDailyDialogOpen}
        type="income"
        onSave={() => {}}
      />

      <AdvancedSearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onSearch={setFilters}
        onClear={() => setFilters({})}
      />
      {transactionToChangeStatus && (
        <ChangeStatusDialog
          open={isChangeStatusOpen}
          onOpenChange={setIsChangeStatusOpen}
          transaction={transactionToChangeStatus}
          onStatusChange={handleChangeStatus}
        />
      )}
	
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
		            <AlertDialogAction onClick={confirmDelete}>Continuar</AlertDialogAction>
		          </AlertDialogFooter>
		        </AlertDialogContent>
		      </AlertDialog>
		    </div>
		  );
		};
		
		export default Receitas;
