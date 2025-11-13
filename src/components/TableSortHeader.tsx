import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { TableHead } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TableSortHeaderProps {
  label: string;
  columnKey: string;
  sortKey: string;
  sortDirection: "asc" | "desc" | null;
  onSort: (key: string) => void;
  className?: string;
}

export const TableSortHeader = ({
  label,
  columnKey,
  sortKey,
  sortDirection,
  onSort,
  className,
}: TableSortHeaderProps) => {
  const isSorted = sortKey === columnKey;
  const currentIcon = isSorted
    ? sortDirection === "asc"
      ? ArrowUp
      : ArrowDown
    : ArrowUpDown;

  const Icon = currentIcon;

  return (
    <TableHead className={cn("p-0", className)}>
      <Button
        variant="ghost"
        className="w-full justify-start h-10 px-3"
        onClick={() => onSort(columnKey)}
      >
        {label}
        <Icon className="ml-2 h-4 w-4" />
      </Button>
    </TableHead>
  );
};
