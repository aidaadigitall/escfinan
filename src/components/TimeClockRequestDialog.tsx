import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TimeTracking, useTimeTracking } from "@/hooks/useTimeTracking";

interface TimeClockRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timeTracking?: TimeTracking;
}

export function TimeClockRequestDialog({ open, onOpenChange, timeTracking }: TimeClockRequestDialogProps) {
  const { requestEdit, isClockingOut } = useTimeTracking();
  const [requestType, setRequestType] = useState<"edit_clock_in" | "edit_clock_out" | "adjust_hours">("edit_clock_in");
  const [requestValue, setRequestValue] = useState("");
  const [reason, setReason] = useState("");

  if (!timeTracking) return null;

  const handleSubmit = () => {
    if (!reason.trim()) {
      alert("Por favor, forneça um motivo para a solicitação");
      return;
    }

    if (!requestValue && requestType !== "adjust_hours") {
      alert("Por favor, preencha o campo de valor");
      return;
    }

    const requestPayload = {
      user_id: timeTracking.user_id,
      time_tracking_id: timeTracking.id,
      request_type: requestType,
      reason: reason.trim(),
      requested_value: requestType !== "adjust_hours" ? requestValue : undefined,
      requested_hours: requestType === "adjust_hours" ? parseFloat(requestValue) : undefined,
      requested_at: new Date().toISOString(),
      status: "pending" as const,
    };

    requestEdit(requestPayload);
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setRequestType("edit_clock_in");
    setRequestValue("");
    setReason("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Solicitar Edição de Ponto</DialogTitle>
          <DialogDescription>
            Solicite uma alteração de horário para {timeTracking.date}. Será necessária aprovação de um gerente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Request Type */}
          <div className="space-y-2">
            <Label htmlFor="request-type">Tipo de Solicitação</Label>
            <Select value={requestType} onValueChange={(value: any) => setRequestType(value)}>
              <SelectTrigger id="request-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="edit_clock_in">Editar Hora de Entrada</SelectItem>
                <SelectItem value="edit_clock_out">Editar Hora de Saída</SelectItem>
                <SelectItem value="adjust_hours">Ajustar Total de Horas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Current vs New Value */}
          {requestType === "edit_clock_in" && (
            <div className="space-y-2">
              <Label>Hora de Entrada Atual: {timeTracking.clock_in ? new Date(timeTracking.clock_in).toLocaleTimeString("pt-BR") : "Não registrado"}</Label>
            </div>
          )}
          {requestType === "edit_clock_out" && (
            <div className="space-y-2">
              <Label>Hora de Saída Atual: {timeTracking.clock_out ? new Date(timeTracking.clock_out).toLocaleTimeString("pt-BR") : "Não registrado"}</Label>
            </div>
          )}

          {/* New Value Input */}
          {requestType === "adjust_hours" ? (
            <div className="space-y-2">
              <Label htmlFor="request-value">Novo Total de Horas</Label>
              <Input
                id="request-value"
                type="number"
                step="0.5"
                min="0"
                max="24"
                placeholder="Ex: 8.5"
                value={requestValue}
                onChange={(e) => setRequestValue(e.target.value)}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="request-value">Nova Hora</Label>
              <Input
                id="request-value"
                type="time"
                value={requestValue}
                onChange={(e) => setRequestValue(e.target.value)}
              />
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo da Solicitação</Label>
            <Textarea
              id="reason"
              placeholder="Explique por que está solicitando essa alteração..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isClockingOut}>
            Enviar Solicitação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
