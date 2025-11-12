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
import { useState, useCallback } from "react";

interface AdvancedSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSearch: (filters: any) => void; // Adicionar prop para a função de busca
  onClear: () => void; // Adicionar prop para a função de limpar
}

interface SearchFilters {
  entity: string;
  client: string;
  startDate: string;
  endDate: string;
  competenceStartDate: string;
  competenceEndDate: string;
  description: string;
  movement: string;
  minValue: number | string;
  maxValue: number | string;
  account: string;
  status: string;
  costCenter: string;
  bank: string;
  payment: string;
  showPrevious: boolean;
  showTransfers: boolean;
}

export const AdvancedSearchDialog = ({ open, onOpenChange, onSearch, onClear }: AdvancedSearchDialogProps) => {
  const [filters, setFilters] = useState<SearchFilters>({
    entity: "todos",
    client: "",
    startDate: "2025-11-01", // Valores default para o período
    endDate: "2025-11-30",
    competenceStartDate: "",
    competenceEndDate: "",
    description: "",
    movement: "todas",
    minValue: "",
    maxValue: "",
    account: "todos",
    status: "todos",
    costCenter: "todos",
    bank: "todos",
    payment: "todos",
    showPrevious: false,
    showTransfers: true,
  });

  const handleFilterChange = useCallback((key: keyof SearchFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSearch = () => {
    onSearch(filters);
    onOpenChange(false);
  };

  const handleClear = () => {
    setFilters({
      entity: "todos",
      client: "",
      startDate: "",
      endDate: "",
      competenceStartDate: "",
      competenceEndDate: "",
      description: "",
      movement: "todas",
      minValue: "",
      maxValue: "",
      account: "todos",
      status: "todos",
      costCenter: "todos",
      bank: "todos",
      payment: "todos",
      showPrevious: false,
      showTransfers: true,
    });
    onClear();
    onOpenChange(false);
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
            <Select value={filters.entity} onValueChange={(value) => handleFilterChange("entity", value)}>
              <SelectTrigger id="entity">
                <SelectValue placeholder="Todos" />
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
            <Input id="client" placeholder="Digite para buscar" value={filters.client} onChange={(e) => handleFilterChange("client", e.target.value)} />
          </div>

          {/* Período */}
          <div className="space-y-2">
            <Label>Período</Label>
            <div className="flex gap-2 items-center">
              <Input type="date" value={filters.startDate} onChange={(e) => handleFilterChange("startDate", e.target.value)} />
              <span>a</span>
              <Input type="date" value={filters.endDate} onChange={(e) => handleFilterChange("endDate", e.target.value)} />
            </div>
          </div>

          {/* Data de competência */}
          <div className="space-y-2">
            <Label>Data de competência</Label>
            <div className="flex gap-2 items-center">
              <Input type="date" placeholder="Data inicial" value={filters.competenceStartDate} onChange={(e) => handleFilterChange("competenceStartDate", e.target.value)} />
              <span>a</span>
              <Input type="date" placeholder="Data final" value={filters.competenceEndDate} onChange={(e) => handleFilterChange("competenceEndDate", e.target.value)} />
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input id="description" value={filters.description} onChange={(e) => handleFilterChange("description", e.target.value)} />
          </div>

          {/* Movimentação */}
          <div className="space-y-2">
            <Label htmlFor="movement">Movimentação</Label>
            <Select value={filters.movement} onValueChange={(value) => handleFilterChange("movement", value)}>
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
              <Input type="number" placeholder="Mínimo" value={filters.minValue} onChange={(e) => handleFilterChange("minValue", e.target.value)} />
              <span>a</span>
              <Input type="number" placeholder="Máximo" value={filters.maxValue} onChange={(e) => handleFilterChange("maxValue", e.target.value)} />
            </div>
          </div>

          {/* Plano de contas */}
          <div className="space-y-2">
            <Label htmlFor="account">Plano de contas</Label>
            <Select value={filters.account} onValueChange={(value) => handleFilterChange("account", value)}>
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
            <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
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
            <Select value={filters.costCenter} onValueChange={(value) => handleFilterChange("costCenter", value)}>
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
            <Select value={filters.bank} onValueChange={(value) => handleFilterChange("bank", value)}>
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
            <Select value={filters.payment} onValueChange={(value) => handleFilterChange("payment", value)}>
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
            <Checkbox id="show-previous" checked={filters.showPrevious} onCheckedChange={(checked) => handleFilterChange("showPrevious", checked)} />
            <Label htmlFor="show-previous" className="cursor-pointer">
              Mostrar saldo anterior
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="show-transfers" checked={filters.showTransfers} onCheckedChange={(checked) => handleFilterChange("showTransfers", checked)} />
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
