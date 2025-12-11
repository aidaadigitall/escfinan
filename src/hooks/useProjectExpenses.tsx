import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  owner_user_id: string;
  created_at: string;
  updated_at: string;
  
  // Dados relacionados
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

// Hook para buscar despesas de um projeto
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

      if (error) {
        toast.error("Erro ao carregar despesas");
        throw error;
      }

      return data as ProjectExpense[];
    },
    enabled: !!projectId,
  });
};

// Hook para criar despesa
export const useCreateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateExpenseInput) => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const { data, error } = await supabase
        .from("project_expenses")
        .insert({
          ...input,
          user_id: userData.user.id,
          owner_user_id: userData.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["project-expenses", data.project_id] });
      queryClient.invalidateQueries({ queryKey: ["project-metrics", data.project_id] });
      toast.success("Despesa criada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar despesa: ${error.message}`);
    },
  });
};

// Hook para atualizar despesa
export const useUpdateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateExpenseInput) => {
      const { id, ...updateData } = input;

      const { data, error } = await supabase
        .from("project_expenses")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["project-expenses", data.project_id] });
      queryClient.invalidateQueries({ queryKey: ["project-metrics", data.project_id] });
      toast.success("Despesa atualizada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar despesa: ${error.message}`);
    },
  });
};

// Hook para excluir despesa
export const useDeleteExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, project_id }: { id: string; project_id: string }) => {
      const { error } = await supabase.from("project_expenses").delete().eq("id", id);

      if (error) throw error;
      return project_id;
    },
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({ queryKey: ["project-expenses", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project-metrics", projectId] });
      toast.success("Despesa excluída com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir despesa: ${error.message}`);
    },
  });
};

// Hook para aprovar despesa
export const useApproveExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, project_id }: { id: string; project_id: string }) => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const { data, error } = await supabase
        .from("project_expenses")
        .update({
          status: "approved",
          approved_by: userData.user.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return { data, project_id };
    },
    onSuccess: ({ project_id }) => {
      queryClient.invalidateQueries({ queryKey: ["project-expenses", project_id] });
      toast.success("Despesa aprovada!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao aprovar: ${error.message}`);
    },
  });
};

// Hook para rejeitar despesa
export const useRejectExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, project_id }: { id: string; project_id: string }) => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const { data, error } = await supabase
        .from("project_expenses")
        .update({
          status: "rejected",
          approved_by: userData.user.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return { data, project_id };
    },
    onSuccess: ({ project_id }) => {
      queryClient.invalidateQueries({ queryKey: ["project-expenses", project_id] });
      toast.success("Despesa rejeitada!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao rejeitar: ${error.message}`);
    },
  });
};
