import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLeadSources } from "@/hooks/useLeadSources";

interface QuickLeadSourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (sourceName: string) => void;
}

export function QuickLeadSourceDialog({ open, onOpenChange, onSuccess }: QuickLeadSourceDialogProps) {
  const [name, setName] = useState("");
  const { createSource } = useLeadSources();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await createSource.mutateAsync(name.trim());
      onOpenChange(false);
      if (onSuccess) onSuccess(name.trim());
      setName("");
    } catch (e) {}
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nova Origem de Lead</DialogTitle>
          <DialogDescription>Cadastre uma origem personalizada para leads</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="lead-source-name">Nome</Label>
              <Input id="lead-source-name" placeholder="Ex: Indicação, Site, Instagram..." value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={!name.trim()}>Criar Origem</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
