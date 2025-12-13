import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useClients } from "@/hooks/useClients";
import { MaskedInput } from "@/components/ui/masked-input";
import { Users } from "lucide-react";
import { toast } from "sonner";

interface QuickClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (clientId: string) => void;
  initialData?: {
    name?: string;
    email?: string;
    phone?: string;
  };
}

export function QuickClientDialog({ open, onOpenChange, onSuccess, initialData }: QuickClientDialogProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    cpf: "",
    cnpj: "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
  });
  const { clients, createClient } = useClients();

  // Reset form when dialog opens with initial data
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && initialData) {
      setFormData({
        name: initialData.name || "",
        cpf: "",
        cnpj: "",
        email: initialData.email || "",
        phone: initialData.phone || "",
      });
    }
    onOpenChange(isOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) return;

    // Check for duplicate clients
    const cleanCpf = formData.cpf?.replace(/\D/g, "");
    const cleanCnpj = formData.cnpj?.replace(/\D/g, "");
    
    const isDuplicate = clients.some((client) => {
      // Check for duplicate name
      if (client.name.toLowerCase().trim() === formData.name.toLowerCase().trim()) {
        return true;
      }
      
      // Check for duplicate CPF
      if (cleanCpf && cleanCpf.length === 11) {
        const existingCpf = client.cpf?.replace(/\D/g, "");
        if (existingCpf === cleanCpf) return true;
      }
      
      // Check for duplicate CNPJ
      if (cleanCnpj && cleanCnpj.length === 14) {
        const existingCnpj = client.cnpj?.replace(/\D/g, "");
        if (existingCnpj === cleanCnpj) return true;
      }
      
      return false;
    });

    if (isDuplicate) {
      toast.error("Já existe um cliente com este nome, CPF ou CNPJ!");
      return;
    }

    createClient(
      {
        name: formData.name.trim(),
        cpf: formData.cpf || undefined,
        cnpj: formData.cnpj || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
      },
      {
        onSuccess: (data) => {
          setFormData({ name: "", cpf: "", cnpj: "", email: "", phone: "" });
          onOpenChange(false);
          if (onSuccess && data) {
            onSuccess(data.id);
          }
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Novo Cliente</DialogTitle>
              <DialogDescription>
                Cadastre um novo cliente rapidamente
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="client-name">Nome *</Label>
            <Input
              id="client-name"
              placeholder="Nome do cliente"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="rounded-xl"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client-cpf">CPF</Label>
              <MaskedInput
                id="client-cpf"
                mask="cpf"
                placeholder="000.000.000-00"
                value={formData.cpf}
                onChange={(value) => setFormData({ ...formData, cpf: value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-cnpj">CNPJ</Label>
              <MaskedInput
                id="client-cnpj"
                mask="cnpj"
                placeholder="00.000.000/0000-00"
                value={formData.cnpj}
                onChange={(value) => setFormData({ ...formData, cnpj: value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client-email">E-mail</Label>
              <Input
                id="client-email"
                type="email"
                placeholder="email@exemplo.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-phone">Telefone</Label>
              <MaskedInput
                id="client-phone"
                mask="phone"
                placeholder="(00) 00000-0000"
                value={formData.phone}
                onChange={(value) => setFormData({ ...formData, phone: value })}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button type="submit" disabled={!formData.name.trim()} className="rounded-xl">
              Criar Cliente
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}