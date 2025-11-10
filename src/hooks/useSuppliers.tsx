import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type Supplier = {
  id: string;
  user_id: string;
  name: string;
  company_name?: string;
  cpf?: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  zipcode?: string;
  address?: string;
  city?: string;
  state?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
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
    mutationFn: async (supplierData: Omit<Supplier, "id" | "user_id" | "created_at" | "updated_at" | "is_active">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("suppliers")
        .insert({ ...supplierData, user_id: user.id })
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

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...supplierData }: Partial<Supplier> & { id: string }) => {
      const { data, error } = await supabase
        .from("suppliers")
        .update(supplierData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Fornecedor atualizado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar fornecedor");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("suppliers")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Fornecedor excluído com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao excluir fornecedor");
    },
  });

  return {
    suppliers,
    isLoading,
    createSupplier: createMutation.mutate,
    updateSupplier: updateMutation.mutate,
    deleteSupplier: deleteMutation.mutate,
  };
};
