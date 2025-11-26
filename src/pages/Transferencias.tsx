import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, ArrowRightLeft } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Transferencias() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    from_account_id: "",
    to_account_id: "",
    amount: "",
    transfer_date: new Date().toISOString().split("T")[0],
    description: "",
  });
  const queryClient = useQueryClient();

  const { data: bankAccounts = [] } = useQuery({
    queryKey: ["bank-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bank_accounts")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: transfers = [], isLoading } = useQuery({
    queryKey: ["transfers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("type", "transfer")
        .order("due_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const transferMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const amount = parseFloat(data.amount);

      // Create transfer-out transaction
      const { error: outError } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          description: `Transferência: ${data.description || "Saída"}`,
          amount: amount,
          type: "transfer",
          status: "confirmed",
          due_date: data.transfer_date,
          paid_date: data.transfer_date,
          paid_amount: amount,
          bank_account_id: data.from_account_id,
          notes: `transfer_out:${data.to_account_id}`,
        });

      if (outError) throw outError;

      // Create transfer-in transaction
      const { error: inError } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          description: `Transferência: ${data.description || "Entrada"}`,
          amount: amount,
          type: "transfer",
          status: "confirmed",
          due_date: data.transfer_date,
          paid_date: data.transfer_date,
          paid_amount: amount,
          bank_account_id: data.to_account_id,
          notes: `transfer_in:${data.from_account_id}`,
        });

      if (inError) throw inError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transfers"] });
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Transferência realizada com sucesso!");
      setDialogOpen(false);
      setFormData({
        from_account_id: "",
        to_account_id: "",
        amount: "",
        transfer_date: new Date().toISOString().split("T")[0],
        description: "",
      });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao realizar transferência");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.from_account_id === formData.to_account_id) {
      toast.error("As contas de origem e destino devem ser diferentes");
      return;
    }
    transferMutation.mutate(formData);
  };

  const getAccountName = (accountId: string) => {
    const account = bankAccounts.find((a: any) => a.id === accountId);
    return account?.name || "Conta desconhecida";
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
          <h1 className="text-2xl font-bold">Transferências entre Contas</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie transferências entre suas contas bancárias
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Transferência
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>De</TableHead>
              <TableHead>Para</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transfers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Nenhuma transferência realizada
                </TableCell>
              </TableRow>
            ) : (
              transfers
                .filter((t: any) => t.notes?.includes("transfer_out"))
                .map((transfer: any) => {
                  const toAccountId = transfer.notes?.split(":")[1];
                  return (
                    <TableRow key={transfer.id}>
                      <TableCell>
                        {format(new Date(transfer.due_date), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>{transfer.description.replace("Transferência: ", "")}</TableCell>
                      <TableCell>{getAccountName(transfer.bank_account_id)}</TableCell>
                      <TableCell>{getAccountName(toAccountId)}</TableCell>
                      <TableCell className="text-right font-semibold">
                        R$ {parseFloat(transfer.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  );
                })
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5" />
              Nova Transferência
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="from_account">Conta de Origem *</Label>
              <Select
                value={formData.from_account_id}
                onValueChange={(value) => setFormData({ ...formData, from_account_id: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((account: any) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} - R$ {parseFloat(account.current_balance).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="to_account">Conta de Destino *</Label>
              <Select
                value={formData.to_account_id}
                onValueChange={(value) => setFormData({ ...formData, to_account_id: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((account: any) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} - R$ {parseFloat(account.current_balance).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="amount">Valor *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="transfer_date">Data da Transferência *</Label>
              <Input
                id="transfer_date"
                type="date"
                value={formData.transfer_date}
                onChange={(e) => setFormData({ ...formData, transfer_date: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ex: Transferência para poupança"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={transferMutation.isPending}>
                {transferMutation.isPending ? "Transferindo..." : "Transferir"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
