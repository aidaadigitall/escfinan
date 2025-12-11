import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronUp, Search } from "lucide-react";

export type AdvancedEntity = "client" | "supplier";

export interface AdvancedFilters {
  type?: "all" | "pf" | "pj";
  code?: string;
  name?: string;
  cpfCnpj?: string;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
  responsible?: string;
  status?: "all" | "active" | "inactive";
}

interface AdvancedSearchBarProps {
  entity: AdvancedEntity;
  onApply: (filters: AdvancedFilters) => void;
  onClear: () => void;
}

export const AdvancedSearchBar = ({ entity, onApply, onClear }: AdvancedSearchBarProps) => {
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<AdvancedFilters>({ type: "all", status: "all" });

  const handleApply = () => onApply(filters);
  const handleClear = () => {
    const cleared = { type: "all", status: "all" } as AdvancedFilters;
    setFilters(cleared);
    onClear();
  };

  return (
    <div className="p-4 border-b">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Button variant="ghost" onClick={() => setOpen(!open)} className="px-2">
            {open ? (<ChevronUp className="h-4 w-4 mr-2" />) : (<ChevronDown className="h-4 w-4 mr-2" />)}
            Busca avançada
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="default" onClick={handleApply} className="bg-emerald-600 hover:bg-emerald-700">Buscar</Button>
          <Button variant="destructive" onClick={handleClear}>Limpar</Button>
        </div>
      </div>

      {open && (
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium">Tipo</label>
            <Select value={filters.type} onValueChange={(value) => setFilters({ ...filters, type: value as any })}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pf">Pessoa Física</SelectItem>
                <SelectItem value="pj">Pessoa Jurídica</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Código</label>
            <Input value={filters.code || ""} onChange={(e) => setFilters({ ...filters, code: e.target.value })} placeholder="Digite para buscar" />
          </div>

          <div>
            <label className="text-sm font-medium">Nome</label>
            <Input value={filters.name || ""} onChange={(e) => setFilters({ ...filters, name: e.target.value })} placeholder="Digite para buscar" />
          </div>

          <div>
            <label className="text-sm font-medium">CPF/CNPJ</label>
            <Input value={filters.cpfCnpj || ""} onChange={(e) => setFilters({ ...filters, cpfCnpj: e.target.value })} placeholder="Digite para buscar" />
          </div>

          <div>
            <label className="text-sm font-medium">Telefone/Celular</label>
            <Input value={filters.phone || ""} onChange={(e) => setFilters({ ...filters, phone: e.target.value })} placeholder="Digite para buscar" />
          </div>

          <div>
            <label className="text-sm font-medium">E-mail</label>
            <Input value={filters.email || ""} onChange={(e) => setFilters({ ...filters, email: e.target.value })} placeholder="Digite para buscar" />
          </div>

          <div>
            <label className="text-sm font-medium">Cidade</label>
            <Input value={filters.city || ""} onChange={(e) => setFilters({ ...filters, city: e.target.value })} placeholder="Digite para buscar" />
          </div>

          <div>
            <label className="text-sm font-medium">Estado</label>
            <Input value={filters.state || ""} onChange={(e) => setFilters({ ...filters, state: e.target.value })} placeholder="SP" maxLength={2} />
          </div>

          <div>
            <label className="text-sm font-medium">Situação</label>
            <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value as any })}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
};
