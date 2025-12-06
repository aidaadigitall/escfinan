import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type Transaction = {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  type: "income" | "expense" | "transfer";
  category_id?: string;
  entity?: string;
  client?: string;
  account?: string;
  payment_method?: string;
  status: "pending" | "confirmed" | "overdue" | "paid" | "received";
  due_date: string;
  paid_date?: string;
  paid_amount?: number;
  bank_account_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
};

export const useTransactions = (type?: "income" | "expense") => {
  const queryClient = useQueryClient();

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["transactions", type],
    queryFn: async () => {
      let query = supabase
        .from("transactions")
        .select("*")
        .order("due_date", { ascending: false });

      if (type) {
        query = query.eq("type", type);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Transaction[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (transaction: Omit<Transaction, "id" | "user_id" | "created_at" | "updated_at">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Get effective owner ID for the current user
      const { data: effectiveOwnerData } = await supabase
        .rpc('get_effective_owner_id', { _user_id: user.id });
      
      const effectiveUserId = effectiveOwnerData || user.id;

      const { data, error } = await supabase
        .from("transactions")
        .insert({ ...transaction, user_id: effectiveUserId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      toast.success("Transação criada com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao criar transação");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...transaction }: Partial<Transaction> & { id: string }) => {
      const { data, error } = await supabase
        .from("transactions")
        .update(transaction)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      toast.success("Transação atualizada com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar transação");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      toast.success("Transação excluída com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao excluir transação");
    },
  });

  return {
    transactions,
    isLoading,
    createTransaction: createMutation.mutate,
    updateTransaction: updateMutation.mutate,
    deleteTransaction: deleteMutation.mutate,
  };
};
