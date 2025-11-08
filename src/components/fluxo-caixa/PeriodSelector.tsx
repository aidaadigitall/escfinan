import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

const periods = [
  "Hoje",
  "Esta semana",
  "Mês passado",
  "Este mês",
  "Próximo mês",
  "Todo o período",
  "Escolha o período",
];

export const PeriodSelector = () => {
  const [selected, setSelected] = useState("Novembro de 2025");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="default" size="sm" className="min-w-[180px]">
          {selected}
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {periods.map((period) => (
          <DropdownMenuItem key={period} onClick={() => setSelected(period)}>
            {period}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
