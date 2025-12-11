import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LeadSource {
  id: string;
  user_id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export const useLeadSources = () => {
  const queryClient = useQueryClient();

  const { data: sources = [], isLoading } = useQuery({
    queryKey: ["lead_sources"],
    queryFn: async () => {
      try {
        const { data, error } = await (supabase as any)
          .from("lead_sources" as any)
          .select("*")
          .eq("is_active", true)
          .order("name");
        if (error) {
          console.error("Erro ao buscar lead_sources:", error);
          return [] as LeadSource[];
        }
        return (data || []) as LeadSource[];
      } catch (err) {
        console.error("Exceção ao buscar lead_sources:", err);
        return [] as LeadSource[];
      }
    },
  });

  const createSource = useMutation({
    mutationFn: async (name: string) => {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await (supabase as any)
        .from("lead_sources" as any)
        .insert({ name, user_id: userData?.user?.id })
        .select()
        .single();
      if (error) throw error;
      return data as LeadSource;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead_sources"] });
    },
  });

  const deleteSource = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("lead_sources" as any)
        .update({ is_active: false })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead_sources"] });
    },
  });

  return { sources, isLoading, createSource, deleteSource };
};
