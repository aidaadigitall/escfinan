import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getEffectiveUserId } from "./useEffectiveUserId";

export interface ProjectTimeEntry {
  id: string;
  project_id: string;
  task_id: string | null;
  user_id: string;
  entry_date: string;
  hours: number;
  description: string | null;
  is_billable: boolean;
  hourly_rate: number | null;
  amount: number;
  status: "pending" | "approved" | "rejected";
  approved_by: string | null;
  approved_at: string | null;
  owner_user_id: string | null;
  created_at: string;
  updated_at: string;
  task?: {
    id: string;
    title: string;
  };
}

export interface CreateTimeEntryInput {
  project_id: string;
  task_id?: string;
  entry_date: string;
  hours: number;
  description?: string;
  is_billable?: boolean;
  hourly_rate?: number;
}

export interface UpdateTimeEntryInput extends CreateTimeEntryInput {
  id: string;
  status?: "pending" | "approved" | "rejected";
}

export const useProjectTimeEntries = (projectId: string | undefined) => {
  return useQuery({
    queryKey: ["project-time-entries", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from("project_time_entries")
        .select(`
          *,
          task:project_tasks(id, title)
        `)
        .eq("project_id", projectId)
        .order("entry_date", { ascending: false });

      if (error) throw error;
      return data as ProjectTimeEntry[];
    },
    enabled: !!projectId,
  });
};

export const useCreateTimeEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTimeEntryInput) => {
      const effectiveUserId = await getEffectiveUserId();
      
      const { data, error } = await supabase
        .from("project_time_entries")
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["project-time-entries", variables.project_id] });
      queryClient.invalidateQueries({ queryKey: ["project-metrics"] });
      toast.success("Registro de horas criado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao registrar horas: ${error.message}`);
    },
  });
};

export const useUpdateTimeEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateTimeEntryInput) => {
      const { id, project_id, ...updateData } = input;
      
      const { data, error } = await supabase
        .from("project_time_entries")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-time-entries"] });
      queryClient.invalidateQueries({ queryKey: ["project-metrics"] });
      toast.success("Registro de horas atualizado!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar registro: ${error.message}`);
    },
  });
};

export const useDeleteTimeEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("project_time_entries")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-time-entries"] });
      queryClient.invalidateQueries({ queryKey: ["project-metrics"] });
      toast.success("Registro de horas excluído!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir registro: ${error.message}`);
    },
  });
};

export const useApproveTimeEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const effectiveUserId = await getEffectiveUserId();
      
      const { data, error } = await supabase
        .from("project_time_entries")
        .update({
          status: "approved",
          approved_by: effectiveUserId,
          approved_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-time-entries"] });
      toast.success("Registro aprovado!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao aprovar registro: ${error.message}`);
    },
  });
};

export const useRejectTimeEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("project_time_entries")
        .update({ status: "rejected" })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-time-entries"] });
      toast.success("Registro rejeitado!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao rejeitar registro: ${error.message}`);
    },
  });
};
