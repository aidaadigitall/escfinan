import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type Task = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  due_time: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  responsible_id: string | null;
  labels: string[] | null;
  reminder_date: string | null;
  completed_at: string | null;
  is_recurring: boolean;
  recurrence_type: string | null;
  parent_task_id: string | null;
  created_at: string;
  updated_at: string;
};

export const useTasks = () => {
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("due_date", { ascending: true, nullsFirst: false });

      if (error) throw error;
      return data as Task[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (taskData: {
      title: string;
      description?: string;
      due_date?: string;
      due_time?: string;
      priority?: string;
      status?: string;
      responsible_id?: string;
      labels?: string[];
      reminder_date?: string;
      is_recurring?: boolean;
      recurrence_type?: string;
      parent_task_id?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("tasks")
        .insert([{ 
          title: taskData.title,
          description: taskData.description || null,
          due_date: taskData.due_date || null,
          due_time: taskData.due_time || null,
          priority: taskData.priority || 'medium',
          status: taskData.status || 'pending',
          responsible_id: taskData.responsible_id || null,
          labels: taskData.labels || null,
          reminder_date: taskData.reminder_date || null,
          is_recurring: taskData.is_recurring || false,
          recurrence_type: taskData.recurrence_type || null,
          parent_task_id: taskData.parent_task_id || null,
          user_id: user.id 
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Tarefa criada com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao criar tarefa");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (taskData: Partial<Task> & { id: string }) => {
      const { id, user_id, created_at, updated_at, ...updateData } = taskData;
      
      const { data, error } = await supabase
        .from("tasks")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Tarefa atualizada com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar tarefa");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Tarefa excluída com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao excluir tarefa");
    },
  });

  const toggleComplete = useMutation({
    mutationFn: async (task: Task) => {
      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
      const { data, error } = await supabase
        .from("tasks")
        .update({ 
          status: newStatus,
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null
        })
        .eq("id", task.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar tarefa");
    },
  });

  return {
    tasks,
    isLoading,
    createTask: createMutation.mutate,
    updateTask: updateMutation.mutate,
    deleteTask: deleteMutation.mutate,
    toggleComplete: toggleComplete.mutate,
  };
};
