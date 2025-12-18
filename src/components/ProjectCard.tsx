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
  AlertCircle,
} from "lucide-react";
import { type Project } from "@/hooks/useProjects";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEffect, useState } from "react";

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
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [isOverdue, setIsOverdue] = useState(false);

  // Calcular dias restantes
  useEffect(() => {
    if (project.expected_end_date) {
      const today = new Date();
      const endDate = new Date(project.expected_end_date);
      const days = differenceInDays(endDate, today);
      setDaysRemaining(days);
      setIsOverdue(days < 0 && project.status !== "completed");
    }
  }, [project.expected_end_date, project.status]);

  const getTimeStatus = () => {
    if (daysRemaining === null) return null;
    
    if (isOverdue) {
      return {
        text: `${Math.abs(daysRemaining)} dias atrasado`,
        color: "text-red-600",
        bgColor: "bg-red-50",
      };
    }
    
    if (daysRemaining === 0) {
      return {
        text: "Vence hoje",
        color: "text-orange-600",
        bgColor: "bg-orange-50",
      };
    }
    
    if (daysRemaining === 1) {
      return {
        text: "Vence amanhã",
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
      };
    }
    
    if (daysRemaining > 0) {
      return {
        text: `${daysRemaining} dias restantes`,
        color: "text-green-600",
        bgColor: "bg-green-50",
      };
    }
    
    return null;
  };

  const timeStatus = getTimeStatus();

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

        {/* Datas e Contador */}
        <div className="space-y-2">
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

          {/* Contador Decrescente */}
          {timeStatus && (
            <div className={`p-2 rounded text-sm font-semibold ${timeStatus.bgColor} ${timeStatus.color} flex items-center gap-2`}>
              {isOverdue ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <Clock className="h-4 w-4" />
              )}
              {timeStatus.text}
            </div>
          )}
        </div>

        {/* Responsável e Executores */}
        <div className="space-y-2 border-t pt-3">
          {project.responsible_user_id && (
            <div className="text-sm">
              <span className="text-muted-foreground text-xs font-semibold">RESPONSÁVEL</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                  {project.responsible_user_id.substring(0, 1).toUpperCase()}
                </div>
                <span className="text-sm font-medium">{project.responsible_user_id}</span>
              </div>
            </div>
          )}

          {project.executor_user_ids && project.executor_user_ids.length > 0 && (
            <div className="text-sm">
              <span className="text-muted-foreground text-xs font-semibold">EXECUTORES ({project.executor_user_ids.length})</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {project.executor_user_ids.map((userId, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1 bg-gray-100 rounded-full px-2 py-1"
                  >
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">
                      {userId.substring(0, 1).toUpperCase()}
                    </div>
                    <span className="text-xs font-medium">{userId.substring(0, 10)}</span>
                  </div>
                ))}
              </div>
            </div>
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
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => onStatusChange(project.id, "on_hold")}
            >
              <Pause className="h-3 w-3 mr-1" />
              Pausar
            </Button>
          )}
          {project.status !== "completed" && project.status !== "cancelled" && (
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => onStatusChange(project.id, "completed")}
            >
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Concluir
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
