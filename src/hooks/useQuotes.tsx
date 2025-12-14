import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type Quote = {
  id: string;
  user_id: string;
  quote_number: number;
  client_id: string | null;
  seller_id: string | null;
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'expired';
  validity_days: number;
  delivery_date: string | null;
  products_total: number;
  services_total: number;
  discount_total: number;
  total_amount: number;
  notes: string | null;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type QuoteItem = {
  id: string;
  user_id: string;
  quote_id: string;
  item_type: 'product' | 'service';
  product_id: string | null;
  service_id: string | null;
  name: string;
  unit: string;
  quantity: number;
  unit_price: number;
  discount: number;
  subtotal: number;
  created_at: string;
};

export const useQuotes = () => {
  const queryClient = useQueryClient();

  const { data: quotes = [], isLoading } = useQuery({
    queryKey: ["quotes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotes")
        .select("*, clients(name)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (quoteData: {
      client_id?: string;
      seller_id?: string;
      status?: string;
      validity_days?: number;
      delivery_date?: string;
      products_total?: number;
      services_total?: number;
      discount_total?: number;
      total_amount?: number;
      notes?: string;
      internal_notes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("quotes")
        .insert([{ 
          client_id: quoteData.client_id || null,
          seller_id: quoteData.seller_id || null,
          status: quoteData.status || 'draft',
          validity_days: quoteData.validity_days || 3,
          delivery_date: quoteData.delivery_date || null,
          products_total: quoteData.products_total || 0,
          services_total: quoteData.services_total || 0,
          discount_total: quoteData.discount_total || 0,
          total_amount: quoteData.total_amount || 0,
          notes: quoteData.notes || null,
          internal_notes: quoteData.internal_notes || null,
          user_id: user.id 
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      toast.success("Orçamento criado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao criar orçamento");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (quoteData: Partial<Quote> & { id: string }) => {
      const { id, user_id, quote_number, created_at, updated_at, ...updateData } = quoteData;
      
      const { data, error } = await supabase
        .from("quotes")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      toast.success("Orçamento atualizado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar orçamento");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("quotes")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      toast.success("Orçamento excluído com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao excluir orçamento");
    },
  });

  // Quote Items
  const addItemMutation = useMutation({
    mutationFn: async (itemData: {
      quote_id: string;
      item_type: string;
      product_id?: string;
      service_id?: string;
      name: string;
      unit?: string;
      quantity: number;
      unit_price: number;
      discount?: number;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("quote_items")
        .insert([{ 
          quote_id: itemData.quote_id,
          item_type: itemData.item_type,
          product_id: itemData.product_id || null,
          service_id: itemData.service_id || null,
          name: itemData.name,
          unit: itemData.unit || 'UN',
          quantity: itemData.quantity,
          unit_price: itemData.unit_price,
          discount: itemData.discount || 0,
          user_id: user.id 
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      queryClient.invalidateQueries({ queryKey: ["quote_items"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao adicionar item");
    },
  });

  return {
    quotes,
    isLoading,
    createQuote: createMutation.mutateAsync,
    updateQuote: updateMutation.mutateAsync,
    deleteQuote: deleteMutation.mutate,
    addItem: addItemMutation.mutate,
  };
};
