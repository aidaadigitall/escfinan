import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
  
  // Dados relacionados
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

// Hook para buscar lançamentos de horas de um projeto
export const useProjectTimeEntries = (projectId: string | undefined) => {
  return useQuery({
    queryKey: ["project-time-entries", projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from("project_time_entries")
        .select(`
          *,
          user:auth.users(id, email),
          task:project_tasks(id, title)
        `)
        .eq("project_id", projectId)
        .order("date", { ascending: false });

      if (error) {
        toast.error("Erro ao carregar lançamentos de horas");
        throw error;
      }

      return data as ProjectTimeEntry[];
    },
    enabled: !!projectId,
  });
};

// Hook para criar lançamento de horas
export const useCreateTimeEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTimeEntryInput) => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const { data, error } = await supabase
        .from("project_time_entries")
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
      queryClient.invalidateQueries({ queryKey: ["project-time-entries", data.project_id] });
      queryClient.invalidateQueries({ queryKey: ["project-metrics", data.project_id] });
      toast.success("Horas lançadas com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao lançar horas: ${error.message}`);
    },
  });
};

// Hook para atualizar lançamento de horas
export const useUpdateTimeEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateTimeEntryInput) => {
      const { id, ...updateData } = input;

      const { data, error } = await supabase
        .from("project_time_entries")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["project-time-entries", data.project_id] });
      queryClient.invalidateQueries({ queryKey: ["project-metrics", data.project_id] });
      toast.success("Lançamento atualizado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar lançamento: ${error.message}`);
    },
  });
};

// Hook para excluir lançamento de horas
export const useDeleteTimeEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, project_id }: { id: string; project_id: string }) => {
      const { error } = await supabase.from("project_time_entries").delete().eq("id", id);

      if (error) throw error;
      return project_id;
    },
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({ queryKey: ["project-time-entries", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project-metrics", projectId] });
      toast.success("Lançamento excluído com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir lançamento: ${error.message}`);
    },
  });
};

// Hook para aprovar lançamento de horas
export const useApproveTimeEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, project_id }: { id: string; project_id: string }) => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const { data, error } = await supabase
        .from("project_time_entries")
        .update({
          status: "approved",
          approved_by: userData.user.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return { data, project_id };
    },
    onSuccess: ({ project_id }) => {
      queryClient.invalidateQueries({ queryKey: ["project-time-entries", project_id] });
      toast.success("Lançamento aprovado!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao aprovar: ${error.message}`);
    },
  });
};

// Hook para rejeitar lançamento de horas
export const useRejectTimeEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, project_id }: { id: string; project_id: string }) => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const { data, error } = await supabase
        .from("project_time_entries")
        .update({
          status: "rejected",
          approved_by: userData.user.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return { data, project_id };
    },
    onSuccess: ({ project_id }) => {
      queryClient.invalidateQueries({ queryKey: ["project-time-entries", project_id] });
      toast.success("Lançamento rejeitado!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao rejeitar: ${error.message}`);
    },
  });
};
