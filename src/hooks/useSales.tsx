import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type Sale = {
  id: string;
  user_id: string;
  sale_number: number;
  client_id: string | null;
  seller_id: string | null;
  quote_id: string | null;
  status: 'pending' | 'approved' | 'confirmed' | 'delivered' | 'cancelled';
  sale_date: string;
  delivery_date: string | null;
  products_total: number;
  services_total: number;
  discount_total: number;
  total_amount: number;
  payment_method: string | null;
  notes: string | null;
  warranty_terms: string | null;
  created_at: string;
  updated_at: string;
};
// Statuses that trigger financial integration
const FINANCIAL_STATUSES = ['approved', 'confirmed', 'delivered'];

export const useSales = () => {
  const queryClient = useQueryClient();

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ["sales"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("*, clients(name)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Helper to create financial transactions
  const createFinancialTransaction = async (sale: any, clientName?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Delete existing transactions for this sale first
      await supabase
        .from("transactions")
        .delete()
        .like("notes", `sale:${sale.id}%`);

      const dueDate = sale.delivery_date || sale.sale_date || new Date().toISOString().split("T")[0];
      const today = new Date().toISOString().split("T")[0];
      const totalAmount = sale.total_amount || 0;

      // Create a pending transaction for the total amount
      if (totalAmount > 0) {
        let status = "pending";
        if (dueDate < today) status = "overdue";

        await supabase
          .from("transactions")
          .insert({
            user_id: user.id,
            description: `Venda #${sale.sale_number}${clientName ? ` - ${clientName}` : ""}`,
            amount: totalAmount,
            type: "income",
            client: clientName || null,
            payment_method: sale.payment_method || null,
            status,
            due_date: dueDate,
            notes: `sale:${sale.id}`,
          });
      }

      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    } catch (error) {
      console.error("Error creating financial transaction from sale:", error);
    }
  };

  // Helper to update financial transaction status
  const updateFinancialStatus = async (saleId: string, newStatus: string) => {
    try {
      if (newStatus === "cancelled") {
        await supabase
          .from("transactions")
          .delete()
          .like("notes", `sale:${saleId}%`);
      }
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    } catch (error) {
      console.error("Error updating financial status:", error);
    }
  };

  const createMutation = useMutation({
    mutationFn: async (saleData: Partial<Sale>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("sales")
        .insert({ ...saleData, user_id: user.id })
        .select("*, clients(name)")
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      
      // Create financial transaction if status triggers it
      if (FINANCIAL_STATUSES.includes(data.status || "")) {
        await createFinancialTransaction(data, data.clients?.name);
      }
      
      toast.success("Venda criada com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao criar venda");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (saleData: Partial<Sale> & { id: string }) => {
      const { id, ...updateData } = saleData;
      
      const { data, error } = await supabase
        .from("sales")
        .update(updateData)
        .eq("id", id)
        .select("*, clients(name)")
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      
      // Handle financial integration based on status
      if (FINANCIAL_STATUSES.includes(data.status || "")) {
        await createFinancialTransaction(data, data.clients?.name);
      } else if (data.status === "cancelled") {
        await updateFinancialStatus(data.id, "cancelled");
      }
      
      toast.success("Venda atualizada com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar venda");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Delete associated financial transactions first
      await supabase
        .from("transactions")
        .delete()
        .like("notes", `sale:${id}%`);

      const { error } = await supabase
        .from("sales")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Venda excluída com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao excluir venda");
    },
  });

  return {
    sales,
    isLoading,
    createSale: createMutation.mutateAsync,
    updateSale: updateMutation.mutateAsync,
    deleteSale: deleteMutation.mutate,
  };
};
