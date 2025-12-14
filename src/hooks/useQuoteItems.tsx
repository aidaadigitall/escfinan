import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type QuoteItem = {
  id: string;
  user_id: string;
  quote_id: string;
  item_type: "product" | "service";
  product_id: string | null;
  service_id: string | null;
  name: string;
  unit: string;
  quantity: number;
  unit_price: number;
  discount: number;
  subtotal: number | null;
  created_at: string;
};

export const useQuoteItems = (quoteId?: string) => {
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["quote_items", quoteId],
    queryFn: async () => {
      if (!quoteId) return [];
      
      const { data, error } = await supabase
        .from("quote_items")
        .select("*")
        .eq("quote_id", quoteId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as QuoteItem[];
    },
    enabled: !!quoteId,
  });

  const saveItemsMutation = useMutation({
    mutationFn: async ({ quoteId, items }: { quoteId: string; items: Array<{ item_type: "product" | "service"; product_id?: string | null; service_id?: string | null; name: string; unit?: string; quantity: number; unit_price: number; discount?: number; subtotal?: number }> }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // First, delete existing items for this quote
      await supabase
        .from("quote_items")
        .delete()
        .eq("quote_id", quoteId);

      // Then insert new items
      if (items.length > 0) {
        const itemsToInsert = items.map(item => ({
          quote_id: quoteId,
          user_id: user.id,
          item_type: item.item_type,
          product_id: item.product_id || null,
          service_id: item.service_id || null,
          name: item.name,
          unit: item.unit || "UN",
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount: item.discount || 0,
          subtotal: (item.quantity * item.unit_price) - (item.discount || 0),
        }));

        const { error } = await supabase
          .from("quote_items")
          .insert(itemsToInsert);

        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["quote_items", variables.quoteId] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao salvar itens do orçamento");
    },
  });

  return {
    items,
    isLoading,
    saveItems: saveItemsMutation.mutateAsync,
  };
};
