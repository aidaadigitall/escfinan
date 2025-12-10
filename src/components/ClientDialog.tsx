import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Client } from "@/hooks/useClients";
import { toast } from "sonner";
import { z } from "zod";

const clientSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres").max(100),
  company_name: z.string().max(100).optional(),
  cpf: z.string().max(14).optional(),
  cnpj: z.string().max(18).optional(),
  email: z.string().email("Email inválido").max(255).optional().or(z.literal("")),
  phone: z.string().max(20).optional(),
  zipcode: z.string().max(10).optional(),
  address: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(2).optional(),
});

type ClientDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client;
  onSave: (client: any) => void;
};

export const ClientDialog = ({ open, onOpenChange, client, onSave }: ClientDialogProps) => {
  const [clientType, setClientType] = useState<"individual" | "company">("individual");
  const [formData, setFormData] = useState({
    name: "",
    company_name: "",
    cpf: "",
    cnpj: "",
    email: "",
    phone: "",
    zipcode: "",
    address: "",
    city: "",
    state: "",
    notes: "",
  });

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || "",
        company_name: client.company_name || "",
        cpf: client.cpf || "",
        cnpj: client.cnpj || "",
        email: client.email || "",
        phone: client.phone || "",
        zipcode: client.zipcode || "",
        address: client.address || "",
        city: client.city || "",
        state: client.state || "",
        notes: client.notes || "",
      });
      setClientType(client.cnpj ? "company" : "individual");
    } else {
      setFormData({
        name: "",
        company_name: "",
        cpf: "",
        cnpj: "",
        email: "",
        phone: "",
        zipcode: "",
        address: "",
        city: "",
        state: "",
        notes: "",
      });
      setClientType("individual");
    }
  }, [client, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validatedData = clientSchema.parse(formData);

      const dataToSave = {
        ...validatedData,
        email: validatedData.email || undefined,
        company_name: validatedData.company_name || undefined,
        cpf: clientType === "individual" ? validatedData.cpf : undefined,
        cnpj: clientType === "company" ? validatedData.cnpj : undefined,
        phone: validatedData.phone || undefined,
        zipcode: validatedData.zipcode || undefined,
        address: validatedData.address || undefined,
        city: validatedData.city || undefined,
        state: validatedData.state || undefined,
        notes: formData.notes || undefined,
      };

      if (client) {
        onSave({ id: client.id, ...dataToSave });
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{client ? "Editar" : "Adicionar"} Cliente</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">Dados Gerais</TabsTrigger>
              <TabsTrigger value="address">Endereços</TabsTrigger>
              <TabsTrigger value="financial">Financeiro</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4 mt-4">
              <div className="form-grid-cols-2">
                <div className="space-y-2">
                  <Label>Tipo de Cliente *</Label>
                  <Select value={clientType} onValueChange={(value: any) => setClientType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Pessoa Física</SelectItem>
                      <SelectItem value="company">Pessoa Jurídica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Situação</Label>
                  <Select defaultValue="active">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Nome completo"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@exemplo.com"
                  />
                </div>

                {clientType === "company" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="company_name">Razão Social</Label>
                      <Input
                        id="company_name"
                        value={formData.company_name}
                        onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                        placeholder="Nome da empresa"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cnpj">CNPJ</Label>
                      <Input
                        id="cnpj"
                        value={formData.cnpj}
                        onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                        placeholder="00.000.000/0000-00"
                        maxLength={18}
                      />
                    </div>
                  </>
                )}

                {clientType === "individual" && (
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      value={formData.cpf}
                      onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                      placeholder="000.000.000-00"
                      maxLength={14}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="site">Site</Label>
                  <Input
                    id="site"
                    placeholder="www.exemplo.com"
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label>Vendedor / Responsável</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um vendedor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user1">Elton Santos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="address" className="space-y-4 mt-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="zipcode">CEP</Label>
                  <div className="flex gap-2">
                    <Input
                      id="zipcode"
                      value={formData.zipcode}
                      onChange={(e) => setFormData({ ...formData, zipcode: e.target.value })}
                      placeholder="00000-000"
                      maxLength={9}
                    />
                    <Button type="button" variant="outline" size="icon">
                      🔍
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="address">Logradouro</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Rua, Avenida, etc"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Número</Label>
                  <Input placeholder="123" />
                </div>

                <div className="space-y-2">
                  <Label>Complemento</Label>
                  <Input placeholder="Apto, Sala, etc" />
                </div>

                <div className="space-y-2">
                  <Label>Bairro</Label>
                  <Input placeholder="Bairro" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Cidade"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">Estado/UF</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="SP"
                    maxLength={2}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Button type="button" variant="outline" className="w-full">
                  + Inserir novo endereço
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="financial" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Limite de crédito 💰</Label>
                  <Input type="number" step="0.01" placeholder="0,00" />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox id="allow_exceed" />
                  <Label htmlFor="allow_exceed" className="text-sm font-normal">
                    Permitir ultrapassar limite de crédito
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={4}
                    placeholder="Observações sobre o cliente"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 mt-6">
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
