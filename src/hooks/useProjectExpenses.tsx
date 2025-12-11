import { useState } from "react";
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

// Hook stub - tabela project_expenses não existe ainda
export const useProjectExpenses = (projectId: string | undefined) => {
  const [data] = useState<ProjectExpense[]>([]);
  return {
    data,
    isLoading: false,
    error: null,
  };
};

export const useCreateExpense = () => {
  return {
    mutate: () => toast.info("Funcionalidade de Projetos em desenvolvimento"),
    mutateAsync: async () => toast.info("Funcionalidade de Projetos em desenvolvimento"),
    isPending: false,
  };
};

export const useUpdateExpense = () => {
  return {
    mutate: () => toast.info("Funcionalidade de Projetos em desenvolvimento"),
    mutateAsync: async () => toast.info("Funcionalidade de Projetos em desenvolvimento"),
    isPending: false,
  };
};

export const useDeleteExpense = () => {
  return {
    mutate: () => toast.info("Funcionalidade de Projetos em desenvolvimento"),
    mutateAsync: async () => toast.info("Funcionalidade de Projetos em desenvolvimento"),
    isPending: false,
  };
};

export const useApproveExpense = () => {
  return {
    mutate: () => toast.info("Funcionalidade de Projetos em desenvolvimento"),
    mutateAsync: async () => toast.info("Funcionalidade de Projetos em desenvolvimento"),
    isPending: false,
  };
};

export const useRejectExpense = () => {
  return {
    mutate: () => toast.info("Funcionalidade de Projetos em desenvolvimento"),
    mutateAsync: async () => toast.info("Funcionalidade de Projetos em desenvolvimento"),
    isPending: false,
  };
};
