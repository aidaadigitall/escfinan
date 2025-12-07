import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getEffectiveUserId } from "./useEffectiveUserId";

export type Category = {
  id: string;
  user_id: string;
  name: string;
  type: "income" | "expense";
  created_at: string;
};

export const useCategories = (type?: "income" | "expense") => {
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["categories", type],
    queryFn: async () => {
      let query = supabase
        .from("categories")
        .select("*")
        .order("name");

      if (type) {
        query = query.eq("type", type);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Remove duplicates by id
      const uniqueCategories = (data || []).reduce((acc: Category[], current) => {
        const exists = acc.find(item => item.id === current.id);
        if (!exists) {
          acc.push(current as Category);
        }
        return acc;
      }, []);
      
      return uniqueCategories;
    },
  });

  const createMutation = useMutation({
    mutationFn: async ({ name, type }: { name: string; type: "income" | "expense" }) => {
      const effectiveUserId = await getEffectiveUserId();

      const { data, error } = await supabase
        .from("categories")
        .insert({ name, type, user_id: effectiveUserId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Categoria criada com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao criar categoria");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...category }: Partial<Category> & { id: string }) => {
      const { data, error } = await supabase
        .from("categories")
        .update(category)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Categoria atualizada com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar categoria");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Categoria excluída com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao excluir categoria");
    },
  });

  return { 
    categories, 
    isLoading,
    createCategory: createMutation.mutate,
    updateCategory: updateMutation.mutate,
    deleteCategory: deleteMutation.mutate,
  };
};
