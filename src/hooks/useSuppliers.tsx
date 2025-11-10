import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type Supplier = {
  id: string;
  user_id: string;
  name: string;
  document?: string;
  email?: string;
  phone?: string;
  created_at: string;
};

export const useSuppliers = () => {
  const queryClient = useQueryClient();

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as Supplier[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("suppliers")
        .insert({ name, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Fornecedor criado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao criar fornecedor");
    },
  });

  return {
    suppliers,
    isLoading,
    createSupplier: createMutation.mutate,
  };
};
