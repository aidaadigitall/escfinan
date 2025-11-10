import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
      return data as Category[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async ({ name, type }: { name: string; type: "income" | "expense" }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("categories")
        .insert({ name, type, user_id: user.id })
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

  return { 
    categories, 
    isLoading,
    createCategory: createMutation.mutate,
  };
};
