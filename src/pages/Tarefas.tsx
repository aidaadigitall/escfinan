import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTasks, Task } from "@/hooks/useTasks";
import { useEmployees } from "@/hooks/useEmployees";
import { useUsers } from "@/hooks/useUsers";
import { useTaskDueNotifications } from "@/hooks/useTaskDueNotifications";
import { useTaskLabels } from "@/hooks/useTaskLabels";
import { TaskDialog } from "@/components/TaskDialog";
import { TaskAdvancedFilters } from "@/components/TaskAdvancedFilters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, differenceInMinutes, isPast, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Plus, Calendar as CalendarIcon, Tag, Trash2, Edit, 
  CheckCircle2, Circle, Clock, User, ChevronDown, ChevronRight, Users, Timer, AlertTriangle, BarChart3, Check
} from "lucide-react";
import { cn } from "@/lib/utils";

// Time counter component for tasks with real-time updates
const TaskTimeCounter = ({ dueDate, dueTime, status }: { dueDate: string; dueTime?: string | null; status?: string | null }) => {
  const [, setTick] = useState(0);
  
  // Update every minute for real-time display
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);
  
  if (status === "completed" || status === "cancelled") return null;
  
  const now = new Date();
  let targetDate = new Date(dueDate + "T12:00:00");
  
  // If due_time is provided, set the time
  if (dueTime) {
    const [hours, minutes] = dueTime.split(":");
    targetDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  } else {
    targetDate.setHours(23, 59, 59, 999);
  }
  
  const isOverdue = isPast(targetDate);
  const totalMinutesDiff = Math.abs(differenceInMinutes(targetDate, now));
  const daysDiff = Math.floor(totalMinutesDiff / (24 * 60));
  const hoursDiff = Math.floor((totalMinutesDiff % (24 * 60)) / 60);
  const minutesDiff = totalMinutesDiff % 60;
  
  let timeText = "";
  let colorClass = "";
  
  if (isOverdue) {
    colorClass = "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400 border-red-300";
    if (daysDiff === 0) {
      if (hoursDiff === 0) {
        timeText = `Atrasado ${minutesDiff}m`;
      } else {
        timeText = `Atrasado ${hoursDiff}h ${minutesDiff}m`;
      }
    } else if (daysDiff === 1) {
      timeText = `Atrasado 1 dia ${hoursDiff}h`;
    } else {
      timeText = `Atrasado ${daysDiff} dias`;
    }
  } else {
    if (daysDiff === 0) {
      if (hoursDiff === 0) {
        colorClass = "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400 border-red-300 animate-pulse";
        timeText = `Vence em ${minutesDiff}m`;
      } else if (hoursDiff <= 1) {
        colorClass = "text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400 border-orange-300";
        timeText = `Vence em ${hoursDiff}h ${minutesDiff}m`;
      } else {
        colorClass = "text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400 border-orange-300";
        timeText = `Vence em ${hoursDiff}h ${minutesDiff}m`;
      }
    } else if (daysDiff === 1) {
      colorClass = "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-300";
      timeText = `Vence amanhã ${hoursDiff > 0 ? `em ${hoursDiff}h` : ""}`.trim();
    } else if (daysDiff <= 3) {
      colorClass = "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-300";
      timeText = `Vence em ${daysDiff} dias`;
    } else {
      colorClass = "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 border-green-300";
      timeText = `Vence em ${daysDiff} dias`;
    }
  }
  
  return (
    <Badge variant="outline" className={cn("text-xs font-medium flex items-center gap-1", colorClass)}>
      {isOverdue ? <AlertTriangle className="h-3 w-3" /> : <Timer className="h-3 w-3" />}
      {timeText}
    </Badge>
  );
};

const priorityColors = {
  low: "bg-emerald-100 text-emerald-700 border-emerald-300",
  medium: "bg-sky-100 text-sky-700 border-sky-300",
  high: "bg-amber-100 text-amber-700 border-amber-300",
  urgent: "bg-rose-100 text-rose-700 border-rose-300",
};

const priorityLabels = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  urgent: "Urgente",
};

