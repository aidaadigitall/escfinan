import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowLeft,
  Calendar,
  Clock,
  DollarSign,
  CheckCircle2,
  ListTodo,
  TrendingUp,
  Users,
  Plus,
  Pencil,
  Trash2,
  Play,
  Pause,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useProject,
  useUpdateProjectStatus,
  useProjectMetrics,
} from "@/hooks/useProjects";
import {
  useProjectTasks,
  useCreateTask,
  useUpdateTaskStatus,
  useDeleteTask,
} from "@/hooks/useProjectTasks";
import { useProjectTimeEntries, useCreateTimeEntry, useDeleteTimeEntry } from "@/hooks/useProjectTimeEntries";
import { useProjectExpenses, useCreateExpense, useDeleteExpense } from "@/hooks/useProjectExpenses";
import { ProjectDialog } from "@/components/ProjectDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

const statusConfig: Record<string, { label: string; color: string }> = {
  planning: { label: "Planejamento", color: "bg-blue-500" },
  active: { label: "Ativo", color: "bg-green-500" },
  on_hold: { label: "Em Espera", color: "bg-yellow-500" },
  completed: { label: "Concluído", color: "bg-purple-500" },
  cancelled: { label: "Cancelado", color: "bg-red-500" },
};

const taskStatusConfig: Record<string, { label: string; color: string }> = {
  todo: { label: "A Fazer", color: "bg-slate-500" },
  in_progress: { label: "Em Progresso", color: "bg-blue-500" },
  review: { label: "Revisão", color: "bg-yellow-500" },
  completed: { label: "Concluído", color: "bg-green-500" },
  blocked: { label: "Bloqueado", color: "bg-red-500" },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: "Baixa", color: "text-slate-500" },
  medium: { label: "Média", color: "text-yellow-500" },
  high: { label: "Alta", color: "text-orange-500" },
  critical: { label: "Crítica", color: "text-red-500" },
};

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);

  const { data: project, isLoading } = useProject(id);
  const { data: metrics } = useProjectMetrics(id);
  const { data: tasks } = useProjectTasks(id);
  const { data: timeEntries } = useProjectTimeEntries(id);
  const { data: expenses } = useProjectExpenses(id);

  const updateStatus = useUpdateProjectStatus();
  const updateTaskStatus = useUpdateTaskStatus();
  const deleteTask = useDeleteTask();

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando projeto...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <p className="text-muted-foreground">Projeto não encontrado</p>
      </div>
    );
  }

  const statusInfo = statusConfig[project.status] || statusConfig.planning;
  const budgetUsed = metrics
    ? (metrics.totalHours * (Number(project.hourly_rate) || 0)) + metrics.totalExpenses
    : 0;
  const budgetPercentage = project.budget_amount > 0
    ? Math.min((budgetUsed / Number(project.budget_amount)) * 100, 100)
    : 0;
  const hoursPercentage = project.budget_hours > 0
    ? Math.min(((metrics?.totalHours || 0) / Number(project.budget_hours)) * 100, 100)
    : 0;

  // Dados para gráficos
  const taskStatusData = [
    { name: "Concluídas", value: metrics?.completedTasks || 0 },
    { name: "Pendentes", value: metrics?.pendingTasks || 0 },
  ];

  const budgetData = [
    {
      name: "Orçamento",
      Orçado: Number(project.budget_amount),
      Utilizado: budgetUsed,
    },
  ];

  const handleStatusChange = async (newStatus: typeof project.status) => {
    await updateStatus.mutateAsync({ id: project.id, status: newStatus });
  };

  const handleTaskStatusChange = async (taskId: string, newStatus: string) => {
    await updateTaskStatus.mutateAsync({
      id: taskId,
      status: newStatus as any,
      project_id: project.id,
    });
  };

  const handleDeleteTask = async () => {
    if (deleteTaskId) {
      await deleteTask.mutateAsync({ id: deleteTaskId, project_id: project.id });
      setDeleteTaskId(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/projetos")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <Badge className={`${statusInfo.color} text-white`}>
              {statusInfo.label}
            </Badge>
            {project.code && (
              <Badge variant="outline">{project.code}</Badge>
            )}
          </div>
          {project.client && (
            <p className="text-muted-foreground">
              Cliente: {project.client.name}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {project.status === "planning" && (
            <Button onClick={() => handleStatusChange("active")}>
              <Play className="h-4 w-4 mr-2" />
              Iniciar
            </Button>
          )}
          {project.status === "active" && (
            <>
              <Button variant="outline" onClick={() => handleStatusChange("on_hold")}>
                <Pause className="h-4 w-4 mr-2" />
                Pausar
              </Button>
              <Button onClick={() => handleStatusChange("completed")}>
                <Check className="h-4 w-4 mr-2" />
                Concluir
              </Button>
            </>
          )}
          {project.status === "on_hold" && (
            <Button onClick={() => handleStatusChange("active")}>
              <Play className="h-4 w-4 mr-2" />
              Retomar
            </Button>
          )}
          <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </div>
      </div>

      {/* Progress Bar Principal */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Progresso do Projeto</span>
              <span className="text-2xl font-bold">{project.progress_percentage}%</span>
            </div>
            <Progress value={project.progress_percentage} className="h-4" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {metrics?.completedTasks || 0} de {metrics?.totalTasks || 0} tarefas concluídas
              </span>
              {project.expected_end_date && (
                <span>
                  Previsão: {format(new Date(project.expected_end_date), "dd/MM/yyyy", { locale: ptBR })}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tarefas</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.completedTasks || 0}/{metrics?.totalTasks || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics?.taskCompletionRate || 0}% concluídas
            </p>
            <Progress value={metrics?.taskCompletionRate || 0} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Horas</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.totalHours?.toFixed(1) || 0}h
            </div>
            <p className="text-xs text-muted-foreground">
              de {Number(project.budget_hours) || 0}h orçadas
            </p>
            <Progress value={hoursPercentage} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orçamento</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
                maximumFractionDigits: 0,
              }).format(budgetUsed)}
            </div>
            <p className="text-xs text-muted-foreground">
              de {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
                maximumFractionDigits: 0,
              }).format(Number(project.budget_amount) || 0)}
            </p>
            <Progress
              value={budgetPercentage}
              className={`mt-2 h-2 ${budgetPercentage > 90 ? "[&>div]:bg-red-500" : ""}`}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(metrics?.totalExpenses || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics?.billableExpenses
                ? new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(metrics.billableExpenses) + " faturável"
                : "Nenhuma despesa faturável"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Conteúdo */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="tasks">
            Tarefas ({tasks?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="hours">
            Horas ({timeEntries?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="expenses">
            Despesas ({expenses?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Tarefas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Status das Tarefas</CardTitle>
              </CardHeader>
              <CardContent>
                {(metrics?.totalTasks || 0) > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={taskStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {taskStatusData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                    Nenhuma tarefa cadastrada
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Gráfico de Orçamento */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Orçamento vs Utilizado</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={budgetData}>
                    <XAxis dataKey="name" />
                    <YAxis
                      tickFormatter={(value) =>
                        new Intl.NumberFormat("pt-BR", {
                          notation: "compact",
                          compactDisplay: "short",
                        }).format(value)
                      }
                    />
                    <Tooltip
                      formatter={(value: number) =>
                        new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(value)
                      }
                    />
                    <Legend />
                    <Bar dataKey="Orçado" fill="#3b82f6" />
                    <Bar dataKey="Utilizado" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Informações do Projeto */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {project.description && (
                  <div>
                    <span className="text-sm text-muted-foreground">Descrição</span>
                    <p className="text-sm">{project.description}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Tipo</span>
                    <p className="text-sm font-medium">
                      {project.project_type === "fixed_price" && "Preço Fixo"}
                      {project.project_type === "time_material" && "Tempo & Material"}
                      {project.project_type === "retainer" && "Retenção"}
                      {project.project_type === "internal" && "Interno"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Prioridade</span>
                    <p className={`text-sm font-medium ${priorityConfig[project.priority]?.color}`}>
                      {priorityConfig[project.priority]?.label}
                    </p>
                  </div>
                  {project.start_date && (
                    <div>
                      <span className="text-sm text-muted-foreground">Início</span>
                      <p className="text-sm font-medium">
                        {format(new Date(project.start_date), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  )}
                  {project.expected_end_date && (
                    <div>
                      <span className="text-sm text-muted-foreground">Previsão Término</span>
                      <p className="text-sm font-medium">
                        {format(new Date(project.expected_end_date), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  )}
                  {project.hourly_rate && (
                    <div>
                      <span className="text-sm text-muted-foreground">Taxa Horária</span>
                      <p className="text-sm font-medium">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(Number(project.hourly_rate))}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tarefas */}
        <TabsContent value="tasks" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Tarefas do Projeto</CardTitle>
            </CardHeader>
            <CardContent>
              {tasks && tasks.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tarefa</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Prioridade</TableHead>
                      <TableHead>Horas Est.</TableHead>
                      <TableHead>Prazo</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{task.title}</p>
                            {task.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {task.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`${taskStatusConfig[task.status]?.color} text-white cursor-pointer`}
                            onClick={() => {
                              const statuses = ["todo", "in_progress", "review", "completed"];
                              const currentIndex = statuses.indexOf(task.status);
                              const nextStatus = statuses[(currentIndex + 1) % statuses.length];
                              handleTaskStatusChange(task.id, nextStatus);
                            }}
                          >
                            {taskStatusConfig[task.status]?.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={priorityConfig[task.priority]?.color}>
                            {priorityConfig[task.priority]?.label}
                          </span>
                        </TableCell>
                        <TableCell>{task.estimated_hours}h</TableCell>
                        <TableCell>
                          {task.due_date
                            ? format(new Date(task.due_date), "dd/MM/yyyy", { locale: ptBR })
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTaskId(task.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <ListTodo className="h-8 w-8 mb-2" />
                  <p>Nenhuma tarefa cadastrada</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Horas */}
        <TabsContent value="hours" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Registro de Horas</CardTitle>
            </CardHeader>
            <CardContent>
              {timeEntries && timeEntries.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Tarefa</TableHead>
                      <TableHead>Horas</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timeEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          {format(new Date(entry.entry_date), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>{entry.description || "-"}</TableCell>
                        <TableCell>{entry.task?.title || "-"}</TableCell>
                        <TableCell>{entry.hours}h</TableCell>
                        <TableCell>
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(entry.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              entry.status === "approved"
                                ? "default"
                                : entry.status === "rejected"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {entry.status === "approved" && "Aprovado"}
                            {entry.status === "rejected" && "Rejeitado"}
                            {entry.status === "pending" && "Pendente"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <Clock className="h-8 w-8 mb-2" />
                  <p>Nenhum registro de horas</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Despesas */}
        <TabsContent value="expenses" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Despesas do Projeto</CardTitle>
            </CardHeader>
            <CardContent>
              {expenses && expenses.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Faturável</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>
                          {format(new Date(expense.expense_date), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>{expense.description}</TableCell>
                        <TableCell>{expense.expense_type || "-"}</TableCell>
                        <TableCell>
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(expense.amount)}
                        </TableCell>
                        <TableCell>
                          {expense.is_billable ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              expense.status === "approved"
                                ? "default"
                                : expense.status === "rejected"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {expense.status === "approved" && "Aprovado"}
                            {expense.status === "rejected" && "Rejeitado"}
                            {expense.status === "pending" && "Pendente"}
                            {expense.status === "reimbursed" && "Reembolsado"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <DollarSign className="h-8 w-8 mb-2" />
                  <p>Nenhuma despesa cadastrada</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <ProjectDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        project={project}
      />

      <ConfirmDialog
        open={!!deleteTaskId}
        onOpenChange={(open) => !open && setDeleteTaskId(null)}
        onConfirm={handleDeleteTask}
        title="Excluir Tarefa"
        description="Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita."
      />
    </div>
  );
}
