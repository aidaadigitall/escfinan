import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProjects, Project } from "@/hooks/useProjects";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isPast, isToday, isTomorrow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface ProjectDeadlineCalendarProps {
  hideValues?: boolean;
}

export const ProjectDeadlineCalendar = ({ hideValues = false }: ProjectDeadlineCalendarProps) => {
  const { data: projects, isLoading } = useProjects();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  const projectList = projects || [];

  // Get projects with expected_end_date
  const projectsWithDeadlines = projectList.filter(p => p.expected_end_date && p.status !== "completed" && p.status !== "cancelled");

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Create a map of dates to projects
  const deadlinesByDate: { [key: string]: Project[] } = {};
  projectsWithDeadlines.forEach(project => {
    const dateKey = format(new Date(project.expected_end_date!), "yyyy-MM-dd");
    if (!deadlinesByDate[dateKey]) {
      deadlinesByDate[dateKey] = [];
    }
    deadlinesByDate[dateKey].push(project);
  });

  // Get previous month's last days and next month's first days for calendar grid
  const firstDayOfWeek = getDay(monthStart);
  const previousMonthEnd = new Date(monthStart);
  previousMonthEnd.setDate(0);
  const previousMonthDays = Array.from({ length: firstDayOfWeek }, (_, i) => {
    const day = new Date(previousMonthEnd);
    day.setDate(previousMonthEnd.getDate() - (firstDayOfWeek - 1 - i));
    return day;
  });

  const nextMonthDays = Array.from({ length: 42 - daysInMonth.length - firstDayOfWeek }, (_, i) => {
    const day = new Date(monthEnd);
    day.setDate(monthEnd.getDate() + i + 1);
    return day;
  });

  const allDays = [...previousMonthDays, ...daysInMonth, ...nextMonthDays];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Get selected day's projects
  const selectedDateKey = format(currentDate, "yyyy-MM-dd");
  const selectedDayProjects = deadlinesByDate[selectedDateKey] || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendário de Deadlines
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={handleToday}>
            Hoje
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="sm" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-lg font-semibold">
              {format(currentDate, "MMMM yyyy", { locale: ptBR })}
            </h3>
            <Button variant="ghost" size="sm" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Weekday headers */}
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"].map(day => (
              <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-2">
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {allDays.map((day, index) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const dayProjects = deadlinesByDate[dateKey] || [];
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isCurrentDay = isToday(day);
              const isOverdue = isPast(day) && !isToday(day) && dayProjects.length > 0;
              const isTomorrowDate = isTomorrow(day);

              return (
                <div
                  key={index}
                  className={`
                    p-2 rounded-lg border text-xs min-h-12 flex flex-col justify-start cursor-pointer transition-colors
                    ${!isCurrentMonth ? "bg-muted/30 text-muted-foreground" : ""}
                    ${isCurrentDay ? "border-primary bg-primary/10" : "border-border"}
                    ${isOverdue ? "bg-red-50 dark:bg-red-950/20 border-red-300" : ""}
                    ${isTomorrowDate ? "bg-blue-50 dark:bg-blue-950/20 border-blue-300" : ""}
                    hover:bg-muted/50
                  `}
                  onClick={() => setCurrentDate(day)}
                >
                  <span className="font-semibold">{format(day, "d")}</span>
                  {dayProjects.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {dayProjects.slice(0, 2).map((project, i) => (
                        <div
                          key={project.id}
                          className="text-xs bg-primary/20 text-primary px-1 py-0.5 rounded truncate cursor-pointer hover:bg-primary/30"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/projetos/${project.id}`);
                          }}
                          title={hideValues ? "••••" : project.name}
                        >
                          {hideValues ? "••" : project.name.substring(0, 8)}
                        </div>
                      ))}
                      {dayProjects.length > 2 && (
                        <div className="text-xs text-muted-foreground px-1">
                          +{dayProjects.length - 2}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Selected day projects */}
          {selectedDayProjects.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-medium mb-2">
                Projetos em {format(currentDate, "dd/MM/yyyy", { locale: ptBR })}
              </p>
              <div className="space-y-2">
                {selectedDayProjects.map(project => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => navigate(`/projetos/${project.id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium">{hideValues ? "••••" : project.name}</p>
                      <p className="text-xs text-muted-foreground">{project.client?.name || "Sem cliente"}</p>
                    </div>
                    <Badge variant={project.priority === "critical" ? "destructive" : "secondary"} className="ml-2 shrink-0">
                      {hideValues ? "••" : `${project.progress_percentage || 0}%`}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
            <div className="p-2 rounded-lg bg-muted">
              <p className="text-muted-foreground text-xs">Total de Projetos</p>
              <p className="text-lg font-bold">{hideValues ? "••" : projectsWithDeadlines.length}</p>
            </div>
            <div className="p-2 rounded-lg bg-muted">
              <p className="text-muted-foreground text-xs">Este Mês</p>
              <p className="text-lg font-bold">
                {hideValues ? "••" : Object.values(deadlinesByDate).filter(projects => {
                  const date = new Date(Object.entries(deadlinesByDate).find(([_, p]) => p === projects)?.[0] || "");
                  return isSameMonth(date, currentDate);
                }).length}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-muted">
              <p className="text-muted-foreground text-xs">Atrasados</p>
              <p className="text-lg font-bold text-red-600">
                {hideValues ? "••" : projectsWithDeadlines.filter(p => isPast(new Date(p.expected_end_date!)) && !isToday(new Date(p.expected_end_date!))).length}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
