import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useTasks, Task } from "@/hooks/useTasks";
import { useNavigate } from "react-router-dom";
import { format, isToday, isTomorrow, isPast, differenceInDays, differenceInMinutes, differenceInHours } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Calendar, 
  TrendingUp, 
  Users, 
  ListTodo,
  ArrowRight,
  Flag,
  BarChart3,
  Timer
} from "lucide-react";
import { cn } from "@/lib/utils";

// Real-time time counter component for dashboard
const TaskTimeCounter = ({ task, hideValues }: { task: Task; hideValues: boolean }) => {
  const [, setTick] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);
  
  if (hideValues) return <span>••</span>;
  if (!task.due_date) return null;
  
  const now = new Date();
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
      return (
        <span className="flex items-center gap-1 text-xs text-red-600">
          <Timer className="h-3 w-3" />
          {hoursDiff > 0 ? `${hoursDiff}h ${minutesDiff}m` : `${minutesDiff}m`}
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-xs text-red-600">
        <Timer className="h-3 w-3" />
        {daysDiff} dia{daysDiff > 1 ? "s" : ""}
      </span>
    );
  }
  
  return (
    <span className="text-xs text-muted-foreground">
      {format(targetDate, "dd/MM", { locale: ptBR })}
    </span>
  );
};

interface TasksDashboardProps {
  hideValues?: boolean;
}

