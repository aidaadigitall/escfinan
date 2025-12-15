import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getEffectiveUserId } from "./useEffectiveUserId";

export interface ProjectExpense {
  id: string;
  project_id: string;
  transaction_id: string | null;
  description: string;
  amount: number;
  expense_date: string;
  expense_type: "material" | "service" | "travel" | "equipment" | "software" | "other" | null;
  category_id: string | null;
  is_billable: boolean;
  is_billed: boolean;
  markup_percentage: number;
  billable_amount: number;
  receipt_url: string | null;
  notes: string | null;
  status: "pending" | "approved" | "rejected" | "reimbursed";
  approved_by: string | null;
  approved_at: string | null;
  user_id: string;
  owner_user_id: string | null;
  created_at: string;
  updated_at: string;
  category?: {
    id: string;
    name: string;
  };
}

export interface CreateExpenseInput {
  project_id: string;
  transaction_id?: string;
  description: string;
  amount: number;
  expense_date: string;
  expense_type?: "material" | "service" | "travel" | "equipment" | "software" | "other";
  category_id?: string;
  is_billable?: boolean;
  markup_percentage?: number;
  receipt_url?: string;
  notes?: string;
}

export interface UpdateExpenseInput extends CreateExpenseInput {
  id: string;
  status?: "pending" | "approved" | "rejected" | "reimbursed";
  is_billed?: boolean;
}

export const useProjectExpenses = (projectId: string | undefined) => {
  return useQuery({
    queryKey: ["project-expenses", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from("project_expenses")
        .select(`
          *,
          category:categories(id, name)
        `)
        .eq("project_id", projectId)
        .order("expense_date", { ascending: false });

      if (error) throw error;
      return data as ProjectExpense[];
    },
    enabled: !!projectId,
  });
};

export const useCreateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateExpenseInput) => {
      const effectiveUserId = await getEffectiveUserId();
      
      const { data, error } = await supabase
        .from("project_expenses")
        .insert({
          ...input,
          user_id: effectiveUserId,
          owner_user_id: effectiveUserId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["project-expenses", variables.project_id] });
      queryClient.invalidateQueries({ queryKey: ["project-metrics"] });
      toast.success("Despesa registrada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao registrar despesa: ${error.message}`);
    },
  });
};

export const useUpdateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateExpenseInput) => {
      const { id, project_id, ...updateData } = input;
      
      const { data, error } = await supabase
        .from("project_expenses")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-expenses"] });
      queryClient.invalidateQueries({ queryKey: ["project-metrics"] });
      toast.success("Despesa atualizada!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar despesa: ${error.message}`);
    },
  });
};

export const useDeleteExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("project_expenses")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-expenses"] });
      queryClient.invalidateQueries({ queryKey: ["project-metrics"] });
      toast.success("Despesa excluída!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir despesa: ${error.message}`);
    },
  });
};

export const useApproveExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const effectiveUserId = await getEffectiveUserId();
      
      const { data, error } = await supabase
        .from("project_expenses")
        .update({
          status: "approved",
          approved_by: effectiveUserId,
          approved_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-expenses"] });
      toast.success("Despesa aprovada!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao aprovar despesa: ${error.message}`);
    },
  });
};

export const useRejectExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("project_expenses")
        .update({ status: "rejected" })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-expenses"] });
      toast.success("Despesa rejeitada!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao rejeitar despesa: ${error.message}`);
    },
  });
};
