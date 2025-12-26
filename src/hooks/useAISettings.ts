import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "./useAuth";

export type AIProvider = "lovable" | "openai" | "google";
export type AIModel = 
  | "gemini-2.5-flash" 
  | "gemini-2.5-pro" 
  | "gpt-4o" 
  | "gpt-4o-mini"
  | "gpt-4.1-mini";

export interface AISettings {
  id: string;
  user_id: string;
  openai_api_key: string | null;
  google_api_key: string | null;
  default_provider: AIProvider;
  default_model: AIModel;
  monthly_token_limit: number;
  tokens_used_this_month: number;
  last_token_reset: string;
  created_at: string;
  updated_at: string;
}

export interface AIUsageLog {
  id: string;
  user_id: string;
  provider: AIProvider;
  model: string;
  tokens_input: number;
  tokens_output: number;
  total_tokens: number;
  request_type: string;
  created_at: string;
}

const defaultSettings: Omit<AISettings, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'last_token_reset'> = {
  openai_api_key: null,
  google_api_key: null,
  default_provider: "lovable",
  default_model: "gemini-2.5-flash",
  monthly_token_limit: 100000,
  tokens_used_this_month: 0,
};

export const useAISettings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["ai_settings", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("ai_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as AISettings | null;
    },
    enabled: !!user?.id,
  });

  const { data: usageLogs, isLoading: isLoadingUsage } = useQuery({
    queryKey: ["ai_usage_logs", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("ai_usage_log")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as AIUsageLog[];
    },
    enabled: !!user?.id,
  });

  const upsertSettings = useMutation({
    mutationFn: async (newSettings: Partial<AISettings>) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("ai_settings")
        .upsert({
          user_id: user.id,
          ...newSettings,
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai_settings"] });
      toast.success("Configurações de IA salvas com sucesso!");
    },
    onError: (error: any) => {
      console.error("Erro ao salvar configurações:", error);
      toast.error("Erro ao salvar configurações de IA");
    },
  });

  const logUsage = useMutation({
    mutationFn: async (usage: Omit<AIUsageLog, 'id' | 'user_id' | 'created_at'>) => {
      if (!user?.id) return;

      const { error } = await supabase
        .from("ai_usage_log")
        .insert({
          user_id: user.id,
          ...usage,
        });

      if (error) throw error;

      // Atualizar tokens usados
      if (settings) {
        await supabase
          .from("ai_settings")
          .update({
            tokens_used_this_month: (settings.tokens_used_this_month || 0) + usage.total_tokens,
          })
          .eq("user_id", user.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai_settings"] });
      queryClient.invalidateQueries({ queryKey: ["ai_usage_logs"] });
    },
  });

  const getActiveProvider = (): AIProvider => {
    if (!settings) return "lovable";
    
    // Se tem chave OpenAI e provider é openai
    if (settings.default_provider === "openai" && settings.openai_api_key) {
      return "openai";
    }
    
    // Se tem chave Google e provider é google
    if (settings.default_provider === "google" && settings.google_api_key) {
      return "google";
    }
    
    return "lovable";
  };

  const getActiveModel = (): AIModel => {
    return settings?.default_model || "gemini-2.5-flash";
  };

  const hasCustomApiKey = (): boolean => {
    return !!(settings?.openai_api_key || settings?.google_api_key);
  };

  const getUsagePercentage = (): number => {
    if (!settings) return 0;
    return Math.round((settings.tokens_used_this_month / settings.monthly_token_limit) * 100);
  };

  const getUsageByProvider = () => {
    if (!usageLogs) return {};
    
    return usageLogs.reduce((acc, log) => {
      acc[log.provider] = (acc[log.provider] || 0) + log.total_tokens;
      return acc;
    }, {} as Record<string, number>);
  };

  const getUsageByDay = () => {
    if (!usageLogs) return [];
    
    const grouped = usageLogs.reduce((acc, log) => {
      const day = new Date(log.created_at).toLocaleDateString('pt-BR');
      acc[day] = (acc[day] || 0) + log.total_tokens;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped).map(([day, tokens]) => ({ day, tokens })).slice(0, 7).reverse();
  };

  return {
    settings: settings || defaultSettings,
    usageLogs: usageLogs || [],
    isLoading,
    isLoadingUsage,
    upsertSettings: upsertSettings.mutate,
    logUsage: logUsage.mutate,
    getActiveProvider,
    getActiveModel,
    hasCustomApiKey,
    getUsagePercentage,
    getUsageByProvider,
    getUsageByDay,
  };
};
