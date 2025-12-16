import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useProjects, Project } from "@/hooks/useProjects";
import { useNavigate } from "react-router-dom";
import { format, isPast, differenceInDays, differenceInHours, differenceInMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Briefcase,
  Clock,
  AlertTriangle,
  Calendar,
  TrendingUp,
  CheckCircle2,
  Flag,
  BarChart3,
  ArrowRight,
  Timer,
  DollarSign,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

// Real-time time counter component for projects
const ProjectTimeCounter = ({ project, hideValues }: { project: Project; hideValues: boolean }) => {
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  if (hideValues) return <span>••</span>;
  if (!project.expected_end_date) return null;

  const now = new Date();
  const targetDate = new Date(project.expected_end_date);
  targetDate.setHours(23, 59, 59, 999);

  const isOverdue = isPast(targetDate);
  const totalMinutesDiff = Math.abs(differenceInMinutes(targetDate, now));
  const daysDiff = Math.floor(totalMinutesDiff / (24 * 60));
  const hoursDiff = Math.floor((totalMinutesDiff % (24 * 60)) / 60);

  if (isOverdue) {
    if (daysDiff === 0) {
      return (
        <span className="flex items-center gap-1 text-xs text-red-600">
          <Timer className="h-3 w-3" />
          {hoursDiff > 0 ? `${hoursDiff}h` : "Vencido"}
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

interface ProjectsDashboardProps {
  hideValues?: boolean;
}

export const ProjectsDashboard = ({ hideValues = false }: ProjectsDashboardProps) => {
  const { data: projects, isLoading } = useProjects();
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

  const projectList = projects || [];

  // Calculate KPIs
  const totalProjects = projectList.length;
  const planningProjects = projectList.filter(p => p.status === "planning").length;
  const activeProjects = projectList.filter(p => p.status === "active").length;
  const completedProjects = projectList.filter(p => p.status === "completed").length;
  const onHoldProjects = projectList.filter(p => p.status === "on_hold").length;

  // Overdue projects (past expected_end_date and not completed)
  const overdueProjects = projectList.filter(p => {
    if (!p.expected_end_date || p.status === "completed" || p.status === "cancelled") return false;
    return isPast(new Date(p.expected_end_date));
  });

  // High priority and critical projects
  const highPriorityProjects = projectList.filter(
    p => (p.priority === "high" || p.priority === "critical") && p.status !== "completed" && p.status !== "cancelled"
  ).length;

  // Critical projects
  const criticalProjects = projectList.filter(
    p => p.priority === "critical" && p.status === "active"
  );

  // Completion rate
  const completionRate = totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0;

  // Budget metrics
  const totalBudget = projectList.reduce((sum, p) => sum + (p.budget_amount || 0), 0);
  const activeBudget = projectList
    .filter(p => p.status === "active")
    .reduce((sum, p) => sum + (p.budget_amount || 0), 0);

  // Upcoming projects (next 30 days)
  const today = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const upcomingProjects = projectList
    .filter(p => {
      if (!p.expected_end_date || p.status === "completed" || p.status === "cancelled") return false;
      const endDate = new Date(p.expected_end_date);
      return endDate >= today && endDate <= thirtyDaysFromNow;
    })
    .sort((a, b) => new Date(a.expected_end_date!).getTime() - new Date(b.expected_end_date!).getTime())
    .slice(0, 5);

  // Projects starting this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const endOfMonth = new Date();
  endOfMonth.setMonth(endOfMonth.getMonth() + 1);
  endOfMonth.setDate(0);
  endOfMonth.setHours(23, 59, 59, 999);

  const projectsStartingThisMonth = projectList.filter(p => {
    if (!p.start_date) return false;
    const startDate = new Date(p.start_date);
    return startDate >= startOfMonth && startDate <= endOfMonth;
  }).length;

  const projectsEndingThisMonth = projectList.filter(p => {
    if (!p.expected_end_date) return false;
    const endDate = new Date(p.expected_end_date);
    return endDate >= startOfMonth && endDate <= endOfMonth;
  }).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-primary" />
          Dashboard de Projetos
        </h2>
        <Button variant="outline" size="sm" onClick={() => navigate("/projetos")}>
          Ver todos
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4">
        {/* Total Projects */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{hideValues ? "••" : totalProjects}</p>
                <p className="text-xs text-muted-foreground">Total de projetos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Planning */}
        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/20">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{hideValues ? "••" : planningProjects}</p>
                <p className="text-xs text-muted-foreground">Planejamento</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active */}
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{hideValues ? "••" : activeProjects}</p>
                <p className="text-xs text-muted-foreground">Ativos</p>
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
                <p className="text-2xl font-bold text-green-600">{hideValues ? "••" : completedProjects}</p>
                <p className="text-xs text-muted-foreground">Concluídos</p>
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
                <p className="text-2xl font-bold text-red-600">{hideValues ? "••" : overdueProjects.length}</p>
                <p className="text-xs text-muted-foreground">Atrasados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* High Priority */}
        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <Flag className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">{hideValues ? "••" : highPriorityProjects}</p>
                <p className="text-xs text-muted-foreground">Alta prioridade</p>
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
                {hideValues ? "••••" : `${completedProjects} de ${totalProjects} projetos concluídos`}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Budget Performance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Desempenho de Orçamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">
                  {hideValues ? "••••" : `R$ ${(totalBudget / 1000).toFixed(1)}k`}
                </span>
                <span className="text-xs text-muted-foreground">Total</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-muted">
                  <span className="text-muted-foreground">Ativo:</span>
                  <span className="font-medium ml-1">{hideValues ? "••" : activeBudget > 0 ? `R$ ${(activeBudget / 1000).toFixed(1)}k` : "R$ 0"}</span>
                </div>
                <div className="p-2 rounded-lg bg-muted">
                  <span className="text-muted-foreground">Projetos:</span>
                  <span className="font-medium ml-1">{hideValues ? "••" : activeProjects}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-muted">
                  <span className="text-muted-foreground">Iniciando:</span>
                  <span className="font-medium ml-1">{hideValues ? "••" : projectsStartingThisMonth}</span>
                </div>
                <div className="p-2 rounded-lg bg-muted">
                  <span className="text-muted-foreground">Terminando:</span>
                  <span className="font-medium ml-1">{hideValues ? "••" : projectsEndingThisMonth}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Projects */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Próximos Prazos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum projeto agendado para os próximos 30 dias
              </p>
            ) : (
              <div className="space-y-2">
                {upcomingProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => navigate(`/projetos/${project.id}`)}
                  >
                    <span className="truncate flex-1">{hideValues ? "••••••" : project.name}</span>
                    <Badge variant="outline" className="ml-2 shrink-0">
                      {hideValues ? "••" : format(new Date(project.expected_end_date!), "dd/MM", { locale: ptBR })}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alerts Row */}
      {(overdueProjects.length > 0 || criticalProjects.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {overdueProjects.length > 0 && (
            <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  Projetos Atrasados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {overdueProjects.slice(0, 5).map((project) => (
                    <div
                      key={project.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-red-100/50 dark:bg-red-900/20 text-sm cursor-pointer hover:bg-red-200/50 dark:hover:bg-red-800/30 transition-colors"
                      onClick={() => navigate(`/projetos/${project.id}`)}
                    >
                      <span className="truncate flex-1 text-red-700 dark:text-red-400">
                        {hideValues ? "••••••" : project.name}
                      </span>
                      <ProjectTimeCounter project={project} hideValues={hideValues} />
                    </div>
                  ))}
                  {overdueProjects.length > 5 && (
                    <Button
                      variant="ghost"
                      className="w-full text-xs text-red-600 hover:text-red-700"
                      onClick={() => navigate("/projetos")}
                    >
                      +{overdueProjects.length - 5} mais atrasados
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {criticalProjects.length > 0 && (
            <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-orange-600">
                  <Flag className="h-4 w-4" />
                  Projetos Críticos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {criticalProjects.slice(0, 5).map((project) => (
                    <div
                      key={project.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-orange-100/50 dark:bg-orange-900/20 text-sm cursor-pointer hover:bg-orange-200/50 dark:hover:bg-orange-800/30 transition-colors"
                      onClick={() => navigate(`/projetos/${project.id}`)}
                    >
                      <span className="truncate flex-1 text-orange-700 dark:text-orange-400">
                        {hideValues ? "••••••" : project.name}
                      </span>
                      <Badge variant="destructive" className="ml-2 shrink-0">
                        {hideValues ? "••" : `${project.progress_percentage || 0}%`}
                      </Badge>
                    </div>
                  ))}
                  {criticalProjects.length > 5 && (
                    <Button
                      variant="ghost"
                      className="w-full text-xs text-orange-600 hover:text-orange-700"
                      onClick={() => navigate("/projetos")}
                    >
                      +{criticalProjects.length - 5} mais críticos
                    </Button>
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
