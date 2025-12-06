import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useTasks } from "@/hooks/useTasks";
import { useUsers } from "@/hooks/useUsers";
import { useCurrentUserPermissions } from "@/hooks/useUserPermissions";
import { format, startOfMonth, endOfMonth, subMonths, subDays, isWithinInterval, parseISO, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend 
} from "recharts";
import { CheckCircle2, Clock, AlertTriangle, Target, TrendingUp, Users, CalendarIcon, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

type PeriodType = "3d" | "7d" | "15d" | "1m" | "3m" | "6m" | "12m" | "custom";

const RelatorioTarefas = () => {
  const navigate = useNavigate();
  const { tasks } = useTasks();
  const { users } = useUsers();
  const { permissions, isLoading: permissionsLoading } = useCurrentUserPermissions();
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>("3m");
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);

  // Check permissions
  useEffect(() => {
    if (!permissionsLoading && !permissions.can_view_task_reports) {
      toast.error("Você não tem permissão para acessar esta página");
      navigate("/");
    }
  }, [permissions, permissionsLoading, navigate]);

  // Show loading while checking permissions
  if (permissionsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If no permission, show access denied
  if (!permissions.can_view_task_reports) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Lock className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Acesso Negado</h2>
        <p className="text-muted-foreground">Você não tem permissão para visualizar o relatório de tarefas.</p>
        <Button onClick={() => navigate("/")}>Voltar ao Início</Button>
      </div>
    );
  }

  // Calculate period dates based on selection
  const { periodStart, periodEnd, periodMonths } = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end = endOfDay(now);
    let months = 1;

    switch (selectedPeriod) {
      case "3d":
        start = startOfDay(subDays(now, 2));
        break;
      case "7d":
        start = startOfDay(subDays(now, 6));
        break;
      case "15d":
        start = startOfDay(subDays(now, 14));
        break;
      case "1m":
        start = startOfMonth(now);
        months = 1;
        break;
      case "3m":
        start = subMonths(startOfMonth(now), 2);
        months = 3;
        break;
      case "6m":
        start = subMonths(startOfMonth(now), 5);
        months = 6;
        break;
      case "12m":
        start = subMonths(startOfMonth(now), 11);
        months = 12;
        break;
      case "custom":
        start = customStartDate ? startOfDay(customStartDate) : startOfMonth(now);
        end = customEndDate ? endOfDay(customEndDate) : endOfDay(now);
        months = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (30 * 24 * 60 * 60 * 1000)));
        break;
      default:
        start = subMonths(startOfMonth(now), 2);
        months = 3;
    }

    return { periodStart: start, periodEnd: end, periodMonths: months };
  }, [selectedPeriod, customStartDate, customEndDate]);

  // Calculate metrics for the selected period
  const metrics = useMemo(() => {
    const now = new Date();

    const filteredTasks = tasks.filter(task => {
      if (!task.created_at) return false;
      const taskDate = parseISO(task.created_at);
      return isWithinInterval(taskDate, { start: periodStart, end: periodEnd });
    });

    const totalTasks = filteredTasks.length;
    const completedTasks = filteredTasks.filter(t => t.status === "completed").length;
    const pendingTasks = filteredTasks.filter(t => t.status === "pending").length;
    const inProgressTasks = filteredTasks.filter(t => t.status === "in_progress").length;
    const overdueTasks = filteredTasks.filter(t => {
      if (!t.due_date || t.status === "completed") return false;
      return new Date(t.due_date) < now;
    }).length;

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Tasks by user
    const tasksByUser: Record<string, { total: number; completed: number; pending: number; overdue: number }> = {};
    
    filteredTasks.forEach(task => {
      const assignedUsers = task.assigned_users || [];
      assignedUsers.forEach((userId: string) => {
        if (!tasksByUser[userId]) {
          tasksByUser[userId] = { total: 0, completed: 0, pending: 0, overdue: 0 };
        }
        tasksByUser[userId].total++;
        if (task.status === "completed") {
          tasksByUser[userId].completed++;
        } else if (task.status === "pending") {
          tasksByUser[userId].pending++;
        }
        if (task.due_date && new Date(task.due_date) < now && task.status !== "completed") {
          tasksByUser[userId].overdue++;
        }
      });
    });

    // Tasks by priority
    const tasksByPriority = {
      high: filteredTasks.filter(t => t.priority === "high").length,
      medium: filteredTasks.filter(t => t.priority === "medium").length,
      low: filteredTasks.filter(t => t.priority === "low").length,
    };

    // Tasks by month for line chart
    const tasksByMonth: Record<string, { month: string; created: number; completed: number }> = {};
    
    for (let i = periodMonths - 1; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthKey = format(monthDate, "yyyy-MM");
      const monthLabel = format(monthDate, "MMM/yy", { locale: ptBR });
      tasksByMonth[monthKey] = { month: monthLabel, created: 0, completed: 0 };
    }

    filteredTasks.forEach(task => {
      const createdMonth = format(parseISO(task.created_at), "yyyy-MM");
      if (tasksByMonth[createdMonth]) {
        tasksByMonth[createdMonth].created++;
      }
      
      if (task.status === "completed" && task.completed_at) {
        const completedMonth = format(parseISO(task.completed_at), "yyyy-MM");
        if (tasksByMonth[completedMonth]) {
          tasksByMonth[completedMonth].completed++;
        }
      }
    });

    return {
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      overdueTasks,
      completionRate,
      tasksByUser,
      tasksByPriority,
      tasksByMonth: Object.values(tasksByMonth),
    };
  }, [tasks, periodMonths, periodStart, periodEnd]);

  // Prepare chart data
  const statusChartData = [
    { name: "Concluídas", value: metrics.completedTasks, color: "hsl(var(--chart-1))" },
    { name: "Pendentes", value: metrics.pendingTasks, color: "hsl(var(--chart-2))" },
    { name: "Em Progresso", value: metrics.inProgressTasks, color: "hsl(var(--chart-3))" },
    { name: "Atrasadas", value: metrics.overdueTasks, color: "hsl(var(--chart-4))" },
  ].filter(d => d.value > 0);

  const priorityChartData = [
    { name: "Alta", value: metrics.tasksByPriority.high },
    { name: "Média", value: metrics.tasksByPriority.medium },
    { name: "Baixa", value: metrics.tasksByPriority.low },
  ];

  // User productivity data
  const userProductivityData = useMemo(() => {
    return Object.entries(metrics.tasksByUser).map(([userId, data]) => {
      const user = users.find(u => u.user_id === userId);
      return {
        userId,
        userName: user?.name || "Usuário Desconhecido",
        ...data,
        completionRate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
      };
    }).sort((a, b) => b.completionRate - a.completionRate);
  }, [metrics.tasksByUser, users]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatório de Produtividade</h1>
          <p className="text-muted-foreground">Análise de tarefas por usuário</p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={selectedPeriod} onValueChange={(val) => setSelectedPeriod(val as PeriodType)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3d">Últimos 3 dias</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="15d">Últimos 15 dias</SelectItem>
              <SelectItem value="1m">Último mês</SelectItem>
              <SelectItem value="3m">Últimos 3 meses</SelectItem>
              <SelectItem value="6m">Últimos 6 meses</SelectItem>
              <SelectItem value="12m">Último ano</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>

          {selectedPeriod === "custom" && (
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customStartDate ? format(customStartDate, "dd/MM/yyyy", { locale: ptBR }) : "Início"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-[9999]" align="start">
                  <Calendar
                    mode="single"
                    selected={customStartDate}
                    onSelect={setCustomStartDate}
                    locale={ptBR}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              <span className="text-muted-foreground">até</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customEndDate ? format(customEndDate, "dd/MM/yyyy", { locale: ptBR }) : "Fim"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-[9999]" align="start">
                  <Calendar
                    mode="single"
                    selected={customEndDate}
                    onSelect={setCustomEndDate}
                    locale={ptBR}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Tarefas</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalTasks}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.completedTasks}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{metrics.pendingTasks}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atrasadas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.overdueTasks}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{metrics.completionRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Tasks by Status Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Tarefas por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Tasks by Priority Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Tarefas por Prioridade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-muted-foreground" />
                  <YAxis className="text-muted-foreground" />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Over Time Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução de Tarefas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.tasksByMonth}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-muted-foreground" />
                <YAxis className="text-muted-foreground" />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="created" 
                  name="Criadas" 
                  stroke="hsl(var(--chart-1))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--chart-1))" }}
                />
                <Line 
                  type="monotone" 
                  dataKey="completed" 
                  name="Concluídas" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--chart-2))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* User Productivity Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Produtividade por Usuário
          </CardTitle>
        </CardHeader>
        <CardContent>
          {userProductivityData.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead className="text-center">Total</TableHead>
                  <TableHead className="text-center">Concluídas</TableHead>
                  <TableHead className="text-center">Pendentes</TableHead>
                  <TableHead className="text-center">Atrasadas</TableHead>
                  <TableHead className="text-center">Taxa de Conclusão</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userProductivityData.map((user) => (
                  <TableRow key={user.userId}>
                    <TableCell className="font-medium">{user.userName}</TableCell>
                    <TableCell className="text-center">{user.total}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/30">
                        {user.completed}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30">
                        {user.pending}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-900/30">
                        {user.overdue}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant="outline" 
                        className={
                          user.completionRate >= 80 
                            ? "bg-green-50 text-green-700 dark:bg-green-900/30" 
                            : user.completionRate >= 50 
                              ? "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30"
                              : "bg-red-50 text-red-700 dark:bg-red-900/30"
                        }
                      >
                        {user.completionRate}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma tarefa atribuída a usuários no período selecionado.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RelatorioTarefas;