const Tarefas = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { tasks, isLoading, createTask, updateTask, deleteTask } = useTasks();
  const { employees } = useEmployees();
  const { users } = useUsers();
  const { labels } = useTaskLabels();
  
  // Enable due notifications for tasks
  useTaskDueNotifications(tasks);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [parentTaskId, setParentTaskId] = useState<string | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<string[]>([]);
  
  // Advanced filters state
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    priority: "all",
    responsibleId: "all",
    labels: [] as string[],
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
  });

  // Combined responsibles list
  const responsibles = useMemo(() => {
    const allUsers = [...employees, ...users];
    return allUsers.map((u) => ({ id: u.id, name: u.name }));
  }, [employees, users]);

  // Check for task parameter in URL to open specific task
  useEffect(() => {
    const taskId = searchParams.get("task");
    if (taskId && tasks.length > 0) {
      const taskToOpen = tasks.find(t => t.id === taskId);
      if (taskToOpen) {
        setEditingTask(taskToOpen);
        setParentTaskId(null);
        setDialogOpen(true);
        // Clear the URL parameter
        searchParams.delete("task");
        setSearchParams(searchParams, { replace: true });
      }
    }
  }, [searchParams, tasks, setSearchParams]);

  // Apply advanced filters
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Status filter
      if (filters.status !== "all" && task.status !== filters.status) return false;
      
      // Priority filter
      if (filters.priority !== "all" && task.priority !== filters.priority) return false;
      
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(searchLower);
        const matchesDescription = task.description?.toLowerCase().includes(searchLower);
        if (!matchesTitle && !matchesDescription) return false;
      }
      
      // Responsible filter
      if (filters.responsibleId !== "all" && task.responsible_id !== filters.responsibleId) {
        return false;
      }
      
      // Labels filter
      if (filters.labels.length > 0) {
        const taskLabels = task.labels || [];
        const hasMatchingLabel = filters.labels.some((label) => taskLabels.includes(label));
        if (!hasMatchingLabel) return false;
      }
      
      // Date range filter
      if (filters.startDate || filters.endDate) {
        if (!task.due_date) return false;
        const taskDate = new Date(task.due_date + "T12:00:00");
        
        if (filters.startDate && filters.endDate) {
          if (!isWithinInterval(taskDate, { start: filters.startDate, end: filters.endDate })) {
            return false;
          }
        } else if (filters.startDate && taskDate < filters.startDate) {
          return false;
        } else if (filters.endDate && taskDate > filters.endDate) {
          return false;
        }
      }
      
      return true;
    });
  }, [tasks, filters]);

  // Separate parent tasks and subtasks
  const parentTasks = filteredTasks.filter(t => !t.parent_task_id);
  const getSubtasks = (parentId: string) => filteredTasks.filter(t => t.parent_task_id === parentId);

  const pendingTasks = parentTasks.filter((t) => t.status !== "completed" && t.status !== "cancelled");
  const completedTasks = parentTasks.filter((t) => t.status === "completed");

  const handleOpenDialog = (task?: Task, asSubtask?: string) => {
    if (task) {
      setEditingTask(task);
      setParentTaskId(null);
    } else {
      setEditingTask(null);
      setParentTaskId(asSubtask || null);
    }
    setDialogOpen(true);
  };

  const handleSave = async (taskData: Partial<Task>) => {
    if (editingTask) {
      updateTask({ id: editingTask.id, ...taskData } as any);
    } else {
      await createTask({ title: taskData.title!, ...taskData } as any);
    }
  };

  const handleToggleComplete = (task: Task) => {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    updateTask({ 
      id: task.id, 
      status: newStatus,
      completed_at: newStatus === "completed" ? new Date().toISOString() : null
    });
  };

  const toggleExpand = (taskId: string) => {
    setExpandedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const getResponsibleName = (id: string | null) => {
    if (!id) return null;
    const employee = employees.find((e) => e.id === id);
    return employee?.name;
  };

  const getAssignedNames = (ids: string[] | null) => {
    if (!ids || ids.length === 0) return null;
    const allUsers = [...employees, ...users];
    return ids.map(id => allUsers.find(u => u.id === id)?.name).filter(Boolean).join(", ");
  };

  const renderTask = (task: Task, isSubtask = false) => {
    const subtasks = getSubtasks(task.id);
    const hasSubtasks = subtasks.length > 0;
    const isExpanded = expandedTasks.includes(task.id);

    return (
      <div key={task.id} className={cn("space-y-2", isSubtask && "ml-6 border-l-2 pl-4")}>
        <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
          {hasSubtasks && !isSubtask && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 mt-0.5"
              onClick={() => toggleExpand(task.id)}
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          )}
          <button
            onClick={() => handleToggleComplete(task)}
            aria-label={task.status === "completed" ? "Reabrir tarefa" : "Concluir tarefa"}
            className={cn(
              "flex-none h-6 w-6 rounded-full flex items-center justify-center mt-0.5 focus:outline-none transition-colors",
              task.status === "completed" ? "bg-primary text-primary-foreground" : "border border-border bg-transparent text-muted-foreground"
            )}
          >
            {task.status === "completed" ? <Check className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn("font-medium", task.status === "completed" && "line-through text-muted-foreground")}>
                {task.title}
              </span>
              <Badge variant="outline" className={cn("text-xs", priorityColors[(task.priority || "medium") as keyof typeof priorityColors])}>
                {priorityLabels[(task.priority || "medium") as keyof typeof priorityLabels]}
              </Badge>
              {hasSubtasks && (
                <Badge variant="secondary" className="text-xs">
                  {subtasks.length} subtarefa{subtasks.length > 1 ? "s" : ""}
                </Badge>
              )}
            </div>
            {task.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
            )}
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
              {task.due_date && (
                <TaskTimeCounter dueDate={task.due_date} dueTime={task.due_time} status={task.status} />
              )}
              {task.due_date && (
                <span className="flex items-center gap-1">
                  <CalendarIcon className="h-3 w-3" />
                  {format(new Date(task.due_date + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })}
                </span>
              )}
              {task.due_time && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {task.due_time}
                </span>
              )}
              {task.responsible_id && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {getResponsibleName(task.responsible_id)}
                </span>
              )}
              {task.assigned_users && task.assigned_users.length > 0 && (
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {getAssignedNames(task.assigned_users)}
                </span>
              )}
            </div>
            {task.labels && task.labels.length > 0 && (
              <div className="flex gap-1 mt-2 flex-wrap">
                {task.labels.map((label) => (
                  <Badge key={label} variant="secondary" className="text-xs">
                    <Tag className="h-3 w-3 mr-1" />
                    {label}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-1">
            {!isSubtask && (
              <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(undefined, task.id)} title="Adicionar subtarefa">
                <Plus className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(task)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => deleteTask(task.id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
        
        {/* Render subtasks if expanded */}
        {isExpanded && subtasks.map(subtask => renderTask(subtask, true))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tarefas</h1>
          <p className="text-muted-foreground mt-1">Gerencie suas tarefas e compromissos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/relatorio-tarefas")}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Relatório
          </Button>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Tarefa
          </Button>
        </div>
      </div>

      {/* Advanced Filters */}
      <TaskAdvancedFilters
        filters={filters}
        onFiltersChange={setFilters}
        labels={labels}
        responsibles={responsibles}
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Circle className="h-5 w-5 text-yellow-600" />
              Pendentes ({pendingTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? (
              <p className="text-muted-foreground">Carregando...</p>
            ) : pendingTasks.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Nenhuma tarefa pendente</p>
            ) : (
              pendingTasks.map((task) => renderTask(task))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Concluídas ({completedTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {completedTasks.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Nenhuma tarefa concluída</p>
            ) : (
              completedTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30"
                >
                  <button
                    onClick={() => handleToggleComplete(task)}
                    aria-label="Reabrir tarefa"
                    className="flex-none h-6 w-6 rounded-full flex items-center justify-center mt-0.5 bg-primary text-primary-foreground focus:outline-none"
                  >
                    <Check className="h-3 w-3" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <span className="line-through text-muted-foreground">{task.title}</span>
                    {task.completed_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Concluída em {format(new Date(task.completed_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </p>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteTask(task.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editingTask}
        parentTaskId={parentTaskId}
        onSave={handleSave}
      />
    </div>
  );
};

export default Tarefas;
