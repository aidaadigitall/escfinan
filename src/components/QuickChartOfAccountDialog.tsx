import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useChartOfAccounts } from "@/hooks/useChartOfAccounts";
import { FileText } from "lucide-react";

interface QuickChartOfAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (accountId: string) => void;
}

export function QuickChartOfAccountDialog({ open, onOpenChange, onSuccess }: QuickChartOfAccountDialogProps) {
  const [formData, setFormData] = useState<{
    code: string;
    name: string;
    account_type: "asset" | "liability" | "equity" | "revenue" | "expense";
  }>({
    code: "",
    name: "",
    account_type: "expense",
  });
  const { createAccount } = useChartOfAccounts();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.code.trim()) return;

    createAccount(
      {
        code: formData.code.trim(),
        name: formData.name.trim(),
        account_type: formData.account_type,
        is_active: true,
      },
      {
        onSuccess: (data) => {
          setFormData({ code: "", name: "", account_type: "expense" });
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
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Novo Plano de Contas</DialogTitle>
              <DialogDescription>
                Adicione uma nova conta contábil
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="account-code">Código *</Label>
              <Input
                id="account-code"
                placeholder="1.1.01"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="rounded-xl"
                autoFocus
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="account-name">Nome da Conta *</Label>
              <Input
                id="account-name"
                placeholder="Ex: Despesas Operacionais"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="rounded-xl"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Tipo de Conta</Label>
            <Select value={formData.account_type} onValueChange={(value: "asset" | "liability" | "equity" | "revenue" | "expense") => setFormData({ ...formData, account_type: value })}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asset">Ativo</SelectItem>
                <SelectItem value="liability">Passivo</SelectItem>
                <SelectItem value="equity">Patrimônio Líquido</SelectItem>
                <SelectItem value="income">Receita</SelectItem>
                <SelectItem value="expense">Despesa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button type="submit" disabled={!formData.name.trim() || !formData.code.trim()} className="rounded-xl">
              Criar Conta
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
