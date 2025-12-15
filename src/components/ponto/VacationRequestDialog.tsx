import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, differenceInBusinessDays, parseISO, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Palmtree, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVacations, VacationType, vacationTypeLabels } from "@/hooks/useVacations";
import { useEmployees } from "@/hooks/useEmployees";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface VacationRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId?: string;
}

export const VacationRequestDialog = ({
  open,
  onOpenChange,
  employeeId,
}: VacationRequestDialogProps) => {
  const { employees } = useEmployees();
  const { createVacation, getRemainingDays, isCreating } = useVacations();

  const [selectedEmployee, setSelectedEmployee] = useState(employeeId || "");
  const [vacationType, setVacationType] = useState<VacationType>("vacation");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [notes, setNotes] = useState("");

  const totalDays =
    startDate && endDate
      ? differenceInBusinessDays(endDate, startDate) + 1
      : 0;

  const remainingDays = selectedEmployee
    ? getRemainingDays(selectedEmployee)
    : 30;

  const isOverBalance = totalDays > remainingDays;

  const handleSubmit = () => {
    if (!selectedEmployee || !startDate || !endDate) return;

    createVacation({
      employee_id: selectedEmployee,
      start_date: format(startDate, "yyyy-MM-dd"),
      end_date: format(endDate, "yyyy-MM-dd"),
      vacation_type: vacationType,
      notes: notes || undefined,
    });

    // Reset form
    setSelectedEmployee(employeeId || "");
    setVacationType("vacation");
    setStartDate(undefined);
    setEndDate(undefined);
    setNotes("");
    onOpenChange(false);
  };

  const resetForm = () => {
    setSelectedEmployee(employeeId || "");
    setVacationType("vacation");
    setStartDate(undefined);
    setEndDate(undefined);
    setNotes("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) resetForm();
        onOpenChange(isOpen);
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palmtree className="h-5 w-5 text-primary" />
            Solicitar Férias/Licença
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Employee selector */}
          {!employeeId && (
            <div className="space-y-2">
              <Label>Funcionário</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o funcionário" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Vacation type */}
          <div className="space-y-2">
            <Label>Tipo de Afastamento</Label>
            <Select value={vacationType} onValueChange={(v) => setVacationType(v as VacationType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(vacationTypeLabels) as VacationType[]).map((type) => (
                  <SelectItem key={type} value={type}>
                    {vacationTypeLabels[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data Início</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      setStartDate(date);
                      if (date && (!endDate || endDate < date)) {
                        setEndDate(addDays(date, 7));
                      }
                    }}
                    locale={ptBR}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Data Fim</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    locale={ptBR}
                    disabled={(date) => (startDate ? date < startDate : date < new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Days summary */}
          {startDate && endDate && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="text-sm font-medium">Total de Dias Úteis</p>
                <p className="text-xs text-muted-foreground">
                  Saldo disponível: {remainingDays} dias
                </p>
              </div>
              <div className={cn(
                "text-2xl font-bold",
                isOverBalance ? "text-destructive" : "text-primary"
              )}>
                {totalDays}
              </div>
            </div>
          )}

          {/* Warning if over balance */}
          {isOverBalance && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                O período solicitado excede o saldo de férias disponível.
              </AlertDescription>
            </Alert>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label>Observações (opcional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Informações adicionais sobre a solicitação..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedEmployee || !startDate || !endDate || isCreating || isOverBalance}
          >
            {isCreating ? "Enviando..." : "Solicitar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
