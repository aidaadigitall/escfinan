import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type PaymentMethod = {
  id: string;
  user_id: string;
  name: string;
  fee_percentage: number;
  is_active: boolean;
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
    mutationFn: async ({ name, fee_percentage }: { name: string; fee_percentage?: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("payment_methods")
        .insert({ name, fee_percentage: fee_percentage || 0, user_id: user.id })
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

  const updateMutation = useMutation({
    mutationFn: async ({ id, name, fee_percentage }: { id: string; name: string; fee_percentage?: number }) => {
      const { data, error } = await supabase
        .from("payment_methods")
        .update({ name, fee_percentage: fee_percentage || 0 })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment_methods"] });
      toast.success("Forma de pagamento atualizada com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar forma de pagamento");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("payment_methods")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment_methods"] });
      toast.success("Forma de pagamento excluída com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao excluir forma de pagamento");
    },
  });

  // Calculate net amount after fee deduction
  const calculateNetAmount = (amount: number, paymentMethodId: string): number => {
    const method = paymentMethods.find(m => m.id === paymentMethodId);
    if (!method || !method.fee_percentage) return amount;
    const feeAmount = amount * (method.fee_percentage / 100);
    return amount - feeAmount;
  };

  // Get fee amount for a given amount and payment method
  const getFeeAmount = (amount: number, paymentMethodId: string): number => {
    const method = paymentMethods.find(m => m.id === paymentMethodId);
    if (!method || !method.fee_percentage) return 0;
    return amount * (method.fee_percentage / 100);
  };

  return {
    paymentMethods,
    isLoading,
    createPaymentMethod: createMutation.mutate,
    updatePaymentMethod: updateMutation.mutate,
    deletePaymentMethod: deleteMutation.mutate,
    calculateNetAmount,
    getFeeAmount,
  };
};
