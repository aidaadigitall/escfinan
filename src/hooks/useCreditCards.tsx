import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type CreditCard = {
  id: string;
  user_id: string;
  card_name: string;
  card_number: string;
  cardholder_name: string;
  card_brand: string;
  credit_limit: number;
  available_credit: number;
  closing_day: number;
  due_day: number;
  operator_integration?: string;
  operator_card_id?: string;
  last_sync_at?: string;
  sync_enabled: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export const useCreditCards = () => {
  const queryClient = useQueryClient();

  const { data: cards = [], isLoading } = useQuery({
    queryKey: ["credit-cards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("credit_cards")
        .select("*")
        .eq("is_active", true)
        .order("card_name");

      if (error) throw error;
      return data as CreditCard[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (card: Omit<CreditCard, "id" | "user_id" | "created_at" | "updated_at" | "available_credit">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("credit_cards")
        .insert({ 
          ...card, 
          user_id: user.id,
          available_credit: card.credit_limit
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credit-cards"] });
      toast.success("Cartão de crédito adicionado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao adicionar cartão");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...card }: Partial<CreditCard> & { id: string }) => {
      const { data, error } = await supabase
        .from("credit_cards")
        .update(card)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credit-cards"] });
      toast.success("Cartão atualizado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar cartão");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("credit_cards")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credit-cards"] });
      toast.success("Cartão excluído com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao excluir cartão");
    },
  });

  const syncMutation = useMutation({
    mutationFn: async (cardId: string) => {
      const { data, error } = await supabase.functions.invoke('sync-credit-card', {
        body: { cardId }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credit-cards"] });
      toast.success("Sincronização realizada com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao sincronizar cartão");
    },
  });

  return {
    cards,
    isLoading,
    createCard: createMutation.mutate,
    updateCard: updateMutation.mutate,
    deleteCard: deleteMutation.mutate,
    syncCard: syncMutation.mutate,
  };
};
