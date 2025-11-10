import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type BankAccount = {
  id: string;
  user_id: string;
  name: string;
  initial_balance: number;
  current_balance: number;
  account_type?: string;
  bank_name?: string;
  agency?: string;
  account_number?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export const useBankAccounts = () => {
  const queryClient = useQueryClient();

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["bank-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bank_accounts")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data as BankAccount[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (account: Omit<BankAccount, "id" | "user_id" | "created_at" | "updated_at" | "current_balance">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("bank_accounts")
        .insert({ ...account, user_id: user.id, current_balance: account.initial_balance })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      toast.success("Conta bancária criada com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao criar conta bancária");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...account }: Partial<BankAccount> & { id: string }) => {
      const { data, error } = await supabase
        .from("bank_accounts")
        .update(account)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      toast.success("Conta bancária atualizada com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar conta bancária");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("bank_accounts")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      toast.success("Conta bancária excluída com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao excluir conta bancária");
    },
  });

  return {
    accounts,
    isLoading,
    createAccount: createMutation.mutate,
    updateAccount: updateMutation.mutate,
    deleteAccount: deleteMutation.mutate,
  };
};
