import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
export interface TimeEntry {
  id: string;
  user_id: string;
  clock_in: string;
  clock_out: string | null;
  break_start: string | null;
  break_end: string | null;
  total_hours: number | null;
  total_break_minutes: number | null;
  notes: string | null;
  location: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export function useTimeEntries() {
  const queryClient = useQueryClient();

  const { data: timeEntries = [], isLoading } = useQuery({
    queryKey: ["time_entries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("time_entries")
        .select("*")
        .order("clock_in", { ascending: false });

      if (error) throw error;
      return data as TimeEntry[];
    },
  });

  // Get current active entry for the logged user
  const { data: activeEntry, isLoading: isLoadingActive } = useQuery({
    queryKey: ["active_time_entry"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("time_entries")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .is("clock_out", null)
        .order("clock_in", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as TimeEntry | null;
    },
  });

  const clockInMutation = useMutation({
    mutationFn: async (notes?: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("time_entries")
        .insert({
          user_id: user.id,
          clock_in: new Date().toISOString(),
          notes,
          status: "active",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time_entries"] });
      queryClient.invalidateQueries({ queryKey: ["active_time_entry"] });
      toast.success("Entrada registrada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao registrar entrada: " + error.message);
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: async (entryId: string) => {
      const clockOut = new Date();
      
      // Get the entry to calculate total hours
      const { data: entry, error: fetchError } = await supabase
        .from("time_entries")
        .select("*")
        .eq("id", entryId)
        .single();

      if (fetchError) throw fetchError;

      const clockIn = new Date(entry.clock_in);
      const breakMinutes = entry.total_break_minutes || 0;
      const totalMs = clockOut.getTime() - clockIn.getTime();
      const totalHours = (totalMs / (1000 * 60 * 60)) - (breakMinutes / 60);

      const { data, error } = await supabase
        .from("time_entries")
        .update({
          clock_out: clockOut.toISOString(),
          total_hours: Math.max(0, totalHours),
          status: "completed",
        })
        .eq("id", entryId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time_entries"] });
      queryClient.invalidateQueries({ queryKey: ["active_time_entry"] });
      toast.success("Saída registrada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao registrar saída: " + error.message);
    },
  });

  const startBreakMutation = useMutation({
    mutationFn: async (entryId: string) => {
      const { data, error } = await supabase
        .from("time_entries")
        .update({
          break_start: new Date().toISOString(),
        })
        .eq("id", entryId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time_entries"] });
      queryClient.invalidateQueries({ queryKey: ["active_time_entry"] });
      toast.success("Intervalo iniciado!");
    },
    onError: (error) => {
      toast.error("Erro ao iniciar intervalo: " + error.message);
    },
  });

  const endBreakMutation = useMutation({
    mutationFn: async (entryId: string) => {
      // Get the entry to calculate break time
      const { data: entry, error: fetchError } = await supabase
        .from("time_entries")
        .select("*")
        .eq("id", entryId)
        .single();

      if (fetchError) throw fetchError;

      const breakEnd = new Date();
      const breakStart = new Date(entry.break_start);
      const breakMs = breakEnd.getTime() - breakStart.getTime();
      const breakMinutes = breakMs / (1000 * 60);
      const totalBreak = (entry.total_break_minutes || 0) + breakMinutes;

      const { data, error } = await supabase
        .from("time_entries")
        .update({
          break_end: breakEnd.toISOString(),
          break_start: null, // Clear for next break
          total_break_minutes: totalBreak,
        })
        .eq("id", entryId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time_entries"] });
      queryClient.invalidateQueries({ queryKey: ["active_time_entry"] });
      toast.success("Intervalo finalizado!");
    },
    onError: (error) => {
      toast.error("Erro ao finalizar intervalo: " + error.message);
    },
  });

  const updateEntryMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<TimeEntry> & { id: string }) => {
      const { data: result, error } = await supabase
        .from("time_entries")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time_entries"] });
      queryClient.invalidateQueries({ queryKey: ["active_time_entry"] });
      toast.success("Registro atualizado!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar: " + error.message);
    },
  });

  const deleteEntryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("time_entries")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time_entries"] });
      queryClient.invalidateQueries({ queryKey: ["active_time_entry"] });
      toast.success("Registro excluído!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir: " + error.message);
    },
  });

  return {
    timeEntries,
    activeEntry,
    isLoading,
    isLoadingActive,
    clockIn: clockInMutation.mutate,
    clockOut: clockOutMutation.mutate,
    startBreak: startBreakMutation.mutate,
    endBreak: endBreakMutation.mutate,
    updateEntry: updateEntryMutation.mutate,
    deleteEntry: deleteEntryMutation.mutate,
    isClockingIn: clockInMutation.isPending,
    isClockingOut: clockOutMutation.isPending,
  };
}
