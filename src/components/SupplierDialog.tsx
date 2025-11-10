import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Supplier } from "@/hooks/useSuppliers";
import { toast } from "sonner";
import { z } from "zod";

const supplierSchema = z.object({
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

type SupplierDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: Supplier;
  onSave: (supplier: any) => void;
};

export const SupplierDialog = ({ open, onOpenChange, supplier, onSave }: SupplierDialogProps) => {
  const [supplierType, setSupplierType] = useState<"individual" | "company">("company");
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
    if (supplier) {
      setFormData({
        name: supplier.name || "",
        company_name: supplier.company_name || "",
        cpf: supplier.cpf || "",
        cnpj: supplier.cnpj || "",
        email: supplier.email || "",
        phone: supplier.phone || "",
        zipcode: supplier.zipcode || "",
        address: supplier.address || "",
        city: supplier.city || "",
        state: supplier.state || "",
        notes: supplier.notes || "",
      });
      setSupplierType(supplier.cnpj ? "company" : "individual");
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
      setSupplierType("company");
    }
  }, [supplier, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validatedData = supplierSchema.parse(formData);

      const dataToSave = {
        ...validatedData,
        email: validatedData.email || undefined,
        company_name: validatedData.company_name || undefined,
        cpf: supplierType === "individual" ? validatedData.cpf : undefined,
        cnpj: supplierType === "company" ? validatedData.cnpj : undefined,
        phone: validatedData.phone || undefined,
        zipcode: validatedData.zipcode || undefined,
        address: validatedData.address || undefined,
        city: validatedData.city || undefined,
        state: validatedData.state || undefined,
        notes: formData.notes || undefined,
      };

      if (supplier) {
        onSave({ id: supplier.id, ...dataToSave });
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
          <DialogTitle>{supplier ? "Editar" : "Adicionar"} Fornecedor</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="general">Dados Gerais</TabsTrigger>
              <TabsTrigger value="address">Endereços</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Fornecedor *</Label>
                  <Select value={supplierType} onValueChange={(value: any) => setSupplierType(value)}>
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
                    placeholder="Nome completo / Nome fantasia"
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

                {supplierType === "company" && (
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

                {supplierType === "individual" && (
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

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    placeholder="Observações sobre o fornecedor"
                  />
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
