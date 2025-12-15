import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle, XCircle, Clock, Palmtree, User } from "lucide-react";
import {
  useVacations,
  EmployeeVacation,
  vacationTypeLabels,
  vacationStatusLabels,
} from "@/hooks/useVacations";
import { useEmployees } from "@/hooks/useEmployees";

export const VacationApprovalPanel = () => {
  const { pendingVacations, approveVacation, rejectVacation, isApproving, isRejecting } =
    useVacations();
  const { employees } = useEmployees();

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedVacation, setSelectedVacation] = useState<EmployeeVacation | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find((e) => e.id === employeeId);
    return employee?.name || "Funcionário";
  };

  const handleApprove = (id: string) => {
    approveVacation(id);
  };

  const handleRejectClick = (vacation: EmployeeVacation) => {
    setSelectedVacation(vacation);
    setRejectReason("");
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = () => {
    if (!selectedVacation) return;
    rejectVacation({ id: selectedVacation.id, reason: rejectReason });
    setRejectDialogOpen(false);
    setSelectedVacation(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
            <Clock className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Aprovado
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
            <XCircle className="h-3 w-3 mr-1" />
            Rejeitado
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <Palmtree className="h-4 w-4 text-primary" />
            Aprovações de Férias
            {pendingVacations.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingVacations.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingVacations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Palmtree className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>Nenhuma solicitação pendente</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Funcionário</TableHead>
                    <TableHead className="text-xs">Tipo</TableHead>
                    <TableHead className="text-xs">Período</TableHead>
                    <TableHead className="text-xs text-center">Dias</TableHead>
                    <TableHead className="text-xs">Observações</TableHead>
                    <TableHead className="text-xs text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingVacations.map((vacation) => (
                    <TableRow key={vacation.id}>
                      <TableCell className="font-medium text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {getEmployeeName(vacation.employee_id)}
                        </div>
                      </TableCell>
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
                      <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">
                        {vacation.notes || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => handleApprove(vacation.id)}
                            disabled={isApproving}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleRejectClick(vacation)}
                            disabled={isRejecting}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Rejeitar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Rejeitar Solicitação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Você está rejeitando a solicitação de{" "}
              <strong>
                {selectedVacation && getEmployeeName(selectedVacation.employee_id)}
              </strong>
              .
            </p>
            <div className="space-y-2">
              <Label>Motivo da Rejeição</Label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Informe o motivo da rejeição..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={!rejectReason.trim() || isRejecting}
            >
              Confirmar Rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
