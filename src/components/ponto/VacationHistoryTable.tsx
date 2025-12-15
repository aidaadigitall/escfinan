import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Palmtree, Trash2, CheckCircle, XCircle, Clock } from "lucide-react";
import {
  useVacations,
  EmployeeVacation,
  vacationTypeLabels,
  VacationStatus,
} from "@/hooks/useVacations";
import { useEmployees } from "@/hooks/useEmployees";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useState } from "react";

interface VacationHistoryTableProps {
  employeeId?: string;
  showEmployee?: boolean;
}

export const VacationHistoryTable = ({
  employeeId,
  showEmployee = false,
}: VacationHistoryTableProps) => {
  const { vacations, deleteVacation } = useVacations();
  const { employees } = useEmployees();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vacationToDelete, setVacationToDelete] = useState<EmployeeVacation | null>(null);

  const filteredVacations = employeeId
    ? vacations.filter((v) => v.employee_id === employeeId)
    : vacations;

  const getEmployeeName = (empId: string) => {
    const employee = employees.find((e) => e.id === empId);
    return employee?.name || "Funcionário";
  };

  const getStatusBadge = (status: VacationStatus) => {
    const configs = {
      pending: {
        icon: Clock,
        className: "bg-yellow-100 text-yellow-800 border-yellow-300",
        label: "Pendente",
      },
      approved: {
        icon: CheckCircle,
        className: "bg-green-100 text-green-800 border-green-300",
        label: "Aprovado",
      },
      rejected: {
        icon: XCircle,
        className: "bg-red-100 text-red-800 border-red-300",
        label: "Rejeitado",
      },
      completed: {
        icon: CheckCircle,
        className: "bg-blue-100 text-blue-800 border-blue-300",
        label: "Concluído",
      },
    };

    const config = configs[status] || configs.pending;
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const handleDeleteClick = (vacation: EmployeeVacation) => {
    setVacationToDelete(vacation);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (vacationToDelete) {
      deleteVacation(vacationToDelete.id);
    }
    setDeleteDialogOpen(false);
    setVacationToDelete(null);
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <Palmtree className="h-4 w-4 text-primary" />
            Histórico de Férias/Licenças
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredVacations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Palmtree className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>Nenhum registro de férias encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {showEmployee && <TableHead className="text-xs">Funcionário</TableHead>}
                    <TableHead className="text-xs">Tipo</TableHead>
                    <TableHead className="text-xs">Período</TableHead>
                    <TableHead className="text-xs text-center">Dias</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Observações</TableHead>
                    <TableHead className="text-xs w-[60px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVacations.map((vacation) => (
                    <TableRow key={vacation.id}>
                      {showEmployee && (
                        <TableCell className="font-medium text-sm">
                          {getEmployeeName(vacation.employee_id)}
                        </TableCell>
                      )}
                      <TableCell className="text-sm">
                        {vacationTypeLabels[vacation.vacation_type as keyof typeof vacationTypeLabels]}
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(parseISO(vacation.start_date), "dd/MM/yyyy", { locale: ptBR })}
                        {" - "}
                        {format(parseISO(vacation.end_date), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{vacation.total_days}</Badge>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(vacation.status as VacationStatus)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">
                        {vacation.notes || vacation.rejection_reason || "-"}
                      </TableCell>
                      <TableCell>
                        {vacation.status === "pending" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteClick(vacation)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Excluir Solicitação"
        description="Tem certeza que deseja excluir esta solicitação de férias? Esta ação não pode ser desfeita."
        onConfirm={handleDeleteConfirm}
        confirmText="Excluir"
        variant="destructive"
      />
    </>
  );
};
