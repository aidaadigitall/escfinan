import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface LeadSource {
  id: string;
  name: string;
  active: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export const useLeadSources = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: sources = [], isLoading, error } = useQuery({
    queryKey: ['lead-sources'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('lead_sources')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as LeadSource[];
    },
    enabled: !!user,
  });

  const createSource = useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from('lead_sources')
        .insert([{ name, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-sources'] });
      toast.success("Origem criada com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao criar origem:", error);
      toast.error("Erro ao criar origem.");
    }
  });

  const updateSource = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<LeadSource> & { id: string }) => {
      const { data, error } = await supabase
        .from('lead_sources')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-sources'] });
      toast.success("Origem atualizada com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao atualizar origem:", error);
      toast.error("Erro ao atualizar origem.");
    }
  });

  const deleteSource = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('lead_sources')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-sources'] });
      toast.success("Origem excluída com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao excluir origem:", error);
      toast.error("Erro ao excluir origem.");
    }
  });

  return {
    sources,
    isLoading,
    error,
    createSource,
    updateSource,
    deleteSource
  };
};
