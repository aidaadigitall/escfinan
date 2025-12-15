import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Palmtree, Calendar, Clock, AlertCircle } from "lucide-react";
import { VacationBalance } from "@/hooks/useVacations";

interface VacationBalanceCardProps {
  balance?: VacationBalance | null;
  employeeName?: string;
  year?: number;
}

export const VacationBalanceCard = ({
  balance,
  employeeName,
  year = new Date().getFullYear(),
}: VacationBalanceCardProps) => {
  const totalDays = balance?.total_days || 30;
  const usedDays = balance?.used_days || 0;
  const pendingDays = balance?.pending_days || 0;
  const remainingDays = totalDays - usedDays - pendingDays;
  const usedPercentage = (usedDays / totalDays) * 100;
  const pendingPercentage = (pendingDays / totalDays) * 100;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Palmtree className="h-4 w-4 text-primary" />
          <span>Saldo de Férias {year}</span>
          {employeeName && (
            <Badge variant="outline" className="ml-auto text-xs">
              {employeeName}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Utilização</span>
            <span className="font-medium">
              {usedDays + pendingDays} de {totalDays} dias
            </span>
          </div>
          <div className="relative h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="absolute h-full bg-primary rounded-full transition-all"
              style={{ width: `${usedPercentage}%` }}
            />
            <div
              className="absolute h-full bg-yellow-500 rounded-full transition-all"
              style={{ 
                left: `${usedPercentage}%`,
                width: `${pendingPercentage}%` 
              }}
            />
          </div>
          <div className="flex gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-muted-foreground">Utilizados</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="text-muted-foreground">Pendentes</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-muted" />
              <span className="text-muted-foreground">Disponíveis</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-2 bg-green-50 dark:bg-green-950 rounded-lg">
            <p className="text-xl font-bold text-green-600">{remainingDays}</p>
            <p className="text-xs text-muted-foreground">Disponíveis</p>
          </div>
          <div className="text-center p-2 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <p className="text-xl font-bold text-blue-600">{usedDays}</p>
            <p className="text-xs text-muted-foreground">Utilizados</p>
          </div>
          <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
            <p className="text-xl font-bold text-yellow-600">{pendingDays}</p>
            <p className="text-xs text-muted-foreground">Pendentes</p>
          </div>
        </div>

        {/* Alert if low balance */}
        {remainingDays <= 5 && remainingDays > 0 && (
          <div className="flex items-center gap-2 p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg text-yellow-800 dark:text-yellow-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p className="text-xs">
              Saldo de férias baixo. Restam apenas {remainingDays} dias.
            </p>
          </div>
        )}

        {remainingDays === 0 && (
          <div className="flex items-center gap-2 p-2 bg-red-100 dark:bg-red-900/20 rounded-lg text-red-800 dark:text-red-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p className="text-xs">
              Saldo de férias esgotado para este ano.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
