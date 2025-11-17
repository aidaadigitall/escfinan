import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCostCenters } from "@/hooks/useCostCenters";

interface QuickCostCenterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (costCenterId: string) => void;
}

export function QuickCostCenterDialog({ open, onOpenChange, onSuccess }: QuickCostCenterDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const { createCostCenter } = useCostCenters();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) return;

    createCostCenter(
      { name: name.trim(), description: description.trim() || undefined, is_active: true },
      {
        onSuccess: (data) => {
          setName("");
          setDescription("");
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Novo Centro de Custo</DialogTitle>
          <DialogDescription>
            Crie um novo centro de custo para organizar suas despesas
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="costcenter-name">Nome</Label>
              <Input
                id="costcenter-name"
                placeholder="Ex: Administrativo, Vendas..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="costcenter-description">Descrição (opcional)</Label>
              <Textarea
                id="costcenter-description"
                placeholder="Descreva o objetivo deste centro de custo..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              Criar Centro de Custo
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