export const TasksDashboard = ({ hideValues = false }: TasksDashboardProps) => {
  const { tasks, isLoading } = useTasks();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card className="col-span-full">
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  // Calculate KPIs
  const today = new Date();
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === "completed").length;
  const pendingTasks = tasks.filter(t => t.status === "pending" || t.status === "in_progress").length;
  const cancelledTasks = tasks.filter(t => t.status === "cancelled").length;

  // Overdue tasks (past due date and not completed)
  const overdueTasks = tasks.filter(t => {
    if (!t.due_date || t.status === "completed" || t.status === "cancelled") return false;
    return isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date));
  });

  // Tasks due today
  const dueTodayTasks = tasks.filter(t => {
    if (!t.due_date || t.status === "completed" || t.status === "cancelled") return false;
    return isToday(new Date(t.due_date));
  });

  // Tasks due tomorrow
  const dueTomorrowTasks = tasks.filter(t => {
    if (!t.due_date || t.status === "completed" || t.status === "cancelled") return false;
    return isTomorrow(new Date(t.due_date));
  });

  // Tasks by priority
  const urgentTasks = tasks.filter(t => t.priority === "urgent" && t.status !== "completed" && t.status !== "cancelled").length;
  const highPriorityTasks = tasks.filter(t => t.priority === "high" && t.status !== "completed" && t.status !== "cancelled").length;

  // Completion rate
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Tasks completed this week
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const completedThisWeek = tasks.filter(t => {
    if (!t.completed_at) return false;
    return new Date(t.completed_at) >= oneWeekAgo;
  }).length;

  // Upcoming tasks (next 7 days)
  const upcomingTasks = tasks.filter(t => {
    if (!t.due_date || t.status === "completed" || t.status === "cancelled") return false;
    const dueDate = new Date(t.due_date);
    const daysUntilDue = differenceInDays(dueDate, today);
    return daysUntilDue > 0 && daysUntilDue <= 7;
  }).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <ListTodo className="h-5 w-5 text-primary" />
          Dashboard de Tarefas
        </h2>
        <Button variant="outline" size="sm" onClick={() => navigate("/tarefas")}>
          Ver todas
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4">
        {/* Total Tasks */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <ListTodo className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{hideValues ? "••" : totalTasks}</p>
                <p className="text-xs text-muted-foreground">Total de tarefas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending */}
        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/20">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{hideValues ? "••" : pendingTasks}</p>
                <p className="text-xs text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Completed */}
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{hideValues ? "••" : completedTasks}</p>
                <p className="text-xs text-muted-foreground">Concluídas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overdue */}
        <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/20">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{hideValues ? "••" : overdueTasks.length}</p>
                <p className="text-xs text-muted-foreground">Atrasadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Due Today */}
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{hideValues ? "••" : dueTodayTasks.length}</p>
                <p className="text-xs text-muted-foreground">Vencem hoje</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Urgent */}
        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <Flag className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">{hideValues ? "••" : urgentTasks}</p>
                <p className="text-xs text-muted-foreground">Urgentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Completion Rate Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Taxa de Conclusão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold">
                  {hideValues ? "••" : `${completionRate}%`}
                </span>
                <Badge variant={completionRate >= 70 ? "default" : completionRate >= 40 ? "secondary" : "destructive"}>
                  {completionRate >= 70 ? "Bom" : completionRate >= 40 ? "Regular" : "Baixo"}
                </Badge>
              </div>
              <Progress value={hideValues ? 0 : completionRate} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {hideValues ? "••••" : `${completedTasks} de ${totalTasks} tarefas concluídas`}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Performance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Desempenho Semanal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-green-600">
                  {hideValues ? "••" : completedThisWeek}
                </span>
                <span className="text-sm text-muted-foreground">tarefas</span>
              </div>
              <p className="text-sm text-muted-foreground">Concluídas nos últimos 7 dias</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-muted">
                  <span className="text-muted-foreground">Amanhã:</span>
                  <span className="font-medium ml-1">{hideValues ? "••" : dueTomorrowTasks.length}</span>
                </div>
                <div className="p-2 rounded-lg bg-muted">
                  <span className="text-muted-foreground">Alta prioridade:</span>
                  <span className="font-medium ml-1">{hideValues ? "••" : highPriorityTasks}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Próximas Tarefas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma tarefa agendada para os próximos 7 dias
              </p>
            ) : (
              <div className="space-y-2">
                {upcomingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm"
                  >
                    <span className="truncate flex-1">{hideValues ? "••••••" : task.title}</span>
                    <Badge variant="outline" className="ml-2 shrink-0">
                      {hideValues ? "••" : format(new Date(task.due_date!), "dd/MM", { locale: ptBR })}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alerts Row */}
      {(overdueTasks.length > 0 || urgentTasks > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {overdueTasks.length > 0 && (
            <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  Tarefas Atrasadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {overdueTasks.slice(0, 5).map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-red-100/50 dark:bg-red-900/20 text-sm cursor-pointer hover:bg-red-200/50 dark:hover:bg-red-800/30 transition-colors"
                      onClick={() => navigate("/tarefas")}
                    >
                      <span className="truncate flex-1 text-red-700 dark:text-red-400">
                        {hideValues ? "••••••" : task.title}
                      </span>
                      <TaskTimeCounter task={task} hideValues={hideValues} />
                    </div>
                  ))}
                  {overdueTasks.length > 5 && (
                    <Button 
                      variant="ghost" 
                      className="w-full text-xs text-red-600 hover:text-red-700"
                      onClick={() => navigate("/tarefas")}
                    >
                      +{overdueTasks.length - 5} mais atrasadas
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {dueTodayTasks.length > 0 && (
            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-blue-600">
                  <Clock className="h-4 w-4" />
                  Vencem Hoje
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dueTodayTasks.slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-blue-100/50 dark:bg-blue-900/20 text-sm"
                    >
                      <span className="truncate flex-1 text-blue-700 dark:text-blue-400">
                        {hideValues ? "••••••" : task.title}
                      </span>
                      {task.due_time && (
                        <span className="text-xs text-blue-600 ml-2">
                          {hideValues ? "••" : task.due_time}
                        </span>
                      )}
                    </div>
                  ))}
                  {dueTodayTasks.length > 3 && (
                    <p className="text-xs text-blue-600 text-center">
                      +{dueTodayTasks.length - 3} mais
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
