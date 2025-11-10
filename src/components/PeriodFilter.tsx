import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

type PeriodFilterProps = {
  onPeriodChange: (start: Date, end: Date) => void;
  currentStart: Date;
  currentEnd: Date;
};

export const PeriodFilter = ({ onPeriodChange, currentStart, currentEnd }: PeriodFilterProps) => {
  const [customStart, setCustomStart] = useState<Date>(currentStart);
  const [customEnd, setCustomEnd] = useState<Date>(currentEnd);

  const setCurrentMonth = () => {
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());
    onPeriodChange(start, end);
  };

  const setLastMonth = () => {
    const lastMonth = subMonths(new Date(), 1);
    const start = startOfMonth(lastMonth);
    const end = endOfMonth(lastMonth);
    onPeriodChange(start, end);
  };

  const setLast3Months = () => {
    const threeMonthsAgo = subMonths(new Date(), 2);
    const start = startOfMonth(threeMonthsAgo);
    const end = endOfMonth(new Date());
    onPeriodChange(start, end);
  };

  const setCurrentYear = () => {
    const start = startOfYear(new Date());
    const end = endOfYear(new Date());
    onPeriodChange(start, end);
  };

  const applyCustomPeriod = () => {
    if (customStart && customEnd) {
      onPeriodChange(customStart, customEnd);
    }
  };

  const isCurrentPeriod = (start: Date, end: Date) => {
    return currentStart.getTime() === start.getTime() && currentEnd.getTime() === end.getTime();
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <Button
        variant={isCurrentPeriod(startOfMonth(new Date()), endOfMonth(new Date())) ? "default" : "outline"}
        size="sm"
        onClick={setCurrentMonth}
      >
        Mês Atual
      </Button>
      <Button
        variant={isCurrentPeriod(
          startOfMonth(subMonths(new Date(), 1)),
          endOfMonth(subMonths(new Date(), 1))
        ) ? "default" : "outline"}
        size="sm"
        onClick={setLastMonth}
      >
        Mês Anterior
      </Button>
      <Button
        variant={isCurrentPeriod(
          startOfMonth(subMonths(new Date(), 2)),
          endOfMonth(new Date())
        ) ? "default" : "outline"}
        size="sm"
        onClick={setLast3Months}
      >
        Últimos 3 Meses
      </Button>
      <Button
        variant={isCurrentPeriod(startOfYear(new Date()), endOfYear(new Date())) ? "default" : "outline"}
        size="sm"
        onClick={setCurrentYear}
      >
        Ano Atual
      </Button>

      <div className="flex gap-2 items-center">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(customStart, "dd/MM/yyyy", { locale: ptBR })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={customStart}
              onSelect={(date) => date && setCustomStart(date)}
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>

        <span className="text-muted-foreground">até</span>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(customEnd, "dd/MM/yyyy", { locale: ptBR })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={customEnd}
              onSelect={(date) => date && setCustomEnd(date)}
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>

        <Button size="sm" onClick={applyCustomPeriod}>
          Aplicar
        </Button>
      </div>
    </div>
  );
};
