import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface DashboardPreferences {
  id: string;
  user_id: string;
  layout_config: any[];
  active_layout: string;
  theme_mode: 'light' | 'dark' | 'auto';
  custom_theme?: any;
  enabled_widgets: string[];
  widget_settings: any;
  compact_mode: boolean;
  show_sidebar: boolean;
  show_metrics: boolean;
  active_tabs: string[];
  default_tab: string;
  saved_filters: any[];
  default_filter?: string;
  created_at: string;
  updated_at: string;
}

export interface LayoutTemplate {
  id: string;
  user_id?: string;
  name: string;
  description?: string;
  layout_config: any;
  enabled_widgets: any;
  theme_config?: any;
  is_public: boolean;
  is_system: boolean;
  category?: string;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

// Preferências padrão para retornar quando não houver registro
const defaultPreferences: Omit<DashboardPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
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

export const useDashboardPreferences = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Buscar preferências do usuário
  const { data: preferences, isLoading } = useQuery({
    queryKey: ["dashboard_preferences", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      try {
        // Tentar buscar preferências existentes
        const { data, error } = await (supabase as any)
          .from("dashboard_preferences")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (error) {
          // Se não encontrou, retorna preferências padrão (sem erro)
          if (error.code === 'PGRST116') {
            return {
              id: '',
              user_id: user.id,
              ...defaultPreferences,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            } as DashboardPreferences;
          }
          console.error('Erro ao buscar preferências:', error);
          // Retorna padrão em caso de erro também
          return {
            id: '',
            user_id: user.id,
            ...defaultPreferences,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as DashboardPreferences;
        }

        return data as DashboardPreferences;
      } catch (err) {
        console.error('Erro ao buscar preferências:', err);
        return {
          id: '',
          user_id: user?.id || '',
          ...defaultPreferences,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as DashboardPreferences;
      }
    },
    enabled: !!user,
  });

  // Buscar templates de layout
  const { data: templates = [] } = useQuery({
    queryKey: ["dashboard_templates"],
    queryFn: async () => {
      try {
        const { data, error } = await (supabase as any)
          .from("dashboard_layout_templates")
          .select("*")
          .order("is_system", { ascending: false })
          .order("usage_count", { ascending: false });

        if (error) {
          console.error('Erro ao buscar templates:', error);
          return [];
        }
        return (data || []) as LayoutTemplate[];
      } catch (err) {
        console.error('Erro ao buscar templates:', err);
        return [];
      }
    },
    enabled: !!user,
  });

  // Função auxiliar para criar ou atualizar preferências
  const upsertPreferences = async (updates: Partial<DashboardPreferences>) => {
    if (!user?.id) throw new Error("Usuário não autenticado");

    // Verificar se já existe
    const { data: existing } = await (supabase as any)
      .from("dashboard_preferences")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (existing) {
      // Atualizar
      const { data, error } = await (supabase as any)
        .from("dashboard_preferences")
        .update(updates)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Criar
      const { data, error } = await (supabase as any)
        .from("dashboard_preferences")
        .insert([{
          user_id: user.id,
          ...defaultPreferences,
          ...updates,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  };

  // Atualizar preferências
  const updatePreferences = useMutation({
    mutationFn: async (updates: Partial<DashboardPreferences>) => {
      return upsertPreferences(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard_preferences"] });
      toast.success("Preferências atualizadas!");
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar:', error);
      toast.error("Erro ao atualizar preferências: " + error.message);
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
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["dashboard_preferences"] });
      const mode = data?.theme_mode || 'light';
      const labels: Record<string, string> = { light: 'claro', dark: 'escuro', auto: 'automático' };
      toast.success(`Tema alterado para ${labels[mode] || mode}`);
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

  // Alternar widget
  const toggleWidget = useMutation({
    mutationFn: async (widgetId: string) => {
      const currentWidgets = preferences?.enabled_widgets || defaultPreferences.enabled_widgets;
      const enabled_widgets = currentWidgets.includes(widgetId)
        ? currentWidgets.filter(id => id !== widgetId)
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

  // Aplicar template
  const applyTemplate = useMutation({
    mutationFn: async (templateId: string) => {
      // Buscar template
      const template = templates.find(t => t.id === templateId);
      if (!template) throw new Error("Template não encontrado");

      return upsertPreferences({
        layout_config: template.layout_config,
        enabled_widgets: template.enabled_widgets,
        custom_theme: template.theme_config,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard_preferences"] });
      toast.success("Template aplicado com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao aplicar template: " + error.message);
    },
  });

  // Salvar como template
  const saveAsTemplate = useMutation({
    mutationFn: async ({
      name,
      description,
      isPublic = false,
    }: {
      name: string;
      description?: string;
      isPublic?: boolean;
    }) => {
      if (!user?.id || !preferences) throw new Error("Usuário não autenticado");

      const { data, error } = await (supabase as any)
        .from("dashboard_layout_templates")
        .insert([{
          user_id: user.id,
          name,
          description,
          layout_config: preferences.layout_config || [],
          enabled_widgets: preferences.enabled_widgets || defaultPreferences.enabled_widgets,
          theme_config: preferences.custom_theme,
          is_public: isPublic,
          category: 'custom',
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard_templates"] });
      toast.success("Template salvo com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao salvar template: " + error.message);
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

  // Helper: Verificar se widget está habilitado
  const isWidgetEnabled = (widgetId: string) => {
    return preferences?.enabled_widgets?.includes(widgetId) ?? defaultPreferences.enabled_widgets.includes(widgetId);
  };

  // Helper: Obter configuração de widget
  const getWidgetConfig = (widgetId: string) => {
    return preferences?.widget_settings?.[widgetId] || {};
  };

  // Atualizar configuração de widget específico
  const updateWidgetConfig = useMutation({
    mutationFn: async ({ widgetId, config }: { widgetId: string; config: any }) => {
      const widget_settings = {
        ...preferences?.widget_settings,
        [widgetId]: config,
      };

      return upsertPreferences({ widget_settings });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard_preferences"] });
    },
  });

  return {
    preferences: preferences || {
      id: '',
      user_id: user?.id || '',
      ...defaultPreferences,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    templates,
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
