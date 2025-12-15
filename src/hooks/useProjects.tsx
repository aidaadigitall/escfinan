import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getEffectiveUserId } from "./useEffectiveUserId";
import { useAuth } from "./useAuth";

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
  user_id: string;
  owner_user_id: string | null;
  created_at: string;
  updated_at: string;
  client?: {
    id: string;
    name: string;
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
}

export interface UpdateProjectInput extends CreateProjectInput {
  id: string;
  actual_end_date?: string;
}

export const useProjects = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["projects", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          client:clients(id, name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Project[];
    },
    enabled: !!user?.id,
  });
};

export const useProject = (id: string | undefined) => {
  return useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          client:clients(id, name)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Project;
    },
    enabled: !!id,
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateProjectInput) => {
      const effectiveUserId = await getEffectiveUserId();
      
      const { data, error } = await supabase
        .from("projects")
        .insert({
          ...input,
          user_id: effectiveUserId,
          owner_user_id: effectiveUserId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Projeto criado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar projeto: ${error.message}`);
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateProjectInput) => {
      const { id, ...updateData } = input;
      
      const { data, error } = await supabase
        .from("projects")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Projeto atualizado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar projeto: ${error.message}`);
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Projeto excluído com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir projeto: ${error.message}`);
    },
  });
};

export const useUpdateProjectStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Project["status"] }) => {
      const updateData: any = { status };
      
      // Se completado, definir data de conclusão
      if (status === "completed") {
        updateData.actual_end_date = new Date().toISOString().split("T")[0];
      }
      
      const { data, error } = await supabase
        .from("projects")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Status atualizado!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar status: ${error.message}`);
    },
  });
};

export const useUpdateProjectProgress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, progress }: { id: string; progress: number }) => {
      const { data, error } = await supabase
        .from("projects")
        .update({ progress_percentage: progress })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar progresso: ${error.message}`);
    },
  });
};

interface ProjectMetricsData {
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  total_hours: number;
  billable_hours: number;
  total_expenses: number;
  billable_expenses: number;
}

export const useProjectMetrics = (projectId: string | undefined) => {
  return useQuery({
    queryKey: ["project-metrics", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      
      const { data, error } = await supabase.rpc("get_project_metrics", {
        p_project_id: projectId,
      });

      if (error) throw error;
      
      const metrics = data as unknown as ProjectMetricsData;
      
      return {
        totalTasks: metrics?.total_tasks || 0,
        completedTasks: metrics?.completed_tasks || 0,
        pendingTasks: metrics?.pending_tasks || 0,
        totalHours: Number(metrics?.total_hours) || 0,
        billableHours: Number(metrics?.billable_hours) || 0,
        totalExpenses: Number(metrics?.total_expenses) || 0,
        billableExpenses: Number(metrics?.billable_expenses) || 0,
        taskCompletionRate: metrics?.total_tasks > 0 
          ? Math.round((metrics?.completed_tasks / metrics?.total_tasks) * 100) 
          : 0,
      };
    },
    enabled: !!projectId,
  });
};
