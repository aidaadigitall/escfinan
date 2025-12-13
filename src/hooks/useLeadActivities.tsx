import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { getEffectiveUserId } from "./useEffectiveUserId";
import { toast } from "sonner";

export interface LeadActivity {
  id: string;
  lead_id: string;
  user_id: string;
  activity_type: string;
  title: string;
  description?: string;
  scheduled_at?: string;
  completed_at?: string;
  duration_minutes?: number;
  created_at: string;
  updated_at: string;
  // Alias fields for backwards compatibility
  type?: string;
  scheduled_for?: string;
  is_completed?: boolean;
}

export interface LeadActivityFormData {
  lead_id: string;
  type: string;
  title: string;
  description?: string;
  scheduled_for?: string;
  duration_minutes?: number;
}

export const useLeadActivities = (leadId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: activities = [], isLoading, error } = useQuery({
    queryKey: ["lead_activities", leadId],
    queryFn: async () => {
      let query = (supabase as any)
        .from("lead_activities")
        .select("*")
        .order("created_at", { ascending: false });

      if (leadId) {
        query = query.eq("lead_id", leadId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching lead activities:", error);
        throw error;
      }
      return (data || []).map((item: any) => ({
        ...item,
        type: item.activity_type,
        scheduled_for: item.scheduled_at,
        is_completed: !!item.completed_at,
      })) as LeadActivity[];
    },
    enabled: !!user,
    retry: 1,
  });

  const createActivity = useMutation({
    mutationFn: async (activityData: LeadActivityFormData) => {
      const effectiveUserId = await getEffectiveUserId();
      
      const { data, error } = await (supabase as any)
        .from("lead_activities")
        .insert([{
          lead_id: activityData.lead_id,
          user_id: effectiveUserId,
          activity_type: activityData.type,
          title: activityData.title,
          description: activityData.description,
          scheduled_at: activityData.scheduled_for,
          duration_minutes: activityData.duration_minutes,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead_activities"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Atividade criada com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao criar atividade: " + error.message);
    },
  });

  const updateActivity = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<LeadActivityFormData> }) => {
      const updateData: any = {};
      if (data.type) updateData.activity_type = data.type;
      if (data.title) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.scheduled_for !== undefined) updateData.scheduled_at = data.scheduled_for;
      if (data.duration_minutes !== undefined) updateData.duration_minutes = data.duration_minutes;

      const { data: updated, error } = await (supabase as any)
        .from("lead_activities")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead_activities"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Atividade atualizada com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar atividade: " + error.message);
    },
  });

  const completeActivity = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { data, error } = await (supabase as any)
        .from("lead_activities")
        .update({
          completed_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead_activities"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Atividade concluída!");
    },
    onError: (error: any) => {
      toast.error("Erro ao concluir atividade: " + error.message);
    },
  });

  const deleteActivity = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("lead_activities")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead_activities"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Atividade excluída com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao excluir atividade: " + error.message);
    },
  });

  return {
    activities,
    isLoading,
    error,
    createActivity,
    updateActivity,
    completeActivity,
    deleteActivity,
  };
};