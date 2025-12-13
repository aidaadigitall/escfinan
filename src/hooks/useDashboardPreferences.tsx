import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { getEffectiveUserId } from "./useEffectiveUserId";
import { toast } from "sonner";

export interface DashboardPreferences {
  id: string;
  user_id: string;
  dashboard_type: string;
  preferences: {
    layout_config?: any[];
    active_layout?: string;
    theme_mode?: 'light' | 'dark' | 'auto';
    custom_theme?: any;
    enabled_widgets?: string[];
    widget_settings?: any;
    compact_mode?: boolean;
    show_sidebar?: boolean;
    show_metrics?: boolean;
    active_tabs?: string[];
    default_tab?: string;
    saved_filters?: any[];
    default_filter?: string;
  };
  created_at: string;
  updated_at: string;
}

// Preferências padrão
const defaultPreferences: {
  layout_config: any[];
  active_layout: string;
  theme_mode: 'light' | 'dark' | 'auto';
  custom_theme: any;
  enabled_widgets: string[];
  widget_settings: any;
  compact_mode: boolean;
  show_sidebar: boolean;
  show_metrics: boolean;
  active_tabs: string[];
  default_tab: string;
  saved_filters: any[];
  default_filter: string | undefined;
} = {
  layout_config: [],
  active_layout: 'default',
  theme_mode: 'light',
  custom_theme: null,
  enabled_widgets: ['total-leads', 'conversion-rate', 'total-value', 'average-ticket', 'funnel-chart', 'conversion-chart'],
  widget_settings: {},
  compact_mode: false,
  show_sidebar: true,
  show_metrics: true,
  active_tabs: ['pipeline', 'analytics', 'automations', 'capture'],
  default_tab: 'pipeline',
  saved_filters: [],
  default_filter: undefined,
};

