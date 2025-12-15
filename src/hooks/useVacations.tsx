import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getEffectiveUserId } from "./useEffectiveUserId";
import { differenceInBusinessDays, parseISO } from "date-fns";

export type VacationType = "vacation" | "leave" | "sick_leave" | "dayoff";
export type VacationStatus = "pending" | "approved" | "rejected" | "completed";

export interface EmployeeVacation {
  id: string;
  user_id: string;
  employee_id: string;
  owner_user_id: string | null;
  start_date: string;
  end_date: string;
  vacation_type: VacationType;
  total_days: number;
  status: VacationStatus;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface VacationBalance {
  id: string;
  user_id: string;
  employee_id: string;
  owner_user_id: string | null;
  year: number;
  total_days: number;
  used_days: number;
  pending_days: number;
  created_at: string;
  updated_at: string;
}

export const useVacations = () => {
  const queryClient = useQueryClient();

  // Fetch all vacations
  const { data: vacations = [], isLoading: isLoadingVacations } = useQuery({
    queryKey: ["employee-vacations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employee_vacations")
        .select("*")
        .order("start_date", { ascending: false });

      if (error) throw error;
      return data as EmployeeVacation[];
    },
  });

  // Fetch pending vacations for approval
  const { data: pendingVacations = [], isLoading: isLoadingPending } = useQuery({
    queryKey: ["employee-vacations", "pending"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employee_vacations")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as EmployeeVacation[];
    },
  });

  // Fetch vacation balances
  const { data: balances = [], isLoading: isLoadingBalances } = useQuery({
    queryKey: ["vacation-balances"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vacation_balance")
        .select("*")
        .order("year", { ascending: false });

      if (error) throw error;
      return data as VacationBalance[];
    },
  });

  // Create vacation request
  const createVacationMutation = useMutation({
    mutationFn: async (data: {
      employee_id: string;
      start_date: string;
      end_date: string;
      vacation_type: VacationType;
      notes?: string;
    }) => {
      const effectiveUserId = await getEffectiveUserId();
      const totalDays = differenceInBusinessDays(
        parseISO(data.end_date),
        parseISO(data.start_date)
      ) + 1;

      const { data: result, error } = await supabase
        .from("employee_vacations")
        .insert({
          ...data,
          user_id: effectiveUserId,
          owner_user_id: effectiveUserId,
          total_days: totalDays,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      // Update pending days in balance
      const year = new Date(data.start_date).getFullYear();
      await updateBalancePendingDays(data.employee_id, year, totalDays, "add");

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-vacations"] });
      queryClient.invalidateQueries({ queryKey: ["vacation-balances"] });
      toast.success("Solicitação de férias criada com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao criar solicitação de férias");
    },
  });

  // Approve vacation
  const approveVacationMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: vacation, error: fetchError } = await supabase
        .from("employee_vacations")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      const { data, error } = await supabase
        .from("employee_vacations")
        .update({
          status: "approved",
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // Move from pending to used days
      const year = new Date(vacation.start_date).getFullYear();
      await updateBalancePendingDays(vacation.employee_id, year, vacation.total_days, "remove");
      await updateBalanceUsedDays(vacation.employee_id, year, vacation.total_days, "add");

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-vacations"] });
      queryClient.invalidateQueries({ queryKey: ["vacation-balances"] });
      toast.success("Férias aprovadas com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao aprovar férias");
    },
  });

