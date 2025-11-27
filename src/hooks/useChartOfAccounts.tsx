import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ChartOfAccount = {
  id: string;
  user_id: string;
  code: string;
  name: string;
  account_type: "asset" | "liability" | "equity" | "revenue" | "expense";
  parent_id?: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export const useChartOfAccounts = () => {
  const queryClient = useQueryClient();

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["chart-of-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chart_of_accounts")
        .select("*")
        .eq("is_active", true)
        .order("code");

      if (error) throw error;
      return data as ChartOfAccount[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (account: Omit<ChartOfAccount, "id" | "user_id" | "created_at" | "updated_at">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("chart_of_accounts")
        .insert({ ...account, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chart-of-accounts"] });
      toast.success("Conta criada com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao criar conta");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...account }: Partial<ChartOfAccount> & { id: string }) => {
      const { data, error } = await supabase
        .from("chart_of_accounts")
        .update(account)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chart-of-accounts"] });
      toast.success("Conta atualizada com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar conta");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("chart_of_accounts")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chart-of-accounts"] });
      toast.success("Conta excluída com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao excluir conta");
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
