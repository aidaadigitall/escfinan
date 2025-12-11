import { useState, useEffect } from "react";
import { useClients, Client } from "@/hooks/useClients";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Search, Loader } from "lucide-react";
import { toast } from "sonner";
import { MaskedInput } from "@/components/ui/masked-input";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { AdvancedSearchBar, AdvancedFilters } from "@/components/AdvancedSearchBar";

const Clientes = () => {
  const { clients, isLoading, createClient, updateClient, deleteClient } = useClients();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [loadingCep, setLoadingCep] = useState(false);
  const [loadingCnpj, setLoadingCnpj] = useState(false);
  const [formData, setFormData] = useState<Partial<Client> & { document_type?: string }>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);

  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({ type: "all", status: "all" });

  const applyClientFilters = (c: Client) => {
    // Texto livre
    const textMatch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.cnpj && c.cnpj.includes(searchTerm)) ||
      (c.cpf && c.cpf.includes(searchTerm));

    // Tipo
    const typeOk =
      advancedFilters.type === "all" ||
      (advancedFilters.type === "pf" && !!c.cpf) ||
      (advancedFilters.type === "pj" && !!c.cnpj);

    // Código (usa id)
    const codeOk = !advancedFilters.code || (c.id || "").toString().includes(advancedFilters.code);

    // Campos específicos
    const nameOk = !advancedFilters.name || c.name.toLowerCase().includes(advancedFilters.name.toLowerCase());
    const docOk = !advancedFilters.cpfCnpj || (c.cpf || c.cnpj || "").includes(advancedFilters.cpfCnpj);
    const phoneOk = !advancedFilters.phone || (c.phone || "").includes(advancedFilters.phone);
    const emailOk = !advancedFilters.email || (c.email || "").toLowerCase().includes(advancedFilters.email.toLowerCase());
    const cityOk = !advancedFilters.city || (c.city || "").toLowerCase().includes(advancedFilters.city.toLowerCase());
    const stateOk = !advancedFilters.state || (c.state || "").toLowerCase().includes(advancedFilters.state.toLowerCase());

    // Status
    const statusOk =
      advancedFilters.status === "all" ||
      (advancedFilters.status === "active" && !!c.is_active) ||
      (advancedFilters.status === "inactive" && !c.is_active);

    return textMatch && typeOk && codeOk && nameOk && docOk && phoneOk && emailOk && cityOk && stateOk && statusOk;
  };

  const filteredClients = clients.filter(applyClientFilters);

  useEffect(() => {
    if (editingClient) {
      setFormData({
        ...editingClient,
        document_type: editingClient.cpf ? "cpf" : "cnpj",
      });
    } else {
      setFormData({
        name: "",
        cpf: "",
        cnpj: "",
        email: "",
        phone: "",
        zipcode: "",
        address: "",
        city: "",
        state: "",
        is_active: true,
        document_type: "cpf",
      });
    }
  }, [editingClient]);

  const handleCepChange = async (value: string) => {
    const cepNumbers = value.replace(/\D/g, "");
    setFormData({ ...formData, zipcode: value });

    if (cepNumbers.length === 8) {
      setLoadingCep(true);
      try {
        const response = await fetch(
          `https://viacep.com.br/ws/${cepNumbers}/json/`
        );
        const data = await response.json();

        if (!data.erro) {
          setFormData((prev) => ({
            ...prev,
            address: data.logradouro,
            city: data.localidade,
            state: data.uf,
          }));
          toast.success("CEP encontrado com sucesso");
        } else {
          toast.error("CEP não encontrado");
        }
      } catch (error) {
        toast.error("Erro ao buscar CEP");
      } finally {
        setLoadingCep(false);
      }
    }
  };

  const handleCnpjChange = async (value: string) => {
    const cnpjNumbers = value.replace(/\D/g, "");
    setFormData({ ...formData, cnpj: value });

    if (cnpjNumbers.length === 14) {
      setLoadingCnpj(true);
      try {
        const response = await fetch(
          `https://brasilapi.com.br/api/cnpj/v1/${cnpjNumbers}`
        );
        const data = await response.json();

        if (data.razao_social) {
          setFormData((prev) => ({
            ...prev,
            name: data.razao_social,
            company_name: data.razao_social,
            address: `${data.logradouro}, ${data.numero}`,
            city: data.municipio,
            state: data.uf,
            zipcode: data.cep,
            phone: data.ddd_telefone_1,
          }));
          toast.success("CNPJ encontrado com sucesso");
        } else {
          toast.error("CNPJ não encontrado ou inválido");
        }
      } catch (error) {
        toast.error("Erro ao buscar CNPJ");
      } finally {
        setLoadingCnpj(false);
      }
    }
  };

  const handleOpenDialog = (cliente?: Client) => {
    setEditingClient(cliente || null);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name) {
      toast.error("Preencha o nome do cliente");
      return;
    }

    const dataToSave = {
      name: formData.name,
      company_name: formData.company_name,
      cpf: formData.document_type === "cpf" ? formData.cpf : null,
      cnpj: formData.document_type === "cnpj" ? formData.cnpj : null,
      email: formData.email,
      phone: formData.phone,
      zipcode: formData.zipcode,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      is_active: formData.is_active ?? true,
    };

    if (editingClient) {
      updateClient({ id: editingClient.id, ...dataToSave });
    } else {
      createClient(dataToSave as any);
    }
    setDialogOpen(false);
  };

  const handleDeleteClick = (id: string) => {
    setClientToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (clientToDelete) {
      deleteClient(clientToDelete);
      toast.success("Cliente excluído com sucesso!");
    }
    setDeleteDialogOpen(false);
    setClientToDelete(null);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Clientes</h1>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      <Card className="mb-6">
        <div className="p-4 border-b flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, CPF ou CNPJ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-0"
          />
        </div>

        <AdvancedSearchBar
          entity="client"
          onApply={(f) => setAdvancedFilters(f)}
          onClear={() => setAdvancedFilters({ type: "all", status: "all" })}
        />

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>CPF/CNPJ</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Cidade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  <Loader className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : filteredClients.map((cliente) => (
              <TableRow key={cliente.id}>
                <TableCell>{cliente.name}</TableCell>
                <TableCell>{cliente.cpf || cliente.cnpj}</TableCell>
                <TableCell>{cliente.email}</TableCell>
                <TableCell>{cliente.phone}</TableCell>
                <TableCell>{cliente.city}</TableCell>
                <TableCell>
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      cliente.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {cliente.is_active ? "Ativo" : "Inativo"}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(cliente)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(cliente.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingClient ? "Editar Cliente" : "Novo Cliente"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Tipo de Documento</Label>
              <RadioGroup
                value={formData.document_type || "cpf"}
                onValueChange={(value) => setFormData({ ...formData, document_type: value, cpf: "", cnpj: "" })}
                className="flex gap-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cpf" id="cpf" />
                  <Label htmlFor="cpf" className="cursor-pointer">CPF (Pessoa Física)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cnpj" id="cnpj" />
                  <Label htmlFor="cnpj" className="cursor-pointer">CNPJ (Pessoa Jurídica)</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {formData.document_type === "cpf" ? (
                <div>
                  <Label>CPF</Label>
                  <MaskedInput
                    mask="cpf"
                    value={formData.cpf || ""}
                    onChange={(value) => setFormData({ ...formData, cpf: value })}
                    placeholder="000.000.000-00"
                  />
                </div>
              ) : (
                <div>
                  <Label>CNPJ *</Label>
                  <div className="flex gap-2">
                    <MaskedInput
                      mask="cnpj"
                      value={formData.cnpj || ""}
                      onChange={(value) => handleCnpjChange(value)}
                      placeholder="00.000.000/0000-00"
                    />
                    {loadingCnpj && <Loader className="h-5 w-5 animate-spin" />}
                  </div>
                </div>
              )}

              <div>
                <Label>Nome *</Label>
                <Input
                  value={formData.name || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Nome do cliente"
                />
              </div>
            </div>

            {formData.document_type === "cnpj" && (
              <div>
                <Label>Razão Social</Label>
                <Input
                  value={formData.company_name || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, company_name: e.target.value })
                  }
                  placeholder="Razão Social da empresa"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <Label>Telefone</Label>
                <MaskedInput
                  mask="phone"
                  value={formData.phone || ""}
                  onChange={(value) => setFormData({ ...formData, phone: value })}
                  placeholder="(11) 98765-4321"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>CEP</Label>
                <div className="flex gap-2">
                  <MaskedInput
                    mask="cep"
                    value={formData.zipcode || ""}
                    onChange={(value) => handleCepChange(value)}
                    placeholder="00000-000"
                  />
                  {loadingCep && <Loader className="h-5 w-5 animate-spin" />}
                </div>
              </div>

              <div>
                <Label>Endereço</Label>
                <Input
                  value={formData.address || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="Rua..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cidade</Label>
                <Input
                  value={formData.city || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  placeholder="Cidade"
                />
              </div>

              <div>
                <Label>Estado</Label>
                <Input
                  value={formData.state || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, state: e.target.value })
                  }
                  placeholder="SP"
                  maxLength={2}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: !!checked })
                }
                id="is_active"
              />
              <Label htmlFor="is_active">Ativo</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Excluir Cliente"
        description="Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={handleConfirmDelete}
        variant="destructive"
      />
    </div>
  );
};

export default Clientes;
