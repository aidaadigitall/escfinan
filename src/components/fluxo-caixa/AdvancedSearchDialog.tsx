import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface AdvancedSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AdvancedSearchDialog = ({ open, onOpenChange }: AdvancedSearchDialogProps) => {
  const handleSearch = () => {
    toast.success("Pesquisa realizada com sucesso");
    onOpenChange(false);
  };

  const handleClear = () => {
    toast.info("Filtros limpos");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Busca Avançada - Fluxo de Caixa</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* Entidade */}
          <div className="space-y-2">
            <Label htmlFor="entity">Entidade</Label>
            <Select>
              <SelectTrigger id="entity">
                <SelectValue placeholder="Cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cliente">Cliente</SelectItem>
                <SelectItem value="fornecedor">Fornecedor</SelectItem>
                <SelectItem value="todos">Todos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Cliente */}
          <div className="space-y-2">
            <Label htmlFor="client">Cliente</Label>
            <Input id="client" placeholder="Digite para buscar" />
          </div>

          {/* Período */}
          <div className="space-y-2">
            <Label>Período</Label>
            <div className="flex gap-2 items-center">
              <Input type="date" defaultValue="2025-11-01" />
              <span>a</span>
              <Input type="date" defaultValue="2025-11-30" />
            </div>
          </div>

          {/* Data de competência */}
          <div className="space-y-2">
            <Label>Data de competência</Label>
            <div className="flex gap-2 items-center">
              <Input type="date" placeholder="Data inicial" />
              <span>a</span>
              <Input type="date" placeholder="Data final" />
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input id="description" />
          </div>

          {/* Movimentação */}
          <div className="space-y-2">
            <Label htmlFor="movement">Movimentação</Label>
            <Select>
              <SelectTrigger id="movement">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="receitas">Receitas</SelectItem>
                <SelectItem value="despesas">Despesas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Valor */}
          <div className="space-y-2">
            <Label>Valor</Label>
            <div className="flex gap-2 items-center">
              <Input type="number" placeholder="Mínimo" />
              <span>a</span>
              <Input type="number" placeholder="Máximo" />
            </div>
          </div>

          {/* Plano de contas */}
          <div className="space-y-2">
            <Label htmlFor="account">Plano de contas</Label>
            <Select>
              <SelectTrigger id="account">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="servicos">Contratos de serviços</SelectItem>
                <SelectItem value="consumo">Contas de consumo</SelectItem>
                <SelectItem value="salarios">Salário</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Situação */}
          <div className="space-y-2">
            <Label htmlFor="status">Situação</Label>
            <Select>
              <SelectTrigger id="status">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="confirmada">Confirmada</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="atrasado">Atrasado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Centro de custo */}
          <div className="space-y-2">
            <Label htmlFor="cost-center">Centro de custo</Label>
            <Select>
              <SelectTrigger id="cost-center">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="tech">Assistência Técnica</SelectItem>
                <SelectItem value="admin">Administrativo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Conta bancária */}
          <div className="space-y-2">
            <Label htmlFor="bank">Conta bancária</Label>
            <Select>
              <SelectTrigger id="bank">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="principal">Conta Principal</SelectItem>
                <SelectItem value="poupanca">Poupança</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Forma de pagamento */}
          <div className="space-y-2">
            <Label htmlFor="payment">Forma de pagamento</Label>
            <Select>
              <SelectTrigger id="payment">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="boleto">Boleto</SelectItem>
                <SelectItem value="cartao">Cartão</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Checkboxes */}
        <div className="flex gap-6">
          <div className="flex items-center space-x-2">
            <Checkbox id="show-previous" />
            <Label htmlFor="show-previous" className="cursor-pointer">
              Mostrar saldo anterior
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="show-transfers" defaultChecked />
            <Label htmlFor="show-transfers" className="cursor-pointer">
              Exibir transferências
            </Label>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 justify-start pt-4">
          <Button onClick={handleSearch} className="bg-success text-success-foreground hover:bg-success/90">
            Buscar
          </Button>
          <Button variant="destructive" onClick={handleClear}>
            Limpar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
