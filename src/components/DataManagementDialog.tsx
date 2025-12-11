import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ConfirmDialog } from "./ConfirmDialog";
import { Download, Upload, Trash2, Database, Loader2 } from "lucide-react";

interface DataManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DataManagementDialog({ open, onOpenChange }: DataManagementDialogProps) {
  const [loading, setLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [finalDeleteConfirmOpen, setFinalDeleteConfirmOpen] = useState(false);
  const [importData, setImportData] = useState("");

  const handleBackup = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Fetch all user data from all tables
      const backupData: Record<string, any[]> = {};

      // Transactions
      const { data: transactions } = await supabase.from("transactions").select("*").eq("user_id", user.id);
      backupData.transactions = transactions || [];

      // Recurring bills
      const { data: recurringBills } = await supabase.from("recurring_bills").select("*").eq("user_id", user.id);
      backupData.recurring_bills = recurringBills || [];

      // Bank accounts
      const { data: bankAccounts } = await supabase.from("bank_accounts").select("*").eq("user_id", user.id);
      backupData.bank_accounts = bankAccounts || [];

      // Categories
      const { data: categories } = await supabase.from("categories").select("*").eq("user_id", user.id);
      backupData.categories = categories || [];

      // Clients
      const { data: clients } = await supabase.from("clients").select("*").eq("user_id", user.id);
      backupData.clients = clients || [];

      // Suppliers
      const { data: suppliers } = await supabase.from("suppliers").select("*").eq("user_id", user.id);
      backupData.suppliers = suppliers || [];

      // Cost centers
      const { data: costCenters } = await supabase.from("cost_centers").select("*").eq("user_id", user.id);
      backupData.cost_centers = costCenters || [];

      // Payment methods
      const { data: paymentMethods } = await supabase.from("payment_methods").select("*").eq("user_id", user.id);
      backupData.payment_methods = paymentMethods || [];

      // Chart of accounts
      const { data: chartOfAccounts } = await supabase.from("chart_of_accounts").select("*").eq("user_id", user.id);
      backupData.chart_of_accounts = chartOfAccounts || [];

      // Credit cards
      const { data: creditCards } = await supabase.from("credit_cards").select("*").eq("user_id", user.id);
      backupData.credit_cards = creditCards || [];

      // Credit card transactions
      const { data: creditCardTransactions } = await supabase.from("credit_card_transactions").select("*").eq("user_id", user.id);
      backupData.credit_card_transactions = creditCardTransactions || [];

      // Profiles
      const { data: profiles } = await supabase.from("profiles").select("*").eq("user_id", user.id);
      backupData.profiles = profiles || [];

      // System settings
      const { data: systemSettings } = await supabase.from("system_settings").select("*").eq("user_id", user.id);
      backupData.system_settings = systemSettings || [];

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Backup realizado com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao realizar backup");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAllData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Delete data in reverse dependency order
      // First delete items that reference other tables
      const { error: e1 } = await supabase.from("task_comments").delete().eq("user_id", user.id);
      if (e1) console.error("task_comments delete error:", e1);
      
      const { error: e2 } = await supabase.from("tasks").delete().eq("user_id", user.id);
      if (e2) console.error("tasks delete error:", e2);
      
      const { error: e3 } = await supabase.from("task_labels").delete().eq("user_id", user.id);
      if (e3) console.error("task_labels delete error:", e3);
      
      const { error: e4 } = await supabase.from("quote_items").delete().eq("user_id", user.id);
      if (e4) console.error("quote_items delete error:", e4);
      
      const { error: e5 } = await supabase.from("quotes").delete().eq("user_id", user.id);
      if (e5) console.error("quotes delete error:", e5);
      
      const { error: e6 } = await supabase.from("sale_items").delete().eq("user_id", user.id);
      if (e6) console.error("sale_items delete error:", e6);
      
      const { error: e7 } = await supabase.from("sales").delete().eq("user_id", user.id);
      if (e7) console.error("sales delete error:", e7);
      
      const { error: e8 } = await supabase.from("service_order_items").delete().eq("user_id", user.id);
      if (e8) console.error("service_order_items delete error:", e8);
      
      const { error: e9 } = await supabase.from("service_orders").delete().eq("user_id", user.id);
      if (e9) console.error("service_orders delete error:", e9);
      
      const { error: e10 } = await supabase.from("stock_movements").delete().eq("user_id", user.id);
      if (e10) console.error("stock_movements delete error:", e10);
      
      const { error: e11 } = await supabase.from("products").delete().eq("user_id", user.id);
      if (e11) console.error("products delete error:", e11);
      
      const { error: e12 } = await supabase.from("services").delete().eq("user_id", user.id);
      if (e12) console.error("services delete error:", e12);
      
      const { error: e13 } = await supabase.from("time_entries").delete().eq("user_id", user.id);
      if (e13) console.error("time_entries delete error:", e13);
      
      const { error: e14 } = await supabase.from("transaction_status_history").delete().eq("user_id", user.id);
      if (e14) console.error("transaction_status_history delete error:", e14);
      
      const { error: e15 } = await supabase.from("notifications").delete().eq("user_id", user.id);
      if (e15) console.error("notifications delete error:", e15);
      
      const { error: e16 } = await supabase.from("credit_card_transactions").delete().eq("user_id", user.id);
      if (e16) console.error("credit_card_transactions delete error:", e16);
      
      const { error: e17 } = await supabase.from("transactions").delete().eq("user_id", user.id);
      if (e17) console.error("transactions delete error:", e17);
      
      const { error: e18 } = await supabase.from("recurring_bills").delete().eq("user_id", user.id);
      if (e18) console.error("recurring_bills delete error:", e18);
      
      const { error: e19 } = await supabase.from("credit_cards").delete().eq("user_id", user.id);
      if (e19) console.error("credit_cards delete error:", e19);
      
      const { error: e20 } = await supabase.from("chart_of_accounts").delete().eq("user_id", user.id);
      if (e20) console.error("chart_of_accounts delete error:", e20);
      
      const { error: e21 } = await supabase.from("cost_centers").delete().eq("user_id", user.id);
      if (e21) console.error("cost_centers delete error:", e21);
      
      const { error: e22 } = await supabase.from("payment_methods").delete().eq("user_id", user.id);
      if (e22) console.error("payment_methods delete error:", e22);
      
      const { error: e23 } = await supabase.from("categories").delete().eq("user_id", user.id);
      if (e23) console.error("categories delete error:", e23);
      
      const { error: e24 } = await supabase.from("clients").delete().eq("user_id", user.id);
      if (e24) console.error("clients delete error:", e24);
      
      const { error: e25 } = await supabase.from("suppliers").delete().eq("user_id", user.id);
      if (e25) console.error("suppliers delete error:", e25);
      
      const { error: e26 } = await supabase.from("employees").delete().eq("user_id", user.id);
      if (e26) console.error("employees delete error:", e26);
      
      const { error: e27 } = await supabase.from("bank_accounts").delete().eq("user_id", user.id);
      if (e27) console.error("bank_accounts delete error:", e27);

      toast.success("Todos os dados foram excluídos com sucesso!");
      setFinalDeleteConfirmOpen(false);
      onOpenChange(false);
      
      // Reload to refresh the app state
      setTimeout(() => window.location.reload(), 1000);
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error(error.message || "Erro ao excluir dados");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!importData.trim()) {
      toast.error("Cole os dados JSON para importar");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const parsedData = JSON.parse(importData);
      let importedCount = 0;

      // Helper function to import records
      const importRecords = async (tableName: string, data: any[] | undefined) => {
        if (!data || !Array.isArray(data) || data.length === 0) return 0;
        const records = data.map(({ id, ...rest }) => ({ ...rest, user_id: user.id }));
        return records.length;
      };

      // Import in correct order due to foreign keys
      if (parsedData.bank_accounts?.length) {
        const records = parsedData.bank_accounts.map(({ id, ...rest }: any) => ({ ...rest, user_id: user.id }));
        await supabase.from("bank_accounts").insert(records);
        importedCount += records.length;
      }
      if (parsedData.categories?.length) {
        const records = parsedData.categories.map(({ id, ...rest }: any) => ({ ...rest, user_id: user.id }));
        await supabase.from("categories").insert(records);
        importedCount += records.length;
      }
      if (parsedData.clients?.length) {
        const records = parsedData.clients.map(({ id, ...rest }: any) => ({ ...rest, user_id: user.id }));
        await supabase.from("clients").insert(records);
        importedCount += records.length;
      }
      if (parsedData.suppliers?.length) {
        const records = parsedData.suppliers.map(({ id, ...rest }: any) => ({ ...rest, user_id: user.id }));
        await supabase.from("suppliers").insert(records);
        importedCount += records.length;
      }
      if (parsedData.cost_centers?.length) {
        const records = parsedData.cost_centers.map(({ id, ...rest }: any) => ({ ...rest, user_id: user.id }));
        await supabase.from("cost_centers").insert(records);
        importedCount += records.length;
      }
      if (parsedData.payment_methods?.length) {
        const records = parsedData.payment_methods.map(({ id, ...rest }: any) => ({ ...rest, user_id: user.id }));
        await supabase.from("payment_methods").insert(records);
        importedCount += records.length;
      }
      if (parsedData.chart_of_accounts?.length) {
        const records = parsedData.chart_of_accounts.map(({ id, ...rest }: any) => ({ ...rest, user_id: user.id }));
        await supabase.from("chart_of_accounts").insert(records);
        importedCount += records.length;
      }
      if (parsedData.credit_cards?.length) {
        const records = parsedData.credit_cards.map(({ id, ...rest }: any) => ({ ...rest, user_id: user.id }));
        await supabase.from("credit_cards").insert(records);
        importedCount += records.length;
      }
      if (parsedData.recurring_bills?.length) {
        const records = parsedData.recurring_bills.map(({ id, ...rest }: any) => ({ ...rest, user_id: user.id }));
        await supabase.from("recurring_bills").insert(records);
        importedCount += records.length;
      }
      if (parsedData.transactions?.length) {
        const records = parsedData.transactions.map(({ id, ...rest }: any) => ({ ...rest, user_id: user.id }));
        await supabase.from("transactions").insert(records);
        importedCount += records.length;
      }
      if (parsedData.credit_card_transactions?.length) {
        const records = parsedData.credit_card_transactions.map(({ id, ...rest }: any) => ({ ...rest, user_id: user.id }));
        await supabase.from("credit_card_transactions").insert(records);
        importedCount += records.length;
      }
      if (parsedData.system_settings?.length) {
        const records = parsedData.system_settings.map(({ id, ...rest }: any) => ({ ...rest, user_id: user.id }));
        await supabase.from("system_settings").insert(records);
        importedCount += records.length;
      }

      toast.success(`${importedCount} registros importados com sucesso!`);
      setImportData("");
      onOpenChange(false);
      
      // Reload to refresh the app state
      setTimeout(() => window.location.reload(), 1000);
    } catch (error: any) {
      if (error instanceof SyntaxError) {
        toast.error("Formato JSON inválido");
      } else {
        toast.error(error.message || "Erro ao importar dados");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportData(content);
    };
    reader.readAsText(file);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <Database className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle>Gerenciamento de Dados</DialogTitle>
                <DialogDescription>
                  Backup, restauração e gerenciamento dos seus dados
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="backup" className="mt-4">
            <TabsList className="grid w-full grid-cols-3 rounded-xl">
              <TabsTrigger value="backup" className="rounded-lg">Backup</TabsTrigger>
              <TabsTrigger value="import" className="rounded-lg">Importar</TabsTrigger>
              <TabsTrigger value="delete" className="rounded-lg">Excluir</TabsTrigger>
            </TabsList>

            <TabsContent value="backup" className="space-y-4 mt-4">
              <div className="p-4 bg-muted/50 rounded-xl">
                <h4 className="font-medium mb-2">Fazer Backup</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Baixe todos os seus dados em um arquivo JSON. Você pode usar este arquivo para restaurar seus dados posteriormente.
                </p>
                <Button onClick={handleBackup} disabled={loading} className="rounded-xl">
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                  Baixar Backup
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="import" className="space-y-4 mt-4">
              <div className="p-4 bg-muted/50 rounded-xl">
                <h4 className="font-medium mb-2">Importar Dados</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Importe dados de outro sistema ou restaure um backup anterior. Aceita formato JSON.
                </p>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="import-file">Arquivo JSON</Label>
                    <Input
                      id="import-file"
                      type="file"
                      accept=".json"
                      onChange={handleFileImport}
                      className="rounded-xl mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="import-data">Ou cole os dados JSON</Label>
                    <Textarea
                      id="import-data"
                      value={importData}
                      onChange={(e) => setImportData(e.target.value)}
                      placeholder='{"transactions": [...], "clients": [...]}'
                      className="rounded-xl mt-1 h-32 font-mono text-xs"
                    />
                  </div>
                  <Button onClick={handleImport} disabled={loading || !importData.trim()} className="rounded-xl">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                    Importar Dados
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="delete" className="space-y-4 mt-4">
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
                <h4 className="font-medium mb-2 text-destructive">Excluir Todos os Dados</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  <strong className="text-destructive">ATENÇÃO:</strong> Esta ação é irreversível! Todos os seus dados serão permanentemente excluídos, incluindo transações, clientes, fornecedores, contas bancárias e demais registros.
                </p>
                <Button 
                  variant="destructive" 
                  onClick={() => setDeleteConfirmOpen(true)} 
                  disabled={loading}
                  className="rounded-xl"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir Todos os Dados
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Tem certeza?"
        description="Você está prestes a excluir TODOS os seus dados. Esta ação não pode ser desfeita. Deseja continuar?"
        confirmText="Sim, continuar"
        cancelText="Cancelar"
        onConfirm={() => {
          setDeleteConfirmOpen(false);
          setFinalDeleteConfirmOpen(true);
        }}
        variant="destructive"
      />

      <ConfirmDialog
        open={finalDeleteConfirmOpen}
        onOpenChange={setFinalDeleteConfirmOpen}
        title="Última confirmação"
        description="Esta é sua última chance de cancelar. Após confirmar, todos os dados serão excluídos permanentemente e NÃO PODERÃO ser recuperados. Deseja realmente excluir?"
        confirmText="Excluir Permanentemente"
        cancelText="Cancelar"
        onConfirm={handleDeleteAllData}
        variant="destructive"
      />
    </>
  );
}
