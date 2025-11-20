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
import { AdvancedSearchDialog } from "@/components/fluxo-caixa/AdvancedSearchDialog";
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

  // Buscar as contas fixas (recurring bills) cadastradas
  const { data: recurringBills = [], isLoading } = useQuery({
    queryKey: ["recurring-bills"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recurring_bills")
        .select("*")
        .order("next_due_date", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const deleteBillMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("recurring_bills")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-bills"] });
      toast.success("Conta fixa excluída com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao excluir conta fixa");
    },
  });

  const updateBillMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from("recurring_bills")
        .update(data)
        .eq("id", data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-bills"] });
      toast.success("Conta fixa atualizada com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar conta fixa");
    },
  });

  const filteredBills = useMemo(() => {
    if (!recurringBills) return [];
    
    return recurringBills.filter((bill: any) => {
      if (searchFilters.description && !bill.description.toLowerCase().includes(searchFilters.description.toLowerCase())) {
        return false;
      }
      if (searchFilters.type && bill.type !== searchFilters.type) {
        return false;
      }
      if (searchFilters.minAmount && parseFloat(bill.amount) < parseFloat(searchFilters.minAmount)) {
        return false;
      }
      if (searchFilters.maxAmount && parseFloat(bill.amount) > parseFloat(searchFilters.maxAmount)) {
        return false;
      }
      return true;
    });
  }, [recurringBills, searchFilters]);

  const getRecurrenceLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      monthly: "Mensal",
      yearly: "Anual",
      weekly: "Semanal",
      daily: "Diário"
    };
    return labels[type] || type;
  };

  const handleEdit = (bill: any) => {
    setSelectedBill(bill);
    setDialogOpen(true);
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
            {filteredBills.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  Nenhuma conta fixa encontrada
                </TableCell>
              </TableRow>
            ) : (
              filteredBills.map((bill: any) => {
                return (
                  <TableRow key={bill.id}>
                    <TableCell>{bill.description}</TableCell>
                    <TableCell>{bill.entity || "-"}</TableCell>
                    <TableCell>{bill.account || "-"}</TableCell>
                    <TableCell>{bill.payment_method || "-"}</TableCell>
                    <TableCell>{getRecurrenceLabel(bill.recurrence_type)}</TableCell>
                    <TableCell>
                      {bill.next_due_date ? format(new Date(bill.next_due_date), "dd/MM/yyyy", { locale: ptBR }) : "-"}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {parseFloat(bill.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        bill.is_active
                          ? "bg-success/10 text-success"
                          : "bg-warning/10 text-warning"
                      }`}>
                        {bill.is_active ? "Ativo" : "Inativo"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(bill)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteBillMutation.mutate(bill.id)}
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

      {/* EditRecurringChoiceDialog removido, pois a edição agora abre diretamente o RecurringBillDialog */
      /* <EditRecurringChoiceDialog
        open={choiceDialogOpen}
        onOpenChange={setChoiceDialogOpen}
        onChoice={handleEditChoice}
      /> */}

      <RecurringBillDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        bill={selectedBill}
      />

      {/* TransactionDialog removido, pois a edição agora abre diretamente o RecurringBillDialog */
      /* <TransactionDialog
        open={transactionDialogOpen}
        onOpenChange={setTransactionDialogOpen}
        type={editingTransaction?.type || "expense"}
        transaction={editingTransaction}
        onSave={(data) => {
          updateTransactionMutation.mutate(data);
          setTransactionDialogOpen(false);
        }}
      /> */}

      <AdvancedSearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onSearch={(newFilters) => {
          setSearchFilters(newFilters);
          toast.success("Filtros aplicados com sucesso!");
        }}
        onClear={() => {
          setSearchFilters({});
          toast.info("Filtros removidos.");
        }}
      />
    </div>
  );
};

export default ContasFixas;
