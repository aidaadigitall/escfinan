import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface SystemSettings {
  system_name: string;
  system_subtitle: string;
  logo_url: string | null;
}

export const useSystemSettings = () => {
  const { user } = useAuth();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["system-settings", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("system_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching system settings:", error);
        throw error;
      }

      return data as SystemSettings | null;
    },
    enabled: !!user,
  });

  return {
    systemName: settings?.system_name || "FinanceControl",
    systemSubtitle: settings?.system_subtitle || "Controle Financeiro Pessoal",
    logoUrl: settings?.logo_url || null,
    isLoading,
  };
};
