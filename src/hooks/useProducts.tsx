import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getEffectiveUserId } from "./useEffectiveUserId";

export type Product = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  sku: string | null;
  unit: string;
  cost_price: number;
  sale_price: number;
  profit_margin: number;
  markup: number;
  profit_amount: number;
  stock_quantity: number;
  min_stock: number;
  category: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export const useProducts = () => {
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as Product[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (productData: {
      name: string;
      description?: string;
      sku?: string;
      unit?: string;
      cost_price: number;
      sale_price: number;
      stock_quantity?: number;
      min_stock?: number;
      category?: string;
      is_active?: boolean;
    }) => {
      const effectiveUserId = await getEffectiveUserId();

      const { data, error } = await supabase
        .from("products")
        .insert([{ 
          name: productData.name,
          description: productData.description || null,
          sku: productData.sku || null,
          unit: productData.unit || 'UN',
          cost_price: productData.cost_price,
          sale_price: productData.sale_price,
          stock_quantity: productData.stock_quantity || 0,
          min_stock: productData.min_stock || 0,
          category: productData.category || null,
          is_active: productData.is_active ?? true,
          user_id: effectiveUserId 
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produto criado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao criar produto");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (productData: Partial<Product> & { id: string }) => {
      const { id, profit_margin, markup, profit_amount, user_id, created_at, updated_at, ...updateData } = productData;
      
      const { data, error } = await supabase
        .from("products")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produto atualizado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar produto");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produto excluído com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao excluir produto");
    },
  });

  const deleteManyMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from("products")
        .delete()
        .in("id", ids);

      if (error) throw error;
    },
    onSuccess: (data, ids) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(`${ids.length} produtos excluídos com sucesso!`);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao excluir produtos");
    },
  });

  return {
    products,
    isLoading,
    createProduct: createMutation.mutate,
    updateProduct: updateMutation.mutate,
    deleteProduct: deleteMutation.mutate,
    deleteManyProducts: deleteManyMutation.mutate,
  };
};
