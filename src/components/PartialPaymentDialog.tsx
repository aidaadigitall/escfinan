import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBankAccounts } from "@/hooks/useBankAccounts";
import { Transaction } from "@/hooks/useTransactions";
import { toast } from "sonner";

type PartialPaymentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
  onSave: (data: any) => void;
};

export const PartialPaymentDialog = ({ open, onOpenChange, transaction, onSave }: PartialPaymentDialogProps) => {
  const { accounts } = useBankAccounts();
  const [formData, setFormData] = useState({
    paid_amount: "",
    paid_date: new Date().toISOString().split('T')[0],
    bank_account_id: "",
  });

  useEffect(() => {
    if (transaction) {
      const alreadyPaid = transaction.paid_amount || 0;
      const remaining = parseFloat(transaction.amount.toString()) - alreadyPaid;
      setFormData({
        paid_amount: remaining.toFixed(2),
        paid_date: new Date().toISOString().split('T')[0],
        bank_account_id: transaction.bank_account_id || "",
      });
    }
  }, [transaction]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transaction) return;

    const paidAmount = parseFloat(formData.paid_amount);
    const totalAmount = parseFloat(transaction.amount.toString());
    const previouslyPaid = transaction.paid_amount || 0;
    const newTotalPaid = previouslyPaid + paidAmount;

    if (paidAmount <= 0) {
      toast.error("O valor pago deve ser maior que zero");
      return;
    }

    if (newTotalPaid > totalAmount) {
      toast.error("O valor total pago não pode exceder o valor da transação");
      return;
    }

    const newStatus = newTotalPaid >= totalAmount 
      ? (transaction.type === "income" ? "received" : "paid")
      : "pending";

    onSave({
      id: transaction.id,
      paid_amount: newTotalPaid,
      paid_date: formData.paid_date,
      bank_account_id: formData.bank_account_id,
      status: newStatus,
    });

    setFormData({
      paid_amount: "",
      paid_date: new Date().toISOString().split('T')[0],
      bank_account_id: "",
    });
    onOpenChange(false);
  };

  if (!transaction) return null;

  const alreadyPaid = transaction.paid_amount || 0;
  const remaining = parseFloat(transaction.amount.toString()) - alreadyPaid;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Pagamento Parcial</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2 p-4 bg-muted rounded-lg">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Valor Total:</span>
              <span className="font-semibold">
                R$ {parseFloat(transaction.amount.toString()).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Já Pago:</span>
              <span className="font-semibold text-income">
                R$ {alreadyPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-sm text-muted-foreground">Restante:</span>
              <span className="font-bold text-expense">
                R$ {remaining.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div>
            <Label htmlFor="paid_amount">Valor a Pagar *</Label>
            <Input
              id="paid_amount"
              type="number"
              step="0.01"
              value={formData.paid_amount}
              onChange={(e) => setFormData({ ...formData, paid_amount: e.target.value })}
              placeholder="0,00"
              required
            />
          </div>

          <div>
            <Label htmlFor="paid_date">Data do Pagamento *</Label>
            <Input
              id="paid_date"
              type="date"
              value={formData.paid_date}
              onChange={(e) => setFormData({ ...formData, paid_date: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="bank_account">Conta Bancária *</Label>
            <Select
              value={formData.bank_account_id}
              onValueChange={(value) => setFormData({ ...formData, bank_account_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a conta" />
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

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Confirmar Pagamento</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
