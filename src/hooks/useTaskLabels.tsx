import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getEffectiveUserId } from "./useEffectiveUserId";

export interface TaskLabel {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export const useTaskLabels = () => {
  const queryClient = useQueryClient();

  const { data: labels = [], isLoading } = useQuery({
    queryKey: ["task-labels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_labels")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as TaskLabel[];
    },
  });

  const createLabel = useMutation({
    mutationFn: async ({ name, color }: { name: string; color?: string }) => {
      const effectiveUserId = await getEffectiveUserId();
      if (!effectiveUserId) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("task_labels")
        .insert({
          user_id: effectiveUserId,
          name,
          color: color || "#6366f1",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-labels"] });
      toast.success("Etiqueta criada com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao criar etiqueta: " + error.message);
    },
  });

  const updateLabel = useMutation({
    mutationFn: async ({ id, name, color }: { id: string; name: string; color?: string }) => {
      const { data, error } = await supabase
        .from("task_labels")
        .update({ name, color })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-labels"] });
      toast.success("Etiqueta atualizada com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar etiqueta: " + error.message);
    },
  });

  const deleteLabel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("task_labels")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-labels"] });
      toast.success("Etiqueta excluída com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao excluir etiqueta: " + error.message);
    },
  });

  return {
    labels,
    isLoading,
    createLabel: createLabel.mutateAsync,
    updateLabel: updateLabel.mutateAsync,
    deleteLabel: deleteLabel.mutateAsync,
  };
};