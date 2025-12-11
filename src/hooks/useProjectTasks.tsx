import { useState } from "react";
import { toast } from "sonner";

export interface ProjectTask {
  id: string;
  project_id: string;
  parent_task_id: string | null;
  title: string;
  description: string | null;
  task_number: number | null;
  estimated_hours: number;
  actual_hours: number;
  start_date: string | null;
  due_date: string | null;
  completed_date: string | null;
  status: "todo" | "in_progress" | "review" | "completed" | "blocked";
  priority: "low" | "medium" | "high" | "critical";
  progress_percentage: number;
  assigned_to: string | null;
  user_id: string;
  owner_user_id: string;
  created_at: string;
  updated_at: string;
  assigned_user?: {
    id: string;
    email: string;
  };
  subtasks?: ProjectTask[];
}

export interface CreateTaskInput {
  project_id: string;
  parent_task_id?: string;
  title: string;
  description?: string;
  estimated_hours?: number;
  start_date?: string;
  due_date?: string;
  status?: "todo" | "in_progress" | "review" | "completed" | "blocked";
  priority?: "low" | "medium" | "high" | "critical";
  assigned_to?: string;
}

export interface UpdateTaskInput extends CreateTaskInput {
  id: string;
  actual_hours?: number;
  completed_date?: string;
  progress_percentage?: number;
}

// Hook stub - tabela project_tasks não existe ainda
export const useProjectTasks = (projectId: string | undefined) => {
  const [data] = useState<ProjectTask[]>([]);
  return {
    data,
    isLoading: false,
    error: null,
  };
};

export const useProjectTask = (id: string | undefined) => {
  return {
    data: null as ProjectTask | null,
    isLoading: false,
    error: null,
  };
};

export const useCreateTask = () => {
  return {
    mutate: () => toast.info("Funcionalidade de Projetos em desenvolvimento"),
    mutateAsync: async () => toast.info("Funcionalidade de Projetos em desenvolvimento"),
    isPending: false,
  };
};

export const useUpdateTask = () => {
  return {
    mutate: () => toast.info("Funcionalidade de Projetos em desenvolvimento"),
    mutateAsync: async () => toast.info("Funcionalidade de Projetos em desenvolvimento"),
    isPending: false,
  };
};

export const useDeleteTask = () => {
  return {
    mutate: () => toast.info("Funcionalidade de Projetos em desenvolvimento"),
    mutateAsync: async () => toast.info("Funcionalidade de Projetos em desenvolvimento"),
    isPending: false,
  };
};

export const useUpdateTaskStatus = () => {
  return {
    mutate: () => toast.info("Funcionalidade de Projetos em desenvolvimento"),
    mutateAsync: async () => toast.info("Funcionalidade de Projetos em desenvolvimento"),
    isPending: false,
  };
};
