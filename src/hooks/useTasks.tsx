import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { sendTaskNotification, sendTaskCommentNotification } from "@/services/whatsappService";

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
  assigned_users: string[] | null;
  labels: string[] | null;
  reminder_date: string | null;
  completed_at: string | null;
  is_recurring: boolean;
  recurrence_type: string | null;
  parent_task_id: string | null;
  attachments: any[] | null;
  created_at: string;
  updated_at: string;
  // Project-related fields
  project_id: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  start_date: string | null;
  progress_percentage: number | null;
  task_number: number | null;
};

export type TaskComment = {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  mentions: string[] | null;
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
      assigned_users?: string[];
      labels?: string[];
      reminder_date?: string;
      is_recurring?: boolean;
      recurrence_type?: string;
      parent_task_id?: string;
      attachments?: any[];
      sendWhatsAppNotification?: boolean;
      // Project fields
      project_id?: string;
      estimated_hours?: number;
      actual_hours?: number;
      start_date?: string;
      progress_percentage?: number;
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
          assigned_users: taskData.assigned_users || [],
          labels: taskData.labels || null,
          reminder_date: taskData.reminder_date || null,
          is_recurring: taskData.is_recurring || false,
          recurrence_type: taskData.recurrence_type || null,
          parent_task_id: taskData.parent_task_id || null,
          attachments: taskData.attachments || [],
          user_id: user.id,
          // Project fields
          project_id: taskData.project_id || null,
          estimated_hours: taskData.estimated_hours || 0,
          actual_hours: taskData.actual_hours || 0,
          start_date: taskData.start_date || null,
          progress_percentage: taskData.progress_percentage || 0,
        }])
        .select()
        .single();

      if (error) throw error;

      // Send WhatsApp notifications to assigned users
      if (taskData.sendWhatsAppNotification && taskData.assigned_users?.length) {
        const dueDate = taskData.due_date 
          ? format(new Date(taskData.due_date), "dd/MM/yyyy", { locale: ptBR })
          : undefined;

        // Get user profile name
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", user.id)
          .single();

        // Get phone numbers of assigned users
        const { data: assignedEmployees } = await supabase
          .from("employees")
          .select("phone")
          .in("id", taskData.assigned_users);

        if (assignedEmployees) {
          for (const employee of assignedEmployees) {
            if (employee.phone) {
              try {
                await sendTaskNotification(
                  employee.phone,
                  taskData.title,
                  dueDate,
                  profile?.full_name || undefined
                );
              } catch (err) {
                console.error("Erro ao enviar WhatsApp:", err);
              }
            }
          }
        }
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["project-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project-metrics"] });
      // Recalculate project progress if task is linked to a project
      if (data?.project_id) {
        supabase.rpc("calculate_project_progress", { p_project_id: data.project_id });
      }
      toast.success("Tarefa criada com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao criar tarefa");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (taskData: Partial<Task> & { id: string }) => {
      const { id, user_id, created_at, updated_at, ...updateData } = taskData;
      
      // Ensure status is a string, as null or undefined can cause check constraint violation
      if (updateData.status === undefined || updateData.status === null) {
        delete updateData.status;
      }
      
      const { data, error } = await supabase
        .from("tasks")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["project-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project-metrics"] });
      // Recalculate project progress if task is linked to a project
      if (data?.project_id) {
        supabase.rpc("calculate_project_progress", { p_project_id: data.project_id });
      }
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
      queryClient.invalidateQueries({ queryKey: ["project-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project-metrics"] });
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["project-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project-metrics"] });
      // Recalculate project progress if task is linked to a project
      if (data?.project_id) {
        supabase.rpc("calculate_project_progress", { p_project_id: data.project_id });
      }
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

// Hook for task comments
export const useTaskComments = (taskId?: string) => {
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["task_comments", taskId],
    queryFn: async () => {
      if (!taskId) return [];
      
      const { data, error } = await supabase
        .from("task_comments")
        .select("*")
        .eq("task_id", taskId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as TaskComment[];
    },
    enabled: !!taskId,
  });

  const addComment = useMutation({
    mutationFn: async (commentData: { 
      task_id: string; 
      content: string; 
      mentions?: string[];
      taskTitle?: string;
      sendWhatsAppNotification?: boolean;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("task_comments")
        .insert([{
          task_id: commentData.task_id,
          content: commentData.content,
          mentions: commentData.mentions || [],
          user_id: user.id,
        }])
        .select()
        .single();

      if (error) throw error;

      // Send WhatsApp notifications to mentioned users
      if (commentData.sendWhatsAppNotification && commentData.mentions?.length && commentData.taskTitle) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", user.id)
          .single();

        const { data: mentionedEmployees } = await supabase
          .from("employees")
          .select("phone")
          .in("id", commentData.mentions);

        if (mentionedEmployees) {
          for (const employee of mentionedEmployees) {
            if (employee.phone) {
              try {
                await sendTaskCommentNotification(
                  employee.phone,
                  commentData.taskTitle,
                  profile?.full_name || "Usuário",
                  commentData.content
                );
              } catch (err) {
                console.error("Erro ao enviar WhatsApp:", err);
              }
            }
          }
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task_comments", taskId] });
      toast.success("Comentário adicionado!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao adicionar comentário");
    },
  });

  const deleteComment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("task_comments")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task_comments", taskId] });
      toast.success("Comentário removido!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao remover comentário");
    },
  });

  return {
    comments,
    isLoading,
    addComment: addComment.mutate,
    deleteComment: deleteComment.mutate,
  };
};
