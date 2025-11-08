import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCategories } from "@/hooks/useCategories";
import { Transaction } from "@/hooks/useTransactions";
import { z } from "zod";
import { toast } from "sonner";

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
  const [formData, setFormData] = useState<{
    description: string;
    amount: string;
    type: "income" | "expense";
    category_id: string;
    entity: string;
    client: string;
    account: string;
    payment_method: string;
    status: "pending" | "confirmed" | "overdue" | "paid" | "received";
    due_date: string;
    paid_date: string;
    notes: string;
  }>({
    description: "",
    amount: "",
    type: type,
    category_id: "",
    entity: "",
    client: "",
    account: "",
    payment_method: "",
    status: "pending",
    due_date: "",
    paid_date: "",
    notes: "",
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
        status: transaction.status,
        due_date: transaction.due_date,
        paid_date: transaction.paid_date || "",
        notes: transaction.notes || "",
      });
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
        status: "pending",
        due_date: new Date().toISOString().split("T")[0],
        paid_date: "",
        notes: "",
      });
    }
  }, [transaction, type, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validatedData = transactionSchema.parse({
        ...formData,
        amount: parseFloat(formData.amount),
      });

      const dataToSave = {
        ...formData,
        amount: parseFloat(formData.amount),
        category_id: formData.category_id || undefined,
        entity: formData.entity || undefined,
        client: formData.client || undefined,
        account: formData.account || undefined,
        payment_method: formData.payment_method || undefined,
        paid_date: formData.paid_date || undefined,
        notes: formData.notes || undefined,
      };

      if (transaction) {
        onSave({ id: transaction.id, ...dataToSave });
      } else {
        onSave(dataToSave);
      }
      onOpenChange(false);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
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
              <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                <SelectTrigger>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="entity">Entidade</Label>
              <Input
                id="entity"
                value={formData.entity}
                onChange={(e) => setFormData({ ...formData, entity: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client">Cliente</Label>
              <Input
                id="client"
                value={formData.client}
                onChange={(e) => setFormData({ ...formData, client: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="account">Conta</Label>
              <Input
                id="account"
                value={formData.account}
                onChange={(e) => setFormData({ ...formData, account: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_method">Forma de Pagamento</Label>
              <Input
                id="payment_method"
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              />
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

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
