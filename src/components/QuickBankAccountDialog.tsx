import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBankAccounts } from "@/hooks/useBankAccounts";
import { Building2 } from "lucide-react";

interface QuickBankAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (accountId: string) => void;
}

export function QuickBankAccountDialog({ open, onOpenChange, onSuccess }: QuickBankAccountDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    bank_name: "",
    account_type: "checking",
    initial_balance: "0",
  });
  const { createAccount } = useBankAccounts();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) return;

    createAccount(
      {
        name: formData.name.trim(),
        bank_name: formData.bank_name || undefined,
        account_type: formData.account_type,
        initial_balance: parseFloat(formData.initial_balance) || 0,
        is_active: true,
      },
      {
        onSuccess: (data) => {
          setFormData({ name: "", bank_name: "", account_type: "checking", initial_balance: "0" });
          onOpenChange(false);
          if (onSuccess && data) {
            onSuccess(data.id);
          }
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Nova Conta Bancária</DialogTitle>
              <DialogDescription>
                Adicione uma nova conta para controlar seu saldo
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="account-name">Nome da Conta *</Label>
            <Input
              id="account-name"
              placeholder="Ex: Conta Principal, Poupança..."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="rounded-xl"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bank-name">Banco</Label>
            <Input
              id="bank-name"
              placeholder="Ex: Banco do Brasil, Itaú..."
              value={formData.bank_name}
              onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
              className="rounded-xl"
            />
          </div>
          <div className="form-grid-cols-2">
            <div className="space-y-2">
              <Label>Tipo de Conta</Label>
              <Select value={formData.account_type} onValueChange={(value) => setFormData({ ...formData, account_type: value })}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">Conta Corrente</SelectItem>
                  <SelectItem value="savings">Poupança</SelectItem>
                  <SelectItem value="investment">Investimento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="initial-balance">Saldo Inicial</Label>
              <Input
                id="initial-balance"
                type="number"
                step="0.01"
                value={formData.initial_balance}
                onChange={(e) => setFormData({ ...formData, initial_balance: e.target.value })}
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button type="submit" disabled={!formData.name.trim()} className="rounded-xl">
              Criar Conta
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
