import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "./useAuth";

export interface LeadActivity {
  id: string;
  lead_id: string;
  user_id: string;
  type: string;
  title: string;
  description?: string;
  outcome?: string;
  outcome_notes?: string;
  scheduled_for?: string;
  completed_at?: string;
  is_completed: boolean;
  duration_minutes?: number;
  attachments?: any;
  created_at: string;
  updated_at: string;
}

export interface LeadActivityFormData {
  lead_id: string;
  type: string;
  title: string;
  description?: string;
  outcome?: string;
  outcome_notes?: string;
  scheduled_for?: string;
  duration_minutes?: number;
}

export const useLeadActivities = (leadId?: string) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: activities, isLoading } = useQuery({
    queryKey: ["lead-activities", leadId],
    queryFn: async () => {
      if (!leadId) return [];

      const { data, error } = await supabase
        .from("lead_activities")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as LeadActivity[];
    },
    enabled: !!leadId && !!user,
  });

  const createActivity = useMutation({
    mutationFn: async (activityData: LeadActivityFormData) => {
      const { data, error } = await supabase
        .from("lead_activities")
        .insert([{
          ...activityData,
          user_id: user?.id,
        }])
        .select()
        .single();

      if (error) throw error;

      // Atualizar data da última atividade no lead
      await supabase
        .from("leads")
        .update({ last_activity_date: new Date().toISOString() })
        .eq("id", activityData.lead_id);

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["lead-activities", variables.lead_id] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Atividade registrada com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao criar atividade: " + error.message);
    },
  });

  const updateActivity = useMutation({
    mutationFn: async ({ 
      id, 
      leadId, 
      data 
    }: { 
      id: string; 
      leadId: string;
      data: Partial<LeadActivityFormData> 
    }) => {
      const { data: updated, error } = await supabase
        .from("lead_activities")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["lead-activities", variables.leadId] });
      toast.success("Atividade atualizada!");
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar atividade: " + error.message);
    },
  });

  const completeActivity = useMutation({
    mutationFn: async ({ 
      id, 
      leadId, 
      outcome, 
      outcomeNotes 
    }: { 
      id: string; 
      leadId: string;
      outcome: string;
      outcomeNotes?: string;
    }) => {
      const { error } = await supabase
        .from("lead_activities")
        .update({ 
          is_completed: true,
          completed_at: new Date().toISOString(),
          outcome,
          outcome_notes: outcomeNotes,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["lead-activities", variables.leadId] });
      toast.success("Atividade concluída!");
    },
    onError: (error: any) => {
      toast.error("Erro ao concluir atividade: " + error.message);
    },
  });

  const deleteActivity = useMutation({
    mutationFn: async ({ id, leadId }: { id: string; leadId: string }) => {
      const { error } = await supabase
        .from("lead_activities")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["lead-activities", variables.leadId] });
      toast.success("Atividade excluída!");
    },
    onError: (error: any) => {
      toast.error("Erro ao excluir atividade: " + error.message);
    },
  });

  return {
    activities: activities || [],
    isLoading,
    createActivity,
    updateActivity,
    completeActivity,
    deleteActivity,
  };
};
