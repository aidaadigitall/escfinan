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
import { Transaction } from "@/hooks/useTransactions";
import { QuickAddDialog } from "@/components/QuickAddDialog";
import { Plus } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";

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
  const { categories, createCategory } = useCategories(type);
  const { paymentMethods, createPaymentMethod } = usePaymentMethods();
  const { clients, createClient } = useClients();
  const { suppliers, createSupplier } = useSuppliers();
  const { accounts: bankAccounts } = useBankAccounts();
  
  const [quickAddOpen, setQuickAddOpen] = useState<string | null>(null);
  
  const [isRecurring, setIsRecurring] = useState(false);
  
  const [formData, setFormData] = useState<{
    description: string;
    amount: string;
    type: "income" | "expense";
    category_id: string;
    entity: string;
    client: string;
    account: string;
    payment_method: string;
    bank_account_id: string;
    paid_amount: string;
    status: "pending" | "confirmed" | "overdue" | "paid" | "received";
    due_date: string;
    paid_date: string;
    notes: string;
    recurrence_type: string;
    recurrence_day: string;
    start_date: string;
    end_date: string;
    installments: string;
  }>({
    description: "",
    amount: "",
    type: type,
    category_id: "",
    entity: "",
    client: "",
    account: "",
    payment_method: "",
    bank_account_id: "",
    paid_amount: "",
    status: "pending",
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
        type: transaction.type,
        category_id: transaction.category_id || "",
        entity: transaction.entity || "",
        client: transaction.client || "",
        account: transaction.account || "",
        payment_method: transaction.payment_method || "",
        bank_account_id: transaction.bank_account_id || "",
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
      const validatedData = transactionSchema.parse({
        ...formData,
        amount: parseFloat(formData.amount),
      });

      const installments = parseInt(formData.installments) || 1;
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("Usuário não autenticado");

      // Se há parcelamento, criar múltiplas transações
      if (installments > 1 && !transaction) {
        const installmentAmount = parseFloat(formData.amount) / installments;
        const baseDate = new Date(formData.due_date);
        
        const installmentPromises = [];
        for (let i = 0; i < installments; i++) {
          const installmentDate = new Date(baseDate);
          installmentDate.setMonth(installmentDate.getMonth() + i);
          
          const installmentData = {
            user_id: user.id,
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
          };
          
          installmentPromises.push(
            supabase.from("transactions").insert(installmentData)
          );
        }
        
        await Promise.all(installmentPromises);
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

      // Se é recorrente e não é edição, criar conta fixa também
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {transaction ? "Editar" : "Adicionar"} {type === "income" ? "Receita" : "Despesa"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="description">Descrição *</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <div className="flex gap-2">
                <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" size="icon" variant="outline" onClick={() => setQuickAddOpen("category")}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="entity">Entidade</Label>
              <div className="flex gap-2">
                <Select value={formData.entity} onValueChange={(value) => setFormData({ ...formData, entity: value })}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecione uma entidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.name}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" size="icon" variant="outline" onClick={() => setQuickAddOpen("entity")}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="client">Cliente</Label>
              <div className="flex gap-2">
                <Select value={formData.client} onValueChange={(value) => setFormData({ ...formData, client: value })}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.name}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" size="icon" variant="outline" onClick={() => setQuickAddOpen("client")}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bank_account">Conta Bancária</Label>
              <Select value={formData.bank_account_id} onValueChange={(value) => setFormData({ ...formData, bank_account_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma conta bancária" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} - {account.bank_name || "Sem banco"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_method">Forma de Pagamento</Label>
              <div className="flex gap-2">
                <Select value={formData.payment_method} onValueChange={(value) => setFormData({ ...formData, payment_method: value })}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecione uma forma" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method.id} value={method.name}>
                        {method.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" size="icon" variant="outline" onClick={() => setQuickAddOpen("payment")}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
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
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paid_amount">Valor Pago (Pagamento Parcial)</Label>
              <Input
                id="paid_amount"
                type="number"
                step="0.01"
                placeholder="Deixe vazio para pagamento total"
                value={formData.paid_amount}
                onChange={(e) => setFormData({ ...formData, paid_amount: e.target.value })}
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
                <div className="grid grid-cols-2 gap-4 pl-6">
                  <div className="space-y-2">
                    <Label htmlFor="recurrence_type">Recorrência *</Label>
                    <Select
                      value={formData.recurrence_type}
                      onValueChange={(value) => setFormData({ ...formData, recurrence_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Diário</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="monthly">Mensal</SelectItem>
                        <SelectItem value="2months">2 meses</SelectItem>
                        <SelectItem value="3months">3 meses</SelectItem>
                        <SelectItem value="4months">4 meses</SelectItem>
                        <SelectItem value="6months">6 meses</SelectItem>
                        <SelectItem value="yearly">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="recurrence_day">Dia da Recorrência (1-31)</Label>
                    <Input
                      id="recurrence_day"
                      type="number"
                      min="1"
                      max="31"
                      value={formData.recurrence_day}
                      onChange={(e) => setFormData({ ...formData, recurrence_day: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="start_date">Data de Início *</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
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
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </DialogContent>
      
      <QuickAddDialog
        open={quickAddOpen === "category"}
        onOpenChange={(open) => !open && setQuickAddOpen(null)}
        title={`Adicionar Categoria de ${type === "income" ? "Receita" : "Despesa"}`}
        onSave={(name) => {
          createCategory({ name, type });
          // Não define formData.category_id aqui, pois o hook useCategories irá invalidar a query e recarregar a lista.
          // O usuário precisará selecionar o novo item na lista recarregada.
        }}
      />
      
      <QuickAddDialog
        open={quickAddOpen === "entity"}
        onOpenChange={(open) => !open && setQuickAddOpen(null)}
        title="Adicionar Fornecedor"
        onSave={(name) => {
          createSupplier({ name });
          // Não define formData.entity aqui, pois o hook useSuppliers irá invalidar a query e recarregar a lista.
          // O usuário precisará selecionar o novo item na lista recarregada.
          // Para uma melhor UX, o ideal seria que o createSupplier retornasse o ID/Nome e o setFormData fosse chamado.
          // Como o createSupplier não retorna o objeto completo, vamos apenas fechar o modal.
        }}
      />
      
      <QuickAddDialog
        open={quickAddOpen === "client"}
        onOpenChange={(open) => !open && setQuickAddOpen(null)}
        title="Adicionar Cliente"
        onSave={(name) => {
          createClient({ name });
          // Não define formData.client aqui, pois o hook useClients irá invalidar a query e recarregar a lista.
          // O usuário precisará selecionar o novo item na lista recarregada.
          // Como o createClient não retorna o objeto completo, vamos apenas fechar o modal.
        }}
      />
      
      <QuickAddDialog
        open={quickAddOpen === "payment"}
        onOpenChange={(open) => !open && setQuickAddOpen(null)}
        title="Adicionar Forma de Pagamento"
        onSave={(name) => {
          createPaymentMethod(name);
          // Não define formData.payment_method aqui, pois o hook usePaymentMethods irá invalidar a query e recarregar a lista.
          // O usuário precisará selecionar o novo item na lista recarregada.
        }}
      />
    </Dialog>
  );
};
