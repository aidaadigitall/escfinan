import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type PaymentMethod = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
};

export const usePaymentMethods = () => {
  const queryClient = useQueryClient();

  const { data: paymentMethods = [], isLoading } = useQuery({
    queryKey: ["payment_methods"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as PaymentMethod[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("payment_methods")
        .insert({ name, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment_methods"] });
      toast.success("Forma de pagamento criada com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao criar forma de pagamento");
    },
  });

  return {
    paymentMethods,
    isLoading,
    createPaymentMethod: createMutation.mutate,
  };
};
