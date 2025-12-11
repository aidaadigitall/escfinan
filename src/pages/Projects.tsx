import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Briefcase, DollarSign, Clock, TrendingUp } from "lucide-react";
import { ProjectDialog } from "@/components/ProjectDialog";
import { ProjectCard } from "@/components/ProjectCard";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  useProjects,
  useDeleteProject,
  useUpdateProjectStatus,
  type Project,
} from "@/hooks/useProjects";

export default function Projects() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  const { data: projects, isLoading } = useProjects();
  const deleteProject = useDeleteProject();
  const updateStatus = useUpdateProjectStatus();

  const handleEdit = (project: Project) => {
    setSelectedProject(project);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setProjectToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (projectToDelete) {
      await deleteProject.mutateAsync(projectToDelete);
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    }
  };

  const handleStatusChange = async (id: string, status: Project["status"]) => {
    await updateStatus.mutateAsync({ id, status });
  };

  const handleNewProject = () => {
    setSelectedProject(null);
    setDialogOpen(true);
  };

  // Filtrar projetos
  const filteredProjects = projects?.filter((project) => {
    if (statusFilter !== "all" && project.status !== statusFilter) return false;
    if (priorityFilter !== "all" && project.priority !== priorityFilter) return false;
    return true;
  });

  // Calcular métricas
  const totalProjects = projects?.length || 0;
  const activeProjects = projects?.filter((p) => p.status === "active").length || 0;
  const totalBudget = projects?.reduce((sum, p) => sum + Number(p.budget_amount), 0) || 0;
  const totalHours = projects?.reduce((sum, p) => sum + Number(p.budget_hours), 0) || 0;

  // Agrupar por status
  const projectsByStatus = {
    planning: filteredProjects?.filter((p) => p.status === "planning") || [],
    active: filteredProjects?.filter((p) => p.status === "active") || [],
    on_hold: filteredProjects?.filter((p) => p.status === "on_hold") || [],
    completed: filteredProjects?.filter((p) => p.status === "completed") || [],
    cancelled: filteredProjects?.filter((p) => p.status === "cancelled") || [],
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando projetos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Projetos</h1>
          <p className="text-muted-foreground">
            Gerencie seus projetos, tarefas, horas e despesas
          </p>
        </div>
        <Button onClick={handleNewProject}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Projeto
        </Button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Projetos</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              {activeProjects} projetos ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orçamento Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
                maximumFractionDigits: 0,
              }).format(totalBudget)}
            </div>
            <p className="text-xs text-muted-foreground">
              Soma de todos os projetos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Horas Totais</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHours}h</div>
            <p className="text-xs text-muted-foreground">
              Horas orçadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa Média</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalHours > 0
                ? new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(totalBudget / totalHours)
                : "R$ 0,00"}
            </div>
            <p className="text-xs text-muted-foreground">
              Por hora trabalhada
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="planning">Planejamento</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="on_hold">Em Espera</SelectItem>
            <SelectItem value="completed">Concluído</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as prioridades</SelectItem>
            <SelectItem value="low">Baixa</SelectItem>
            <SelectItem value="medium">Média</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="critical">Crítica</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs por Status */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList>
          <TabsTrigger value="active">
            Ativos ({projectsByStatus.active.length})
          </TabsTrigger>
          <TabsTrigger value="planning">
            Planejamento ({projectsByStatus.planning.length})
          </TabsTrigger>
          <TabsTrigger value="on_hold">
            Em Espera ({projectsByStatus.on_hold.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Concluídos ({projectsByStatus.completed.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Cancelados ({projectsByStatus.cancelled.length})
          </TabsTrigger>
        </TabsList>

        {Object.entries(projectsByStatus).map(([status, projects]) => (
          <TabsContent key={status} value={status} className="mt-6">
            {projects.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">
                    Nenhum projeto neste status
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Dialogs */}
      <ProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        project={selectedProject}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Excluir Projeto"
        description="Tem certeza que deseja excluir este projeto? Todas as tarefas, horas e despesas relacionadas também serão excluídas. Esta ação não pode ser desfeita."
      />
    </div>
  );
}
