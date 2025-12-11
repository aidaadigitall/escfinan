import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "./useAuth";

export interface Lead {
  id: string;
  user_id: string;
  owner_user_id?: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  source: string;
  source_details?: string;
  pipeline_stage_id?: string;
  status: string;
  score: number;
  expected_value?: number;
  probability?: number;
  expected_close_date?: string;
  lost_reason?: string;
  lost_date?: string;
  converted_to_client: boolean;
  client_id?: string;
  converted_at?: string;
  assigned_to?: string;
  first_contact_date?: string;
  last_contact_date?: string;
  last_activity_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  pipeline_stage?: {
    id: string;
    name: string;
    color: string;
  };
  assigned_user?: {
    id: string;
    email: string;
  };
}

export interface LeadFormData {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  source?: string;
  source_details?: string;
  pipeline_stage_id?: string;
  status?: string;
  score?: number;
  expected_value?: number;
  probability?: number;
  expected_close_date?: string;
  assigned_to?: string;
  notes?: string;
}

export const useLeads = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: leads, isLoading, error } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select(`
          *,
          pipeline_stage:pipeline_stages(id, name, color),
          assigned_user:auth.users(id, email)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Lead[];
    },
    enabled: !!user,
  });

  const createLead = useMutation({
    mutationFn: async (leadData: LeadFormData) => {
      const { data, error } = await supabase
        .from("leads")
        .insert([{
          ...leadData,
          user_id: user?.id,
          owner_user_id: user?.id,
          created_by: user?.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead criado com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao criar lead: " + error.message);
    },
  });

  const updateLead = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<LeadFormData> }) => {
      const { data: updated, error } = await supabase
        .from("leads")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead atualizado com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar lead: " + error.message);
    },
  });

  const deleteLead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("leads")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead excluído com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao excluir lead: " + error.message);
    },
  });

  const convertToClient = useMutation({
    mutationFn: async ({ leadId, clientData }: { 
      leadId: string; 
      clientData: {
        name: string;
        email?: string;
        phone?: string;
        document?: string;
        address?: string;
        city?: string;
        state?: string;
        zip_code?: string;
      };
    }) => {
      // 1. Criar o cliente
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .insert([{
          ...clientData,
          user_id: user?.id,
        }])
        .select()
        .single();

      if (clientError) throw clientError;

      // 2. Atualizar o lead
      const { error: leadError } = await supabase
        .from("leads")
        .update({
          converted_to_client: true,
          client_id: client.id,
          converted_at: new Date().toISOString(),
          status: 'won',
        })
        .eq("id", leadId);

      if (leadError) throw leadError;

      return { client, leadId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Lead convertido em cliente com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao converter lead: " + error.message);
    },
  });

  const moveToPipelineStage = useMutation({
    mutationFn: async ({ leadId, stageId }: { leadId: string; stageId: string }) => {
      const { error } = await supabase
        .from("leads")
        .update({ 
          pipeline_stage_id: stageId,
          last_activity_date: new Date().toISOString(),
        })
        .eq("id", leadId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (error: any) => {
      toast.error("Erro ao mover lead: " + error.message);
    },
  });

  return {
    leads: leads || [],
    isLoading,
    error,
    createLead,
    updateLead,
    deleteLead,
    convertToClient,
    moveToPipelineStage,
  };
};
