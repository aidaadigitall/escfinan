import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLeadSources } from "@/hooks/useLeadSources";
import { Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

interface QuickLeadSourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (sourceName: string) => void;
}

export function QuickLeadSourceDialog({ open, onOpenChange, onSuccess }: QuickLeadSourceDialogProps) {
  const [name, setName] = useState("");
  const { sources, createSource, deleteSource } = useLeadSources();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await createSource.mutateAsync(name.trim());
      toast.success("Origem criada com sucesso!");
      if (onSuccess) onSuccess(name.trim());
      setName("");
    } catch (e) {
      toast.error("Erro ao criar origem.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSource.mutateAsync(id);
      toast.success("Origem removida com sucesso!");
    } catch (e) {
      toast.error("Erro ao remover origem.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Gerenciar Origens de Lead</DialogTitle>
          <DialogDescription>Cadastre ou remova origens personalizadas.</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Lista de origens existentes */}
          <div className="space-y-2">
            <Label>Origens Cadastradas</Label>
            <div className="border rounded-md p-2 max-h-[200px] overflow-y-auto space-y-2">
              {sources.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">Nenhuma origem personalizada.</p>
              ) : (
                sources.map((source) => (
                  <div key={source.id} className="flex items-center justify-between bg-secondary/20 p-2 rounded">
                    <span className="text-sm">{source.name}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 text-destructive hover:text-destructive/90"
                      onClick={() => handleDelete(source.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Formulário de nova origem */}
          <form onSubmit={handleSubmit} className="space-y-4 border-t pt-4">
            <div className="grid gap-2">
              <Label htmlFor="lead-source-name">Nova Origem</Label>
              <div className="flex gap-2">
                <Input 
                  id="lead-source-name" 
                  placeholder="Ex: Indicação, Site, Instagram..." 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                />
                <Button type="submit" disabled={!name.trim()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </div>
            </div>
          </form>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
