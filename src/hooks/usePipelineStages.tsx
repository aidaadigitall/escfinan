import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface PipelineStage {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  order_index: number;
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
  order_index?: number;
  probability_default?: number;
  color?: string;
}

export const usePipelineStages = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: stages = [], isLoading, error } = useQuery({
    queryKey: ["pipeline_stages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pipeline_stages" as any)
        .select("*")
        .order("order_index", { ascending: true });

      if (error) throw error;
      
      // Map database fields to interface
      return (data || []).map((stage: any) => ({
        id: stage.id,
        user_id: stage.user_id,
        name: stage.name,
        description: stage.description || "",
        order_index: stage.order_index || 0,
        probability_default: stage.probability_default || 50,
        color: stage.color || "#6366f1",
        is_active: true,
        is_system: false,
        created_at: stage.created_at,
        updated_at: stage.updated_at || stage.created_at,
      })) as PipelineStage[];
    },
    enabled: !!user,
  });

  const createStage = useMutation({
    mutationFn: async (stageData: PipelineStageFormData) => {
      const { data, error } = await supabase
        .from("pipeline_stages" as any)
        .insert([{
          name: stageData.name,
          description: stageData.description,
          color: stageData.color || "#6366f1",
          order_index: stageData.order_index || 0,
          probability_default: stageData.probability_default || 50,
          user_id: user?.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline_stages"] });
      toast.success("Estágio criado com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao criar estágio: " + error.message);
    },
  });

  const updateStage = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PipelineStageFormData> }) => {
      const updateData: any = {};
      if (data.name) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.color) updateData.color = data.color;
      if (data.order_index !== undefined) updateData.order_index = data.order_index;
      if (data.probability_default !== undefined) updateData.probability_default = data.probability_default;

      const { data: updated, error } = await supabase
        .from("pipeline_stages" as any)
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline_stages"] });
      toast.success("Estágio atualizado com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar estágio: " + error.message);
    },
  });

  const deleteStage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("pipeline_stages")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline_stages"] });
      toast.success("Estágio excluído com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao excluir estágio: " + error.message);
    },
  });

  const reorderStages = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const updates = orderedIds.map((id, index) => 
        (supabase as any)
          .from("pipeline_stages")
          .update({ order_index: index })
          .eq("id", id)
      );
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline_stages"] });
    },
    onError: (error: any) => {
      toast.error("Erro ao reordenar estágios: " + error.message);
    },
  });

  return {
    stages,
    isLoading,
    error,
    createStage,
    updateStage,
    deleteStage,
    reorderStages,
  };
};