  // Reject vacation
  const rejectVacationMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: vacation, error: fetchError } = await supabase
        .from("employee_vacations")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      const { data, error } = await supabase
        .from("employee_vacations")
        .update({
          status: "rejected",
          rejection_reason: reason,
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // Remove from pending days
      const year = new Date(vacation.start_date).getFullYear();
      await updateBalancePendingDays(vacation.employee_id, year, vacation.total_days, "remove");

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-vacations"] });
      queryClient.invalidateQueries({ queryKey: ["vacation-balances"] });
      toast.success("Férias rejeitadas");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao rejeitar férias");
    },
  });

  // Delete vacation request
  const deleteVacationMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: vacation, error: fetchError } = await supabase
        .from("employee_vacations")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from("employee_vacations")
        .delete()
        .eq("id", id);

      if (error) throw error;

      // Update balance based on status
      const year = new Date(vacation.start_date).getFullYear();
      if (vacation.status === "pending") {
        await updateBalancePendingDays(vacation.employee_id, year, vacation.total_days, "remove");
      } else if (vacation.status === "approved") {
        await updateBalanceUsedDays(vacation.employee_id, year, vacation.total_days, "remove");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-vacations"] });
      queryClient.invalidateQueries({ queryKey: ["vacation-balances"] });
      toast.success("Solicitação excluída com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao excluir solicitação");
    },
  });

  // Create or update vacation balance
  const upsertBalanceMutation = useMutation({
    mutationFn: async (data: {
      employee_id: string;
      year: number;
      total_days?: number;
    }) => {
      const effectiveUserId = await getEffectiveUserId();

      const { data: result, error } = await supabase
        .from("vacation_balance")
        .upsert(
          {
            employee_id: data.employee_id,
            year: data.year,
            total_days: data.total_days || 30,
            user_id: effectiveUserId,
            owner_user_id: effectiveUserId,
          },
          { onConflict: "employee_id,year" }
        )
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vacation-balances"] });
      toast.success("Saldo de férias atualizado!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar saldo de férias");
    },
  });

  // Helper functions
  const updateBalancePendingDays = async (
    employeeId: string,
    year: number,
    days: number,
    operation: "add" | "remove"
  ) => {
    const balance = balances.find(
      (b) => b.employee_id === employeeId && b.year === year
    );

    if (balance) {
      const newPendingDays =
        operation === "add"
          ? balance.pending_days + days
          : Math.max(0, balance.pending_days - days);

      await supabase
        .from("vacation_balance")
        .update({ pending_days: newPendingDays })
        .eq("id", balance.id);
    }
  };

  const updateBalanceUsedDays = async (
    employeeId: string,
    year: number,
    days: number,
    operation: "add" | "remove"
  ) => {
    const balance = balances.find(
      (b) => b.employee_id === employeeId && b.year === year
    );

    if (balance) {
      const newUsedDays =
        operation === "add"
          ? balance.used_days + days
          : Math.max(0, balance.used_days - days);

      await supabase
        .from("vacation_balance")
        .update({ used_days: newUsedDays })
        .eq("id", balance.id);
    }
  };

  // Get balance for specific employee and year
  const getBalance = (employeeId: string, year?: number) => {
    const targetYear = year || new Date().getFullYear();
    return balances.find(
      (b) => b.employee_id === employeeId && b.year === targetYear
    );
  };

  // Get remaining days
  const getRemainingDays = (employeeId: string, year?: number) => {
    const balance = getBalance(employeeId, year);
    if (!balance) return 30; // Default CLT days
    return balance.total_days - balance.used_days - balance.pending_days;
  };

  return {
    vacations,
    pendingVacations,
    balances,
    isLoading: isLoadingVacations || isLoadingPending || isLoadingBalances,
    createVacation: createVacationMutation.mutate,
    approveVacation: approveVacationMutation.mutate,
    rejectVacation: rejectVacationMutation.mutate,
    deleteVacation: deleteVacationMutation.mutate,
    upsertBalance: upsertBalanceMutation.mutate,
    getBalance,
    getRemainingDays,
    isCreating: createVacationMutation.isPending,
    isApproving: approveVacationMutation.isPending,
    isRejecting: rejectVacationMutation.isPending,
  };
};

// Vacation type labels
export const vacationTypeLabels: Record<VacationType, string> = {
  vacation: "Férias",
  leave: "Licença",
  sick_leave: "Licença Médica",
  dayoff: "Folga",
};

// Status labels
export const vacationStatusLabels: Record<VacationStatus, string> = {
  pending: "Pendente",
  approved: "Aprovado",
  rejected: "Rejeitado",
  completed: "Concluído",
};
