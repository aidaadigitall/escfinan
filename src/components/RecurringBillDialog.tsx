import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CalendarDays, DollarSign, Tag, Building2, Users, Truck, FileText, CreditCard, FolderOpen } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import { useCostCenters } from "@/hooks/useCostCenters";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { useBankAccounts } from "@/hooks/useBankAccounts";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useClients } from "@/hooks/useClients";
import { useChartOfAccounts } from "@/hooks/useChartOfAccounts";
import { SearchableSelect } from "@/components/SearchableSelect";
import { QuickCategoryDialog } from "@/components/QuickCategoryDialog";
import { QuickCostCenterDialog } from "@/components/QuickCostCenterDialog";
import { QuickPaymentMethodDialog } from "@/components/QuickPaymentMethodDialog";
import { QuickBankAccountDialog } from "@/components/QuickBankAccountDialog";
import { QuickSupplierDialog } from "@/components/QuickSupplierDialog";
import { QuickClientDialog } from "@/components/QuickClientDialog";
import { QuickChartOfAccountDialog } from "@/components/QuickChartOfAccountDialog";

interface RecurringBillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bill?: any;
}

export const RecurringBillDialog = ({ open, onOpenChange, bill }: RecurringBillDialogProps) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    description: "",
    type: "expense",
    recurrence_type: "monthly",
    amount: "",
    start_date: "",
    end_date: "",
    recurrence_day: "",
    category_id: "",
    bank_account_id: "",
    cost_center_id: "",
    payment_method_id: "",
    supplier_id: "",
    client_id: "",
    chart_account_id: "",
    notes: "",
  });

  // Quick dialogs state
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [showNewCostCenter, setShowNewCostCenter] = useState(false);
  const [showNewPaymentMethod, setShowNewPaymentMethod] = useState(false);
  const [showNewBankAccount, setShowNewBankAccount] = useState(false);
  const [showNewSupplier, setShowNewSupplier] = useState(false);
  const [showNewClient, setShowNewClient] = useState(false);
  const [showNewChartAccount, setShowNewChartAccount] = useState(false);

  // Hooks for data
  const { categories } = useCategories(formData.type as "income" | "expense");
  const { costCenters } = useCostCenters();
  const { paymentMethods } = usePaymentMethods();
  const { accounts: bankAccounts } = useBankAccounts();
  const { suppliers } = useSuppliers();
  const { clients } = useClients();
  const { accounts: chartAccounts } = useChartOfAccounts();

  // Convert to options format
  const categoryOptions = useMemo(() => 
    categories.map(c => ({ value: c.id, label: c.name })), [categories]);
  const costCenterOptions = useMemo(() => 
    costCenters.map(c => ({ value: c.id, label: c.name })), [costCenters]);
  const paymentMethodOptions = useMemo(() => 
    paymentMethods.map(p => ({ value: p.id, label: p.name })), [paymentMethods]);
  const bankAccountOptions = useMemo(() => 
    bankAccounts.map(a => ({ value: a.id, label: a.name })), [bankAccounts]);
  const supplierOptions = useMemo(() => 
    suppliers.map(s => ({ value: s.id, label: s.name })), [suppliers]);
  const clientOptions = useMemo(() => 
    clients.map(c => ({ value: c.id, label: c.name })), [clients]);
  const chartAccountOptions = useMemo(() => 
    chartAccounts.map(a => ({ value: a.id, label: `${a.code} - ${a.name}` })), [chartAccounts]);

  useEffect(() => {
    if (bill) {
      setFormData({
        description: bill.description || "",
        type: bill.type || "expense",
        recurrence_type: bill.recurrence_type || "monthly",
        amount: bill.amount?.toString() || "",
        start_date: bill.start_date || "",
        end_date: bill.end_date || "",
        recurrence_day: bill.recurrence_day?.toString() || "",
        category_id: bill.category_id || "",
        bank_account_id: bill.bank_account_id || "",
        cost_center_id: bill.cost_center_id || "",
        payment_method_id: bill.payment_method_id || "",
        supplier_id: bill.supplier_id || "",
        client_id: bill.client_id || "",
        chart_account_id: bill.chart_account_id || "",
        notes: bill.notes || "",
      });
    } else {
      setFormData({
        description: "",
        type: "expense",
        recurrence_type: "monthly",
        amount: "",
        start_date: "",
        end_date: "",
        recurrence_day: "",
        category_id: "",
        bank_account_id: "",
        cost_center_id: "",
        payment_method_id: "",
        supplier_id: "",
        client_id: "",
        chart_account_id: "",
        notes: "",
      });
    }
  }, [bill, open]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const payload = {
        description: data.description,
        type: data.type,
        recurrence_type: data.recurrence_type,
        amount: parseFloat(data.amount),
        start_date: data.start_date,
        recurrence_day: data.recurrence_day ? parseInt(data.recurrence_day) : null,
        category_id: data.category_id || null,
        bank_account_id: data.bank_account_id || null,
        cost_center_id: data.cost_center_id || null,
        payment_method_id: data.payment_method_id || null,
        end_date: data.end_date || null,
        notes: data.notes || null,
        user_id: user.id,
      };

      if (bill) {
        const { error } = await supabase
          .from("recurring_bills")
          .update(payload)
          .eq("id", bill.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("recurring_bills")
          .insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-bills"] });
      toast.success(bill ? "Conta fixa atualizada!" : "Conta fixa criada!");
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao salvar conta fixa");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border-border/50 shadow-xl">
          <DialogHeader className="pb-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <CalendarDays className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">{bill ? "Editar" : "Adicionar"} Conta Fixa</DialogTitle>
                <DialogDescription>
                  Configure os detalhes da conta fixa recorrente
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            {/* Seção: Informações Básicas */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Informações Básicas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-xl">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="description">Descrição *</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Ex: Aluguel, Internet, Salário..."
                    className="rounded-xl"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tipo *</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value, category_id: "" })}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="income">Receita</SelectItem>
                      <SelectItem value="expense">Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Recorrência *</Label>
                  <Select value={formData.recurrence_type} onValueChange={(value) => setFormData({ ...formData, recurrence_type: value })}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="daily">Diário</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="2months">Bimestral</SelectItem>
                      <SelectItem value="3months">Trimestral</SelectItem>
                      <SelectItem value="4months">Quadrimestral</SelectItem>
                      <SelectItem value="6months">Semestral</SelectItem>
                      <SelectItem value="yearly">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Seção: Valores e Datas */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Valores e Datas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-xl">
                <div className="space-y-2">
                  <Label htmlFor="amount">Valor *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0,00"
                    className="rounded-xl"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recurrence_day">Dia da Recorrência</Label>
                  <Input
                    id="recurrence_day"
                    type="number"
                    min="1"
                    max="31"
                    value={formData.recurrence_day}
                    onChange={(e) => setFormData({ ...formData, recurrence_day: e.target.value })}
                    placeholder="1-31"
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="start_date">Data de Início *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="rounded-xl"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_date">Data de Término</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Seção: Classificação */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Classificação
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-xl">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <SearchableSelect
                    options={categoryOptions}
                    value={formData.category_id}
                    onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                    placeholder="Buscar categoria..."
                    searchPlaceholder="Digite para buscar..."
                    emptyMessage="Nenhuma categoria encontrada"
                    onAddNew={() => setShowNewCategory(true)}
                    addNewLabel="Criar nova categoria"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Centro de Custo</Label>
                  <SearchableSelect
                    options={costCenterOptions}
                    value={formData.cost_center_id}
                    onValueChange={(value) => setFormData({ ...formData, cost_center_id: value })}
                    placeholder="Buscar centro de custo..."
                    searchPlaceholder="Digite para buscar..."
                    emptyMessage="Nenhum centro de custo encontrado"
                    onAddNew={() => setShowNewCostCenter(true)}
                    addNewLabel="Criar novo centro de custo"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Plano de Contas</Label>
                  <SearchableSelect
                    options={chartAccountOptions}
                    value={formData.chart_account_id}
                    onValueChange={(value) => setFormData({ ...formData, chart_account_id: value })}
                    placeholder="Buscar plano de contas..."
                    searchPlaceholder="Digite para buscar..."
                    emptyMessage="Nenhuma conta encontrada"
                    onAddNew={() => setShowNewChartAccount(true)}
                    addNewLabel="Criar nova conta"
                  />
                </div>

                {formData.type === "expense" ? (
                  <div className="space-y-2">
                    <Label>Fornecedor</Label>
                    <SearchableSelect
                      options={supplierOptions}
                      value={formData.supplier_id}
                      onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}
                      placeholder="Buscar fornecedor..."
                      searchPlaceholder="Digite para buscar..."
                      emptyMessage="Nenhum fornecedor encontrado"
                      onAddNew={() => setShowNewSupplier(true)}
                      addNewLabel="Cadastrar novo fornecedor"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Cliente</Label>
                    <SearchableSelect
                      options={clientOptions}
                      value={formData.client_id}
                      onValueChange={(value) => setFormData({ ...formData, client_id: value })}
                      placeholder="Buscar cliente..."
                      searchPlaceholder="Digite para buscar..."
                      emptyMessage="Nenhum cliente encontrado"
                      onAddNew={() => setShowNewClient(true)}
                      addNewLabel="Cadastrar novo cliente"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Seção: Pagamento */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Pagamento
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-xl">
                <div className="space-y-2">
                  <Label>Conta Bancária</Label>
                  <SearchableSelect
                    options={bankAccountOptions}
                    value={formData.bank_account_id}
                    onValueChange={(value) => setFormData({ ...formData, bank_account_id: value })}
                    placeholder="Buscar conta bancária..."
                    searchPlaceholder="Digite para buscar..."
                    emptyMessage="Nenhuma conta encontrada"
                    onAddNew={() => setShowNewBankAccount(true)}
                    addNewLabel="Criar nova conta bancária"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Forma de Pagamento</Label>
                  <SearchableSelect
                    options={paymentMethodOptions}
                    value={formData.payment_method_id}
                    onValueChange={(value) => setFormData({ ...formData, payment_method_id: value })}
                    placeholder="Buscar forma de pagamento..."
                    searchPlaceholder="Digite para buscar..."
                    emptyMessage="Nenhuma forma de pagamento encontrada"
                    onAddNew={() => setShowNewPaymentMethod(true)}
                    addNewLabel="Criar nova forma de pagamento"
                  />
                </div>
              </div>
            </div>

            {/* Seção: Observações */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                Observações
              </h3>
              <div className="p-4 bg-muted/30 rounded-xl">
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Adicione observações sobre esta conta fixa..."
                  rows={3}
                  className="rounded-xl resize-none"
                />
              </div>
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
                Cancelar
              </Button>
              <Button type="submit" disabled={saveMutation.isPending} className="rounded-xl px-8">
                {saveMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Quick dialogs */}
      <QuickCategoryDialog
        open={showNewCategory}
        onOpenChange={setShowNewCategory}
        type={formData.type as "income" | "expense"}
        onSuccess={(id) => setFormData({ ...formData, category_id: id })}
      />
      <QuickCostCenterDialog
        open={showNewCostCenter}
        onOpenChange={setShowNewCostCenter}
        onSuccess={(id) => setFormData({ ...formData, cost_center_id: id })}
      />
      <QuickPaymentMethodDialog
        open={showNewPaymentMethod}
        onOpenChange={setShowNewPaymentMethod}
        onSuccess={(id) => setFormData({ ...formData, payment_method_id: id })}
      />
      <QuickBankAccountDialog
        open={showNewBankAccount}
        onOpenChange={setShowNewBankAccount}
        onSuccess={(id) => setFormData({ ...formData, bank_account_id: id })}
      />
      <QuickSupplierDialog
        open={showNewSupplier}
        onOpenChange={setShowNewSupplier}
        onSuccess={(id) => setFormData({ ...formData, supplier_id: id })}
      />
      <QuickClientDialog
        open={showNewClient}
        onOpenChange={setShowNewClient}
        onSuccess={(id) => setFormData({ ...formData, client_id: id })}
      />
      <QuickChartOfAccountDialog
        open={showNewChartAccount}
        onOpenChange={setShowNewChartAccount}
        onSuccess={(id) => setFormData({ ...formData, chart_account_id: id })}
      />
    </>
  );
};
