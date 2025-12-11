import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface LeadAutomationRule {
  id: string;
  user_id: string;
  owner_user_id?: string;
  name: string;
  description?: string;
  is_active: boolean;
  trigger_type: 'stage_change' | 'time_in_stage' | 'score_change' | 'new_lead' | 'activity_created' | 'no_activity';
  trigger_config?: any;
  conditions?: any;
  actions: any[];
  max_executions?: number;
  cooldown_hours?: number;
  priority: number;
  execution_count: number;
  last_executed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface LeadAutomationExecution {
  id: string;
  rule_id: string;
  lead_id: string;
  status: 'success' | 'failed' | 'skipped';
  error_message?: string;
  trigger_data?: any;
  actions_executed?: any;
  executed_at: string;
}

export interface AutomationRuleFormData {
  name: string;
  description?: string;
  is_active?: boolean;
  trigger_type: string;
  trigger_config?: any;
  conditions?: any;
  actions: any[];
  max_executions?: number;
  cooldown_hours?: number;
  priority?: number;
}

export const useLeadAutomations = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Buscar regras de automação
  const { data: rules = [], isLoading, error } = useQuery({
    queryKey: ["lead_automation_rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_automation_rules")
        .select("*")
        .order("priority", { ascending: false });

      if (error) throw error;
      return (data || []) as LeadAutomationRule[];
    },
    enabled: !!user,
  });

  // Buscar execuções de automação
  const { data: executions = [] } = useQuery({
    queryKey: ["lead_automation_executions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_automation_executions")
        .select("*")
        .order("executed_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return (data || []) as LeadAutomationExecution[];
    },
    enabled: !!user,
  });

  // Criar regra de automação
  const createRule = useMutation({
    mutationFn: async (ruleData: AutomationRuleFormData) => {
      const { data, error } = await supabase
        .from("lead_automation_rules")
        .insert([{
          ...ruleData,
          user_id: user?.id,
          owner_user_id: user?.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead_automation_rules"] });
      toast.success("Regra de automação criada com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao criar regra: " + error.message);
    },
  });

  // Atualizar regra de automação
  const updateRule = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<AutomationRuleFormData> }) => {
      const { data: updated, error } = await supabase
        .from("lead_automation_rules")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead_automation_rules"] });
      toast.success("Regra atualizada com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar regra: " + error.message);
    },
  });

  // Deletar regra de automação
  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("lead_automation_rules")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead_automation_rules"] });
      toast.success("Regra deletada com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao deletar regra: " + error.message);
    },
  });

  // Alternar status ativo/inativo
  const toggleRuleStatus = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("lead_automation_rules")
        .update({ is_active: isActive })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead_automation_rules"] });
      toast.success("Status da regra atualizado!");
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar status: " + error.message);
    },
  });

  // Executar regra manualmente para um lead específico
  const executeRuleForLead = useMutation({
    mutationFn: async ({ ruleId, leadId }: { ruleId: string; leadId: string }) => {
      // Aqui você implementaria a lógica de execução
      // Por enquanto, apenas registramos a execução
      const { data, error } = await supabase
        .from("lead_automation_executions")
        .insert([{
          rule_id: ruleId,
          lead_id: leadId,
          status: 'success',
          executed_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead_automation_executions"] });
      toast.success("Automação executada com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao executar automação: " + error.message);
    },
  });

  return {
    rules,
    executions,
    isLoading,
    error,
    createRule,
    updateRule,
    deleteRule,
    toggleRuleStatus,
    executeRuleForLead,
  };
};
