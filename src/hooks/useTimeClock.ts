import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface TimeClockSummary {
  id: string;
  user_id: string;
  employee_id?: string;
  year_month: string;
  total_hours_worked: number;
  total_break_duration: number;
  total_net_hours: number;
  expected_hours: number;
  balance_hours: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export function useTimeClock() {
  const queryClient = useQueryClient();

  // Fetch monthly summary
  const { data: monthlySummary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ["time-clock-summary"],
    queryFn: async () => {
      const user = await supabase.auth.getUser();
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

      const { data, error } = await (supabase
        .from("time_clock_summary" as any)
        .select("*")
        .eq("user_id", user.data.user!.id)
        .eq("year_month", currentMonth)
        .single() as any);

      if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows found
      return data;
    },
  });

  // Fetch all monthly summaries for a year
  const { data: yearlySummaries = [] } = useQuery({
    queryKey: ["time-clock-yearly"],
    queryFn: async () => {
      const user = await supabase.auth.getUser();
      const currentYear = new Date().getFullYear().toString();

      const { data, error } = await (supabase
        .from("time_clock_summary" as any)
        .select("*")
        .eq("user_id", user.data.user!.id)
        .gte("year_month", `${currentYear}-01`)
        .lte("year_month", `${currentYear}-12`)
        .order("year_month", { ascending: false }) as any);

      if (error) throw error;
      return data || [];
    },
  });

  // Calculate and update monthly summary
  const updateMonthlySummaryMutation = useMutation({
    mutationFn: async (yearMonth: string) => {
      const user = await supabase.auth.getUser();

      // Fetch all time tracking records for the month
      const { data: timeTrackings, error: fetchError } = await (supabase
        .from("time_tracking" as any)
        .select("*")
        .eq("user_id", user.data.user!.id)
        .gte("date", `${yearMonth}-01`)
        .lt("date", getNextMonth(yearMonth)) as any);

      if (fetchError) throw fetchError;

      // Calculate totals
      const totalHoursWorked = (timeTrackings || []).reduce((sum, t) => sum + (t.hours_worked || 0), 0);
      const totalBreakDuration = (timeTrackings || []).reduce((sum, t) => sum + (t.break_duration || 0), 0);
      const totalNetHours = (timeTrackings || []).reduce((sum, t) => sum + (t.net_hours || 0), 0);
      const expectedHours = 160; // 8h/day * 20 workdays (default)
      const balanceHours = totalNetHours - expectedHours;

      // Upsert summary
      const { data, error: upsertError } = await (supabase
        .from("time_clock_summary" as any)
        .upsert([
          {
            user_id: user.data.user!.id,
            year_month: yearMonth,
            total_hours_worked: totalHoursWorked,
            total_break_duration: totalBreakDuration,
            total_net_hours: totalNetHours,
            expected_hours: expectedHours,
            balance_hours: balanceHours,
          },
        ])
        .select() as any);

      if (upsertError) throw upsertError;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-clock-summary"] });
      queryClient.invalidateQueries({ queryKey: ["time-clock-yearly"] });
      toast.success("Resumo mensal atualizado!");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar resumo");
    },
  });

  // Get bank of hours (annual balance)
  const { data: bankOfHours = 0 } = useQuery({
    queryKey: ["time-clock-bank"],
    queryFn: async () => {
      const user = await supabase.auth.getUser();

      const { data, error } = await (supabase
        .from("time_clock_summary" as any)
        .select("balance_hours")
        .eq("user_id", user.data.user!.id) as any);

      if (error) throw error;

      return (data || []).reduce((sum, s) => sum + (s.balance_hours || 0), 0);
    },
  });

  return {
    monthlySummary,
    yearlySummaries,
    bankOfHours,
    isSummaryLoading,
    updateMonthlySummary: updateMonthlySummaryMutation.mutate,
    isUpdatingMonthlySummary: updateMonthlySummaryMutation.isPending,
  };
}

// Utility function to get next month in YYYY-MM format
function getNextMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split("-").map(Number);
  const date = new Date(year, month, 1); // month is 0-indexed in Date
  date.setMonth(date.getMonth() + 1);
  const nextYear = date.getFullYear();
  const nextMonth = String(date.getMonth() + 1).padStart(2, "0");
  return `${nextYear}-${nextMonth}`;
}

// Format balance hours to show positive/negative
export function formatBalance(hours: number): string {
  const sign = hours > 0 ? "+" : "";
  const h = Math.floor(Math.abs(hours));
  const m = Math.round((Math.abs(hours) % 1) * 60);
  return `${sign}${h}h ${m}m`;
}

// Get balance color based on positive/negative
export function getBalanceColor(hours: number): string {
  if (hours > 0) return "text-success";
  if (hours < 0) return "text-destructive";
  return "text-muted-foreground";
}
