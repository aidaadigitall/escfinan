import { useState } from "react";
import { useTasks, Task } from "@/hooks/useTasks";
import { useEmployees } from "@/hooks/useEmployees";
import { useUsers } from "@/hooks/useUsers";
import { TaskDialog } from "@/components/TaskDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Plus, Calendar as CalendarIcon, Flag, Tag, Trash2, Edit, 
  CheckCircle2, Circle, Clock, User, Filter, ChevronDown, ChevronRight, Users
} from "lucide-react";
import { cn } from "@/lib/utils";

const priorityColors = {
  low: "bg-gray-100 text-gray-800 border-gray-300",
  medium: "bg-blue-100 text-blue-800 border-blue-300",
  high: "bg-orange-100 text-orange-800 border-orange-300",
  urgent: "bg-red-100 text-red-800 border-red-300",
};

const priorityLabels = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  urgent: "Urgente",
};

const Tarefas = () => {
  const { tasks, isLoading, createTask, updateTask, deleteTask } = useTasks();
  const { employees } = useEmployees();
  const { users } = useUsers();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [parentTaskId, setParentTaskId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [expandedTasks, setExpandedTasks] = useState<string[]>([]);

  const filteredTasks = tasks.filter((task) => {
    if (filterStatus !== "all" && task.status !== filterStatus) return false;
    if (filterPriority !== "all" && task.priority !== filterPriority) return false;
    return true;
  });

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
          <Checkbox
            checked={task.status === "completed"}
            onCheckedChange={() => handleToggleComplete(task)}
            className="mt-1"
          />
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
                <span className="flex items-center gap-1">
                  <CalendarIcon className="h-3 w-3" />
                  {format(new Date(task.due_date), "dd/MM/yyyy", { locale: ptBR })}
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
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Tarefa
        </Button>
      </div>

      <div className="flex gap-4 flex-wrap">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="in_progress">Em Andamento</SelectItem>
            <SelectItem value="completed">Concluída</SelectItem>
            <SelectItem value="cancelled">Cancelada</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-[180px]">
            <Flag className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="low">Baixa</SelectItem>
            <SelectItem value="medium">Média</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="urgent">Urgente</SelectItem>
          </SelectContent>
        </Select>
      </div>

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
                  <Checkbox
                    checked={true}
                    onCheckedChange={() => handleToggleComplete(task)}
                    className="mt-1"
                  />
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
