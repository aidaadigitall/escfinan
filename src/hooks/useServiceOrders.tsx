import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ServiceOrder = {
  id: string;
  user_id: string;
  order_number: number;
  client_id: string | null;
  technician_id: string | null;
  responsible_id: string | null;
  status: 'pending' | 'in_progress' | 'waiting_parts' | 'completed' | 'delivered' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  entry_date: string;
  exit_date: string | null;
  equipment_name: string | null;
  equipment_brand: string | null;
  equipment_model: string | null;
  equipment_serial: string | null;
  equipment_memory: string | null;
  equipment_storage: string | null;
  equipment_processor: string | null;
  defects: string | null;
  technical_report: string | null;
  warranty_terms: string | null;
  products_total: number;
  services_total: number;
  discount_total: number;
  total_amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

// Statuses that trigger financial integration
const FINANCIAL_STATUSES = ['completed', 'delivered'];

export const useServiceOrders = () => {
  const queryClient = useQueryClient();

  const { data: serviceOrders = [], isLoading } = useQuery({
    queryKey: ["service_orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_orders")
        .select("*, clients(name)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Helper to create financial transaction
  const createFinancialTransaction = async (order: any, clientName?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if transaction already exists
      const { data: existing } = await supabase
        .from("transactions")
        .select("id")
        .eq("notes", `service_order:${order.id}`)
        .maybeSingle();

      if (existing) return;

      const dueDate = order.exit_date?.split("T")[0] || new Date().toISOString().split("T")[0];
      const today = new Date().toISOString().split("T")[0];
      let status = "pending";
      if (dueDate < today) status = "overdue";

      await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          description: `OS #${order.order_number}${clientName ? ` - ${clientName}` : ""}`,
          amount: order.total_amount || 0,
          type: "income",
          client: clientName || null,
          status,
          due_date: dueDate,
          notes: `service_order:${order.id}`,
        });

      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    } catch (error) {
      console.error("Error creating financial transaction from OS:", error);
    }
  };

  // Helper to delete financial transaction
  const deleteFinancialTransaction = async (orderId: string) => {
    try {
      await supabase
        .from("transactions")
        .delete()
        .eq("notes", `service_order:${orderId}`);
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    } catch (error) {
      console.error("Error deleting financial transaction:", error);
    }
  };

  const createMutation = useMutation({
    mutationFn: async (orderData: Partial<ServiceOrder>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("service_orders")
        .insert({ ...orderData, user_id: user.id })
        .select("*, clients(name)")
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ["service_orders"] });
      
      // Create financial transaction if status triggers it
      if (FINANCIAL_STATUSES.includes(data.status || "")) {
        await createFinancialTransaction(data, data.clients?.name);
      }
      
      toast.success("Ordem de serviço criada com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao criar ordem de serviço");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (orderData: Partial<ServiceOrder> & { id: string }) => {
      const { id, ...updateData } = orderData;
      
      const { data, error } = await supabase
        .from("service_orders")
        .update(updateData)
        .eq("id", id)
        .select("*, clients(name)")
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ["service_orders"] });
      
      // Handle financial integration based on status
      if (FINANCIAL_STATUSES.includes(data.status || "")) {
        await createFinancialTransaction(data, data.clients?.name);
      } else if (data.status === "cancelled") {
        await deleteFinancialTransaction(data.id);
      }
      
      toast.success("Ordem de serviço atualizada com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar ordem de serviço");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Delete associated financial transaction first
      await supabase
        .from("transactions")
        .delete()
        .eq("notes", `service_order:${id}`);

      const { error } = await supabase
        .from("service_orders")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service_orders"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Ordem de serviço excluída com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao excluir ordem de serviço");
    },
  });

  return {
    serviceOrders,
    isLoading,
    createServiceOrder: createMutation.mutateAsync,
    updateServiceOrder: updateMutation.mutate,
    deleteServiceOrder: deleteMutation.mutate,
  };
};
