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

export const useDashboardPreferences = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Buscar preferências do usuário
  const { data: preferences, isLoading } = useQuery({
    queryKey: ["dashboard_preferences", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Usar function do Supabase para obter ou criar preferências
      const { data, error } = await supabase
        .rpc('get_or_create_dashboard_preferences', { user_id_param: user.id });

      if (error) {
        // Fallback: tentar buscar diretamente
        const { data: prefs, error: selectError } = await supabase
          .from("dashboard_preferences")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (selectError && selectError.code !== 'PGRST116') {
          throw selectError;
        }

        return prefs as DashboardPreferences;
      }

      return data as DashboardPreferences;
    },
    enabled: !!user,
  });

  // Buscar templates de layout
  const { data: templates = [] } = useQuery({
    queryKey: ["dashboard_templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dashboard_layout_templates")
        .select("*")
        .order("is_system", { ascending: false })
        .order("usage_count", { ascending: false });

      if (error) throw error;
      return (data || []) as LayoutTemplate[];
    },
    enabled: !!user,
  });

  // Atualizar preferências
  const updatePreferences = useMutation({
    mutationFn: async (updates: Partial<DashboardPreferences>) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await (supabase as any)
        .from("dashboard_preferences")
        .update(updates)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard_preferences"] });
      toast.success("Preferências atualizadas!");
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar preferências: " + error.message);
    },
  });

  // Atualizar layout
  const updateLayout = useMutation({
    mutationFn: async (layout_config: any[]) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await (supabase as any)
        .from("dashboard_preferences")
        .update({ layout_config })
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
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
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await (supabase as any)
        .from("dashboard_preferences")
        .update({ theme_mode })
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["dashboard_preferences"] });
      toast.success(`Tema alterado para ${data.theme_mode}`);
    },
    onError: (error: any) => {
      toast.error("Erro ao alterar tema: " + error.message);
    },
  });

  // Atualizar tema customizado
  const setCustomTheme = useMutation({
    mutationFn: async (custom_theme: any) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await (supabase as any)
        .from("dashboard_preferences")
        .update({ custom_theme })
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
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
      if (!user?.id || !preferences) throw new Error("User not authenticated");

      const currentWidgets = preferences.enabled_widgets || [];
      const enabled_widgets = currentWidgets.includes(widgetId)
        ? currentWidgets.filter(id => id !== widgetId)
        : [...currentWidgets, widgetId];

      const { data, error } = await (supabase as any)
        .from("dashboard_preferences")
        .update({ enabled_widgets })
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
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
      if (!user?.id) throw new Error("User not authenticated");

      // Buscar template
      const { data: template, error: templateError } = await (supabase as any)
        .from("dashboard_layout_templates")
        .select("*")
        .eq("id", templateId)
        .single();

      if (templateError) throw templateError;

      // Aplicar ao usuário
      const { data, error } = await (supabase as any)
        .from("dashboard_preferences")
        .update({
          layout_config: template.layout_config,
          enabled_widgets: template.enabled_widgets,
          custom_theme: template.theme_config,
        })
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
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
      if (!user?.id || !preferences) throw new Error("User not authenticated");

      const { data, error } = await (supabase as any)
        .from("dashboard_layout_templates")
        .insert([{
          user_id: user.id,
          name,
          description,
          layout_config: preferences.layout_config,
          enabled_widgets: preferences.enabled_widgets,
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
      if (!user?.id) throw new Error("User not authenticated");

      // Buscar template padrão
      const defaultTemplate = templates.find(t => t.is_system && t.name === 'Padrão Completo');
      if (!defaultTemplate) throw new Error("Template padrão não encontrado");

      return applyTemplate.mutateAsync(defaultTemplate.id);
    },
    onSuccess: () => {
      toast.success("Dashboard resetado para o padrão!");
    },
  });

  // Helper: Verificar se widget está habilitado
  const isWidgetEnabled = (widgetId: string) => {
    return preferences?.enabled_widgets?.includes(widgetId) ?? false;
  };

  // Helper: Obter configuração de widget
  const getWidgetConfig = (widgetId: string) => {
    return preferences?.widget_settings?.[widgetId] || {};
  };

  // Atualizar configuração de widget específico
  const updateWidgetConfig = useMutation({
    mutationFn: async ({ widgetId, config }: { widgetId: string; config: any }) => {
      if (!user?.id || !preferences) throw new Error("User not authenticated");

      const widget_settings = {
        ...preferences.widget_settings,
        [widgetId]: config,
      };

      const { data, error } = await (supabase as any)
        .from("dashboard_preferences")
        .update({ widget_settings })
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard_preferences"] });
    },
  });

  return {
    preferences,
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
