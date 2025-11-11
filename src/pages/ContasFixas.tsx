import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { RecurringBillDialog } from "@/components/RecurringBillDialog";
import { RecurringBillSearchDialog } from "@/components/RecurringBillSearchDialog";
import { EditRecurringChoiceDialog } from "@/components/EditRecurringChoiceDialog";
import { TransactionDialog } from "@/components/TransactionDialog";

const ContasFixas = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [searchFilters, setSearchFilters] = useState<any>({});
  const [choiceDialogOpen, setChoiceDialogOpen] = useState(false);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const queryClient = useQueryClient();

  // Buscar transactions geradas pelas recurring bills
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["recurring-transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .not("notes", "is", null)
        .order("due_date", { ascending: true });

      if (error) throw error;
      // Filtrar apenas transactions com metadata de recurring_bill_id nas notes
      return data.filter((t: any) => t.notes?.includes("recurring_bill_id"));
    },
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Lançamento excluído com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao excluir lançamento");
    },
  });

  const updateTransactionMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from("transactions")
        .update(data)
        .eq("id", data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Lançamento atualizado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar lançamento");
    },
  });

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    
    return transactions.filter((transaction: any) => {
      if (searchFilters.description && !transaction.description.toLowerCase().includes(searchFilters.description.toLowerCase())) {
        return false;
      }
      if (searchFilters.type && transaction.type !== searchFilters.type) {
        return false;
      }
      if (searchFilters.minAmount && parseFloat(transaction.amount) < parseFloat(searchFilters.minAmount)) {
        return false;
      }
      if (searchFilters.maxAmount && parseFloat(transaction.amount) > parseFloat(searchFilters.maxAmount)) {
        return false;
      }
      return true;
    });
  }, [transactions, searchFilters]);

  const getRecurrenceLabel = (type: string) => {
    const labels: Record<string, string> = {
      daily: "Diário",
      weekly: "Semanal",
      monthly: "Mensal",
      yearly: "Anual",
    };
    return labels[type] || type;
  };

  const extractRecurringData = (notes: string | null) => {
    if (!notes) return { recurrenceType: null };
    
    const typeMatch = notes.match(/recurrence_type:(\w+)/);
    return {
      recurrenceType: typeMatch ? getRecurrenceLabel(typeMatch[1]) : null,
    };
  };

  const handleEdit = (transaction: any) => {
    setEditingTransaction(transaction);
    setChoiceDialogOpen(true);
  };

  const handleEditChoice = async (choice: "single" | "future") => {
    if (!editingTransaction) return;

    if (choice === "single") {
      // Editar apenas essa transação
      setTransactionDialogOpen(true);
    } else {
      // Editar a recurring bill (essa e futuras)
      // Extrair o recurring_bill_id das notes
      const recurringBillId = extractRecurringBillId(editingTransaction.notes);
      
      if (recurringBillId) {
        const { data, error } = await supabase
          .from("recurring_bills")
          .select("*")
          .eq("id", recurringBillId)
          .single();

        if (!error && data) {
          setSelectedBill(data);
          setDialogOpen(true);
        } else {
          toast.error("Não foi possível encontrar a conta fixa original");
        }
      } else {
        toast.error("Este lançamento não está vinculado a uma conta fixa");
      }
    }
  };

  const extractRecurringBillId = (notes: string | null): string | null => {
    if (!notes) return null;
    const match = notes.match(/recurring_bill_id:([a-f0-9-]+)/);
    return match ? match[1] : null;
  };

  const handleAdd = () => {
    setSelectedBill(null);
    setDialogOpen(true);
  };

  const handleSearch = (filters: any) => {
    setSearchFilters(filters);
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
        <div>
          <h1 className="text-2xl font-bold">Contas Fixas</h1>
          <p className="text-muted-foreground mt-1">
            As contas fixas são geradas automaticamente pelo sistema e passam a ser visualizadas nas contas a pagar de acordo com a configuração feita pelo usuário.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setSearchOpen(true)}>
            <Search className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Busca avançada</span>
            <span className="sm:hidden">Buscar</span>
          </Button>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Adicionar</span>
            <span className="sm:hidden">+</span>
          </Button>
        </div>
      </div>

      <Card className="p-4 bg-info/10 border-info">
        <p className="text-sm">
          As contas fixas são geradas automaticamente pelo sistema e passam a ser visualizadas nas contas a pagar de acordo com a configuração feita pelo usuário.
        </p>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Entidade</TableHead>
              <TableHead>Plano de contas</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead>Gerar pagamento</TableHead>
              <TableHead>Próximo vencimento</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  Nenhum lançamento de conta fixa encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map((transaction: any) => {
                const recurringData = extractRecurringData(transaction.notes);
                return (
                  <TableRow key={transaction.id}>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>{transaction.entity || "-"}</TableCell>
                    <TableCell>{transaction.account || "-"}</TableCell>
                    <TableCell>{transaction.payment_method || "-"}</TableCell>
                    <TableCell>{recurringData.recurrenceType || "Mensal"}</TableCell>
                    <TableCell>
                      {transaction.due_date ? format(new Date(transaction.due_date), "dd/MM/yyyy", { locale: ptBR }) : "-"}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {parseFloat(transaction.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        transaction.status === "paid" || transaction.status === "confirmed"
                          ? "bg-success/10 text-success"
                          : "bg-warning/10 text-warning"
                      }`}>
                        {transaction.status === "paid" || transaction.status === "confirmed" ? "Pago" : "Ativo"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(transaction)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteTransactionMutation.mutate(transaction.id)}
                        >
                          <Trash2 className="h-4 w-4" />
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

      <EditRecurringChoiceDialog
        open={choiceDialogOpen}
        onOpenChange={setChoiceDialogOpen}
        onChoice={handleEditChoice}
      />

      <RecurringBillDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        bill={selectedBill}
      />

      <TransactionDialog
        open={transactionDialogOpen}
        onOpenChange={setTransactionDialogOpen}
        type={editingTransaction?.type || "expense"}
        transaction={editingTransaction}
        onSave={(data) => {
          updateTransactionMutation.mutate(data);
          setTransactionDialogOpen(false);
        }}
      />

      <RecurringBillSearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onSearch={handleSearch}
      />
    </div>
  );
};

export default ContasFixas;
