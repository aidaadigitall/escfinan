import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getEffectiveUserId } from "./useEffectiveUserId";
import { Task } from "./useTasks";

// Re-export Task type for backwards compatibility
export type ProjectTask = Task;

export interface CreateTaskInput {
  project_id: string;
  parent_task_id?: string;
  title: string;
  description?: string;
  estimated_hours?: number;
  start_date?: string;
  due_date?: string;
  status?: "pending" | "in_progress" | "completed" | "cancelled";
  priority?: "low" | "medium" | "high" | "urgent";
  assigned_to?: string;
}

export interface UpdateTaskInput extends CreateTaskInput {
  id: string;
  actual_hours?: number;
  completed_date?: string;
  progress_percentage?: number;
}

// Hook to fetch tasks for a specific project
export const useProjectTasks = (projectId: string | undefined) => {
  return useQuery({
    queryKey: ["project-tasks", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as Task[];
    },
    enabled: !!projectId,
  });
};

// Hook to fetch a single task
export const useProjectTask = (id: string | undefined) => {
  return useQuery({
    queryKey: ["project-task", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Task;
    },
    enabled: !!id,
  });
};

// Hook to create a task for a project
export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      const effectiveUserId = await getEffectiveUserId();
      
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          title: input.title,
          description: input.description || null,
          project_id: input.project_id,
          parent_task_id: input.parent_task_id || null,
          estimated_hours: input.estimated_hours || 0,
          start_date: input.start_date || null,
          due_date: input.due_date || null,
          status: input.status || "pending",
          priority: input.priority || "medium",
          responsible_id: input.assigned_to || null,
          user_id: effectiveUserId,
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
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project-metrics"] });
      toast.success("Tarefa criada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar tarefa: ${error.message}`);
    },
  });
};

// Hook to update a task
export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateTaskInput) => {
      const { id, project_id, ...updateData } = input;
      
      // Se status for completed, definir data de conclusão
      const taskUpdate: any = {
        ...updateData,
        responsible_id: updateData.assigned_to || null,
      };
      
      if (updateData.status === "completed" && !updateData.completed_date) {
        taskUpdate.completed_at = new Date().toISOString();
        taskUpdate.progress_percentage = 100;
      }
      
      // Remove assigned_to from update as we renamed it
      delete taskUpdate.assigned_to;
      
      const { data, error } = await supabase
        .from("tasks")
        .update(taskUpdate)
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
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project-metrics"] });
      toast.success("Tarefa atualizada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar tarefa: ${error.message}`);
    },
  });
};

// Hook to delete a task
export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, project_id }: { id: string; project_id: string }) => {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      // Recalcular progresso do projeto
      await supabase.rpc("calculate_project_progress", { p_project_id: project_id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project-metrics"] });
      toast.success("Tarefa excluída com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir tarefa: ${error.message}`);
    },
  });
};

// Hook to update task status
export const useUpdateTaskStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, project_id }: { id: string; status: string; project_id: string }) => {
      const updateData: any = { status };
      
      if (status === "completed") {
        updateData.completed_at = new Date().toISOString();
        updateData.progress_percentage = 100;
      }
      
      const { data, error } = await supabase
        .from("tasks")
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
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project-metrics"] });
      toast.success("Status atualizado!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar status: ${error.message}`);
    },
  });
};
