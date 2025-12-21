import { supabase } from "@/integrations/supabase/client";

/**
 * Atualiza o expected_value de um Lead com base no total de valores de seus documentos
 * (Orçamentos, Ordens de Serviço e Vendas)
 */
export const updateLeadExpectedValue = async (clientId: string | null) => {
  if (!clientId) return;

  try {
    // Buscar todos os documentos do cliente
    const [quotesResult, serviceOrdersResult, salesResult] = await Promise.all([
      supabase
        .from("quotes")
        .select("total_amount")
        .eq("client_id", clientId)
        .in("status", ["sent", "approved"]),
      supabase
        .from("service_orders")
        .select("total_amount")
        .eq("client_id", clientId)
        .in("status", ["pending", "in_progress", "completed"]),
      supabase
        .from("sales")
        .select("total_amount")
        .eq("client_id", clientId)
        .in("status", ["pending", "completed"]),
    ]);

    // Calcular o valor total
    const quotesTotal = quotesResult.data?.reduce((sum, q) => sum + (q.total_amount || 0), 0) || 0;
    const serviceOrdersTotal = serviceOrdersResult.data?.reduce((sum, so) => sum + (so.total_amount || 0), 0) || 0;
    const salesTotal = salesResult.data?.reduce((sum, s) => sum + (s.total_amount || 0), 0) || 0;
    const totalValue = quotesTotal + serviceOrdersTotal + salesTotal;

    // Buscar o Lead associado a este Client
    const { data: clients } = await supabase
      .from("clients")
      .select("id")
      .eq("id", clientId)
      .single();

    if (!clients) return;

    // Buscar o Lead que foi convertido deste Client
    const { data: leads } = await supabase
      .from("leads")
      .select("id")
      .eq("client_id", clientId)
      .limit(1);

    if (leads && leads.length > 0) {
      const leadId = leads[0].id;
      
      // Atualizar o expected_value do Lead
      await supabase
        .from("leads")
        .update({ expected_value: totalValue })
        .eq("id", leadId);
    }
  } catch (error) {
    console.error("Erro ao atualizar expected_value do Lead:", error);
  }
};

/**
 * Invalida o cache de Leads para forçar recarregamento
 */
export const invalidateLeadsCache = (queryClient: any) => {
  queryClient.invalidateQueries({ queryKey: ["leads"] });
};
