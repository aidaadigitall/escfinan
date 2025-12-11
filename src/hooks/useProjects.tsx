import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
  
  // Dados relacionados
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

// Hook para buscar todos os projetos
export const useProjects = () => {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          client:clients(id, name),
          project_manager:auth.users(id, email)
        `)
        .order("created_at", { ascending: false });

      if (error) {
        toast.error("Erro ao carregar projetos");
        throw error;
      }

      return data as Project[];
    },
  });
};

// Hook para buscar projeto por ID
export const useProject = (id: string | undefined) => {
  return useQuery({
    queryKey: ["projects", id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          client:clients(id, name),
          project_manager:auth.users(id, email)
        `)
        .eq("id", id)
        .single();

      if (error) {
        toast.error("Erro ao carregar projeto");
        throw error;
      }

      return data as Project;
    },
    enabled: !!id,
  });
};

// Hook para criar projeto
export const useCreateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateProjectInput) => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const { data, error } = await supabase
        .from("projects")
        .insert({
          ...input,
          user_id: userData.user.id,
          owner_user_id: userData.user.id,
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

// Hook para atualizar projeto
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["projects", data.id] });
      toast.success("Projeto atualizado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar projeto: ${error.message}`);
    },
  });
};

// Hook para excluir projeto
export const useDeleteProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);

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

// Hook para atualizar status do projeto
export const useUpdateProjectStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: "planning" | "active" | "on_hold" | "completed" | "cancelled";
    }) => {
      const updateData: any = { status };

      // Se marcar como completado, adiciona data de conclusão
      if (status === "completed") {
        updateData.actual_end_date = new Date().toISOString().split("T")[0];
        updateData.progress_percentage = 100;
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["projects", data.id] });
      toast.success("Status atualizado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar status: ${error.message}`);
    },
  });
};

// Hook para atualizar progresso do projeto
export const useUpdateProjectProgress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      progress_percentage,
    }: {
      id: string;
      progress_percentage: number;
    }) => {
      const { data, error } = await supabase
        .from("projects")
        .update({ progress_percentage })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["projects", data.id] });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar progresso: ${error.message}`);
    },
  });
};

// Hook para buscar métricas do projeto
export const useProjectMetrics = (projectId: string | undefined) => {
  return useQuery({
    queryKey: ["project-metrics", projectId],
    queryFn: async () => {
      if (!projectId) return null;

      // Buscar horas trabalhadas
      const { data: timeEntries, error: timeError } = await supabase
        .from("project_time_entries")
        .select("hours, amount")
        .eq("project_id", projectId);

      if (timeError) throw timeError;

      // Buscar despesas
      const { data: expenses, error: expensesError } = await supabase
        .from("project_expenses")
        .select("amount")
        .eq("project_id", projectId);

      if (expensesError) throw expensesError;

      // Buscar tarefas
      const { data: tasks, error: tasksError } = await supabase
        .from("project_tasks")
        .select("status")
        .eq("project_id", projectId);

      if (tasksError) throw tasksError;

      const totalHours = timeEntries?.reduce((sum, entry) => sum + Number(entry.hours), 0) || 0;
      const totalCost = timeEntries?.reduce((sum, entry) => sum + Number(entry.amount || 0), 0) || 0;
      const totalExpenses = expenses?.reduce((sum, expense) => sum + Number(expense.amount), 0) || 0;

      const totalTasks = tasks?.length || 0;
      const completedTasks = tasks?.filter((t) => t.status === "completed").length || 0;

      return {
        totalHours,
        totalCost,
        totalExpenses,
        totalSpent: totalCost + totalExpenses,
        totalTasks,
        completedTasks,
        taskCompletionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      };
    },
    enabled: !!projectId,
  });
};
