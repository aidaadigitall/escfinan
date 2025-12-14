import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ServiceOrderItem = {
  id: string;
  user_id: string;
  service_order_id: string;
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

export const useServiceOrderItems = (serviceOrderId?: string) => {
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["service_order_items", serviceOrderId],
    queryFn: async () => {
      if (!serviceOrderId) return [];
      
      const { data, error } = await supabase
        .from("service_order_items")
        .select("*")
        .eq("service_order_id", serviceOrderId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as ServiceOrderItem[];
    },
    enabled: !!serviceOrderId,
  });

  const saveItemsMutation = useMutation({
    mutationFn: async ({ serviceOrderId, items }: { serviceOrderId: string; items: Array<{ item_type: "product" | "service"; product_id?: string | null; service_id?: string | null; name: string; unit?: string; quantity: number; unit_price: number; discount?: number; subtotal?: number }> }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // First, delete existing items for this service order
      const { error: deleteError } = await supabase
        .from("service_order_items")
        .delete()
        .eq("service_order_id", serviceOrderId);
      
      if (deleteError) throw deleteError;

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
            service_order_id: serviceOrderId,
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

        const { error } = await supabase
          .from("service_order_items")
          .insert(itemsToInsert);

        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["service_order_items", variables.serviceOrderId] });
      queryClient.invalidateQueries({ queryKey: ["service_orders"] });
    },
    onError: (error: any) => {
      console.error("Error saving service order items:", error);
      toast.error(error.message || "Erro ao salvar itens da OS");
    },
  });

  return {
    items,
    isLoading,
    saveItems: saveItemsMutation.mutateAsync,
  };
};
