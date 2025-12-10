import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { Calendar, Clock, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TimeEntry {
  id: string;
  user_id: string;
  clock_in: string;
  clock_out?: string;
  break_start?: string;
  break_end?: string;
  total_hours?: number;
  total_break_minutes?: number;
  notes?: string;
  status: string;
}

interface TimeEntryEditDialogProps {
  entry: TimeEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAdmin?: boolean;
}

export function TimeEntryEditDialog({
  entry,
  open,
  onOpenChange,
  isAdmin = false,
}: TimeEntryEditDialogProps) {
  const queryClient = useQueryClient();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    date: "",
    clockIn: "",
    clockOut: "",
    breakStart: "",
    breakEnd: "",
    notes: "",
  });

  useEffect(() => {
    if (entry) {
      setFormData({
        date: entry.clock_in ? format(parseISO(entry.clock_in), "yyyy-MM-dd") : "",
        clockIn: entry.clock_in ? format(parseISO(entry.clock_in), "HH:mm") : "",
        clockOut: entry.clock_out ? format(parseISO(entry.clock_out), "HH:mm") : "",
        breakStart: entry.break_start ? format(parseISO(entry.break_start), "HH:mm") : "",
        breakEnd: entry.break_end ? format(parseISO(entry.break_end), "HH:mm") : "",
        notes: entry.notes || "",
      });
    }
  }, [entry]);

  const calculateHours = (start: string, end: string): number => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    return (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
  };

  const handleSave = async () => {
    if (!entry) return;

    setIsLoading(true);
    try {
      // Construir timestamps completos
      const clockInTimestamp = `${formData.date}T${formData.clockIn}:00`;
      const clockOutTimestamp = formData.clockOut ? `${formData.date}T${formData.clockOut}:00` : null;
      const breakStartTimestamp = formData.breakStart ? `${formData.date}T${formData.breakStart}:00` : null;
      const breakEndTimestamp = formData.breakEnd ? `${formData.date}T${formData.breakEnd}:00` : null;

      // Calcular horas totais
      let totalHours = 0;
      let totalBreakMinutes = 0;

      if (clockOutTimestamp) {
        totalHours = calculateHours(clockInTimestamp, clockOutTimestamp);
      }

      if (breakStartTimestamp && breakEndTimestamp) {
        totalBreakMinutes = Math.round(calculateHours(breakStartTimestamp, breakEndTimestamp) * 60);
      }

      // Atualizar registro
      const { error } = await supabase
        .from("time_entries")
        .update({
          clock_in: clockInTimestamp,
          clock_out: clockOutTimestamp,
          break_start: breakStartTimestamp,
          break_end: breakEndTimestamp,
          total_hours: totalHours,
          total_break_minutes: totalBreakMinutes,
          notes: formData.notes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", entry.id);

      if (error) throw error;

      toast.success("Registro atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["time-entries"] });
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao atualizar registro:", error);
      toast.error("Erro ao atualizar registro");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!entry) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("time_entries")
        .delete()
        .eq("id", entry.id);

      if (error) throw error;

      toast.success("Registro excluído com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["time-entries"] });
      setShowDeleteConfirm(false);
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao excluir registro:", error);
      toast.error("Erro ao excluir registro");
    } finally {
      setIsLoading(false);
    }
  };

  if (!entry) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Editar Registro de Ponto
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Data */}
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Data
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                disabled={!isAdmin}
              />
            </div>

            {/* Horários */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clockIn">Entrada</Label>
                <Input
                  id="clockIn"
                  type="time"
                  value={formData.clockIn}
                  onChange={(e) => setFormData({ ...formData, clockIn: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clockOut">Saída</Label>
                <Input
                  id="clockOut"
                  type="time"
                  value={formData.clockOut}
                  onChange={(e) => setFormData({ ...formData, clockOut: e.target.value })}
                />
              </div>
            </div>

            {/* Intervalo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="breakStart">Início do Intervalo</Label>
                <Input
                  id="breakStart"
                  type="time"
                  value={formData.breakStart}
                  onChange={(e) => setFormData({ ...formData, breakStart: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="breakEnd">Fim do Intervalo</Label>
                <Input
                  id="breakEnd"
                  type="time"
                  value={formData.breakEnd}
                  onChange={(e) => setFormData({ ...formData, breakEnd: e.target.value })}
                />
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Adicione observações sobre este registro..."
                rows={3}
              />
            </div>

            {/* Informações calculadas */}
            {formData.clockIn && formData.clockOut && (
              <div className="p-3 bg-muted rounded-md space-y-1">
                <p className="text-sm font-medium">Resumo Calculado:</p>
                <p className="text-sm text-muted-foreground">
                  Total de horas:{" "}
                  <span className="font-medium text-foreground">
                    {(() => {
                      const hours = calculateHours(
                        `${formData.date}T${formData.clockIn}:00`,
                        `${formData.date}T${formData.clockOut}:00`
                      );
                      const h = Math.floor(hours);
                      const m = Math.round((hours - h) * 60);
                      return `${h}h ${m}m`;
                    })()}
                  </span>
                </p>
                {formData.breakStart && formData.breakEnd && (
                  <p className="text-sm text-muted-foreground">
                    Intervalo:{" "}
                    <span className="font-medium text-foreground">
                      {(() => {
                        const hours = calculateHours(
                          `${formData.date}T${formData.breakStart}:00`,
                          `${formData.date}T${formData.breakEnd}:00`
                        );
                        return `${Math.round(hours * 60)}min`;
                      })()}
                    </span>
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {isAdmin && (
              <Button
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isLoading}
                className="sm:mr-auto"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            )}
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmação de exclusão */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este registro de ponto? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isLoading ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
