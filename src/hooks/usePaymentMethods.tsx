import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getEffectiveUserId } from "./useEffectiveUserId";

export type PaymentMethod = {
  id: string;
  user_id: string;
  name: string;
  fee_percentage: number;
  fee_type: "percentage" | "fixed";
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
      return data.map(m => ({
        ...m,
        fee_type: (m as any).fee_type || "percentage"
      })) as PaymentMethod[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async ({ name, fee_percentage, fee_type }: { name: string; fee_percentage?: number; fee_type?: "percentage" | "fixed" }) => {
      const effectiveUserId = await getEffectiveUserId();

      const { data, error } = await supabase
        .from("payment_methods")
        .insert({ 
          name, 
          fee_percentage: fee_percentage || 0, 
          fee_type: fee_type || "percentage",
          user_id: effectiveUserId 
        } as any)
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
    mutationFn: async ({ id, name, fee_percentage, fee_type }: { id: string; name: string; fee_percentage?: number; fee_type?: "percentage" | "fixed" }) => {
      const { data, error } = await supabase
        .from("payment_methods")
        .update({ 
          name, 
          fee_percentage: fee_percentage || 0,
          fee_type: fee_type || "percentage"
        } as any)
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
    
    if (method.fee_type === "fixed") {
      return amount - method.fee_percentage;
    }
    
    const feeAmount = amount * (method.fee_percentage / 100);
    return amount - feeAmount;
  };

  // Get fee amount for a given amount and payment method
  const getFeeAmount = (amount: number, paymentMethodId: string): number => {
    const method = paymentMethods.find(m => m.id === paymentMethodId);
    if (!method || !method.fee_percentage) return 0;
    
    if (method.fee_type === "fixed") {
      return method.fee_percentage;
    }
    
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
