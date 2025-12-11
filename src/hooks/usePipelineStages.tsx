import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "./useAuth";

export interface PipelineStage {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  order: number;
  probability_default: number;
  color: string;
  is_active: boolean;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface PipelineStageFormData {
  name: string;
  description?: string;
  order?: number;
  probability_default?: number;
  color?: string;
}

export const usePipelineStages = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: stages = [], isLoading } = useQuery({
    queryKey: ["pipeline-stages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pipeline_stages")
        .select("*")
        .eq("is_active", true)
        .order("order", { ascending: true });

      if (error) {
        console.error("Erro ao buscar pipeline stages:", error);
        throw error;
      }
      return (data || []) as PipelineStage[];
    },
    enabled: !!user,
  });

  const createStage = useMutation({
    mutationFn: async (stageData: PipelineStageFormData) => {
      // Pegar o próximo order
      const maxOrder = Math.max(...(stages?.map(s => s.order) || [0]));
      
      const { data, error } = await supabase
        .from("pipeline_stages")
        .insert([{
          ...stageData,
          user_id: user?.id,
          order: stageData.order || maxOrder + 1,
          is_system: false,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline-stages"] });
      toast.success("Estágio criado com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao criar estágio: " + error.message);
    },
  });

  const updateStage = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PipelineStageFormData> }) => {
      const { data: updated, error } = await supabase
        .from("pipeline_stages")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline-stages"] });
      toast.success("Estágio atualizado!");
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar estágio: " + error.message);
    },
  });

  const deleteStage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("pipeline_stages")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline-stages"] });
      toast.success("Estágio excluído!");
    },
    onError: (error: any) => {
      toast.error("Erro ao excluir estágio: " + error.message);
    },
  });

  const reorderStages = useMutation({
    mutationFn: async (newOrder: { id: string; order: number }[]) => {
      const updates = newOrder.map(({ id, order }) =>
        supabase
          .from("pipeline_stages")
          .update({ order })
          .eq("id", id)
      );

      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline-stages"] });
      toast.success("Ordem atualizada!");
    },
    onError: (error: any) => {
      toast.error("Erro ao reordenar estágios: " + error.message);
    },
  });

  return {
    stages: stages || [],
    isLoading,
    createStage,
    updateStage,
    deleteStage,
    reorderStages,
  };
};
