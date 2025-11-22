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
import { Plus, Search, Edit, Trash2, CheckCircle, DollarSign } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { RecurringBillDialog } from "@/components/RecurringBillDialog";
import { AdvancedSearchDialog } from "@/components/fluxo-caixa/AdvancedSearchDialog";
import { ChangeStatusDialog } from "@/components/ChangeStatusDialog";
import { PartialPaymentDialog } from "@/components/PartialPaymentDialog";

const ReceitasFixas = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [searchFilters, setSearchFilters] = useState<any>({});
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [partialPaymentDialogOpen, setPartialPaymentDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: recurringBills = [], isLoading } = useQuery({
    queryKey: ["recurring-bills-income"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recurring_bills")
        .select(`
          *,
          category:category_id(name),
          bank_account:bank_account_id(name),
          cost_center:cost_center_id(name),
          payment_method:payment_method_id(name)
        `)
        .eq("type", "income")
        .order("start_date", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["transactions-from-recurring-income"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("type", "income")
        .like("notes", "%recurring_bill_id:%");

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
      queryClient.invalidateQueries({ queryKey: ["recurring-bills-income"] });
      toast.success("Receita fixa excluída com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao excluir receita fixa");
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
      queryClient.invalidateQueries({ queryKey: ["transactions-from-recurring-income"] });
      toast.success("Transação atualizada com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar transação");
    },
  });

  const calculateNextDueDate = (bill: any) => {
    const today = new Date();
    const startDate = new Date(bill.start_date);
    
    if (today < startDate) return startDate;
    if (bill.end_date && today > new Date(bill.end_date)) return null;
    
    let nextDate: Date;
    
    switch (bill.recurrence_type) {
      case 'monthly':
        const day = bill.recurrence_day || 1;
        const lastDayThisMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        const actualDayThisMonth = Math.min(day, lastDayThisMonth);
        
        nextDate = new Date(today.getFullYear(), today.getMonth(), actualDayThisMonth);
        
        if (nextDate <= today) {
          const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
          const lastDayNextMonth = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate();
          const actualDayNextMonth = Math.min(day, lastDayNextMonth);
          nextDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), actualDayNextMonth);
        }
        break;
      case 'yearly':
        nextDate = new Date(today.getFullYear(), startDate.getMonth(), startDate.getDate());
        if (nextDate <= today) {
          nextDate = new Date(today.getFullYear() + 1, startDate.getMonth(), startDate.getDate());
        }
        break;
      case 'weekly':
        nextDate = new Date(startDate);
        while (nextDate <= today) {
          nextDate.setDate(nextDate.getDate() + 7);
        }
        break;
      case 'daily':
        nextDate = new Date(today);
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      default:
        nextDate = startDate;
    }
    
    return nextDate;
  };

  const getTransactionForBill = (billId: string, nextDueDate: Date | null) => {
    if (!nextDueDate) return null;
    
    return transactions.find((t: any) => {
      const notes = t.notes || "";
      const hasRecurringId = notes.includes(`recurring_bill_id:${billId}`);
      const dueDate = new Date(t.due_date);
      const isSameMonth = dueDate.getMonth() === nextDueDate.getMonth() && 
                          dueDate.getFullYear() === nextDueDate.getFullYear();
      return hasRecurringId && isSameMonth;
    });
  };

  const filteredBills = useMemo(() => {
    if (!recurringBills) return [];
    
    return recurringBills.filter((bill: any) => {
      if (searchFilters.description && !bill.description.toLowerCase().includes(searchFilters.description.toLowerCase())) {
        return false;
      }
      if (searchFilters.minAmount && parseFloat(bill.amount) < parseFloat(searchFilters.minAmount)) {
        return false;
      }
      if (searchFilters.maxAmount && parseFloat(bill.amount) > parseFloat(searchFilters.maxAmount)) {
        return false;
      }
      return true;
    }).map((bill: any) => {
      const nextDueDate = calculateNextDueDate(bill);
      return {
        ...bill,
        nextDueDate,
        transaction: getTransactionForBill(bill.id, nextDueDate),
      };
    }).sort((a: any, b: any) => {
      if (!a.nextDueDate) return 1;
      if (!b.nextDueDate) return -1;
      return a.nextDueDate.getTime() - b.nextDueDate.getTime();
    });
  }, [recurringBills, transactions, searchFilters]);

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

  const handleAdd = () => {
    setSelectedBill(null);
    setDialogOpen(true);
  };

  const handleConfirmPayment = (transaction: any) => {
    setSelectedTransaction(transaction);
    setStatusDialogOpen(true);
  };

  const handlePartialPayment = (transaction: any) => {
    setSelectedTransaction(transaction);
    setPartialPaymentDialogOpen(true);
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
          <h1 className="text-2xl font-bold">Receitas Fixas</h1>
          <p className="text-muted-foreground mt-1">
            As receitas fixas são geradas automaticamente pelo sistema e passam a ser visualizadas nas contas a receber de acordo com a configuração feita pelo usuário.
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
          As receitas fixas são geradas automaticamente pelo sistema e passam a ser visualizadas nas contas a receber de acordo com a configuração feita pelo usuário.
        </p>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Plano de contas</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead>Gerar recebimento</TableHead>
              <TableHead>Próximo vencimento</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBills.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  Nenhuma receita fixa encontrada
                </TableCell>
              </TableRow>
            ) : (
              filteredBills.map((bill: any) => {
                return (
                  <TableRow key={bill.id}>
                    <TableCell>{bill.description}</TableCell>
                    <TableCell>{bill.category?.name || "-"}</TableCell>
                    <TableCell>{bill.payment_method?.name || "-"}</TableCell>
                    <TableCell>{getRecurrenceLabel(bill.recurrence_type)}</TableCell>
                    <TableCell>
                      {bill.nextDueDate ? format(bill.nextDueDate, "dd/MM/yyyy", { locale: ptBR }) : "-"}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      R$ {parseFloat(bill.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      {bill.transaction ? (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          bill.transaction.status === 'received' || bill.transaction.status === 'confirmed'
                            ? "bg-success/10 text-success"
                            : bill.transaction.status === 'overdue'
                            ? "bg-destructive/10 text-destructive"
                            : "bg-warning/10 text-warning"
                        }`}>
                          {bill.transaction.status === 'received' ? 'Recebido' : 
                           bill.transaction.status === 'confirmed' ? 'Confirmado' :
                           bill.transaction.status === 'overdue' ? 'Vencido' : 'Pendente'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted/10 text-muted-foreground">
                          Aguardando geração
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {bill.transaction && bill.transaction.status === 'pending' && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleConfirmPayment(bill.transaction)}
                              title="Confirmar Recebimento"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handlePartialPayment(bill.transaction)}
                              title="Recebimento Parcial"
                            >
                              <DollarSign className="h-4 w-4" />
                            </Button>
                          </>
                        )}
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

      <RecurringBillDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        bill={selectedBill}
      />

      {selectedTransaction && (
        <>
          <ChangeStatusDialog
            open={statusDialogOpen}
            onOpenChange={setStatusDialogOpen}
            transaction={selectedTransaction}
            onStatusChange={(id, data) => {
              updateTransactionMutation.mutate({ id, ...data });
              setStatusDialogOpen(false);
            }}
          />

          <PartialPaymentDialog
            open={partialPaymentDialogOpen}
            onOpenChange={setPartialPaymentDialogOpen}
            transaction={selectedTransaction}
            onSave={(data) => {
              updateTransactionMutation.mutate(data);
              setPartialPaymentDialogOpen(false);
            }}
          />
        </>
      )}

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

export default ReceitasFixas;