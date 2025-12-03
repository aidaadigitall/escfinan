import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCategories } from "@/hooks/useCategories";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { useClients } from "@/hooks/useClients";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useBankAccounts } from "@/hooks/useBankAccounts";
import { useCostCenters } from "@/hooks/useCostCenters";
import { useChartOfAccounts } from "@/hooks/useChartOfAccounts";
import { Transaction } from "@/hooks/useTransactions";
type TransactionType = "income" | "expense";
import { SearchableSelect } from "@/components/SearchableSelect";
import { QuickCategoryDialog } from "@/components/QuickCategoryDialog";
import { QuickPaymentMethodDialog } from "@/components/QuickPaymentMethodDialog";
import { QuickBankAccountDialog } from "@/components/QuickBankAccountDialog";
import { QuickCostCenterDialog } from "@/components/QuickCostCenterDialog";
import { QuickClientDialog } from "@/components/QuickClientDialog";
import { QuickSupplierDialog } from "@/components/QuickSupplierDialog";
import { z } from "zod";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign } from "lucide-react";

const transactionSchema = z.object({
  description: z.string().min(3, "Descrição deve ter no mínimo 3 caracteres"),
  amount: z.number().positive("Valor deve ser positivo"),
  due_date: z.string().min(1, "Data de vencimento é obrigatória"),
  status: z.enum(["pending", "confirmed", "overdue", "paid", "received"]),
});

type TransactionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "income" | "expense";
  transaction?: Transaction;
  onSave: (transaction: any) => void;
};

