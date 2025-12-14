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
      const { error: deleteError } = await supabase
        .from("quote_items")
        .delete()
        .eq("quote_id", quoteId);
        
      if (deleteError) {
        console.error("Error deleting quote items:", deleteError);
        throw deleteError;
      }

      // Then insert new items - filter out items without a name
      const validItems = items.filter(item => item.name && item.name.trim() !== "");
      
      if (validItems.length > 0) {
        const itemsToInsert = validItems.map(item => {
          const qty = Number(item.quantity) || 1;
          const price = Number(item.unit_price) || 0;
          const disc = Number(item.discount) || 0;
          
          // Note: subtotal is a GENERATED column calculated by the database
          // Do NOT include it in the insert
          return {
            quote_id: quoteId,
            user_id: user.id,
            item_type: item.item_type || "product",
            product_id: item.product_id || null,
            service_id: item.service_id || null,
            name: item.name.trim(),
            unit: item.unit || "UN",
            quantity: qty,
            unit_price: price,
            discount: disc,
          };
        });

        console.log("Inserting quote items:", itemsToInsert);
        
        const { error } = await supabase
          .from("quote_items")
          .insert(itemsToInsert);

        if (error) {
          console.error("Error inserting quote items:", error);
          throw error;
        }
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["quote_items", variables.quoteId] });
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
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
