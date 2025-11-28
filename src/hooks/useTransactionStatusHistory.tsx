import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type TransactionStatusHistory = {
  id: string;
  transaction_id: string;
  user_id: string;
  old_status: string | null;
  new_status: string;
  observation: string | null;
  created_at: string;
  created_by_name: string | null;
};

export const useTransactionStatusHistory = (transactionId: string | undefined) => {
  const { data: history = [], isLoading } = useQuery({
    queryKey: ["transaction-status-history", transactionId],
    queryFn: async () => {
      if (!transactionId) return [];
      
      const { data, error } = await supabase
        .from("transaction_status_history")
        .select("*")
        .eq("transaction_id", transactionId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as TransactionStatusHistory[];
    },
    enabled: !!transactionId,
  });

  return {
    history,
    isLoading,
  };
};
