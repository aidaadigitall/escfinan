import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { LeadActivity } from "./useLeadActivities";

/**
 * Hook para buscar todas as atividades de leads de uma vez
 * Útil para exibir indicadores no pipeline sem fazer múltiplas requisições
 */
export const useAllLeadActivities = () => {
  const { user } = useAuth();

  const { data: allActivities = [], isLoading, error } = useQuery({
    queryKey: ["all_lead_activities"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("lead_activities")
        .select("*")
        .order("scheduled_for", { ascending: true });

      if (error) {
        console.error("Error fetching all lead activities:", error);
        throw error;
      }
      return (data || []) as LeadActivity[];
    },
    enabled: !!user,
    staleTime: 30000, // Cache por 30 segundos
    retry: 1,
  });

  // Agrupar atividades por lead_id para fácil acesso
  const activitiesByLeadId = allActivities.reduce((acc, activity) => {
    if (!acc[activity.lead_id]) {
      acc[activity.lead_id] = [];
    }
    acc[activity.lead_id].push(activity);
    return acc;
  }, {} as Record<string, LeadActivity[]>);

  // Função helper para obter atividades de um lead específico
  const getActivitiesForLead = (leadId: string): LeadActivity[] => {
    return activitiesByLeadId[leadId] || [];
  };

  // Métricas globais
  const metrics = {
    total: allActivities.length,
    pending: allActivities.filter(a => !a.is_completed).length,
    overdue: allActivities.filter(a => {
      if (a.is_completed || !a.scheduled_for) return false;
      return new Date(a.scheduled_for) < new Date();
    }).length,
  };

  return {
    allActivities,
    activitiesByLeadId,
    getActivitiesForLead,
    metrics,
    isLoading,
    error,
  };
};
