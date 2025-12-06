import { useState, useEffect } from "react";
import { useTasks, Task } from "@/hooks/useTasks";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { differenceInMinutes, differenceInHours, differenceInDays, isPast } from "date-fns";
import { AlertTriangle, X, Clock, Timer, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const UrgentTasksWidget = () => {
  const { tasks } = useTasks();
  const { permissions } = useUserPermissions();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);
  const [, setTick] = useState(0);

  // Update every minute for real-time countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Check permissions
  if (!permissions?.can_view_tasks) return null;

  const now = new Date();

  // Filter overdue and urgent tasks
  const overdueTasks = tasks.filter(task => {
    if (!task.due_date || task.status === "completed" || task.status === "cancelled") return false;
    let targetDate = new Date(task.due_date);
    if (task.due_time) {
      const [hours, minutes] = task.due_time.split(":");
      targetDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    } else {
      targetDate.setHours(23, 59, 59, 999);
    }
    return isPast(targetDate);
  });

  const urgentTasks = tasks.filter(task => {
    if (task.status === "completed" || task.status === "cancelled") return false;
    return task.priority === "urgent";
  });

  // Combine and deduplicate
  const criticalTasks = [...overdueTasks, ...urgentTasks.filter(t => !overdueTasks.find(o => o.id === t.id))];

  if (!isVisible || criticalTasks.length === 0) return null;

  const getTimeInfo = (task: Task) => {
    if (!task.due_date) return { text: "Sem prazo", color: "text-muted-foreground" };

    let targetDate = new Date(task.due_date);
    if (task.due_time) {
      const [hours, minutes] = task.due_time.split(":");
      targetDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    } else {
      targetDate.setHours(23, 59, 59, 999);
    }

    const isOverdue = isPast(targetDate);
    const totalMinutesDiff = Math.abs(differenceInMinutes(targetDate, now));
    const daysDiff = Math.floor(totalMinutesDiff / (24 * 60));
    const hoursDiff = Math.floor((totalMinutesDiff % (24 * 60)) / 60);
    const minutesDiff = totalMinutesDiff % 60;

    if (isOverdue) {
      if (daysDiff === 0) {
        return { 
          text: hoursDiff === 0 ? `${minutesDiff}m atraso` : `${hoursDiff}h ${minutesDiff}m atraso`, 
          color: "text-red-600" 
        };
      }
      return { text: `${daysDiff} dias atraso`, color: "text-red-600" };
    }

    if (daysDiff === 0) {
      if (hoursDiff === 0) {
        return { text: `${minutesDiff}m restante`, color: "text-orange-600" };
      }
      return { text: `${hoursDiff}h ${minutesDiff}m restante`, color: "text-orange-600" };
    }

    return { text: `${daysDiff} dias`, color: "text-yellow-600" };
  };

  return (
    <div className="fixed bottom-20 right-4 z-40 max-w-sm w-full animate-in slide-in-from-right duration-300">
      <Card className="border-red-300 dark:border-red-800 bg-background shadow-lg">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-4 w-4 animate-pulse" />
            Tarefas Críticas ({criticalTasks.length})
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsVisible(false)}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {criticalTasks.slice(0, 3).map((task) => {
            const timeInfo = getTimeInfo(task);
            const isOverdue = overdueTasks.find(t => t.id === task.id);
            
            return (
              <div
                key={task.id}
                className={cn(
                  "flex items-center justify-between p-2 rounded-lg text-sm cursor-pointer hover:bg-muted/50 transition-colors",
                  isOverdue ? "bg-red-100/50 dark:bg-red-900/20" : "bg-orange-100/50 dark:bg-orange-900/20"
                )}
                onClick={() => navigate(`/tarefas?task=${task.id}`)}
              >
                <div className="flex-1 min-w-0">
                  <p className={cn("truncate font-medium", isOverdue ? "text-red-700 dark:text-red-400" : "text-orange-700 dark:text-orange-400")}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {task.priority === "urgent" && (
                      <Badge variant="destructive" className="text-xs h-4 px-1">Urgente</Badge>
                    )}
                    <span className={cn("text-xs flex items-center gap-1", timeInfo.color)}>
                      {isOverdue ? <AlertTriangle className="h-3 w-3" /> : <Timer className="h-3 w-3" />}
                      {timeInfo.text}
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            );
          })}
          {criticalTasks.length > 3 && (
            <Button variant="ghost" className="w-full text-sm" onClick={() => navigate("/tarefas")}>
              Ver mais {criticalTasks.length - 3} tarefas
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
