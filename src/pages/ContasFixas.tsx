import { useState } from "react";
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

const ContasFixas = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: recurringBills = [], isLoading } = useQuery({
    queryKey: ["recurring-bills"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recurring_bills")
        .select("*")
        .eq("is_active", true)
        .order("description");

      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("recurring_bills")
        .update({ is_active: false })
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

  const getRecurrenceLabel = (type: string) => {
    const labels: Record<string, string> = {
      daily: "Diário",
      weekly: "Semanal",
      monthly: "Mensal",
      yearly: "Anual",
    };
    return labels[type] || type;
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
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={() => setSearchOpen(true)}>
            <Search className="h-4 w-4 mr-2" />
            Busca avançada
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar
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
            {recurringBills.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  Nenhuma conta fixa cadastrada
                </TableCell>
              </TableRow>
            ) : (
              recurringBills.map((bill: any) => (
                <TableRow key={bill.id}>
                  <TableCell>{bill.description}</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>{getRecurrenceLabel(bill.recurrence_type)}</TableCell>
                  <TableCell>
                    {bill.start_date ? format(new Date(bill.start_date), "dd/MM/yyyy", { locale: ptBR }) : "-"}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {parseFloat(bill.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success/10 text-success">
                      Ativo
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(bill.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default ContasFixas;
