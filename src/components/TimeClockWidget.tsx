import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Play, Pause, Square, Coffee } from "lucide-react";
import { useTimeEntries } from "@/hooks/useTimeEntries";
import { TimeClockRequestDialog } from "@/components/TimeClockRequestDialog";
import { format, differenceInSeconds } from "date-fns";
import { ptBR } from "date-fns/locale";

export function TimeClockWidget() {
  const {
    activeEntry,
    isLoadingActive,
    clockIn,
    clockOut,
    startBreak,
    endBreak,
    isClockingIn,
    isClockingOut,
  } = useTimeEntries();

  const [elapsedTime, setElapsedTime] = useState("00:00:00");
  const [breakTime, setBreakTime] = useState("00:00:00");
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);

  useEffect(() => {
    if (!activeEntry) {
      setElapsedTime("00:00:00");
      setBreakTime("00:00:00");
      return;
    }

    const interval = setInterval(() => {
      const now = new Date();
      const clockInTime = new Date(activeEntry.clock_in);
      const totalSeconds = differenceInSeconds(now, clockInTime);
      
      // Subtract break time
      const breakMinutes = activeEntry.total_break_minutes || 0;
      const workSeconds = totalSeconds - (breakMinutes * 60);
      
      const hours = Math.floor(workSeconds / 3600);
      const minutes = Math.floor((workSeconds % 3600) / 60);
      const seconds = workSeconds % 60;
      
      setElapsedTime(
        `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );

      // If on break, show break time
      if (activeEntry.break_start) {
        const breakStart = new Date(activeEntry.break_start);
        const breakSeconds = differenceInSeconds(now, breakStart);
        const bHours = Math.floor(breakSeconds / 3600);
        const bMinutes = Math.floor((breakSeconds % 3600) / 60);
        const bSeconds = breakSeconds % 60;
        setBreakTime(
          `${bHours.toString().padStart(2, "0")}:${bMinutes.toString().padStart(2, "0")}:${bSeconds.toString().padStart(2, "0")}`
        );
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeEntry]);

  const isOnBreak = activeEntry?.break_start && !activeEntry?.break_end;

  if (isLoadingActive) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Clock className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Controle de Ponto
          </CardTitle>
          {activeEntry && (
            <Badge variant={isOnBreak ? "secondary" : "default"}>
              {isOnBreak ? "Em Intervalo" : "Trabalhando"}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Time Display */}
        <div className="text-center">
          <div className="text-4xl font-mono font-bold tracking-wider">
            {elapsedTime}
          </div>
          {activeEntry && (
            <p className="text-sm text-muted-foreground mt-1">
              Entrada: {format(new Date(activeEntry.clock_in), "HH:mm", { locale: ptBR })}
            </p>
          )}
          {isOnBreak && (
            <p className="text-sm text-orange-500 mt-1">
              Intervalo: {breakTime}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          {!activeEntry ? (
            <Button
              onClick={() => clockIn(undefined)}
              disabled={isClockingIn}
              className="w-full"
              size="lg"
            >
              <Play className="h-5 w-5 mr-2" />
              Registrar Entrada
            </Button>
          ) : (
            <>
              {!isOnBreak ? (
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => startBreak(activeEntry.id)}
                    variant="outline"
                  >
                    <Coffee className="h-4 w-4 mr-2" />
                    Intervalo
                  </Button>
                  <Button
                    onClick={() => clockOut(activeEntry.id)}
                    disabled={isClockingOut}
                    variant="destructive"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Saída
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => endBreak(activeEntry.id)}
                  variant="secondary"
                  className="w-full"
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Encerrar Intervalo
                </Button>
              )}
            </>
          )}
        </div>
        {/* Request Edit Dialog Trigger */}
        {activeEntry && (
          <div>
            <Button variant="ghost" size="sm" onClick={() => setRequestDialogOpen(true)}>
              Solicitar Edição
            </Button>
            <TimeClockRequestDialog
              open={requestDialogOpen}
              onOpenChange={setRequestDialogOpen}
              timeTracking={activeEntry as any}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
