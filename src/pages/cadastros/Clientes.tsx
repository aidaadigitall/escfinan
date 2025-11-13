import { useState } from "react";
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

interface Cliente {
  id: string;
  cnpj: string;
  nome: string;
  email: string;
  telefone: string;
  cep: string;
  endereco: string;
  cidade: string;
  estado: string;
  ativo: boolean;
}

const Clientes = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loadingCep, setLoadingCep] = useState(false);
  const [loadingCnpj, setLoadingCnpj] = useState(false);
  const [formData, setFormData] = useState({
    cnpj: "",
    nome: "",
    email: "",
    telefone: "",
    cep: "",
    endereco: "",
    cidade: "",
    estado: "",
    ativo: true,
  });
  const [searchTerm, setSearchTerm] = useState("");

  const filteredClientes = clientes.filter(
    (c) =>
      c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.cnpj.includes(searchTerm)
  );

  // Buscar dados do CEP automaticamente
  const handleCepChange = async (value: string) => {
    const cepNumbers = value.replace(/\D/g, "");
    setFormData({ ...formData, cep: value });

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
            endereco: data.logradouro,
            cidade: data.localidade,
            estado: data.uf,
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

  // Buscar dados do CNPJ automaticamente
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

        if (data.name) {
          setFormData((prev) => ({
            ...prev,
            nome: data.name,
            endereco: `${data.street}, ${data.number}`,
            cidade: data.city,
            estado: data.state,
            cep: data.zip_code,
          }));
          toast.success("CNPJ encontrado com sucesso");
        }
      } catch (error) {
        toast.error("Erro ao buscar CNPJ");
      } finally {
        setLoadingCnpj(false);
      }
    }
  };

  const handleOpenDialog = (cliente?: Cliente) => {
    if (cliente) {
      setEditingId(cliente.id);
      setFormData({
        cnpj: cliente.cnpj,
        nome: cliente.nome,
        email: cliente.email,
        telefone: cliente.telefone,
        cep: cliente.cep,
        endereco: cliente.endereco,
        cidade: cliente.cidade,
        estado: cliente.estado,
        ativo: cliente.ativo,
      });
    } else {
      setEditingId(null);
      setFormData({
        cnpj: "",
        nome: "",
        email: "",
        telefone: "",
        cep: "",
        endereco: "",
        cidade: "",
        estado: "",
        ativo: true,
      });
    }
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.cnpj || !formData.nome) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    if (editingId) {
      setClientes(
        clientes.map((c) =>
          c.id === editingId ? { ...c, ...formData } : c
        )
      );
      toast.success("Cliente atualizado com sucesso");
    } else {
      const newCliente: Cliente = {
        id: Date.now().toString(),
        ...formData,
      };
      setClientes([...clientes, newCliente]);
      toast.success("Cliente criado com sucesso");
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setClientes(clientes.filter((c) => c.id !== id));
    toast.success("Cliente deletado com sucesso");
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
            {filteredClientes.map((cliente) => (
              <TableRow key={cliente.id}>
                <TableCell>{cliente.nome}</TableCell>
                <TableCell>{cliente.cnpj}</TableCell>
                <TableCell>{cliente.email}</TableCell>
                <TableCell>{cliente.telefone}</TableCell>
                <TableCell>{cliente.cidade}</TableCell>
                <TableCell>
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      cliente.ativo
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {cliente.ativo ? "Ativo" : "Inativo"}
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
                      onClick={() => handleDelete(cliente.id)}
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
              {editingId ? "Editar Cliente" : "Novo Cliente"}
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
                  value={formData.nome}
                  onChange={(e) =>
                    setFormData({ ...formData, nome: e.target.value })
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
                  value={formData.telefone}
                  onChange={(e) =>
                    setFormData({ ...formData, telefone: e.target.value })
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
                    value={formData.cep}
                    onChange={(e) => handleCepChange(e.target.value)}
                    placeholder="00000-000"
                  />
                  {loadingCep && <Loader className="h-5 w-5 animate-spin" />}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Endereço</label>
                <Input
                  value={formData.endereco}
                  onChange={(e) =>
                    setFormData({ ...formData, endereco: e.target.value })
                  }
                  placeholder="Rua..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Cidade</label>
                <Input
                  value={formData.cidade}
                  onChange={(e) =>
                    setFormData({ ...formData, cidade: e.target.value })
                  }
                  placeholder="Cidade"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Estado</label>
                <Input
                  value={formData.estado}
                  onChange={(e) =>
                    setFormData({ ...formData, estado: e.target.value })
                  }
                  placeholder="SP"
                  maxLength={2}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.ativo}
                onChange={(e) =>
                  setFormData({ ...formData, ativo: e.target.checked })
                }
                id="ativo"
              />
              <label htmlFor="ativo" className="text-sm font-medium">
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

export default Clientes;
