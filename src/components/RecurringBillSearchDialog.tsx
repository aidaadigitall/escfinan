import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RecurringBillSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSearch: (filters: any) => void;
}

export const RecurringBillSearchDialog = ({ open, onOpenChange, onSearch }: RecurringBillSearchDialogProps) => {
  const [filters, setFilters] = useState({
    description: "",
    type: "",
    recurrence_type: "",
    minAmount: "",
    maxAmount: "",
  });

  const handleSearch = () => {
    onSearch(filters);
    onOpenChange(false);
  };

  const handleClear = () => {
    setFilters({
      description: "",
      type: "",
      recurrence_type: "",
      minAmount: "",
      maxAmount: "",
    });
    onSearch({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Busca Avançada</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="search-description">Descrição</Label>
            <Input
              id="search-description"
              value={filters.description}
              onChange={(e) => setFilters({ ...filters, description: e.target.value })}
              placeholder="Digite a descrição..."
            />
          </div>

          <div>
            <Label htmlFor="search-type">Tipo</Label>
            <Select value={filters.type} onValueChange={(value) => setFilters({ ...filters, type: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="income">Receita</SelectItem>
                <SelectItem value="expense">Despesa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="search-recurrence">Recorrência</Label>
            <Select value={filters.recurrence_type} onValueChange={(value) => setFilters({ ...filters, recurrence_type: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                <SelectItem value="daily">Diário</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="monthly">Mensal</SelectItem>
                <SelectItem value="yearly">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="search-min">Valor Mínimo</Label>
              <Input
                id="search-min"
                type="number"
                step="0.01"
                value={filters.minAmount}
                onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
                placeholder="0,00"
              />
            </div>
            <div>
              <Label htmlFor="search-max">Valor Máximo</Label>
              <Input
                id="search-max"
                type="number"
                step="0.01"
                value={filters.maxAmount}
                onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
                placeholder="0,00"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleClear}>
              Limpar
            </Button>
            <Button type="button" onClick={handleSearch}>
              Buscar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
