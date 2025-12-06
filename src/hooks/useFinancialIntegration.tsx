import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface FinancialTransactionData {
  source_type: "sale" | "service_order";
  source_id: string;
  source_number: number;
  client_id?: string;
  client_name?: string;
  total_amount: number;
  payment_method?: string;
  due_date?: string;
  notes?: string;
}

export const useFinancialIntegration = () => {
  const queryClient = useQueryClient();

  // Create a financial transaction (income) when a sale or OS is confirmed/completed
  const createIncomeFromCommercial = async (data: FinancialTransactionData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Check if transaction already exists for this source
      const { data: existing } = await supabase
        .from("transactions")
        .select("id")
        .eq("notes", `${data.source_type}:${data.source_id}`)
        .maybeSingle();

      if (existing) {
        // Transaction already exists, just update status
        return existing.id;
      }

      // Determine description based on source type
      const description = data.source_type === "sale" 
        ? `Venda #${data.source_number}${data.client_name ? ` - ${data.client_name}` : ""}`
        : `OS #${data.source_number}${data.client_name ? ` - ${data.client_name}` : ""}`;

      // Calculate due date (default to today if not provided)
      const dueDate = data.due_date || new Date().toISOString().split("T")[0];
      const today = new Date().toISOString().split("T")[0];

      // Determine initial status
      let status = "pending";
      if (dueDate < today) {
        status = "overdue";
      }

      const { data: transaction, error } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          description,
          amount: data.total_amount,
          type: "income",
          client: data.client_name || null,
          payment_method: data.payment_method || null,
          status,
          due_date: dueDate,
          notes: `${data.source_type}:${data.source_id}`,
        })
        .select()
        .single();

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      
      return transaction.id;
    } catch (error: any) {
      console.error("Error creating financial transaction:", error);
      throw error;
    }
  };

  // Update financial transaction status based on source status
  const updateTransactionStatus = async (
    sourceType: "sale" | "service_order",
    sourceId: string,
    newStatus: "pending" | "received" | "cancelled"
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Find the transaction linked to this source
      const { data: transaction } = await supabase
        .from("transactions")
        .select("*")
        .eq("notes", `${sourceType}:${sourceId}`)
        .maybeSingle();

      if (!transaction) return;

      let finalStatus = newStatus;
      const today = new Date().toISOString().split("T")[0];

      // If pending and overdue, set as overdue
      if (newStatus === "pending" && transaction.due_date < today) {
        finalStatus = "overdue" as any;
      }

      const updateData: any = { status: finalStatus };
      
      // If received, set paid_date and paid_amount
      if (newStatus === "received") {
        updateData.paid_date = new Date().toISOString().split("T")[0];
        updateData.paid_amount = transaction.amount;
      }

      await supabase
        .from("transactions")
        .update(updateData)
        .eq("id", transaction.id);

      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    } catch (error: any) {
      console.error("Error updating transaction status:", error);
    }
  };

  // Check and update overdue transactions for commercial sources
  const checkOverdueStatus = async (
    sourceType: "sale" | "service_order",
    sourceId: string
  ) => {
    try {
      const { data: transaction } = await supabase
        .from("transactions")
        .select("*")
        .eq("notes", `${sourceType}:${sourceId}`)
        .maybeSingle();

      if (!transaction) return null;

      const today = new Date().toISOString().split("T")[0];
      
      // Determine status based on conditions
      if (transaction.status === "received") {
        return "received";
      } else if (transaction.due_date < today) {
        return "overdue";
      } else {
        return "pending";
      }
    } catch (error) {
      console.error("Error checking overdue status:", error);
      return null;
    }
  };

  // Delete financial transaction when source is cancelled/deleted
  const deleteTransactionFromCommercial = async (
    sourceType: "sale" | "service_order",
    sourceId: string
  ) => {
    try {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("notes", `${sourceType}:${sourceId}`);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    } catch (error: any) {
      console.error("Error deleting financial transaction:", error);
    }
  };

  // Get financial status for a commercial source
  const getFinancialStatus = async (
    sourceType: "sale" | "service_order",
    sourceId: string
  ): Promise<{ status: string | null; transaction_id: string | null }> => {
    try {
      const { data: transaction } = await supabase
        .from("transactions")
        .select("id, status, due_date, paid_date")
        .eq("notes", `${sourceType}:${sourceId}`)
        .maybeSingle();

      if (!transaction) {
        return { status: null, transaction_id: null };
      }

      const today = new Date().toISOString().split("T")[0];
      
      let status = transaction.status;
      if (status === "pending" && transaction.due_date < today) {
        status = "overdue";
      }

      return { status, transaction_id: transaction.id };
    } catch (error) {
      console.error("Error getting financial status:", error);
      return { status: null, transaction_id: null };
    }
  };

  // Register payment for a commercial transaction
  const registerPayment = async (
    sourceType: "sale" | "service_order",
    sourceId: string,
    paidAmount?: number,
    bankAccountId?: string
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: transaction } = await supabase
        .from("transactions")
        .select("*")
        .eq("notes", `${sourceType}:${sourceId}`)
        .maybeSingle();

      if (!transaction) {
        toast.error("Transação financeira não encontrada");
        return false;
      }

      const updateData: any = {
        status: "received",
        paid_date: new Date().toISOString().split("T")[0],
        paid_amount: paidAmount || transaction.amount,
      };

      if (bankAccountId) {
        updateData.bank_account_id = bankAccountId;
      }

      const { error } = await supabase
        .from("transactions")
        .update(updateData)
        .eq("id", transaction.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      
      toast.success("Pagamento registrado com sucesso!");
      return true;
    } catch (error: any) {
      console.error("Error registering payment:", error);
      toast.error(error.message || "Erro ao registrar pagamento");
      return false;
    }
  };

  return {
    createIncomeFromCommercial,
    updateTransactionStatus,
    checkOverdueStatus,
    deleteTransactionFromCommercial,
    getFinancialStatus,
    registerPayment,
  };
};