export const useDashboardPreferences = (dashboardType: string = 'crm') => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Buscar preferências do usuário
  const { data: rawPreferences, isLoading } = useQuery({
    queryKey: ["dashboard_preferences", user?.id, dashboardType],
    queryFn: async () => {
      if (!user?.id) return null;

      try {
        const { data, error } = await (supabase as any)
          .from("dashboard_preferences")
          .select("*")
          .eq("user_id", user.id)
          .eq("dashboard_type", dashboardType)
          .maybeSingle();

        if (error) {
          console.error('Erro ao buscar preferências:', error);
          return null;
        }

        return data as DashboardPreferences | null;
      } catch (err) {
        console.error('Erro ao buscar preferências:', err);
        return null;
      }
    },
    enabled: !!user,
  });

  // Função para criar ou atualizar preferências
  const upsertPreferences = async (updates: Partial<typeof defaultPreferences>) => {
    const effectiveUserId = await getEffectiveUserId();
    if (!effectiveUserId) throw new Error("Usuário não autenticado");

    const currentPrefs = rawPreferences?.preferences || defaultPreferences;
    const newPreferences = { ...currentPrefs, ...updates };

    // Check if record exists
    const { data: existing } = await (supabase as any)
      .from("dashboard_preferences")
      .select("id")
      .eq("user_id", effectiveUserId)
      .eq("dashboard_type", dashboardType)
      .maybeSingle();

    if (existing) {
      const { data, error } = await (supabase as any)
        .from("dashboard_preferences")
        .update({ preferences: newPreferences })
        .eq("user_id", effectiveUserId)
        .eq("dashboard_type", dashboardType)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      const { data, error } = await (supabase as any)
        .from("dashboard_preferences")
        .insert([{
          user_id: effectiveUserId,
          dashboard_type: dashboardType,
          preferences: newPreferences,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  };

  // Atualizar preferências
  const updatePreferences = useMutation({
    mutationFn: async (updates: Partial<typeof defaultPreferences>) => {
      return upsertPreferences(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard_preferences"] });
      toast.success("Preferências atualizadas!");
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar:', error);
      toast.error("Erro ao alterar widget: " + error.message);
    },
  });

  // Alternar widget
  const toggleWidget = useMutation({
    mutationFn: async (widgetId: string) => {
      const currentWidgets = rawPreferences?.preferences?.enabled_widgets || defaultPreferences.enabled_widgets;
      const enabled_widgets = currentWidgets.includes(widgetId)
        ? currentWidgets.filter((id: string) => id !== widgetId)
        : [...currentWidgets, widgetId];

      return upsertPreferences({ enabled_widgets });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard_preferences"] });
    },
    onError: (error: any) => {
      toast.error("Erro ao alterar widget: " + error.message);
    },
  });

  // Resetar para padrão
  const resetToDefault = useMutation({
    mutationFn: async () => {
      return upsertPreferences(defaultPreferences);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard_preferences"] });
      toast.success("Dashboard resetado para o padrão!");
    },
  });

  // Helper: Obter preferências mescladas
  const preferences = {
    id: rawPreferences?.id || '',
    user_id: rawPreferences?.user_id || user?.id || '',
    dashboard_type: dashboardType,
    ...defaultPreferences,
    ...(rawPreferences?.preferences || {}),
    created_at: rawPreferences?.created_at || new Date().toISOString(),
    updated_at: rawPreferences?.updated_at || new Date().toISOString(),
  };

  // Helper: Verificar se widget está habilitado
  const isWidgetEnabled = (widgetId: string) => {
    const widgets = rawPreferences?.preferences?.enabled_widgets || defaultPreferences.enabled_widgets;
    return widgets.includes(widgetId);
  };

  // Helper: Obter configuração de widget
  const getWidgetConfig = (widgetId: string) => {
    return rawPreferences?.preferences?.widget_settings?.[widgetId] || {};
  };

  // Atualizar configuração de widget específico
  const updateWidgetConfig = useMutation({
    mutationFn: async ({ widgetId, config }: { widgetId: string; config: any }) => {
      const widget_settings = {
        ...(rawPreferences?.preferences?.widget_settings || {}),
        [widgetId]: config,
      };

      return upsertPreferences({ widget_settings });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard_preferences"] });
    },
  });

  // Atualizar layout
  const updateLayout = useMutation({
    mutationFn: async (layout_config: any[]) => {
      return upsertPreferences({ layout_config });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard_preferences"] });
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar layout: " + error.message);
    },
  });

  // Alternar tema
  const setThemeMode = useMutation({
    mutationFn: async (theme_mode: 'light' | 'dark' | 'auto') => {
      return upsertPreferences({ theme_mode });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard_preferences"] });
      toast.success("Tema alterado!");
    },
    onError: (error: any) => {
      toast.error("Erro ao alterar tema: " + error.message);
    },
  });

  // Atualizar tema customizado
  const setCustomTheme = useMutation({
    mutationFn: async (custom_theme: any) => {
      return upsertPreferences({ custom_theme });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard_preferences"] });
      toast.success("Tema customizado aplicado!");
    },
    onError: (error: any) => {
      toast.error("Erro ao aplicar tema: " + error.message);
    },
  });

  // Placeholder for apply template
  const applyTemplate = useMutation({
    mutationFn: async (_templateId: string) => {
      // Templates not implemented in simplified version
      return Promise.resolve();
    },
  });

  // Placeholder for save as template
  const saveAsTemplate = useMutation({
    mutationFn: async (_params: { name: string; description?: string; isPublic?: boolean }) => {
      // Templates not implemented in simplified version
      return Promise.resolve();
    },
  });

  return {
    preferences,
    templates: [] as any[],
    isLoading,
    updatePreferences,
    updateLayout,
    setThemeMode,
    setCustomTheme,
    toggleWidget,
    applyTemplate,
    saveAsTemplate,
    resetToDefault,
    isWidgetEnabled,
    getWidgetConfig,
    updateWidgetConfig,
  };
};
