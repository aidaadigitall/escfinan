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
import { Plus, Edit, Trash2, Download, Upload } from "lucide-react";
import { useBankAccounts } from "@/hooks/useBankAccounts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { useTransactions } from "@/hooks/useTransactions";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const ContasBancarias = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedAccountForExport, setSelectedAccountForExport] = useState<string | null>(null);
  const { accounts, isLoading, createAccount, deleteAccount } = useBankAccounts();
  const { transactions } = useTransactions();
  const { register, handleSubmit, reset } = useForm();

  const handleExportStatement = async (accountId: string, accountName: string) => {
    const accountTransactions = transactions.filter(
      t => t.bank_account_id === accountId
    );

    if (accountTransactions.length === 0) {
      toast.error("Não há transações para esta conta");
      return;
    }

    // Generate CSV
    const csvContent = [
      ["Data", "Descrição", "Tipo", "Valor", "Status", "Saldo"].join(";"),
      ...accountTransactions
        .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
        .map(t => {
          const amount = t.paid_amount && t.paid_amount > 0 ? t.paid_amount : t.amount;
          const value = t.type === "expense" ? -amount : amount;
          return [
            format(new Date(t.due_date), "dd/MM/yyyy"),
            t.description,
            t.type === "income" ? "Receita" : "Despesa",
            value.toFixed(2).replace(".", ","),
            t.status === "paid" || t.status === "received" || t.status === "confirmed" ? "Confirmado" : "Pendente",
            ""
          ].join(";");
        })
    ].join("\n");

    // Download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `extrato_${accountName.replace(/\s/g, "_")}_${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Extrato exportado com sucesso!");
  };

  const handleImportStatement = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n");
      
      // Skip header
      const dataLines = lines.slice(1).filter(line => line.trim());
      
      let imported = 0;
      let errors = 0;

      for (const line of dataLines) {
        const [date, description, type, value, status] = line.split(";");
        
        if (!date || !description || !value) {
          errors++;
          continue;
        }

        try {
          const [day, month, year] = date.trim().split("/");
          const dueDate = `${year}-${month}-${day}`;
          const amount = Math.abs(parseFloat(value.replace(",", ".")));
          const transactionType = type?.toLowerCase().includes("receita") ? "income" : "expense";
          const transactionStatus = status?.toLowerCase().includes("confirmado") ? "confirmed" : "pending";

          const { data: { user } } = await supabase.auth.getUser();
          if (!user) continue;

          await supabase.from("transactions").insert({
            user_id: user.id,
            description: description.trim(),
            amount: amount,
            type: transactionType,
            status: transactionStatus,
            due_date: dueDate,
            bank_account_id: selectedAccountForExport,
          });

          imported++;
        } catch (error) {
          errors++;
        }
      }

      if (imported > 0) {
        toast.success(`${imported} transação(ões) importada(s) com sucesso!`);
      }
      if (errors > 0) {
        toast.error(`${errors} transação(ões) com erro na importação`);
      }

      setImportDialogOpen(false);
      setSelectedAccountForExport(null);
    };
    
    reader.readAsText(file);
  };

  const onSubmit = (data: any) => {
    createAccount({
      name: data.name,
      initial_balance: parseFloat(data.initial_balance) || 0,
      is_active: true,
    });
    setDialogOpen(false);
    reset();
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
        <h1 className="text-2xl font-bold">Contas Bancárias</h1>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="text-right">Saldo Inicial</TableHead>
              <TableHead className="text-right">Saldo Atual</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  Nenhuma conta bancária cadastrada
                </TableCell>
              </TableRow>
            ) : (
              accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell>{account.name}</TableCell>
                  <TableCell className="text-right">
                    R$ {parseFloat(account.initial_balance.toString()).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right">
                    R$ {parseFloat(account.current_balance.toString()).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleExportStatement(account.id, account.name)}
                        title="Exportar Extrato"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setSelectedAccountForExport(account.id);
                          setImportDialogOpen(true);
                        }}
                        title="Importar Extrato"
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteAccount(account.id)}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Conta Bancária</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name">Nome *</Label>
              <Input id="name" {...register("name", { required: true })} placeholder="Ex: Banco do Brasil" />
            </div>
            <div>
              <Label htmlFor="initial_balance">Saldo Inicial</Label>
              <Input
                id="initial_balance"
                type="number"
                step="0.01"
                {...register("initial_balance")}
                placeholder="0,00"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Cadastrar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importar Extrato Bancário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p className="mb-2">O arquivo deve estar no formato CSV com as seguintes colunas separadas por ponto e vírgula (;):</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Data (dd/MM/yyyy)</li>
                <li>Descrição</li>
                <li>Tipo (Receita ou Despesa)</li>
                <li>Valor (com vírgula decimal)</li>
                <li>Status (Confirmado ou Pendente)</li>
              </ul>
            </div>
            <div>
              <Label htmlFor="file">Selecionar arquivo CSV</Label>
              <Input
                id="file"
                type="file"
                accept=".csv"
                onChange={handleImportStatement}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setImportDialogOpen(false);
                setSelectedAccountForExport(null);
              }}>
                Cancelar
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContasBancarias;
