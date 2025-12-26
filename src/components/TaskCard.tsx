import { Task } from "@/hooks/useTasks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, differenceInMinutes, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Circle,
  Check,
  Edit,
  Trash2,
  Calendar as CalendarIcon,
  Clock,
  User,
  Users,
  Tag,
  AlertTriangle,
  Timer,
  Plus,
  ChevronDown,
  ChevronRight,
  FolderKanban,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

interface TaskCardProps {
  task: Task;
  isSubtask?: boolean;
  isDragging?: boolean;
  hasSubtasks?: boolean;
  isExpanded?: boolean;
  onToggleComplete?: (task: Task) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onAddSubtask?: (parentId: string) => void;
  onToggleExpand?: (taskId: string) => void;
  getResponsibleName?: (id: string | null) => string | null;
  getAssignedNames?: (ids: string[] | null) => string | null;
  getProjectName?: (projectId: string | null) => string | null;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}

export const TaskCard = ({
  task,
  isSubtask = false,
  isDragging = false,
  hasSubtasks = false,
  isExpanded = false,
  onToggleComplete,
  onEdit,
  onDelete,
  onAddSubtask,
  onToggleExpand,
  getResponsibleName,
  getAssignedNames,
  getProjectName,
  onDragStart,
  onDragOver,
  onDrop,
}: TaskCardProps) => {
  const isCompleted = task.status === "completed";

  // Calculate time remaining
  let timeStatus = null;
  if (task.due_date && !isCompleted) {
    const now = new Date();
    let targetDate = new Date(task.due_date + "T12:00:00");
    if (task.due_time) {
      const [hours, minutes] = task.due_time.split(":");
      targetDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    } else {
      targetDate.setHours(23, 59, 59, 999);
    }

    const isOverdue = isPast(targetDate);
    const totalMinutesDiff = Math.abs(differenceInMinutes(targetDate, now));
    const daysDiff = Math.floor(totalMinutesDiff / (24 * 60));

    if (isOverdue) {
      timeStatus = { type: "overdue", days: daysDiff };
    } else if (daysDiff === 0) {
      timeStatus = { type: "today" };
    } else if (daysDiff === 1) {
      timeStatus = { type: "tomorrow" };
    } else if (daysDiff <= 3) {
      timeStatus = { type: "soon", days: daysDiff };
    }
  }

  const getTimeStatusColor = () => {
    if (!timeStatus) return "";
    switch (timeStatus.type) {
      case "overdue":
        return "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900";
      case "today":
        return "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900";
      case "tomorrow":
        return "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900";
      case "soon":
        return "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900";
      default:
        return "";
    }
  };

  return (
    <div
      draggable={!isSubtask}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={cn(
        "group relative rounded-lg border transition-all duration-200",
        "hover:shadow-md hover:border-primary/50",
        isDragging && "opacity-50",
        isCompleted && "bg-muted/30",
        getTimeStatusColor(),
        !getTimeStatusColor() && "bg-white dark:bg-slate-950 border-border"
      )}
    >
      <div className="flex items-start gap-3 p-3 sm:p-4">
        {/* Drag Handle */}
        {!isSubtask && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-none text-muted-foreground">
            <GripVertical className="h-4 w-4" />
          </div>
        )}

        {/* Expand/Collapse Button */}
        {hasSubtasks && !isSubtask && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 flex-none"
            onClick={() => onToggleExpand?.(task.id)}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        )}

        {/* Checkbox */}
        <button
          onClick={() => onToggleComplete?.(task)}
          className={cn(
            "flex-none h-6 w-6 rounded-full flex items-center justify-center mt-0.5 transition-all",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
            isCompleted
              ? "bg-primary text-primary-foreground"
              : "border-2 border-muted-foreground/30 hover:border-primary"
          )}
        >
          {isCompleted ? (
            <Check className="h-3 w-3" />
          ) : (
            <Circle className="h-3 w-3" />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "text-sm font-medium leading-relaxed",
                  isCompleted && "line-through text-muted-foreground"
                )}
              >
                {task.title}
              </p>
              {task.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {task.description}
                </p>
              )}
            </div>

            {/* Priority Badge */}
            {task.priority && (
              <Badge
                variant="outline"
                className={cn(
                  "text-xs shrink-0",
                  priorityColors[task.priority as keyof typeof priorityColors]
                )}
              >
                {priorityLabels[task.priority as keyof typeof priorityLabels]}
              </Badge>
            )}
          </div>

          {/* Meta Information */}
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground flex-wrap">
            {timeStatus && (
              <div className="flex items-center gap-1">
                {timeStatus.type === "overdue" ? (
                  <>
                    <AlertTriangle className="h-3 w-3 text-red-600" />
                    <span className="text-red-600 font-medium">
                      Atrasado {timeStatus.days} dia{timeStatus.days > 1 ? "s" : ""}
                    </span>
                  </>
                ) : timeStatus.type === "today" ? (
                  <>
                    <Timer className="h-3 w-3 text-orange-600" />
                    <span className="text-orange-600 font-medium">Vence hoje</span>
                  </>
                ) : timeStatus.type === "tomorrow" ? (
                  <>
                    <Timer className="h-3 w-3 text-yellow-600" />
                    <span className="text-yellow-600 font-medium">Vence amanhã</span>
                  </>
                ) : (
                  <>
                    <Timer className="h-3 w-3" />
                    <span>Vence em {timeStatus.days} dias</span>
                  </>
                )}
              </div>
            )}

            {task.due_date && (
              <span className="flex items-center gap-1">
                <CalendarIcon className="h-3 w-3" />
                {format(new Date(task.due_date + "T12:00:00"), "dd/MMM", { locale: ptBR })}
              </span>
            )}

            {task.due_time && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {task.due_time}
              </span>
            )}

            {task.responsible_id && getResponsibleName && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {getResponsibleName(task.responsible_id)}
              </span>
            )}

            {task.assigned_users && task.assigned_users.length > 0 && getAssignedNames && (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {getAssignedNames(task.assigned_users)}
              </span>
            )}
          </div>

          {/* Labels and Project */}
          <div className="flex gap-1 mt-2 flex-wrap">
            {task.labels && task.labels.length > 0 && (
              <>
                {task.labels.map((label) => (
                  <Badge key={label} variant="secondary" className="text-xs">
                    <Tag className="h-2.5 w-2.5 mr-1" />
                    {label}
                  </Badge>
                ))}
              </>
            )}

            {task.project_id && getProjectName && getProjectName(task.project_id) && (
              <Badge variant="outline" className="text-xs bg-primary/10">
                <FolderKanban className="h-2.5 w-2.5 mr-1" />
                {getProjectName(task.project_id)}
              </Badge>
            )}

            {hasSubtasks && (
              <Badge variant="secondary" className="text-xs">
                {hasSubtasks ? "+" : ""}
              </Badge>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-none">
          {!isSubtask && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onAddSubtask?.(task.id)}
              title="Adicionar subtarefa"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit?.(task)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:text-destructive"
            onClick={() => onDelete?.(task.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
