import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type CostCenter = {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
};

export const useCostCenters = () => {
  const queryClient = useQueryClient();

  const { data: costCenters = [], isLoading } = useQuery({
    queryKey: ["cost-centers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cost_centers")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data as CostCenter[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (center: Omit<CostCenter, "id" | "user_id" | "created_at">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("cost_centers")
        .insert({ ...center, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cost-centers"] });
      toast.success("Centro de custo criado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao criar centro de custo");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...center }: Partial<CostCenter> & { id: string }) => {
      const { data, error } = await supabase
        .from("cost_centers")
        .update(center)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cost-centers"] });
      toast.success("Centro de custo atualizado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar centro de custo");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("cost_centers")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cost-centers"] });
      toast.success("Centro de custo excluído com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao excluir centro de custo");
    },
  });

  return {
    costCenters,
    isLoading,
    createCostCenter: createMutation.mutate,
    updateCostCenter: updateMutation.mutate,
    deleteCostCenter: deleteMutation.mutate,
  };
};
