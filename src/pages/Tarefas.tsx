import { useState } from "react";
import { useTasks, Task } from "@/hooks/useTasks";
import { useEmployees } from "@/hooks/useEmployees";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Calendar as CalendarIcon, Flag, Tag, Trash2, Edit, CheckCircle2, Circle, Clock, User, Filter } from "lucide-react";
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

const statusColors = {
  pending: "text-yellow-600",
  in_progress: "text-blue-600",
  completed: "text-green-600",
  cancelled: "text-gray-400",
};

const Tarefas = () => {
  const { tasks, isLoading, createTask, updateTask, deleteTask } = useTasks();
  const { employees } = useEmployees();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [formData, setFormData] = useState<Partial<Task>>({
    title: "",
    description: "",
    priority: "medium",
    status: "pending",
    due_date: null,
    due_time: null,
    responsible_id: null,
    labels: [],
    reminder_date: null,
    is_recurring: false,
    recurrence_type: null,
  });
  const [newLabel, setNewLabel] = useState("");

  const filteredTasks = tasks.filter((task) => {
    if (filterStatus !== "all" && task.status !== filterStatus) return false;
    if (filterPriority !== "all" && task.priority !== filterPriority) return false;
    return true;
  });

  const pendingTasks = filteredTasks.filter((t) => t.status !== "completed" && t.status !== "cancelled");
  const completedTasks = filteredTasks.filter((t) => t.status === "completed");

  const handleOpenDialog = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setFormData(task);
    } else {
      setEditingTask(null);
      setFormData({
        title: "",
        description: "",
        priority: "medium",
        status: "pending",
        due_date: null,
        due_time: null,
        responsible_id: null,
        labels: [],
        reminder_date: null,
        is_recurring: false,
        recurrence_type: null,
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title) return;

    if (editingTask) {
      updateTask({ id: editingTask.id, ...formData } as any);
    } else {
      await createTask({ title: formData.title!, ...formData } as any);
    }
    setDialogOpen(false);
  };

  const handleToggleComplete = (task: Task) => {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    updateTask({ 
      id: task.id, 
      status: newStatus,
      completed_at: newStatus === "completed" ? new Date().toISOString() : null
    });
  };

  const handleAddLabel = () => {
    if (newLabel && !formData.labels?.includes(newLabel)) {
      setFormData({ ...formData, labels: [...(formData.labels || []), newLabel] });
      setNewLabel("");
    }
  };

  const handleRemoveLabel = (label: string) => {
    setFormData({ ...formData, labels: formData.labels?.filter((l) => l !== label) });
  };

  const getResponsibleName = (id: string | null) => {
    if (!id) return null;
    const employee = employees.find((e) => e.id === id);
    return employee?.name;
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
              pendingTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    checked={task.status === "completed"}
                    onCheckedChange={() => handleToggleComplete(task)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{task.title}</span>
                      <Badge variant="outline" className={cn("text-xs", priorityColors[(task.priority || "medium") as keyof typeof priorityColors])}>
                        {priorityLabels[(task.priority || "medium") as keyof typeof priorityLabels]}
                      </Badge>
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
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(task)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteTask(task.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTask ? "Editar Tarefa" : "Nova Tarefa"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Título *</label>
              <Input
                value={formData.title || ""}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="O que precisa ser feito?"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Descrição</label>
              <Textarea
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detalhes da tarefa..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Data</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.due_date
                        ? format(new Date(formData.due_date), "dd/MM/yyyy", { locale: ptBR })
                        : "Selecionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.due_date ? new Date(formData.due_date) : undefined}
                      onSelect={(date) => setFormData({ ...formData, due_date: date?.toISOString().split("T")[0] || null })}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label className="text-sm font-medium">Hora</label>
                <Input
                  type="time"
                  value={formData.due_time || ""}
                  onChange={(e) => setFormData({ ...formData, due_time: e.target.value || null })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Prioridade</label>
                <Select
                  value={formData.priority || "medium"}
                  onValueChange={(value: "low" | "medium" | "high" | "urgent") => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Responsável</label>
                <Select
                  value={formData.responsible_id || "none"}
                  onValueChange={(value) => setFormData({ ...formData, responsible_id: value === "none" ? null : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Etiquetas</label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="Nova etiqueta"
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddLabel())}
                />
                <Button type="button" variant="outline" onClick={handleAddLabel}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.labels && formData.labels.length > 0 && (
                <div className="flex gap-1 flex-wrap mt-2">
                  {formData.labels.map((label) => (
                    <Badge key={label} variant="secondary" className="cursor-pointer" onClick={() => handleRemoveLabel(label)}>
                      {label} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Lembrete</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <Clock className="mr-2 h-4 w-4" />
                    {formData.reminder_date
                      ? format(new Date(formData.reminder_date), "dd/MM/yyyy HH:mm", { locale: ptBR })
                      : "Definir lembrete"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.reminder_date ? new Date(formData.reminder_date) : undefined}
                    onSelect={(date) => setFormData({ ...formData, reminder_date: date?.toISOString() || null })}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Tarefas;
