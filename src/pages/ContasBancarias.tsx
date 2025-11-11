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
import { Plus, Edit, Trash2, Download, Upload, CalendarIcon } from "lucide-react";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { BankStatementImportDialog } from "@/components/BankStatementImportDialog";
import { BankAccountDialog } from "@/components/BankAccountDialog";
import type { BankAccount } from "@/hooks/useBankAccounts";

const ContasBancarias = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [selectedAccountForExport, setSelectedAccountForExport] = useState<string | null>(null);
  const [selectedAccountForImport, setSelectedAccountForImport] = useState<string | null>(null);
  const [selectedAccountName, setSelectedAccountName] = useState<string>("");
  const [selectedAccountForEdit, setSelectedAccountForEdit] = useState<BankAccount | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const { accounts, isLoading, createAccount, updateAccount, deleteAccount } = useBankAccounts();
  const { transactions } = useTransactions();
  const { register, handleSubmit, reset } = useForm();

  const openExportDialog = (accountId: string, accountName: string) => {
    setSelectedAccountForExport(accountId);
    setSelectedAccountName(accountName);
    setStartDate(undefined);
    setEndDate(undefined);
    setExportDialogOpen(true);
  };

  const handleExportStatement = async () => {
    if (!selectedAccountForExport) return;

    let accountTransactions = transactions.filter(
      t => t.bank_account_id === selectedAccountForExport
    );

    // Apply date filters
    if (startDate) {
      accountTransactions = accountTransactions.filter(t => 
        new Date(t.due_date) >= startDate
      );
    }
    if (endDate) {
      accountTransactions = accountTransactions.filter(t => 
        new Date(t.due_date) <= endDate
      );
    }

    if (accountTransactions.length === 0) {
      toast.error("Não há transações para esta conta no período selecionado");
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
    const dateRange = startDate && endDate 
      ? `_${format(startDate, "yyyy-MM-dd")}_a_${format(endDate, "yyyy-MM-dd")}`
      : "";
    link.setAttribute("href", url);
    link.setAttribute("download", `extrato_${selectedAccountName.replace(/\s/g, "_")}${dateRange}_${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Extrato exportado com sucesso!");
    setExportDialogOpen(false);
    setSelectedAccountForExport(null);
    setSelectedAccountName("");
  };

  const openImportDialog = (accountId: string, accountName: string) => {
    setSelectedAccountForImport(accountId);
    setSelectedAccountName(accountName);
    setImportDialogOpen(true);
  };

  const openEditDialog = (account: BankAccount) => {
    setSelectedAccountForEdit(account);
    setDialogOpen(true);
  };

  const handleSaveAccount = (data: any) => {
    if (selectedAccountForEdit) {
      // Editing existing account
      updateAccount({
        id: selectedAccountForEdit.id,
        name: data.name,
        initial_balance: parseFloat(data.initial_balance) || 0,
        current_balance: parseFloat(data.current_balance),
      });
    } else {
      // Creating new account
      createAccount({
        name: data.name,
        initial_balance: parseFloat(data.initial_balance) || 0,
        is_active: true,
      });
    }
    setDialogOpen(false);
    setSelectedAccountForEdit(null);
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
        <Button size="sm" onClick={() => {
          setSelectedAccountForEdit(null);
          setDialogOpen(true);
        }}>
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
                        onClick={() => openExportDialog(account.id, account.name)}
                        title="Exportar Extrato"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => openImportDialog(account.id, account.name)}
                        title="Importar Extrato"
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => openEditDialog(account)}
                        title="Editar Conta"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteAccount(account.id)}
                        title="Excluir Conta"
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

      <BankAccountDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setSelectedAccountForEdit(null);
        }}
        account={selectedAccountForEdit}
        onSave={handleSaveAccount}
      />

      <BankStatementImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        bankAccountId={selectedAccountForImport || ""}
        bankAccountName={selectedAccountName}
      />

      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exportar Extrato - {selectedAccountName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Selecione o período para exportar as transações. Deixe em branco para exportar todas.
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data Inicial</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "dd/MM/yyyy") : "Selecionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Data Final</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "dd/MM/yyyy") : "Selecionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      disabled={(date) => startDate ? date < startDate : false}
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {startDate && endDate && (
              <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                Exportando transações de {format(startDate, "dd/MM/yyyy")} até {format(endDate, "dd/MM/yyyy")}
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setExportDialogOpen(false);
                setSelectedAccountForExport(null);
                setSelectedAccountName("");
              }}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleExportStatement}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContasBancarias;
