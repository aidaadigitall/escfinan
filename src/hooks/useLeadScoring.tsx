import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface LeadScoringRule {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  criteria_type: 'field_value' | 'activity' | 'behavior' | 'demographic';
  field_name?: string;
  operator?: string;
  value?: string;
  points: number;
  expires_after_days?: number;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface LeadScoreHistory {
  id: string;
  lead_id: string;
  rule_id?: string;
  points_change: number;
  previous_score: number;
  new_score: number;
  reason?: string;
  expires_at?: string;
  created_at: string;
}

export interface ScoringRuleFormData {
  name: string;
  description?: string;
  is_active?: boolean;
  criteria_type: string;
  field_name?: string;
  operator?: string;
  value?: string;
  points: number;
  expires_after_days?: number;
  priority?: number;
}

export const useLeadScoring = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Buscar regras de pontuação
  const { data: rules = [], isLoading, error } = useQuery({
    queryKey: ["lead_scoring_rules"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("lead_scoring_rules")
        .select("*")
        .order("priority", { ascending: false });

      if (error) throw error;
      return (data || []) as LeadScoringRule[];
    },
    enabled: !!user,
  });

  // Buscar histórico de pontuação de um lead
  const getLeadScoreHistory = async (leadId: string) => {
    const { data, error } = await (supabase as any)
      .from("lead_score_history")
      .select("*")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []) as LeadScoreHistory[];
  };

  // Criar regra de pontuação
  const createRule = useMutation({
    mutationFn: async (ruleData: ScoringRuleFormData) => {
      const { data, error } = await (supabase as any)
        .from("lead_scoring_rules")
        .insert([{
          ...ruleData,
          user_id: user?.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead_scoring_rules"] });
      toast.success("Regra de pontuação criada com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao criar regra: " + error.message);
    },
  });

  // Atualizar regra
  const updateRule = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ScoringRuleFormData> }) => {
      const { data: updated, error } = await (supabase as any)
        .from("lead_scoring_rules")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead_scoring_rules"] });
      toast.success("Regra atualizada com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar regra: " + error.message);
    },
  });

  // Deletar regra
  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("lead_scoring_rules")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead_scoring_rules"] });
      toast.success("Regra deletada com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao deletar regra: " + error.message);
    },
  });

  // Adicionar pontos manualmente a um lead
  const addPointsToLead = useMutation({
    mutationFn: async ({
      leadId,
      points,
      reason,
      expiresAfterDays
    }: {
      leadId: string;
      points: number;
      reason?: string;
      expiresAfterDays?: number;
    }) => {
      // Buscar score atual do lead
      const { data: lead } = await (supabase as any)
        .from("leads")
        .select("score")
        .eq("id", leadId)
        .single();

      const currentScore = lead?.score || 0;
      const newScore = currentScore + points;

      // Calcular data de expiração se fornecida
      let expiresAt = null;
      if (expiresAfterDays) {
        const expireDate = new Date();
        expireDate.setDate(expireDate.getDate() + expiresAfterDays);
        expiresAt = expireDate.toISOString();
      }

      // Adicionar ao histórico
      const { data, error } = await (supabase as any)
        .from("lead_score_history")
        .insert([{
          lead_id: leadId,
          points_change: points,
          previous_score: currentScore,
          new_score: newScore,
          reason: reason || "Pontos adicionados manualmente",
          expires_at: expiresAt,
        }])
        .select()
        .single();

      if (error) throw error;

      // Atualizar score do lead
      await (supabase as any)
        .from("leads")
        .update({ score: newScore })
        .eq("id", leadId);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Pontos adicionados com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao adicionar pontos: " + error.message);
    },
  });

  // Recalcular score de um lead baseado nas regras ativas
  const recalculateLeadScore = useMutation({
    mutationFn: async (leadId: string) => {
      const { data, error } = await (supabase as any)
        .rpc('calculate_lead_score', { lead_id_param: leadId });

      if (error) throw error;

      // Atualizar score do lead
      await (supabase as any)
        .from("leads")
        .update({ score: data })
        .eq("id", leadId);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Score recalculado com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao recalcular score: " + error.message);
    },
  });

  // Aplicar regras de pontuação a um lead
  const applyRulesToLead = useMutation({
    mutationFn: async ({ leadId, lead }: { leadId: string; lead: any }) => {
      const activeRules = rules.filter(r => r.is_active);
      let totalPointsAdded = 0;

      for (const rule of activeRules) {
        let shouldApply = false;

        // Verificar se a regra se aplica
        if (rule.criteria_type === 'field_value' && rule.field_name) {
          const fieldValue = lead[rule.field_name];
          
          switch (rule.operator) {
            case 'equals':
              shouldApply = fieldValue === rule.value;
              break;
            case 'contains':
              shouldApply = fieldValue?.toString().includes(rule.value || '');
              break;
            case 'greater_than':
              shouldApply = Number(fieldValue) > Number(rule.value);
              break;
            case 'less_than':
              shouldApply = Number(fieldValue) < Number(rule.value);
              break;
          }
        }

        if (shouldApply) {
          await addPointsToLead.mutateAsync({
            leadId,
            points: rule.points,
            reason: `Regra aplicada: ${rule.name}`,
            expiresAfterDays: rule.expires_after_days,
          });
          totalPointsAdded += rule.points;
        }
      }

      return totalPointsAdded;
    },
    onSuccess: () => {
      toast.success("Regras de pontuação aplicadas!");
    },
    onError: (error: any) => {
      toast.error("Erro ao aplicar regras: " + error.message);
    },
  });

  return {
    rules,
    isLoading,
    error,
    getLeadScoreHistory,
    createRule,
    updateRule,
    deleteRule,
    addPointsToLead,
    recalculateLeadScore,
    applyRulesToLead,
  };
};
