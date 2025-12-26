import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ServiceOrder } from "./useServiceOrders";

// Definição da estrutura de dados do painel
export interface OSDashboardData {
  prazoMetrics: {
    vencidas: number;
    hoje: number;
    amanha: number;
    futuras: number;
    semPrazo: number;
  };
  prioridadeMetrics: {
    muitoUrgente: number;
    urgente: number;
    alta: number;
    media: number;
    baixa: number;
  };
  faturamentoMensal: { month: string; total: number }[];
  faturamentoPorTecnico: { technician: string; total: number }[];
}

// Hook para buscar e processar os dados do painel de O.S.
export const useOSDashboardData = () => {
  return useQuery<OSDashboardData, Error>({
    queryKey: ["os-dashboard-data"],
    queryFn: async () => {
      // 1. Buscar todas as Ordens de Serviço relevantes
      const { data: orders, error } = await supabase
        .from("service_orders")
        .select("*, technicians(name)")
        .in("status", ["pending", "in_progress", "waiting_parts", "approved"]);

      if (error) throw new Error(error.message);

      // 2. Processar as métricas
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      const prazoMetrics = {
        vencidas: 0,
        hoje: 0,
        amanha: 0,
        futuras: 0,
        semPrazo: 0,
      };

      const prioridadeMetrics = {
        muitoUrgente: 0,
        urgente: 0,
        alta: 0,
        media: 0,
        baixa: 0,
      };

      const faturamentoMensal: { [key: string]: number } = {};
      const faturamentoPorTecnico: { [key: string]: number } = {};

      for (const order of orders as any[]) {
        // Métricas de Prazo
        if (!order.exit_date) {
          prazoMetrics.semPrazo++;
        } else {
          const exitDate = new Date(order.exit_date);
          exitDate.setHours(0, 0, 0, 0);

          if (exitDate < today) {
            prazoMetrics.vencidas++;
          } else if (exitDate.getTime() === today.getTime()) {
            prazoMetrics.hoje++;
          } else if (exitDate.getTime() === tomorrow.getTime()) {
            prazoMetrics.amanha++;
          } else {
            prazoMetrics.futuras++;
          }
        }

        // Métricas de Prioridade
        switch (order.priority) {
          case "urgent":
            prioridadeMetrics.muitoUrgente++;
            break;
          case "high":
            prioridadeMetrics.alta++;
            break;
          case "medium":
            prioridadeMetrics.media++;
            break;
          case "low":
            prioridadeMetrics.baixa++;
            break;
        }

        // Faturamento (considerando O.S. com status que geram receita)
        if (["approved", "completed", "delivered"].includes(order.status)) {
          // Faturamento Mensal
          const month = new Date(order.created_at).toISOString().slice(0, 7); // YYYY-MM
          faturamentoMensal[month] = (faturamentoMensal[month] || 0) + order.total_amount;

          // Faturamento por Técnico
          const techName = order.technicians?.name || "Não atribuído";
          faturamentoPorTecnico[techName] = (faturamentoPorTecnico[techName] || 0) + order.total_amount;
        }
      }

      // 3. Formatar os dados para os gráficos
      const faturamentoMensalFormatted = Object.entries(faturamentoMensal)
        .map(([month, total]) => ({ month, total }))
        .sort((a, b) => a.month.localeCompare(b.month));

      const faturamentoPorTecnicoFormatted = Object.entries(faturamentoPorTecnico)
        .map(([technician, total]) => ({ technician, total }))
        .sort((a, b) => b.total - a.total);

      return {
        prazoMetrics,
        prioridadeMetrics,
        faturamentoMensal: faturamentoMensalFormatted,
        faturamentoPorTecnico: faturamentoPorTecnicoFormatted,
      };
    },
  });
};
