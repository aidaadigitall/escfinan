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
    queryKey: ["pipeline_stages", user?.id],
    queryFn: async () => {
      console.log("🔍 Buscando estágios via RPC para usuário:", user?.id);

      const { data, error } = await (supabase.rpc as any)("get_pipeline_stages");

      console.log("📦 Resposta RPC get_pipeline_stages:", { data, error });

      if (error) {
        console.error("❌ Erro ao buscar estágios:", error);
        throw error;
      }

      const mappedStages = (data || []).map((stage: any) => ({
        id: stage.id,
        user_id: stage.user_id,
        name: stage.name,
        description: stage.description || "",
        order_index: stage.order_index || 0,
        probability_default: stage.probability_default || 50,
        color: stage.color || "#6366f1",
        is_active: stage.is_active !== false,
        is_system: stage.is_system || false,
        created_at: stage.created_at,
        updated_at: stage.updated_at || stage.created_at,
      })) as PipelineStage[];

      console.log("✅ Estágios mapeados:", mappedStages);
      return mappedStages;
    },
    enabled: !!user,
  });

  const createStage = useMutation({
    mutationFn: async (stageData: PipelineStageFormData) => {
      const { data, error } = await (supabase.rpc as any)("create_pipeline_stage", {
        p_name: stageData.name,
        p_description: stageData.description ?? null,
        p_color: stageData.color || "#6366f1",
        p_order_index: stageData.order_index ?? null,
        p_probability: stageData.probability_default ?? 50,
      });

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

      const { data: updated, error } = await (supabase.rpc as any)("update_pipeline_stage", {
        p_id: id,
        p_name: updateData.name ?? null,
        p_description: updateData.description ?? null,
        p_color: updateData.color ?? null,
        p_order_index: updateData.order_index ?? null,
        p_probability: updateData.probability_default ?? null,
        p_is_active: updateData.is_active ?? null,
      });

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
      const { error } = await (supabase.rpc as any)("delete_pipeline_stage", { p_id: id });

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
      const { error } = await (supabase.rpc as any)("reorder_pipeline_stages", { p_ids: orderedIds });
      if (error) throw error;
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
