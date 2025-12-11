import { useState } from "react";
import { toast } from "sonner";

export interface ProjectTimeEntry {
  id: string;
  project_id: string;
  task_id: string | null;
  user_id: string;
  date: string;
  hours: number;
  description: string | null;
  is_billable: boolean;
  hourly_rate: number | null;
  amount: number;
  status: "pending" | "approved" | "rejected" | "billed";
  approved_by: string | null;
  approved_at: string | null;
  owner_user_id: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    email: string;
  };
  task?: {
    id: string;
    title: string;
  };
}

export interface CreateTimeEntryInput {
  project_id: string;
  task_id?: string;
  date: string;
  hours: number;
  description?: string;
  is_billable?: boolean;
  hourly_rate?: number;
}

export interface UpdateTimeEntryInput extends CreateTimeEntryInput {
  id: string;
  status?: "pending" | "approved" | "rejected" | "billed";
}

// Hook stub - tabela project_time_entries não existe ainda
export const useProjectTimeEntries = (projectId: string | undefined) => {
  const [data] = useState<ProjectTimeEntry[]>([]);
  return {
    data,
    isLoading: false,
    error: null,
  };
};

export const useCreateTimeEntry = () => {
  return {
    mutate: () => toast.info("Funcionalidade de Projetos em desenvolvimento"),
    mutateAsync: async () => toast.info("Funcionalidade de Projetos em desenvolvimento"),
    isPending: false,
  };
};

export const useUpdateTimeEntry = () => {
  return {
    mutate: () => toast.info("Funcionalidade de Projetos em desenvolvimento"),
    mutateAsync: async () => toast.info("Funcionalidade de Projetos em desenvolvimento"),
    isPending: false,
  };
};

export const useDeleteTimeEntry = () => {
  return {
    mutate: () => toast.info("Funcionalidade de Projetos em desenvolvimento"),
    mutateAsync: async () => toast.info("Funcionalidade de Projetos em desenvolvimento"),
    isPending: false,
  };
};

export const useApproveTimeEntry = () => {
  return {
    mutate: () => toast.info("Funcionalidade de Projetos em desenvolvimento"),
    mutateAsync: async () => toast.info("Funcionalidade de Projetos em desenvolvimento"),
    isPending: false,
  };
};

export const useRejectTimeEntry = () => {
  return {
    mutate: () => toast.info("Funcionalidade de Projetos em desenvolvimento"),
    mutateAsync: async () => toast.info("Funcionalidade de Projetos em desenvolvimento"),
    isPending: false,
  };
};
