import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type BankBalanceAudit = {
  id: string;
  bank_account_id: string;
  transaction_id?: string;
  user_id: string;
  operation: "INSERT" | "UPDATE" | "DELETE" | "TRANSFER" | "MANUAL_ADJUSTMENT";
  old_balance?: number;
  new_balance: number;
  balance_change: number;
  description?: string;
  created_at: string;
};

export const useBankBalanceAudit = (bankAccountId?: string) => {
  const { data: auditLog = [], isLoading } = useQuery({
    queryKey: ["bank-balance-audit", bankAccountId],
    queryFn: async () => {
      let query = supabase
        .from("bank_balance_audit")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (bankAccountId) {
        query = query.eq("bank_account_id", bankAccountId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as BankBalanceAudit[];
    },
    enabled: true,
  });

  return {
    auditLog,
    isLoading,
  };
};
