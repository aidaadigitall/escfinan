import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";

interface QuickPaymentMethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (paymentMethodId: string) => void;
}

export function QuickPaymentMethodDialog({ open, onOpenChange, onSuccess }: QuickPaymentMethodDialogProps) {
  const [name, setName] = useState("");
  const { createPaymentMethod } = usePaymentMethods();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) return;

    createPaymentMethod(name.trim(), {
      onSuccess: (data) => {
        setName("");
        onOpenChange(false);
        if (onSuccess && data) {
          onSuccess(data.id);
        }
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nova Forma de Pagamento</DialogTitle>
          <DialogDescription>
            Adicione uma nova forma de pagamento ao sistema
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="payment-name">Nome</Label>
              <Input
                id="payment-name"
                placeholder="Ex: Dinheiro, PIX, Cartão..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              Criar Forma de Pagamento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
