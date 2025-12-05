import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type Sale = {
  id: string;
  user_id: string;
  sale_number: number;
  client_id: string | null;
  seller_id: string | null;
  quote_id: string | null;
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled';
  sale_date: string;
  delivery_date: string | null;
  products_total: number;
  services_total: number;
  discount_total: number;
  total_amount: number;
  payment_method: string | null;
  notes: string | null;
  warranty_terms: string | null;
  created_at: string;
  updated_at: string;
};

export const useSales = () => {
  const queryClient = useQueryClient();

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ["sales"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("*, clients(name)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (saleData: Partial<Sale>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("sales")
        .insert({ ...saleData, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      toast.success("Venda criada com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao criar venda");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (saleData: Partial<Sale> & { id: string }) => {
      const { id, ...updateData } = saleData;
      
      const { data, error } = await supabase
        .from("sales")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      toast.success("Venda atualizada com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar venda");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("sales")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      toast.success("Venda excluída com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao excluir venda");
    },
  });

  return {
    sales,
    isLoading,
    createSale: createMutation.mutateAsync,
    updateSale: updateMutation.mutate,
    deleteSale: deleteMutation.mutate,
  };
};
