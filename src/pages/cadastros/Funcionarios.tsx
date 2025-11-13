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
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

interface Funcionario {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  cargo: string;
  departamento: string;
  dataAdmissao: string;
  salario: number;
  ativo: boolean;
}

const Funcionarios = () => {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    cpf: "",
    email: "",
    telefone: "",
    cargo: "",
    departamento: "",
    dataAdmissao: "",
    salario: 0,
    ativo: true,
  });
  const [searchTerm, setSearchTerm] = useState("");

  const filteredFuncionarios = funcionarios.filter(
    (f) =>
      f.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.cpf.includes(searchTerm)
  );

  const handleOpenDialog = (funcionario?: Funcionario) => {
    if (funcionario) {
      setEditingId(funcionario.id);
      setFormData({
        nome: funcionario.nome,
        cpf: funcionario.cpf,
        email: funcionario.email,
        telefone: funcionario.telefone,
        cargo: funcionario.cargo,
        departamento: funcionario.departamento,
        dataAdmissao: funcionario.dataAdmissao,
        salario: funcionario.salario,
        ativo: funcionario.ativo,
      });
    } else {
      setEditingId(null);
      setFormData({
        nome: "",
        cpf: "",
        email: "",
        telefone: "",
        cargo: "",
        departamento: "",
        dataAdmissao: "",
        salario: 0,
        ativo: true,
      });
    }
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.nome || !formData.cpf) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    if (editingId) {
      setFuncionarios(
        funcionarios.map((f) =>
          f.id === editingId ? { ...f, ...formData } : f
        )
      );
      toast.success("Funcionário atualizado com sucesso");
    } else {
      const newFuncionario: Funcionario = {
        id: Date.now().toString(),
        ...formData,
      };
      setFuncionarios([...funcionarios, newFuncionario]);
      toast.success("Funcionário criado com sucesso");
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setFuncionarios(funcionarios.filter((f) => f.id !== id));
    toast.success("Funcionário deletado com sucesso");
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Funcionários</h1>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Funcionário
        </Button>
      </div>

      <Card className="mb-6">
        <div className="p-4 border-b flex items-center gap-2">
          <Search className="h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por nome ou CPF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-0"
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Departamento</TableHead>
              <TableHead>Data Admissão</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFuncionarios.map((funcionario) => (
              <TableRow key={funcionario.id}>
                <TableCell>{funcionario.nome}</TableCell>
                <TableCell>{funcionario.cpf}</TableCell>
                <TableCell>{funcionario.email}</TableCell>
                <TableCell>{funcionario.cargo}</TableCell>
                <TableCell>{funcionario.departamento}</TableCell>
                <TableCell>
                  {new Date(funcionario.dataAdmissao).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      funcionario.ativo
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {funcionario.ativo ? "Ativo" : "Inativo"}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(funcionario)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(funcionario.id)}
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
              {editingId ? "Editar Funcionário" : "Novo Funcionário"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Nome *</label>
                <Input
                  value={formData.nome}
                  onChange={(e) =>
                    setFormData({ ...formData, nome: e.target.value })
                  }
                  placeholder="Nome completo"
                />
              </div>

              <div>
                <label className="text-sm font-medium">CPF *</label>
                <Input
                  value={formData.cpf}
                  onChange={(e) =>
                    setFormData({ ...formData, cpf: e.target.value })
                  }
                  placeholder="000.000.000-00"
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
                <label className="text-sm font-medium">Cargo</label>
                <Input
                  value={formData.cargo}
                  onChange={(e) =>
                    setFormData({ ...formData, cargo: e.target.value })
                  }
                  placeholder="Cargo"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Departamento</label>
                <Input
                  value={formData.departamento}
                  onChange={(e) =>
                    setFormData({ ...formData, departamento: e.target.value })
                  }
                  placeholder="Departamento"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Data de Admissão</label>
                <Input
                  type="date"
                  value={formData.dataAdmissao}
                  onChange={(e) =>
                    setFormData({ ...formData, dataAdmissao: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium">Salário</label>
                <Input
                  type="number"
                  value={formData.salario}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      salario: parseFloat(e.target.value),
                    })
                  }
                  placeholder="0.00"
                  step="0.01"
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

export default Funcionarios;
