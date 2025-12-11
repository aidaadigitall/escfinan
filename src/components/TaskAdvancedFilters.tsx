import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Filter, X, Search, CalendarIcon, Tag, User, Flag, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskLabel } from "@/hooks/useTaskLabels";

interface TaskFilters {
  search: string;
  status: string;
  priority: string;
  responsibleId: string;
  labels: string[];
  startDate: Date | undefined;
  endDate: Date | undefined;
}

interface TaskAdvancedFiltersProps {
  filters: TaskFilters;
  onFiltersChange: (filters: TaskFilters) => void;
  labels: TaskLabel[];
  responsibles: { id: string; name: string }[];
}

const priorityOptions = [
  { value: "all", label: "Todas" },
  { value: "low", label: "Baixa" },
  { value: "medium", label: "Média" },
  { value: "high", label: "Alta" },
  { value: "urgent", label: "Urgente" },
];

const statusOptions = [
  { value: "all", label: "Todos" },
  { value: "pending", label: "Pendente" },
  { value: "in_progress", label: "Em Andamento" },
  { value: "completed", label: "Concluída" },
  { value: "cancelled", label: "Cancelada" },
];

export function TaskAdvancedFilters({
  filters,
  onFiltersChange,
  labels,
  responsibles,
}: TaskAdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const activeFiltersCount = [
    filters.search,
    filters.status !== "all" && filters.status,
    filters.priority !== "all" && filters.priority,
    filters.responsibleId !== "all" && filters.responsibleId,
    filters.labels.length > 0,
    filters.startDate,
    filters.endDate,
  ].filter(Boolean).length;

  const handleReset = () => {
    onFiltersChange({
      search: "",
      status: "all",
      priority: "all",
      responsibleId: "all",
      labels: [],
      startDate: undefined,
      endDate: undefined,
    });
  };

  const toggleLabel = (labelName: string) => {
    const newLabels = filters.labels.includes(labelName)
      ? filters.labels.filter((l) => l !== labelName)
      : [...filters.labels, labelName];
    onFiltersChange({ ...filters, labels: newLabels });
  };

  return (
    <div className="space-y-4">
      {/* Quick search bar */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tarefas..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="pl-10"
          />
        </div>

        <Select value={filters.status} onValueChange={(v) => onFiltersChange({ ...filters, status: v })}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.priority} onValueChange={(v) => onFiltersChange({ ...filters, priority: v })}>
          <SelectTrigger className="w-[150px]">
            <Flag className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            {priorityOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Mais Filtros
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[380px] p-4" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Filtros Avançados</h4>
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Limpar
                </Button>
              </div>

              {/* Responsible filter */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4" />
                  Responsável
                </Label>
                <Select
                  value={filters.responsibleId}
                  onValueChange={(v) => onFiltersChange({ ...filters, responsibleId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os responsáveis" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {responsibles.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Labels filter */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  <Tag className="h-4 w-4" />
                  Etiquetas
                </Label>
                <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto">
                  {labels.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Nenhuma etiqueta cadastrada</p>
                  ) : (
                    labels.map((label) => (
                      <Badge
                        key={label.id}
                        variant={filters.labels.includes(label.name) ? "default" : "outline"}
                        className="cursor-pointer transition-colors"
                        style={{
                          backgroundColor: filters.labels.includes(label.name) ? label.color : "transparent",
                          borderColor: label.color,
                          color: filters.labels.includes(label.name) ? "white" : label.color,
                        }}
                        onClick={() => toggleLabel(label.name)}
                      >
                        {label.name}
                      </Badge>
                    ))
                  )}
                </div>
              </div>

              {/* Date range filter */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  <CalendarIcon className="h-4 w-4" />
                  Período de Vencimento
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-start text-left font-normal text-xs h-9">
                        <CalendarIcon className="mr-2 h-3 w-3" />
                        {filters.startDate
                          ? format(filters.startDate, "dd/MM/yyyy", { locale: ptBR })
                          : "Data início"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-[9999]" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.startDate}
                        onSelect={(date) => onFiltersChange({ ...filters, startDate: date })}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-start text-left font-normal text-xs h-9">
                        <CalendarIcon className="mr-2 h-3 w-3" />
                        {filters.endDate
                          ? format(filters.endDate, "dd/MM/yyyy", { locale: ptBR })
                          : "Data fim"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-[9999]" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.endDate}
                        onSelect={(date) => onFiltersChange({ ...filters, endDate: date })}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="icon" onClick={handleReset} title="Limpar filtros">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Active filters badges */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              Busca: "{filters.search}"
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFiltersChange({ ...filters, search: "" })}
              />
            </Badge>
          )}
          {filters.responsibleId !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Responsável: {responsibles.find((r) => r.id === filters.responsibleId)?.name}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFiltersChange({ ...filters, responsibleId: "all" })}
              />
            </Badge>
          )}
          {filters.labels.map((label) => (
            <Badge key={label} variant="secondary" className="gap-1">
              <Tag className="h-3 w-3" />
              {label}
              <X className="h-3 w-3 cursor-pointer" onClick={() => toggleLabel(label)} />
            </Badge>
          ))}
          {filters.startDate && (
            <Badge variant="secondary" className="gap-1">
              De: {format(filters.startDate, "dd/MM/yyyy", { locale: ptBR })}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFiltersChange({ ...filters, startDate: undefined })}
              />
            </Badge>
          )}
          {filters.endDate && (
            <Badge variant="secondary" className="gap-1">
              Até: {format(filters.endDate, "dd/MM/yyyy", { locale: ptBR })}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFiltersChange({ ...filters, endDate: undefined })}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
