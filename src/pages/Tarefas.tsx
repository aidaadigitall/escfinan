import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useTasks, Task } from "@/hooks/useTasks";
import { useEmployees } from "@/hooks/useEmployees";
import { useUsers } from "@/hooks/useUsers";
import { useTaskDueNotifications } from "@/hooks/useTaskDueNotifications";
import { useTaskLabels } from "@/hooks/useTaskLabels";
import { useProjects } from "@/hooks/useProjects";
import { TaskDialog } from "@/components/TaskDialog";
import { TaskAdvancedFilters } from "@/components/TaskAdvancedFilters";
import { TaskCard } from "@/components/TaskCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BarChart3, Plus, Search, Circle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const Tarefas = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { tasks, isLoading, createTask, updateTask, deleteTask } = useTasks();
  const { employees } = useEmployees();
  const { users } = useUsers();
  const { labels } = useTaskLabels();
  const { data: projects } = useProjects();

  // Enable due notifications for tasks
  useTaskDueNotifications(tasks);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [parentTaskId, setParentTaskId] = useState<string | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<string[]>([]);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCompleted, setShowCompleted] = useState(true);

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
        searchParams.delete("task");
        setSearchParams(searchParams, { replace: true });
      }
    }
  }, [searchParams, tasks, setSearchParams]);

  // Apply advanced filters
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filters.status !== "all" && task.status !== filters.status) return false;
      if (filters.priority !== "all" && task.priority !== filters.priority) return false;

      const searchLower = (filters.search || searchTerm).toLowerCase();
      if (searchLower) {
        const matchesTitle = task.title.toLowerCase().includes(searchLower);
        const matchesDescription = task.description?.toLowerCase().includes(searchLower);
        if (!matchesTitle && !matchesDescription) return false;
      }

      if (filters.responsibleId !== "all" && task.responsible_id !== filters.responsibleId) {
        return false;
      }

      if (filters.labels.length > 0) {
        const taskLabels = task.labels || [];
        const hasMatchingLabel = filters.labels.some((label) => taskLabels.includes(label));
        if (!hasMatchingLabel) return false;
      }

      return true;
    });
  }, [tasks, filters, searchTerm]);

  // Separate parent tasks and subtasks
  const parentTasks = filteredTasks.filter(t => !t.parent_task_id);
  const getSubtasks = (parentId: string) => filteredTasks.filter(t => t.parent_task_id === parentId);

  const pendingTasks = parentTasks.filter((t) => t.status !== "completed" && t.status !== "cancelled");
  const completedTasks = showCompleted ? parentTasks.filter((t) => t.status === "completed") : [];

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

  const getProjectName = (projectId: string | null) => {
    if (!projectId || !projects) return null;
    return projects.find((p) => p.id === projectId)?.name;
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDropOnColumn = (e: React.DragEvent, targetStatus: "pending" | "completed") => {
    e.preventDefault();
    if (draggedTask && draggedTask.status !== targetStatus) {
      // Validate that targetStatus is a valid value
      const validStatuses = ["pending", "completed"];
      if (!validStatuses.includes(targetStatus)) {
        console.error(`Invalid status: ${targetStatus}`);
        setDraggedTask(null);
        return;
      }

      updateTask({
        id: draggedTask.id,
        status: targetStatus,
        completed_at: targetStatus === "completed" ? new Date().toISOString() : null
      });
    }
    setDraggedTask(null);
  };

  // Toggle completed tasks visibility
  const toggleCompletedVisibility = () => {
    setShowCompleted(!showCompleted);
  };

  const renderTask = (task: Task, isSubtask = false) => {
    const subtasks = getSubtasks(task.id);
    const hasSubtasks = subtasks.length > 0;
    const isExpanded = expandedTasks.includes(task.id);

    return (
      <div key={task.id} className={cn("space-y-2", isSubtask && "ml-6 border-l-2 pl-4")}>
        <TaskCard
          task={task}
          isSubtask={isSubtask}
          isDragging={draggedTask?.id === task.id}
          hasSubtasks={hasSubtasks}
          isExpanded={isExpanded}
          onToggleComplete={handleToggleComplete}
          onEdit={handleOpenDialog}
          onDelete={deleteTask}
          onAddSubtask={handleOpenDialog}
          onToggleExpand={toggleExpand}
          getResponsibleName={getResponsibleName}
          getAssignedNames={getAssignedNames}
          getProjectName={getProjectName}
          onDragStart={(e) => handleDragStart(e, task)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDropOnColumn(e, task.status as "pending" | "completed")}
        />

        {/* Render subtasks if expanded */}
        {isExpanded && subtasks.map(subtask => renderTask(subtask, true))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Tarefas</h1>
          <p className="text-muted-foreground mt-1">Gerencie suas tarefas e compromissos</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
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

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar tarefas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Advanced Filters */}
      <TaskAdvancedFilters
        filters={filters}
        onFiltersChange={setFilters}
        labels={labels}
        responsibles={responsibles}
      />

      {/* Kanban Board */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pending Column */}
        <div
          onDragOver={handleDragOver}
          onDrop={(e) => handleDropOnColumn(e, "pending")}
          className={cn(
            "rounded-lg border-2 border-dashed p-4 transition-colors",
            draggedTask?.status === "completed" && "border-primary/50 bg-primary/5"
          )}
        >
          <div className="flex items-center gap-2 mb-4">
            <Circle className="h-5 w-5 text-yellow-600" />
            <h2 className="text-lg font-semibold">Pendentes</h2>
            <span className="ml-auto text-sm text-muted-foreground bg-muted px-2 py-1 rounded-full">
              {pendingTasks.length}
            </span>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : pendingTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Circle className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">Nenhuma tarefa pendente</p>
              </div>
            ) : (
              pendingTasks.map((task) => renderTask(task))
            )}
          </div>
        </div>

        {/* Completed Column */}
        <div
          onDragOver={handleDragOver}
          onDrop={(e) => handleDropOnColumn(e, "completed")}
          className={cn(
            "rounded-lg border-2 border-dashed p-4 transition-colors",
            draggedTask?.status === "pending" && "border-primary/50 bg-primary/5"
          )}
        >
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleCompletedVisibility}
              className="p-0 h-6 w-6"
              title={showCompleted ? "Ocultar tarefas concluídas" : "Mostrar tarefas concluídas"}
            >
              <CheckCircle2 className={cn("h-5 w-5", showCompleted ? "text-green-600" : "text-muted-foreground")} />
            </Button>
            <h2 className="text-lg font-semibold">Concluídas</h2>
            <span className="ml-auto text-sm text-muted-foreground bg-muted px-2 py-1 rounded-full">
              {showCompleted ? completedTasks.length : parentTasks.filter((t) => t.status === "completed").length}
            </span>
          </div>

          <div className="space-y-3">
            {completedTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">Nenhuma tarefa concluída</p>
              </div>
            ) : (
              completedTasks.map((task) => renderTask(task))
            )}
          </div>
        </div>
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
