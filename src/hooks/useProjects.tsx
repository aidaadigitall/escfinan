import { useState } from "react";
import { toast } from "sonner";

export interface Project {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  client_id: string | null;
  project_type: "fixed_price" | "time_material" | "retainer" | "internal" | null;
  budget_amount: number;
  budget_hours: number;
  hourly_rate: number | null;
  start_date: string | null;
  expected_end_date: string | null;
  actual_end_date: string | null;
  status: "planning" | "active" | "on_hold" | "completed" | "cancelled";
  progress_percentage: number;
  priority: "low" | "medium" | "high" | "critical";
  project_manager_id: string | null;
  user_id: string;
  owner_user_id: string;
  created_at: string;
  updated_at: string;
  client?: {
    id: string;
    name: string;
  };
  project_manager?: {
    id: string;
    email: string;
  };
}

export interface CreateProjectInput {
  name: string;
  code?: string;
  description?: string;
  client_id?: string;
  project_type?: "fixed_price" | "time_material" | "retainer" | "internal";
  budget_amount?: number;
  budget_hours?: number;
  hourly_rate?: number;
  start_date?: string;
  expected_end_date?: string;
  status?: "planning" | "active" | "on_hold" | "completed" | "cancelled";
  progress_percentage?: number;
  priority?: "low" | "medium" | "high" | "critical";
  project_manager_id?: string;
}

export interface UpdateProjectInput extends CreateProjectInput {
  id: string;
  actual_end_date?: string;
}

// Hook stub - tabela projects não existe ainda
export const useProjects = () => {
  const [data] = useState<Project[]>([]);
  return {
    data,
    isLoading: false,
    error: null,
  };
};

export const useProject = (id: string | undefined) => {
  return {
    data: null as Project | null,
    isLoading: false,
    error: null,
  };
};

export const useCreateProject = () => {
  return {
    mutate: (_data: CreateProjectInput) => toast.info("Funcionalidade de Projetos em desenvolvimento"),
    mutateAsync: async (_data: CreateProjectInput) => { toast.info("Funcionalidade de Projetos em desenvolvimento"); },
    isPending: false,
  };
};

export const useUpdateProject = () => {
  return {
    mutate: (_data: UpdateProjectInput) => toast.info("Funcionalidade de Projetos em desenvolvimento"),
    mutateAsync: async (_data: UpdateProjectInput) => { toast.info("Funcionalidade de Projetos em desenvolvimento"); },
    isPending: false,
  };
};

export const useDeleteProject = () => {
  return {
    mutate: (_id: string) => toast.info("Funcionalidade de Projetos em desenvolvimento"),
    mutateAsync: async (_id: string) => { toast.info("Funcionalidade de Projetos em desenvolvimento"); },
    isPending: false,
  };
};

export const useUpdateProjectStatus = () => {
  return {
    mutate: (_params: { id: string; status: "planning" | "active" | "on_hold" | "completed" | "cancelled" }) => toast.info("Funcionalidade de Projetos em desenvolvimento"),
    mutateAsync: async (_params: { id: string; status: "planning" | "active" | "on_hold" | "completed" | "cancelled" }) => { toast.info("Funcionalidade de Projetos em desenvolvimento"); },
    isPending: false,
  };
};

export const useUpdateProjectProgress = () => {
  return {
    mutate: () => toast.info("Funcionalidade de Projetos em desenvolvimento"),
    mutateAsync: async () => toast.info("Funcionalidade de Projetos em desenvolvimento"),
    isPending: false,
  };
};

export const useProjectMetrics = (projectId: string | undefined) => {
  return {
    data: null as {
      totalHours: number;
      totalCost: number;
      totalExpenses: number;
      totalSpent: number;
      totalTasks: number;
      completedTasks: number;
      taskCompletionRate: number;
    } | null,
    isLoading: false,
    error: null,
  };
};
