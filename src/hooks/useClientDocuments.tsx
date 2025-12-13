import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ClientDocument {
  id: string;
  type: 'quote' | 'sale' | 'service_order';
  number: number;
  total_amount: number;
  status: string;
  created_at: string;
  client_id: string;
}

export const useClientDocuments = (clientId?: string | null) => {
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["client-documents", clientId],
    queryFn: async () => {
      if (!clientId) return [];

      const results: ClientDocument[] = [];

      // Fetch quotes
      const { data: quotes } = await supabase
        .from("quotes")
        .select("id, quote_number, total_amount, status, created_at, client_id")
        .eq("client_id", clientId);

      if (quotes) {
        quotes.forEach(q => {
          results.push({
            id: q.id,
            type: 'quote',
            number: q.quote_number,
            total_amount: q.total_amount || 0,
            status: q.status || 'draft',
            created_at: q.created_at,
            client_id: q.client_id!,
          });
        });
      }

      // Fetch sales
      const { data: sales } = await supabase
        .from("sales")
        .select("id, sale_number, total_amount, status, created_at, client_id")
        .eq("client_id", clientId);

      if (sales) {
        sales.forEach(s => {
          results.push({
            id: s.id,
            type: 'sale',
            number: s.sale_number,
            total_amount: s.total_amount || 0,
            status: s.status || 'pending',
            created_at: s.created_at,
            client_id: s.client_id!,
          });
        });
      }

      // Fetch service orders
      const { data: serviceOrders } = await supabase
        .from("service_orders")
        .select("id, order_number, total_amount, status, created_at, client_id")
        .eq("client_id", clientId);

      if (serviceOrders) {
        serviceOrders.forEach(so => {
          results.push({
            id: so.id,
            type: 'service_order',
            number: so.order_number,
            total_amount: so.total_amount || 0,
            status: so.status || 'pending',
            created_at: so.created_at,
            client_id: so.client_id!,
          });
        });
      }

      // Sort by created_at descending
      return results.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
    enabled: !!clientId,
  });

  return { documents, isLoading };
};

// Hook to get documents for a lead based on client_id
export const useLeadDocuments = (clientId?: string | null) => {
  return useClientDocuments(clientId);
};
