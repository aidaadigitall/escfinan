import { useMemo } from "react";
import { Lead } from "@/hooks/useLeads";
import { LeadFilters } from "@/components/CRMFilters";
import { isAfter, isBefore, startOfDay, endOfDay } from "date-fns";

/**
 * Hook para filtrar leads com base nos filtros aplicados
 */
export const useFilteredLeads = (leads: Lead[], filters: LeadFilters) => {
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Filtro de busca (nome, empresa, email, telefone)
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          lead.name?.toLowerCase().includes(searchLower) ||
          lead.company?.toLowerCase().includes(searchLower) ||
          lead.email?.toLowerCase().includes(searchLower) ||
          lead.phone?.includes(filters.search);
        
        if (!matchesSearch) return false;
      }

      // Filtro por origem
      if (filters.source && lead.source !== filters.source) {
        return false;
      }

      // Filtro por estágio
      if (filters.stageId && lead.pipeline_stage_id !== filters.stageId) {
        return false;
      }

      // Filtro por status
      if (filters.status && lead.status !== filters.status) {
        return false;
      }

      // Filtro por data de criação (de)
      if (filters.dateFrom) {
        const leadDate = new Date(lead.created_at);
        if (isBefore(leadDate, startOfDay(filters.dateFrom))) {
          return false;
        }
      }

      // Filtro por data de criação (até)
      if (filters.dateTo) {
        const leadDate = new Date(lead.created_at);
        if (isAfter(leadDate, endOfDay(filters.dateTo))) {
          return false;
        }
      }

      // Filtro por valor mínimo
      if (filters.minValue !== null && (lead.expected_value || 0) < filters.minValue) {
        return false;
      }

      // Filtro por valor máximo
      if (filters.maxValue !== null && (lead.expected_value || 0) > filters.maxValue) {
        return false;
      }

      return true;
    });
  }, [leads, filters]);

  // Estatísticas dos leads filtrados
  const stats = useMemo(() => {
    return {
      total: filteredLeads.length,
      totalValue: filteredLeads.reduce((sum, l) => sum + (l.expected_value || 0), 0),
      won: filteredLeads.filter((l) => l.status === "won").length,
      lost: filteredLeads.filter((l) => l.status === "lost").length,
    };
  }, [filteredLeads]);

  return {
    filteredLeads,
    stats,
    isFiltered: Object.values(filters).some((v) => v !== null && v !== ""),
  };
};
