import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { PipelineStage } from "@/hooks/usePipelineStages";
import { LeadSource } from "@/hooks/useLeadSources";
import { Filter, X, Calendar as CalendarIcon, Search } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export interface LeadFilters {
  search: string;
  source: string | null;
  stageId: string | null;
  status: string | null;
  dateFrom: Date | null;
  dateTo: Date | null;
  minValue: number | null;
  maxValue: number | null;
}

interface CRMFiltersProps {
  filters: LeadFilters;
  onFiltersChange: (filters: LeadFilters) => void;
  stages: PipelineStage[];
  sources: LeadSource[];
}

const defaultSources = [
  { value: "manual", label: "Manual" },
  { value: "website", label: "Website" },
  { value: "indication", label: "Indicação" },
  { value: "cold_call", label: "Cold Call" },
  { value: "social_media", label: "Redes Sociais" },
  { value: "event", label: "Evento" },
];

const statusOptions = [
  { value: "new", label: "Novo" },
  { value: "contacted", label: "Contatado" },
  { value: "qualified", label: "Qualificado" },
  { value: "proposal", label: "Proposta" },
  { value: "negotiation", label: "Negociação" },
  { value: "won", label: "Ganho" },
  { value: "lost", label: "Perdido" },
];

export const CRMFilters = ({
  filters,
  onFiltersChange,
  stages,
  sources,
}: CRMFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const updateFilter = <K extends keyof LeadFilters>(
    key: K,
    value: LeadFilters[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: "",
      source: null,
      stageId: null,
      status: null,
      dateFrom: null,
      dateTo: null,
      minValue: null,
      maxValue: null,
    });
  };

  const activeFiltersCount = [
    filters.source,
    filters.stageId,
    filters.status,
    filters.dateFrom,
    filters.dateTo,
    filters.minValue,
    filters.maxValue,
  ].filter(Boolean).length;

  // Combinar fontes padrão com fontes personalizadas
  const allSources = [
    ...defaultSources,
    ...sources.map((s) => ({ value: s.name, label: s.name })),
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Busca por texto */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, empresa, email..."
          value={filters.search}
          onChange={(e) => updateFilter("search", e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Filtro de Estágio (rápido) */}
      <Select
        value={filters.stageId || "all"}
        onValueChange={(value) =>
          updateFilter("stageId", value === "all" ? null : value)
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Todos os estágios" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os estágios</SelectItem>
          {stages.map((stage) => (
            <SelectItem key={stage.id} value={stage.id}>
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: stage.color }}
                />
                {stage.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Filtros avançados */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filtros
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Filtros Avançados</h4>
              {activeFiltersCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-8 px-2 text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Limpar
                </Button>
              )}
            </div>

            {/* Origem */}
            <div className="space-y-2">
              <Label>Origem</Label>
              <Select
                value={filters.source || "all"}
                onValueChange={(value) =>
                  updateFilter("source", value === "all" ? null : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as origens" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as origens</SelectItem>
                  {allSources.map((source) => (
                    <SelectItem key={source.value} value={source.value}>
                      {source.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={filters.status || "all"}
                onValueChange={(value) =>
                  updateFilter("status", value === "all" ? null : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Data de criação */}
            <div className="space-y-2">
              <Label>Período de criação</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "flex-1 justify-start text-left font-normal",
                        !filters.dateFrom && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateFrom
                        ? format(filters.dateFrom, "dd/MM/yy", { locale: ptBR })
                        : "De"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateFrom || undefined}
                      onSelect={(date) => updateFilter("dateFrom", date || null)}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "flex-1 justify-start text-left font-normal",
                        !filters.dateTo && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateTo
                        ? format(filters.dateTo, "dd/MM/yy", { locale: ptBR })
                        : "Até"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateTo || undefined}
                      onSelect={(date) => updateFilter("dateTo", date || null)}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Valor esperado */}
            <div className="space-y-2">
              <Label>Valor esperado (R$)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Mínimo"
                  value={filters.minValue || ""}
                  onChange={(e) =>
                    updateFilter(
                      "minValue",
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                  className="flex-1"
                />
                <Input
                  type="number"
                  placeholder="Máximo"
                  value={filters.maxValue || ""}
                  onChange={(e) =>
                    updateFilter(
                      "maxValue",
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Tags de filtros ativos */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-1 items-center">
          {filters.source && (
            <Badge variant="secondary" className="gap-1">
              Origem: {filters.source}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => updateFilter("source", null)}
              />
            </Badge>
          )}
          {filters.status && (
            <Badge variant="secondary" className="gap-1">
              Status: {statusOptions.find((s) => s.value === filters.status)?.label}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => updateFilter("status", null)}
              />
            </Badge>
          )}
          {(filters.dateFrom || filters.dateTo) && (
            <Badge variant="secondary" className="gap-1">
              Data: {filters.dateFrom ? format(filters.dateFrom, "dd/MM", { locale: ptBR }) : "..."} - {filters.dateTo ? format(filters.dateTo, "dd/MM", { locale: ptBR }) : "..."}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => {
                  updateFilter("dateFrom", null);
                  updateFilter("dateTo", null);
                }}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export const defaultFilters: LeadFilters = {
  search: "",
  source: null,
  stageId: null,
  status: null,
  dateFrom: null,
  dateTo: null,
  minValue: null,
  maxValue: null,
};
