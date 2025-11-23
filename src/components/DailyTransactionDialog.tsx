import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useCategories } from "@/hooks/useCategories";
import { useBankAccounts } from "@/hooks/useBankAccounts";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useClients } from "@/hooks/useClients";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { QuickAddDialog } from "@/components/QuickAddDialog";
import { Plus } from "lucide-react";
import { addMonths, addDays } from "date-fns";

type DailyTransactionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "income" | "expense";
  onSave: (data: any) => void;
};

export const DailyTransactionDialog = ({ open, onOpenChange, type, onSave }: DailyTransactionDialogProps) => {
  const { categories, createCategory } = useCategories(type);
  const { accounts } = useBankAccounts();
  const { suppliers, createSupplier } = useSuppliers();
  const { clients, createClient } = useClients();
  const { paymentMethods, createPaymentMethod } = usePaymentMethods();
  const [quickAddOpen, setQuickAddOpen] = useState<"category" | "entity" | "client" | "payment_method" | null>(null);

  const [isRecurring, setIsRecurring] = useState(false);
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category_id: "",
    entity: "",
    client: "",
    payment_method: "",
    bank_account_id: "",
    notes: "",
    due_date: new Date().toISOString().split('T')[0],
    paid_date: new Date().toISOString().split('T')[0],
    installment_type: "divide",
    recurrence_type: "monthly",
    interval_days: "",
    installments: "",
    first_installment_date: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isRecurring && formData.installments) {
      const installmentCount = parseInt(formData.installments);
      const baseAmount = parseFloat(formData.amount);
      const installmentAmount = formData.installment_type === "divide" 
        ? baseAmount / installmentCount 
        : baseAmount;

      const transactions = [];
      for (let i = 0; i < installmentCount; i++) {
        let dueDate: Date;
        const firstDate = new Date(formData.first_installment_date);

        if (formData.recurrence_type === "interval" && formData.interval_days) {
          dueDate = addDays(firstDate, i * parseInt(formData.interval_days));
        } else if (formData.recurrence_type === "monthly") {
          dueDate = addMonths(firstDate, i);
        } else if (formData.recurrence_type === "biweekly") {
          dueDate = addDays(firstDate, i * 15);
        } else if (formData.recurrence_type === "quarterly") {
          dueDate = addMonths(firstDate, i * 3);
        } else if (formData.recurrence_type === "semiannual") {
          dueDate = addMonths(firstDate, i * 6);
        } else if (formData.recurrence_type === "annual") {
          dueDate = addMonths(firstDate, i * 12);
        } else {
          dueDate = addMonths(firstDate, i);
        }

        transactions.push({
          description: `${formData.description} (${i + 1}/${installmentCount})`,
          amount: installmentAmount,
          type,
          category_id: formData.category_id || undefined,
          entity: formData.entity || undefined,
          client: formData.client || undefined,
          payment_method: formData.payment_method || undefined,
          bank_account_id: formData.bank_account_id || undefined,
          notes: formData.notes || undefined,
          due_date: dueDate.toISOString().split('T')[0],
          paid_date: dueDate.toISOString().split('T')[0],
          paid_amount: installmentAmount,
          status: type === "income" ? "received" : "paid",
        });
      }

      transactions.forEach(transaction => onSave(transaction));
    } else {
      const transactionData = {
        description: formData.description,
        amount: parseFloat(formData.amount),
        type,
        category_id: formData.category_id || undefined,
        entity: formData.entity || undefined,
        client: formData.client || undefined,
        payment_method: formData.payment_method || undefined,
        bank_account_id: formData.bank_account_id || undefined,
        notes: formData.notes || undefined,
        due_date: formData.due_date,
        paid_date: formData.paid_date,
        paid_amount: parseFloat(formData.amount),
        status: type === "income" ? "received" : "paid",
      };

      onSave(transactionData);
    }
    
    setFormData({
      description: "",
      amount: "",
      category_id: "",
      entity: "",
      client: "",
      payment_method: "",
      bank_account_id: "",
      notes: "",
      due_date: new Date().toISOString().split('T')[0],
      paid_date: new Date().toISOString().split('T')[0],
      installment_type: "divide",
      recurrence_type: "monthly",
      interval_days: "",
      installments: "",
      first_installment_date: new Date().toISOString().split('T')[0],
    });
    
    setIsRecurring(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Lançamento Diário - {type === "income" ? "Receita" : "Despesa"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="description">Descrição *</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ex: Venda de produto, Compra de material"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Valor *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0,00"
                required
              />
            </div>

            <div>
              <Label htmlFor="category">Categoria</Label>
              <div className="flex gap-2">
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setQuickAddOpen("category")}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="entity">{type === "expense" ? "Fornecedor" : "Cliente"}</Label>
              <div className="flex gap-2">
                <Select
                  value={formData.entity}
                  onValueChange={(value) => setFormData({ ...formData, entity: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {type === "expense" 
                      ? suppliers.map((s) => (
                          <SelectItem key={s.id} value={s.name}>
                            {s.name}
                          </SelectItem>
                        ))
                      : clients.map((c) => (
                          <SelectItem key={c.id} value={c.name}>
                            {c.name}
                          </SelectItem>
                        ))
                    }
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setQuickAddOpen(type === "expense" ? "entity" : "client")}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="payment_method">Forma de Pagamento</Label>
              <div className="flex gap-2">
                <Select
                  value={formData.payment_method}
                  onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method.id} value={method.name}>
                        {method.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setQuickAddOpen("payment_method")}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="bank_account">Conta Bancária *</Label>
            <Select
              value={formData.bank_account_id}
              onValueChange={(value) => setFormData({ ...formData, bank_account_id: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="due_date">Data de Vencimento</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="paid_date">Data de Pagamento</Label>
              <Input
                id="paid_date"
                type="date"
                value={formData.paid_date}
                onChange={(e) => setFormData({ ...formData, paid_date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Observações adicionais..."
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2 pt-4 border-t">
            <Switch
              id="recurring"
              checked={isRecurring}
              onCheckedChange={setIsRecurring}
            />
            <Label htmlFor="recurring" className="cursor-pointer">
              Ativar parcelamento/recorrência
            </Label>
          </div>

          {isRecurring && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="installment_type">Tipo de parcela *</Label>
                  <Select
                    value={formData.installment_type}
                    onValueChange={(value) => setFormData({ ...formData, installment_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="divide">Dividir o valor do lançamento entre as parcelas</SelectItem>
                      <SelectItem value="multiply">Multiplicar o valor do lançamento pelas parcelas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="recurrence_type">Repetição *</Label>
                  <Select
                    value={formData.recurrence_type}
                    onValueChange={(value) => setFormData({ ...formData, recurrence_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="biweekly">Quinzenal</SelectItem>
                      <SelectItem value="quarterly">Trimestral</SelectItem>
                      <SelectItem value="semiannual">Semestral</SelectItem>
                      <SelectItem value="annual">Anual</SelectItem>
                      <SelectItem value="interval">Intervalo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.recurrence_type === "interval" && (
                  <div>
                    <Label htmlFor="interval_days">Intervalo dias *</Label>
                    <Input
                      id="interval_days"
                      type="number"
                      min="1"
                      value={formData.interval_days}
                      onChange={(e) => setFormData({ ...formData, interval_days: e.target.value })}
                      placeholder="Ex: 30"
                      required
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="installments">Quantidade *</Label>
                  <Input
                    id="installments"
                    type="number"
                    min="2"
                    value={formData.installments}
                    onChange={(e) => setFormData({ ...formData, installments: e.target.value })}
                    placeholder="Ex: 12"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="first_installment_date">Data 1ª parcela *</Label>
                  <Input
                    id="first_installment_date"
                    type="date"
                    value={formData.first_installment_date}
                    onChange={(e) => setFormData({ ...formData, first_installment_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="text-sm text-muted-foreground p-3 bg-background rounded border">
                <strong>Total:</strong> R$ {
                  formData.amount && formData.installments
                    ? (formData.installment_type === "divide"
                      ? parseFloat(formData.amount)
                      : parseFloat(formData.amount) * parseInt(formData.installments)
                    ).toLocaleString("pt-BR", { minimumFractionDigits: 2 })
                    : "0,00"
                }
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Salvar Lançamento</Button>
          </div>
        </form>
      </DialogContent>

      <QuickAddDialog
        open={quickAddOpen === "category"}
        onOpenChange={(open) => !open && setQuickAddOpen(null)}
        title={`Adicionar Categoria de ${type === "income" ? "Receita" : "Despesa"}`}
        onSave={(name) => createCategory({ name, type })}
      />
      
      <QuickAddDialog
        open={quickAddOpen === "entity"}
        onOpenChange={(open) => !open && setQuickAddOpen(null)}
        title="Adicionar Fornecedor"
        onSave={(name) => {
          createSupplier({ name });
          setFormData({ ...formData, entity: name });
        }}
      />
      
      <QuickAddDialog
        open={quickAddOpen === "client"}
        onOpenChange={(open) => !open && setQuickAddOpen(null)}
        title="Adicionar Cliente"
        onSave={(name) => {
          createClient({ name });
          setFormData({ ...formData, client: name });
        }}
      />
      
      <QuickAddDialog
        open={quickAddOpen === "payment_method"}
        onOpenChange={(open) => !open && setQuickAddOpen(null)}
        title="Adicionar Forma de Pagamento"
        onSave={(name) => {
          createPaymentMethod(name);
          setFormData({ ...formData, payment_method: name });
        }}
      />
    </Dialog>
  );
};
