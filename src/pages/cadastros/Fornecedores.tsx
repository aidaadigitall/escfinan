import { useState } from "react";
import { useSuppliers, Supplier } from "@/hooks/useSuppliers";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const Fornecedores = () => {
  const { suppliers, isLoading, createSupplier, updateSupplier, deleteSupplier } = useSuppliers();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [loadingCep, setLoadingCep] = useState(false);
  const [loadingCnpj, setLoadingCnpj] = useState(false);
  const [formData, setFormData] = useState({
    cnpj: "",
    name: "",
    email: "",
    phone: "",
    zip_code: "",
    address: "",
    city: "",
    state: "",
    is_active: true,
  });
  const [searchTerm, setSearchTerm] = useState("");

  const filteredSuppliers = suppliers.filter(
    (f) =>
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.cnpj.includes(searchTerm)
  );

  const handleCepChange = async (value: string) => {
    const cepNumbers = value.replace(/\D/g, "");
    setFormData({ ...formData, zip_code: value });

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
            address: `${data.logradouro}, ${data.numero}`,
            city: data.municipio,
            state: data.uf,
            zip_code: data.cep,
            phone: data.ddd_telefone_1 || ''
          }));
          toast.success("CNPJ encontrado com sucesso");
        } else {
          toast.error("CNPJ não encontrado");
        }
      } catch (error) {
        toast.error("Erro ao buscar CNPJ");
      } finally {
        setLoadingCnpj(false);
      }
    }
  };

  const handleOpenDialog = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({
        cnpj: supplier.cnpj,
        name: supplier.name,
        email: supplier.email,
        phone: supplier.phone || "",
        zip_code: supplier.zipcode || "",
        address: supplier.address || "",
        city: supplier.city || "",
        state: supplier.state || "",
        is_active: supplier.is_active,
      });
    } else {
      setEditingSupplier(null);
      setFormData({
        cnpj: "",
        name: "",
        email: "",
        phone: "",
        zip_code: "",
        address: "",
        city: "",
        state: "",
        is_active: true,
      });
    }
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.cnpj || !formData.name) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    const dataToSave = {
      cnpj: formData.cnpj,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      zip_code: formData.zip_code,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      is_active: formData.is_active,
    };

    if (editingSupplier) {
      updateSupplier({ id: editingSupplier.id, ...dataToSave });
    } else {
      createSupplier(dataToSave);
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este fornecedor?")) {
      deleteSupplier(id);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Fornecedores</h1>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Fornecedor
        </Button>
      </div>

      <Card className="mb-6">
        <div className="p-4 border-b flex items-center gap-2">
          <Search className="h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por nome ou CNPJ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-0"
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>CNPJ</TableHead>
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
            ) : filteredSuppliers.map((fornecedor) => (
              <TableRow key={fornecedor.id}>
                <TableCell>{fornecedor.name}</TableCell>
                <TableCell>{fornecedor.cnpj}</TableCell>
                <TableCell>{fornecedor.email}</TableCell>
                <TableCell>{fornecedor.phone}</TableCell>
                <TableCell>{fornecedor.city}</TableCell>
                <TableCell>
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      fornecedor.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {fornecedor.is_active ? "Ativo" : "Inativo"}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(fornecedor)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(fornecedor.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
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
              {editingSupplier ? "Editar Fornecedor" : "Novo Fornecedor"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">CNPJ *</label>
                <div className="flex gap-2">
                  <Input
                    value={formData.cnpj}
                    onChange={(e) => handleCnpjChange(e.target.value)}
                    placeholder="00.000.000/0000-00"
                  />
                  {loadingCnpj && <Loader className="h-5 w-5 animate-spin" />}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Nome *</label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Nome da empresa"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Telefone</label>
                <Input
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="(11) 98765-4321"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">CEP</label>
                <div className="flex gap-2">
                  <Input
                    value={formData.zip_code}
                    onChange={(e) => handleCepChange(e.target.value)}
                    placeholder="00000-000"
                  />
                  {loadingCep && <Loader className="h-5 w-5 animate-spin" />}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Endereço</label>
                <Input
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="Rua..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Cidade</label>
                <Input
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  placeholder="Cidade"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Estado</label>
                <Input
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({ ...formData, state: e.target.value })
                  }
                  placeholder="SP"
                  maxLength={2}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
                id="is_active"
              />
              <label htmlFor="is_active" className="text-sm font-medium">
                Ativo
              </label>
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
    </div>
  );
};

export default Fornecedores;
