import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  DollarSign,
  Clock,
  Users,
  Edit,
  Trash2,
  Play,
  Pause,
  CheckCircle2,
  LayoutDashboard,
} from "lucide-react";
import { type Project } from "@/hooks/useProjects";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: Project["status"]) => void;
  onViewDetail?: () => void;
}

const statusConfig = {
  planning: { label: "Planejamento", color: "bg-gray-500" },
  active: { label: "Ativo", color: "bg-green-500" },
  on_hold: { label: "Em Espera", color: "bg-yellow-500" },
  completed: { label: "Concluído", color: "bg-blue-500" },
  cancelled: { label: "Cancelado", color: "bg-red-500" },
};

const priorityConfig = {
  low: { label: "Baixa", color: "bg-gray-400" },
  medium: { label: "Média", color: "bg-blue-400" },
  high: { label: "Alta", color: "bg-orange-400" },
  critical: { label: "Crítica", color: "bg-red-500" },
};

const typeConfig = {
  fixed_price: "Preço Fixo",
  time_material: "Tempo & Material",
  retainer: "Retenção",
  internal: "Interno",
};

export function ProjectCard({ project, onEdit, onDelete, onStatusChange, onViewDetail }: ProjectCardProps) {
  const status = statusConfig[project.status];
  const priority = priorityConfig[project.priority];
  const typeLabel = typeConfig[project.project_type || "fixed_price"];

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg">{project.name}</CardTitle>
              {project.code && (
                <Badge variant="outline" className="text-xs">
                  {project.code}
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge className={status.color}>{status.label}</Badge>
              <Badge className={priority.color}>{priority.label}</Badge>
              <Badge variant="secondary">{typeLabel}</Badge>
            </div>
          </div>

          <div className="flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onEdit(project)}
              title="Editar"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onDelete(project.id)}
              title="Excluir"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>

        {project.description && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
            {project.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Cliente */}
        {project.client && (
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{project.client.name}</span>
          </div>
        )}

        {/* Datas */}
        <div className="flex items-center gap-4 text-sm">
          {project.start_date && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{format(new Date(project.start_date), "dd/MM/yyyy", { locale: ptBR })}</span>
            </div>
          )}
          {project.expected_end_date && (
            <span className="text-muted-foreground">
              → {format(new Date(project.expected_end_date), "dd/MM/yyyy", { locale: ptBR })}
            </span>
          )}
        </div>

        {/* Orçamento */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span>Orçamento:</span>
            </div>
            <span className="font-semibold">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(Number(project.budget_amount))}
            </span>
          </div>

          {project.budget_hours > 0 && (
            <>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Horas Orçadas:</span>
                </div>
                <span className="font-semibold">{project.budget_hours}h</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-green-600" />
                  <span>Horas Restantes:</span>
                </div>
                <span className="font-semibold text-green-600">
                  {Math.max(0, project.budget_hours - (project.hours_spent || 0))}h
                </span>
              </div>
            </>
          )}
        </div>

        {/* Progresso */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progresso do Projeto</span>
            <span className="font-semibold text-blue-600">{Math.round(project.progress_percentage || 0)}%</span>
          </div>
          <Progress value={Math.round(project.progress_percentage || 0)} className="h-2" />
          <div className="text-xs text-muted-foreground text-center">
            {project.status === "planning" && project.progress_percentage === 0
              ? "Projeto não iniciado" 
              : project.status === "completed" || project.progress_percentage === 100
                ? "Projeto concluído"
                : project.status === "on_hold"
                  ? "Projeto em espera"
                  : project.status === "cancelled"
                    ? "Projeto cancelado"
                    : `${Math.round(project.progress_percentage || 0)}% concluído`}
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="flex gap-2 pt-2 border-t">
          {onViewDetail && (
            <Button
              size="sm"
              variant="default"
              className="flex-1"
              onClick={onViewDetail}
            >
              <LayoutDashboard className="h-3 w-3 mr-1" />
              Dashboard
            </Button>
          )}
          {project.status === "planning" && (
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => onStatusChange(project.id, "active")}
            >
              <Play className="h-3 w-3 mr-1" />
              Iniciar
            </Button>
          )}
          {project.status === "active" && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => onStatusChange(project.id, "on_hold")}
              >
                <Pause className="h-3 w-3 mr-1" />
                Pausar
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => onStatusChange(project.id, "completed")}
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Concluir
              </Button>
            </>
          )}
          {project.status === "on_hold" && (
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => onStatusChange(project.id, "active")}
            >
              <Play className="h-3 w-3 mr-1" />
              Retomar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
