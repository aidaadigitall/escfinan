import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface TimeTracking {
  id: string;
  user_id: string;
  employee_id?: string;
  date: string;
  clock_in?: string;
  clock_out?: string;
  break_start?: string;
  break_end?: string;
  hours_worked?: number;
  break_duration?: number;
  net_hours?: number;
  notes?: string;
  status: "completed" | "pending" | "edited" | "approved";
  created_at: string;
  updated_at: string;
}

export interface TimeClockRequest {
  id: string;
  user_id: string;
  time_tracking_id: string;
  request_type: "edit_clock_in" | "edit_clock_out" | "add_break" | "remove_break" | "adjust_hours";
  reason: string;
  requested_value?: string;
  requested_hours?: number;
  status: "pending" | "approved" | "rejected" | "cancelled";
  approved_by?: string;
  approval_comment?: string;
  requested_at: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export function useTimeTracking() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  // Fetch user's time tracking for a specific date or date range
  const { data: timeTrackingData = [], isLoading } = useQuery({
    queryKey: ["time-tracking", selectedDate],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("time_tracking" as any)
        .select("*")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
        .eq("date", selectedDate)
        .order("date", { ascending: false })
        .limit(1) as any);

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch time tracking for a date range (for reports)
  const { data: timeTrackingRange = [] } = useQuery({
    queryKey: ["time-tracking-range", selectedDate],
    queryFn: async () => {
      const startOfMonth = new Date(selectedDate);
      startOfMonth.setDate(1);
      const endOfMonth = new Date(startOfMonth);
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      endOfMonth.setDate(0);

      const user = await supabase.auth.getUser();
      const { data, error } = await (supabase
        .from("time_tracking" as any)
        .select("*")
        .eq("user_id", user.data.user?.id)
        .gte("date", startOfMonth.toISOString().split("T")[0])
        .lte("date", endOfMonth.toISOString().split("T")[0])
        .order("date", { ascending: false }) as any);

      if (error) throw error;
      return data || [];
    },
  });

  // Clock in
  const clockInMutation = useMutation({
    mutationFn: async (notes?: string) => {
      const user = await supabase.auth.getUser();
      const now = new Date().toISOString();
      const today = new Date().toISOString().split("T")[0];

      const { data: existing } = await (supabase
        .from("time_tracking" as any)
        .select("id")
        .eq("user_id", user.data.user!.id)
        .eq("date", today) as any);

      if (existing && existing.length > 0) {
        throw new Error("Você já fez clock in hoje");
      }

      const { data, error } = await (supabase
        .from("time_tracking" as any)
        .insert([
          {
            user_id: user.data.user!.id,
            date: today,
            clock_in: now,
            notes,
            status: "completed",
          },
        ])
        .select() as any);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-tracking"] });
      toast.success("Clock in registrado com sucesso!");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erro ao fazer clock in");
    },
  });

  // Clock out
  const clockOutMutation = useMutation<any, Error, { trackingId: string; notes?: string }>({
    mutationFn: async ({ trackingId, notes }) => {
      const now = new Date().toISOString();

      const { data, error } = await (supabase
        .from("time_tracking" as any)
        .update({
          clock_out: now,
          notes,
          updated_at: now,
        })
        .eq("id", trackingId)
        .select() as any);

      if (error) throw error;

      // Calculate hours worked
      if (data && data.length > 0) {
        const tracking = data[0];
        const hoursWorked = calculateHours(tracking.clock_in, tracking.clock_out);
        const netHours = calculateNetHours(hoursWorked, tracking.break_duration || 0);

        const { error: updateError } = await (supabase
          .from("time_tracking" as any)
          .update({
            hours_worked: hoursWorked,
            net_hours: netHours,
          })
          .eq("id", trackingId) as any);

        if (updateError) throw updateError;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-tracking"] });
      toast.success("Clock out registrado com sucesso!");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erro ao fazer clock out");
    },
  });

  // Register break
  const breakMutation = useMutation<any, Error, { trackingId: string; action: "start" | "end" }>({
    mutationFn: async ({ trackingId, action }) => {
      const now = new Date().toISOString();

      const updateData = action === "start" 
        ? { break_start: now }
        : { break_end: now };

      const { data, error } = await (supabase
        .from("time_tracking" as any)
        .update(updateData)
        .eq("id", trackingId)
        .select() as any);

      if (error) throw error;

      // Calculate break duration if both start and end are set
      if (data && data.length > 0 && data[0].break_start && data[0].break_end) {
        const breakDuration = calculateHours(data[0].break_start, data[0].break_end);
        await (supabase
          .from("time_tracking" as any)
          .update({ break_duration: breakDuration })
          .eq("id", trackingId) as any);
      }

      return data;
    },
    onSuccess: (_, { trackingId, action }) => {
      queryClient.invalidateQueries({ queryKey: ["time-tracking"] });
      toast.success(`Intervalo ${action === "start" ? "iniciado" : "finalizado"}!`);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erro ao registrar intervalo");
    },
  });

  // Request edit
  const requestEditMutation = useMutation({
    mutationFn: async (request: Omit<TimeClockRequest, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await (supabase
        .from("time_clock_requests" as any)
        .insert([request])
        .select() as any);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-clock-requests"] });
      toast.success("Solicitação enviada para aprovação!");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erro ao enviar solicitação");
    },
  });

  // Fetch time clock requests
  const { data: pendingRequests = [] } = useQuery({
    queryKey: ["time-clock-requests"],
    queryFn: async () => {
      const user = await supabase.auth.getUser();
      const { data, error } = await (supabase
        .from("time_clock_requests" as any)
        .select("*")
        .eq("user_id", user.data.user!.id)
        .order("requested_at", { ascending: false }) as any);

      if (error) throw error;
      return data || [];
    },
  });

  // Approve request (manager only)
  const approveRequestMutation = useMutation<boolean, Error, { requestId: string; comment?: string }>({
    mutationFn: async ({ requestId, comment }) => {
      const user = await supabase.auth.getUser();
      const now = new Date().toISOString();

      // Get the request details
      const { data: request } = await (supabase
        .from("time_clock_requests" as any)
        .select("*")
        .eq("id", requestId)
        .single() as any);

      if (!request) throw new Error("Request not found");

      // Update the request status
      const { error: updateError } = await (supabase
        .from("time_clock_requests" as any)
        .update({
          status: "approved",
          approved_by: user.data.user!.id,
          approval_comment: comment,
          approved_at: now,
        })
        .eq("id", requestId) as any);

      if (updateError) throw updateError;

      // Apply the change to time_tracking
      if (request.request_type === "edit_clock_in") {
        await (supabase
          .from("time_tracking" as any)
          .update({ clock_in: request.requested_value })
          .eq("id", request.time_tracking_id) as any);
      } else if (request.request_type === "edit_clock_out") {
        await (supabase
          .from("time_tracking" as any)
          .update({ clock_out: request.requested_value })
          .eq("id", request.time_tracking_id) as any);
      } else if (request.request_type === "adjust_hours") {
        await (supabase
          .from("time_tracking" as any)
          .update({ hours_worked: request.requested_hours })
          .eq("id", request.time_tracking_id) as any);
      }

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-clock-requests"] });
      queryClient.invalidateQueries({ queryKey: ["time-tracking"] });
      toast.success("Solicitação aprovada!");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erro ao aprovar solicitação");
    },
  });

  // Reject request (manager only)
  const rejectRequestMutation = useMutation<boolean, Error, { requestId: string; comment?: string }>({
    mutationFn: async ({ requestId, comment }) => {
      const user = await supabase.auth.getUser();
      const now = new Date().toISOString();

      const { error } = await (supabase
        .from("time_clock_requests" as any)
        .update({
          status: "rejected",
          approved_by: user.data.user!.id,
          approval_comment: comment,
          approved_at: now,
        })
        .eq("id", requestId) as any);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-clock-requests"] });
      toast.success("Solicitação rejeitada!");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erro ao rejeitar solicitação");
    },
  });

  return {
    selectedDate,
    setSelectedDate,
    timeTrackingData,
    timeTrackingRange,
    isLoading,
    pendingRequests,
    clockIn: (notes?: string) => clockInMutation.mutate(notes),
    clockOut: (trackingId: string, notes?: string) => clockOutMutation.mutate({ trackingId, notes }),
    startBreak: (id: string) => breakMutation.mutate({ trackingId: id, action: "start" }),
    endBreak: (id: string) => breakMutation.mutate({ trackingId: id, action: "end" }),
    requestEdit: requestEditMutation.mutate,
    approveRequest: (requestId: string, comment?: string) => approveRequestMutation.mutate({ requestId, comment }),
    rejectRequest: (requestId: string, comment?: string) => rejectRequestMutation.mutate({ requestId, comment }),
    isClockingIn: clockInMutation.isPending,
    isClockingOut: clockOutMutation.isPending,
  };
}

// Utility functions
export function calculateHours(startTime?: string, endTime?: string): number {
  if (!startTime || !endTime) return 0;
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  return (end - start) / (1000 * 60 * 60); // Convert ms to hours
}

export function calculateNetHours(hoursWorked: number, breakDuration: number): number {
  return Math.max(0, hoursWorked - breakDuration);
}

export function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours % 1) * 60);
  return `${h}h ${m}m`;
}
