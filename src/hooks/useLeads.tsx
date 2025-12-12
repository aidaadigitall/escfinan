import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

// Tipo derivado do Supabase
type LeadRow = Database["public"]["Tables"]["leads"]["Row"];
type LeadInsert = Database["public"]["Tables"]["leads"]["Insert"];
type LeadUpdate = Database["public"]["Tables"]["leads"]["Update"];

export interface Lead extends LeadRow {
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
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: leads = [], isLoading, error } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching leads:", error);
        throw error;
      }
      return (data || []) as Lead[];
    },
    enabled: !!user,
    retry: 1,
  });

  const createLead = useMutation({
    mutationFn: async (leadData: LeadFormData) => {
      const insertData: LeadInsert = {
        ...leadData,
        name: leadData.name,
        user_id: user?.id || "",
        owner_user_id: user?.id,
        created_by: user?.id,
      };
      
      const { data, error } = await supabase
        .from("leads")
        .insert([insertData])
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
      const message = error?.message || "Erro desconhecido";
      toast.error("Erro ao criar lead: " + message);
    },
  });

  const updateLead = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<LeadFormData> }) => {
      const updateData: LeadUpdate = { ...data };
      
      const { data: updated, error } = await supabase
        .from("leads")
        .update(updateData)
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
      const message = error?.message || "Erro desconhecido";
      toast.error("Erro ao atualizar lead: " + message);
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
      const message = error?.message || "Erro desconhecido";
      toast.error("Erro ao excluir lead: " + message);
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
          user_id: user?.id || "",
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
      const message = error?.message || "Erro desconhecido";
      toast.error("Erro ao converter lead: " + message);
    },
  });

  const moveToPipelineStage = useMutation({
    mutationFn: async ({ leadId, stageId }: { leadId: string; stageId: string | null }) => {
      // Tratar o caso especial "no-stage" - significa remover do estágio
      const finalStageId = stageId === "no-stage" ? null : stageId;
      
      const { error } = await supabase
        .from("leads")
        .update({ 
          pipeline_stage_id: finalStageId,
          last_activity_date: new Date().toISOString(),
        })
        .eq("id", leadId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead movido com sucesso!");
    },
    onError: (error: any) => {
      const message = error?.message || "Erro desconhecido";
      toast.error("Erro ao mover lead: " + message);
    },
  });

  const updateLeadStatus = useMutation({
    mutationFn: async ({ leadId, status }: { leadId: string; status: 'won' | 'lost' | 'active' }) => {
      const updateData: LeadUpdate = {
        status,
        last_activity_date: new Date().toISOString(),
      };

      // Se ganhou, marcar data de conversão
      if (status === 'won') {
        updateData.converted_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("leads")
        .update(updateData)
        .eq("id", leadId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Status do lead atualizado!");
    },
    onError: (error: any) => {
      const message = error?.message || "Erro desconhecido";
      toast.error("Erro ao atualizar status: " + message);
    },
  });

  return {
    leads,
    isLoading,
    error,
    createLead,
    updateLead,
    deleteLead,
    convertToClient,
    moveToPipelineStage,
    updateLeadStatus,
  };
};
