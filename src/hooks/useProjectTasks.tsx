import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getEffectiveUserId } from "./useEffectiveUserId";

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
  owner_user_id: string | null;
  created_at: string;
  updated_at: string;
  assigned_user?: {
    id: string;
    name: string;
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

export const useProjectTasks = (projectId: string | undefined) => {
  return useQuery({
    queryKey: ["project-tasks", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from("project_tasks")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as ProjectTask[];
    },
    enabled: !!projectId,
  });
};

export const useProjectTask = (id: string | undefined) => {
  return useQuery({
    queryKey: ["project-task", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("project_tasks")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as ProjectTask;
    },
    enabled: !!id,
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      const effectiveUserId = await getEffectiveUserId();
      
      const { data, error } = await supabase
        .from("project_tasks")
        .insert({
          ...input,
          user_id: effectiveUserId,
          owner_user_id: effectiveUserId,
        })
        .select()
        .single();

      if (error) throw error;
      
      // Recalcular progresso do projeto
      await supabase.rpc("calculate_project_progress", { p_project_id: input.project_id });
      
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["project-tasks", variables.project_id] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project-metrics"] });
      toast.success("Tarefa criada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar tarefa: ${error.message}`);
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateTaskInput) => {
      const { id, project_id, ...updateData } = input;
      
      // Se status for completed, definir data de conclusão
      if (updateData.status === "completed" && !updateData.completed_date) {
        (updateData as any).completed_date = new Date().toISOString().split("T")[0];
      }
      
      const { data, error } = await supabase
        .from("project_tasks")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      
      // Recalcular progresso do projeto
      if (project_id) {
        await supabase.rpc("calculate_project_progress", { p_project_id: project_id });
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project-metrics"] });
      toast.success("Tarefa atualizada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar tarefa: ${error.message}`);
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, project_id }: { id: string; project_id: string }) => {
      const { error } = await supabase
        .from("project_tasks")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      // Recalcular progresso do projeto
      await supabase.rpc("calculate_project_progress", { p_project_id: project_id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project-metrics"] });
      toast.success("Tarefa excluída com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir tarefa: ${error.message}`);
    },
  });
};

export const useUpdateTaskStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, project_id }: { id: string; status: ProjectTask["status"]; project_id: string }) => {
      const updateData: any = { status };
      
      if (status === "completed") {
        updateData.completed_date = new Date().toISOString().split("T")[0];
        updateData.progress_percentage = 100;
      }
      
      const { data, error } = await supabase
        .from("project_tasks")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      
      // Recalcular progresso do projeto
      await supabase.rpc("calculate_project_progress", { p_project_id: project_id });
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project-metrics"] });
      toast.success("Status atualizado!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar status: ${error.message}`);
    },
  });
};
