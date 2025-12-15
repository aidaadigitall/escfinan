import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  format,
  parseISO,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  getDay,
  isSameDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { EmployeeVacation } from "@/hooks/useVacations";

interface TimeEntry {
  clock_in: string;
  clock_out: string | null;
  total_hours: number | null;
  status: string;
}

interface AttendanceHeatmapProps {
  entries: TimeEntry[];
  selectedMonth: string;
  vacations?: EmployeeVacation[];
  title?: string;
}

type AttendanceStatus = "present" | "late" | "absent" | "vacation" | "weekend" | "future";

const statusColors: Record<AttendanceStatus, string> = {
  present: "bg-green-500",
  late: "bg-yellow-500",
  absent: "bg-red-500",
  vacation: "bg-blue-500",
  weekend: "bg-muted",
  future: "bg-muted/30",
};

const statusLabels: Record<AttendanceStatus, string> = {
  present: "Presente",
  late: "Atraso",
  absent: "Falta",
  vacation: "Férias/Licença",
  weekend: "Fim de semana",
  future: "Futuro",
};

export const AttendanceHeatmap = ({
  entries,
  selectedMonth,
  vacations = [],
  title = "Calendário de Presença",
}: AttendanceHeatmapProps) => {
  const calendarData = useMemo(() => {
    const monthStart = startOfMonth(parseISO(selectedMonth + "-01"));
    const monthEnd = endOfMonth(parseISO(selectedMonth + "-01"));
    const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const today = new Date();

    // Create a map of entries by date
    const entriesByDate: Record<string, TimeEntry> = {};
    entries.forEach((entry) => {
      const dateStr = format(parseISO(entry.clock_in), "yyyy-MM-dd");
      entriesByDate[dateStr] = entry;
    });

    // Create a set of vacation dates
    const vacationDates = new Set<string>();
    vacations
      .filter((v) => v.status === "approved")
      .forEach((v) => {
        const start = parseISO(v.start_date);
        const end = parseISO(v.end_date);
        eachDayOfInterval({ start, end }).forEach((day) => {
          vacationDates.add(format(day, "yyyy-MM-dd"));
        });
      });

    return allDays.map((day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      const dayOfWeek = getDay(day);
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isFuture = day > today;
      const entry = entriesByDate[dateStr];
      const isVacation = vacationDates.has(dateStr);

      let status: AttendanceStatus;
      let hours: number | null = null;

      if (isFuture) {
        status = "future";
      } else if (isWeekend) {
        status = "weekend";
      } else if (isVacation) {
        status = "vacation";
      } else if (entry) {
        const clockInHour = parseISO(entry.clock_in).getHours();
        hours = entry.total_hours;
        status = clockInHour > 9 ? "late" : "present";
      } else {
        status = "absent";
      }

      return {
        date: day,
        dateStr,
        dayOfMonth: format(day, "d"),
        dayOfWeek,
        status,
        hours,
        entry,
      };
    });
  }, [entries, selectedMonth, vacations]);

  // Group by weeks
  const weeks = useMemo(() => {
    const result: typeof calendarData[] = [];
    let currentWeek: typeof calendarData = [];

    // Add empty days at start to align first day
    const firstDayOfWeek = calendarData[0]?.dayOfWeek || 0;
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push(null as any);
    }

    calendarData.forEach((day) => {
      currentWeek.push(day);
      if (day.dayOfWeek === 6) {
        result.push(currentWeek);
        currentWeek = [];
      }
    });

    if (currentWeek.length > 0) {
      result.push(currentWeek);
    }

    return result;
  }, [calendarData]);

  const dayHeaders = ["D", "S", "T", "Q", "Q", "S", "S"];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Legend */}
        <div className="flex flex-wrap gap-2 mb-4">
          {(Object.keys(statusColors) as AttendanceStatus[])
            .filter((s) => s !== "future")
            .map((status) => (
              <div key={status} className="flex items-center gap-1">
                <div className={`w-3 h-3 rounded ${statusColors[status]}`} />
                <span className="text-xs text-muted-foreground">{statusLabels[status]}</span>
              </div>
            ))}
        </div>

        {/* Calendar grid */}
        <div className="space-y-1">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1">
            {dayHeaders.map((day, i) => (
              <div key={i} className="text-center text-xs text-muted-foreground font-medium py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Weeks */}
          <TooltipProvider>
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-7 gap-1">
                {week.map((day, dayIndex) =>
                  day ? (
                    <Tooltip key={day.dateStr}>
                      <TooltipTrigger asChild>
                        <div
                          className={`
                            aspect-square rounded flex items-center justify-center text-xs font-medium cursor-pointer
                            transition-all hover:scale-110
                            ${statusColors[day.status]}
                            ${day.status === "present" || day.status === "late" ? "text-white" : ""}
                            ${day.status === "absent" ? "text-white" : ""}
                            ${day.status === "vacation" ? "text-white" : ""}
                          `}
                        >
                          {day.dayOfMonth}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-xs">
                          <p className="font-medium">
                            {format(day.date, "dd/MM/yyyy (EEEE)", { locale: ptBR })}
                          </p>
                          <p>{statusLabels[day.status]}</p>
                          {day.hours && <p>{day.hours.toFixed(1)}h trabalhadas</p>}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <div key={dayIndex} className="aspect-square" />
                  )
                )}
              </div>
            ))}
          </TooltipProvider>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-lg font-bold text-green-600">
              {calendarData.filter((d) => d.status === "present").length}
            </p>
            <p className="text-xs text-muted-foreground">Presenças</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-yellow-600">
              {calendarData.filter((d) => d.status === "late").length}
            </p>
            <p className="text-xs text-muted-foreground">Atrasos</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-red-600">
              {calendarData.filter((d) => d.status === "absent").length}
            </p>
            <p className="text-xs text-muted-foreground">Faltas</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-blue-600">
              {calendarData.filter((d) => d.status === "vacation").length}
            </p>
            <p className="text-xs text-muted-foreground">Férias</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