export const TransactionDialog = ({ open, onOpenChange, type, transaction, onSave }: TransactionDialogProps) => {
  const { categories } = useCategories(type);
  const { paymentMethods } = usePaymentMethods();
  const { clients } = useClients();
  const { suppliers } = useSuppliers();
  const { accounts: bankAccounts } = useBankAccounts();
  const { costCenters } = useCostCenters();
  const { accounts: chartOfAccounts } = useChartOfAccounts();
  
  const [quickAddOpen, setQuickAddOpen] = useState<string | null>(null);
  const [isRecurring, setIsRecurring] = useState(false);
  
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    type: type,
    category_id: "",
    entity: "",
    client: "",
    account: "",
    payment_method: "",
    bank_account_id: "",
    cost_center_id: "",
    paid_amount: "",
    status: "pending" as "pending" | "confirmed" | "overdue" | "paid" | "received",
    due_date: "",
    paid_date: "",
    notes: "",
    recurrence_type: "monthly",
    recurrence_day: "1",
    start_date: "",
    end_date: "",
    installments: "1",
  });

  useEffect(() => {
    if (transaction) {
      setFormData({
        description: transaction.description,
        amount: transaction.amount.toString(),
        type: transaction.type as TransactionType,
        category_id: transaction.category_id || "",
        entity: transaction.entity || "",
        client: transaction.client || "",
        account: transaction.account || "",
        payment_method: transaction.payment_method || "",
        bank_account_id: transaction.bank_account_id || "",
        cost_center_id: "",
        paid_amount: transaction.paid_amount?.toString() || "",
        status: transaction.status,
        due_date: transaction.due_date,
        paid_date: transaction.paid_date || "",
        notes: transaction.notes || "",
        recurrence_type: "monthly",
        recurrence_day: "1",
        start_date: "",
        end_date: "",
        installments: "1",
      });
      setIsRecurring(false);
    } else {
      setFormData({
        description: "",
        amount: "",
        type: type,
        category_id: "",
        entity: "",
        client: "",
        account: "",
        payment_method: "",
        bank_account_id: "",
        cost_center_id: "",
        paid_amount: "",
        status: "pending",
        due_date: new Date().toISOString().split("T")[0],
        paid_date: "",
        notes: "",
        recurrence_type: "monthly",
        recurrence_day: "1",
        start_date: new Date().toISOString().split("T")[0],
        end_date: "",
        installments: "1",
      });
      setIsRecurring(false);
    }
  }, [transaction, type, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      transactionSchema.parse({
        ...formData,
        amount: parseFloat(formData.amount),
      });

      const installments = parseInt(formData.installments) || 1;

      if (installments > 1 && !transaction) {
        const installmentAmount = parseFloat(formData.amount) / installments;
        const baseDate = new Date(formData.due_date);
        
        for (let i = 0; i < installments; i++) {
          const installmentDate = new Date(baseDate);
          installmentDate.setMonth(installmentDate.getMonth() + i);
          
          const installmentData = {
            description: `${formData.description} (${i + 1}/${installments})`,
            amount: installmentAmount,
            type: formData.type,
            status: formData.status,
            due_date: installmentDate.toISOString().split("T")[0],
            category_id: formData.category_id || undefined,
            entity: formData.entity || undefined,
            client: formData.client || undefined,
            account: formData.account || undefined,
            payment_method: formData.payment_method || undefined,
            bank_account_id: formData.bank_account_id || undefined,
            notes: formData.notes || undefined,
            paid_amount: formData.paid_amount ? parseFloat(formData.paid_amount) / installments : undefined,
            paid_date: formData.paid_date || undefined,
          };
          
          onSave(installmentData);
        }
        
        toast.success(`${installments} parcelas criadas com sucesso!`);
        onOpenChange(false);
        return;
      }

      const dataToSave = {
        description: formData.description,
        amount: parseFloat(formData.amount),
        type: formData.type,
        status: formData.status,
        due_date: formData.due_date,
        paid_amount: formData.paid_amount ? parseFloat(formData.paid_amount) : undefined,
        category_id: formData.category_id || undefined,
        entity: formData.entity || undefined,
        client: formData.client || undefined,
        account: formData.account || undefined,
        payment_method: formData.payment_method || undefined,
        bank_account_id: formData.bank_account_id || undefined,
        paid_date: formData.paid_date || undefined,
        notes: formData.notes || undefined,
      };

      if (isRecurring && !transaction) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("recurring_bills").insert({
            user_id: user.id,
            description: formData.description,
            type: formData.type,
            amount: parseFloat(formData.amount),
            recurrence_type: formData.recurrence_type,
            recurrence_day: parseInt(formData.recurrence_day) || undefined,
            start_date: formData.start_date,
            end_date: formData.end_date || undefined,
            category_id: formData.category_id || undefined,
            bank_account_id: formData.bank_account_id || undefined,
            notes: formData.notes || undefined,
          });
          toast.success("Conta recorrente criada com sucesso!");
        }
      }

      if (transaction) {
        onSave({ id: transaction.id, ...dataToSave });
      } else {
        onSave(dataToSave);
      }
      onOpenChange(false);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || "Erro ao salvar");
      }
    }
  };

  const categoryOptions = categories.map(c => ({ value: c.id, label: c.name }));
  const supplierOptions = suppliers.map(s => ({ value: s.name, label: s.name }));
  const clientOptions = clients.map(c => ({ value: c.name, label: c.name }));
  const bankAccountOptions = bankAccounts.map(a => ({ value: a.id, label: `${a.name} - ${a.bank_name || 'Sem banco'}` }));
  const paymentMethodOptions = paymentMethods.map(m => ({ value: m.name, label: m.name }));
  const costCenterOptions = costCenters.map(c => ({ value: c.id, label: c.name }));
  const chartOfAccountOptions = chartOfAccounts.map(c => ({ value: c.id, label: `${c.code} - ${c.name}` }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${type === "income" ? "bg-green-500/10" : "bg-red-500/10"}`}>
              <DollarSign className={`h-5 w-5 ${type === "income" ? "text-green-600" : "text-red-600"}`} />
            </div>
            <DialogTitle>
              {transaction ? "Editar" : "Adicionar"} {type === "income" ? "Receita" : "Despesa"}
            </DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="description">Descrição *</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="rounded-xl"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Valor *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="rounded-xl"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <SearchableSelect
                options={categoryOptions}
                value={formData.category_id}
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                placeholder="Selecione uma categoria"
                onAddNew={() => setQuickAddOpen("category")}
                addNewLabel="Nova Categoria"
              />
            </div>

            <div className="space-y-2">
              <Label>{type === "expense" ? "Fornecedor" : "Cliente"}</Label>
              <SearchableSelect
                options={type === "expense" ? supplierOptions : clientOptions}
                value={type === "expense" ? formData.entity : formData.client}
                onValueChange={(value) => setFormData({ ...formData, [type === "expense" ? "entity" : "client"]: value })}
                placeholder={`Selecione ${type === "expense" ? "um fornecedor" : "um cliente"}`}
                onAddNew={() => setQuickAddOpen(type === "expense" ? "supplier" : "client")}
                addNewLabel={type === "expense" ? "Novo Fornecedor" : "Novo Cliente"}
              />
            </div>

            <div className="space-y-2">
              <Label>Conta Bancária</Label>
              <SearchableSelect
                options={bankAccountOptions}
                value={formData.bank_account_id}
                onValueChange={(value) => setFormData({ ...formData, bank_account_id: value })}
                placeholder="Selecione uma conta"
                onAddNew={() => setQuickAddOpen("bank_account")}
                addNewLabel="Nova Conta Bancária"
              />
            </div>

            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <SearchableSelect
                options={paymentMethodOptions}
                value={formData.payment_method}
                onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                placeholder="Selecione uma forma"
                onAddNew={() => setQuickAddOpen("payment_method")}
                addNewLabel="Nova Forma de Pagamento"
              />
            </div>

            <div className="space-y-2">
              <Label>Centro de Custo</Label>
              <SearchableSelect
                options={costCenterOptions}
                value={formData.cost_center_id}
                onValueChange={(value) => setFormData({ ...formData, cost_center_id: value })}
                placeholder="Selecione um centro"
                onAddNew={() => setQuickAddOpen("cost_center")}
                addNewLabel="Novo Centro de Custo"
              />
            </div>

            <div className="space-y-2">
              <Label>Plano de Contas</Label>
              <SearchableSelect
                options={chartOfAccountOptions}
                value={formData.account}
                onValueChange={(value) => setFormData({ ...formData, account: value })}
                placeholder="Selecione uma conta"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="confirmed">Confirmado</SelectItem>
                  <SelectItem value="overdue">Atrasado</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="received">Recebido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">Data de Vencimento *</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="rounded-xl"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paid_date">Data de Pagamento</Label>
              <Input
                id="paid_date"
                type="date"
                value={formData.paid_date}
                onChange={(e) => setFormData({ ...formData, paid_date: e.target.value })}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paid_amount">Valor Pago (Parcial)</Label>
              <Input
                id="paid_amount"
                type="number"
                step="0.01"
                placeholder="Deixe vazio para total"
                value={formData.paid_amount}
                onChange={(e) => setFormData({ ...formData, paid_amount: e.target.value })}
                className="rounded-xl"
              />
              {formData.paid_amount && formData.amount && (
                <p className="text-sm text-muted-foreground">
                  Restante: R$ {(parseFloat(formData.amount) - parseFloat(formData.paid_amount)).toFixed(2)}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="installments">Número de Parcelas</Label>
            <Input
              id="installments"
              type="number"
              min="1"
              placeholder="1 para pagamento único"
              value={formData.installments}
              onChange={(e) => setFormData({ ...formData, installments: e.target.value })}
              className="rounded-xl"
            />
            {formData.installments && parseInt(formData.installments) > 1 && (
              <p className="text-sm text-muted-foreground">
                Valor por parcela: R$ {(parseFloat(formData.amount || "0") / parseInt(formData.installments)).toFixed(2)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="rounded-xl"
            />
          </div>

          {!transaction && (
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="recurring"
                  checked={isRecurring}
                  onCheckedChange={(checked) => setIsRecurring(checked as boolean)}
                />
                <Label htmlFor="recurring" className="cursor-pointer">
                  Criar como conta recorrente (fixa)
                </Label>
              </div>

              {isRecurring && (
                <div className="grid grid-cols-2 gap-4 pl-6 p-4 bg-muted/50 rounded-xl">
                  <div className="space-y-2">
                    <Label htmlFor="recurrence_type">Recorrência *</Label>
                    <Select
                      value={formData.recurrence_type}
                      onValueChange={(value) => setFormData({ ...formData, recurrence_type: value })}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
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

                  <div className="space-y-2">
                    <Label htmlFor="recurrence_day">Dia (1-31)</Label>
                    <Input
                      id="recurrence_day"
                      type="number"
                      min="1"
                      max="31"
                      value={formData.recurrence_day}
                      onChange={(e) => setFormData({ ...formData, recurrence_day: e.target.value })}
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
                      required={isRecurring}
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
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button type="submit" className="rounded-xl">Salvar</Button>
          </div>
        </form>
      </DialogContent>

      <QuickCategoryDialog
        open={quickAddOpen === "category"}
        onOpenChange={(open) => !open && setQuickAddOpen(null)}
        type={type}
        onSuccess={(id) => setFormData({ ...formData, category_id: id })}
      />

      <QuickSupplierDialog
        open={quickAddOpen === "supplier"}
        onOpenChange={(open) => !open && setQuickAddOpen(null)}
        onSuccess={(id) => {
          const supplier = suppliers.find(s => s.id === id);
          if (supplier) setFormData({ ...formData, entity: supplier.name });
        }}
      />

      <QuickClientDialog
        open={quickAddOpen === "client"}
        onOpenChange={(open) => !open && setQuickAddOpen(null)}
        onSuccess={(id) => {
          const client = clients.find(c => c.id === id);
          if (client) setFormData({ ...formData, client: client.name });
        }}
      />

      <QuickBankAccountDialog
        open={quickAddOpen === "bank_account"}
        onOpenChange={(open) => !open && setQuickAddOpen(null)}
        onSuccess={(id) => setFormData({ ...formData, bank_account_id: id })}
      />

      <QuickPaymentMethodDialog
        open={quickAddOpen === "payment_method"}
        onOpenChange={(open) => !open && setQuickAddOpen(null)}
        onSuccess={(id) => {
          const method = paymentMethods.find(m => m.id === id);
          if (method) setFormData({ ...formData, payment_method: method.name });
        }}
      />

      <QuickCostCenterDialog
        open={quickAddOpen === "cost_center"}
        onOpenChange={(open) => !open && setQuickAddOpen(null)}
        onSuccess={(id) => setFormData({ ...formData, cost_center_id: id })}
      />
    </Dialog>
  );
};
