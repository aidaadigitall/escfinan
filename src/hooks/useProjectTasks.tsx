import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
  
  // Dados relacionados
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

// Hook para buscar tarefas de um projeto
export const useProjectTasks = (projectId: string | undefined) => {
  return useQuery({
    queryKey: ["project-tasks", projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from("project_tasks")
        .select(`
          *,
          assigned_user:auth.users(id, email)
        `)
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) {
        toast.error("Erro ao carregar tarefas");
        throw error;
      }

      return data as ProjectTask[];
    },
    enabled: !!projectId,
  });
};

// Hook para buscar tarefa por ID
export const useProjectTask = (id: string | undefined) => {
  return useQuery({
    queryKey: ["project-tasks", id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("project_tasks")
        .select(`
          *,
          assigned_user:auth.users(id, email)
        `)
        .eq("id", id)
        .single();

      if (error) {
        toast.error("Erro ao carregar tarefa");
        throw error;
      }

      return data as ProjectTask;
    },
    enabled: !!id,
  });
};

// Hook para criar tarefa
export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const { data, error } = await supabase
        .from("project_tasks")
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["project-tasks", data.project_id] });
      queryClient.invalidateQueries({ queryKey: ["projects", data.project_id] });
      toast.success("Tarefa criada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar tarefa: ${error.message}`);
    },
  });
};

// Hook para atualizar tarefa
export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateTaskInput) => {
      const { id, ...updateData } = input;

      // Se marcar como completado, adiciona data de conclusão e 100% de progresso
      if (updateData.status === "completed" && !updateData.completed_date) {
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
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["project-tasks", data.project_id] });
      queryClient.invalidateQueries({ queryKey: ["project-tasks", data.id] });
      queryClient.invalidateQueries({ queryKey: ["projects", data.project_id] });
      toast.success("Tarefa atualizada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar tarefa: ${error.message}`);
    },
  });
};

// Hook para excluir tarefa
export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, project_id }: { id: string; project_id: string }) => {
      const { error } = await supabase.from("project_tasks").delete().eq("id", id);

      if (error) throw error;
      return project_id;
    },
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({ queryKey: ["project-tasks", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
      toast.success("Tarefa excluída com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir tarefa: ${error.message}`);
    },
  });
};

// Hook para atualizar status da tarefa
export const useUpdateTaskStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      project_id,
    }: {
      id: string;
      status: "todo" | "in_progress" | "review" | "completed" | "blocked";
      project_id: string;
    }) => {
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
      return { data, project_id };
    },
    onSuccess: ({ data, project_id }) => {
      queryClient.invalidateQueries({ queryKey: ["project-tasks", project_id] });
      queryClient.invalidateQueries({ queryKey: ["project-tasks", data.id] });
      queryClient.invalidateQueries({ queryKey: ["projects", project_id] });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar status: ${error.message}`);
    },
  });
};
