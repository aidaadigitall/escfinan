import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, Calendar } from "lucide-react";
import { useState } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

const periods = [
  { label: "Hoje", value: "today" },
  { label: "Esta semana", value: "week" },
  { label: "Mês passado", value: "lastMonth" },
  { label: "Este mês", value: "thisMonth" },
  { label: "Próximo mês", value: "nextMonth" },
  { label: "Todo o período", value: "all" },
  { label: "Escolha o período", value: "custom" },
];

interface PeriodSelectorProps {
  onPeriodChange: (period: { start: Date; end: Date }) => void;
}

export const PeriodSelector = ({ onPeriodChange }: PeriodSelectorProps) => {
  const today = new Date();
  const [selected, setSelected] = useState("thisMonth");
  const [customStart, setCustomStart] = useState<Date | undefined>(startOfMonth(today));
  const [customEnd, setCustomEnd] = useState<Date | undefined>(endOfMonth(today));
  const [showCustom, setShowCustom] = useState(false);

  const getPeriodDates = (periodValue: string): { start: Date; end: Date } => {
    switch (periodValue) {
      case "today":
        return { start: startOfDay(today), end: endOfDay(today) };
      case "week":
        return { start: startOfWeek(today, { locale: ptBR }), end: endOfWeek(today, { locale: ptBR }) };
      case "lastMonth":
        const lastMonth = subMonths(today, 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      case "thisMonth":
        return { start: startOfMonth(today), end: endOfMonth(today) };
      case "nextMonth":
        const nextMonth = addMonths(today, 1);
        return { start: startOfMonth(nextMonth), end: endOfMonth(nextMonth) };
      case "all":
        return { start: new Date(2000, 0, 1), end: new Date(2100, 11, 31) };
      case "custom":
        return { start: customStart || startOfMonth(today), end: customEnd || endOfMonth(today) };
      default:
        return { start: startOfMonth(today), end: endOfMonth(today) };
    }
  };

  const getDisplayLabel = () => {
    if (selected === "custom" && customStart && customEnd) {
      return `${format(customStart, "dd/MM/yyyy", { locale: ptBR })} - ${format(customEnd, "dd/MM/yyyy", { locale: ptBR })}`;
    }
    const period = periods.find(p => p.value === selected);
    if (period?.value === "thisMonth" || period?.value === "lastMonth" || period?.value === "nextMonth") {
      const dates = getPeriodDates(selected);
      return format(dates.start, "MMMM 'de' yyyy", { locale: ptBR });
    }
    return period?.label || "Este mês";
  };

  const handlePeriodSelect = (periodValue: string) => {
    setSelected(periodValue);
    if (periodValue === "custom") {
      setShowCustom(true);
    } else {
      setShowCustom(false);
      const dates = getPeriodDates(periodValue);
      onPeriodChange(dates);
    }
  };

  const handleCustomApply = () => {
    if (customStart && customEnd) {
      onPeriodChange({ start: customStart, end: customEnd });
      setShowCustom(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="default" size="sm" className="min-w-[180px]">
            {getDisplayLabel()}
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {periods.map((period) => (
            <DropdownMenuItem key={period.value} onClick={() => handlePeriodSelect(period.value)}>
              {period.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {showCustom && (
        <Popover open={showCustom} onOpenChange={setShowCustom}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              Selecionar período
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4" align="end">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Data inicial</label>
                <CalendarComponent
                  mode="single"
                  selected={customStart}
                  onSelect={setCustomStart}
                  initialFocus
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Data final</label>
                <CalendarComponent
                  mode="single"
                  selected={customEnd}
                  onSelect={setCustomEnd}
                />
              </div>
              <Button onClick={handleCustomApply} className="w-full">
                Aplicar
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </>
  );
};
